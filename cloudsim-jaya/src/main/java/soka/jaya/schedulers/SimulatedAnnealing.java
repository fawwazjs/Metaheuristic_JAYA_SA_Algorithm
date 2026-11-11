package soka.jaya.schedulers;

import soka.jaya.Evaluator;
import soka.jaya.Problem;

import java.util.ArrayList;
import java.util.List;
import java.util.SplittableRandom;

/**
 * Simulated Annealing, port dari {@code SimulatedAnnealing.java} di branch
 * {@code CloudSim-SA} (Satya Raditya). Parameter dan aturan penerimaannya sama;
 * yang berbeda hanya fitness, yang di sini memakai {@link Evaluator} bersama
 * supaya SA dan JAYA dinilai dengan model yang sama.
 *
 * <p>Pada {@link TracePoint}: {@code best} = solusi terbaik sejauh ini,
 * {@code worst} = solusi yang sedang dipegang SA.
 */
public final class SimulatedAnnealing implements Scheduler {
    public static final double INITIAL_TEMPERATURE = 100;
    public static final double MIN_TEMPERATURE = 0.001;
    public static final double COOLING_RATE = 0.95;
    public static final int NEIGHBOURS_PER_TEMPERATURE = 100;

    /** Jumlah langkah suhu dari T0 sampai di bawah Tmin. */
    public static int temperatureSteps() {
        // Mengulang loop pendinginan yang sama persis, supaya pembulatan floating point identik.
        int steps = 0;
        for (double temperature = INITIAL_TEMPERATURE; temperature > MIN_TEMPERATURE; temperature *= COOLING_RATE) {
            steps++;
        }
        return steps;
    }

    @Override
    public String name() {
        return "SA";
    }

    @Override
    public Result schedule(Problem problem, long seed) {
        return schedule(problem, seed, SearchListener.NONE);
    }

    @Override
    public Result schedule(Problem problem, long seed, SearchListener listener) {
        int totalSteps = temperatureSteps();
        SplittableRandom random = new SplittableRandom(seed);
        int n = problem.taskCount();
        int m = problem.vmCount();

        int[] current = new int[n];
        for (int i = 0; i < n; i++) {
            current[i] = random.nextInt(m);
        }
        double currentCost = Evaluator.makespan(problem, current);
        long evaluations = 1;
        int[] best = current.clone();
        double bestCost = currentCost;

        List<TracePoint> trace = new ArrayList<>();
        trace.add(new TracePoint(0, evaluations, bestCost, currentCost, null));
        report(listener, trace, totalSteps, problem, best);

        double temperature = INITIAL_TEMPERATURE;
        int step = 0;
        while (temperature > MIN_TEMPERATURE) {
            for (int k = 0; k < NEIGHBOURS_PER_TEMPERATURE; k++) {
                // Tetangga: pindahkan satu cloudlet acak ke VM acak.
                int[] candidate = current.clone();
                candidate[random.nextInt(n)] = random.nextInt(m);
                double candidateCost = Evaluator.makespan(problem, candidate);
                evaluations++;
                double delta = candidateCost - currentCost;

                // Terima jika lebih baik, atau lebih buruk dengan peluang e^(-delta/T).
                if (delta < 0 || Math.exp(-delta / temperature) > random.nextDouble()) {
                    current = candidate;
                    currentCost = candidateCost;
                    if (currentCost < bestCost) {
                        best = current.clone();
                        bestCost = currentCost;
                    }
                }
            }
            temperature *= COOLING_RATE;
            step++;
            trace.add(new TracePoint(step, evaluations, bestCost, currentCost, null));
            report(listener, trace, totalSteps, problem, best);
        }
        return new Result(best, trace);
    }

    private static void report(SearchListener listener, List<TracePoint> trace, int totalSteps, Problem problem,
                               int[] best) {
        TracePoint point = trace.get(trace.size() - 1);
        listener.onStep(new SearchStep(point.iteration(), totalSteps, point.evaluations(), point.best(), point.worst(),
                () -> Evaluator.evaluate(problem, best).vmFinish()));
    }
}
