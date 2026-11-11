package soka.jaya.cli;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.io.ByteArrayOutputStream;
import java.io.PrintStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class MainTest {

    private final ByteArrayOutputStream out = new ByteArrayOutputStream();
    private final ByteArrayOutputStream err = new ByteArrayOutputStream();

    private int run(String... args) {
        return Main.run(args, new PrintStream(out, true, StandardCharsets.UTF_8),
                new PrintStream(err, true, StandardCharsets.UTF_8));
    }

    @Test
    void helpListsTheCommands() {
        assertEquals(0, run("help"));
        String text = out.toString(StandardCharsets.UTF_8);
        assertTrue(text.contains("./sim run"));
        assertTrue(text.contains("export-web"));
    }

    @Test
    void infoDescribesTheInfrastructure() {
        assertEquals(0, run("info"));
        String text = out.toString(StandardCharsets.UTF_8);
        assertTrue(text.contains("DC-Jakarta"));
        assertTrue(text.contains("1.600 MIPS"));
        assertTrue(text.contains("tc2-750x10"));
    }

    @Test
    void badArgumentsExitWithCodeTwoAndExplain() {
        assertEquals(2, run("run", "--algo", "pso"));
        assertTrue(err.toString(StandardCharsets.UTF_8).contains("pso"));
    }

    @TempDir
    Path results;

    private String output() {
        return out.toString(StandardCharsets.UTF_8);
    }

    private String errors() {
        return err.toString(StandardCharsets.UTF_8);
    }

    @Test
    void noArgumentsWithoutATerminalStillShowsHelp() {
        assertEquals(0, run());
        assertTrue(output().contains("./sim run"));
        assertTrue(output().contains("./sim custom"));
        assertFalse(output().contains("serve"), "perintah serve sudah dibatalkan");
    }

    @Test
    void interactiveWithoutATerminalPointsToCustom() {
        assertEquals(2, run("interactive"));
        assertTrue(errors().contains("./sim custom"), errors());
    }

    @Test
    void customRunsTheScenarioAndKeepsItApartFromOfficialResults() throws Exception {
        int code = run("custom", "--dataset", "gocj", "--tasks", "100", "--vms", "10", "--algo", "rr,sufferage",
                "--tempo", "penuh", "--out", results.toString(), "--web", results.resolve("web").toString());

        assertEquals(0, code, errors());
        assertTrue(output().contains("gocj-100x10"), output());
        assertTrue(output().contains("Round Robin"), output());
        assertFalse(output().contains("\u001b"));
        assertFalse(Files.exists(results.resolve("runs.csv")));
        try (Stream<Path> saved = Files.list(results.resolve("custom"))) {
            List<Path> dirs = saved.toList();
            assertEquals(1, dirs.size());
            assertEquals(3, Files.readAllLines(dirs.get(0).resolve("runs.csv")).size());
        }
        assertFalse(Files.exists(results.resolve("web")), "hasil kustom tidak boleh menyentuh data website");
    }

    @Test
    void customWithBadValuesListsEveryProblem() {
        assertEquals(2, run("custom", "--vms", "25", "--runs", "11"));
        assertTrue(errors().contains("kelipatan 10"), errors());
        assertTrue(errors().contains("1–10"), errors());
    }
}
