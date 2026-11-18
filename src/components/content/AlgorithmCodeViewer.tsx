import { useState } from 'react'
import { ParchmentCard } from '../ui/ParchmentCard'
import { IconAnvil, IconCrown, IconScroll, IconCheck, FleurDeLis } from '../ornaments/Ornaments'
import { Reveal } from '../ui/Reveal'

interface CodeFile {
  id: string
  name: string
  path: string
  language: string
  tag: string
  badgeTone: 'forest' | 'ember' | 'gold' | 'steel'
  description: string
  highlights: {
    lineRange: string
    title: string
    detail: string
  }[]
  code: string
}

const FILES: CodeFile[] = [
  {
    id: 'jaya',
    name: 'Jaya.java',
    path: 'cloudsim-jaya/src/main/java/soka/jaya/schedulers/Jaya.java',
    language: 'java',
    tag: 'Metaheuristik Populasi',
    badgeTone: 'forest',
    description:
      'Implementasi algoritma JAYA (Rao, 2016) untuk cloudlet scheduling. Menggunakan vektor kontinu [0, m-1], rumus pembaruan P_best & P_worst, pengurutan VM berbasis MIPS, dan seleksi greedy.',
    highlights: [
      {
        lineRange: 'Baris 46–49',
        title: 'Rumus Pembaruan Posisi (Langkah III)',
        detail:
          'x + r1 * (best - Math.abs(x)) - r2 * (worst - Math.abs(x)). Bergerak mendekati P_best dan menjauhi P_worst secara simultan.',
      },
      {
        lineRange: 'Baris 51–54',
        title: 'Decoding Kontinu → Diskret',
        detail:
          'Mengonversi posisi kontinu kandidat ke indeks VM dengan pembulatan (round) dan pembatasan batas (clamp ke [0, m-1]).',
      },
      {
        lineRange: 'Baris 76–86',
        title: 'Inisialisasi & Evaluasi Awal (Langkah I & II)',
        detail:
          'Membangkitkan 30 kandidat awal secara acak uniform [0, m-1] dan menghitung fitness awal (makespan) melalui Evaluator.',
      },
      {
        lineRange: 'Baris 92–115',
        title: 'Loop Iterasi & Seleksi Greedy (Langkah IV & V)',
        detail:
          'Menentukan P_best (makespan minimum) dan P_worst (makespan maksimum), memperbarui seluruh kandidat, dan hanya mengganti jika kandidat baru lebih unggul.',
      },
      {
        lineRange: 'Baris 142–152',
        title: 'Pengurutan VM Berdasarkan Kapasitas MIPS',
        detail:
          'Posisi kontinu diurutkan dari VM paling lambat ke tercepat agar pergeseran koordinat memiliki makna fisik (kecepatan sebanding).',
      },
    ],
    code: `package soka.jaya.schedulers;

import soka.jaya.Evaluator;
import soka.jaya.Problem;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.SplittableRandom;

/**
 * Algoritma JAYA (Rao, 2016) untuk memetakan cloudlet ke VM, mengikuti lima
 * langkah di slide: inisiasi populasi, evaluasi fitness, pembaruan kandidat,
 * seleksi, dan iterasi.
 *
 * Satu kandidat = satu rencana pembagian lengkap: x[i] adalah posisi
 * kontinu untuk cloudlet ke-i, dibulatkan menjadi nomor posisi VM. Fitness =
 * makespan (diminimalkan).
 */
public final class Jaya implements Scheduler {
    public static final int DEFAULT_POPULATION = 30;
    public static final int DEFAULT_ITERATIONS = 750;
    /** Beban VM dari P_best disimpan setiap sekian iterasi untuk replay di website. */
    public static final int LOAD_SAMPLE_EVERY = 5;

    private final int populationSize;
    private final int iterations;
    private final boolean sortVmsByMips;

    public Jaya(int populationSize, int iterations) {
        this(populationSize, iterations, true);
    }

    /**
     * @param sortVmsByMips true: posisi 0..m-1 diurutkan dari VM paling lambat ke
     *                      paling cepat, sehingga "bergerak mendekati P_best" berarti
     *                      bergerak ke VM yang kecepatannya mirip. false: nomor VM asli.
     */
    public Jaya(int populationSize, int iterations, boolean sortVmsByMips) {
        this.populationSize = populationSize;
        this.iterations = iterations;
        this.sortVmsByMips = sortVmsByMips;
    }

    /** Langkah III: X' = X + r1(P_best - |X|) - r2(P_worst - |X|), persis seperti slide. */
    public static double update(double x, double best, double worst, double r1, double r2) {
        return x + r1 * (best - Math.abs(x)) - r2 * (worst - Math.abs(x));
    }

    /** Konversi kontinu -> diskret: dibulatkan lalu dibatasi ke [0, m-1]. */
    public static int decode(double x, int vmCount) {
        return (int) Math.min(vmCount - 1, Math.max(0, Math.round(x)));
    }

    @Override
    public String name() {
        return sortVmsByMips ? "JAYA" : "JAYA (VM id asli)";
    }

    @Override
    public Result schedule(Problem problem, long seed) {
        return schedule(problem, seed, SearchListener.NONE);
    }

    @Override
    public Result schedule(Problem problem, long seed, SearchListener listener) {
        // SplittableRandom: tanpa sinkronisasi atomik, jauh lebih cepat untuk jutaan angka acak.
        SplittableRandom rng = new SplittableRandom(seed);
        int n = problem.taskCount();
        int m = problem.vmCount();
        int[] vmAtPosition = vmOrder(problem);
        double upper = m - 1;
        int[] mappingBuffer = new int[n];

        // Langkah I: X0 = Xmin + (Xmax - Xmin) * r
        double[][] population = new double[populationSize][n];
        double[] fitness = new double[populationSize];
        for (int k = 0; k < populationSize; k++) {
            for (int d = 0; d < n; d++) {
                population[k][d] = upper * rng.nextDouble();
            }
            // Langkah II: fitness = makespan
            fitness[k] = Evaluator.makespan(problem, toMapping(population[k], vmAtPosition, mappingBuffer));
        }
        long evaluations = populationSize;

        List<TracePoint> trace = new ArrayList<>(iterations + 1);
        trace.add(tracePoint(0, evaluations, population, fitness, problem, vmAtPosition));
        report(listener, trace, population, fitness, problem, vmAtPosition);

        for (int iteration = 1; iteration <= iterations; iteration++) {
            int bestIndex = argMin(fitness);
            int worstIndex = argMax(fitness);
            double[] best = population[bestIndex].clone();
            double[] worst = population[worstIndex].clone();

            for (int k = 0; k < populationSize; k++) {
                double[] candidate = new double[n];
                for (int d = 0; d < n; d++) {
                    double moved = update(population[k][d], best[d], worst[d], rng.nextDouble(), rng.nextDouble());
                    candidate[d] = Math.min(upper, Math.max(0, moved));
                }
                double candidateFitness = Evaluator.makespan(problem, toMapping(candidate, vmAtPosition, mappingBuffer));
                evaluations++;
                // Langkah IV: seleksi greedy, kandidat baru hanya diterima jika lebih baik.
                if (candidateFitness < fitness[k]) {
                    population[k] = candidate;
                    fitness[k] = candidateFitness;
                }
            }
            // Langkah V: ulangi dengan P_best dan P_worst yang baru.
            trace.add(tracePoint(iteration, evaluations, population, fitness, problem, vmAtPosition));
            report(listener, trace, population, fitness, problem, vmAtPosition);
        }

        int[] mapping = toMapping(population[argMin(fitness)], vmAtPosition, new int[n]);
        return new Result(mapping, trace);
    }

    private int[] vmOrder(Problem problem) {
        Integer[] order = new Integer[problem.vmCount()];
        for (int vm = 0; vm < order.length; vm++) {
            order[vm] = vm;
        }
        if (sortVmsByMips) {
            Arrays.sort(order, Comparator.<Integer>comparingDouble(vm -> problem.vmMips()[vm])
                    .thenComparingInt(vm -> problem.vmPes()[vm]));
        }
        return Arrays.stream(order).mapToInt(Integer::intValue).toArray();
    }

    private static int[] toMapping(double[] positions, int[] vmAtPosition, int[] out) {
        for (int i = 0; i < positions.length; i++) {
            out[i] = vmAtPosition[decode(positions[i], vmAtPosition.length)];
        }
        return out;
    }

    private static int argMin(double[] values) {
        int index = 0;
        for (int i = 1; i < values.length; i++) {
            if (values[i] < values[index]) index = i;
        }
        return index;
    }

    private static int argMax(double[] values) {
        int index = 0;
        for (int i = 1; i < values.length; i++) {
            if (values[i] > values[index]) index = i;
        }
        return index;
    }
}`,
  },
  {
    id: 'sa',
    name: 'SimulatedAnnealing.java',
    path: 'cloudsim-jaya/src/main/java/soka/jaya/schedulers/SimulatedAnnealing.java',
    language: 'java',
    tag: 'Metaheuristik Single-Solution',
    badgeTone: 'ember',
    description:
      'Implementasi Simulated Annealing untuk penjadwalan cloudlet. Bekerja pada ruang diskret langsung, dengan eksplorasi tetangga acak dan probabilitas penerimaan Metropolis.',
    highlights: [
      {
        lineRange: 'Baris 20–24',
        title: 'Jadwal Pendinginan (Cooling Schedule)',
        detail:
          'T0 = 100, Tmin = 0.001, alpha = 0.95. Setiap suhu mengeksplorasi 100 tetangga. Total menghasilkan 225 langkah suhu (22.501 evaluasi fitness).',
      },
      {
        lineRange: 'Baris 52–59',
        title: 'Inisialisasi Solusi Awal',
        detail:
          'Setiap cloudlet i langsung dipetakan ke VM integer acak [0, m-1]. Biaya awal (makespan) dievaluasi melalui Evaluator.',
      },
      {
        lineRange: 'Baris 69–74',
        title: 'Pembangkitan Solusi Tetangga',
        detail:
          'candidate[random.nextInt(n)] = random.nextInt(m). Memindahkan satu cloudlet acak ke VM acak lain untuk membentuk kandidat baru.',
      },
      {
        lineRange: 'Baris 76–84',
        title: 'Kriteria Penerimaan Metropolis',
        detail:
          'Solusi lebih baik (delta < 0) selalu diterima. Solusi lebih buruk diterima dengan probabilitas e^(-delta / T) > r, memungkinkan lompat dari optimum lokal.',
      },
    ],
    code: `package soka.jaya.schedulers;

import soka.jaya.Evaluator;
import soka.jaya.Problem;

import java.util.ArrayList;
import java.util.List;
import java.util.SplittableRandom;

/**
 * Simulated Annealing, port dari SimulatedAnnealing.java di branch CloudSim-SA.
 * Parameter dan aturan penerimaannya sama; fitness memakai Evaluator bersama
 * supaya SA dan JAYA dinilai dengan model yang sama persis.
 */
public final class SimulatedAnnealing implements Scheduler {
    public static final double INITIAL_TEMPERATURE = 100;
    public static final double MIN_TEMPERATURE = 0.001;
    public static final double COOLING_RATE = 0.95;
    public static final int NEIGHBOURS_PER_TEMPERATURE = 100;

    /** Jumlah langkah suhu dari T0 sampai di bawah Tmin (225 langkah). */
    public static int temperatureSteps() {
        int steps = 0;
        for (double temperature = INITIAL_TEMPERATURE; temperature > MIN_TEMPERATURE; temperature *= COOLING_RATE) {
            steps++;
        }
        return steps;
    }

    @Override
    public String name() {
        return "SA";
    }

    @Override
    public Result schedule(Problem problem, long seed, SearchListener listener) {
        int totalSteps = temperatureSteps();
        SplittableRandom random = new SplittableRandom(seed);
        int n = problem.taskCount();
        int m = problem.vmCount();

        int[] current = new int[n];
        for (int i = 0; i < n; i++) {
            current[i] = random.nextInt(m);
        }
        double currentCost = Evaluator.makespan(problem, current);
        long evaluations = 1;
        int[] best = current.clone();
        double bestCost = currentCost;

        List<TracePoint> trace = new ArrayList<>();
        trace.add(new TracePoint(0, evaluations, bestCost, currentCost, null));

        double temperature = INITIAL_TEMPERATURE;
        int step = 0;
        while (temperature > MIN_TEMPERATURE) {
            for (int k = 0; k < NEIGHBOURS_PER_TEMPERATURE; k++) {
                // Tetangga: pindahkan satu cloudlet acak ke VM acak.
                int[] candidate = current.clone();
                candidate[random.nextInt(n)] = random.nextInt(m);
                double candidateCost = Evaluator.makespan(problem, candidate);
                evaluations++;
                double delta = candidateCost - currentCost;

                // Terima jika lebih baik, atau lebih buruk dengan peluang e^(-delta/T).
                if (delta < 0 || Math.exp(-delta / temperature) > random.nextDouble()) {
                    current = candidate;
                    currentCost = candidateCost;
                    if (currentCost < bestCost) {
                        best = current.clone();
                        bestCost = currentCost;
                    }
                }
            }
            temperature *= COOLING_RATE;
            step++;
            trace.add(new TracePoint(step, evaluations, bestCost, currentCost, null));
        }
        return new Result(best, trace);
    }
}`,
  },
  {
    id: 'evaluator',
    name: 'Evaluator.java',
    path: 'cloudsim-jaya/src/main/java/soka/jaya/Evaluator.java',
    language: 'java',
    tag: 'Fungsi Fitness Cepat',
    badgeTone: 'gold',
    description:
      'Engine evaluasi analitis FIFO Space-Shared berkecepatan tinggi. Memodelkan antrean multi-core VM persis seperti CloudSim Plus tanpa overhead simulasi event.',
    highlights: [
      {
        lineRange: 'Baris 15–39',
        title: 'Evaluasi Detail Jadwal (Schedule)',
        detail:
          'Menghitung waktu start, finish per cloudlet, beban kerja total, dan makespan akhir untuk setiap VM.',
      },
      {
        lineRange: 'Baris 42–53',
        title: 'Fungsi Fitness Ringkas: makespan()',
        detail:
          'Versi super cepat khusus loop metaheuristik: hanya melacak core availability time dan makespan puncak, menghemat alokasi memori.',
      },
      {
        lineRange: 'Baris 65–73',
        title: 'Earliest Free Core (FIFO Space-Shared)',
        detail:
          'Mencari core dalam VM yang paling awal selesai untuk menampung cloudlet berikutnya sesuai kebijakan CloudSim Plus.',
      },
    ],
    code: `package soka.jaya;

/**
 * Menghitung jadwal dari sebuah pemetaan tanpa overhead CloudSim.
 *
 * Modelnya sama dengan CloudletSchedulerSpaceShared di CloudSim Plus:
 * setiap VM punya k core, antrean berjalan FIFO menurut urutan cloudlet, dan
 * setiap cloudlet 1-core masuk ke core yang paling cepat kosong.
 */
public final class Evaluator {
    private Evaluator() {}

    /** Versi ringkas untuk fungsi fitness: menghitung makespan dengan cepat. */
    public static double makespan(Problem problem, int[] mapping) {
        double[][] coreFree = newCores(problem);
        double makespan = 0;
        for (int i = 0; i < mapping.length; i++) {
            int vm = mapping[i];
            double[] cores = coreFree[vm];
            int core = earliestFreeCore(cores);
            cores[core] += problem.lengths()[i] / problem.vmMips()[vm];
            makespan = Math.max(makespan, cores[core]);
        }
        return makespan;
    }

    /** Waktu kosong setiap core per VM, semuanya 0 di awal. */
    public static double[][] newCores(Problem problem) {
        double[][] cores = new double[problem.vmCount()][];
        for (int vm = 0; vm < cores.length; vm++) {
            cores[vm] = new double[problem.vmPes()[vm]];
        }
        return cores;
    }

    /** Indeks core yang paling cepat kosong (FIFO space-shared). */
    public static int earliestFreeCore(double[] cores) {
        int best = 0;
        for (int core = 1; core < cores.length; core++) {
            if (cores[core] < cores[best]) best = core;
        }
        return best;
    }
}`,
  },
  {
    id: 'cloudsim',
    name: 'CloudSimRunner.java',
    path: 'cloudsim-jaya/src/main/java/soka/jaya/CloudSimRunner.java',
    language: 'java',
    tag: 'Simulasi CloudSim Plus 8.0.0',
    badgeTone: 'steel',
    description:
      'Membangun topologi datacenter, host, VM, dan cloudlet di CloudSim Plus untuk memvalidasi pemetaan jadwal hasil optimasi JAYA dan SA.',
    highlights: [
      {
        lineRange: 'Baris 52–59',
        title: 'Membangun Datacenter & Host',
        detail:
          'Membuat DatacenterSimple Jakarta dan Surabaya dengan host berkecepatan 2.000 & 2.500 MIPS dan VmAllocationPolicySimple.',
      },
      {
        lineRange: 'Baris 65–73',
        title: 'Instansiasi VM Heterogen',
        detail:
          'Membuat VM heterogen (V1–V5) dengan CloudletSchedulerSpaceShared dan memetakannya ke host fisik.',
      },
      {
        lineRange: 'Baris 84–89',
        title: 'Penyerahan Tugas Cloudlet Terjadwal',
        detail:
          'Setiap cloudlet diberi target VM spesifik sesuai array mapping hasil optimasi JAYA atau SA.',
      },
      {
        lineRange: 'Baris 99–112',
        title: 'Eksekusi Simulasi & Validasi Hasil',
        detail:
          'simulation.start() dieksekusi. Hasil akhir diverifikasi: memastikan semua cloudlet SUCCESS dan selisih makespan dengan evaluator < 1%.',
      },
    ],
    code: `package soka.jaya;

import org.cloudsimplus.allocationpolicies.VmAllocationPolicySimple;
import org.cloudsimplus.brokers.DatacenterBrokerSimple;
import org.cloudsimplus.cloudlets.Cloudlet;
import org.cloudsimplus.cloudlets.CloudletSimple;
import org.cloudsimplus.core.CloudSimPlus;
import org.cloudsimplus.datacenters.DatacenterSimple;
import org.cloudsimplus.schedulers.cloudlet.CloudletSchedulerSpaceShared;
import org.cloudsimplus.vms.Vm;
import org.cloudsimplus.vms.VmSimple;

/** Menjalankan satu pemetaan cloudlet -> VM di CloudSim Plus 8.0.0. */
public final class CloudSimRunner {
    public static Result run(long[] lengths, List<Infrastructure.VmSpec> vmSpecs, int[] mapping) {
        CloudSimPlus simulation = new CloudSimPlus();

        // 1. Inisialisasi Datacenter (Jakarta & Surabaya)
        List<DatacenterSimple> datacenters = createDatacenters(simulation);

        // 2. Broker untuk mengatur alokasi
        DatacenterBrokerSimple broker = new DatacenterBrokerSimple(simulation);
        broker.setDatacenterMapper((dc, vm) -> datacenters.get(vmSpecs.get((int) vm.getId()).datacenter()));

        // 3. Konfigurasi VM Heterogen (V1 - V5)
        List<Vm> vms = new ArrayList<>(vmSpecs.size());
        for (Infrastructure.VmSpec spec : vmSpecs) {
            Vm vm = new VmSimple(spec.index(), spec.type().mips(), spec.type().pes())
                    .setRam(Infrastructure.VM_RAM_MB)
                    .setBw(Infrastructure.VM_BW)
                    .setSize(Infrastructure.VM_STORAGE_MB)
                    .setCloudletScheduler(new CloudletSchedulerSpaceShared());
            vms.add(vm);
        }

        // 4. Konfigurasi Cloudlet dengan VM yang ditentukan hasil optimasi
        List<Cloudlet> cloudlets = new ArrayList<>(lengths.length);
        for (int i = 0; i < lengths.length; i++) {
            Cloudlet cloudlet = new CloudletSimple(i, lengths[i], 1);
            cloudlet.setVm(vms.get(mapping[i])); // <--- Pemetaan dari JAYA / SA
            cloudlets.add(cloudlet);
        }

        broker.submitVmList(vms);
        broker.submitCloudletList(cloudlets);

        // 5. Jalankan simulasi event-driven CloudSim
        simulation.start();

        // 6. Kumpulkan hasil makespan dan status sukses
        double makespan = 0;
        int finished = 0;
        for (Cloudlet cloudlet : broker.getCloudletFinishedList()) {
            if (cloudlet.getStatus() == Cloudlet.Status.SUCCESS) finished++;
            makespan = Math.max(makespan, cloudlet.getFinishTime());
        }
        return new Result(makespan, finished);
    }
}`,
  },
]

export function AlgorithmCodeViewer() {
  const [activeTab, setActiveTab] = useState<string>('jaya')
  const [copied, setCopied] = useState<boolean>(false)

  const currentFile = FILES.find((f) => f.id === activeTab) ?? FILES[0]

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(currentFile.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
    }
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigasi File */}
      <div className="flex flex-wrap items-center gap-2 border-b border-leather-700/20 pb-3">
        {FILES.map((file) => {
          const isActive = file.id === activeTab
          const toneClass =
            file.badgeTone === 'forest'
              ? 'text-forest border-forest/40'
              : file.badgeTone === 'ember'
                ? 'text-ember border-ember/40'
                : file.badgeTone === 'gold'
                  ? 'text-gold border-gold/40'
                  : 'text-steel border-steel/40'

          return (
            <button
              key={file.id}
              type="button"
              onClick={() => {
                setActiveTab(file.id)
                setCopied(false)
              }}
              className={`group flex items-center gap-2 rounded-sm border px-3.5 py-2 text-left font-mono text-[13px] transition-all ${
                isActive
                  ? 'border-gold bg-leather-900 text-parchment-100 shadow-sm'
                  : 'border-leather-700/20 bg-parchment-50/60 text-leather-700 hover:border-gold/50 hover:bg-parchment-100'
              }`}
            >
              {file.id === 'jaya' ? (
                <IconCrown className="h-4 w-4 text-forest" />
              ) : file.id === 'sa' ? (
                <IconAnvil className="h-4 w-4 text-ember" />
              ) : (
                <IconScroll className="h-4 w-4 text-gold" />
              )}
              <span className="font-semibold">{file.name}</span>
              <span
                className={`hidden rounded border px-1.5 py-0.5 text-[10px] uppercase tracking-wider sm:inline-block ${
                  isActive ? 'border-parchment-300/30 text-parchment-300' : toneClass
                }`}
              >
                {file.tag}
              </span>
            </button>
          )
        })}
      </div>

      {/* Ringkasan & Lokasi Berkas */}
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <ParchmentCard className="p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-leather-700/10 pb-2">
            <div>
              <p className="font-heading text-[10px] font-semibold uppercase tracking-[0.2em] text-leather-500">
                Lokasi Berkas di Repositori
              </p>
              <code className="font-mono text-[13px] font-bold text-leather-800">{currentFile.path}</code>
            </div>
            <span className="rounded-full border border-gold/30 bg-gold/10 px-2.5 py-0.5 font-heading text-[10px] uppercase tracking-wider text-leather-700">
              Java 17+ / Maven
            </span>
          </div>
          <p className="mt-3 font-body text-[14.5px] leading-relaxed text-ink/90">{currentFile.description}</p>
        </ParchmentCard>

        {/* Poin Kunci Berkas */}
        <div className="space-y-2">
          {currentFile.highlights.map((h, i) => (
            <Reveal key={h.title} delay={i * 0.05}>
              <div className="rounded-sm border-l-2 border-gold/70 bg-parchment-50/80 p-2.5 text-left shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="font-heading text-[10px] font-bold uppercase tracking-wider text-leather-800">
                    {h.title}
                  </span>
                  <span className="font-mono text-[10px] font-medium text-leather-600">{h.lineRange}</span>
                </div>
                <p className="mt-1 font-body text-[12px] leading-snug text-leather-700/90">{h.detail}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>

      {/* Tampilan Kode */}
      <div className="relative overflow-hidden rounded-md border border-gold/40 bg-leather-900 shadow-xl">
        {/* Header Bar Editor */}
        <div className="flex items-center justify-between border-b border-parchment-300/15 bg-leather-800/90 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-wax-red/70" />
            <span className="h-3 w-3 rounded-full bg-gold/70" />
            <span className="h-3 w-3 rounded-full bg-forest/70" />
            <span className="ml-2 font-mono text-[12px] font-medium text-parchment-200">{currentFile.name}</span>
          </div>

          <button
            type="button"
            onClick={copyCode}
            className="flex items-center gap-1.5 rounded border border-parchment-300/25 bg-leather-700/60 px-2.5 py-1 font-mono text-[11px] text-parchment-100 transition-colors hover:border-gold hover:bg-leather-700"
          >
            {copied ? (
              <>
                <IconCheck className="h-3.5 w-3.5 text-gold-light" />
                <span className="text-gold-light">Tersalin!</span>
              </>
            ) : (
              <>
                <IconScroll className="h-3.5 w-3.5" />
                <span>Salin Kode</span>
              </>
            )}
          </button>
        </div>

        {/* Konten Kode dengan Penomoran Baris */}
        <div className="max-h-[580px] overflow-auto p-4 font-mono text-[12.5px] leading-relaxed text-parchment-100">
          <pre className="table w-full">
            <code>
              {currentFile.code.split('\n').map((line, idx) => (
                <div key={idx} className="table-row hover:bg-leather-800/40">
                  <span className="table-cell select-none pr-4 text-right font-mono text-[11px] text-parchment-400/40">
                    {idx + 1}
                  </span>
                  <span className="table-cell whitespace-pre">
                    {formatJavaLine(line)}
                  </span>
                </div>
              ))}
            </code>
          </pre>
        </div>
      </div>

      {/* Catatan Kesetaraan Evaluasi */}
      <ParchmentCard className="p-4 sm:p-5">
        <div className="flex items-center gap-2">
          <FleurDeLis className="h-4 w-4 text-gold" />
          <h4 className="font-heading text-sm font-bold uppercase tracking-wider text-leather-800">
            Keseimbangan Komparasi Metaheuristik: Budget Evaluasi 1:1
          </h4>
        </div>
        <div className="mt-2 grid gap-3 text-[13px] text-leather-700 sm:grid-cols-2">
          <p>
            <strong className="text-forest">JAYA:</strong> 30 populasi × 750 iterasi + 30 evaluasi inisialisasi ={' '}
            <code className="font-mono font-semibold text-leather-900">22.530 evaluasi makespan</code>.
          </p>
          <p>
            <strong className="text-ember">SA:</strong> 225 langkah suhu (100 hingga 0.001 dgn pendinginan 0.95) × 100 tetangga + 1 evaluasi awal ={' '}
            <code className="font-mono font-semibold text-leather-900">22.501 evaluasi makespan</code>.
          </p>
        </div>
        <p className="mt-2 border-t border-leather-700/10 pt-2 font-body text-[12px] italic text-leather-600">
          Dengan jumlah evaluasi fungsi fitness yang setara (~22.500 kali), perbandingan performa konvergensi antara
          algoritma berbasis populasi (JAYA) dan berbasis solusi tunggal (SA) menjadi sepenuhnya adil dan ilmiah.
        </p>
      </ParchmentCard>
    </div>
  )
}

/** Pewarnaan sintaksis Java sederhana untuk kenyamanan visual */
function formatJavaLine(line: string) {
  // Komentar
  if (line.trim().startsWith('//') || line.trim().startsWith('/*') || line.trim().startsWith('*')) {
    return <span className="italic text-parchment-400/60">{line}</span>
  }

  // Javadoc / Anotasi
  if (line.trim().startsWith('@')) {
    return <span className="text-gold-light/90">{line}</span>
  }

  return (
    <span>
      {line.split(/(\b(?:public|private|static|final|class|return|new|for|if|while|double|int|long|boolean|void|package|import)\b)/g).map((chunk, i) => {
        if (/^(public|private|static|final|class|return|new|for|if|while|package|import)$/.test(chunk)) {
          return (
            <span key={i} className="font-bold text-gold-light">
              {chunk}
            </span>
          )
        }
        if (/^(double|int|long|boolean|void)$/.test(chunk)) {
          return (
            <span key={i} className="text-[#84b8d9]">
              {chunk}
            </span>
          )
        }
        return chunk
      })}
    </span>
  )
}

