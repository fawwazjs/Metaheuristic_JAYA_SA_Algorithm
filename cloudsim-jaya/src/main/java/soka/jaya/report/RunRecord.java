package soka.jaya.report;

/**
 * Hasil satu run (skenario × algoritma × seed); satu baris di runs.csv.
 *
 * @param jobBound        batas bawah makespan dari job terbesar: panjang job terbesar ÷ MIPS VM tercepat
 * @param gapPercent      selisih makespan CloudSim terhadap evaluator, dalam persen
 * @param lastImprovement iterasi terakhir saat solusi terbaik membaik (0 untuk heuristik)
 * @param finished        jumlah cloudlet berstatus SUCCESS di CloudSim
 */
public record RunRecord(String scenario, String group, String dataset, int tasks, int vms, double jobBound,
                        String algorithm, int seed,
                        double makespanEval, double makespanCloudSim, double gapPercent, double aru, double throughput,
                        double doi, double avgResponse, double avgWaiting, double energy, long runtimeMs,
                        int lastImprovement, int finished) {
}
