package soka.jaya.live;

import soka.jaya.Experiment;
import soka.jaya.Scenario;
import soka.jaya.schedulers.Jaya;
import soka.jaya.schedulers.RoundRobin;
import soka.jaya.schedulers.SimulatedAnnealing;
import soka.jaya.schedulers.Sufferage;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Permintaan satu skenario kustom. Satu-satunya tempat validasi parameter: wizard terminal
 * dan {@code ./sim custom} sama-sama lewat {@link #parse}.
 *
 * <p>Nama field ({@link #FIELDS}) sama dengan nama opsi {@code ./sim custom --<field>}.
 *
 * @param algorithms id algoritma dalam urutan tampilan (jaya, sa, sufferage, rr)
 * @param runs       jumlah seed untuk algoritma stokastik (JAYA, SA)
 * @param tempo      {@code terlihat}: pencarian diberi jeda agar bisa diikuti; {@code penuh}: tanpa jeda
 */
public record RunRequest(String dataset, int tasks, int vms, List<String> algorithms, int runs, int population,
                         int iterations, String tempo) {

    public static final List<String> FIELDS = List.of("dataset", "tasks", "vms", "algo", "runs", "population",
            "iterations", "tempo");
    public static final List<String> ALGORITHMS = List.of("jaya", "sa", "sufferage", "rr");
    public static final List<String> TEMPOS = List.of("terlihat", "penuh");
    public static final int MIN_NASA_JOBS = 50;
    /** Di atas ini validasi CloudSim NASA bisa memakan beberapa menit per run. */
    public static final int HEAVY_NASA_JOBS = 2000;
    public static final int MIN_VMS = 10;
    public static final int MAX_VMS = 50;
    public static final int VM_STEP = 10;
    public static final int MAX_RUNS = 10;
    public static final int MIN_POPULATION = 5;
    public static final int MAX_POPULATION = 100;
    public static final int MIN_ITERATIONS = 10;
    public static final int MAX_ITERATIONS = 3000;
    /** Selisih anggaran evaluasi JAYA terhadap SA yang masih dianggap setara. */
    private static final double BUDGET_TOLERANCE = 0.05;
    private static final Locale ID = Locale.forLanguageTag("id-ID");

    public RunRequest {
        algorithms = List.copyOf(algorithms);
    }

    /** Hasil {@link #parse}: {@code request} null bila ada kesalahan. */
    public record Parsed(RunRequest request, List<String> errors, List<String> warnings) {
    }

    public static RunRequest defaults() {
        return new RunRequest("gocj", 750, 50, ALGORITHMS, 3, Jaya.DEFAULT_POPULATION, Jaya.DEFAULT_ITERATIONS, "terlihat");
    }

    /** Membaca field teks (form web, opsi CLI, atau file properties); field yang kosong memakai nilai bawaan. */
    public static Parsed parse(Map<String, String> fields, Catalog catalog) {
        List<String> errors = new ArrayList<>();
        for (String key : fields.keySet()) {
            if (!FIELDS.contains(key)) {
                errors.add("Parameter tidak dikenal: " + key + " (pilihan: " + String.join(", ", FIELDS) + ")");
            }
        }
        RunRequest defaults = defaults();
        Map<String, String> values = new LinkedHashMap<>(defaults.fields());
        fields.forEach((key, value) -> {
            if (value != null && !value.isBlank()) {
                values.put(key, value.trim());
            }
        });

        String dataset = values.get("dataset").toLowerCase(Locale.ROOT);
        if (!catalog.hasDataset(dataset)) {
            errors.add("Dataset tidak dikenal: " + dataset + " (pilihan: "
                    + String.join(", ", catalog.datasets().stream().map(Catalog.Option::id).toList()) + ")");
        }
        int tasks = integer(values, "tasks", "Jumlah task", errors);
        if (tasks > 0 && dataset.equals("gocj") && !catalog.gocjSizes().contains(tasks)) {
            errors.add("GoCJ tidak punya file untuk " + tasks + " task (pilihan: "
                    + String.join(", ", catalog.gocjSizes().stream().map(String::valueOf).toList()) + ")");
        }
        if (tasks > 0 && dataset.equals("nasa") && (tasks < catalog.nasaMin() || tasks > catalog.nasaMax())) {
            errors.add(String.format(ID, "Jumlah job NASA harus %d–%,d, bukan %d", catalog.nasaMin(), catalog.nasaMax(), tasks));
        }
        int vms = integer(values, "vms", "Jumlah VM", errors);
        if (vms > 0 && (vms < MIN_VMS || vms > MAX_VMS || vms % VM_STEP != 0)) {
            errors.add("Jumlah VM harus kelipatan " + VM_STEP + " dalam rentang " + MIN_VMS + "–" + MAX_VMS + ", bukan " + vms);
        }
        List<String> algorithms = algorithms(values.get("algo"), errors);
        int runs = integer(values, "runs", "Jumlah seed", errors);
        if (runs > 0 && runs > MAX_RUNS) {
            errors.add("Jumlah seed harus 1–" + MAX_RUNS + ", bukan " + runs);
        }
        int population = integer(values, "population", "Populasi JAYA", errors);
        if (population > 0 && (population < MIN_POPULATION || population > MAX_POPULATION)) {
            errors.add("Populasi JAYA harus " + MIN_POPULATION + "–" + MAX_POPULATION + ", bukan " + population);
        }
        int iterations = integer(values, "iterations", "Iterasi JAYA", errors);
        if (iterations > 0 && (iterations < MIN_ITERATIONS || iterations > MAX_ITERATIONS)) {
            errors.add(String.format(ID, "Iterasi JAYA harus %d–%,d, bukan %d", MIN_ITERATIONS, MAX_ITERATIONS, iterations));
        }
        String tempo = values.get("tempo").toLowerCase(Locale.ROOT);
        if (!TEMPOS.contains(tempo)) {
            errors.add("Tempo tidak dikenal: " + tempo + " (pilihan: " + String.join(", ", TEMPOS) + ")");
        }

        if (!errors.isEmpty()) {
            return new Parsed(null, List.copyOf(errors), List.of());
        }
        // Parameter yang tidak berlaku untuk algoritma terpilih kembali ke bawaan, supaya perintah
        // setara, label, dan hasil tersimpan tidak menyebut setelan yang tidak dipakai.
        if (!algorithms.contains("jaya")) {
            population = defaults.population();
            iterations = defaults.iterations();
        }
        if (!algorithms.contains("jaya") && !algorithms.contains("sa")) {
            runs = defaults.runs();
            tempo = defaults.tempo();
        }
        RunRequest request = new RunRequest(dataset, tasks, vms, algorithms, runs, population, iterations, tempo);
        return new Parsed(request, List.of(), request.warnings());
    }

    public List<String> warnings() {
        List<String> warnings = new ArrayList<>();
        if (dataset.equals("nasa") && tasks > HEAVY_NASA_JOBS) {
            warnings.add(String.format(ID, "NASA %,d job tergolong besar: validasi CloudSim per run bisa memakan beberapa menit.", tasks));
        }
        long sa = Catalog.saBudget();
        if (algorithms.contains("jaya") && Math.abs(jayaEvaluations() - sa) > BUDGET_TOLERANCE * sa) {
            warnings.add(String.format(ID, "Anggaran JAYA %,d evaluasi, sedangkan SA %,d: perbandingan JAYA dan SA tidak lagi setara.",
                    jayaEvaluations(), sa));
        }
        return warnings;
    }

    /** Populasi awal + populasi × iterasi. */
    public long jayaEvaluations() {
        return (long) population * (iterations + 1);
    }

    /** Field teks lengkap; kebalikan dari {@link #parse}. */
    public Map<String, String> fields() {
        Map<String, String> fields = new LinkedHashMap<>();
        fields.put("dataset", dataset);
        fields.put("tasks", String.valueOf(tasks));
        fields.put("vms", String.valueOf(vms));
        fields.put("algo", algorithms.equals(ALGORITHMS) ? "all" : String.join(",", algorithms));
        fields.put("runs", String.valueOf(runs));
        fields.put("population", String.valueOf(population));
        fields.put("iterations", String.valueOf(iterations));
        fields.put("tempo", tempo);
        return fields;
    }

    /**
     * Perintah terminal yang menjalankan permintaan yang sama. Parameter JAYA dan tempo bernilai
     * bawaan tidak ditulis, begitu juga jumlah seed bila tidak ada algoritma stokastik.
     */
    public String equivalentCommand() {
        RunRequest defaults = defaults();
        StringBuilder command = new StringBuilder("./sim custom");
        boolean seeded = algorithms.stream().anyMatch(this::stochastic);
        fields().forEach((key, value) -> {
            boolean optional = key.equals("population") || key.equals("iterations") || key.equals("tempo")
                    || (key.equals("runs") && !seeded);
            if (!optional || !value.equals(defaults.fields().get(key))) {
                command.append(" --").append(key).append(' ').append(value);
            }
        });
        return command.toString();
    }

    public boolean stochastic(String algorithm) {
        return algorithm.equals("jaya") || algorithm.equals("sa");
    }

    public int runCount() {
        return algorithms.stream().mapToInt(algorithm -> stochastic(algorithm) ? runs : 1).sum();
    }

    public List<Experiment.Algorithm> algorithmsToRun() {
        List<Experiment.Algorithm> out = new ArrayList<>();
        for (String algorithm : algorithms) {
            out.add(switch (algorithm) {
                case "jaya" -> new Experiment.Algorithm(() -> new Jaya(population, iterations), true);
                case "sa" -> new Experiment.Algorithm(SimulatedAnnealing::new, true);
                case "sufferage" -> new Experiment.Algorithm(Sufferage::new, false);
                case "rr" -> new Experiment.Algorithm(RoundRobin::new, false);
                default -> throw new IllegalStateException("Algoritma tidak dikenal: " + algorithm);
            });
        }
        return out;
    }

    public Scenario scenario() {
        return new Scenario(dataset + "-" + tasks + "x" + vms, "custom", dataset, tasks, vms);
    }

    private static List<String> algorithms(String value, List<String> errors) {
        String normalized = value.toLowerCase(Locale.ROOT).replace(" ", "");
        if (normalized.equals("all") || normalized.equals("semua")) {
            return ALGORITHMS;
        }
        List<String> chosen = new ArrayList<>();
        for (String name : normalized.split(",")) {
            if (name.isEmpty()) {
                continue;
            }
            if (!ALGORITHMS.contains(name)) {
                errors.add("Algoritma tidak dikenal: " + name + " (pilihan: " + String.join(", ", ALGORITHMS) + ", all)");
            } else if (!chosen.contains(name)) {
                chosen.add(name);
            }
        }
        if (chosen.isEmpty() && errors.isEmpty()) {
            errors.add("Pilih minimal satu algoritma");
        }
        return ALGORITHMS.stream().filter(chosen::contains).toList();
    }

    /** Bilangan bulat positif; 0 menandakan nilai tidak valid (kesalahannya sudah dicatat). */
    private static int integer(Map<String, String> values, String key, String label, List<String> errors) {
        String value = values.get(key);
        try {
            int number = Integer.parseInt(value);
            if (number < 1) {
                errors.add(label + " minimal 1, bukan " + value);
                return 0;
            }
            return number;
        } catch (NumberFormatException e) {
            errors.add(label + " harus bilangan bulat, bukan " + value);
            return 0;
        }
    }
}
