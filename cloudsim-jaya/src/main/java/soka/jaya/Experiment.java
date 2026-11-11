package soka.jaya;

import soka.jaya.report.RunRecord;
import soka.jaya.schedulers.Scheduler;
import soka.jaya.schedulers.SearchStep;
import soka.jaya.schedulers.TracePoint;

import java.nio.file.Path;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Supplier;

/**
 * Menjalankan skenario × algoritma × seed. Setiap pemetaan dinilai dengan
 * {@link Evaluator}, lalu dijalankan di CloudSim Plus untuk validasi.
 */
public final class Experiment {
    private Experiment() {
    }

    /** @param stochastic true: dijalankan sekali per seed; false: cukup sekali (seed 1). */
    public record Algorithm(Supplier<Scheduler> factory, boolean stochastic) {
    }

    /** Hasil lengkap run seed 1, bahan replay di website. */
    public record AlgorithmRun(String algorithm, Scheduler.Result result, Schedule schedule,
                               CloudSimRunner.Result cloudsim) {
    }

    /** Bahan replay satu skenario: run seed 1 tiap algoritma dan riwayat semua seed. */
    public record ScenarioReplay(Scenario scenario, List<Infrastructure.VmSpec> vms, List<AlgorithmRun> firstSeedRuns,
                                 Map<String, List<List<TracePoint>>> tracesPerAlgorithm) {
    }

    public record Outcome(List<RunRecord> records, List<ScenarioReplay> replays) {
    }

    /** Identitas satu run: urutan ke-{@code index} dari {@code total} run dalam eksperimen. */
    public record RunInfo(int index, int total, Scenario scenario, String algorithm, int seed) {
    }

    /** Dilempar bila {@link Progress#cancelled()} bernilai true; hasil yang belum lengkap dibuang. */
    public static final class Cancelled extends RuntimeException {
        public Cancelled() {
            super("Simulasi dibatalkan");
        }
    }

    /**
     * Pendengar progres eksperimen. Hanya {@link #runFinished} yang wajib, sehingga lambda
     * lama tetap berlaku; method lain untuk tampilan live (terminal dan website).
     */
    public interface Progress {
        Progress NONE = (done, total, record) -> {
        };

        void runFinished(int done, int total, RunRecord record);

        default void runStarted(RunInfo run) {
        }

        /** Setiap iterasi JAYA atau langkah suhu SA. Waktu di sini tidak dihitung ke runtime. */
        default void step(RunInfo run, SearchStep step) {
        }

        /** Setiap jam simulasi CloudSim maju; {@code expectedMakespan} dari evaluator. */
        default void cloudSimClock(RunInfo run, double simTime, double expectedMakespan) {
        }

        /** Run selesai dan tervalidasi; dipanggil tepat sebelum {@link #runFinished}. */
        default void runEnded(RunInfo run, RunRecord record, Schedule schedule) {
        }

        default boolean cancelled() {
            return false;
        }
    }

    /** Jumlah run per skenario: algoritma stokastik sekali per seed, deterministik sekali. */
    public static int runsPerScenario(List<Algorithm> algorithms, int runs) {
        return algorithms.stream().mapToInt(a -> a.stochastic() ? runs : 1).sum();
    }

    public static Outcome run(List<Scenario> scenarios, List<Algorithm> algorithms, int runs, Path dataDir,
                              Progress progress) {
        int total = scenarios.size() * runsPerScenario(algorithms, runs);
        int done = 0;
        List<RunRecord> records = new ArrayList<>(total);
        List<ScenarioReplay> replays = new ArrayList<>(scenarios.size());

        for (Scenario scenario : scenarios) {
            long[] lengths = scenario.lengths(dataDir);
            List<Infrastructure.VmSpec> vms = Infrastructure.vms(scenario.vms());
            Problem problem = Infrastructure.problem(lengths, vms);
            double jobBound = problem.jobBound();
            List<AlgorithmRun> firstSeedRuns = new ArrayList<>();
            Map<String, List<List<TracePoint>>> traces = new LinkedHashMap<>();

            for (Algorithm algorithm : algorithms) {
                int seeds = algorithm.stochastic() ? runs : 1;
                for (int seed = 1; seed <= seeds; seed++) {
                    Scheduler scheduler = algorithm.factory().get();
                    RunInfo info = new RunInfo(done + 1, total, scenario, scheduler.name(), seed);
                    checkCancelled(progress);
                    progress.runStarted(info);

                    // Waktu di dalam listener (tampilan live, jeda tempo) tidak dihitung ke runtime.
                    long[] listenerNanos = {0};
                    long startNanos = System.nanoTime();
                    Scheduler.Result result = scheduler.schedule(problem, seed, step -> {
                        long enteredNanos = System.nanoTime();
                        checkCancelled(progress);
                        progress.step(info, step);
                        listenerNanos[0] += System.nanoTime() - enteredNanos;
                    });
                    long runtimeMs = (System.nanoTime() - startNanos - listenerNanos[0]) / 1_000_000;

                    Schedule schedule = Evaluator.evaluate(problem, result.mapping());
                    Metrics metrics = Metrics.of(problem, schedule);
                    double expected = schedule.makespan();
                    CloudSimRunner.Result cloudsim = CloudSimRunner.run(lengths, vms, result.mapping(), time -> {
                        progress.cloudSimClock(info, time, expected);
                        return !progress.cancelled();
                    });
                    checkCancelled(progress);
                    double gapPercent = 100 * Math.abs(cloudsim.makespan() - schedule.makespan()) / schedule.makespan();

                    RunRecord record = new RunRecord(scenario.id(), scenario.group(), scenario.dataset(),
                            scenario.tasks(), scenario.vms(), jobBound, scheduler.name(), seed, schedule.makespan(),
                            cloudsim.makespan(), gapPercent, metrics.aru(), metrics.throughput(), metrics.doi(),
                            metrics.avgResponse(), metrics.avgWaiting(), metrics.energy(), runtimeMs,
                            lastImprovement(result.trace()), cloudsim.finishedCloudlets());
                    records.add(record);
                    progress.runEnded(info, record, schedule);
                    progress.runFinished(++done, total, record);

                    if (seed == 1) {
                        firstSeedRuns.add(new AlgorithmRun(scheduler.name(), result, schedule, cloudsim));
                    }
                    if (!result.trace().isEmpty()) {
                        traces.computeIfAbsent(scheduler.name(), name -> new ArrayList<>()).add(result.trace());
                    }
                }
            }
            replays.add(new ScenarioReplay(scenario, vms, firstSeedRuns, traces));
        }
        return new Outcome(records, replays);
    }

    private static void checkCancelled(Progress progress) {
        if (progress.cancelled()) {
            throw new Cancelled();
        }
    }

    /** Iterasi terakhir saat solusi terbaik membaik; 0 jika tidak pernah membaik atau heuristik. */
    static int lastImprovement(List<TracePoint> trace) {
        int last = 0;
        for (int i = 1; i < trace.size(); i++) {
            if (trace.get(i).best() < trace.get(i - 1).best()) {
                last = trace.get(i).iteration();
            }
        }
        return last;
    }
}
