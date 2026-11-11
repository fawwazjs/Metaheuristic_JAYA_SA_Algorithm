package soka.jaya.live;

import soka.jaya.Evaluator;
import soka.jaya.Infrastructure;
import soka.jaya.Problem;
import soka.jaya.schedulers.RoundRobin;

import java.util.ArrayList;
import java.util.List;

/**
 * Perkiraan kasar lama simulasi, sebelum dijalankan. Konstanta diukur di laptop
 * pengembang (November 2026) dan hanya berlaku sebagai orde besaran:
 * <ul>
 *   <li>pencarian JAYA ≈ 2,8e-8 detik per (task × evaluasi), SA ≈ 8e-9, Sufferage ≈ 8,5e-10 × n² × m;</li>
 *   <li>validasi CloudSim ≈ 0,1 detik + makespan simulasi × (8,5e-6 + 1e-8 × n) detik, karena
 *       datacenter diperbarui setiap 1 detik waktu simulasi dan antrean makin panjang dengan n.</li>
 * </ul>
 * Makespan Round Robin dihitung persis; algoritma lain diperkirakan dari batas bawah
 * (job terbesar atau beban total ÷ kapasitas) dikali faktor yang teramati pada GoCJ dan NASA.
 *
 * @param perRun perkiraan detik setiap run, urutannya sama dengan urutan run di Experiment
 */
public record Estimate(List<Double> perRun) {
    public static final double OVERHEAD_SECONDS = 0.5;
    private static final double JAYA_SECONDS_PER_TASK_EVALUATION = 2.8e-8;
    private static final double SA_SECONDS_PER_TASK_EVALUATION = 8e-9;
    private static final double SUFFERAGE_SECONDS_PER_N2M = 8.5e-10;
    private static final double CLOUDSIM_FIXED_SECONDS = 0.1;
    private static final double CLOUDSIM_SECONDS_PER_SIM_SECOND = 8.5e-6;
    private static final double CLOUDSIM_SECONDS_PER_SIM_SECOND_PER_TASK = 1e-8;

    public Estimate {
        perRun = List.copyOf(perRun);
    }

    public static Estimate of(RunRequest request, long[] lengths) {
        Problem problem = Infrastructure.problem(lengths, Infrastructure.vms(request.vms()));
        int n = problem.taskCount();
        int m = problem.vmCount();
        double loadBound = loadBound(problem);
        double jobBound = problem.jobBound();
        double roundRobin = Evaluator.makespan(problem, new RoundRobin().schedule(problem, 1).mapping());
        boolean visible = request.tempo().equals("terlihat");

        List<Double> perRun = new ArrayList<>();
        for (String algorithm : request.algorithms()) {
            double search = switch (algorithm) {
                case "jaya" -> JAYA_SECONDS_PER_TASK_EVALUATION * n * request.jayaEvaluations();
                case "sa" -> SA_SECONDS_PER_TASK_EVALUATION * n * Catalog.saBudget();
                case "sufferage" -> SUFFERAGE_SECONDS_PER_N2M * n * (double) n * m;
                default -> 0;
            };
            if (visible && request.stochastic(algorithm)) {
                search = Math.max(search, LiveSession.VISIBLE_SECONDS_PER_SEARCH);
            }
            double makespan = switch (algorithm) {
                case "rr" -> roundRobin;
                case "jaya" -> Math.max(jobBound, 2.5 * loadBound);
                case "sufferage" -> Math.max(jobBound, 1.3 * loadBound);
                default -> Math.max(jobBound, 1.2 * loadBound);
            };
            double cloudsim = CLOUDSIM_FIXED_SECONDS
                    + makespan * (CLOUDSIM_SECONDS_PER_SIM_SECOND + CLOUDSIM_SECONDS_PER_SIM_SECOND_PER_TASK * n);
            int runs = request.stochastic(algorithm) ? request.runs() : 1;
            for (int run = 0; run < runs; run++) {
                perRun.add(search + cloudsim);
            }
        }
        return new Estimate(perRun);
    }

    public double totalSeconds() {
        return OVERHEAD_SECONDS + remainingAfter(0);
    }

    /** Perkiraan sisa detik setelah {@code done} run pertama selesai. */
    public double remainingAfter(int done) {
        double remaining = 0;
        for (int i = done; i < perRun.size(); i++) {
            remaining += perRun.get(i);
        }
        return remaining;
    }

    /** Makespan minimum bila beban terbagi sempurna sesuai kapasitas (MIPS × core) setiap VM. */
    private static double loadBound(Problem problem) {
        double total = 0;
        for (long length : problem.lengths()) {
            total += length;
        }
        double capacity = 0;
        for (int vm = 0; vm < problem.vmCount(); vm++) {
            capacity += problem.vmMips()[vm] * problem.vmPes()[vm];
        }
        return total / capacity;
    }
}
