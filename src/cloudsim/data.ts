/**
 * Tipe dan pemuat data hasil CLI `./sim` (cloudsim-jaya/). File JSON ditulis ke
 * public/data/cloudsim/ oleh perintah `./sim run` atau `./sim export-web`.
 */
import { useEffect, useState } from 'react'

export interface Stats {
  mean: number
  std: number
  min: number
  max: number
}

export interface AlgorithmResult {
  algorithm: string
  runs: number
  makespan: Stats
  makespanCloudSim: Stats
  gapPercentMax: number
  aru: Stats
  throughput: Stats
  doi: Stats
  avgResponse: Stats
  avgWaiting: Stats
  energy: Stats
  runtimeMs: Stats
  lastImprovement: Stats
  finishedMin: number
}

export type ScenarioGroup = 'tc1' | 'tc2' | 'nasa'

export interface ScenarioSummary {
  id: string
  group: ScenarioGroup
  dataset: 'gocj' | 'nasa'
  tasks: number
  vms: number
  /** Batas bawah makespan: job terbesar ÷ MIPS VM tercepat. */
  jobBound: number
  results: AlgorithmResult[]
}

export interface Dataset {
  id: string
  name: string
  citation: string
  doi: string
  datasetDoi: string | null
  source: string | null
  license: string | null
  description: string
}

export interface Parameters {
  jaya: { population: number; iterations: number; evaluations: number; frameEvery: number }
  sa: { initialTemperature: number; minTemperature: number; coolingRate: number; neighboursPerTemperature: number }
}

export interface Summary {
  generatedAt: string
  simulator: string
  infrastructure: {
    datacenters: string[]
    hostsPerDatacenter: number
    hostPes: number
    hostPeMips: number[]
    hostRamMb: number
    vmRamMb: number
    vmStorageMb: number
    vmBw: number
    vmTypes: { name: string; mips: number; pes: number }[]
    cloudletScheduler: string
  }
  parameters: Parameters
  datasets: Dataset[]
  scenarios: ScenarioSummary[]
}

export interface VmSpec {
  index: number
  type: string
  mips: number
  pes: number
  datacenter: string
}

export interface Trace {
  iteration: number[]
  evaluations: number[]
  best: number[]
  /** JAYA: P_worst populasi; SA: solusi yang sedang dipegang. */
  worst: number[]
}

export interface Frame {
  iteration: number
  best: number
  vmFinish: number[]
}

export interface ReplayAlgorithm {
  makespan: number
  makespanCloudSim: number
  vmFinish: number[]
  trace?: Trace
  frames?: Frame[]
  seeds?: { count: number; bestMean: number[]; bestMin: number[]; bestMax: number[] }
}

export interface Replay {
  vms: VmSpec[]
  algorithms: Record<string, ReplayAlgorithm>
}

export type Loadable<T> =
  | { status: 'loading' }
  | { status: 'ready'; data: T }
  | { status: 'error'; message: string }

const DATA_ROOT = `${import.meta.env.BASE_URL}data/cloudsim/`
const replayCache = new Map<string, Promise<Replay>>()

async function fetchJson<T>(path: string): Promise<T> {
  // no-cache: setelah ./sim run, refresh halaman langsung menampilkan hasil baru.
  const response = await fetch(DATA_ROOT + path, { cache: 'no-cache' })
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`)
  return (await response.json()) as T
}

function useLoadable<T>(key: string, load: () => Promise<T>): Loadable<T> {
  const [state, setState] = useState<Loadable<T>>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    setState((previous) => (previous.status === 'ready' ? previous : { status: 'loading' }))
    load().then(
      (data) => !cancelled && setState({ status: 'ready', data }),
      (error: unknown) =>
        !cancelled && setState({ status: 'error', message: error instanceof Error ? error.message : String(error) }),
    )
    return () => {
      cancelled = true
    }
    // load bergantung pada key; key adalah satu-satunya pemicu muat ulang.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return state
}

export function useSummary(): Loadable<Summary> {
  return useLoadable('summary', () => fetchJson<Summary>('summary.json'))
}

/** Replay dimuat saat skenarionya dipilih, lalu disimpan agar tidak diunduh ulang. */
export function useReplay(scenarioId: string): Loadable<Replay> {
  return useLoadable(scenarioId, () => {
    let promise = replayCache.get(scenarioId)
    if (!promise) {
      promise = fetchJson<Replay>(`replay/${scenarioId}.json`)
      promise.catch(() => replayCache.delete(scenarioId))
      replayCache.set(scenarioId, promise)
    }
    return promise
  })
}
