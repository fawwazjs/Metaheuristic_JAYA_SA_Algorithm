package soka.jaya;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class MetricsTest {

    // VM0 (1000 MIPS) menjalankan task 0 lalu task 1 (selesai di 1 dan 3),
    // VM1 (500 MIPS) menjalankan task 2 (selesai di 6). Makespan = 6.
    private static final Problem PROBLEM = new Problem(new long[]{1000, 2000, 3000}, new double[]{1000, 500}, new int[]{1, 1});
    private static final Metrics METRICS = Metrics.of(PROBLEM, Evaluator.evaluate(PROBLEM, new int[]{0, 0, 1}));

    @Test
    void makespanIsTheLatestFinish() {
        assertEquals(6.0, METRICS.makespan(), 1e-9);
    }

    @Test
    void averageResourceUtilizationIsMeanBusyShareOfMakespan() {
        // RU = 3/6 dan 6/6
        assertEquals(0.75, METRICS.aru(), 1e-9);
    }

    @Test
    void throughputIsTasksPerSecond() {
        assertEquals(0.5, METRICS.throughput(), 1e-9);
    }

    @Test
    void degreeOfImbalanceComparesVmFinishTimes() {
        // (6 - 3) / 4,5
        assertEquals(3.0 / 4.5, METRICS.doi(), 1e-9);
    }

    @Test
    void responseAndWaitingAreMeasuredFromTimeZero() {
        assertEquals(10.0 / 3, METRICS.avgResponse(), 1e-9);
        assertEquals(1.0 / 3, METRICS.avgWaiting(), 1e-9);
    }

    @Test
    void energyFollowsPaperEquation23() {
        // VM0: (3x0,7 + 3x0,3) x 0,5 = 1,5 ; VM1: (6x0,7 + 0x0,3) x 1 = 4,2
        assertEquals(5.7, METRICS.energy(), 1e-9);
    }
}
