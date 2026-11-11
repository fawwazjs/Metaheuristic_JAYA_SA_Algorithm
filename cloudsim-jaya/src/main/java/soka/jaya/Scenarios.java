package soka.jaya;

import java.util.ArrayList;
import java.util.List;

/**
 * Skenario meniru dua test case Mishra dkk. (2022) dalam skala desain tim:
 * TC1 memvariasikan jumlah task (VM tetap), TC2 memvariasikan jumlah VM (task
 * tetap 750 seperti paper), ditambah satu skenario dataset paper (NASA iPSC).
 */
public final class Scenarios {
    private Scenarios() {
    }

    public static List<Scenario> select(String group) {
        List<Scenario> scenarios = new ArrayList<>();
        if (group.equals("all") || group.equals("tc1")) {
            for (int tasks = 100; tasks <= 1000; tasks += 100) {
                scenarios.add(scenario("tc1", "gocj", tasks, 50));
            }
        }
        if (group.equals("all") || group.equals("tc2")) {
            for (int vms = 10; vms <= 50; vms += 10) {
                scenarios.add(scenario("tc2", "gocj", 750, vms));
            }
        }
        if (group.equals("all") || group.equals("nasa")) {
            scenarios.add(scenario("nasa", "nasa", 750, 50));
        }
        if (scenarios.isEmpty()) {
            throw new IllegalArgumentException("Skenario tidak dikenal: " + group + " (pilihan: tc1, tc2, nasa, all)");
        }
        return scenarios;
    }

    private static Scenario scenario(String group, String dataset, int tasks, int vms) {
        return new Scenario(group + "-" + tasks + "x" + vms, group, dataset, tasks, vms);
    }
}
