package soka.jaya.cli;

import java.nio.file.Path;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/** Parser argumen baris perintah {@code ./sim}. */
public final class Cli {
    public static final List<String> COMMANDS = List.of("help", "info", "run", "export-web", "interactive", "custom");
    public static final List<String> ALGORITHMS = List.of("jaya", "sa", "rr", "sufferage", "all");

    private static final Set<String> COMMON = Set.of("--data", "--out", "--web");
    /** Opsi yang berlaku untuk setiap perintah, selain {@link #COMMON}. */
    private static final Map<String, Set<String>> OPTIONS = Map.of(
            "help", Set.of(),
            "info", Set.of(),
            "export-web", Set.of(),
            "run", Set.of("--scenario", "--algo", "--runs", "--vm-order", "--no-web"),
            "interactive", Set.of("--plain"),
            "custom", Set.of("--dataset", "--tasks", "--vms", "--algo", "--runs", "--population", "--iterations", "--tempo",
                    "--plain"));
    /** Opsi {@code custom} yang langsung menjadi field {@link soka.jaya.live.RunRequest}. */
    private static final Set<String> REQUEST_FIELDS = Set.of("--dataset", "--tasks", "--vms", "--algo", "--runs",
            "--population", "--iterations", "--tempo");

    private Cli() {
    }

    /**
     * @param request field mentah skenario kustom ({@code custom}); divalidasi oleh RunRequest
     * @param plain   keluaran teks biasa tanpa blok live
     */
    public record Options(String command, String scenario, String algorithm, int runs, boolean sortVmsByMips,
                          boolean exportWeb, Path dataDir, Path outDir, Path webDir,
                          Map<String, String> request, boolean plain) {
    }

    public static Options parse(String[] args) {
        // Tanpa perintah (kosong atau langsung opsi, misalnya ./sim --plain) berarti wizard.
        boolean implicit = args.length == 0 || args[0].startsWith("--");
        String command = implicit ? "interactive" : args[0];
        int firstOption = implicit ? 0 : 1;
        if (!COMMANDS.contains(command)) {
            throw new IllegalArgumentException("Perintah tidak dikenal: " + command + " (pilihan: " + String.join(", ", COMMANDS) + ")");
        }

        Options defaults = defaults(command);
        String scenario = defaults.scenario();
        String algorithm = defaults.algorithm();
        int runs = defaults.runs();
        boolean sortVmsByMips = defaults.sortVmsByMips();
        boolean exportWeb = defaults.exportWeb();
        Path dataDir = defaults.dataDir();
        Path outDir = defaults.outDir();
        Path webDir = defaults.webDir();
        Map<String, String> request = new LinkedHashMap<>();
        boolean plain = false;

        for (int i = firstOption; i < args.length; i++) {
            String option = args[i];
            if (!COMMON.contains(option) && !OPTIONS.get(command).contains(option)) {
                if (OPTIONS.values().stream().anyMatch(options -> options.contains(option))) {
                    throw new IllegalArgumentException("Opsi " + option + " tidak berlaku untuk ./sim " + command + " (lihat ./sim help)");
                }
                throw new IllegalArgumentException("Opsi tidak dikenal: " + option + " (lihat ./sim help)");
            }
            if (command.equals("custom") && REQUEST_FIELDS.contains(option)) {
                request.put(option.substring(2), value(args, ++i, option));
                continue;
            }
            switch (option) {
                case "--no-web" -> exportWeb = false;
                case "--plain" -> plain = true;
                case "--scenario" -> scenario = value(args, ++i, option);
                case "--algo" -> algorithm = oneOf(value(args, ++i, option), ALGORITHMS, option);
                case "--runs" -> runs = positive(value(args, ++i, option), option);
                case "--vm-order" -> sortVmsByMips = oneOf(value(args, ++i, option), List.of("mips", "raw"), option).equals("mips");
                case "--data" -> dataDir = Path.of(value(args, ++i, option));
                case "--out" -> outDir = Path.of(value(args, ++i, option));
                case "--web" -> webDir = Path.of(value(args, ++i, option));
                default -> throw new IllegalStateException("Opsi belum ditangani: " + option);
            }
        }
        return new Options(command, scenario, algorithm, runs, sortVmsByMips, exportWeb, dataDir, outDir, webDir,
                Map.copyOf(request), plain);
    }

    private static Options defaults(String command) {
        return new Options(command, "all", "all", 10, true, true,
                Path.of("data"), Path.of("results"), Path.of("../public/data/cloudsim"),
                Map.of(), false);
    }

    private static String value(String[] args, int index, String option) {
        if (index >= args.length || args[index].startsWith("--")) {
            throw new IllegalArgumentException("Opsi " + option + " membutuhkan nilai");
        }
        return args[index];
    }

    private static String oneOf(String value, List<String> allowed, String option) {
        if (!allowed.contains(value)) {
            throw new IllegalArgumentException("Nilai " + option + " tidak dikenal: " + value + " (pilihan: " + String.join(", ", allowed) + ")");
        }
        return value;
    }

    private static int positive(String value, String option) {
        try {
            int number = Integer.parseInt(value);
            if (number < 1) {
                throw new IllegalArgumentException(option + " minimal 1, bukan " + value);
            }
            return number;
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException(option + " harus bilangan bulat, bukan " + value);
        }
    }
}
