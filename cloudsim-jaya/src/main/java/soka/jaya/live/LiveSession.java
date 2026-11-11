package soka.jaya.live;

import soka.jaya.Experiment;
import soka.jaya.Infrastructure;
import soka.jaya.Problem;
import soka.jaya.Scenario;
import soka.jaya.Schedule;
import soka.jaya.report.RunRecord;
import soka.jaya.report.Summary;
import soka.jaya.report.WebExport;
import soka.jaya.schedulers.SearchStep;
import soka.jaya.schedulers.SimulatedAnnealing;

import java.nio.file.Path;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.locks.LockSupport;
import java.util.function.Consumer;

/**
 * Menjalankan satu {@link RunRequest} sambil memancarkan {@link LiveEvent} ke tampilan terminal,
 * lalu menyimpan hasilnya lewat {@link CustomStore}.
 *
 * <p>Tempo {@code terlihat} memberi jeda di antara iterasi agar satu pencarian JAYA/SA
 * berlangsung sekitar {@link #VISIBLE_SECONDS_PER_SEARCH} detik. Jeda terjadi di dalam callback
 * {@link Experiment.Progress#step}, sehingga tidak dihitung ke {@code runtime_ms} dan tidak
 * mengubah hasil (angka acak tetap sama).
 */
public final class LiveSession implements Experiment.Progress {
    public static final double VISIBLE_SECONDS_PER_SEARCH = 2.5;
    /** Batch iterasi dikirim paling sering 10 kali per detik. */
    static final long ITERATION_FLUSH_NANOS = 100_000_000L;
    /** Progres validasi CloudSim dikirim paling sering 4 kali per detik. */
    static final long VALIDATION_NANOS = 250_000_000L;
    private static final long MAX_PARK_NANOS = 50_000_000L;

    public enum Status { SELESAI, DIBATALKAN, GAGAL }

    /** @param savedTo folder hasil di {@code results/custom/}, null bila tidak disimpan */
    public record Outcome(Status status, List<RunRecord> records, Path savedTo) {
    }

    private final String id;
    private final RunRequest request;
    private final Path dataDir;
    private final CustomStore store;
    private final Consumer<LiveEvent> sink;
    private final AtomicBoolean cancel = new AtomicBoolean();

    private Estimate estimate;
    private long sessionStartNanos;
    private long runStartNanos;
    private long lastFlushNanos;
    private long lastValidationNanos;
    private boolean validationStarted;
    private int currentIndex;
    private final List<SearchStep> pending = new ArrayList<>();

    /** @param store tempat menyimpan hasil; null berarti tidak disimpan */
    public LiveSession(String id, RunRequest request, Path dataDir, CustomStore store, Consumer<LiveEvent> sink) {
        this.id = id;
        this.request = request;
        this.dataDir = dataDir;
        this.store = store;
        this.sink = sink;
    }

    public String id() {
        return id;
    }

    public RunRequest request() {
        return request;
    }

    /** Aman dipanggil dari thread lain; simulasi berhenti pada iterasi atau langkah CloudSim berikutnya. */
    public void cancel() {
        cancel.set(true);
    }

    @Override
    public boolean cancelled() {
        return cancel.get();
    }

    public Outcome run() {
        sessionStartNanos = System.nanoTime();
        try {
            Scenario scenario = request.scenario();
            long[] lengths = scenario.lengths(dataDir);
            List<Infrastructure.VmSpec> vms = Infrastructure.vms(request.vms());
            Problem problem = Infrastructure.problem(lengths, vms);
            estimate = Estimate.of(request, lengths);

            emit(new LiveEvent.Log("info", "$ " + request.equivalentCommand()));
            emit(new LiveEvent.Started(id, request.equivalentCommand(), request.fields(), scenario.id(), request.dataset(),
                    request.tasks(), request.vms(), request.algorithms().stream().map(Text::algorithmName).toList(),
                    request.runCount(), estimate.totalSeconds(), problem.jobBound(), WebExport.vmSpecs(vms),
                    request.warnings()));
            boolean seeded = request.algorithms().stream().anyMatch(request::stochastic);
            emit(new LiveEvent.Log("info", Text.label(request) + (seeded ? " · tempo " + request.tempo() : "") + " · "
                    + request.runCount() + " run, perkiraan ±" + Text.duration(estimate.totalSeconds())));
            for (String warning : request.warnings()) {
                emit(new LiveEvent.Log("warn", "Peringatan: " + warning));
            }

            Experiment.Outcome outcome = Experiment.run(List.of(scenario), request.algorithmsToRun(), request.runs(),
                    dataDir, this);

            Path saved = store == null ? null : store.save(id, request, outcome, Instant.now());
            double seconds = elapsedSeconds();
            emit(new LiveEvent.Log("ok", "Selesai dalam " + Text.duration(seconds) + "."
                    + (saved == null ? "" : " Hasil disimpan di " + saved)));
            emit(new LiveEvent.Done("selesai", seconds, saved == null ? null : saved.toString(),
                    Summary.of(outcome.records())));
            return new Outcome(Status.SELESAI, outcome.records(), saved);
        } catch (Experiment.Cancelled e) {
            emit(new LiveEvent.Log("warn", "Dibatalkan pada run " + currentIndex + "/" + request.runCount()
                    + ". Hasil yang belum lengkap tidak disimpan."));
            emit(new LiveEvent.Done("dibatalkan", elapsedSeconds(), null, List.of()));
            return new Outcome(Status.DIBATALKAN, List.of(), null);
        } catch (RuntimeException e) {
            String message = e.getMessage() == null ? e.toString() : e.getMessage();
            emit(new LiveEvent.Log("error", "Gagal: " + message));
            emit(new LiveEvent.Failed(message));
            return new Outcome(Status.GAGAL, List.of(), null);
        }
    }

    @Override
    public void runStarted(Experiment.RunInfo run) {
        currentIndex = run.index();
        pending.clear();
        validationStarted = false;
        runStartNanos = System.nanoTime();
        lastFlushNanos = runStartNanos;
        lastValidationNanos = runStartNanos;
        boolean stochastic = isStochastic(run.algorithm());
        emit(new LiveEvent.RunStart(run.index(), run.total(), run.algorithm(), run.seed(), stochastic,
                totalIterations(run.algorithm())));
    }

    @Override
    public void step(Experiment.RunInfo run, SearchStep step) {
        if (request.tempo().equals("terlihat") && step.totalIterations() > 0) {
            waitUntil(runStartNanos + (long) (VISIBLE_SECONDS_PER_SEARCH * 1e9 * step.iteration() / step.totalIterations()));
        }
        pending.add(step);
        long now = System.nanoTime();
        boolean firstOrLast = step.iteration() == 0 || step.iteration() >= step.totalIterations();
        if (firstOrLast || now - lastFlushNanos >= ITERATION_FLUSH_NANOS) {
            flush(run, step.bestLoads().get());
            lastFlushNanos = now;
        }
    }

    @Override
    public void cloudSimClock(Experiment.RunInfo run, double simTime, double expectedMakespan) {
        long now = System.nanoTime();
        if (!validationStarted || now - lastValidationNanos >= VALIDATION_NANOS) {
            validationStarted = true;
            lastValidationNanos = now;
            emit(new LiveEvent.Validation(run.index(), simTime, expectedMakespan));
        }
    }

    @Override
    public void runEnded(Experiment.RunInfo run, RunRecord record, Schedule schedule) {
        double elapsed = elapsedSeconds();
        emit(new LiveEvent.RunEnd(run.index(), run.total(), record, schedule.vmFinish(), elapsed, remaining(run.index(), elapsed)));
        boolean valid = record.finished() == record.tasks() && record.gapPercent() < 1.0;
        String seed = isStochastic(run.algorithm()) ? " seed " + run.seed() : "";
        emit(new LiveEvent.Log(valid ? "ok" : "warn", String.format(Text.ID,
                "%s [%d/%d] %s%s  makespan %s · CloudSim %s (selisih %.2f%%) · %s/%s cloudlet SUCCESS",
                valid ? "✓" : "⚠", run.index(), run.total(), run.algorithm(), seed, Text.seconds(record.makespanEval()),
                Text.seconds(record.makespanCloudSim()), record.gapPercent(), Text.number(record.finished()),
                Text.number(record.tasks()))));
    }

    @Override
    public void runFinished(int done, int total, RunRecord record) {
        // Sudah dilaporkan di runEnded.
    }

    /** Sisa waktu: perkiraan awal untuk run yang tersisa, diskalakan dengan kecepatan nyata sejauh ini. */
    private double remaining(int done, double elapsed) {
        double predictedSoFar = estimate.totalSeconds() - estimate.remainingAfter(done);
        double speed = predictedSoFar > 0 ? Math.max(0.25, Math.min(4, elapsed / predictedSoFar)) : 1;
        return estimate.remainingAfter(done) * speed;
    }

    private void flush(Experiment.RunInfo run, double[] vmFinish) {
        int size = pending.size();
        int[] iteration = new int[size];
        double[] evaluations = new double[size];
        double[] best = new double[size];
        double[] worst = new double[size];
        for (int i = 0; i < size; i++) {
            SearchStep step = pending.get(i);
            iteration[i] = step.iteration();
            evaluations[i] = step.evaluations();
            best[i] = step.best();
            worst[i] = step.worst();
        }
        pending.clear();
        emit(new LiveEvent.Iteration(run.index(), run.algorithm(), run.seed(), iteration, evaluations, best, worst, vmFinish));
    }

    /** Menunggu sampai tenggat (bukan jeda tetap), supaya lama pencarian tidak bergeser karena waktu komputasi. */
    private void waitUntil(long deadlineNanos) {
        long left;
        while ((left = deadlineNanos - System.nanoTime()) > 0 && !cancel.get()) {
            LockSupport.parkNanos(Math.min(left, MAX_PARK_NANOS));
        }
    }

    private int totalIterations(String algorithm) {
        return switch (algorithm) {
            case "JAYA" -> request.iterations();
            case "SA" -> SimulatedAnnealing.temperatureSteps();
            default -> 0;
        };
    }

    private static boolean isStochastic(String algorithm) {
        return algorithm.equals("JAYA") || algorithm.equals("SA");
    }

    private double elapsedSeconds() {
        return (System.nanoTime() - sessionStartNanos) / 1e9;
    }

    private void emit(LiveEvent event) {
        sink.accept(event);
    }
}
