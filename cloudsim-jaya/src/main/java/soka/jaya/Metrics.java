package soka.jaya;

/**
 * Metrik evaluasi, mengikuti persamaan di Mishra dkk. (2022) dan metrics.py tugas heuristik.
 *
 * @param makespan    waktu selesai cloudlet terakhir, Eq. 17 (detik)
 * @param aru         rata-rata utilisasi VM, Eq. 18–19: RU_j = waktu sibuk_j / makespan (0..1)
 * @param throughput  jumlah cloudlet per detik (n / makespan)
 * @param doi         degree of imbalance: (T_max − T_min) / T_rata-rata atas waktu selesai VM
 * @param avgResponse rata-rata waktu selesai sejak submit (semua submit di t=0)
 * @param avgWaiting  rata-rata waktu tunggu sebelum mulai
 * @param energy      indeks energi Eq. 23–24 dengan γ=0,7 (aktif) dan δ=0,3 (idle), satuan mengikuti paper
 */
public record Metrics(double makespan, double aru, double throughput, double doi,
                      double avgResponse, double avgWaiting, double energy) {

    static final double ACTIVE_ENERGY = 0.7;
    static final double IDLE_ENERGY = 0.3;

    public static Metrics of(Problem problem, Schedule schedule) {
        double makespan = schedule.makespan();
        int m = problem.vmCount();
        int n = problem.taskCount();

        double ruSum = 0;
        double energy = 0;
        for (int vm = 0; vm < m; vm++) {
            double busy = schedule.vmBusy()[vm];
            double ru = busy / makespan;
            ruSum += ru;
            energy += (busy * ACTIVE_ENERGY + (makespan - busy) * IDLE_ENERGY) * ru;
        }

        double maxFinish = Double.NEGATIVE_INFINITY;
        double minFinish = Double.POSITIVE_INFINITY;
        double sumFinish = 0;
        for (double finish : schedule.vmFinish()) {
            maxFinish = Math.max(maxFinish, finish);
            minFinish = Math.min(minFinish, finish);
            sumFinish += finish;
        }
        double avgVmFinish = sumFinish / m;

        double responseSum = 0;
        double waitingSum = 0;
        for (int i = 0; i < n; i++) {
            responseSum += schedule.finish()[i];
            waitingSum += schedule.start()[i];
        }

        return new Metrics(makespan, ruSum / m, n / makespan,
                avgVmFinish == 0 ? 0 : (maxFinish - minFinish) / avgVmFinish,
                responseSum / n, waitingSum / n, energy);
    }
}
