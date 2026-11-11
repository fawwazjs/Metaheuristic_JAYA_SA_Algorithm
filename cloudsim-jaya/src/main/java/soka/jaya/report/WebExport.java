package soka.jaya.report;

import soka.jaya.Experiment;
import soka.jaya.Infrastructure;
import soka.jaya.schedulers.Jaya;
import soka.jaya.schedulers.SimulatedAnnealing;
import soka.jaya.schedulers.TracePoint;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;

/**
 * Menulis data untuk halaman {@code /cloudsim/}: {@code summary.json} (semua skenario)
 * dan {@code replay/<skenario>.json} (jejak pencarian seed 1 untuk animasi).
 */
public final class WebExport {
    public static final String SIMULATOR = "CloudSim Plus 8.0.0";

    /** Deskripsi dataset; dipakai halaman web dan perintah {@code ./sim info}. */
    public record Dataset(String id, String name, String citation, String doi, String datasetDoi, String source,
                          String license, String description) {
    }

    public static final List<Dataset> DATASETS = List.of(
            new Dataset("gocj", "GoCJ: Google Cloud Jobs Dataset", "Hussain, A., & Aleem, M. (2018). Data, 3(4), 38",
                    "10.3390/data3040038", "10.17632/b7bp6xhrcd.1", null, "CC BY 4.0",
                    "Ukuran job dalam MI (15.000 sampai 900.000), dibangkitkan dengan Monte Carlo dari statistik trace "
                            + "cluster Google. Dataset yang sama dipakai pada tugas heuristik Sufferage Kelompok 4. Isi "
                            + "setiap file dicocokkan dengan hash SHA-256 resmi Mendeley."),
            new Dataset("nasa", "NASA Ames iPSC/860 1993 (cleaned)",
                    "Feitelson, D. G., & Nitzberg, B. (1995). Job Scheduling Strategies for Parallel Processing, 337–360",
                    "10.1007/3-540-60153-8_38", null, "Parallel Workloads Archive, NASA-iPSC-1993-3.1-cln.swf", null,
                    "Log nyata superkomputer NASA Ames tahun 1993 (18.239 job), dataset paper Mishra dkk. Hanya "
                            + "mencatat lama jalan dan jumlah prosesor, jadi setiap job diubah menjadi task 1-core "
                            + "sepanjang runtime × prosesor × 1.000 MI."));

    private WebExport() {
    }

    public static void writeReplays(Path dir, List<Experiment.ScenarioReplay> replays) {
        for (Experiment.ScenarioReplay replay : replays) {
            Output.write(dir.resolve("replay").resolve(replay.scenario().id() + ".json"), Json.write(replay(replay)));
        }
    }

    public static void writeSummary(Path dir, List<Summary.ScenarioSummary> scenarios) {
        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("generatedAt", Instant.now().toString());
        summary.put("simulator", SIMULATOR);
        summary.put("infrastructure", infrastructure());
        summary.put("parameters", parameters());
        summary.put("datasets", DATASETS);
        summary.put("scenarios", scenarios);
        Output.write(dir.resolve("summary.json"), Json.write(summary));
    }

    /** Menyalin semua file hasil ekspor ke folder website, menimpa yang lama. */
    public static void copy(Path from, Path to) {
        try (Stream<Path> files = Files.walk(from)) {
            for (Path source : files.filter(Files::isRegularFile).toList()) {
                Path target = to.resolve(from.relativize(source));
                Files.createDirectories(target.getParent());
                Files.copy(source, target, StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    /** Daftar VM berformat file replay: index, type, mips, pes, datacenter. */
    public static List<Map<String, Object>> vmSpecs(List<Infrastructure.VmSpec> vms) {
        List<Map<String, Object>> specs = new ArrayList<>();
        for (Infrastructure.VmSpec vm : vms) {
            Map<String, Object> spec = new LinkedHashMap<>();
            spec.put("index", vm.index());
            spec.put("type", vm.type().name());
            spec.put("mips", vm.type().mips());
            spec.put("pes", vm.type().pes());
            spec.put("datacenter", Infrastructure.DATACENTERS.get(vm.datacenter()));
            specs.add(spec);
        }
        return specs;
    }

    /** Isi satu file replay: daftar VM dan run seed 1 setiap algoritma beserta jejaknya. */
    public static Map<String, Object> replay(Experiment.ScenarioReplay replay) {
        List<Map<String, Object>> vms = vmSpecs(replay.vms());

        Map<String, Object> algorithms = new LinkedHashMap<>();
        for (Experiment.AlgorithmRun run : replay.firstSeedRuns()) {
            Map<String, Object> algorithm = new LinkedHashMap<>();
            algorithm.put("makespan", run.schedule().makespan());
            algorithm.put("makespanCloudSim", run.cloudsim().makespan());
            algorithm.put("vmFinish", run.schedule().vmFinish());
            List<TracePoint> trace = run.result().trace();
            if (!trace.isEmpty()) {
                algorithm.put("trace", columns(trace));
                algorithm.put("frames", frames(trace));
                algorithm.put("seeds", acrossSeeds(replay.tracesPerAlgorithm().get(run.algorithm())));
            }
            algorithms.put(run.algorithm(), algorithm);
        }

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("vms", vms);
        out.put("algorithms", algorithms);
        return out;
    }

    private static Map<String, Object> columns(List<TracePoint> trace) {
        int size = trace.size();
        int[] iteration = new int[size];
        double[] evaluations = new double[size];
        double[] best = new double[size];
        double[] worst = new double[size];
        for (int i = 0; i < size; i++) {
            TracePoint point = trace.get(i);
            iteration[i] = point.iteration();
            evaluations[i] = point.evaluations();
            best[i] = point.best();
            worst[i] = point.worst();
        }
        Map<String, Object> columns = new LinkedHashMap<>();
        columns.put("iteration", iteration);
        columns.put("evaluations", evaluations);
        columns.put("best", best);
        columns.put("worst", worst);
        return columns;
    }

    private static List<Object> frames(List<TracePoint> trace) {
        List<Object> frames = new ArrayList<>();
        for (TracePoint point : trace) {
            if (point.vmFinish() != null) {
                Map<String, Object> frame = new LinkedHashMap<>();
                frame.put("iteration", point.iteration());
                frame.put("best", point.best());
                frame.put("vmFinish", point.vmFinish());
                frames.add(frame);
            }
        }
        return frames;
    }

    /** Nilai terbaik per titik iterasi, dirangkum dari semua seed (mean, min, max). */
    private static Map<String, Object> acrossSeeds(List<List<TracePoint>> traces) {
        int size = traces.stream().mapToInt(List::size).min().orElse(0);
        double[] mean = new double[size];
        double[] min = new double[size];
        double[] max = new double[size];
        for (int i = 0; i < size; i++) {
            List<Double> values = new ArrayList<>(traces.size());
            for (List<TracePoint> trace : traces) {
                values.add(trace.get(i).best());
            }
            Stats stats = Stats.of(values);
            mean[i] = stats.mean();
            min[i] = stats.min();
            max[i] = stats.max();
        }
        Map<String, Object> seeds = new LinkedHashMap<>();
        seeds.put("count", traces.size());
        seeds.put("bestMean", mean);
        seeds.put("bestMin", min);
        seeds.put("bestMax", max);
        return seeds;
    }

    private static Map<String, Object> infrastructure() {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("datacenters", Infrastructure.DATACENTERS);
        out.put("hostsPerDatacenter", Infrastructure.HOSTS_PER_DATACENTER);
        out.put("hostPes", Infrastructure.HOST_PES);
        out.put("hostPeMips", Infrastructure.HOST_PE_MIPS);
        out.put("hostRamMb", Infrastructure.HOST_RAM_MB);
        out.put("vmRamMb", Infrastructure.VM_RAM_MB);
        out.put("vmStorageMb", Infrastructure.VM_STORAGE_MB);
        out.put("vmBw", Infrastructure.VM_BW);
        out.put("vmTypes", Infrastructure.VM_TYPES);
        out.put("cloudletScheduler", "CloudletSchedulerSpaceShared");
        return out;
    }

    private static Map<String, Object> parameters() {
        Map<String, Object> jaya = new LinkedHashMap<>();
        jaya.put("population", Jaya.DEFAULT_POPULATION);
        jaya.put("iterations", Jaya.DEFAULT_ITERATIONS);
        jaya.put("evaluations", Jaya.DEFAULT_POPULATION * (Jaya.DEFAULT_ITERATIONS + 1));
        jaya.put("frameEvery", Jaya.LOAD_SAMPLE_EVERY);
        Map<String, Object> sa = new LinkedHashMap<>();
        sa.put("initialTemperature", SimulatedAnnealing.INITIAL_TEMPERATURE);
        sa.put("minTemperature", SimulatedAnnealing.MIN_TEMPERATURE);
        sa.put("coolingRate", SimulatedAnnealing.COOLING_RATE);
        sa.put("neighboursPerTemperature", SimulatedAnnealing.NEIGHBOURS_PER_TEMPERATURE);
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("jaya", jaya);
        out.put("sa", sa);
        return out;
    }
}
