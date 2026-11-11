import { memo, useMemo, useState, type ReactNode } from 'react'
import { formatNumber } from '../../lib/algorithms/rng'
import { SectionFrame } from '../../components/layout/SectionFrame'
import { IconBack, IconPause, IconPlay, IconReset, IconStep } from '../../components/ornaments/Ornaments'
import { Segmented } from '../../components/ui/Controls'
import type { Replay, ScenarioSummary, Summary } from '../data'
import { useReplay } from '../data'
import { algorithmColor, algorithmRank, axisNumber, datacenterLabel, seconds, sortedAlgorithmNames, stepIndex } from '../replay'
import { usePlayer } from '../usePlayer'
import { ChartFrame, Legend, type LegendKey } from './chartKit'
import { LineChart, type LineBand, type LineSeries, type ReferenceLine } from './LineChart'
import { VmLoadChart } from './VmLoadChart'

type ConvergenceView = 'seed1' | 'seeds'

/** Jumlah langkah suhu SA dari parameter pendinginan (T0 · α^k > Tmin). */
function saTemperatures(sa: Summary['parameters']['sa']): number {
  return Math.ceil(Math.log(sa.minTemperature / sa.initialTemperature) / Math.log(sa.coolingRate))
}

export function ReplaySection({ scenario, summary, picker }: { scenario: ScenarioSummary; summary: Summary; picker: ReactNode }) {
  const replay = useReplay(scenario.id)
  const { population } = summary.parameters.jaya

  return (
    <SectionFrame
      id="replay"
      eyebrow="Replay pencarian"
      title="Bagaimana JAYA Mencari Pembagian Terbaik"
      subtitle={`Putar ulang satu run JAYA dari CloudSim. Setiap iterasi, ${population} rencana pembagian dinilai; rencana terbaik ditiru dan rencana terburuk dijauhi.`}
      motif="crown"
    >
      <div className="mb-5">{picker}</div>
      {replay.status === 'loading' && <p className="font-body text-leather-700">Memuat jejak pencarian {scenario.id}…</p>}
      {replay.status === 'error' && (
        <p role="alert" className="border border-wax/40 bg-parchment-50 p-4 font-body text-leather-800">
          Jejak replay untuk {scenario.id} tidak bisa dimuat ({replay.message}). Jalankan{' '}
          <code className="font-mono text-[13px]">./sim run --scenario {scenario.group}</code> di folder{' '}
          <code className="font-mono text-[13px]">cloudsim-jaya</code>, lalu muat ulang halaman.
        </p>
      )}
      {replay.status === 'ready' && <ReplayBody replay={replay.data} scenario={scenario} summary={summary} />}
    </SectionFrame>
  )
}

function ReplayBody({ replay, scenario, summary }: { replay: Replay; scenario: ScenarioSummary; summary: Summary }) {
  const jaya = replay.algorithms.JAYA
  const frames = jaya?.frames ?? []
  const player = usePlayer(frames.length, scenario.id)
  const [view, setView] = useState<ConvergenceView>('seed1')
  const [loadsOf, setLoadsOf] = useState('JAYA')
  const names = useMemo(() => sortedAlgorithmNames(Object.keys(replay.algorithms)), [replay])
  const convergence = useMemo(() => buildConvergence(replay, view), [replay, view])
  const yMax = useMemo(() => {
    const finals = Object.values(replay.algorithms).flatMap((a) => a.vmFinish)
    return Math.max(...finals, ...(frames[0]?.vmFinish ?? []))
  }, [replay, frames])

  const frame = frames[player.frame]
  if (!jaya?.trace || !frame) {
    return <p className="font-body text-leather-700">Replay ini tidak memuat jejak JAYA. Jalankan ulang dengan --algo all.</p>
  }

  const { iteration: iterations, evaluations: evaluationTrace } = jaya.trace
  const iteration = frame.iteration
  const evaluations = evaluationTrace[Math.min(iteration, evaluationTrace.length - 1)]
  const totalIterations = iterations[iterations.length - 1]
  const showsReplay = loadsOf === 'JAYA'
  const loads = showsReplay ? frame.vmFinish : replay.algorithms[loadsOf]?.vmFinish ?? frame.vmFinish
  const { population } = summary.parameters.jaya
  const { neighboursPerTemperature } = summary.parameters.sa
  const vmTypes = summary.infrastructure.vmTypes
  const slowest = vmTypes[0]
  const fastest = vmTypes[vmTypes.length - 1]

  return (
    <div className="space-y-5">
      <div className="parchment-inset flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex items-center gap-1.5">
          <button type="button" onClick={() => player.seek(0)} className="player-button" aria-label="Kembali ke iterasi awal">
            <IconReset size={18} />
          </button>
          <button type="button" onClick={() => player.step(-1)} className="player-button" aria-label="Mundur satu langkah">
            <IconBack size={18} />
          </button>
          <button
            type="button"
            onClick={player.toggle}
            className="btn-ritual min-w-[124px]"
            aria-label={player.playing ? 'Jeda replay' : 'Putar replay'}
          >
            {player.playing ? <IconPause size={16} /> : <IconPlay size={16} />}
            {player.playing ? 'Jeda' : player.frame === player.last ? 'Putar ulang' : 'Putar'}
          </button>
          <button type="button" onClick={() => player.step(1)} className="player-button" aria-label="Maju satu langkah">
            <IconStep size={18} />
          </button>
        </div>
        <label className="flex min-w-0 flex-1 items-center gap-3">
          <span className="sr-only">Posisi replay</span>
          <input
            type="range"
            min={0}
            max={player.last}
            value={player.frame}
            onChange={(event) => player.seek(Number(event.target.value))}
            aria-valuetext={`Iterasi ${iteration} dari ${totalIterations}, makespan terbaik ${seconds(frame.best)}`}
            className="replay-range min-w-0 flex-1"
          />
        </label>
        <Segmented
          ariaLabel="Kecepatan replay"
          value={String(player.speed)}
          options={[
            { value: '1', label: '1×' },
            { value: '2', label: '2×' },
            { value: '4', label: '4×' },
          ]}
          onChange={(value) => player.setSpeed(Number(value))}
        />
      </div>

      <dl className="grid grid-cols-2 gap-x-6 gap-y-2 border-b border-leather-700/15 pb-4 sm:grid-cols-4">
        <div>
          <dt className="label-cinzel">Iterasi</dt>
          <dd className="font-mono text-[18px] font-semibold text-leather-900">
            {iteration}
            <span className="text-[13px] font-normal text-leather-600"> / {totalIterations}</span>
          </dd>
        </div>
        <div>
          <dt className="label-cinzel">Evaluasi fitness</dt>
          <dd className="font-mono text-[18px] font-semibold text-leather-900">{formatNumber(evaluations, 0)}</dd>
        </div>
        <div>
          <dt className="label-cinzel">Makespan P_best</dt>
          <dd className="font-mono text-[18px] font-semibold text-leather-900">{seconds(frame.best)}</dd>
        </div>
        <div>
          <dt className="label-cinzel">Hasil akhir di CloudSim</dt>
          <dd className="font-mono text-[18px] font-semibold text-leather-900">{seconds(jaya.makespanCloudSim)}</dd>
        </div>
      </dl>

      <ChartFrame
        title="Seberapa cepat makespan turun selama pencarian?"
        caption={
          <>
            Sumbu mendatar memakai jumlah evaluasi fitness, sehingga JAYA ({population} kandidat × {totalIterations} iterasi) dan SA
            ({saTemperatures(summary.parameters.sa)} suhu × {neighboursPerTemperature} tetangga) dibandingkan dengan anggaran yang
            setara. Garis gelap tegak menandai posisi replay. Garis datar adalah hasil heuristik yang tidak berubah.
          </>
        }
        legend={<Legend items={convergence.legend} />}
        controls={
          <Segmented<ConvergenceView>
            ariaLabel="Data kurva konvergensi"
            value={view}
            options={[
              { value: 'seed1', label: 'Seed 1' },
              { value: 'seeds', label: `Rata-rata ${jaya.seeds?.count ?? 1} seed` },
            ]}
            onChange={setView}
          />
        }
        table={<ConvergenceTable replay={replay} />}
      >
        <LineChart
          series={convergence.series}
          bands={convergence.bands}
          references={convergence.references}
          ariaLabel={`Kurva konvergensi ${scenario.id}`}
          xLabel="Evaluasi fitness"
          yLabel="Makespan (detik)"
          cursorX={evaluations}
          cursorLabel={`Iterasi ${iteration}`}
        />
      </ChartFrame>

      <ChartFrame
        title="Kapan setiap VM selesai mengerjakan bagiannya?"
        caption={
          <>
            Satu kolom = satu VM, dikelompokkan per datacenter dan diurutkan dari VM paling lambat ({slowest.name},{' '}
            {formatNumber(slowest.mips, 0)} MIPS) ke paling cepat ({fastest.name}, {formatNumber(fastest.mips, 0)} MIPS). Pembagian
            yang baik membuat semua kolom hampir sama tinggi. Garis gelap mendatar adalah makespan: VM yang paling akhir selesai.{' '}
            {showsReplay
              ? 'Kolom bergerak mengikuti P_best JAYA pada iterasi replay.'
              : `Menampilkan pembagian akhir ${loadsOf}, tidak ikut bergerak saat replay.`}
          </>
        }
        controls={
          <Segmented
            ariaLabel="Algoritma yang ditampilkan"
            value={loadsOf}
            options={names.map((name) => ({ value: name, label: name === 'Round Robin' ? 'RR' : name }))}
            onChange={setLoadsOf}
          />
        }
        table={<LoadsTable replay={replay} names={names} />}
      >
        <VmLoadChart vms={replay.vms} finish={loads} algorithm={loadsOf} yMax={yMax} />
      </ChartFrame>
    </div>
  )
}

function buildConvergence(replay: Replay, view: ConvergenceView) {
  const series: LineSeries[] = []
  const bands: LineBand[] = []
  const references: ReferenceLine[] = []
  const legend: { label: string; color: string; key: LegendKey }[] = []

  for (const name of sortedAlgorithmNames(Object.keys(replay.algorithms))) {
    const algorithm = replay.algorithms[name]
    const color = algorithmColor(name)
    const trace = algorithm.trace
    if (!trace) {
      references.push({ id: name, label: name, color, y: algorithm.makespan })
      legend.push({ label: `${name} (heuristik)`, color, key: 'rule' })
      continue
    }
    // SA memegang satu solusi: kurva terbaiknya berundak per langkah suhu.
    const isSa = name === 'SA'
    if (view === 'seeds' && algorithm.seeds) {
      series.push({ id: name, label: name, color, x: trace.evaluations, y: algorithm.seeds.bestMean, step: isSa })
      bands.push({ id: `${name}-band`, label: `${name} terbaik–terburuk ${algorithm.seeds.count} seed`, color, x: trace.evaluations, lo: algorithm.seeds.bestMin, hi: algorithm.seeds.bestMax })
      legend.push({ label: `${name}: rata-rata solusi terbaik`, color, key: 'line' })
      legend.push({ label: `${name}: rentang ${algorithm.seeds.count} seed`, color, key: 'band' })
    } else {
      series.push({ id: name, label: name, color, x: trace.evaluations, y: trace.best, step: isSa })
      legend.push({ label: isSa ? 'SA: solusi terbaik sejauh ini' : `${name}: P_best populasi`, color, key: 'line' })
      if (!isSa) {
        bands.push({ id: `${name}-band`, label: `${name} P_best–P_worst`, color, x: trace.evaluations, lo: trace.best, hi: trace.worst })
        legend.push({ label: `${name}: rentang P_best–P_worst`, color, key: 'band' })
      }
    }
  }

  series.sort((a, b) => algorithmRank(a.id) - algorithmRank(b.id))
  return { series, bands, references, legend }
}

/** Tabel hanya bergantung pada data replay, jadi tidak perlu dirender ulang setiap frame. */
const ConvergenceTable = memo(function ConvergenceTable({ replay }: { replay: Replay }) {
  const jaya = replay.algorithms.JAYA?.trace
  if (!jaya) return null
  const checkpoints = [0, 10, 50, 100, 250, 500, 750].filter((i) => i < jaya.iteration.length)
  const sa = replay.algorithms.SA?.trace
  return (
    <table className="data-table">
      <thead>
        <tr>
          <th scope="col">Iterasi JAYA</th>
          <th scope="col">Evaluasi</th>
          <th scope="col">JAYA P_best</th>
          <th scope="col">JAYA P_worst</th>
          {sa && <th scope="col">SA terbaik pada evaluasi sama</th>}
        </tr>
      </thead>
      <tbody>
        {checkpoints.map((i) => {
          const evaluations = jaya.evaluations[i]
          return (
            <tr key={i}>
              <td>{jaya.iteration[i]}</td>
              <td>{formatNumber(evaluations, 0)}</td>
              <td>{seconds(jaya.best[i])}</td>
              <td>{seconds(jaya.worst[i])}</td>
              {sa && <td>{seconds(sa.best[stepIndex(sa.evaluations, evaluations)])}</td>}
            </tr>
          )
        })}
      </tbody>
    </table>
  )
})

const LoadsTable = memo(function LoadsTable({ replay, names }: { replay: Replay; names: string[] }) {
  return (
    <table className="data-table">
      <thead>
        <tr>
          <th scope="col">VM</th>
          <th scope="col">Datacenter</th>
          <th scope="col">Tipe</th>
          {names.map((name) => (
            <th key={name} scope="col">
              {name} (akhir)
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {replay.vms.map((vm) => (
          <tr key={vm.index}>
            <td>{vm.index}</td>
            <td>{datacenterLabel(vm.datacenter)}</td>
            <td>
              {vm.type} · {axisNumber(vm.mips)} MIPS · {vm.pes} core
            </td>
            {names.map((name) => (
              <td key={name}>{seconds(replay.algorithms[name].vmFinish[vm.index])}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
})
