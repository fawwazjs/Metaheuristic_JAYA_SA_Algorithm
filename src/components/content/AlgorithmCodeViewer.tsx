import { useState, useMemo } from 'react'
import { ParchmentCard } from '../ui/ParchmentCard'
import { IconAnvil, IconCrown, IconScroll, IconCheck, FleurDeLis } from '../ornaments/Ornaments'
import { Reveal } from '../ui/Reveal'

interface HighlightItem {
  lineRange: string
  title: string
  detail: string
}

interface CodeFile {
  id: string
  name: string
  path: string
  category: 'core' | 'support'
  tag: string
  badgeTone: 'forest' | 'ember' | 'gold' | 'steel'
  description: string
  relatedFileIds: string[]
  highlights: HighlightItem[]
  code: string
}

const FILES: CodeFile[] = [
  {
    id: 'jaya',
    name: 'Jaya.java',
    path: 'cloudsim-jaya/src/main/java/soka/jaya/schedulers/Jaya.java',
    category: 'core',
    tag: 'Metaheuristik Populasi',
    badgeTone: 'forest',
    description:
      'Implementasi lengkap algoritma JAYA (Rao, 2016) untuk cloudlet scheduling. Menggunakan vektor kontinu [0, m-1], pengurutan VM berbasis kapasitas MIPS, pembaruan posisi P_best & P_worst, dan seleksi greedy.',
    relatedFileIds: ['evaluator', 'problem', 'scheduler', 'infrastructure'],
    highlights: [
      {
        lineRange: 'Baris 46–49',
        title: 'Rumus Pembaruan Posisi (Langkah III)',
        detail:
          'x + r1 * (best - Math.abs(x)) - r2 * (worst - Math.abs(x)). Meniru solusi terbaik dan menjauhi terburuk secara bersamaan.',
      },
      {
        lineRange: 'Baris 51–54',
        title: 'Decoding Kontinu → Diskret',
        detail:
          'decode(): Dibulatkan (Math.round) lalu di-clamp ke [0, m-1] untuk mendapatkan indeks VM.',
      },
      {
        lineRange: 'Baris 76–86',
        title: 'Inisialisasi & Evaluasi Awal (Langkah I & II)',
        detail:
          '30 kandidat dibangkitkan acak uniform. Fitness setiap kandidat dihitung dari makespan jadwal.',
      },
      {
        lineRange: 'Baris 92–115',
        title: 'Iterasi & Seleksi Greedy (Langkah IV & V)',
        detail:
          'Loop 750 iterasi. Kandidat baru hanya diterima jika makespan-nya lebih kecil daripada solusi saat ini.',
      },
      {
        lineRange: 'Baris 142–152',
        title: 'vmOrder (Pengurutan MIPS)',
        detail:
          'Posisi 0..m-1 diurutkan dari VM terlambat ke tercepat agar pergeseran koordinat linier dengan kapasitas komputasi.',
      },
    ],
    code: `package soka.jaya.schedulers;

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
}`,
  },
  {
    id: 'sa',
    name: 'SimulatedAnnealing.java',
    path: 'cloudsim-jaya/src/main/java/soka/jaya/schedulers/SimulatedAnnealing.java',
    category: 'core',
    tag: 'Metaheuristik Solusi Tunggal',
    badgeTone: 'ember',
    description:
      'Implementasi lengkap Simulated Annealing untuk penjadwalan cloudlet. Bekerja langsung pada representasi diskret dengan 225 langkah suhu, 100 tetangga per level, dan penerimaan Metropolis.',
    relatedFileIds: ['evaluator', 'problem', 'scheduler'],
    highlights: [
      {
        lineRange: 'Baris 20–33',
        title: 'Cooling Schedule & temperatureSteps()',
        detail:
          'T0 = 100, Tmin = 0.001, alpha = 0.95. Menghitung persis 225 langkah penurunan suhu (total 22.501 evaluasi).',
      },
      {
        lineRange: 'Baris 52–59',
        title: 'Inisialisasi Solusi Awal',
        detail:
          'Setiap cloudlet langsung dipetakan ke VM acak secara diskret: current[i] = random.nextInt(m).',
      },
      {
        lineRange: 'Baris 69–74',
        title: 'Pembangkitan Tetangga Acak',
        detail:
          'Memindahkan satu cloudlet acak ke VM acak: candidate[random.nextInt(n)] = random.nextInt(m).',
      },
      {
        lineRange: 'Baris 76–85',
        title: 'Kriteria Penerimaan Metropolis',
        detail:
          'delta = candidateCost - currentCost. Diterima jika delta < 0 atau exp(-delta / T) > rand. Memungkinkan lolos dari lokal minimum.',
      },
    ],
    code: `package soka.jaya.schedulers;

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
}`,
  },
  {
    id: 'evaluator',
    name: 'Evaluator.java',
    path: 'cloudsim-jaya/src/main/java/soka/jaya/Evaluator.java',
    category: 'core',
    tag: 'Engine Fitness Analitis',
    badgeTone: 'gold',
    description:
      'Engine evaluasi analitis FIFO Space-Shared berkecepatan tinggi. Memodelkan antrean multi-core VM persis seperti CloudSim Plus tanpa beban simulasi event-driven.',
    relatedFileIds: ['problem', 'schedule', 'cloudsim', 'jaya', 'sa'],
    highlights: [
      {
        lineRange: 'Baris 15–39',
        title: 'evaluate() - Jadwal Lengkap',
        detail:
          'Menghitung start & finish time per cloudlet, makespan, dan beban sibuk rata-rata per core VM.',
      },
      {
        lineRange: 'Baris 42–53',
        title: 'makespan() - Fungsi Fitness Cepat',
        detail:
          'Versi khusus loop optimasi yang hanya menghitung makespan tanpa alokasi objek tambahan.',
      },
      {
        lineRange: 'Baris 65–73',
        title: 'earliestFreeCore()',
        detail:
          'Mencari core dalam VM yang paling awal menganggur untuk menjamin perilaku FIFO Space-Shared.',
      },
    ],
    code: `package soka.jaya;

/**
 * Menghitung jadwal dari sebuah pemetaan tanpa menjalankan CloudSim.
 *
 * <p>Modelnya sama dengan {@code CloudletSchedulerSpaceShared} di CloudSim Plus:
 * setiap VM punya k core, antrean berjalan FIFO menurut urutan cloudlet, dan
 * setiap cloudlet 1-core masuk ke core yang paling cepat kosong. Hasilnya
 * dicocokkan dengan CloudSim di {@code CloudSimRunnerTest}.
 */
public final class Evaluator {
    private Evaluator() {
    }

    public static Schedule evaluate(Problem problem, int[] mapping) {
        int n = problem.taskCount();
        int m = problem.vmCount();
        double[][] coreFree = newCores(problem);
        double[] start = new double[n];
        double[] finish = new double[n];
        double[] vmFinish = new double[m];
        double[] vmBusy = new double[m];
        double makespan = 0;

        for (int i = 0; i < n; i++) {
            int vm = mapping[i];
            double[] cores = coreFree[vm];
            int core = earliestFreeCore(cores);
            double runtime = problem.lengths()[i] / problem.vmMips()[vm];
            start[i] = cores[core];
            finish[i] = start[i] + runtime;
            cores[core] = finish[i];
            vmFinish[vm] = Math.max(vmFinish[vm], finish[i]);
            // Waktu sibuk rata-rata per core, supaya VM multi-core sebanding dengan VM 1-core.
            vmBusy[vm] += runtime / problem.vmPes()[vm];
            makespan = Math.max(makespan, finish[i]);
        }
        return new Schedule(start, finish, vmFinish, vmBusy, makespan);
    }

    /** Versi ringkas {@link #evaluate} untuk fungsi fitness: hanya makespan. */
    public static double makespan(Problem problem, int[] mapping) {
        double[][] coreFree = newCores(problem);
        double makespan = 0;
        for (int i = 0; i < mapping.length; i++) {
            int vm = mapping[i];
            double[] cores = coreFree[vm];
            int core = earliestFreeCore(cores);
            cores[core] += problem.lengths()[i] / problem.vmMips()[vm];
            makespan = Math.max(makespan, cores[core]);
        }
        return makespan;
    }

    /** Waktu kosong setiap core per VM, semuanya 0 di awal. */
    public static double[][] newCores(Problem problem) {
        double[][] cores = new double[problem.vmCount()][];
        for (int vm = 0; vm < cores.length; vm++) {
            cores[vm] = new double[problem.vmPes()[vm]];
        }
        return cores;
    }

    /** Indeks core yang paling cepat kosong (FIFO space-shared). */
    public static int earliestFreeCore(double[] cores) {
        int best = 0;
        for (int core = 1; core < cores.length; core++) {
            if (cores[core] < cores[best]) {
                best = core;
            }
        }
        return best;
    }
}`,
  },
  {
    id: 'cloudsim',
    name: 'CloudSimRunner.java',
    path: 'cloudsim-jaya/src/main/java/soka/jaya/CloudSimRunner.java',
    category: 'core',
    tag: 'Simulasi CloudSim Plus 8.0.0',
    badgeTone: 'steel',
    description:
      'Membangun topologi datacenter, host, VM heterogen (V1–V5), dan cloudlet di CloudSim Plus 8.0.0 untuk memvalidasi pemetaan jadwal optimal hasil JAYA dan SA.',
    relatedFileIds: ['infrastructure', 'evaluator'],
    highlights: [
      {
        lineRange: 'Baris 48–64',
        title: 'Inisialisasi Datacenter & Broker',
        detail:
          'Membuat DatacenterSimple Jakarta dan Surabaya, serta memetakan VM ke datacenter yang telah ditentukan.',
      },
      {
        lineRange: 'Baris 65–73',
        title: 'Konfigurasi VM Heterogen',
        detail:
          'Membangun VM dengan MIPS, PEs, RAM 512 MB, BW 1024, dan CloudletSchedulerSpaceShared.',
      },
      {
        lineRange: 'Baris 83–89',
        title: 'Submisi Cloudlet Sesuai Mapping',
        detail:
          'Setiap cloudlet i dipasangkan ke target VM mapping[i] hasil komputasi metaheuristik.',
      },
      {
        lineRange: 'Baris 99–113',
        title: 'Eksekusi simulation.start()',
        detail:
          'Simulasi dijalankan, memvalidasi bahwa seluruh cloudlet SUCCESS dan makespan selaras.',
      },
    ],
    code: `package soka.jaya;

import ch.qos.logback.classic.Level;
import org.cloudsimplus.allocationpolicies.VmAllocationPolicySimple;
import org.cloudsimplus.brokers.DatacenterBrokerSimple;
import org.cloudsimplus.cloudlets.Cloudlet;
import org.cloudsimplus.cloudlets.CloudletSimple;
import org.cloudsimplus.core.CloudSimPlus;
import org.cloudsimplus.datacenters.Datacenter;
import org.cloudsimplus.datacenters.DatacenterSimple;
import org.cloudsimplus.hosts.Host;
import org.cloudsimplus.hosts.HostSimple;
import org.cloudsimplus.resources.Pe;
import org.cloudsimplus.resources.PeSimple;
import org.cloudsimplus.schedulers.cloudlet.CloudletSchedulerSpaceShared;
import org.cloudsimplus.schedulers.vm.VmSchedulerSpaceShared;
import org.cloudsimplus.util.Log;
import org.cloudsimplus.vms.Vm;
import org.cloudsimplus.vms.VmSimple;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

/** Menjalankan satu pemetaan cloudlet → VM di CloudSim Plus 8.0.0. */
public final class CloudSimRunner {
    private CloudSimRunner() {
    }

    /** @param vmOfCloudlet VM tempat setiap cloudlet benar-benar dijalankan */
    public record Result(double makespan, int finishedCloudlets, Map<String, Integer> vmsPerDatacenter,
                         int[] vmOfCloudlet) {
    }

    /** Dipanggil setiap jam simulasi maju; mengembalikan false untuk menghentikan simulasi (pembatalan). */
    @FunctionalInterface
    public interface ClockWatcher {
        ClockWatcher NONE = time -> true;

        boolean onClock(double time);
    }

    public static Result run(long[] lengths, List<Infrastructure.VmSpec> vmSpecs, int[] mapping) {
        return run(lengths, vmSpecs, mapping, ClockWatcher.NONE);
    }

    public static Result run(long[] lengths, List<Infrastructure.VmSpec> vmSpecs, int[] mapping, ClockWatcher watcher) {
        Log.setLevel(Level.OFF);
        CloudSimPlus simulation = new CloudSimPlus();

        List<Datacenter> datacenters = new ArrayList<>();
        for (int dc = 0; dc < Infrastructure.DATACENTERS.size(); dc++) {
            DatacenterSimple datacenter = new DatacenterSimple(simulation, hosts(Infrastructure.HOST_PE_MIPS.get(dc)),
                    new VmAllocationPolicySimple());
            datacenter.setName(Infrastructure.DATACENTERS.get(dc));
            datacenter.setSchedulingInterval(Infrastructure.SCHEDULING_INTERVAL);
            datacenters.add(datacenter);
        }

        DatacenterBrokerSimple broker = new DatacenterBrokerSimple(simulation);
        // Setiap VM diarahkan ke datacenter yang ditentukan desain, bukan dipilih broker.
        broker.setDatacenterMapper((lastDatacenter, vm) -> datacenters.get(vmSpecs.get((int) vm.getId()).datacenter()));

        List<Vm> vms = new ArrayList<>(vmSpecs.size());
        for (Infrastructure.VmSpec spec : vmSpecs) {
            Vm vm = new VmSimple(spec.index(), spec.type().mips(), spec.type().pes())
                    .setRam(Infrastructure.VM_RAM_MB)
                    .setBw(Infrastructure.VM_BW)
                    .setSize(Infrastructure.VM_STORAGE_MB)
                    .setCloudletScheduler(new CloudletSchedulerSpaceShared());
            vms.add(vm);
        }

        Map<String, Integer> vmsPerDatacenter = new TreeMap<>();
        broker.addOnVmsCreatedListener(info -> {
            vmsPerDatacenter.clear();
            for (Vm vm : info.getDatacenterBroker().getVmCreatedList()) {
                vmsPerDatacenter.merge(vm.getHost().getDatacenter().getName(), 1, Integer::sum);
            }
        });

        List<Cloudlet> cloudlets = new ArrayList<>(lengths.length);
        for (int i = 0; i < lengths.length; i++) {
            Cloudlet cloudlet = new CloudletSimple(i, lengths[i], 1);
            cloudlet.setVm(vms.get(mapping[i]));
            cloudlets.add(cloudlet);
        }

        broker.submitVmList(vms);
        broker.submitCloudletList(cloudlets);
        if (watcher != ClockWatcher.NONE) {
            simulation.addOnClockTickListener(info -> {
                if (!watcher.onClock(info.getTime())) {
                    simulation.terminate();
                }
            });
        }
        simulation.start();

        int[] vmOfCloudlet = new int[lengths.length];
        int finished = 0;
        double makespan = 0;
        for (Cloudlet cloudlet : broker.getCloudletFinishedList()) {
            int i = (int) cloudlet.getId();
            vmOfCloudlet[i] = (int) cloudlet.getVm().getId();
            if (cloudlet.getStatus() == Cloudlet.Status.SUCCESS) {
                finished++;
            }
            makespan = Math.max(makespan, cloudlet.getFinishTime());
        }
        return new Result(makespan, finished, vmsPerDatacenter, vmOfCloudlet);
    }

    private static List<Host> hosts(double peMips) {
        List<Host> hosts = new ArrayList<>(Infrastructure.HOSTS_PER_DATACENTER);
        for (int h = 0; h < Infrastructure.HOSTS_PER_DATACENTER; h++) {
            List<Pe> pes = new ArrayList<>(Infrastructure.HOST_PES);
            for (int p = 0; p < Infrastructure.HOST_PES; p++) {
                pes.add(new PeSimple(peMips));
            }
            Host host = new HostSimple(Infrastructure.HOST_RAM_MB, Infrastructure.HOST_BW,
                    Infrastructure.HOST_STORAGE_MB, pes);
            host.setVmScheduler(new VmSchedulerSpaceShared());
            hosts.add(host);
        }
        return hosts;
    }
}`,
  },
  {
    id: 'problem',
    name: 'Problem.java',
    path: 'cloudsim-jaya/src/main/java/soka/jaya/Problem.java',
    category: 'support',
    tag: 'Model Masalah Penjadwalan',
    badgeTone: 'gold',
    description:
      'Mendefinisikan masalah penjadwalan: panjang cloudlet (MI), MIPS tiap VM, dan jumlah PE/core tiap VM. Menyediakan fungsi jobBound() untuk batas teoritis makespan.',
    relatedFileIds: ['evaluator', 'infrastructure', 'jaya', 'sa'],
    highlights: [
      {
        lineRange: 'Baris 7–13',
        title: 'Record Problem',
        detail: 'Memvalidasi bahwa array vmMips dan vmPes memiliki ukuran yang sama persis.',
      },
      {
        lineRange: 'Baris 24–34',
        title: 'jobBound()',
        detail:
          'Batas bawah makespan: waktu job terpanjang di VM tercepat. Makespan jadwal tidak mungkin lebih kecil dari nilai ini.',
      },
    ],
    code: `package soka.jaya;

/**
 * Masalah penjadwalan: panjang setiap cloudlet (MI) dan kemampuan setiap VM.
 * Indeks VM di sini adalah indeks VM yang sama di CloudSim.
 */
public record Problem(long[] lengths, double[] vmMips, int[] vmPes) {

    public Problem {
        if (vmMips.length != vmPes.length) {
            throw new IllegalArgumentException("vmMips dan vmPes harus sama panjang");
        }
    }

    public int taskCount() {
        return lengths.length;
    }

    public int vmCount() {
        return vmMips.length;
    }

    /** Makespan tidak bisa lebih kecil dari waktu job terbesar di VM tercepat (cloudlet 1-core). */
    public double jobBound() {
        long longest = 0;
        for (long length : lengths) {
            longest = Math.max(longest, length);
        }
        double fastest = 0;
        for (double mips : vmMips) {
            fastest = Math.max(fastest, mips);
        }
        return longest / fastest;
    }
}`,
  },
  {
    id: 'infrastructure',
    name: 'Infrastructure.java',
    path: 'cloudsim-jaya/src/main/java/soka/jaya/Infrastructure.java',
    category: 'support',
    tag: 'Topologi CloudSim',
    badgeTone: 'gold',
    description:
      'Spesifikasi infrastruktur simulasi Tugas 2A: 2 Datacenter (Jakarta & Surabaya), 20 Host, dan 5 tipe VM (V1 hingga V5) dengan MIPS 500–1600 dan 1–3 core.',
    relatedFileIds: ['problem', 'cloudsim'],
    highlights: [
      {
        lineRange: 'Baris 12–20',
        title: 'Spesifikasi Datacenter & Host',
        detail:
          '10 host per DC, 6 core per host, 2.000 MIPS (Jakarta) dan 2.500 MIPS (Surabaya), RAM 16 GB.',
      },
      {
        lineRange: 'Baris 32–38',
        title: 'Tipe VM Heterogen (V1–V5)',
        detail:
          'V1 (500 MIPS, 1 core) sampai V5 (1600 MIPS, 3 core), RAM 512 MB, storage 10 GB.',
      },
      {
        lineRange: 'Baris 53–62',
        title: 'vms(int count)',
        detail:
          'Penempatan berulang: VM ke-i bertipe (i mod 5) dan di DC (i mod 2) sehingga terbagi seimbang.',
      },
    ],
    code: `package soka.jaya;

import java.util.ArrayList;
import java.util.List;

/**
 * Infrastruktur simulasi: desain Tugas 2A Kelompok 4 (2 datacenter, 20 host,
 * 50 VM) dengan spesifikasi VM dari rentang Tabel 2 Mishra dkk. (2022):
 * 500–1600 MIPS, 1–3 core, RAM 512 MB, storage 10.240 MB, BW 1024.
 */
public final class Infrastructure {
    public static final List<String> DATACENTERS = List.of("DC-Jakarta", "DC-Surabaya");
    public static final int HOSTS_PER_DATACENTER = 10;
    public static final int HOST_PES = 6;
    /** MIPS per core host, berurutan sesuai {@link #DATACENTERS}. */
    public static final List<Double> HOST_PE_MIPS = List.of(2000.0, 2500.0);
    public static final long HOST_RAM_MB = 16_384;
    public static final long HOST_BW = 10_000;
    public static final long HOST_STORAGE_MB = 1_048_576;

    /**
     * Detik simulasi antar-pembaruan eksekusi cloudlet di datacenter. Tanpa interval, CloudSim
     * kadang terlambat puluhan detik mendeteksi cloudlet yang selesai. Nilai yang lebih besar
     * (8,7 dan 874 detik) sudah dicoba dan membuat sebagian besar cloudlet NASA tidak selesai.
     */
    public static final double SCHEDULING_INTERVAL = 1.0;

    public static final long VM_RAM_MB = 512;
    public static final long VM_BW = 1024;
    public static final long VM_STORAGE_MB = 10_240;

    public static final List<VmType> VM_TYPES = List.of(
            new VmType("V1", 500, 1),
            new VmType("V2", 800, 1),
            new VmType("V3", 1000, 2),
            new VmType("V4", 1300, 2),
            new VmType("V5", 1600, 3));

    private Infrastructure() {
    }

    public record VmType(String name, double mips, int pes) {
    }

    /** {@code datacenter} adalah indeks pada {@link #DATACENTERS}. */
    public record VmSpec(int index, VmType type, int datacenter) {
    }

    /**
     * VM ke-i bertipe {@code i mod 5} dan berada di datacenter {@code i mod 2}, sehingga
     * setiap kelipatan 10 VM berisi 2 VM per tipe dan terbagi rata ke kedua datacenter.
     */
    public static List<VmSpec> vms(int count) {
        if (count < 10 || count % 10 != 0) {
            throw new IllegalArgumentException("Jumlah VM harus kelipatan 10 (10–50), bukan " + count);
        }
        List<VmSpec> vms = new ArrayList<>(count);
        for (int i = 0; i < count; i++) {
            vms.add(new VmSpec(i, VM_TYPES.get(i % VM_TYPES.size()), i % DATACENTERS.size()));
        }
        return vms;
    }

    public static Problem problem(long[] lengths, List<VmSpec> vms) {
        double[] mips = new double[vms.size()];
        int[] pes = new int[vms.size()];
        for (VmSpec vm : vms) {
            mips[vm.index()] = vm.type().mips();
            pes[vm.index()] = vm.type().pes();
        }
        return new Problem(lengths, mips, pes);
    }
}`,
  },
  {
    id: 'scheduler',
    name: 'Scheduler.java',
    path: 'cloudsim-jaya/src/main/java/soka/jaya/schedulers/Scheduler.java',
    category: 'support',
    tag: 'Kontrak Interface',
    badgeTone: 'steel',
    description:
      'Interface bersama untuk seluruh algoritma (JAYA, SA, Sufferage, Round Robin) yang menghasilkan record Result berisi alokasi mapping dan trace point pencarian.',
    relatedFileIds: ['problem', 'jaya', 'sa'],
    highlights: [
      {
        lineRange: 'Baris 8–20',
        title: 'Interface Scheduler',
        detail: 'Menyediakan method name(), schedule(Problem, seed), dan schedule dengan SearchListener.',
      },
      {
        lineRange: 'Baris 22–24',
        title: 'record Result',
        detail: 'mapping[i] = indeks VM untuk task ke-i, dan trace = daftar titik konvergensi.',
      },
    ],
    code: `package soka.jaya.schedulers;

import soka.jaya.Problem;

import java.util.List;

/** Algoritma penjadwalan: menentukan VM untuk setiap cloudlet. */
public interface Scheduler {

    String name();

    Result schedule(Problem problem, long seed);

    /**
     * Seperti {@link #schedule(Problem, long)}, sambil melaporkan setiap iterasi ke
     * {@code listener}. Heuristik tidak beriterasi, jadi bawaannya mengabaikan listener.
     */
    default Result schedule(Problem problem, long seed, SearchListener listener) {
        return schedule(problem, seed);
    }

    /** {@code mapping[i]} = indeks VM untuk cloudlet ke-i; {@code trace} kosong untuk heuristik. */
    record Result(int[] mapping, List<TracePoint> trace) {
    }
}`,
  },
  {
    id: 'metrics',
    name: 'Metrics.java',
    path: 'cloudsim-jaya/src/main/java/soka/jaya/Metrics.java',
    category: 'support',
    tag: 'Kalkulasi Metrik',
    badgeTone: 'steel',
    description:
      'Perhitungan metrik performa sesuai paper Mishra dkk. (2022): Makespan, ARU (Average Resource Utilization), Throughput, DOI (Degree of Imbalance), Waktu Respons, dan Energi.',
    relatedFileIds: ['problem', 'schedule'],
    highlights: [
      {
        lineRange: 'Baris 14–19',
        title: 'Record Metrics & Koefisien Energi',
        detail: 'ACTIVE_ENERGY = 0.7 dan IDLE_ENERGY = 0.3 untuk indeks konsumsi energi.',
      },
      {
        lineRange: 'Baris 27–33',
        title: 'Perhitungan ARU & Energi',
        detail: 'RU_j = waktu sibuk VM_j / makespan. Dihitung untuk tiap VM.',
      },
      {
        lineRange: 'Baris 34–43',
        title: 'Degree of Imbalance (DOI)',
        detail: '(T_max - T_min) / T_avg atas waktu penyelesaian seluruh VM.',
      },
    ],
    code: `package soka.jaya;

/**
 * Metrik evaluasi, mengikuti persamaan di Mishra dkk. (2022) dan metrics.py tugas heuristik.
 *
 * @param makespan    waktu selesai cloudlet terakhir, Eq. 17 (detik)
 * @param aru         rata-rata utilisasi VM, Eq. 18–19: RU_j = waktu sibuk_j / makespan (0..1)
 * @param throughput  jumlah cloudlet per detik (n / makespan)
 * @param doi         degree of imbalance: (T_max − T_min) / T_rata-rata atas waktu selesai VM
 * @param avgResponse rata-rata waktu selesai sejak submit (semua submit di t=0)
 * @param avgWaiting  rata-rata waktu tunggu sebelum mulai
 * @param energy      indeks energi Eq. 23–24 dengan γ=0,7 (aktif) dan δ=0,3 (idle), satuan mengikuti paper
 */
public record Metrics(double makespan, double aru, double throughput, double doi,
                      double avgResponse, double avgWaiting, double energy) {

    static final double ACTIVE_ENERGY = 0.7;
    static final double IDLE_ENERGY = 0.3;

    public static Metrics of(Problem problem, Schedule schedule) {
        double makespan = schedule.makespan();
        int m = problem.vmCount();
        int n = problem.taskCount();

        double ruSum = 0;
        double energy = 0;
        for (int vm = 0; vm < m; vm++) {
            double busy = schedule.vmBusy()[vm];
            double ru = busy / makespan;
            ruSum += ru;
            energy += (busy * ACTIVE_ENERGY + (makespan - busy) * IDLE_ENERGY) * ru;
        }

        double maxFinish = Double.NEGATIVE_INFINITY;
        double minFinish = Double.POSITIVE_INFINITY;
        double sumFinish = 0;
        for (double finish : schedule.vmFinish()) {
            maxFinish = Math.max(maxFinish, finish);
            minFinish = Math.min(minFinish, finish);
            sumFinish += finish;
        }
        double avgVmFinish = sumFinish / m;

        double responseSum = 0;
        double waitingSum = 0;
        for (int i = 0; i < n; i++) {
            responseSum += schedule.finish()[i];
            waitingSum += schedule.start()[i];
        }

        return new Metrics(makespan, ruSum / m, n / makespan,
                avgVmFinish == 0 ? 0 : (maxFinish - minFinish) / avgVmFinish,
                responseSum / n, waitingSum / n, energy);
    }
}`,
  },
  {
    id: 'scenarios',
    name: 'Scenarios.java',
    path: 'cloudsim-jaya/src/main/java/soka/jaya/Scenarios.java',
    category: 'support',
    tag: '16 Skenario Resmi',
    badgeTone: 'steel',
    description:
      'Generator 16 skenario uji coba resmi yang meniru Mishra dkk. (2022): TC1 (100–1000 task pada 50 VM), TC2 (750 task pada 10–50 VM), dan skenario dataset riil NASA iPSC.',
    relatedFileIds: ['infrastructure', 'problem'],
    highlights: [
      {
        lineRange: 'Baris 17–21',
        title: 'TC1: Jumlah Task Bervariasi',
        detail: '10 skenario: GoCJ 100, 200, ..., 1000 tasks pada 50 VM tetap.',
      },
      {
        lineRange: 'Baris 22–26',
        title: 'TC2: Jumlah VM Bervariasi',
        detail: '5 skenario: GoCJ 750 tasks pada 10, 20, 30, 40, 50 VM.',
      },
      {
        lineRange: 'Baris 27–29',
        title: 'NASA Dataset',
        detail: '1 skenario: 750 tasks dari log NASA iPSC/860 pada 50 VM.',
      },
    ],
    code: `package soka.jaya;

import java.util.ArrayList;
import java.util.List;

/**
 * Skenario meniru dua test case Mishra dkk. (2022) dalam skala desain tim:
 * TC1 memvariasikan jumlah task (VM tetap), TC2 memvariasikan jumlah VM (task
 * tetap 750 seperti paper), ditambah satu skenario dataset paper (NASA iPSC).
 */
public final class Scenarios {
    private Scenarios() {
    }

    public static List<Scenario> select(String group) {
        List<Scenario> scenarios = new ArrayList<>();
        if (group.equals("all") || group.equals("tc1")) {
            for (int tasks = 100; tasks <= 1000; tasks += 100) {
                scenarios.add(scenario("tc1", "gocj", tasks, 50));
            }
        }
        if (group.equals("all") || group.equals("tc2")) {
            for (int vms = 10; vms <= 50; vms += 10) {
                scenarios.add(scenario("tc2", "gocj", 750, vms));
            }
        }
        if (group.equals("all") || group.equals("nasa")) {
            scenarios.add(scenario("nasa", "nasa", 750, 50));
        }
        if (scenarios.isEmpty()) {
            throw new IllegalArgumentException("Skenario tidak dikenal: " + group + " (pilihan: tc1, tc2, nasa, all)");
        }
        return scenarios;
    }

    private static Scenario scenario(String group, String dataset, int tasks, int vms) {
        return new Scenario(group + "-" + tasks + "x" + vms, group, dataset, tasks, vms);
    }
}`,
  },
  {
    id: 'schedule',
    name: 'Schedule.java',
    path: 'cloudsim-jaya/src/main/java/soka/jaya/Schedule.java',
    category: 'support',
    tag: 'Record Jadwal',
    badgeTone: 'steel',
    description:
      'Record sederhana penyimpan hasil evaluasi jadwal pemetaan: start time tiap cloudlet, finish time, vmFinish per VM, vmBusy per VM, dan makespan akhir.',
    relatedFileIds: ['evaluator', 'metrics'],
    highlights: [
      {
        lineRange: 'Baris 4',
        title: 'Record Schedule',
        detail: 'Menampung double[] start, finish, vmFinish, vmBusy, dan makespan.',
      },
    ],
    code: `package soka.jaya;

/** Hasil evaluasi satu pemetaan: waktu mulai/selesai tiap cloudlet dan ringkasan per VM. */
public record Schedule(double[] start, double[] finish, double[] vmFinish, double[] vmBusy, double makespan) {
}`,
  },
]

export function AlgorithmCodeViewer() {
  const [activeTab, setActiveTab] = useState<string>('jaya')
  const [filterCategory, setFilterCategory] = useState<'all' | 'core' | 'support'>('all')
  const [copied, setCopied] = useState<boolean>(false)

  const filteredFiles = useMemo(() => {
    if (filterCategory === 'all') return FILES
    return FILES.filter((f) => f.category === filterCategory)
  }, [filterCategory])

  const currentFile = useMemo(() => {
    return FILES.find((f) => f.id === activeTab) ?? FILES[0]
  }, [activeTab])

  const relatedFiles = useMemo(() => {
    return currentFile.relatedFileIds
      .map((id) => FILES.find((f) => f.id === id))
      .filter((f): f is CodeFile => Boolean(f))
  }, [currentFile])

  const lines = useMemo(() => {
    return currentFile.code.split('\n')
  }, [currentFile])

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(currentFile.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
    }
  }

  return (
    <div className="space-y-6">
      {/* Filter Kategori Berkas */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-leather-700/20 pb-3">
        <div className="flex items-center gap-1.5 rounded-sm border border-gold/30 bg-parchment-50/80 p-1">
          <button
            type="button"
            onClick={() => setFilterCategory('all')}
            className={`rounded px-2.5 py-1 font-heading text-[11px] font-semibold uppercase tracking-wider transition-colors ${
              filterCategory === 'all'
                ? 'bg-leather-900 text-parchment-100'
                : 'text-leather-700 hover:text-leather-900'
            }`}
          >
            Semua Berkas ({FILES.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterCategory('core')}
            className={`rounded px-2.5 py-1 font-heading text-[11px] font-semibold uppercase tracking-wider transition-colors ${
              filterCategory === 'core'
                ? 'bg-forest text-parchment-50'
                : 'text-leather-700 hover:text-forest'
            }`}
          >
            Algoritma &amp; Engine Inti (4)
          </button>
          <button
            type="button"
            onClick={() => setFilterCategory('support')}
            className={`rounded px-2.5 py-1 font-heading text-[11px] font-semibold uppercase tracking-wider transition-colors ${
              filterCategory === 'support'
                ? 'bg-leather-700 text-parchment-50'
                : 'text-leather-700 hover:text-leather-900'
            }`}
          >
            Struktur Data &amp; Infrastruktur (6)
          </button>
        </div>

        <span className="font-heading text-[11px] uppercase tracking-wider text-leather-600">
          Menampilkan kode sumber Java lengkap (tanpa potongan)
        </span>
      </div>

      {/* Tab Navigasi File */}
      <div className="flex flex-wrap items-center gap-2">
        {filteredFiles.map((file) => {
          const isActive = file.id === activeTab
          const toneClass =
            file.badgeTone === 'forest'
              ? 'text-forest border-forest/40'
              : file.badgeTone === 'ember'
                ? 'text-ember border-ember/40'
                : file.badgeTone === 'gold'
                  ? 'text-gold border-gold/40'
                  : 'text-steel border-steel/40'

          return (
            <button
              key={file.id}
              type="button"
              onClick={() => {
                setActiveTab(file.id)
                setCopied(false)
              }}
              className={`group flex items-center gap-2 rounded-sm border px-3 py-1.5 text-left font-mono text-[12.5px] transition-all ${
                isActive
                  ? 'border-gold bg-leather-900 text-parchment-100 shadow-sm'
                  : 'border-leather-700/20 bg-parchment-50/60 text-leather-700 hover:border-gold/50 hover:bg-parchment-100'
              }`}
            >
              {file.id === 'jaya' ? (
                <IconCrown className="h-3.5 w-3.5 text-forest" />
              ) : file.id === 'sa' ? (
                <IconAnvil className="h-3.5 w-3.5 text-ember" />
              ) : (
                <IconScroll className="h-3.5 w-3.5 text-gold" />
              )}
              <span className="font-semibold">{file.name}</span>
              <span
                className={`hidden rounded border px-1.5 py-0.2 text-[9.5px] uppercase tracking-wider sm:inline-block ${
                  isActive ? 'border-parchment-300/30 text-parchment-300' : toneClass
                }`}
              >
                {file.tag}
              </span>
            </button>
          )
        })}
      </div>

      {/* Detail Berkas & Berkas Terkait */}
      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <ParchmentCard className="p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-leather-700/10 pb-2">
            <div>
              <p className="font-heading text-[10px] font-semibold uppercase tracking-[0.2em] text-leather-500">
                Lokasi Berkas di Repositori
              </p>
              <code className="font-mono text-[13px] font-bold text-leather-900">{currentFile.path}</code>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded border border-gold/30 bg-gold/10 px-2 py-0.5 font-mono text-[11px] font-bold text-leather-800">
                {lines.length} baris kode
              </span>
              <span className="rounded-full border border-leather-700/20 bg-parchment-50 px-2 py-0.5 font-heading text-[10px] uppercase tracking-wider text-leather-700">
                Java 17+
              </span>
            </div>
          </div>

          <p className="mt-3 font-body text-[14.5px] leading-relaxed text-ink/90">{currentFile.description}</p>

          {/* Panel Berkas Terkait / Hubungan dengan Berkas Lain */}
          {relatedFiles.length > 0 && (
            <div className="mt-4 rounded-sm border border-gold/25 bg-gold/5 p-3">
              <p className="font-heading text-[10.5px] font-bold uppercase tracking-wider text-leather-800">
                Berkas Terkait dengan {currentFile.name}:
              </p>
              <p className="mt-0.5 font-body text-[12px] text-leather-600">
                Klik salah satu berkas di bawah untuk langsung berpindah dan mempelajari kodenya:
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {relatedFiles.map((rf) => (
                  <button
                    key={rf.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(rf.id)
                      setCopied(false)
                    }}
                    className="flex items-center gap-1.5 rounded-sm border border-leather-700/25 bg-parchment-100 px-2.5 py-1 font-mono text-[11px] text-leather-800 shadow-2xs transition-colors hover:border-gold hover:bg-parchment-50 hover:text-leather-950"
                  >
                    <IconScroll className="h-3 w-3 text-gold" />
                    <span className="font-semibold">{rf.name}</span>
                    <span className="text-[10px] text-leather-500">({rf.tag})</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </ParchmentCard>

        {/* Poin Kunci Berkas */}
        <div className="space-y-2">
          <p className="font-heading text-[11px] font-semibold uppercase tracking-wider text-leather-600">
            Penjelasan Poin Kunci Baris
          </p>
          {currentFile.highlights.map((h, i) => (
            <Reveal key={h.title} delay={i * 0.04}>
              <div className="rounded-sm border-l-2 border-gold/70 bg-parchment-50/80 p-2.5 text-left shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="font-heading text-[10.5px] font-bold uppercase tracking-wider text-leather-800">
                    {h.title}
                  </span>
                  <span className="font-mono text-[10px] font-semibold text-leather-600">{h.lineRange}</span>
                </div>
                <p className="mt-1 font-body text-[12px] leading-snug text-leather-700/90">{h.detail}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>

      {/* Editor Tampilan Kode (Line-by-line Block Flex Layout - Kebal Bug Geser Samping) */}
      <div className="relative overflow-hidden rounded-md border border-gold/40 bg-leather-900 shadow-xl">
        {/* Header Bar Editor */}
        <div className="flex items-center justify-between border-b border-parchment-300/15 bg-leather-800/95 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-wax-red/70" />
            <span className="h-3 w-3 rounded-full bg-gold/70" />
            <span className="h-3 w-3 rounded-full bg-forest/70" />
            <span className="ml-2 font-mono text-[12.5px] font-medium text-parchment-200">{currentFile.name}</span>
            <span className="font-mono text-[11px] text-parchment-400/60">({lines.length} baris)</span>
          </div>

          <button
            type="button"
            onClick={copyCode}
            className="flex items-center gap-1.5 rounded border border-parchment-300/25 bg-leather-700/60 px-3 py-1 font-mono text-[11.5px] text-parchment-100 transition-colors hover:border-gold hover:bg-leather-700"
          >
            {copied ? (
              <>
                <IconCheck className="h-3.5 w-3.5 text-gold-light" />
                <span className="text-gold-light">Tersalin!</span>
              </>
            ) : (
              <>
                <IconScroll className="h-3.5 w-3.5" />
                <span>Salin Kode Lengkap</span>
              </>
            )}
          </button>
        </div>

        {/* Konten Kode: Tiap baris independen dalam Flex Row Vertikal */}
        <div className="max-h-[620px] overflow-x-auto overflow-y-auto bg-leather-900">
          <div className="min-w-full w-max py-3 font-mono text-[12.5px] leading-relaxed">
            {lines.map((line, idx) => (
              <div
                key={idx}
                className="group flex flex-row items-baseline px-4 py-0.5 hover:bg-leather-800/60 transition-colors"
              >
                <span className="w-12 shrink-0 select-none pr-4 text-right font-mono text-[11px] text-parchment-400/40 group-hover:text-gold-light/70">
                  {idx + 1}
                </span>
                <span className="whitespace-pre font-mono text-parchment-100">
                  {formatJavaLine(line)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Catatan Kesetaraan Evaluasi */}
      <ParchmentCard className="p-4 sm:p-5">
        <div className="flex items-center gap-2">
          <FleurDeLis className="h-4 w-4 text-gold" />
          <h4 className="font-heading text-sm font-bold uppercase tracking-wider text-leather-800">
            Keseimbangan Komparasi Metaheuristik: Budget Evaluasi 1:1
          </h4>
        </div>
        <div className="mt-2 grid gap-3 text-[13px] text-leather-700 sm:grid-cols-2">
          <p>
            <strong className="text-forest">JAYA:</strong> 30 populasi × 750 iterasi + 30 evaluasi inisialisasi ={' '}
            <code className="font-mono font-semibold text-leather-900">22.530 evaluasi makespan</code>.
          </p>
          <p>
            <strong className="text-ember">SA:</strong> 225 langkah suhu (100 hingga 0.001 dgn pendinginan 0.95) × 100 tetangga + 1 evaluasi awal ={' '}
            <code className="font-mono font-semibold text-leather-900">22.501 evaluasi makespan</code>.
          </p>
        </div>
        <p className="mt-2 border-t border-leather-700/10 pt-2 font-body text-[12px] italic text-leather-600">
          Kedua metaheuristik memiliki budget komputasi yang seimbang (~22.500 evaluasi). Seluruh pencarian dijalankan
          menggunakan model antrean analitis <code className="font-mono text-leather-800 font-semibold">Evaluator.java</code> yang 100% konsisten
          dengan <code className="font-mono text-leather-800 font-semibold">CloudSimPlus 8.0.0</code> SpaceShared.
        </p>
      </ParchmentCard>
    </div>
  )
}

/** Pewarnaan sintaksis Java murni berbasis token tanpa merusak tata letak baris */
function formatJavaLine(line: string) {
  if (!line || line.length === 0) {
    return ' '
  }

  const trimmed = line.trimStart()
  // Komentar satu baris atau blok
  if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
    return <span className="italic text-parchment-400/65">{line}</span>
  }

  // Anotasi (@Override, @FunctionalInterface, dll)
  if (trimmed.startsWith('@')) {
    return <span className="font-medium text-gold-light/95">{line}</span>
  }

  // Regex token kata kunci, tipe primitif, dan kelas inti
  const tokenRegex = /(\b(?:package|import|public|private|protected|static|final|class|interface|record|implements|extends|return|new|for|if|else|while|default|throw|try|catch|synchronized)\b|\b(?:double|int|long|boolean|void|float|char|byte|short)\b|\b(?:String|List|ArrayList|Arrays|Comparator|SplittableRandom|Map|TreeMap|Math|Double|Integer|Problem|Schedule|Metrics|Result|SearchListener|SearchStep|TracePoint|CloudSimPlus|Datacenter|DatacenterSimple|DatacenterBrokerSimple|Host|HostSimple|Vm|VmSimple|Pe|PeSimple|Cloudlet|CloudletSimple|Level|Log|Path|Infrastructure|Evaluator|Workloads|Scenarios|Scenario)\b)/g

  const parts = line.split(tokenRegex)
  return (
    <>
      {parts.map((part, i) => {
        if (/^(package|import|public|private|protected|static|final|class|interface|record|implements|extends|return|new|for|if|else|while|default|throw|try|catch|synchronized)$/.test(part)) {
          return (
            <span key={i} className="font-bold text-gold-light">
              {part}
            </span>
          )
        }
        if (/^(double|int|long|boolean|void|float|char|byte|short)$/.test(part)) {
          return (
            <span key={i} className="text-[#84b8d9]">
              {part}
            </span>
          )
        }
        if (/^(String|List|ArrayList|Arrays|Comparator|SplittableRandom|Map|TreeMap|Math|Double|Integer|Problem|Schedule|Metrics|Result|SearchListener|SearchStep|TracePoint|CloudSimPlus|Datacenter|DatacenterSimple|DatacenterBrokerSimple|Host|HostSimple|Vm|VmSimple|Pe|PeSimple|Cloudlet|CloudletSimple|Level|Log|Path|Infrastructure|Evaluator|Workloads|Scenarios|Scenario)$/.test(part)) {
          return (
            <span key={i} className="text-[#a8d5a2]">
              {part}
            </span>
          )
        }
        return part
      })}
    </>
  )
}
