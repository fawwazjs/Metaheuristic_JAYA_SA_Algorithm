package soka.jaya;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.zip.ZipEntry;
import java.util.zip.ZipFile;

/** Pemuat dataset: GoCJ (ukuran job dalam MI) dan NASA iPSC 1993 (format SWF). */
public final class Workloads {
    /** Jumlah job pada log NASA-iPSC-1993-3.1 versi cleaned. */
    public static final int NASA_JOBS = 18239;
    /** MIPS acuan untuk mengubah detik pada log NASA menjadi MI. */
    public static final int NASA_REFERENCE_MIPS = 1000;

    private static final String NASA_FILE = "NASA-iPSC-1993-3.1-cln.swf.zip";
    private static final int SWF_RUN_TIME = 3;
    private static final int SWF_ALLOCATED_PROCS = 4;
    private static final int SWF_REQUESTED_PROCS = 7;

    private Workloads() {
    }

    /** Membaca {@code GoCJ_Dataset_<size>.txt} sesuai urutan yang dipublikasikan. */
    public static long[] gocj(Path dataDir, int size) {
        Path file = dataDir.resolve("gocj").resolve("GoCJ_Dataset_" + size + ".txt");
        if (!Files.isRegularFile(file)) {
            throw new IllegalArgumentException("Dataset GoCJ " + size + " tidak ditemukan: " + file);
        }
        try {
            long[] lengths = Files.readAllLines(file).stream()
                    .map(String::trim)
                    .filter(line -> !line.isEmpty())
                    .mapToLong(Long::parseLong)
                    .toArray();
            if (lengths.length != size) {
                throw new IllegalStateException(file + " berisi " + lengths.length + " job, seharusnya " + size);
            }
            return lengths;
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    /** Lokasi arsip log NASA iPSC di folder dataset. */
    public static Path nasaFile(Path dataDir) {
        return dataDir.resolve("nasa").resolve(NASA_FILE);
    }

    /**
     * Membaca {@code count} job pertama log NASA iPSC.
     *
     * <p>Mengikuti {@code SwfWorkloadFileReader} CloudSim Plus: runtime minimal 1 detik
     * dan jumlah prosesor = max(diminta, dialokasikan, 1). Karena VM di sini hanya
     * 1–3 core, job multi-prosesor dilipat menjadi satu cloudlet 1-core dengan
     * panjang {@code runtime × prosesor × 1000 MI}.
     */
    public static long[] nasa(Path dataDir, int count) {
        Path file = nasaFile(dataDir);
        if (count < 1 || count > NASA_JOBS) {
            throw new IllegalArgumentException("Jumlah job NASA harus 1.." + NASA_JOBS + ", bukan " + count);
        }
        List<Long> lengths = new ArrayList<>(count);
        try (ZipFile zip = new ZipFile(file.toFile())) {
            ZipEntry entry = zip.entries().nextElement();
            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(zip.getInputStream(entry), StandardCharsets.US_ASCII))) {
                String line;
                while (lengths.size() < count && (line = reader.readLine()) != null) {
                    line = line.trim();
                    if (line.isEmpty() || line.startsWith(";")) {
                        continue;
                    }
                    String[] fields = line.split("\\s+");
                    long runTime = Math.max((long) Double.parseDouble(fields[SWF_RUN_TIME]), 1);
                    long procs = Math.max(Math.max(Long.parseLong(fields[SWF_REQUESTED_PROCS]),
                            Long.parseLong(fields[SWF_ALLOCATED_PROCS])), 1);
                    lengths.add(runTime * procs * NASA_REFERENCE_MIPS);
                }
            }
        } catch (IOException e) {
            throw new UncheckedIOException("Gagal membaca " + file, e);
        }
        return lengths.stream().mapToLong(Long::longValue).toArray();
    }
}
