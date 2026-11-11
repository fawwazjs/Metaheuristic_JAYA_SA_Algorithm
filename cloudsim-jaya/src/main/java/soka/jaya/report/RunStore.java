package soka.jaya.report;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Menyimpan hasil setiap run di {@code results/runs.csv}.
 *
 * <p>Run baru menggantikan semua seed lama dari pasangan (skenario, algoritma) yang
 * sama, sementara skenario lain tetap disimpan. Jadi menjalankan ulang satu
 * skenario tidak menghapus hasil skenario lain di website.
 */
public final class RunStore {
    static final String HEADER = "scenario,group,dataset,tasks,vms,job_bound,algorithm,seed,makespan_eval,makespan_cloudsim,"
            + "gap_percent,aru,throughput,doi,avg_response,avg_waiting,energy,runtime_ms,last_improvement_iter,finished";

    private RunStore() {
    }

    public static List<RunRecord> merge(List<RunRecord> existing, List<RunRecord> fresh) {
        Set<String> rerun = new HashSet<>();
        for (RunRecord record : fresh) {
            rerun.add(key(record));
        }
        List<RunRecord> merged = new ArrayList<>();
        for (RunRecord record : existing) {
            if (!rerun.contains(key(record))) {
                merged.add(record);
            }
        }
        merged.addAll(fresh);
        return merged;
    }

    public static void write(Path file, List<RunRecord> records) {
        List<String> lines = new ArrayList<>(records.size() + 1);
        lines.add(HEADER);
        for (RunRecord r : records) {
            lines.add(String.join(",", r.scenario(), r.group(), r.dataset(), String.valueOf(r.tasks()),
                    String.valueOf(r.vms()), String.valueOf(r.jobBound()), r.algorithm(), String.valueOf(r.seed()),
                    String.valueOf(r.makespanEval()), String.valueOf(r.makespanCloudSim()),
                    String.valueOf(r.gapPercent()), String.valueOf(r.aru()), String.valueOf(r.throughput()),
                    String.valueOf(r.doi()), String.valueOf(r.avgResponse()), String.valueOf(r.avgWaiting()),
                    String.valueOf(r.energy()), String.valueOf(r.runtimeMs()), String.valueOf(r.lastImprovement()),
                    String.valueOf(r.finished())));
        }
        Output.writeLines(file, lines);
    }

    public static List<RunRecord> read(Path file) {
        if (!Files.isRegularFile(file)) {
            return List.of();
        }
        try {
            List<String> lines = Files.readAllLines(file);
            if (lines.isEmpty() || !lines.get(0).equals(HEADER)) {
                throw new IllegalStateException(file + " bukan file runs.csv dengan format yang dikenali");
            }
            List<RunRecord> records = new ArrayList<>();
            for (String line : lines.subList(1, lines.size())) {
                if (line.isBlank()) {
                    continue;
                }
                String[] f = line.split(",", -1);
                records.add(new RunRecord(f[0], f[1], f[2], Integer.parseInt(f[3]), Integer.parseInt(f[4]),
                        Double.parseDouble(f[5]), f[6], Integer.parseInt(f[7]), Double.parseDouble(f[8]),
                        Double.parseDouble(f[9]), Double.parseDouble(f[10]), Double.parseDouble(f[11]),
                        Double.parseDouble(f[12]), Double.parseDouble(f[13]), Double.parseDouble(f[14]),
                        Double.parseDouble(f[15]), Double.parseDouble(f[16]), Long.parseLong(f[17]),
                        Integer.parseInt(f[18]), Integer.parseInt(f[19])));
            }
            return records;
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    private static String key(RunRecord record) {
        return record.scenario() + "|" + record.algorithm();
    }
}
