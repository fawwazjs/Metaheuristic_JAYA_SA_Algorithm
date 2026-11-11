package soka.jaya;

import org.junit.jupiter.api.Test;

import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Random;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class CloudSimRunnerTest {

    private static final long[] GOCJ_100 = Workloads.gocj(Path.of("data"), 100);

    private static int[] randomMapping(int tasks, int vms, long seed) {
        Random random = new Random(seed);
        int[] mapping = new int[tasks];
        for (int i = 0; i < tasks; i++) {
            mapping[i] = random.nextInt(vms);
        }
        return mapping;
    }

    @Test
    void allFiftyVmsAreCreatedHalfInEachDatacenter() {
        List<Infrastructure.VmSpec> vms = Infrastructure.vms(50);

        CloudSimRunner.Result result = CloudSimRunner.run(GOCJ_100, vms, randomMapping(100, 50, 1));

        assertEquals(Map.of("DC-Jakarta", 25, "DC-Surabaya", 25), result.vmsPerDatacenter());
    }

    @Test
    void everyCloudletFinishesSuccessfully() {
        List<Infrastructure.VmSpec> vms = Infrastructure.vms(10);

        CloudSimRunner.Result result = CloudSimRunner.run(GOCJ_100, vms, randomMapping(100, 10, 2));

        assertEquals(100, result.finishedCloudlets());
    }

    @Test
    void evaluatorMakespanMatchesCloudSimWithinOnePercent() {
        for (int vmCount : new int[]{10, 50}) {
            List<Infrastructure.VmSpec> vms = Infrastructure.vms(vmCount);
            Problem problem = Infrastructure.problem(GOCJ_100, vms);
            for (long seed = 1; seed <= 3; seed++) {
                int[] mapping = randomMapping(100, vmCount, seed);

                double expected = Evaluator.makespan(problem, mapping);
                double actual = CloudSimRunner.run(GOCJ_100, vms, mapping).makespan();

                double relativeGap = Math.abs(actual - expected) / expected;
                assertTrue(relativeGap < 0.01, vmCount + " VM, seed " + seed + ": evaluator " + expected
                        + " vs CloudSim " + actual);
            }
        }
    }

    @Test
    void cloudSimDoesNotMissACloudletFinishEvent() {
        // Regresi: pada pemetaan ini, tanpa interval penjadwalan datacenter CloudSim terlambat
        // 52 detik mendeteksi selesainya cloudlet 682 (selisih makespan 1,8%).
        long[] lengths = Workloads.gocj(Path.of("data"), 750);
        List<Infrastructure.VmSpec> vms = Infrastructure.vms(40);
        Problem problem = Infrastructure.problem(lengths, vms);
        int[] mapping = new soka.jaya.schedulers.Jaya(30, 750).schedule(problem, 9).mapping();

        double expected = Evaluator.makespan(problem, mapping);
        double actual = CloudSimRunner.run(lengths, vms, mapping).makespan();

        assertTrue(Math.abs(actual - expected) / expected < 0.005, "evaluator " + expected + " vs CloudSim " + actual);
    }

    @Test
    void cloudletsRunOnTheVmChosenByTheMapping() {
        List<Infrastructure.VmSpec> vms = Infrastructure.vms(10);
        int[] mapping = randomMapping(100, 10, 4);

        CloudSimRunner.Result result = CloudSimRunner.run(GOCJ_100, vms, mapping);

        for (int i = 0; i < mapping.length; i++) {
            assertEquals(mapping[i], result.vmOfCloudlet()[i], "cloudlet " + i);
        }
    }

    @Test
    void clockWatcherSeesSimulationTimeRiseToTheMakespan() {
        List<Infrastructure.VmSpec> vms = Infrastructure.vms(10);
        List<Double> times = new ArrayList<>();

        CloudSimRunner.Result result = CloudSimRunner.run(GOCJ_100, vms, randomMapping(100, 10, 5), time -> {
            times.add(time);
            return true;
        });

        assertTrue(times.size() > 10, "jam hanya dilaporkan " + times.size() + " kali");
        for (int i = 1; i < times.size(); i++) {
            assertTrue(times.get(i) >= times.get(i - 1), "jam mundur di laporan ke-" + i);
        }
        assertTrue(times.get(times.size() - 1) >= 0.99 * result.makespan(),
                "jam terakhir " + times.get(times.size() - 1) + " vs makespan " + result.makespan());
    }

    @Test
    void clockWatcherCanStopTheSimulationEarly() {
        List<Infrastructure.VmSpec> vms = Infrastructure.vms(10);

        CloudSimRunner.Result result = CloudSimRunner.run(GOCJ_100, vms, randomMapping(100, 10, 6), time -> time < 100);

        assertTrue(result.finishedCloudlets() < 100, result.finishedCloudlets() + " cloudlet tetap selesai");
    }
}
