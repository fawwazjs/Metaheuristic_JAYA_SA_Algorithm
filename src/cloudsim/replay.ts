/** Logika murni halaman /cloudsim/: skala sumbu, pencarian titik, format, dan temuan. */
import { formatNumber } from '../lib/algorithms/rng'
import type { AlgorithmResult, ScenarioSummary, Summary, VmSpec } from './data'

/** Urutan dan warna algoritma (identitas tetap di seluruh halaman, divalidasi dataviz). */
const ALGORITHMS = ['JAYA', 'SA', 'Sufferage', 'Round Robin'] as const

const ALGORITHM_COLORS: Record<string, string> = {
  JAYA: 'var(--algo-jaya)',
  SA: 'var(--algo-sa)',
  Sufferage: 'var(--algo-sufferage)',
  'Round Robin': 'var(--algo-rr)',
}

export function algorithmColor(name: string): string {
  return ALGORITHM_COLORS[name] ?? 'var(--algo-other)'
}

export function algorithmRank(name: string): number {
  const index = (ALGORITHMS as readonly string[]).indexOf(name)
  return index < 0 ? ALGORITHMS.length : index
}

export function sortByAlgorithm<T extends { algorithm: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => algorithmRank(a.algorithm) - algorithmRank(b.algorithm))
}

export function sortedAlgorithmNames(names: string[]): string[] {
  return [...names].sort((a, b) => algorithmRank(a) - algorithmRank(b))
}

/** Tick sumbu dengan langkah 1/2/5 × 10^k yang mencakup [min, max]. */
export function niceTicks(min: number, max: number, count = 5): number[] {
  if (!(max > min)) return [min]
  const rough = (max - min) / count
  const power = 10 ** Math.floor(Math.log10(rough))
  const step = [1, 2, 5, 10].map((m) => m * power).find((s) => s >= rough) ?? 10 * power
  const decimals = Math.max(0, -Math.floor(Math.log10(step)))
  const start = Math.floor(min / step) * step
  const ticks: number[] = []
  // Berhenti setelah tick pertama yang ≥ max, supaya nilai terbesar selalu di dalam sumbu.
  for (let i = 0; i <= count * 4; i++) {
    const value = Number((start + i * step).toFixed(decimals))
    ticks.push(value)
    if (value >= max) break
  }
  return ticks
}

/** Angka sumbu: penuh di bawah 10 ribu, ringkas (rb/jt) di atasnya. */
export function axisNumber(value: number): string {
  const abs = Math.abs(value)
  if (abs >= 1_000_000) return `${formatNumber(value / 1_000_000, Number.isInteger(value / 1_000_000) ? 0 : 1)} jt`
  if (abs >= 10_000) return `${formatNumber(value / 1000, 0)} rb`
  return formatNumber(value, Number.isInteger(value) ? 0 : 1)
}

/** Detik: tanpa desimal mulai 1.000 s, satu desimal di bawahnya. */
export function seconds(value: number): string {
  return `${formatNumber(value, Math.abs(value) >= 1000 ? 0 : 1)} s`
}

export function percent(fraction: number, digits = 1): string {
  return `${formatNumber(fraction * 100, digits)}%`
}

/** Indeks titik terdekat pada array x yang terurut naik. */
export function nearestIndex(xs: number[], x: number): number {
  if (xs.length === 0) return -1
  let lo = 0
  let hi = xs.length - 1
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1
    if (xs[mid] <= x) lo = mid
    else hi = mid
  }
  return Math.abs(xs[hi] - x) < Math.abs(x - xs[lo]) ? hi : lo
}

/** Indeks titik terakhir dengan x ≤ nilai (untuk kurva berundak seperti best-so-far SA). */
export function stepIndex(xs: number[], x: number): number {
  let lo = 0
  let hi = xs.length - 1
  if (hi < 0) return -1
  if (x < xs[0]) return 0
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1
    if (xs[mid] <= x) lo = mid
    else hi = mid - 1
  }
  return lo
}

interface DatacenterGroup {
  datacenter: string
  vms: VmSpec[]
}

/** VM per datacenter (urutan kemunculan), di dalamnya dari VM paling lambat ke paling cepat. */
export function groupVmsByDatacenter(vms: VmSpec[]): DatacenterGroup[] {
  const groups = new Map<string, VmSpec[]>()
  for (const vm of vms) {
    const list = groups.get(vm.datacenter) ?? []
    list.push(vm)
    groups.set(vm.datacenter, list)
  }
  return [...groups].map(([datacenter, list]) => ({
    datacenter,
    vms: [...list].sort((a, b) => a.mips - b.mips || a.pes - b.pes || a.index - b.index),
  }))
}

export function datacenterLabel(name: string): string {
  return name.replace(/^DC-/, '')
}

export function scenarioLabel(scenario: Pick<ScenarioSummary, 'group' | 'tasks' | 'vms'>): string {
  const group = scenario.group === 'tc1' ? 'TC1' : scenario.group === 'tc2' ? 'TC2' : 'NASA'
  return `${group} · ${formatNumber(scenario.tasks, 0)} task · ${scenario.vms} VM`
}

export function resultOf(scenario: ScenarioSummary, algorithm: string): AlgorithmResult | undefined {
  return scenario.results.find((result) => result.algorithm === algorithm)
}

function rankOf(scenario: ScenarioSummary, algorithm: string, value: (r: AlgorithmResult) => number): number {
  const own = resultOf(scenario, algorithm)
  if (!own) return 0
  return 1 + scenario.results.filter((other) => value(other) < value(own)).length
}

export interface Findings {
  goCjCount: number
  /** Jumlah skenario GoCJ yang dimenangkan sendirian oleh setiap algoritma. */
  wins: Record<string, number>
  /** Skenario dengan makespan rata-rata terbaik yang sama persis. */
  ties: { scenario: string; algorithms: string[]; atJobBound: boolean }[]
  /** Rata-rata rasio makespan JAYA ÷ SA pada skenario GoCJ. */
  jayaVsSa: number | null
  /** Rata-rata penurunan makespan JAYA dibanding Round Robin (0..1). */
  jayaVsRoundRobin: number | null
  nasa: {
    jaya: AlgorithmResult
    jayaRank: number
    jayaResponseRank: number
    algorithms: number
    /** Makespan JAYA sama dengan batas job terbesar (tidak mungkin lebih cepat). */
    atJobBound: boolean
  } | null
  totalRuns: number
  maxGapPercent: number
  allFinished: boolean
}

/** Nilai sama dengan batas job terbesar (dengan toleransi pembulatan). */
function atBound(value: number, jobBound: number): boolean {
  return value - jobBound <= jobBound * 1e-9
}

export function keyFindings(summary: Pick<Summary, 'scenarios'>): Findings {
  const goCj = summary.scenarios.filter((s) => s.dataset === 'gocj')
  const wins: Record<string, number> = {}
  const ties: Findings['ties'] = []
  const jayaSa: number[] = []
  const jayaRr: number[] = []

  for (const scenario of goCj) {
    const best = Math.min(...scenario.results.map((r) => r.makespan.mean))
    const winners = scenario.results
      .filter((r) => r.makespan.mean - best <= best * 1e-9)
      .map((r) => r.algorithm)
    if (winners.length === 1) wins[winners[0]] = (wins[winners[0]] ?? 0) + 1
    else if (winners.length > 1) {
      ties.push({ scenario: scenario.id, algorithms: winners, atJobBound: atBound(best, scenario.jobBound) })
    }

    const jaya = resultOf(scenario, 'JAYA')
    const sa = resultOf(scenario, 'SA')
    const rr = resultOf(scenario, 'Round Robin')
    if (jaya && sa) jayaSa.push(jaya.makespan.mean / sa.makespan.mean)
    if (jaya && rr) jayaRr.push(1 - jaya.makespan.mean / rr.makespan.mean)
  }

  const nasaScenario = summary.scenarios.find((s) => s.dataset === 'nasa')
  const nasaJaya = nasaScenario ? resultOf(nasaScenario, 'JAYA') : undefined
  const mean = (values: number[]) => (values.length ? values.reduce((a, b) => a + b, 0) / values.length : null)

  let totalRuns = 0
  let maxGapPercent = 0
  let allFinished = true
  for (const scenario of summary.scenarios) {
    for (const result of scenario.results) {
      totalRuns += result.runs
      maxGapPercent = Math.max(maxGapPercent, result.gapPercentMax)
      if (result.finishedMin < scenario.tasks) allFinished = false
    }
  }

  return {
    goCjCount: goCj.length,
    wins,
    ties,
    jayaVsSa: mean(jayaSa),
    jayaVsRoundRobin: mean(jayaRr),
    nasa:
      nasaScenario && nasaJaya
        ? {
            jaya: nasaJaya,
            jayaRank: rankOf(nasaScenario, 'JAYA', (r) => r.makespan.mean),
            jayaResponseRank: rankOf(nasaScenario, 'JAYA', (r) => r.avgResponse.mean),
            algorithms: nasaScenario.results.length,
            atJobBound: atBound(nasaJaya.makespan.mean, nasaScenario.jobBound),
          }
        : null,
    totalRuns,
    maxGapPercent,
    allFinished,
  }
}
