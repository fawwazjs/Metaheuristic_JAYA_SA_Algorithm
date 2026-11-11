package soka.jaya.schedulers;

import org.junit.jupiter.api.Test;
import soka.jaya.Evaluator;
import soka.jaya.Problem;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class BaselineSchedulersTest {

    private static final Problem SMALL = new Problem(
            new long[]{127000, 83000, 63000, 63000, 65000, 15000, 90000, 40000, 22000, 71000},
            new double[]{500, 800, 1000, 1300, 1600}, new int[]{1, 1, 2, 2, 3});

    @Test
    void roundRobinCyclesThroughVmsInOrder() {
        Problem problem = new Problem(new long[]{1, 1, 1, 1, 1}, new double[]{100, 200}, new int[]{1, 1});

        assertArrayEquals(new int[]{0, 1, 0, 1, 0}, new RoundRobin().schedule(problem, 1).mapping());
    }

    @Test
    void sufferageGivesTheContestedVmToTheTaskThatWouldSufferMost() {
        // Kedua task ingin VM0 (cepat). Task 1 rugi 4 detik jika kalah, task 0 hanya rugi 1 detik,
        // jadi task 1 mendapat VM0 dan task 0 pindah ke VM1. Min-Min akan memberi VM0 ke task 0.
        Problem problem = new Problem(new long[]{1000, 4000}, new double[]{1000, 500}, new int[]{1, 1});

        int[] mapping = new Sufferage().schedule(problem, 1).mapping();

        assertArrayEquals(new int[]{1, 0}, mapping);
        assertEquals(4.0, Evaluator.makespan(problem, mapping), 1e-9);
    }

    @Test
    void sufferageAssignsEveryTaskToAnExistingVm() {
        int[] mapping = new Sufferage().schedule(SMALL, 1).mapping();

        assertEquals(SMALL.taskCount(), mapping.length);
        for (int vm : mapping) {
            assertTrue(vm >= 0 && vm < SMALL.vmCount());
        }
    }

    @Test
    void simulatedAnnealingUsesTheSameBudgetAsTheSaBranch() {
        // T0=100, Tmin=0,001, alpha=0,95 -> 225 suhu x 100 tetangga, ditambah 1 solusi awal.
        Scheduler.Result result = new SimulatedAnnealing().schedule(SMALL, 1);

        List<TracePoint> trace = result.trace();
        assertEquals(225 * 100 + 1, trace.get(trace.size() - 1).evaluations());
    }

    @Test
    void simulatedAnnealingBestNeverGetsWorse() {
        List<TracePoint> trace = new SimulatedAnnealing().schedule(SMALL, 5).trace();

        for (int i = 1; i < trace.size(); i++) {
            assertTrue(trace.get(i).best() <= trace.get(i - 1).best(), "best memburuk di titik " + i);
        }
    }

    @Test
    void simulatedAnnealingIsReproducibleWithTheSameSeed() {
        assertArrayEquals(new SimulatedAnnealing().schedule(SMALL, 9).mapping(),
                new SimulatedAnnealing().schedule(SMALL, 9).mapping());
    }

    @Test
    void simulatedAnnealingReturnsTheBestSolutionItReports() {
        Scheduler.Result result = new SimulatedAnnealing().schedule(SMALL, 2);

        double reported = result.trace().get(result.trace().size() - 1).best();
        assertEquals(reported, Evaluator.makespan(SMALL, result.mapping()), 1e-9);
    }

    @Test
    void simulatedAnnealingCountsItsTemperatureSteps() {
        List<TracePoint> trace = new SimulatedAnnealing().schedule(SMALL, 1).trace();

        assertEquals(225, SimulatedAnnealing.temperatureSteps());
        assertEquals(trace.size() - 1, SimulatedAnnealing.temperatureSteps());
    }

    @Test
    void simulatedAnnealingReportsEveryTemperatureStep() {
        List<SearchStep> steps = new ArrayList<>();
        Scheduler.Result result = new SimulatedAnnealing().schedule(SMALL, 4, steps::add);

        assertEquals(result.trace().size(), steps.size());
        for (int i = 0; i < steps.size(); i++) {
            SearchStep step = steps.get(i);
            TracePoint point = result.trace().get(i);
            assertEquals(i, step.iteration());
            assertEquals(SimulatedAnnealing.temperatureSteps(), step.totalIterations());
            assertEquals(point.evaluations(), step.evaluations());
            assertEquals(point.best(), step.best());
            assertEquals(point.worst(), step.worst());
            double slowestVm = Arrays.stream(step.bestLoads().get()).max().orElseThrow();
            assertEquals(step.best(), slowestVm, 1e-9);
        }
    }

    @Test
    void simulatedAnnealingGivesTheSameResultWhenWatched() {
        assertArrayEquals(new SimulatedAnnealing().schedule(SMALL, 9).mapping(),
                new SimulatedAnnealing().schedule(SMALL, 9, step -> step.bestLoads().get()).mapping());
    }

    @Test
    void heuristicsIgnoreTheListener() {
        List<SearchStep> steps = new ArrayList<>();

        new Sufferage().schedule(SMALL, 1, steps::add);
        new RoundRobin().schedule(SMALL, 1, steps::add);

        assertTrue(steps.isEmpty());
    }
}
