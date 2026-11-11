package soka.jaya.cli;

import soka.jaya.live.Catalog;
import soka.jaya.live.Estimate;
import soka.jaya.live.LiveSession;
import soka.jaya.live.RunRequest;
import soka.jaya.live.Text;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.PrintStream;
import java.io.UncheckedIOException;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

/**
 * Wizard terminal {@code ./sim interactive}: menu bernomor dengan nilai bawaan dalam kurung siku.
 * Setiap jawaban divalidasi oleh {@link RunRequest#parse}, jadi aturannya sama dengan
 * {@code ./sim custom}.
 */
final class Wizard {
    private final BufferedReader in;
    private final PrintStream out;
    private final Catalog catalog;
    private final Path dataDir;

    /** Dilempar saat pengguna mengetik q atau input habis (Ctrl+D). */
    private static final class Quit extends RuntimeException {
        Quit() {
            super(null, null, false, false);
        }
    }

    Wizard(BufferedReader in, PrintStream out, Catalog catalog, Path dataDir) {
        this.in = in;
        this.out = out;
        this.catalog = catalog;
        this.dataDir = dataDir;
    }

    /** @return permintaan yang sudah dikonfirmasi, atau kosong bila pengguna keluar atau menolak */
    Optional<RunRequest> ask() {
        try {
            return Optional.ofNullable(askAll());
        } catch (Quit quit) {
            out.println("Keluar dari wizard. Tidak ada simulasi yang dijalankan.");
            return Optional.empty();
        }
    }

    private RunRequest askAll() {
        out.println("Simulasi kustom JAYA di CloudSim Plus 8.0.0");
        out.println("Tekan Enter untuk memakai nilai dalam [kurung siku]. Ketik q untuk keluar.");
        out.println();
        RunRequest defaults = RunRequest.defaults();
        Map<String, String> fields = new LinkedHashMap<>(defaults.fields());

        List<Catalog.Option> datasets = catalog.datasets();
        String dataset = datasets.get(choose("Dataset",
                datasets.stream().map(d -> d.id() + "  " + d.name() + ": " + d.description()).toList(),
                datasets.stream().map(Catalog.Option::id).toList(), indexOf(datasets, defaults.dataset()))).id();
        fields.put("dataset", dataset);

        if (dataset.equals("gocj")) {
            List<String> sizes = catalog.gocjSizes().stream().map(String::valueOf).toList();
            fields.put("tasks", sizes.get(choose("Jumlah task (paket) GoCJ", sizes, sizes,
                    Math.max(0, sizes.indexOf(String.valueOf(defaults.tasks()))))));
        } else {
            askValid(fields, "tasks", String.format(Text.ID, "Jumlah job NASA (%d–%,d)", catalog.nasaMin(), catalog.nasaMax()),
                    String.valueOf(defaults.tasks()));
            int tasks = Integer.parseInt(fields.get("tasks"));
            if (tasks > catalog.nasaHeavy()) {
                out.println(String.format(Text.ID, "  NASA %,d job tergolong besar: validasi CloudSim per run bisa memakan beberapa menit.", tasks));
            }
        }

        List<String> vmCounts = catalog.vmCounts().stream().map(String::valueOf).toList();
        fields.put("vms", vmCounts.get(choose("Jumlah VM (kurir)", vmCounts, vmCounts,
                Math.max(0, vmCounts.indexOf(String.valueOf(defaults.vms()))))));

        out.println("Algoritma");
        List<Catalog.Option> algorithms = catalog.algorithms();
        for (int i = 0; i < algorithms.size(); i++) {
            out.printf("  %d) %-11s %s%n", i + 1, algorithms.get(i).name(), algorithms.get(i).description());
        }
        while (true) {
            String answer = read("  Pilih nomor atau nama, pisahkan dengan koma", "semua");
            String algo = algorithmIds(answer, algorithms);
            List<String> errors = errors(fields, "algo", algo);
            if (errors.isEmpty()) {
                fields.put("algo", algo);
                break;
            }
            errors.forEach(error -> out.println("  " + error));
        }
        RunRequest sofar = parse(fields);

        if (sofar.algorithms().stream().anyMatch(sofar::stochastic)) {
            askValid(fields, "runs", "Jumlah seed untuk JAYA dan SA (1–" + catalog.maxRuns() + ")", String.valueOf(defaults.runs()));
        }
        if (sofar.algorithms().contains("jaya")) {
            String question = String.format(Text.ID, "Ubah parameter JAYA (populasi %d, iterasi %,d)?", defaults.population(),
                    defaults.iterations());
            if (yes(question, false)) {
                askValid(fields, "population", "  Populasi JAYA (" + catalog.populationMin() + "–" + catalog.populationMax() + ")",
                        String.valueOf(defaults.population()));
                askValid(fields, "iterations", String.format(Text.ID, "  Iterasi JAYA (%d–%,d)", catalog.iterationsMin(),
                        catalog.iterationsMax()), String.valueOf(defaults.iterations()));
                parse(fields).warnings().stream().filter(w -> w.contains("JAYA")).forEach(w -> out.println("  " + w));
            }
        }
        if (parse(fields).algorithms().stream().anyMatch(sofar::stochastic)) {
            List<Catalog.Option> tempos = catalog.tempos();
            fields.put("tempo", tempos.get(choose("Tempo tampilan",
                    tempos.stream().map(t -> t.id() + "  " + t.description()).toList(),
                    tempos.stream().map(Catalog.Option::id).toList(), indexOf(tempos, defaults.tempo()))).id());
        }

        RunRequest request = parse(fields);
        Estimate estimate = Estimate.of(request, request.scenario().lengths(dataDir));
        out.println();
        out.println("Ringkasan");
        out.println("  Skenario   " + Text.label(request));
        out.println("  Tempo      " + request.tempo() + (request.tempo().equals("terlihat")
                ? String.format(Text.ID, " (setiap pencarian JAYA/SA diperlambat menjadi sekitar %.1f detik)", LiveSession.VISIBLE_SECONDS_PER_SEARCH)
                : " (tanpa jeda)"));
        out.println("  Jumlah run " + request.runCount() + ", perkiraan ±" + Text.duration(estimate.totalSeconds()));
        out.println("  Perintah   " + request.equivalentCommand());
        request.warnings().forEach(warning -> out.println("  Peringatan: " + warning));
        if (!yes("Jalankan sekarang?", true)) {
            out.println("Dibatalkan. Tidak ada simulasi yang dijalankan.");
            return null;
        }
        return request;
    }

    /** Menu bernomor; jawaban boleh berupa nomor atau salah satu {@code values}. */
    private int choose(String title, List<String> labels, List<String> values, int defaultIndex) {
        out.println(title);
        boolean compact = labels.stream().allMatch(label -> label.length() <= 6);
        if (compact) {
            List<String> items = new ArrayList<>();
            for (int i = 0; i < labels.size(); i++) {
                items.add((i + 1) + ") " + labels.get(i));
            }
            out.println("  " + String.join("  ", items));
        } else {
            for (int i = 0; i < labels.size(); i++) {
                out.printf("  %d) %s%n", i + 1, labels.get(i));
            }
        }
        while (true) {
            String answer = read("  Pilihan", String.valueOf(defaultIndex + 1)).toLowerCase(Locale.ROOT);
            int byValue = values.indexOf(answer);
            if (byValue >= 0 && !isMenuNumber(answer, labels.size())) {
                return byValue;
            }
            if (isMenuNumber(answer, labels.size())) {
                return Integer.parseInt(answer) - 1;
            }
            out.println("  Pilihan tidak dikenal: " + answer + ". Ketik nomor 1–" + labels.size() + ".");
        }
    }

    private void askValid(Map<String, String> fields, String key, String question, String defaultValue) {
        while (true) {
            String answer = read(question, defaultValue);
            List<String> errors = errors(fields, key, answer);
            if (errors.isEmpty()) {
                fields.put(key, answer);
                return;
            }
            errors.forEach(error -> out.println("  " + error));
        }
    }

    private boolean yes(String question, boolean defaultYes) {
        while (true) {
            String answer = read(question + (defaultYes ? " (Y/t)" : " (y/T)"), "").toLowerCase(Locale.ROOT);
            if (answer.isEmpty()) {
                return defaultYes;
            }
            if (List.of("y", "ya", "yes").contains(answer)) {
                return true;
            }
            if (List.of("t", "tidak", "n", "no").contains(answer)) {
                return false;
            }
            out.println("  Jawab y (ya) atau t (tidak).");
        }
    }

    private String read(String question, String defaultValue) {
        out.print(question + (defaultValue.isEmpty() ? "" : " [" + defaultValue + "]") + ": ");
        out.flush();
        String line;
        try {
            line = in.readLine();
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
        if (line == null) {
            out.println();
            throw new Quit();
        }
        line = line.trim();
        if (line.equalsIgnoreCase("q") || line.equalsIgnoreCase("keluar")) {
            throw new Quit();
        }
        return line.isEmpty() ? defaultValue : line;
    }

    private List<String> errors(Map<String, String> fields, String key, String value) {
        Map<String, String> candidate = new LinkedHashMap<>(fields);
        candidate.put(key, value);
        return RunRequest.parse(candidate, catalog).errors();
    }

    private RunRequest parse(Map<String, String> fields) {
        return RunRequest.parse(fields, catalog).request();
    }

    /** "1,2" → "jaya,sa"; nama algoritma dibiarkan apa adanya untuk divalidasi RunRequest. */
    private static String algorithmIds(String answer, List<Catalog.Option> algorithms) {
        List<String> ids = new ArrayList<>();
        for (String part : answer.split(",")) {
            String token = part.trim();
            ids.add(isMenuNumber(token, algorithms.size()) ? algorithms.get(Integer.parseInt(token) - 1).id() : token);
        }
        return String.join(",", ids);
    }

    private static boolean isMenuNumber(String answer, int size) {
        try {
            int number = Integer.parseInt(answer);
            return number >= 1 && number <= size;
        } catch (NumberFormatException e) {
            return false;
        }
    }

    private static int indexOf(List<Catalog.Option> options, String id) {
        for (int i = 0; i < options.size(); i++) {
            if (options.get(i).id().equals(id)) {
                return i;
            }
        }
        return 0;
    }
}
