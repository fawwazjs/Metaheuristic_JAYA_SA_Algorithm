package soka.jaya.live;

import org.junit.jupiter.api.Test;

import java.nio.file.Path;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class EstimateTest {

    private static final Catalog CATALOG = Catalog.scan(Path.of("data"));

    private static Estimate estimate(Map<String, String> fields) {
        RunRequest request = RunRequest.parse(fields, CATALOG).request();
        return Estimate.of(request, request.scenario().lengths(Path.of("data")));
    }

    @Test
    void thereIsOneEstimatePerRunInExperimentOrder() {
        Estimate estimate = estimate(Map.of("algo", "jaya,sa,rr", "runs", "2"));

        assertEquals(5, estimate.perRun().size());
        double sum = estimate.perRun().stream().mapToDouble(Double::doubleValue).sum();
        assertEquals(sum + Estimate.OVERHEAD_SECONDS, estimate.totalSeconds(), 1e-9);
        assertEquals(estimate.perRun().get(4), estimate.remainingAfter(4), 1e-9);
    }

    @Test
    void visibleTempoAddsTheViewingTimeOfEachSearch() {
        double visible = estimate(Map.of("algo", "jaya,sa,rr", "runs", "2", "tempo", "terlihat")).totalSeconds();
        double full = estimate(Map.of("algo", "jaya,sa,rr", "runs", "2", "tempo", "penuh")).totalSeconds();

        // 4 run JAYA/SA diperpanjang sampai sekitar 2,5 detik; RR tidak dijeda.
        assertTrue(visible - full > 4 * 1.5 && visible - full <= 4 * LiveSession.VISIBLE_SECONDS_PER_SEARCH,
                "terlihat " + visible + " vs penuh " + full);
    }

    @Test
    void nasaValidationIsMeasuredInTensOfSecondsPerRun() {
        // Terukur: NASA 750 job × 50 VM butuh 8–19 detik per run untuk validasi CloudSim.
        double nasa = estimate(Map.of("dataset", "nasa", "algo", "rr", "tempo", "penuh")).totalSeconds();
        double gocj = estimate(Map.of("dataset", "gocj", "algo", "rr", "tempo", "penuh")).totalSeconds();

        assertTrue(nasa > 5 && nasa < 60, "NASA " + nasa);
        assertTrue(gocj < 3, "GoCJ " + gocj);
    }
}
