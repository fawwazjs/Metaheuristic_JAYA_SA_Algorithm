import { clamp, makeGaussian, mulberry32, type Rng } from './rng'
import type { Landscape } from './landscapes'

export type SaDecision = 'improve' | 'equal' | 'worse-accepted' | 'worse-rejected'

export interface SaTrial<T> {
  cur: T
  next: T
  curCost: number
  nextCost: number
  deltaC: number
  T: number
  P: number
  r: number
  accepted: boolean
  decision: SaDecision
}

export interface SaHistoryPoint {
  iteration: number
  T: number
  curCost: number
  bestCost: number
  evaluations: number
}

export interface SaTracePoint {
  evaluations: number
  curCost: number
  bestCost: number
}

export interface SaTrailPoint<T> {
  state: T
  cost: number
  T: number
}

export interface SaSnapshot<T> {
  T: number
  T0: number
  Tfinal: number
  iteration: number
  innerIndex: number
  innerLoops: number
  cur: T
  best: T
  curCost: number
  bestCost: number
  evaluations: number
  acceptedCount: number
  rejectedCount: number
  acceptedWorse: number
  rejectedWorse: number
  improvedCount: number
  equalCount: number
  lastTrial: SaTrial<T> | null
  history: SaHistoryPoint[]
  trace: SaTracePoint[]
  trail: SaTrailPoint<T>[]
  t0Info: { meanDelta: number; hec: number; samples: number } | null
  done: boolean
  stopReason: 'suhu-final' | 'batas-evaluasi' | null
}

export interface AnnealingConfig<T> {
  initial: T
  costFn: (state: T) => number
  neighbor: (state: T, rng: Rng) => T
  T0?: number | 'auto'
  alpha?: number
  innerLoops?: number
  Tfinal?: number
  hec?: number
  seed?: number
  rng?: Rng
  maxEvaluations?: number
}

/** P = exp(−ΔC/T); ΔC ≤ 0 selalu diterima (P = 1). */
export function acceptanceProbability(deltaC: number, T: number): number {
  if (deltaC <= 0) return 1
  if (!(T > 0)) return 0
  return Math.exp(-deltaC / T)
}

/** T0 = −ΔC̄ / ln(HEC). */
export function initialTemperature(meanDelta: number, hec: number): number {
  const safeHec = Math.min(0.999, Math.max(0.001, hec))
  return -meanDelta / Math.log(safeHec)
}

/** T1 = αT0, T2 = αT1, … */
export function coolingTable(T0: number, alpha: number, count: number): number[] {
  const out: number[] = []
  let T = T0
  for (let i = 0; i < count; i++) {
    T = alpha * T
    out.push(T)
  }
  return out
}

/** Jumlah penurunan suhu hingga T < T_final. */
export function iterationsUntilFinal(T0: number, alpha: number, Tfinal: number): number {
  if (!(alpha > 0 && alpha < 1)) return Number.POSITIVE_INFINITY
  if (Tfinal >= T0) return 0
  return Math.ceil(Math.log(Tfinal / T0) / Math.log(alpha))
}

function mean(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

/**
 * Estimasi T0 dengan sampel perpindahan yang memperburuk solusi (default 50).
 * Dipakai baik oleh simulator kontinu maupun demo penjadwalan diskret.
 */
export function estimateInitialTemperature<T>(
  costFn: (state: T) => number,
  neighbor: (state: T, rng: Rng) => T,
  initial: T,
  rng: Rng,
  hec = 0.9,
  samples = 50,
): { T0: number; meanDelta: number; samples: number } {
  const baseCost = costFn(initial)
  const increases: number[] = []
  let taken = 0
  for (let i = 0; i < samples * 3 && taken < samples; i++) {
    const candidate = neighbor(initial, rng)
    const delta = costFn(candidate) - baseCost
    if (delta > 1e-12) {
      increases.push(delta)
      taken++
    }
  }
  if (increases.length === 0) {
    return { T0: Math.max(1, Math.abs(baseCost) * 0.25 + 1), meanDelta: 0, samples: 0 }
  }
  const meanDelta = mean(increases)
  return { T0: initialTemperature(meanDelta, hec), meanDelta, samples: increases.length }
}

/**
 * Mesin Simulated Annealing generik. T dapat berupa vektor kontinu (simulator
 * 2D) atau larik penempatan task (demo penjadwalan). Satu step() = satu trial
 * neighbor, termasuk keputusan Metropolis dan pembaruan S_best.
 */
export class AnnealingEngine<T> {
  private rng: Rng
  private costFn: (state: T) => number
  private neighborFn: (state: T, rng: Rng) => T
  private alpha: number
  private innerLoops: number
  private Tfinal: number

  private T: number
  private readonly T0: number
  private iteration = 0
  private innerIndex = 0
  private cur: T
  private best: T
  private curCost: number
  private bestCost: number
  private evaluations = 1
  private acceptedCount = 0
  private rejectedCount = 0
  private acceptedWorse = 0
  private rejectedWorse = 0
  private improvedCount = 0
  private equalCount = 0
  private lastTrial: SaTrial<T> | null = null
  private history: SaHistoryPoint[] = []
  private trace: SaTracePoint[] = []
  private trail: SaTrailPoint<T>[] = []
  private t0Info: SaSnapshot<T>['t0Info'] = null
  private done = false
  private stopReason: SaSnapshot<T>['stopReason'] = null
  private maxEvaluations?: number

  constructor(config: AnnealingConfig<T>) {
    this.rng = config.rng ?? mulberry32(config.seed ?? 20240501)
    this.costFn = config.costFn
    this.neighborFn = config.neighbor
    this.alpha = clamp(config.alpha ?? 0.99, 0.0001, 0.99999)
    this.innerLoops = Math.max(1, Math.round(config.innerLoops ?? 20))
    this.Tfinal = Math.max(1e-8, config.Tfinal ?? 0.01)
    this.maxEvaluations = config.maxEvaluations

    this.cur = config.initial
    this.best = config.initial
    this.curCost = this.costFn(config.initial)
    this.bestCost = this.curCost

    if (config.T0 === 'auto' || config.T0 === undefined) {
      const estimate = estimateInitialTemperature(
        this.costFn,
        this.neighborFn,
        config.initial,
        this.rng,
        config.hec ?? 0.9,
      )
      this.t0Info = { meanDelta: estimate.meanDelta, hec: config.hec ?? 0.9, samples: estimate.samples }
      this.T0 = Math.max(estimate.T0, this.Tfinal * 4)
    } else {
      this.T0 = Math.max(config.T0, this.Tfinal * 4)
    }
    this.T = this.T0

    this.history.push({
      iteration: 0,
      T: this.T0,
      curCost: this.curCost,
      bestCost: this.bestCost,
      evaluations: this.evaluations,
    })
    this.trace.push({ evaluations: this.evaluations, curCost: this.curCost, bestCost: this.bestCost })
    this.trail.push({ state: this.cur, cost: this.curCost, T: this.T0 })
  }

  get temperature() {
    return this.T
  }

  get initialT() {
    return this.T0
  }

  snapshot(): SaSnapshot<T> {
    return {
      T: this.T,
      T0: this.T0,
      Tfinal: this.Tfinal,
      iteration: this.iteration,
      innerIndex: this.innerIndex,
      innerLoops: this.innerLoops,
      cur: this.cur,
      best: this.best,
      curCost: this.curCost,
      bestCost: this.bestCost,
      evaluations: this.evaluations,
      acceptedCount: this.acceptedCount,
      rejectedCount: this.rejectedCount,
      acceptedWorse: this.acceptedWorse,
      rejectedWorse: this.rejectedWorse,
      improvedCount: this.improvedCount,
      equalCount: this.equalCount,
      lastTrial: this.lastTrial,
      history: this.history.map((h) => ({ ...h })),
      trace: this.trace.map((h) => ({ ...h })),
      trail: this.trail.map((point) => ({ ...point })),
      t0Info: this.t0Info,
      done: this.done,
      stopReason: this.stopReason,
    }
  }

  step(): SaSnapshot<T> {
    if (this.done) return this.snapshot()

    const T = this.T
    const previous = this.cur
    const previousCost = this.curCost
    const next = this.neighborFn(this.cur, this.rng)
    const nextCost = this.costFn(next)
    this.evaluations += 1

    const deltaC = nextCost - previousCost
    let decision: SaDecision
    let P: number
    let r: number
    let accepted: boolean

    if (deltaC < 0) {
      decision = 'improve'
      P = 1
      r = this.rng()
      accepted = true
      this.improvedCount++
    } else if (deltaC === 0) {
      decision = 'equal'
      P = 1
      r = this.rng()
      accepted = true
      this.equalCount++
    } else {
      P = acceptanceProbability(deltaC, T)
      r = this.rng()
      accepted = r < P
      decision = accepted ? 'worse-accepted' : 'worse-rejected'
      if (accepted) this.acceptedWorse++
      else this.rejectedWorse++
    }

    if (accepted) {
      this.cur = next
      this.curCost = nextCost
      this.acceptedCount++
      if (nextCost < this.bestCost) {
        this.best = next
        this.bestCost = nextCost
      }
      this.trail.push({ state: next, cost: nextCost, T })
      if (this.trail.length > 400) this.trail.shift()
    } else {
      this.rejectedCount++
    }

    this.lastTrial = {
      cur: previous,
      next,
      curCost: previousCost,
      nextCost,
      deltaC,
      T,
      P,
      r,
      accepted,
      decision,
    }

    this.trace.push({
      evaluations: this.evaluations,
      curCost: this.curCost,
      bestCost: this.bestCost,
    })
    if (this.trace.length > 600) this.trace.shift()

    this.innerIndex += 1

    if (this.innerIndex >= this.innerLoops) {
      this.innerIndex = 0
      this.iteration += 1
      this.T = this.alpha * this.T
      this.history.push({
        iteration: this.iteration,
        T: this.T,
        curCost: this.curCost,
        bestCost: this.bestCost,
        evaluations: this.evaluations,
      })
      if (this.T < this.Tfinal) {
        this.done = true
        this.stopReason = 'suhu-final'
      }
    }

    if (this.maxEvaluations && this.evaluations >= this.maxEvaluations) {
      this.done = true
      this.stopReason = 'batas-evaluasi'
    }

    return this.snapshot()
  }

  /** Jalankan satu blok inner loop (satu penurunan temperatur). */
  runTemperature(): SaSnapshot<T> {
    const startIteration = this.iteration
    for (let i = 0; i < 100000; i++) {
      if (this.done) break
      this.step()
      if (this.done || this.iteration !== startIteration) break
    }
    return this.snapshot()
  }
}

export interface ContinuousSaOptions {
  T0?: number | 'auto'
  alpha?: number
  innerLoops?: number
  Tfinal?: number
  stepSize?: number
  hec?: number
  seed?: number
  initial?: [number, number]
}

export function createContinuousSa(
  landscape: Landscape,
  options: ContinuousSaOptions = {},
): AnnealingEngine<number[]> {
  const seed = options.seed ?? 20240501
  const rng = mulberry32(seed)
  const gaussian = makeGaussian(rng)
  const [[x0, x1], [y0, y1]] = landscape.domain
  const initial: [number, number] =
    options.initial ?? [x0 + rng() * (x1 - x0), y0 + rng() * (y1 - y0)]
  const stepSize = options.stepSize ?? 0.6

  return new AnnealingEngine<number[]>({
    initial: [...initial],
    costFn: (point) => landscape.fn(point[0], point[1]),
    neighbor: (point) => {
      const next = point.slice()
      for (let d = 0; d < next.length; d++) {
        const [min, max] = d === 0 ? [x0, x1] : [y0, y1]
        next[d] = clamp(next[d] + gaussian() * stepSize, min, max)
      }
      return next
    },
    T0: options.T0 ?? 'auto',
    alpha: options.alpha ?? 0.99,
    innerLoops: options.innerLoops ?? 30,
    Tfinal: options.Tfinal ?? 0.01,
    hec: options.hec ?? 0.9,
    seed,
    rng,
  })
}