package soka.jaya.live;

import soka.jaya.Workloads;
import soka.jaya.schedulers.SimulatedAnnealing;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Stream;

/**
 * Pilihan yang tersedia untuk skenario kustom, dipakai wizard terminal dan validasi
 * {@link RunRequest}. Ukuran GoCJ dibaca dari file yang benar-benar ada di folder dataset.
 */
public record Catalog(List<Option> datasets, List<Integer> gocjSizes, int nasaMin, int nasaMax, int nasaHeavy,
                      List<Integer> vmCounts, List<Option> algorithms, int maxRuns,
                      int populationMin, int populationMax, int iterationsMin, int iterationsMax,
                      List<Option> tempos) {

    public record Option(String id, String name, String description) {
    }

    private static final Pattern GOCJ_FILE = Pattern.compile("GoCJ_Dataset_(\\d+)\\.txt");

    public static Catalog scan(Path dataDir) {
        List<Integer> sizes = gocjSizes(dataDir);
        List<Option> datasets = new ArrayList<>();
        if (!sizes.isEmpty()) {
            datasets.add(new Option("gocj", "GoCJ", "Google Cloud Jobs: ukuran job dalam MI, dari statistik trace Google"));
        }
        if (Files.isRegularFile(Workloads.nasaFile(dataDir))) {
            datasets.add(new Option("nasa", "NASA iPSC 1993", "Log nyata superkomputer NASA Ames, dataset paper Mishra dkk."));
        }
        List<Integer> vmCounts = new ArrayList<>();
        for (int vms = RunRequest.MIN_VMS; vms <= RunRequest.MAX_VMS; vms += RunRequest.VM_STEP) {
            vmCounts.add(vms);
        }
        return new Catalog(datasets, sizes, RunRequest.MIN_NASA_JOBS, Workloads.NASA_JOBS, RunRequest.HEAVY_NASA_JOBS,
                vmCounts,
                List.of(new Option("jaya", "JAYA", "Metaheuristik populasi (Rao, 2016)"),
                        new Option("sa", "SA", "Simulated Annealing, port branch CloudSim-SA"),
                        new Option("sufferage", "Sufferage", "Heuristik Maheswaran dkk. (1999)"),
                        new Option("rr", "Round Robin", "Baseline bergiliran")),
                RunRequest.MAX_RUNS, RunRequest.MIN_POPULATION, RunRequest.MAX_POPULATION,
                RunRequest.MIN_ITERATIONS, RunRequest.MAX_ITERATIONS,
                List.of(new Option("terlihat", "Terlihat", "Pencarian diberi jeda kecil, sekitar 2,5 detik per run, agar bisa diikuti mata"),
                        new Option("penuh", "Penuh", "Secepatnya, tanpa jeda")));
    }

    /** 1 solusi awal + 100 tetangga untuk setiap langkah suhu. */
    public static long saBudget() {
        return 1 + (long) SimulatedAnnealing.temperatureSteps() * SimulatedAnnealing.NEIGHBOURS_PER_TEMPERATURE;
    }

    public boolean hasDataset(String id) {
        return datasets.stream().anyMatch(dataset -> dataset.id().equals(id));
    }

    private static List<Integer> gocjSizes(Path dataDir) {
        Path dir = dataDir.resolve("gocj");
        if (!Files.isDirectory(dir)) {
            return List.of();
        }
        try (Stream<Path> files = Files.list(dir)) {
            return files.map(file -> GOCJ_FILE.matcher(file.getFileName().toString()))
                    .filter(Matcher::matches)
                    .map(matcher -> Integer.parseInt(matcher.group(1)))
                    .sorted()
                    .toList();
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }
}
