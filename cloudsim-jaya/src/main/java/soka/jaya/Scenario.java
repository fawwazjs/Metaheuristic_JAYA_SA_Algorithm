package soka.jaya;

import java.nio.file.Path;

/**
 * Satu titik eksperimen.
 *
 * @param group   tc1 (jumlah task bervariasi), tc2 (jumlah VM bervariasi), atau nasa
 * @param dataset gocj atau nasa
 */
public record Scenario(String id, String group, String dataset, int tasks, int vms) {

    public long[] lengths(Path dataDir) {
        return dataset.equals("nasa") ? Workloads.nasa(dataDir, tasks) : Workloads.gocj(dataDir, tasks);
    }
}
