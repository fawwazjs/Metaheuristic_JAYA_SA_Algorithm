package soka.jaya;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;

class EvaluatorTest {

    @Test
    void singleCoreVmsRunTasksOneAfterAnother() {
        Problem problem = new Problem(new long[]{1000, 2000, 3000}, new double[]{1000, 500}, new int[]{1, 1});

        Schedule schedule = Evaluator.evaluate(problem, new int[]{0, 0, 1});

        assertArrayEquals(new double[]{0, 1, 0}, schedule.start(), 1e-9);
        assertArrayEquals(new double[]{1, 3, 6}, schedule.finish(), 1e-9);
        assertEquals(6.0, schedule.makespan(), 1e-9);
    }

    @Test
    void multiCoreVmTakesTasksInQueueOrderOnTheFirstFreeCore() {
        Problem problem = new Problem(new long[]{4000, 2000, 2000, 2000}, new double[]{1000}, new int[]{2});

        Schedule schedule = Evaluator.evaluate(problem, new int[]{0, 0, 0, 0});

        assertArrayEquals(new double[]{0, 0, 2, 4}, schedule.start(), 1e-9);
        assertArrayEquals(new double[]{4, 2, 4, 6}, schedule.finish(), 1e-9);
        assertEquals(6.0, schedule.makespan(), 1e-9);
    }

    @Test
    void fastMakespanMatchesFullEvaluation() {
        Problem problem = new Problem(new long[]{5000, 700, 3000, 1200, 900, 4100},
                new double[]{500, 1300, 1600}, new int[]{1, 2, 3});
        int[] mapping = {2, 0, 1, 1, 2, 0};

        assertEquals(Evaluator.evaluate(problem, mapping).makespan(), Evaluator.makespan(problem, mapping), 1e-9);
    }

    @Test
    void vmFinishTimeIsTheLastTaskEndOnThatVm() {
        Problem problem = new Problem(new long[]{1000, 2000, 3000}, new double[]{1000, 500}, new int[]{1, 1});

        Schedule schedule = Evaluator.evaluate(problem, new int[]{0, 0, 1});

        assertArrayEquals(new double[]{3, 6}, schedule.vmFinish(), 1e-9);
        assertArrayEquals(new double[]{3, 6}, schedule.vmBusy(), 1e-9);
    }
}
