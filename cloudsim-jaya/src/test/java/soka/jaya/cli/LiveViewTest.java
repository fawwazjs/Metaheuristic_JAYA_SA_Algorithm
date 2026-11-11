package soka.jaya.cli;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import soka.jaya.live.Catalog;
import soka.jaya.live.CustomStore;
import soka.jaya.live.LiveSession;
import soka.jaya.live.RunRequest;

import java.io.ByteArrayOutputStream;
import java.io.PrintStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class LiveViewTest {

    @TempDir
    Path results;

    private String watch(Term term) {
        return watch(term, "jaya,rr");
    }

    private String watch(Term term, String algorithms) {
        RunRequest request = RunRequest.parse(Map.of("dataset", "gocj", "tasks", "100", "vms", "10", "algo", algorithms,
                "runs", "1", "population", "5", "iterations", "30", "tempo", "penuh"), Catalog.scan(Path.of("data"))).request();
        ByteArrayOutputStream bytes = new ByteArrayOutputStream();
        LiveView view = new LiveView(new PrintStream(bytes, true, StandardCharsets.UTF_8), term);
        CustomStore store = new CustomStore(results);
        new LiveSession(store.newId(request, LocalDateTime.now()), request, Path.of("data"), store, view).run();
        view.close();
        return bytes.toString(StandardCharsets.UTF_8);
    }

    @Test
    void plainOutputHasNoEscapeCodes() {
        String text = watch(Term.PLAIN);

        assertFalse(text.contains("\u001b"), text);
        assertTrue(text.contains("✓ [1/2] JAYA seed 1"), text);
        assertTrue(text.contains("✓ [2/2] Round Robin "), text);
    }

    @Test
    void terminalOutputRedrawsALiveBlock() {
        String text = watch(new Term(true, true, true, 100));

        assertTrue(text.contains(Ansi.HIDE_CURSOR), "kursor tidak disembunyikan");
        assertTrue(text.endsWith(Ansi.SHOW_CURSOR), "kursor tidak dipulihkan");
        assertTrue(text.contains("Keseluruhan"), text);
        assertTrue(text.contains("P_best"), text);
        assertTrue(text.contains("DC-Jakarta"), text);
        assertTrue(text.chars().anyMatch(c -> "▁▂▃▄▅▆▇█".indexOf(c) >= 0), "tidak ada sparkline");
        assertTrue(text.contains("✓ [2/2] "), text);
    }

    @Test
    void progressIsCountedInTheUnitOfEachAlgorithm() {
        assertTrue(watch(new Term(true, true, false, 100), "jaya").contains("iterasi "));
        assertTrue(watch(new Term(true, true, false, 100), "sa").contains("langkah suhu "));
    }
}
