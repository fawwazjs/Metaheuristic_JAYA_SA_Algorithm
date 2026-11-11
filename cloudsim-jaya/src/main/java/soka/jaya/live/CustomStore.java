package soka.jaya.live;

import soka.jaya.Experiment;
import soka.jaya.report.Json;
import soka.jaya.report.RunStore;
import soka.jaya.report.Summary;
import soka.jaya.report.WebExport;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.io.Writer;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Properties;

/**
 * Penyimpanan hasil skenario kustom, terpisah dari 16 skenario resmi (tidak menyentuh
 * {@code results/runs.csv} maupun data website). {@code results/custom/<id>/} berisi:
 * {@code request.properties} (parameter), {@code runs.csv} (satu baris per run),
 * {@code summary.csv} (rata-rata per algoritma), dan {@code web.json} (ringkasan dan jejak
 * pencarian, berformat sama dengan file replay website).
 */
public final class CustomStore {
    private static final DateTimeFormatter ID_TIME = DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss");

    private final Path customDir;

    /** @param resultsDir folder hasil CLI ({@code results}) */
    public CustomStore(Path resultsDir) {
        this.customDir = resultsDir.resolve("custom");
    }

    /** Id baru dari waktu mulai dan bentuk skenario, contoh 20261111-213015-gocj300x20 (ditambah -2 bila sudah dipakai). */
    public String newId(RunRequest request, LocalDateTime now) {
        String base = ID_TIME.format(now) + "-" + request.dataset() + request.tasks() + "x" + request.vms();
        String id = base;
        for (int suffix = 2; Files.exists(customDir.resolve(id)); suffix++) {
            id = base + "-" + suffix;
        }
        return id;
    }

    public Path dir(String id) {
        return customDir.resolve(id);
    }

    /** Menyimpan hasil run yang selesai; {@code runs.csv} resmi tidak disentuh. */
    public Path save(String id, RunRequest request, Experiment.Outcome outcome, Instant createdAt) {
        Path dir = dir(id);
        List<Summary.ScenarioSummary> summaries = Summary.of(outcome.records());
        RunStore.write(dir.resolve("runs.csv"), outcome.records());
        Summary.writeCsv(dir.resolve("summary.csv"), summaries);

        Map<String, Object> web = new LinkedHashMap<>();
        web.put("id", id);
        web.put("createdAt", createdAt.toString());
        web.put("simulator", WebExport.SIMULATOR);
        web.put("label", Text.label(request));
        web.put("command", request.equivalentCommand());
        web.put("request", request.fields());
        web.put("scenario", summaries.get(0));
        web.put("replay", WebExport.replay(outcome.replays().get(0)));
        write(dir.resolve("web.json"), Json.write(web));

        Properties properties = new Properties();
        properties.putAll(request.fields());
        properties.setProperty("id", id);
        properties.setProperty("createdAt", createdAt.toString());
        properties.setProperty("label", Text.label(request));
        try (Writer writer = Files.newBufferedWriter(dir.resolve("request.properties"), StandardCharsets.UTF_8)) {
            properties.store(writer, "Skenario kustom " + request.equivalentCommand());
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
        return dir;
    }

    private static void write(Path file, String content) {
        try {
            Files.createDirectories(file.getParent());
            Files.writeString(file, content);
        } catch (IOException e) {
            throw new UncheckedIOException("Gagal menulis " + file, e);
        }
    }
}
