package soka.jaya.report;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.file.Path;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ReportTest {

    private static RunRecord record(String scenario, String algorithm, int seed, double makespan) {
        return new RunRecord(scenario, "tc1", "gocj", 100, 50, 562.5, algorithm, seed,
                makespan, makespan + 1, 0.01, 0.9, 0.05, 0.2, 500, 100, 1234.5, 42, 7, 100);
    }

    @Test
    void rerunReplacesAllEarlierSeedsOfThatScenarioAndAlgorithm() {
        List<RunRecord> existing = List.of(
                record("A", "JAYA", 1, 10), record("A", "JAYA", 2, 11), record("B", "SA", 1, 20));
        List<RunRecord> fresh = List.of(record("A", "JAYA", 1, 9));

        List<RunRecord> merged = RunStore.merge(existing, fresh);

        assertEquals(List.of(record("B", "SA", 1, 20), record("A", "JAYA", 1, 9)), merged);
    }

    @Test
    void csvRoundTripKeepsEveryField(@TempDir Path dir) {
        List<RunRecord> records = List.of(record("A", "JAYA (VM id asli)", 3, 1234.5678), record("B", "SA", 1, 20));
        Path file = dir.resolve("runs.csv");

        RunStore.write(file, records);

        assertEquals(records, RunStore.read(file));
    }

    @Test
    void missingCsvMeansNoEarlierRuns(@TempDir Path dir) {
        assertEquals(List.of(), RunStore.read(dir.resolve("tidak-ada.csv")));
    }

    @Test
    void statsUseSampleStandardDeviation() {
        Stats stats = Stats.of(List.of(1.0, 2.0, 3.0, 4.0));

        assertEquals(2.5, stats.mean(), 1e-12);
        assertEquals(Math.sqrt(5.0 / 3), stats.std(), 1e-12);
        assertEquals(1.0, stats.min(), 1e-12);
        assertEquals(4.0, stats.max(), 1e-12);
    }

    @Test
    void singleRunHasZeroSpread() {
        assertEquals(0.0, Stats.of(List.of(7.0)).std(), 1e-12);
    }

    @Test
    void jsonEscapesTextAndWritesNullForNonFiniteNumbers() {
        Map<String, Object> object = new LinkedHashMap<>();
        object.put("nama", "JAYA \"VM\"\n");
        object.put("nilai", List.of(1, 2.5, Double.NaN, 1234.56789));
        object.put("kosong", null);

        assertEquals("{\"nama\":\"JAYA \\\"VM\\\"\\n\",\"nilai\":[1,2.5,null,1234.568],\"kosong\":null}",
                Json.write(object));
    }

    private record Point(String name, double value, int[] tags) {
    }

    @Test
    void jsonWritesRecordsWithTheirComponentNames() {
        assertEquals("{\"name\":\"V5\",\"value\":1600,\"tags\":[3]}", Json.write(new Point("V5", 1600, new int[]{3})));
    }

    @Test
    void jsonWritesNestedArrays() {
        Map<String, Object> object = new LinkedHashMap<>();
        object.put("x", List.of(new double[]{1, 2}, new int[]{3}));
        object.put("ok", true);

        assertEquals("{\"x\":[[1,2],[3]],\"ok\":true}", Json.write(object));
    }
}
