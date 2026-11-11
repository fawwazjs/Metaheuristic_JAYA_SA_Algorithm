package soka.jaya;

/**
 * Masalah penjadwalan: panjang setiap cloudlet (MI) dan kemampuan setiap VM.
 * Indeks VM di sini adalah indeks VM yang sama di CloudSim.
 */
public record Problem(long[] lengths, double[] vmMips, int[] vmPes) {

    public Problem {
        if (vmMips.length != vmPes.length) {
            throw new IllegalArgumentException("vmMips dan vmPes harus sama panjang");
        }
    }

    public int taskCount() {
        return lengths.length;
    }

    public int vmCount() {
        return vmMips.length;
    }

    /** Makespan tidak bisa lebih kecil dari waktu job terbesar di VM tercepat (cloudlet 1-core). */
    public double jobBound() {
        long longest = 0;
        for (long length : lengths) {
            longest = Math.max(longest, length);
        }
        double fastest = 0;
        for (double mips : vmMips) {
            fastest = Math.max(fastest, mips);
        }
        return longest / fastest;
    }
}
