package soka.jaya.schedulers;

import java.util.function.Supplier;

/**
 * Keadaan pencarian setelah satu iterasi (JAYA) atau satu langkah suhu (SA), dikirim ke
 * {@link SearchListener}. Iterasi 0 adalah keadaan awal sebelum pembaruan pertama.
 *
 * @param best      makespan P_best (JAYA) atau solusi terbaik sejauh ini (SA)
 * @param worst     makespan P_worst (JAYA) atau solusi yang sedang dipegang (SA)
 * @param bestLoads waktu selesai tiap VM untuk solusi terbaik; dihitung hanya bila dipanggil,
 *                  dan hanya sah dipanggil di dalam callback
 */
public record SearchStep(int iteration, int totalIterations, long evaluations, double best, double worst,
                         Supplier<double[]> bestLoads) {
}
