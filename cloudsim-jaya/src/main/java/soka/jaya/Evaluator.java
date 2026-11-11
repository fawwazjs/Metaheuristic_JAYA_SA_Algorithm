package soka.jaya;

/**
 * Menghitung jadwal dari sebuah pemetaan tanpa menjalankan CloudSim.
 *
 * <p>Modelnya sama dengan {@code CloudletSchedulerSpaceShared} di CloudSim Plus:
 * setiap VM punya k core, antrean berjalan FIFO menurut urutan cloudlet, dan
 * setiap cloudlet 1-core masuk ke core yang paling cepat kosong. Hasilnya
 * dicocokkan dengan CloudSim di {@code CloudSimRunnerTest}.
 */
public final class Evaluator {
    private Evaluator() {
    }

    public static Schedule evaluate(Problem problem, int[] mapping) {
        int n = problem.taskCount();
        int m = problem.vmCount();
        double[][] coreFree = newCores(problem);
        double[] start = new double[n];
        double[] finish = new double[n];
        double[] vmFinish = new double[m];
        double[] vmBusy = new double[m];
        double makespan = 0;

        for (int i = 0; i < n; i++) {
            int vm = mapping[i];
            double[] cores = coreFree[vm];
            int core = earliestFreeCore(cores);
            double runtime = problem.lengths()[i] / problem.vmMips()[vm];
            start[i] = cores[core];
            finish[i] = start[i] + runtime;
            cores[core] = finish[i];
            vmFinish[vm] = Math.max(vmFinish[vm], finish[i]);
            // Waktu sibuk rata-rata per core, supaya VM multi-core sebanding dengan VM 1-core.
            vmBusy[vm] += runtime / problem.vmPes()[vm];
            makespan = Math.max(makespan, finish[i]);
        }
        return new Schedule(start, finish, vmFinish, vmBusy, makespan);
    }

    /** Versi ringkas {@link #evaluate} untuk fungsi fitness: hanya makespan. */
    public static double makespan(Problem problem, int[] mapping) {
        double[][] coreFree = newCores(problem);
        double makespan = 0;
        for (int i = 0; i < mapping.length; i++) {
            int vm = mapping[i];
            double[] cores = coreFree[vm];
            int core = earliestFreeCore(cores);
            cores[core] += problem.lengths()[i] / problem.vmMips()[vm];
            makespan = Math.max(makespan, cores[core]);
        }
        return makespan;
    }

    /** Waktu kosong setiap core per VM, semuanya 0 di awal. */
    public static double[][] newCores(Problem problem) {
        double[][] cores = new double[problem.vmCount()][];
        for (int vm = 0; vm < cores.length; vm++) {
            cores[vm] = new double[problem.vmPes()[vm]];
        }
        return cores;
    }

    /** Indeks core yang paling cepat kosong (FIFO space-shared). */
    public static int earliestFreeCore(double[] cores) {
        int best = 0;
        for (int core = 1; core < cores.length; core++) {
            if (cores[core] < cores[best]) {
                best = core;
            }
        }
        return best;
    }
}
