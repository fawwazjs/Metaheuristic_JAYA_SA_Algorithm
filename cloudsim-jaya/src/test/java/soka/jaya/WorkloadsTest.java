package soka.jaya;

import org.junit.jupiter.api.Test;

import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class WorkloadsTest {

    private static final Path DATA = Path.of("data");

    @Test
    void gocjFileIsReadInPublishedOrder() {
        long[] lengths = Workloads.gocj(DATA, 100);

        assertEquals(100, lengths.length);
        assertEquals(127000, lengths[0]);
        assertEquals(83000, lengths[1]);
    }

    @Test
    void nasaJobBecomesRuntimeTimesProcessorsTimesReferenceMips() {
        long[] lengths = Workloads.nasa(DATA, 750);

        assertEquals(750, lengths.length);
        // Job 1: runtime 1451 s pada 128 prosesor -> 1451 x 128 x 1000 MI
        assertEquals(1451L * 128 * 1000, lengths[0]);
    }

    @Test
    void nasaKeepsLengthsAboveIntRange() {
        long[] lengths = Workloads.nasa(DATA, Workloads.NASA_JOBS);

        long max = 0;
        for (long length : lengths) {
            max = Math.max(max, length);
        }
        assertEquals(18239, lengths.length);
        assertEquals(2_651_072_000L, max);
    }

    @Test
    void unknownGocjSizeIsRejected() {
        assertThrows(IllegalArgumentException.class, () -> Workloads.gocj(DATA, 123));
    }
}
