/**
 * Perbandingan adil: JAYA dan SA dijalankan pada lanskap yang sama dengan anggaran
 * evaluasi fungsi identik. Grafik memakai sumbu-x = jumlah evaluasi.
 */
import { JayaEngine } from './jaya'
import { AnnealingEngine } from './sa'
import { makeGaussian, mulberry32 } from './rng'
import type { Landscape } from './landscapes'

export interface DuelTracePoint {
  evaluations: number
  bestCost: number
}

export interface DuelResult {
  evaluations: number
  jayaBest: number
  saBest: number
  jayaTrace: DuelTracePoint[]
  saTrace: DuelTracePoint[]
}

export const DUEL_BUDGET = 600

export function runFairDuel(
  landscape: Landscape,
  seed: number,
  budget = DUEL_BUDGET,
): DuelResult {
  const jayaRng = mulberry32(seed)
  const jaya = new JayaEngine({
    popSize: 10,
    bounds: landscape.domain.map((bound) => [...bound]) as [number, number][],
    fn: (x) => landscape.fn(x[0], x[1]),
    maxIter: 400,
    seed,
    rng: jayaRng,
    stagnationLimit: 400,
  })

  const jayaTrace: DuelTracePoint[] = []
  let jayaSnap = jaya.snapshot()
  for (let guard = 0; guard < 6000; guard++) {
    if (jayaSnap.evaluations >= budget || jayaSnap.done) break
    jayaSnap = jaya.step()
    if (Number.isFinite(jayaSnap.bestEver)) {
      jayaTrace.push({ evaluations: jayaSnap.evaluations, bestCost: jayaSnap.bestEver })
    }
  }

  const saRng = mulberry32((seed ^ 0x5bf03635) >>> 0)
  const gaussian = makeGaussian(saRng)
  const [[x0, x1], [y0, y1]] = landscape.domain
  const initial: [number, number] = [x0 + (x1 - x0) * 0.72, y0 + (y1 - y0) * 0.28]
  const sa = new AnnealingEngine<number[]>({
    initial,
    costFn: (point) => landscape.fn(point[0], point[1]),
    neighbor: (point) => {
      const next = point.slice()
      next[0] = Math.min(x1, Math.max(x0, next[0] + gaussian() * 0.55))
      next[1] = Math.min(y1, Math.max(y0, next[1] + gaussian() * 0.55))
      return next
    },
    T0: 'auto',
    alpha: 0.985,
    innerLoops: 12,
    Tfinal: 0.004,
    hec: 0.9,
    seed,
    rng: saRng,
    maxEvaluations: budget,
  })

  const saTrace: DuelTracePoint[] = []
  let saSnap = sa.snapshot()
  for (let guard = 0; guard < 6000; guard++) {
    if (saSnap.evaluations >= budget || saSnap.done) break
    saSnap = sa.step()
    if (Number.isFinite(saSnap.bestCost)) {
      saTrace.push({ evaluations: saSnap.evaluations, bestCost: saSnap.bestCost })
    }
  }

  const last = (trace: DuelTracePoint[]) =>
    trace.length > 0 ? trace[trace.length - 1].bestCost : Number.POSITIVE_INFINITY

  return {
    evaluations: budget,
    jayaBest: last(jayaTrace),
    saBest: last(saTrace),
    jayaTrace,
    saTrace,
  }
}

/** Statistik ringkas untuk uji 20 kali. */
export function summariseDuelRuns(results: DuelResult[]) {
  const mean = (values: number[]) =>
    values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length
  const std = (values: number[]) => {
    if (values.length === 0) return 0
    const m = mean(values)
    return Math.sqrt(values.reduce((sum, value) => sum + (value - m) ** 2, 0) / values.length)
  }
  const jaya = results.map((r) => r.jayaBest).filter(Number.isFinite)
  const sa = results.map((r) => r.saBest).filter(Number.isFinite)
  return {
    jaya: { mean: mean(jaya), std: std(jaya), wins: 0 },
    sa: { mean: mean(sa), std: std(sa), wins: 0 },
    jayaWins: results.filter((r) => r.jayaBest < r.saBest).length,
    saWins: results.filter((r) => r.saBest < r.jayaBest).length,
  }
}