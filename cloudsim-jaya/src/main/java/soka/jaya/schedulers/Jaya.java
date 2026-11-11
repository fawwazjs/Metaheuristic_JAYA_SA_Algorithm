package soka.jaya.schedulers;

import soka.jaya.Evaluator;
import soka.jaya.Problem;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.SplittableRandom;

/**
 * Algoritma JAYA (Rao, 2016) untuk memetakan cloudlet ke VM, mengikuti lima
 * langkah di slide: inisiasi populasi, evaluasi fitness, pembaruan kandidat,
 * seleksi, dan iterasi.
 *
 * <p>Satu kandidat = satu rencana pembagian lengkap: {@code x[i]} adalah posisi
 * kontinu untuk cloudlet ke-i, dibulatkan menjadi nomor posisi VM. Fitness =
 * makespan (diminimalkan).
 */
public final class Jaya implements Scheduler {
    public static final int DEFAULT_POPULATION = 30;
    public static final int DEFAULT_ITERATIONS = 750;
    /** Beban VM dari P_best disimpan setiap sekian iterasi untuk replay di website. */
    public static final int LOAD_SAMPLE_EVERY = 5;

    private final int populationSize;
    private final int iterations;
    private final boolean sortVmsByMips;

    public Jaya(int populationSize, int iterations) {
        this(populationSize, iterations, true);
    }

    /**
     * @param sortVmsByMips true: posisi 0..m-1 diurutkan dari VM paling lambat ke
     *                      paling cepat, sehingga "bergerak mendekati P_best" berarti
     *                      bergerak ke VM yang kecepatannya mirip. false: nomor VM asli.
     */
    public Jaya(int populationSize, int iterations, boolean sortVmsByMips) {
        this.populationSize = populationSize;
        this.iterations = iterations;
        this.sortVmsByMips = sortVmsByMips;
    }

    /** Langkah III: X' = X + r1(P_best − |X|) − r2(P_worst − |X|), persis seperti slide. */
    public static double update(double x, double best, double worst, double r1, double r2) {
        return x + r1 * (best - Math.abs(x)) - r2 * (worst - Math.abs(x));
    }

    /** Konversi kontinu → diskret: dibulatkan lalu dibatasi ke [0, m−1]. */
    public static int decode(double x, int vmCount) {
        return (int) Math.min(vmCount - 1, Math.max(0, Math.round(x)));
    }

    @Override
    public String name() {
        return sortVmsByMips ? "JAYA" : "JAYA (VM id asli)";
    }

    @Override
    public Result schedule(Problem problem, long seed) {
        return schedule(problem, seed, SearchListener.NONE);
    }

    @Override
    public Result schedule(Problem problem, long seed, SearchListener listener) {
        // SplittableRandom: tanpa sinkronisasi atomik, jauh lebih cepat untuk jutaan angka acak.
        SplittableRandom rng = new SplittableRandom(seed);
        int n = problem.taskCount();
        int m = problem.vmCount();
        int[] vmAtPosition = vmOrder(problem);
        double upper = m - 1;
        int[] mappingBuffer = new int[n];

        // Langkah I: X0 = Xmin + (Xmax − Xmin) × r
        double[][] population = new double[populationSize][n];
        double[] fitness = new double[populationSize];
        for (int k = 0; k < populationSize; k++) {
            for (int d = 0; d < n; d++) {
                population[k][d] = upper * rng.nextDouble();
            }
            // Langkah II: fitness = makespan
            fitness[k] = Evaluator.makespan(problem, toMapping(population[k], vmAtPosition, mappingBuffer));
        }
        long evaluations = populationSize;

        List<TracePoint> trace = new ArrayList<>(iterations + 1);
        trace.add(tracePoint(0, evaluations, population, fitness, problem, vmAtPosition));
        report(listener, trace, population, fitness, problem, vmAtPosition);

        for (int iteration = 1; iteration <= iterations; iteration++) {
            int bestIndex = argMin(fitness);
            int worstIndex = argMax(fitness);
            double[] best = population[bestIndex].clone();
            double[] worst = population[worstIndex].clone();

            for (int k = 0; k < populationSize; k++) {
                double[] candidate = new double[n];
                for (int d = 0; d < n; d++) {
                    double moved = update(population[k][d], best[d], worst[d], rng.nextDouble(), rng.nextDouble());
                    candidate[d] = Math.min(upper, Math.max(0, moved));
                }
                double candidateFitness = Evaluator.makespan(problem, toMapping(candidate, vmAtPosition, mappingBuffer));
                evaluations++;
                // Langkah IV: seleksi greedy, kandidat baru hanya diterima jika lebih baik.
                if (candidateFitness < fitness[k]) {
                    population[k] = candidate;
                    fitness[k] = candidateFitness;
                }
            }
            // Langkah V: ulangi dengan P_best dan P_worst yang baru.
            trace.add(tracePoint(iteration, evaluations, population, fitness, problem, vmAtPosition));
            report(listener, trace, population, fitness, problem, vmAtPosition);
        }

        int[] mapping = toMapping(population[argMin(fitness)], vmAtPosition, new int[n]);
        return new Result(mapping, trace);
    }

    private TracePoint tracePoint(int iteration, long evaluations, double[][] population, double[] fitness,
                                  Problem problem, int[] vmAtPosition) {
        int bestIndex = argMin(fitness);
        double[] vmFinish = null;
        if (iteration % LOAD_SAMPLE_EVERY == 0 || iteration == iterations) {
            int[] mapping = toMapping(population[bestIndex], vmAtPosition, new int[population[bestIndex].length]);
            vmFinish = Evaluator.evaluate(problem, mapping).vmFinish();
        }
        return new TracePoint(iteration, evaluations, fitness[bestIndex], fitness[argMax(fitness)], vmFinish);
    }

    /** Mengirim titik trace terakhir ke listener; beban VM P_best dihitung hanya bila diminta. */
    private void report(SearchListener listener, List<TracePoint> trace, double[][] population, double[] fitness,
                        Problem problem, int[] vmAtPosition) {
        TracePoint point = trace.get(trace.size() - 1);
        double[] bestPlan = population[argMin(fitness)];
        listener.onStep(new SearchStep(point.iteration(), iterations, point.evaluations(), point.best(), point.worst(),
                () -> point.vmFinish() != null ? point.vmFinish().clone()
                        : Evaluator.evaluate(problem, toMapping(bestPlan, vmAtPosition, new int[bestPlan.length])).vmFinish()));
    }

    private int[] vmOrder(Problem problem) {
        Integer[] order = new Integer[problem.vmCount()];
        for (int vm = 0; vm < order.length; vm++) {
            order[vm] = vm;
        }
        if (sortVmsByMips) {
            Arrays.sort(order, Comparator.<Integer>comparingDouble(vm -> problem.vmMips()[vm])
                    .thenComparingInt(vm -> problem.vmPes()[vm]));
        }
        return Arrays.stream(order).mapToInt(Integer::intValue).toArray();
    }

    private static int[] toMapping(double[] positions, int[] vmAtPosition, int[] out) {
        for (int i = 0; i < positions.length; i++) {
            out[i] = vmAtPosition[decode(positions[i], vmAtPosition.length)];
        }
        return out;
    }

    private static int argMin(double[] values) {
        int index = 0;
        for (int i = 1; i < values.length; i++) {
            if (values[i] < values[index]) {
                index = i;
            }
        }
        return index;
    }

    private static int argMax(double[] values) {
        int index = 0;
        for (int i = 1; i < values.length; i++) {
            if (values[i] > values[index]) {
                index = i;
            }
        }
        return index;
    }
}
