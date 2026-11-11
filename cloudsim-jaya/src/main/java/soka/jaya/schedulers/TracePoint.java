package soka.jaya.schedulers;

/**
 * Satu titik riwayat pencarian. {@code vmFinish} hanya diisi pada iterasi yang
 * disampel untuk replay; selain itu null.
 */
public record TracePoint(int iteration, long evaluations, double best, double worst, double[] vmFinish) {
}
