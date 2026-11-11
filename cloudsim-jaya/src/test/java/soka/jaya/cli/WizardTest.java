package soka.jaya.cli;

import org.junit.jupiter.api.Test;
import soka.jaya.live.Catalog;
import soka.jaya.live.RunRequest;

import java.io.BufferedReader;
import java.io.ByteArrayOutputStream;
import java.io.PrintStream;
import java.io.StringReader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class WizardTest {

    private final ByteArrayOutputStream output = new ByteArrayOutputStream();

    private Optional<RunRequest> answer(String input) {
        Wizard wizard = new Wizard(new BufferedReader(new StringReader(input)),
                new PrintStream(output, true, StandardCharsets.UTF_8), Catalog.scan(Path.of("data")), Path.of("data"));
        return wizard.ask();
    }

    private String shown() {
        return output.toString(StandardCharsets.UTF_8);
    }

    @Test
    void pressingEnterEverywhereRunsTheDefaults() {
        assertEquals(Optional.of(RunRequest.defaults()), answer("\n\n\n\n\n\n\n\n"));
        assertTrue(shown().contains("./sim custom --dataset gocj --tasks 750 --vms 50 --algo all --runs 3"), shown());
    }

    @Test
    void answersBuildTheRequest() {
        RunRequest request = answer("2\n1200\n3\n1,2\n5\nt\n2\ny\n").orElseThrow();

        assertEquals("nasa", request.dataset());
        assertEquals(1200, request.tasks());
        assertEquals(30, request.vms());
        assertEquals(List.of("jaya", "sa"), request.algorithms());
        assertEquals(5, request.runs());
        assertEquals("penuh", request.tempo());
    }

    @Test
    void sizesAndVmCountsCanBeTypedAsValues() {
        RunRequest request = answer("gocj\n300\n20\nrr\n\ny\n").orElseThrow();

        assertEquals(300, request.tasks());
        assertEquals(20, request.vms());
        assertEquals(List.of("rr"), request.algorithms());
    }

    @Test
    void jayaParametersCanBeChangedWithAWarning() {
        RunRequest request = answer("\n\n\njaya\n1\ny\n10\n100\n\ny\n").orElseThrow();

        assertEquals(10, request.population());
        assertEquals(100, request.iterations());
        assertTrue(shown().contains("tidak lagi setara"), shown());
    }

    @Test
    void invalidAnswersAreAskedAgainWithTheReason() {
        RunRequest request = answer("9\n1\n350\n750\n25\n50\npso\nsa\n11\n2\n\ny\n").orElseThrow();

        assertEquals(List.of("sa"), request.algorithms());
        assertEquals(2, request.runs());
        String text = shown();
        assertTrue(text.contains("Pilihan tidak dikenal: 9"), text);
        assertTrue(text.contains("Pilihan tidak dikenal: 350"), text);
        assertTrue(text.contains("pso"), text);
        assertTrue(text.contains("1–10"), text);
    }

    @Test
    void quittingOrDecliningRunsNothing() {
        assertEquals(Optional.empty(), answer("1\nq\n"));
        assertEquals(Optional.empty(), answer("\n\n\n\n\n\n\nt\n"));
        assertEquals(Optional.empty(), answer("1\n"));
    }
}
