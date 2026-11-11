package soka.jaya.cli;

import soka.jaya.live.LiveEvent;
import soka.jaya.live.Text;

import java.io.PrintStream;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Consumer;

/**
 * Tampilan live di terminal, pelanggan {@link LiveEvent}.
 *
 * <p>Mode ANSI: baris log dicetak permanen, dan di bawahnya ada blok yang digambar ulang paling
 * sering 10 kali per detik (progres keseluruhan dan run, sparkline makespan P_best, serta beban
 * setiap VM per datacenter). Mode teks biasa (pipe, {@code --plain}, {@code TERM=dumb}): hanya
 * baris log, tanpa kode escape.
 */
final class LiveView implements Consumer<LiveEvent>, AutoCloseable {
    private static final long REDRAW_NANOS = 100_000_000L;
    private static final int BAR_WIDTH = 20;

    private final PrintStream out;
    private final Term term;

    private int blockLines;
    private boolean cursorHidden;
    private long lastDrawNanos;

    private int totalRuns;
    private int doneRuns;
    private double remainingSeconds = Double.NaN;
    private long remainingAtNanos;
    private final Map<String, List<Integer>> vmsPerDatacenter = new LinkedHashMap<>();

    private LiveEvent.RunStart run;
    private final List<Double> bestHistory = new ArrayList<>();
    private int iteration;
    private double worst = Double.NaN;
    private double[] vmFinish;
    private LiveEvent.Validation validation;

    LiveView(PrintStream out, Term term) {
        this.out = out;
        this.term = term;
    }

    @Override
    public void accept(LiveEvent event) {
        List<String> logLines = new ArrayList<>();
        boolean force = false;
        if (event instanceof LiveEvent.Log log) {
            logLines.add(logLine(log));
            force = true;
        } else if (event instanceof LiveEvent.Started started) {
            totalRuns = started.totalRuns();
            remainingSeconds = started.estimateSeconds();
            remainingAtNanos = System.nanoTime();
            vmsPerDatacenter.clear();
            for (Map<String, Object> vm : started.vms()) {
                vmsPerDatacenter.computeIfAbsent((String) vm.get("datacenter"), dc -> new ArrayList<>())
                        .add((Integer) vm.get("index"));
            }
        } else if (event instanceof LiveEvent.RunStart start) {
            run = start;
            bestHistory.clear();
            iteration = 0;
            worst = Double.NaN;
            vmFinish = null;
            validation = null;
            force = true;
        } else if (event instanceof LiveEvent.Iteration batch) {
            for (double best : batch.best()) {
                bestHistory.add(best);
            }
            iteration = batch.iteration()[batch.iteration().length - 1];
            worst = batch.worst()[batch.worst().length - 1];
            vmFinish = batch.vmFinish();
        } else if (event instanceof LiveEvent.Validation progress) {
            validation = progress;
        } else if (event instanceof LiveEvent.RunEnd end) {
            doneRuns = end.index();
            remainingSeconds = end.remainingSeconds();
            remainingAtNanos = System.nanoTime();
            vmFinish = end.vmFinish();
            force = true;
        } else {
            // Done atau Failed: event terakhir.
            finish(logLines);
            return;
        }
        if (!term.ansi()) {
            logLines.forEach(out::println);
            return;
        }
        long now = System.nanoTime();
        if (force || now - lastDrawNanos >= REDRAW_NANOS) {
            draw(logLines);
            lastDrawNanos = now;
        }
    }

    /** Menghapus blok live dan memulihkan kursor; aman dipanggil berkali-kali, termasuk dari shutdown hook. */
    @Override
    public synchronized void close() {
        if (cursorHidden) {
            out.print(Ansi.SHOW_CURSOR);
            out.flush();
            cursorHidden = false;
        }
    }

    private synchronized void finish(List<String> logLines) {
        if (term.ansi() && blockLines > 0) {
            out.print(Ansi.up(blockLines) + Ansi.CLEAR_DOWN);
            blockLines = 0;
        }
        logLines.forEach(out::println);
        out.flush();
    }

    private synchronized void draw(List<String> logLines) {
        StringBuilder screen = new StringBuilder();
        if (!cursorHidden) {
            screen.append(Ansi.HIDE_CURSOR);
            cursorHidden = true;
        }
        if (blockLines > 0) {
            screen.append(Ansi.up(blockLines)).append(Ansi.CLEAR_DOWN);
        }
        // Baris log tidak dipotong: dicetak di atas blok dan tidak ikut digambar ulang, jadi boleh terlipat.
        for (String line : logLines) {
            screen.append(line).append('\n');
        }
        List<String> block = block();
        for (String line : block) {
            screen.append(Ansi.fit(line, term.columns())).append('\n');
        }
        blockLines = block.size();
        out.print(screen);
        out.flush();
    }

    private List<String> block() {
        List<String> lines = new ArrayList<>();
        double eta = Double.isNaN(remainingSeconds) ? Double.NaN
                : Math.max(0, remainingSeconds - (System.nanoTime() - remainingAtNanos) / 1e9);
        lines.add(String.format("Keseluruhan  [%s]  %d/%d run%s", Ansi.bar(totalRuns == 0 ? 0 : (double) doneRuns / totalRuns, BAR_WIDTH),
                doneRuns, totalRuns, Double.isNaN(eta) || doneRuns == totalRuns ? "" : " · sisa ~" + Text.duration(eta)));
        if (run == null) {
            return lines;
        }

        String name = algorithmName(run.algorithm()) + (run.stochastic() ? " seed " + run.seed() : "");
        String runLabel = String.format("Run %d/%d", run.index(), run.total());
        if (validation != null) {
            double fraction = validation.expectedMakespan() > 0 ? validation.simTime() / validation.expectedMakespan() : 0;
            lines.add(withBar(String.format("%-12s %s · validasi CloudSim %s/%s s", runLabel, name,
                    Text.number(Math.round(validation.simTime())), Text.number(Math.round(validation.expectedMakespan()))),
                    fraction));
        } else if (run.totalIterations() > 0) {
            // Satu langkah SA = satu suhu (100 tetangga); satu iterasi JAYA = seluruh populasi diperbarui.
            String unit = run.algorithm().equals("SA") ? "langkah suhu" : "iterasi";
            lines.add(withBar(String.format("%-12s %s · %s %d/%d", runLabel, name, unit, iteration, run.totalIterations()),
                    (double) iteration / run.totalIterations()));
        } else {
            lines.add(String.format("%-12s %s · menyusun jadwal", runLabel, name));
        }

        if (!bestHistory.isEmpty()) {
            double[] history = bestHistory.stream().mapToDouble(Double::doubleValue).toArray();
            int sparkWidth = Math.max(10, Math.min(40, term.columns() - 70));
            String bestLabel = run.algorithm().equals("SA") ? "terbaik" : "P_best";
            String worstLabel = run.algorithm().equals("SA") ? "dipegang" : "P_worst";
            lines.add(String.format("Makespan     %s %s %s (awal %s) · %s %s", bestLabel,
                    Ansi.color(Text.seconds(history[history.length - 1]), Ansi.BOLD, term.color()),
                    Ansi.sparkline(history, sparkWidth), Text.seconds(history[0]), worstLabel, Text.seconds(worst)));
        }

        if (vmFinish != null) {
            double makespan = 0;
            for (double finish : vmFinish) {
                makespan = Math.max(makespan, finish);
            }
            lines.add("Beban VM     makin tinggi balok = makin lama VM bekerja; makespan " + Text.seconds(makespan));
            for (Map.Entry<String, List<Integer>> dc : vmsPerDatacenter.entrySet()) {
                double[] loads = dc.getValue().stream().filter(vm -> vm < vmFinish.length)
                        .mapToDouble(vm -> vmFinish[vm]).toArray();
                double slowest = 0;
                for (double load : loads) {
                    slowest = Math.max(slowest, load);
                }
                lines.add(String.format("  %-11s %s  paling akhir %s", dc.getKey(), Ansi.columns(loads, makespan),
                        Text.seconds(slowest)));
            }
        }
        return lines;
    }

    /** Bar progres di ujung baris, dipersempit (minimal 5 karakter) agar baris muat di terminal. */
    private String withBar(String prefix, double fraction) {
        int room = term.columns() - 1 - Ansi.visibleLength(prefix) - 4;
        return prefix + "  [" + Ansi.bar(fraction, Math.max(5, Math.min(BAR_WIDTH, room))) + "]";
    }

    private String logLine(LiveEvent.Log log) {
        if (!term.color()) {
            return log.text();
        }
        return switch (log.level()) {
            case "ok" -> Ansi.color(log.text(), Ansi.GREEN, true);
            case "warn" -> Ansi.color(log.text(), Ansi.YELLOW, true);
            case "error" -> Ansi.color(log.text(), Ansi.RED, true);
            default -> log.text();
        };
    }

    private String algorithmName(String name) {
        String code = switch (name) {
            case "JAYA" -> Ansi.GREEN;
            case "SA" -> Ansi.YELLOW;
            case "Sufferage" -> Ansi.BLUE;
            default -> Ansi.MAGENTA;
        };
        return Ansi.color(name, Ansi.BOLD + code, term.color());
    }
}
