import { useMemo, type ReactNode } from 'react'
import { formatNumber } from '../../lib/algorithms/rng'
import { SectionFrame } from '../../components/layout/SectionFrame'
import { IconCheck, IconCross } from '../../components/ornaments/Ornaments'
import type { AlgorithmResult, ScenarioSummary, Summary } from '../data'
import { algorithmColor, percent, resultOf, scenarioLabel, seconds, sortByAlgorithm, type Findings } from '../replay'
import { ChartFrame, Legend } from './chartKit'
import { LineChart, type LineSeries } from './LineChart'
import { RankedBars } from './RankedBars'

type Axis = 'tasks' | 'vms'

function range(values: number[]): string {
  const min = Math.min(...values)
  const max = Math.max(...values)
  return min === max ? formatNumber(min, 0) : `${formatNumber(min, 0)} sampai ${formatNumber(max, 0)}`
}

export function ComparisonSection({
  summary,
  scenario,
  findings,
  picker,
}: {
  summary: Summary
  scenario: ScenarioSummary
  findings: Findings
  picker: ReactNode
}) {
  const tc1 = useMemo(() => summary.scenarios.filter((s) => s.group === 'tc1'), [summary])
  const tc2 = useMemo(() => summary.scenarios.filter((s) => s.group === 'tc2'), [summary])
  const results = useMemo(() => sortByAlgorithm(scenario.results), [scenario])
  const seeds = Math.max(...summary.scenarios.flatMap((s) => s.results.map((r) => r.runs)))

  return (
    <SectionFrame
      id="perbandingan"
      eyebrow="Perbandingan"
      title="JAYA, SA, Sufferage, dan Round Robin"
      subtitle={`Makespan rata-rata dari semua run. JAYA dan SA dijalankan dengan ${seeds} seed berbeda; Sufferage dan Round Robin selalu memberi hasil yang sama sehingga cukup sekali.`}
      motif="sword"
    >
      <div className="space-y-6">
        {picker}

        <ChartFrame
          title="Algoritma mana yang paling cepat menyelesaikan semua task di skenario ini?"
          caption="Panjang batang = makespan rata-rata (lebih pendek lebih baik). Garis tipis di atas batang JAYA dan SA = rentang dari run terbaik sampai terburuk. Semua angkanya ada di tabel metrik di bawah."
        >
          <RankedBars results={results} />
        </ChartFrame>

        <div className="grid gap-6 lg:grid-cols-2 [&>*]:min-w-0">
          {tc1.length > 1 && (
            <TrendChart
              title="Bagaimana makespan berubah saat jumlah task bertambah?"
              caption={`TC1: dataset GoCJ ${range(tc1.map((s) => s.tasks))} task pada ${range(tc1.map((s) => s.vms))} VM, meniru test case 1 di paper.`}
              scenarios={tc1}
              axis="tasks"
              xLabel="Jumlah task"
              selected={scenario.group === 'tc1' ? scenario.tasks : null}
            />
          )}
          {tc2.length > 1 && (
            <TrendChart
              title="Bagaimana makespan berubah saat jumlah VM bertambah?"
              caption={`TC2: ${range(tc2.map((s) => s.tasks))} task GoCJ pada ${range(tc2.map((s) => s.vms))} VM, meniru test case 2 di paper.`}
              scenarios={tc2}
              axis="vms"
              xLabel="Jumlah VM"
              selected={scenario.group === 'tc2' ? scenario.vms : null}
            />
          )}
        </div>

        <div className="chart-surface overflow-x-auto p-4 sm:p-5">
          <h4 className="mb-3 font-heading text-[15px] font-semibold text-leather-800 sm:text-base">
            Semua metrik untuk {scenarioLabel(scenario)}
          </h4>
          <MetricsTable rows={results} />
          <p className="mt-3 max-w-3xl font-body text-[13px] italic leading-relaxed text-leather-600">
            ARU = rata-rata bagian waktu VM terpakai. DOI = ketimpangan waktu selesai antar-VM (0 berarti seimbang). Respons dan
            tunggu dihitung dari t = 0 karena semua task dikirim bersamaan. Energi memakai rumus Eq. 23–24 di paper (γ = 0,7, δ =
            0,3); satuannya mengikuti paper.
          </p>
        </div>

        <div id="validasi" className="scroll-mt-28">
          <h3 className="mb-3 font-heading text-[clamp(1.1rem,2vw,1.35rem)] font-semibold text-leather-800">
            Apakah angka-angka ini benar-benar dari CloudSim?
          </h3>
          <p className="mb-4 max-w-3xl font-body text-[15px] leading-relaxed text-ink/85">
            Selama pencarian, makespan dihitung cepat dengan model antrean yang sama seperti CloudSim. Setiap pemetaan akhir lalu
            dijalankan di {summary.simulator} untuk dicocokkan.
          </p>
          <dl className="grid gap-4 sm:grid-cols-3">
            <Tile label="Run yang dijalankan di CloudSim" value={formatNumber(findings.totalRuns, 0)} />
            <Tile
              label="Status cloudlet"
              value={findings.allFinished ? 'Semua SUCCESS' : 'Ada yang gagal'}
              tone={findings.allFinished ? 'ok' : 'bad'}
            />
            <Tile label="Selisih makespan terbesar (model vs CloudSim)" value={`${formatNumber(findings.maxGapPercent, 2)}%`} />
          </dl>
        </div>
      </div>
    </SectionFrame>
  )
}

function Tile({ label, value, tone }: { label: string; value: string; tone?: 'ok' | 'bad' }) {
  return (
    <div className="border-l-2 border-gold/60 pl-4">
      <dt className="font-body text-[14px] text-leather-700">{label}</dt>
      <dd className={`mt-1 flex items-center gap-2 font-mono text-[26px] font-semibold leading-tight ${tone === 'bad' ? 'text-wax' : 'text-leather-900'}`}>
        {tone === 'ok' && <IconCheck size={22} className="text-[var(--algo-jaya)]" aria-hidden="true" />}
        {tone === 'bad' && <IconCross size={22} className="text-wax" aria-hidden="true" />}
        {value}
      </dd>
    </div>
  )
}

function TrendChart({
  title,
  caption,
  scenarios,
  axis,
  xLabel,
  selected,
}: {
  title: string
  caption: string
  scenarios: ScenarioSummary[]
  axis: Axis
  xLabel: string
  selected: number | null
}) {
  const ordered = useMemo(() => [...scenarios].sort((a, b) => a[axis] - b[axis]), [scenarios, axis])
  const names = useMemo(() => sortByAlgorithm(scenarios[0].results).map((r) => r.algorithm), [scenarios])
  const series = useMemo<LineSeries[]>(
    () =>
      names.map((name) => {
        const points = ordered.flatMap((s) => {
          const result = resultOf(s, name)
          return result ? [{ x: s[axis], y: result.makespan.mean }] : []
        })
        return { id: name, label: name, color: algorithmColor(name), x: points.map((p) => p.x), y: points.map((p) => p.y) }
      }),
    [names, ordered, axis],
  )

  return (
    <ChartFrame
      title={title}
      caption={caption}
      legend={<Legend items={series.map((s) => ({ label: s.id, color: s.color, key: 'line' as const }))} />}
      table={<TrendTable ordered={ordered} names={names} axis={axis} xLabel={xLabel} />}
    >
      <LineChart
        series={series}
        ariaLabel={title}
        xLabel={xLabel}
        yLabel="Makespan rata-rata (detik)"
        xTicks={ordered.map((s) => s[axis])}
        cursorX={selected}
        cursorLabel={selected === null ? undefined : 'Dipilih'}
        yFromZero
        height={280}
      />
    </ChartFrame>
  )
}

function TrendTable({ ordered, names, axis, xLabel }: { ordered: ScenarioSummary[]; names: string[]; axis: Axis; xLabel: string }) {
  return (
    <table className="data-table">
      <thead>
        <tr>
          <th scope="col">{xLabel}</th>
          {names.map((name) => (
            <th key={name} scope="col">
              {name}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {ordered.map((s) => (
          <tr key={s.id}>
            <td>{formatNumber(s[axis], 0)}</td>
            {names.map((name) => {
              const result = resultOf(s, name)
              return (
                <td key={name}>
                  {result ? seconds(result.makespan.mean) : '—'}
                  {result && result.runs > 1 && <span className="text-leather-600"> ± {formatNumber(result.makespan.std, 1)}</span>}
                </td>
              )
            })}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function MetricsTable({ rows }: { rows: AlgorithmResult[] }) {
  return (
    <table className="data-table">
      <thead>
        <tr>
          <th scope="col">Algoritma</th>
          <th scope="col">Run</th>
          <th scope="col">Makespan rata-rata ± std</th>
          <th scope="col">Terbaik</th>
          <th scope="col">Makespan di CloudSim</th>
          <th scope="col">Selisih maks</th>
          <th scope="col">ARU</th>
          <th scope="col">Throughput</th>
          <th scope="col">DOI</th>
          <th scope="col">Respons rata-rata</th>
          <th scope="col">Tunggu rata-rata</th>
          <th scope="col">Energi</th>
          <th scope="col">Waktu algoritma</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.algorithm}>
            <th scope="row">
              <span className="mr-2 inline-block h-2.5 w-2.5 rounded-sm align-middle" style={{ background: algorithmColor(r.algorithm) }} aria-hidden="true" />
              {r.algorithm}
            </th>
            <td>{r.runs}</td>
            <td>
              {seconds(r.makespan.mean)}
              {r.runs > 1 && <span className="text-leather-600"> ± {formatNumber(r.makespan.std, 1)}</span>}
            </td>
            <td>{seconds(r.makespan.min)}</td>
            <td>{seconds(r.makespanCloudSim.mean)}</td>
            <td>{formatNumber(r.gapPercentMax, 2)}%</td>
            <td>{percent(r.aru.mean)}</td>
            <td>{formatNumber(r.throughput.mean, 3)} task/s</td>
            <td>{formatNumber(r.doi.mean, 2)}</td>
            <td>{seconds(r.avgResponse.mean)}</td>
            <td>{seconds(r.avgWaiting.mean)}</td>
            <td>{formatNumber(r.energy.mean, 0)}</td>
            <td>{formatNumber(r.runtimeMs.mean, 0)} ms</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
