package soka.jaya.schedulers;

import org.junit.jupiter.api.Test;
import soka.jaya.Problem;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class JayaTest {

    private static final Problem SMALL = new Problem(
            new long[]{127000, 83000, 63000, 63000, 65000, 15000, 90000, 40000, 22000, 71000},
            new double[]{500, 800, 1000, 1300, 1600}, new int[]{1, 1, 2, 2, 3});

    @Test
    void updateFollowsTheSlideExample() {
        // Slide: X=2, Pbest=3, Pworst=1, r1=r2=0,5 -> 3
        assertEquals(3.0, Jaya.update(2, 3, 1, 0.5, 0.5), 1e-12);
    }

    @Test
    void decodeRoundsAndClampsToValidVmPositions() {
        assertEquals(0, Jaya.decode(-0.4, 5));
        assertEquals(2, Jaya.decode(1.5, 5));
        assertEquals(4, Jaya.decode(9.7, 5));
    }

    @Test
    void bestMakespanNeverGetsWorse() {
        Scheduler.Result result = new Jaya(10, 50).schedule(SMALL, 7);

        List<TracePoint> trace = result.trace();
        for (int i = 1; i < trace.size(); i++) {
            assertTrue(trace.get(i).best() <= trace.get(i - 1).best(), "best memburuk di iterasi " + i);
        }
    }

    @Test
    void sameSeedGivesTheSameMapping() {
        assertArrayEquals(new Jaya(10, 50).schedule(SMALL, 42).mapping(),
                new Jaya(10, 50).schedule(SMALL, 42).mapping());
    }

    @Test
    void usesPopulationTimesIterationsPlusInitialEvaluations() {
        Scheduler.Result result = new Jaya(10, 50).schedule(SMALL, 1);

        assertEquals(10L * 50 + 10, result.trace().get(result.trace().size() - 1).evaluations());
    }

    @Test
    void mappingOnlyUsesExistingVms() {
        int[] mapping = new Jaya(10, 50).schedule(SMALL, 3).mapping();

        for (int vm : mapping) {
            assertTrue(vm >= 0 && vm < SMALL.vmCount());
        }
    }

    @Test
    void listenerReceivesEveryTracePointInOrder() {
        List<SearchStep> steps = new ArrayList<>();
        Scheduler.Result result = new Jaya(10, 50).schedule(SMALL, 7, steps::add);

        assertEquals(result.trace().size(), steps.size());
        for (int i = 0; i < steps.size(); i++) {
            SearchStep step = steps.get(i);
            TracePoint point = result.trace().get(i);
            assertEquals(i, step.iteration());
            assertEquals(50, step.totalIterations());
            assertEquals(point.evaluations(), step.evaluations());
            assertEquals(point.best(), step.best());
            assertEquals(point.worst(), step.worst());
        }
    }

    @Test
    void bestLoadsBelongToThePlanWithTheBestMakespan() {
        List<Double> gaps = new ArrayList<>();
        new Jaya(10, 20).schedule(SMALL, 3, step -> {
            double slowestVm = Arrays.stream(step.bestLoads().get()).max().orElseThrow();
            gaps.add(Math.abs(slowestVm - step.best()));
        });

        assertEquals(21, gaps.size());
        assertTrue(gaps.stream().allMatch(gap -> gap < 1e-9), gaps.toString());
    }

    @Test
    void listeningDoesNotChangeTheResult() {
        int[] quiet = new Jaya(10, 50).schedule(SMALL, 42).mapping();
        int[] watched = new Jaya(10, 50).schedule(SMALL, 42, step -> step.bestLoads().get()).mapping();

        assertArrayEquals(quiet, watched);
    }
}
