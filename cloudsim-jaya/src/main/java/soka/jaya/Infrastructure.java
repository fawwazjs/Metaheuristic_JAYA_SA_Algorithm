package soka.jaya;

import java.util.ArrayList;
import java.util.List;

/**
 * Infrastruktur simulasi: desain Tugas 2A Kelompok 4 (2 datacenter, 20 host,
 * 50 VM) dengan spesifikasi VM dari rentang Tabel 2 Mishra dkk. (2022):
 * 500–1600 MIPS, 1–3 core, RAM 512 MB, storage 10.240 MB, BW 1024.
 */
public final class Infrastructure {
    public static final List<String> DATACENTERS = List.of("DC-Jakarta", "DC-Surabaya");
    public static final int HOSTS_PER_DATACENTER = 10;
    public static final int HOST_PES = 6;
    /** MIPS per core host, berurutan sesuai {@link #DATACENTERS}. */
    public static final List<Double> HOST_PE_MIPS = List.of(2000.0, 2500.0);
    public static final long HOST_RAM_MB = 16_384;
    public static final long HOST_BW = 10_000;
    public static final long HOST_STORAGE_MB = 1_048_576;

    /**
     * Detik simulasi antar-pembaruan eksekusi cloudlet di datacenter. Tanpa interval, CloudSim
     * kadang terlambat puluhan detik mendeteksi cloudlet yang selesai. Nilai yang lebih besar
     * (8,7 dan 874 detik) sudah dicoba dan membuat sebagian besar cloudlet NASA tidak selesai.
     */
    public static final double SCHEDULING_INTERVAL = 1.0;

    public static final long VM_RAM_MB = 512;
    public static final long VM_BW = 1024;
    public static final long VM_STORAGE_MB = 10_240;

    public static final List<VmType> VM_TYPES = List.of(
            new VmType("V1", 500, 1),
            new VmType("V2", 800, 1),
            new VmType("V3", 1000, 2),
            new VmType("V4", 1300, 2),
            new VmType("V5", 1600, 3));

    private Infrastructure() {
    }

    public record VmType(String name, double mips, int pes) {
    }

    /** {@code datacenter} adalah indeks pada {@link #DATACENTERS}. */
    public record VmSpec(int index, VmType type, int datacenter) {
    }

    /**
     * VM ke-i bertipe {@code i mod 5} dan berada di datacenter {@code i mod 2}, sehingga
     * setiap kelipatan 10 VM berisi 2 VM per tipe dan terbagi rata ke kedua datacenter.
     */
    public static List<VmSpec> vms(int count) {
        if (count < 10 || count % 10 != 0) {
            throw new IllegalArgumentException("Jumlah VM harus kelipatan 10 (10–50), bukan " + count);
        }
        List<VmSpec> vms = new ArrayList<>(count);
        for (int i = 0; i < count; i++) {
            vms.add(new VmSpec(i, VM_TYPES.get(i % VM_TYPES.size()), i % DATACENTERS.size()));
        }
        return vms;
    }

    public static Problem problem(long[] lengths, List<VmSpec> vms) {
        double[] mips = new double[vms.size()];
        int[] pes = new int[vms.size()];
        for (VmSpec vm : vms) {
            mips[vm.index()] = vm.type().mips();
            pes[vm.index()] = vm.type().pes();
        }
        return new Problem(lengths, mips, pes);
    }
}
