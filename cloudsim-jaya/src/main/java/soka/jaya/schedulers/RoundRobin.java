package soka.jaya.schedulers;

import soka.jaya.Problem;

import java.util.List;

/** Baseline: cloudlet ke-i diberikan ke VM ke-(i mod m), tanpa melihat kecepatan VM. */
public final class RoundRobin implements Scheduler {
    @Override
    public String name() {
        return "Round Robin";
    }

    @Override
    public Result schedule(Problem problem, long seed) {
        int[] mapping = new int[problem.taskCount()];
        for (int i = 0; i < mapping.length; i++) {
            mapping[i] = i % problem.vmCount();
        }
        return new Result(mapping, List.of());
    }
}
