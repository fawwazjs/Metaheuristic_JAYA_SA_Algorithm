package soka.jaya.live;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Consumer;
import java.util.stream.IntStream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class LiveSessionTest {

    private static final Catalog CATALOG = Catalog.scan(Path.of("data"));

    @TempDir
    Path results;

    private static RunRequest request(Map<String, String> fields) {
        RunRequest.Parsed parsed = RunRequest.parse(fields, CATALOG);
        assertEquals(List.of(), parsed.errors());
        return parsed.request();
    }

    private LiveSession session(RunRequest request, Consumer<LiveEvent> sink) {
        CustomStore store = new CustomStore(results);
        return new LiveSession(store.newId(request, LocalDateTime.of(2026, 11, 11, 21, 30, 15)), request,
                Path.of("data"), store, sink);
    }

    private static <T extends LiveEvent> List<T> only(List<LiveEvent> events, Class<T> type) {
        return events.stream().filter(type::isInstance).map(type::cast).toList();
    }

    @Test
    void streamsEveryIterationPointInOrderWithoutLosingAny() {
        List<LiveEvent> events = new ArrayList<>();
        RunRequest request = request(Map.of("dataset", "gocj", "tasks", "100", "vms", "10", "algo", "jaya",
                "runs", "1", "population", "5", "iterations", "40", "tempo", "penuh"));

        LiveSession.Outcome outcome = session(request, events::add).run();

        assertEquals(LiveSession.Status.SELESAI, outcome.status());
        int[] iterations = only(events, LiveEvent.Iteration.class).stream()
                .flatMapToInt(batch -> IntStream.of(batch.iteration())).toArray();
        assertEquals(IntStream.rangeClosed(0, 40).boxed().toList(), IntStream.of(iterations).boxed().toList());
        List<String> order = events.stream().map(event -> event.getClass().getSimpleName()).distinct().toList();
        assertEquals(List.of("Log", "Started", "RunStart", "Iteration", "Validation", "RunEnd", "Done"), order);
        LiveEvent.Done done = assertInstanceOf(LiveEvent.Done.class, events.get(events.size() - 1));
        assertEquals("selesai", done.status());
    }

    @Test
    void visibleTempoSlowsTheSearchDownButNotItsRuntimeAndLimitsTheEventRate() {
        List<LiveEvent> events = new ArrayList<>();
        RunRequest request = request(Map.of("dataset", "gocj", "tasks", "100", "vms", "10", "algo", "jaya",
                "runs", "1", "population", "5", "iterations", "100", "tempo", "terlihat"));

        long started = System.nanoTime();
        session(request, events::add).run();
        double seconds = (System.nanoTime() - started) / 1e9;

        assertTrue(seconds >= LiveSession.VISIBLE_SECONDS_PER_SEARCH * 0.9, "hanya " + seconds + " detik");
        int batches = only(events, LiveEvent.Iteration.class).size();
        assertTrue(batches >= 10 && batches <= 30, batches + " kiriman iterasi untuk pencarian ±2,5 detik");
        long runtimeMs = only(events, LiveEvent.RunEnd.class).get(0).record().runtimeMs();
        assertTrue(runtimeMs < 500, "runtime " + runtimeMs + " ms ikut menghitung jeda tontonan");
    }

    @Test
    void validationProgressPointsAtTheExpectedMakespan() {
        List<LiveEvent> events = new ArrayList<>();
        RunRequest request = request(Map.of("dataset", "gocj", "tasks", "750", "vms", "10", "algo", "rr", "tempo", "penuh"));

        session(request, events::add).run();

        List<LiveEvent.Validation> validations = only(events, LiveEvent.Validation.class);
        assertFalse(validations.isEmpty());
        double makespan = only(events, LiveEvent.RunEnd.class).get(0).record().makespanEval();
        assertEquals(makespan, validations.get(0).expectedMakespan(), 1e-9);
    }

    @Test
    void cancellingStopsTheSessionAndSavesNothing() {
        List<LiveEvent> events = new ArrayList<>();
        RunRequest request = request(Map.of("dataset", "gocj", "tasks", "100", "vms", "10", "algo", "jaya,sa",
                "runs", "2", "tempo", "terlihat"));
        LiveSession[] session = new LiveSession[1];
        session[0] = session(request, event -> {
            events.add(event);
            if (event instanceof LiveEvent.Iteration) {
                session[0].cancel();
            }
        });

        LiveSession.Outcome outcome = session[0].run();

        assertEquals(LiveSession.Status.DIBATALKAN, outcome.status());
        LiveEvent.Done done = assertInstanceOf(LiveEvent.Done.class, events.get(events.size() - 1));
        assertEquals("dibatalkan", done.status());
        assertNull(done.savedTo());
        assertTrue(only(events, LiveEvent.RunEnd.class).isEmpty());
        assertFalse(Files.exists(results.resolve("custom")));
    }

    @Test
    void finishedSessionIsSavedApartFromTheOfficialResults() throws Exception {
        RunRequest request = request(Map.of("dataset", "gocj", "tasks", "100", "vms", "10", "algo", "sa,rr",
                "runs", "2", "tempo", "penuh"));

        LiveSession.Outcome outcome = session(request, event -> {
        }).run();

        Path dir = results.resolve("custom").resolve("20261111-213015-gocj100x10");
        assertEquals(dir, outcome.savedTo());
        assertEquals(3, Files.readAllLines(dir.resolve("runs.csv")).size() - 1);
        assertTrue(Files.exists(dir.resolve("summary.csv")));
        assertTrue(Files.readString(dir.resolve("web.json")).contains("\"replay\":{\"vms\":["));
        assertTrue(Files.readString(dir.resolve("request.properties")).contains("algo=sa,rr"));
        assertFalse(Files.exists(results.resolve("runs.csv")));
    }
}
