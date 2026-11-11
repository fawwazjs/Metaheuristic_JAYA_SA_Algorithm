package soka.jaya;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import soka.jaya.report.RunRecord;
import soka.jaya.report.Summary;
import soka.jaya.report.WebExport;
import soka.jaya.schedulers.Jaya;
import soka.jaya.schedulers.RoundRobin;
import soka.jaya.schedulers.SearchStep;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ExperimentTest {

    private static final Scenario SMALL = new Scenario("tc2-750x10", "tc2", "gocj", 750, 10);
    private static final List<Experiment.Algorithm> ALGORITHMS = List.of(
            new Experiment.Algorithm(RoundRobin::new, false),
            new Experiment.Algorithm(() -> new Jaya(5, 10), true));

    @Test
    void deterministicAlgorithmsRunOnceAndStochasticOnesOncePerSeed() {
        Experiment.Outcome outcome = Experiment.run(List.of(SMALL), ALGORITHMS, 2, Path.of("data"), Experiment.Progress.NONE);

        List<RunRecord> records = outcome.records();
        assertEquals(3, records.size());
        assertEquals(List.of("Round Robin", "JAYA", "JAYA"), records.stream().map(RunRecord::algorithm).toList());
        assertEquals(List.of(1, 1, 2), records.stream().map(RunRecord::seed).toList());
    }

    @Test
    void everyRunIsValidatedInCloudSim() {
        Experiment.Outcome outcome = Experiment.run(List.of(SMALL), ALGORITHMS, 1, Path.of("data"), Experiment.Progress.NONE);

        for (RunRecord record : outcome.records()) {
            assertEquals(750, record.finished());
            assertTrue(record.gapPercent() < 1.0, record.algorithm() + " selisih " + record.gapPercent() + "%");
        }
    }

    @Test
    void jobBoundIsTheLargestJobOnTheFastestVm() {
        Experiment.Outcome outcome = Experiment.run(List.of(SMALL), ALGORITHMS, 1, Path.of("data"), Experiment.Progress.NONE);

        long longest = java.util.Arrays.stream(Workloads.gocj(Path.of("data"), 750)).max().orElseThrow();
        assertEquals(longest / 1600.0, outcome.records().get(0).jobBound(), 1e-9);
        for (RunRecord record : outcome.records()) {
            assertTrue(record.makespanEval() >= record.jobBound() - 1e-9);
        }
    }

    @Test
    void exportWritesSummaryAndReplayForTheWebsite(@TempDir Path dir) throws IOException {
        Experiment.Outcome outcome = Experiment.run(List.of(SMALL), ALGORITHMS, 2, Path.of("data"), Experiment.Progress.NONE);

        WebExport.writeReplays(dir, outcome.replays());
        WebExport.writeSummary(dir, Summary.of(outcome.records()));

        String summary = Files.readString(dir.resolve("summary.json"));
        String replay = Files.readString(dir.resolve("replay").resolve("tc2-750x10.json"));
        assertTrue(summary.contains("\"id\":\"tc2-750x10\""));
        assertTrue(summary.contains("\"jobBound\":"));
        assertTrue(summary.contains("\"makespan\":{\"mean\":"));
        assertTrue(replay.contains("\"JAYA\""));
        assertTrue(replay.contains("\"frames\""));
        assertTrue(replay.contains("\"Round Robin\""));
    }

    @Test
    void progressSeesEachRunStartItsStepsAndItsEnd() {
        List<String> events = new ArrayList<>();
        List<Double> expectedMakespans = new ArrayList<>();
        Experiment.run(List.of(SMALL), ALGORITHMS, 1, Path.of("data"), new Experiment.Progress() {
            int steps;

            @Override
            public void runStarted(Experiment.RunInfo run) {
                steps = 0;
                events.add("start " + run.algorithm() + " seed " + run.seed() + " " + run.index() + "/" + run.total());
            }

            @Override
            public void step(Experiment.RunInfo run, SearchStep step) {
                steps++;
            }

            @Override
            public void cloudSimClock(Experiment.RunInfo run, double simTime, double expectedMakespan) {
                if (expectedMakespans.size() < run.index()) {
                    expectedMakespans.add(expectedMakespan);
                }
            }

            @Override
            public void runEnded(Experiment.RunInfo run, RunRecord record, Schedule schedule) {
                double slowestVm = Arrays.stream(schedule.vmFinish()).max().orElseThrow();
                assertEquals(record.makespanEval(), slowestVm, 1e-9);
                assertEquals(record.makespanEval(), expectedMakespans.get(run.index() - 1), 1e-9);
                events.add("end " + run.algorithm() + " after " + steps + " steps");
            }

            @Override
            public void runFinished(int done, int total, RunRecord record) {
            }
        });

        assertEquals(List.of(
                "start Round Robin seed 1 1/2", "end Round Robin after 0 steps",
                "start JAYA seed 1 2/2", "end JAYA after 11 steps"), events);
    }

    @Test
    void runtimeExcludesTimeSpentInTheListener() {
        List<Experiment.Algorithm> slowlyWatched = List.of(new Experiment.Algorithm(() -> new Jaya(5, 20), true));

        Experiment.Outcome outcome = Experiment.run(List.of(SMALL), slowlyWatched, 1, Path.of("data"), new Experiment.Progress() {
            @Override
            public void step(Experiment.RunInfo run, SearchStep step) {
                sleep(20); // 21 langkah x 20 ms = 420 ms jeda tontonan
            }

            @Override
            public void runFinished(int done, int total, RunRecord record) {
            }
        });

        long runtimeMs = outcome.records().get(0).runtimeMs();
        assertTrue(runtimeMs < 200, "runtime " + runtimeMs + " ms ikut menghitung jeda listener");
    }

    @Test
    void cancellingDuringTheSearchStopsTheExperiment() {
        AtomicInteger steps = new AtomicInteger();
        AtomicInteger finished = new AtomicInteger();
        List<Experiment.Algorithm> jaya = List.of(new Experiment.Algorithm(() -> new Jaya(5, 200), true));

        assertThrows(Experiment.Cancelled.class, () -> Experiment.run(List.of(SMALL), jaya, 2, Path.of("data"),
                new Experiment.Progress() {
                    @Override
                    public void step(Experiment.RunInfo run, SearchStep step) {
                        steps.incrementAndGet();
                    }

                    @Override
                    public boolean cancelled() {
                        return steps.get() >= 3;
                    }

                    @Override
                    public void runFinished(int done, int total, RunRecord record) {
                        finished.incrementAndGet();
                    }
                }));

        assertEquals(3, steps.get());
        assertEquals(0, finished.get());
    }

    @Test
    void cancellingDuringCloudSimStopsTheExperiment() {
        AtomicInteger ticksAfterCancel = new AtomicInteger();
        AtomicInteger finished = new AtomicInteger();
        List<Experiment.Algorithm> roundRobin = List.of(new Experiment.Algorithm(RoundRobin::new, false));

        assertThrows(Experiment.Cancelled.class, () -> Experiment.run(List.of(SMALL), roundRobin, 1, Path.of("data"),
                new Experiment.Progress() {
                    boolean cancelled;

                    @Override
                    public void cloudSimClock(Experiment.RunInfo run, double simTime, double expectedMakespan) {
                        if (cancelled) {
                            ticksAfterCancel.incrementAndGet();
                        }
                        cancelled = true;
                    }

                    @Override
                    public boolean cancelled() {
                        return cancelled;
                    }

                    @Override
                    public void runFinished(int done, int total, RunRecord record) {
                        finished.incrementAndGet();
                    }
                }));

        assertTrue(ticksAfterCancel.get() < 5, ticksAfterCancel.get() + " langkah CloudSim setelah dibatalkan");
        assertEquals(0, finished.get());
    }

    private static void sleep(long millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
