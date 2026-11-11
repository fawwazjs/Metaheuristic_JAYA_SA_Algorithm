package soka.jaya.schedulers;

import soka.jaya.Evaluator;
import soka.jaya.Problem;

import java.util.Arrays;
import java.util.List;

/**
 * Sufferage klasik (Maheswaran dkk., 1999), heuristik dari tugas sebelumnya.
 *
 * <p>Setiap putaran, tiap task yang belum dijadwalkan memilih VM dengan waktu
 * selesai tercepat. Jika beberapa task berebut VM yang sama, VM itu diberikan
 * ke task dengan sufferage terbesar (selisih waktu selesai tercepat ke-2 dan
 * ke-1). Semua pemenang ditetapkan sekaligus di akhir putaran. Berbeda dengan
 * versi Python tugas heuristik yang menetapkan satu task per putaran.
 *
 * <p>Waktu siap VM multi-core = waktu core yang paling cepat kosong.
 */
public final class Sufferage implements Scheduler {
    @Override
    public String name() {
        return "Sufferage";
    }

    @Override
    public Result schedule(Problem problem, long seed) {
        int n = problem.taskCount();
        int m = problem.vmCount();
        double[][] coreFree = Evaluator.newCores(problem);
        int[] mapping = new int[n];
        boolean[] assigned = new boolean[n];
        int remaining = n;
        double[] ready = new double[m];
        int[] winner = new int[m];
        double[] winnerSufferage = new double[m];

        while (remaining > 0) {
            for (int vm = 0; vm < m; vm++) {
                ready[vm] = coreFree[vm][Evaluator.earliestFreeCore(coreFree[vm])];
            }
            Arrays.fill(winner, -1);

            for (int task = 0; task < n; task++) {
                if (assigned[task]) {
                    continue;
                }
                int bestVm = 0;
                double first = Double.POSITIVE_INFINITY;
                double second = Double.POSITIVE_INFINITY;
                for (int vm = 0; vm < m; vm++) {
                    double completion = ready[vm] + problem.lengths()[task] / problem.vmMips()[vm];
                    if (completion < first) {
                        second = first;
                        first = completion;
                        bestVm = vm;
                    } else if (completion < second) {
                        second = completion;
                    }
                }
                double sufferage = m > 1 ? second - first : 0;
                if (winner[bestVm] < 0 || sufferage > winnerSufferage[bestVm]) {
                    winner[bestVm] = task;
                    winnerSufferage[bestVm] = sufferage;
                }
            }

            for (int vm = 0; vm < m; vm++) {
                int task = winner[vm];
                if (task < 0) {
                    continue;
                }
                int core = Evaluator.earliestFreeCore(coreFree[vm]);
                coreFree[vm][core] += problem.lengths()[task] / problem.vmMips()[vm];
                mapping[task] = vm;
                assigned[task] = true;
                remaining--;
            }
        }
        return new Result(mapping, List.of());
    }
}
