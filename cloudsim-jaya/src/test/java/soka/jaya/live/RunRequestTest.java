package soka.jaya.live;

import org.junit.jupiter.api.Test;

import java.nio.file.Path;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class RunRequestTest {

    private static final Catalog CATALOG = Catalog.scan(Path.of("data"));

    private static RunRequest.Parsed parse(String... keyValues) {
        Map<String, String> fields = new HashMap<>();
        for (int i = 0; i < keyValues.length; i += 2) {
            fields.put(keyValues[i], keyValues[i + 1]);
        }
        return RunRequest.parse(fields, CATALOG);
    }

    private static void assertRejected(String expectedInMessage, String... keyValues) {
        RunRequest.Parsed parsed = parse(keyValues);
        assertNull(parsed.request(), "seharusnya ditolak: " + String.join(" ", keyValues));
        assertTrue(parsed.errors().stream().anyMatch(error -> error.contains(expectedInMessage)),
                "pesan tidak menyebut '" + expectedInMessage + "': " + parsed.errors());
    }

    @Test
    void catalogListsTheGocjFilesThatExist() {
        assertEquals(List.of(100, 200, 300, 400, 500, 600, 700, 750, 800, 900, 1000), CATALOG.gocjSizes());
        assertTrue(CATALOG.datasets().stream().anyMatch(dataset -> dataset.id().equals("nasa")));
    }

    @Test
    void defaultsAreValid() {
        RunRequest.Parsed parsed = parse();

        assertEquals(List.of(), parsed.errors());
        assertEquals(RunRequest.defaults(), parsed.request());
    }

    @Test
    void missingFieldsFallBackToDefaults() {
        RunRequest request = parse("dataset", "gocj", "tasks", "300", "vms", "20", "algo", "jaya,sa").request();

        assertEquals(300, request.tasks());
        assertEquals(20, request.vms());
        assertEquals(List.of("jaya", "sa"), request.algorithms());
        assertEquals(3, request.runs());
        assertEquals(30, request.population());
        assertEquals(750, request.iterations());
        assertEquals("terlihat", request.tempo());
    }

    @Test
    void everyFieldIsCheckedWithAClearMessage() {
        assertRejected("350", "dataset", "gocj", "tasks", "350");
        assertRejected("50", "dataset", "nasa", "tasks", "20");
        assertRejected("18.239", "dataset", "nasa", "tasks", "20000");
        assertRejected("kelipatan 10", "vms", "25");
        assertRejected("10–50", "vms", "60");
        assertRejected("1–10", "runs", "11");
        assertRejected("pso", "algo", "pso");
        assertRejected("5–100", "population", "2");
        assertRejected("10–3.000", "iterations", "5000");
        assertRejected("kilat", "tempo", "kilat");
        assertRejected("abc", "tasks", "abc");
        assertRejected("azure", "dataset", "azure");
        assertRejected("warna", "warna", "merah");
    }

    @Test
    void allMeansEveryAlgorithmInDisplayOrder() {
        List<String> every = List.of("jaya", "sa", "sufferage", "rr");
        assertEquals(every, parse("algo", "all").request().algorithms());
        assertEquals(every, parse("algo", "semua").request().algorithms());
        assertEquals(List.of("jaya", "rr"), parse("algo", "rr, JAYA,rr").request().algorithms());
    }

    @Test
    void warnsWhenNasaIsLarge() {
        assertTrue(parse("dataset", "nasa", "tasks", "750").warnings().isEmpty());
        assertTrue(parse("dataset", "nasa", "tasks", "5000").warnings().stream().anyMatch(w -> w.contains("5.000")));
    }

    @Test
    void warnsWhenJayaBudgetIsNoLongerComparableWithSa() {
        assertTrue(parse().warnings().isEmpty());
        assertTrue(parse("population", "10").warnings().stream().anyMatch(w -> w.contains("22.501")));
        assertTrue(parse("population", "10", "algo", "jaya,rr").warnings().stream().anyMatch(w -> w.contains("22.501")));
        assertTrue(parse("population", "10", "algo", "sa,rr").warnings().isEmpty());
    }

    @Test
    void equivalentCommandOnlyNamesWhatDiffersFromTheDefaults() {
        RunRequest request = parse("dataset", "gocj", "tasks", "300", "vms", "20", "algo", "jaya,sa").request();

        assertEquals("./sim custom --dataset gocj --tasks 300 --vms 20 --algo jaya,sa --runs 3", request.equivalentCommand());
        assertEquals("./sim custom --dataset nasa --tasks 750 --vms 50 --algo all --runs 3 --population 20 --iterations 100 --tempo penuh",
                parse("dataset", "nasa", "population", "20", "iterations", "100", "tempo", "penuh").request().equivalentCommand());
    }

    @Test
    void fieldsRoundTrip() {
        RunRequest request = parse("dataset", "nasa", "tasks", "1200", "vms", "30", "algo", "sa,sufferage",
                "runs", "5", "population", "40", "iterations", "200", "tempo", "penuh").request();

        assertEquals(request, RunRequest.parse(request.fields(), CATALOG).request());
    }

    @Test
    void heuristicsRunOnceAndMetaheuristicsOncePerSeed() {
        RunRequest request = parse("algo", "jaya,sa,rr", "runs", "3").request();

        assertEquals(7, request.runCount());
        assertEquals(3, request.algorithmsToRun().size());
    }

    @Test
    void customScenarioIsNamedAfterItsShape() {
        RunRequest request = parse("dataset", "gocj", "tasks", "300", "vms", "20").request();

        assertEquals("gocj-300x20", request.scenario().id());
        assertEquals("custom", request.scenario().group());
        assertEquals(300, request.scenario().tasks());
    }

    @Test
    void parametersThatDoNotApplyFallBackToTheirDefaults() {
        RunRequest heuristicsOnly = parse("algo", "rr,sufferage", "runs", "5", "population", "10", "tempo", "penuh").request();

        assertEquals(3, heuristicsOnly.runs());
        assertEquals(30, heuristicsOnly.population());
        assertEquals("terlihat", heuristicsOnly.tempo());
        assertEquals("./sim custom --dataset gocj --tasks 750 --vms 50 --algo sufferage,rr", heuristicsOnly.equivalentCommand());
        assertEquals(10, parse("algo", "jaya", "population", "10").request().population());
        assertEquals(30, parse("algo", "sa", "population", "10").request().population());
    }
}
