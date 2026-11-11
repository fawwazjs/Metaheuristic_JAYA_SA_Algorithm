package soka.jaya.cli;

import org.junit.jupiter.api.Test;

import soka.jaya.live.Catalog;
import soka.jaya.live.RunRequest;

import java.nio.file.Path;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class CliTest {

    @Test
    void runUsesSensibleDefaults() {
        Cli.Options options = Cli.parse(new String[]{"run"});

        assertEquals("run", options.command());
        assertEquals("all", options.scenario());
        assertEquals("all", options.algorithm());
        assertEquals(10, options.runs());
        assertTrue(options.sortVmsByMips());
        assertTrue(options.exportWeb());
        assertEquals(Path.of("../public/data/cloudsim"), options.webDir());
    }

    @Test
    void optionsOverrideDefaults() {
        Cli.Options options = Cli.parse(new String[]{"run", "--scenario", "tc2", "--algo", "jaya",
                "--runs", "3", "--vm-order", "raw", "--no-web"});

        assertEquals("tc2", options.scenario());
        assertEquals("jaya", options.algorithm());
        assertEquals(3, options.runs());
        assertFalse(options.sortVmsByMips());
        assertFalse(options.exportWeb());
    }

    @Test
    void noArgumentsMeansTheInteractiveWizard() {
        // Tanpa terminal, Main tetap menampilkan bantuan (lihat MainTest).
        assertEquals("interactive", Cli.parse(new String[]{}).command());
    }

    @Test
    void optionsWithoutACommandAlsoOpenTheWizard() {
        Cli.Options options = Cli.parse(new String[]{"--plain", "--out", "hasil"});

        assertEquals("interactive", options.command());
        assertTrue(options.plain());
        assertEquals(Path.of("hasil"), options.outDir());
    }

    @Test
    void customCollectsTheRequestFields() {
        Cli.Options options = Cli.parse(new String[]{"custom", "--dataset", "nasa", "--tasks", "1200", "--vms", "30",
                "--algo", "jaya,sa", "--runs", "5", "--tempo", "penuh", "--plain"});

        assertEquals(Map.of("dataset", "nasa", "tasks", "1200", "vms", "30", "algo", "jaya,sa", "runs", "5",
                "tempo", "penuh"), options.request());
        assertTrue(options.plain());
    }

    @Test
    void theWizardsEquivalentCommandRebuildsTheSameRequest() {
        Catalog catalog = Catalog.scan(Path.of("data"));
        RunRequest request = RunRequest.parse(Map.of("dataset", "gocj", "tasks", "300", "vms", "20", "algo", "jaya,rr",
                "population", "10", "tempo", "penuh"), catalog).request();
        String[] words = request.equivalentCommand().split(" ");

        Cli.Options options = Cli.parse(java.util.Arrays.copyOfRange(words, 1, words.length));

        assertEquals(request, RunRequest.parse(options.request(), catalog).request());
    }

    @Test
    void optionsOnlyApplyToTheirOwnCommand() {
        IllegalArgumentException error = assertThrows(IllegalArgumentException.class,
                () -> Cli.parse(new String[]{"run", "--dataset", "gocj"}));
        assertTrue(error.getMessage().contains("--dataset") && error.getMessage().contains("run"), error.getMessage());
        assertThrows(IllegalArgumentException.class, () -> Cli.parse(new String[]{"custom", "--scenario", "tc1"}));
        assertThrows(IllegalArgumentException.class, () -> Cli.parse(new String[]{"custom", "--no-web"}));
    }

    @Test
    void unknownOptionIsReportedByName() {
        IllegalArgumentException error = assertThrows(IllegalArgumentException.class,
                () -> Cli.parse(new String[]{"run", "--fast"}));

        assertTrue(error.getMessage().contains("--fast"));
    }

    @Test
    void unknownCommandIsRejected() {
        assertThrows(IllegalArgumentException.class, () -> Cli.parse(new String[]{"jalan"}));
    }

    @Test
    void invalidValuesAreRejected() {
        assertThrows(IllegalArgumentException.class, () -> Cli.parse(new String[]{"run", "--runs", "0"}));
        assertThrows(IllegalArgumentException.class, () -> Cli.parse(new String[]{"run", "--algo", "pso"}));
        assertThrows(IllegalArgumentException.class, () -> Cli.parse(new String[]{"run", "--vm-order", "acak"}));
        assertThrows(IllegalArgumentException.class, () -> Cli.parse(new String[]{"run", "--runs"}));
    }
}
