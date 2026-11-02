import { mulberry32, type Rng } from './rng'

export type JayaPhase = 'init' | 'evaluate' | 'bestWorst' | 'update' | 'select' | 'iterate' | 'done'

export interface JayaConfig {
  popSize: number
  bounds: [number, number][]
  fn: (x: number[]) => number
  maxIter: number
  seed?: number
  rng?: Rng
  /** Iterasi berturut-turut tanpa perubahan P_best/P_worst sebelum berhenti. */
  stagnationLimit?: number
  initial?: number[][]
}

export interface JayaUpdate {
  candidate: number
  from: number[]
  proposed: number[]
  r1: number[]
  r2: number[]
  bestAt: number[]
  worstAt: number[]
  accepted?: boolean
}

export interface JayaHistoryPoint {
  iteration: number
  best: number
  mean: number
  worst: number
}

export interface JayaSnapshot {
  iteration: number
  phase: JayaPhase
  positions: number[][]
  proposed: number[][]
  fitness: number[]
  proposedFitness: number[]
  bestIndex: number
  worstIndex: number
  best: number[]
  worst: number[]
  bestFitness: number
  worstFitness: number
  bestEver: number
  accepted: boolean[]
  updates: JayaUpdate[]
  history: JayaHistoryPoint[]
  evaluations: number
  acceptedCount: number
  rejectedCount: number
  stagnation: number
  done: boolean
  stopReason: 'max-iterasi' | 'stagnasi' | null
}

/** Rumus pembaruan JAYA persis seperti slide (memakai |X|). */
export function jayaUpdateValue(
  x: number,
  best: number,
  worst: number,
  r1: number,
  r2: number,
): number {
  return x + r1 * (best - Math.abs(x)) - r2 * (worst - Math.abs(x))
}

export function clampToBounds(value: number, bound: [number, number]): number {
  return Math.min(bound[1], Math.max(bound[0], value))
}

function sameVector(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false
  return true
}

/**
 * Mesin JAYA berbasis fase: init → evaluate → bestWorst → update → select →
 * iterate. Satu panggilan step() memajukan tepat satu fase sehingga mudah
 * disinkronkan dengan stepper "Cara Kerja".
 */
export class JayaEngine {
  private cfg: Required<Omit<JayaConfig, 'seed' | 'rng' | 'initial'>> & {
    seed: number
    rng: Rng
  }
  private rng: Rng
  private positions: number[][] = []
  private proposed: number[][] = []
  private fitness: number[] = []
  private proposedFitness: number[] = []
  private bestIndex = 0
  private worstIndex = 0
  private best: number[] = []
  private worst: number[] = []
  private bestFitness = Number.POSITIVE_INFINITY
  private worstFitness = Number.POSITIVE_INFINITY
  private bestEver = Number.POSITIVE_INFINITY
  private accepted: boolean[] = []
  private updates: JayaUpdate[] = []
  private history: JayaHistoryPoint[] = []
  private phase: JayaPhase = 'init'
  private iteration = 1
  private evaluations = 0
  private acceptedCount = 0
  private rejectedCount = 0
  private stagnation = 0
  private done = false
  private stopReason: JayaSnapshot['stopReason'] = null
  private previousBest: number[] | null = null
  private previousWorst: number[] | null = null
  private readonly initialPopulation?: number[][]

  constructor(config: JayaConfig) {
    const seed = config.seed ?? 20240501
    this.rng = config.rng ?? mulberry32(seed)
    this.cfg = {
      popSize: Math.max(2, Math.round(config.popSize)),
      bounds: config.bounds,
      fn: config.fn,
      maxIter: Math.max(1, Math.round(config.maxIter)),
      stagnationLimit: Math.max(2, config.stagnationLimit ?? 15),
      seed,
      rng: this.rng,
    }
    this.initialPopulation = config.initial
  }

  get config() {
    return this.cfg
  }

  get dimension() {
    return this.cfg.bounds.length
  }

  snapshot(): JayaSnapshot {
    return {
      iteration: this.iteration,
      phase: this.phase,
      positions: this.positions.map((row) => row.slice()),
      proposed: this.proposed.map((row) => row.slice()),
      fitness: this.fitness.slice(),
      proposedFitness: this.proposedFitness.slice(),
      bestIndex: this.bestIndex,
      worstIndex: this.worstIndex,
      best: this.best.slice(),
      worst: this.worst.slice(),
      bestFitness: this.bestFitness,
      worstFitness: this.worstFitness,
      bestEver: this.bestEver,
      accepted: this.accepted.slice(),
      updates: this.updates.map((u) => ({
        ...u,
        from: u.from.slice(),
        proposed: u.proposed.slice(),
        r1: u.r1.slice(),
        r2: u.r2.slice(),
        bestAt: u.bestAt.slice(),
        worstAt: u.worstAt.slice(),
      })),
      history: this.history.map((h) => ({ ...h })),
      evaluations: this.evaluations,
      acceptedCount: this.acceptedCount,
      rejectedCount: this.rejectedCount,
      stagnation: this.stagnation,
      done: this.done,
      stopReason: this.stopReason,
    }
  }

  private randomPosition(): number[] {
    return this.cfg.bounds.map(([min, max]) => min + this.rng() * (max - min))
  }

  private evaluatePositions(rows: number[][]): number[] {
    this.evaluations += rows.length
    return rows.map((row) => this.cfg.fn(row))
  }

  private findBestWorst() {
    let bestIndex = 0
    let worstIndex = 0
    for (let i = 1; i < this.fitness.length; i++) {
      if (this.fitness[i] < this.fitness[bestIndex]) bestIndex = i
      if (this.fitness[i] > this.fitness[worstIndex]) worstIndex = i
    }
    this.bestIndex = bestIndex
    this.worstIndex = worstIndex
    this.best = this.positions[bestIndex].slice()
    this.worst = this.positions[worstIndex].slice()
    this.bestFitness = this.fitness[bestIndex]
    this.worstFitness = this.fitness[worstIndex]
    if (this.bestFitness < this.bestEver) this.bestEver = this.bestFitness
  }

  step(): JayaSnapshot {
    if (this.done) return this.snapshot()

    switch (this.phase) {
      case 'init': {
        if (this.initialPopulation && this.initialPopulation.length >= 2) {
          this.positions = this.initialPopulation.map((row) => row.slice())
        } else {
          this.positions = Array.from({ length: this.cfg.popSize }, () => this.randomPosition())
        }
        this.phase = 'evaluate'
        break
      }
      case 'evaluate': {
        this.fitness = this.evaluatePositions(this.positions)
        this.phase = 'bestWorst'
        break
      }
      case 'bestWorst': {
        this.findBestWorst()
        this.phase = 'update'
        break
      }
      case 'update': {
        this.updates = []
        this.proposed = this.positions.map((row, k) => {
          const next = row.slice()
          const r1: number[] = []
          const r2: number[] = []
          for (let d = 0; d < row.length; d++) {
            const a = this.rng()
            const b = this.rng()
            r1.push(a)
            r2.push(b)
            next[d] = clampToBounds(
              jayaUpdateValue(row[d], this.best[d], this.worst[d], a, b),
              this.cfg.bounds[d],
            )
          }
          this.updates.push({
            candidate: k,
            from: row.slice(),
            proposed: next.slice(),
            r1,
            r2,
            bestAt: this.best.slice(),
            worstAt: this.worst.slice(),
          })
          return next
        })
        this.phase = 'select'
        break
      }
      case 'select': {
        this.proposedFitness = this.evaluatePositions(this.proposed)
        this.accepted = this.proposedFitness.map((value, k) => value < this.fitness[k])
        for (let k = 0; k < this.positions.length; k++) {
          if (this.accepted[k]) {
            this.positions[k] = this.proposed[k].slice()
            this.fitness[k] = this.proposedFitness[k]
            this.acceptedCount++
          } else {
            this.rejectedCount++
          }
        }
        // Sinkronkan status terima pada catatan pembaruan.
        for (const update of this.updates) {
          update.accepted = this.accepted[update.candidate]
        }
        this.phase = 'iterate'
        break
      }
      case 'iterate': {
        this.findBestWorst()
        const mean = this.fitness.reduce((sum, value) => sum + value, 0) / Math.max(1, this.fitness.length)
        this.history.push({
          iteration: this.iteration,
          best: this.bestFitness,
          mean,
          worst: this.worstFitness,
        })

        const stable =
          this.previousBest !== null &&
          this.previousWorst !== null &&
          sameVector(this.previousBest, this.best) &&
          sameVector(this.previousWorst, this.worst)
        this.stagnation = stable ? this.stagnation + 1 : 0
        this.previousBest = this.best.slice()
        this.previousWorst = this.worst.slice()

        if (this.iteration >= this.cfg.maxIter) {
          this.done = true
          this.stopReason = 'max-iterasi'
          this.phase = 'done'
        } else if (this.stagnation >= this.cfg.stagnationLimit) {
          this.done = true
          this.stopReason = 'stagnasi'
          this.phase = 'done'
        } else {
          this.iteration += 1
          this.phase = 'bestWorst'
        }
        break
      }
      default:
        break
    }
    return this.snapshot()
  }

  /** Majukan mesin sampai fase tertentu tercapai (untuk sinkronisasi stepper). */
  runUntilPhase(target: JayaPhase, maxSteps = 24): JayaSnapshot {
    for (let i = 0; i < maxSteps; i++) {
      if (this.phase === target || this.done) break
      this.step()
    }
    return this.snapshot()
  }

  /** Selesaikan satu iterasi penuh (kembali ke fase bestWorst berikutnya). */
  runIteration(): JayaSnapshot {
    for (let i = 0; i < 12; i++) {
      if (this.done) break
      this.step()
      if (this.done || this.phase === 'bestWorst') break
    }
    return this.snapshot()
  }
}

export const JAYA_PHASE_LABEL: Record<JayaPhase, string> = {
  init: 'Inisiasi populasi',
  evaluate: 'Evaluasi fitness',
  bestWorst: 'Menentukan P_best & P_worst',
  update: 'Pembaruan kandidat',
  select: 'Seleksi solusi',
  iterate: 'Iterasi baru',
  done: 'Selesai',
}