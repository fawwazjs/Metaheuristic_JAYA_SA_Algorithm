package soka.jaya.cli;

import soka.jaya.Experiment;
import soka.jaya.Infrastructure;
import soka.jaya.Scenario;
import soka.jaya.Scenarios;
import soka.jaya.live.Catalog;
import soka.jaya.live.CustomStore;
import soka.jaya.live.LiveSession;
import soka.jaya.live.RunRequest;
import soka.jaya.report.RunRecord;
import soka.jaya.report.RunStore;
import soka.jaya.report.Summary;
import soka.jaya.report.WebExport;
import soka.jaya.schedulers.Jaya;
import soka.jaya.schedulers.RoundRobin;
import soka.jaya.schedulers.SimulatedAnnealing;
import soka.jaya.schedulers.Sufferage;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.PrintStream;
import java.io.Reader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

/** Titik masuk CLI {@code ./sim}. */
public final class Main {
    private static final Locale ID = Locale.forLanguageTag("id-ID");

    private Main() {
    }

    public static void main(String[] args) {
        BufferedReader in = new BufferedReader(new InputStreamReader(System.in, StandardCharsets.UTF_8));
        System.exit(run(args, in, System.out, System.err, Term.detect()));
    }

    /** Tanpa terminal dan tanpa input: dipakai tes dan pemanggilan dari program lain. */
    public static int run(String[] args, PrintStream out, PrintStream err) {
        return run(args, new BufferedReader(Reader.nullReader()), out, err, Term.PLAIN);
    }

    /** @return 0 sukses, 1 kesalahan tak terduga, 2 argumen salah, 3 validasi CloudSim gagal */
    public static int run(String[] args, BufferedReader in, PrintStream out, PrintStream err, Term term) {
        try {
            Cli.Options options = Cli.parse(args);
            return switch (options.command()) {
                case "info" -> info(out);
                case "run" -> runSimulation(options, out, err);
                case "export-web" -> exportWeb(options, out, err);
                case "interactive" -> interactive(args.length == 0 || !args[0].equals("interactive"), options, in, out, err, term);
                case "custom" -> custom(options, out, err, term);
                default -> help(out);
            };
        } catch (IllegalArgumentException e) {
            err.println("Kesalahan: " + e.getMessage());
            err.println("Lihat bantuan: ./sim help");
            return 2;
        } catch (RuntimeException e) {
            err.println("Gagal: " + e);
            return 1;
        }
    }

    private static int help(PrintStream out) {
        out.println("""
                Simulasi penjadwalan JAYA di CloudSim Plus 8.0.0 (SOKA Kelompok 4)

                Penggunaan: ./sim <perintah> [opsi]

                Perintah:
                  (tanpa perintah) Sama dengan interactive bila dijalankan di terminal
                  interactive  Wizard: pilih dataset, VM, algoritma, dan seed, lalu tonton prosesnya
                  custom       Menjalankan satu skenario kustom tanpa wizard
                  run          Menjalankan 16 skenario resmi lalu mengekspor hasil ke website
                  export-web   Membuat ulang JSON website dari results/runs.csv
                  info         Menampilkan infrastruktur, dataset, dan daftar skenario
                  help         Menampilkan bantuan ini

                Opsi untuk run (skenario resmi):
                  --scenario tc1|tc2|nasa|all       Skenario (bawaan: all)
                  --algo jaya|sa|sufferage|rr|all   Algoritma (bawaan: all)
                  --runs N                          Jumlah seed untuk JAYA dan SA (bawaan: 10)
                  --vm-order mips|raw               Urutan posisi VM pada JAYA (bawaan: mips)
                  --no-web                          Jangan salin hasil ke website

                Opsi untuk custom (hasil disimpan di results/custom/<id>/, terpisah dari hasil resmi):
                  --dataset gocj|nasa      Dataset (bawaan: gocj)
                  --tasks N                GoCJ: ukuran file yang ada (100-1000, 750); NASA: 50-18.239 job (bawaan: 750)
                  --vms N                  10, 20, 30, 40, atau 50 (bawaan: 50)
                  --algo jaya,sa,...|all   Satu atau beberapa algoritma, pisahkan koma (bawaan: all)
                  --runs N                 Jumlah seed JAYA dan SA, 1-10 (bawaan: 3)
                  --population N           Populasi JAYA, 5-100 (bawaan: 30)
                  --iterations N           Iterasi JAYA, 10-3.000 (bawaan: 750)
                  --tempo terlihat|penuh   terlihat: pencarian diperlambat agar bisa diikuti (bawaan); penuh: tanpa jeda
                  --plain                  Keluaran teks biasa tanpa tampilan live

                Opsi umum:
                  --data DIR    Folder dataset (bawaan: data)
                  --out DIR     Folder hasil (bawaan: results)
                  --web DIR     Folder data website (bawaan: ../public/data/cloudsim)

                Contoh:
                  ./sim                     (wizard interaktif)
                  ./sim custom --dataset gocj --tasks 300 --vms 20 --algo jaya,sa --runs 3
                  ./sim run --scenario tc2 --algo jaya --runs 3
                  ./sim run                 (16 skenario resmi, sekitar 4,5 menit)

                Hasil dapat dilihat di http://localhost:5173/cloudsim/ (jalankan npm run dev).""");
        return 0;
    }

    private static int info(PrintStream out) {
        out.println("Simulator : " + WebExport.SIMULATOR);
        out.println();
        out.println("Infrastruktur");
        out.printf(ID, "  Datacenter : %s%n", String.join(", ", Infrastructure.DATACENTERS));
        out.printf(ID, "  Host       : %d per datacenter, %d core, %s MIPS/core, RAM %,d MB%n",
                Infrastructure.HOSTS_PER_DATACENTER, Infrastructure.HOST_PES,
                String.join(" / ", Infrastructure.HOST_PE_MIPS.stream().map(m -> String.format(ID, "%,.0f", m)).toList()),
                Infrastructure.HOST_RAM_MB);
        out.println("  Tipe VM    : (10 per tipe pada 50 VM, VM ke-i bertipe i mod 5 di datacenter i mod 2)");
        for (Infrastructure.VmType type : Infrastructure.VM_TYPES) {
            out.printf(ID, "    %s  %,6.0f MIPS  %d core  RAM %d MB%n", type.name(), type.mips(), type.pes(),
                    Infrastructure.VM_RAM_MB);
        }
        out.println("  Cloudlet   : 1 core, CloudletSchedulerSpaceShared, semua tersedia di t=0");
        out.println();
        out.println("Dataset");
        for (WebExport.Dataset dataset : WebExport.DATASETS) {
            out.printf("  %-5s %s. %s. DOI %s%n", dataset.id(), dataset.name(), dataset.citation(), dataset.doi());
        }
        out.println();
        out.println("Algoritma");
        out.printf("  JAYA       populasi %d x %d iterasi (Rao, 2016)%n", Jaya.DEFAULT_POPULATION, Jaya.DEFAULT_ITERATIONS);
        out.printf(ID, "  SA         T0=%.0f, Tmin=%.3f, alpha=%.2f, %d tetangga per suhu (branch CloudSim-SA)%n",
                SimulatedAnnealing.INITIAL_TEMPERATURE, SimulatedAnnealing.MIN_TEMPERATURE,
                SimulatedAnnealing.COOLING_RATE, SimulatedAnnealing.NEIGHBOURS_PER_TEMPERATURE);
        out.println("  Sufferage  Maheswaran dkk. (1999)");
        out.println("  RR         Round Robin");
        out.println();
        out.println("Skenario");
        for (Scenario scenario : Scenarios.select("all")) {
            out.printf("  %-13s %-5s %-4s %5d task  %3d VM%n", scenario.id(), scenario.group(), scenario.dataset(),
                    scenario.tasks(), scenario.vms());
        }
        return 0;
    }

    private static int runSimulation(Cli.Options options, PrintStream out, PrintStream err) {
        List<Scenario> scenarios = Scenarios.select(options.scenario());
        List<Experiment.Algorithm> algorithms = algorithms(options.algorithm(), options.sortVmsByMips());
        int perScenario = Experiment.runsPerScenario(algorithms, options.runs());
        out.printf("Menjalankan %d skenario, %d run per skenario, di %s%n%n", scenarios.size(), perScenario,
                WebExport.SIMULATOR);

        long started = System.nanoTime();
        Experiment.Outcome outcome = Experiment.run(scenarios, algorithms, options.runs(), options.dataDir(),
                (done, total, record) -> {
                    double elapsed = (System.nanoTime() - started) / 1e9;
                    double remaining = elapsed / done * (total - done);
                    out.printf(ID, "[%3d/%d] %-13s %-17s seed %2d  makespan %,10.1f s  (sisa ~%.0f s)%n", done, total,
                            record.scenario(), record.algorithm(), record.seed(), record.makespanEval(), remaining);
                });

        Path runsFile = options.outDir().resolve("runs.csv");
        List<RunRecord> merged = RunStore.merge(RunStore.read(runsFile), outcome.records());
        RunStore.write(runsFile, merged);
        List<Summary.ScenarioSummary> summaries = Summary.of(merged);
        Summary.writeCsv(options.outDir().resolve("summary.csv"), summaries);
        Path webOut = options.outDir().resolve("web");
        WebExport.writeSummary(webOut, summaries);
        // File replay memuat keempat algoritma; ditulis ulang hanya bila semuanya dijalankan,
        // supaya run satu algoritma tidak menghapus jejak algoritma lain dari animasi.
        boolean replaysUpdated = options.algorithm().equals("all");
        if (replaysUpdated) {
            WebExport.writeReplays(webOut, outcome.replays());
        }

        out.println();
        Tables.print(out, Summary.of(outcome.records()));
        out.printf(ID, "%nSelesai dalam %.1f detik. Hasil: %s, %s%n", (System.nanoTime() - started) / 1e9,
                runsFile, options.outDir().resolve("summary.csv"));
        if (options.exportWeb()) {
            WebExport.copy(webOut, options.webDir());
            out.println("Data website diperbarui: " + options.webDir() + " (buka /cloudsim/ lalu refresh)");
        }
        if (!replaysUpdated) {
            out.println("Catatan: replay animasi tidak diperbarui karena hanya sebagian algoritma dijalankan (pakai --algo all).");
        }
        return validate(outcome.records(), err);
    }

    private static int interactive(boolean bare, Cli.Options options, BufferedReader in, PrintStream out,
                                   PrintStream err, Term term) {
        if (!term.interactive()) {
            if (bare) {
                return help(out);
            }
            err.println("Mode interaktif butuh terminal (stdin dan stdout bukan pipe).");
            err.println("Tanpa terminal, pakai: ./sim custom --dataset gocj --tasks 750 --vms 50 --algo all --runs 3");
            return 2;
        }
        Optional<RunRequest> request = new Wizard(in, out, Catalog.scan(options.dataDir()), options.dataDir()).ask();
        if (request.isEmpty()) {
            return 0;
        }
        out.println();
        return execute(request.get(), options, out, err, options.plain() ? term.plain() : term);
    }

    private static int custom(Cli.Options options, PrintStream out, PrintStream err, Term term) {
        RunRequest.Parsed parsed = RunRequest.parse(options.request(), Catalog.scan(options.dataDir()));
        if (parsed.request() == null) {
            parsed.errors().forEach(error -> err.println("Kesalahan: " + error));
            err.println("Lihat bantuan: ./sim help");
            return 2;
        }
        return execute(parsed.request(), options, out, err, options.plain() ? term.plain() : term);
    }

    /**
     * Menjalankan satu skenario kustom dengan tampilan live, lalu mencetak tabel perbandingan.
     * Hasil disimpan di results/custom/&lt;id&gt;/, terpisah dari hasil resmi.
     */
    private static int execute(RunRequest request, Cli.Options options, PrintStream out, PrintStream err, Term term) {
        CustomStore store = new CustomStore(options.outDir());
        String id = store.newId(request, LocalDateTime.now());
        LiveView view = new LiveView(out, term);
        // Ctrl+C menghentikan JVM; kursor yang disembunyikan blok live harus dikembalikan.
        Thread restoreCursor = new Thread(view::close);
        Runtime.getRuntime().addShutdownHook(restoreCursor);
        LiveSession.Outcome outcome;
        try {
            outcome = new LiveSession(id, request, options.dataDir(), store, view).run();
        } finally {
            view.close();
            Runtime.getRuntime().removeShutdownHook(restoreCursor);
        }
        if (outcome.status() != LiveSession.Status.SELESAI) {
            return 1;
        }
        out.println();
        Tables.print(out, Summary.of(outcome.records()));
        return validate(outcome.records(), err);
    }

    private static int exportWeb(Cli.Options options, PrintStream out, PrintStream err) {
        List<RunRecord> records = RunStore.read(options.outDir().resolve("runs.csv"));
        if (records.isEmpty()) {
            err.println("Belum ada hasil di " + options.outDir().resolve("runs.csv") + ". Jalankan dulu: ./sim run");
            return 2;
        }
        Path webOut = options.outDir().resolve("web");
        WebExport.writeSummary(webOut, Summary.of(records));
        WebExport.copy(webOut, options.webDir());
        out.println("Data website diperbarui dari " + records.size() + " run: " + options.webDir());
        return 0;
    }

    private static List<Experiment.Algorithm> algorithms(String which, boolean sortVmsByMips) {
        List<Experiment.Algorithm> algorithms = new ArrayList<>();
        if (which.equals("all") || which.equals("jaya")) {
            algorithms.add(new Experiment.Algorithm(
                    () -> new Jaya(Jaya.DEFAULT_POPULATION, Jaya.DEFAULT_ITERATIONS, sortVmsByMips), true));
        }
        if (which.equals("all") || which.equals("sa")) {
            algorithms.add(new Experiment.Algorithm(SimulatedAnnealing::new, true));
        }
        if (which.equals("all") || which.equals("sufferage")) {
            algorithms.add(new Experiment.Algorithm(Sufferage::new, false));
        }
        if (which.equals("all") || which.equals("rr")) {
            algorithms.add(new Experiment.Algorithm(RoundRobin::new, false));
        }
        return algorithms;
    }

    private static int validate(List<RunRecord> records, PrintStream err) {
        int problems = 0;
        for (RunRecord record : records) {
            if (record.finished() != record.tasks()) {
                err.printf("PERINGATAN: %s %s seed %d hanya %d/%d cloudlet selesai di CloudSim%n", record.scenario(),
                        record.algorithm(), record.seed(), record.finished(), record.tasks());
                problems++;
            }
            if (record.gapPercent() >= 1.0) {
                err.printf(ID, "PERINGATAN: %s %s seed %d selisih evaluator vs CloudSim %.3f%%%n", record.scenario(),
                        record.algorithm(), record.seed(), record.gapPercent());
                problems++;
            }
        }
        return problems == 0 ? 0 : 3;
    }
}
