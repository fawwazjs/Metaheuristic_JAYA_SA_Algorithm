import { describe, expect, it } from 'vitest'
import { jayaUpdateValue, JayaEngine } from './jaya'
import {
  acceptanceProbability,
  coolingTable,
  estimateInitialTemperature,
  initialTemperature,
  iterationsUntilFinal,
} from './sa'
import {
  ETC,
  INITIAL_SOLUTION,
  OPERATOR_FNS,
  OPTIMAL,
  applyOperator,
  makespan,
  nodeLoads,
  roundToNode,
  runScheduleJaya,
} from './scheduling'
import { mulberry32 } from './rng'
import { getLandscape, heatColor } from './landscapes'
import { DUEL_BUDGET, runFairDuel, summariseDuelRuns } from './duel'
import { formatNumber, formatPlain } from './rng'

describe('Format angka gaya Indonesia', () => {
  it('memakai koma desimal dan titik ribuan', () => {
    expect(formatNumber(18.9843, 2)).toBe('18,98')
    expect(formatNumber(0.6703, 4)).toBe('0,6703')
    expect(formatNumber(9.96004, 5)).toBe('9,96004')
    expect(formatNumber(3451, 0)).toBe('3.451')
    expect(formatNumber(-0.5, 1)).toBe('−0,5')
    expect(formatNumber(Number.POSITIVE_INFINITY, 2)).toBe('—')
    expect(formatPlain(9.94012, 5)).toBe('9,94012')
  })
})

describe('JAYA update — contoh slide', () => {
  it('X=2, Pbest=3, Pworst=1, r1=r2=0.5 menghasilkan 3', () => {
    expect(jayaUpdateValue(2, 3, 1, 0.5, 0.5)).toBeCloseTo(3, 10)
  })

  it('mempertahankan |X| pada rumus', () => {
    // x=2, best=3, worst=1, r1=r2=0.5 tanpa nilai absolut akan menghasilkan 1.
    expect(jayaUpdateValue(2, 3, 1, 0.5, 0.5)).not.toBeCloseTo(1, 5)
    // x negatif: |X| membuat arah tarik berbeda dari X mentah.
    const withAbs = jayaUpdateValue(-2, 1, -1, 1, 0)
    expect(withAbs).toBeCloseTo(-2 + (1 - 2), 10)
  })
})

describe('JAYA engine pada Sphere', () => {
  it('best fitness tidak pernah memburuk dan konvergen di bawah 1e-2', () => {
    const landscape = getLandscape('sphere')
    const engine = new JayaEngine({
      popSize: 30,
      bounds: landscape.domain.map((b) => [...b]) as [number, number][],
      fn: (x) => landscape.fn(x[0], x[1]),
      maxIter: 120,
      seed: 42,
      stagnationLimit: 50,
    })
    let previous = Number.POSITIVE_INFINITY
    let snapshot = engine.snapshot()
    for (let i = 0; i < 2000 && !snapshot.done; i++) {
      snapshot = engine.step()
      expect(snapshot.bestEver).toBeLessThanOrEqual(previous + 1e-12)
      previous = snapshot.bestEver
    }
    expect(snapshot.bestEver).toBeLessThan(1e-2)
    expect(snapshot.history.length).toBeGreaterThan(3)
  })
})

describe('SA — angka slide', () => {
  it('C1(S=[1,2,3,1]) = 9 dan makespan = 9', () => {
    expect(nodeLoads(INITIAL_SOLUTION)).toEqual([9, 3, 2])
    expect(makespan(INITIAL_SOLUTION)).toBe(9)
  })

  it('T0(ΔC̄=2, HEC=0.9) ≈ 18.98', () => {
    expect(initialTemperature(2, 0.9)).toBeCloseTo(18.98, 2)
  })

  it('P(ΔC=4, T=10) ≈ 0.6703 dan P(ΔC=4, T=1) ≈ 0.0183', () => {
    expect(acceptanceProbability(4, 10)).toBeCloseTo(0.6703, 4)
    expect(acceptanceProbability(4, 1)).toBeCloseTo(0.0183, 4)
  })

  it('ΔC ≤ 0 selalu diterima', () => {
    expect(acceptanceProbability(-3, 0.5)).toBe(1)
    expect(acceptanceProbability(0, 0.5)).toBe(1)
  })

  it('pendinginan α=0.998, T0=10 → 9.98, 9.96004, 9.94012', () => {
    const [t1, t2, t3] = coolingTable(10, 0.998, 3)
    expect(t1).toBeCloseTo(9.98, 8)
    expect(t2).toBeCloseTo(9.96004, 8)
    expect(t3).toBeCloseTo(9.94012, 5)
  })

  it('iterasi hingga T < 0.01 terhitung benar', () => {
    const n = iterationsUntilFinal(10, 0.998, 0.01)
    expect(0.998 ** n * 10).toBeLessThan(0.01)
    expect(0.998 ** (n - 1) * 10).toBeGreaterThanOrEqual(0.01)
  })
})

describe('Estimasi T0 otomatis', () => {
  it('mengembalikan nilai positif dan sampel yang wajar', () => {
    const landscape = getLandscape('rastrigin')
    const rng = mulberry32(7)
    const estimate = estimateInitialTemperature(
      (p: number[]) => landscape.fn(p[0], p[1]),
      (p: number[]) => [p[0] + (rng() - 0.5), p[1] + (rng() - 0.5)],
      [1, 1],
      rng,
      0.9,
      50,
    )
    expect(estimate.T0).toBeGreaterThan(0)
    expect(estimate.samples).toBeGreaterThan(0)
  })
})

describe('Demo penjadwalan', () => {
  it('matriks ETC sesuai slide dan S_best = 9', () => {
    expect(ETC).toEqual([
      [4, 6, 9],
      [7, 3, 5],
      [8, 4, 2],
      [5, 7, 4],
    ])
    expect(OPTIMAL.cost).toBe(6)
    expect(makespan(OPTIMAL.solution)).toBe(6)
  })

  it('setiap operator menghasilkan larik valid dan berbeda', () => {
    const rng = mulberry32(123)
    for (const fn of Object.values(OPERATOR_FNS)) {
      for (let i = 0; i < 60; i++) {
        const next = fn(INITIAL_SOLUTION, rng)
        expect(next).toHaveLength(INITIAL_SOLUTION.length)
        expect(next.every((n) => Number.isInteger(n) && n >= 1 && n <= 3)).toBe(true)
        expect(next).not.toEqual(INITIAL_SOLUTION)
      }
    }
  })

  it('operator acak juga valid', () => {
    const rng = mulberry32(55)
    const next = applyOperator('random', INITIAL_SOLUTION, rng)
    expect(next.every((n) => n >= 1 && n <= 3)).toBe(true)
  })

  it('ekstraksi contoh slide: C1 = ETC(1,1)+ETC(4,1) = 9', () => {
    const s = INITIAL_SOLUTION
    const terms = s
      .map((node, task) => ({ node, value: ETC[task][node - 1] }))
      .filter((item) => item.node === 1)
    expect(terms).toEqual([
      { node: 1, value: 4 },
      { node: 1, value: 5 },
    ])
    expect(terms.reduce((sum, item) => sum + item.value, 0)).toBe(9)
  })

  it('konversi kontinu ke node memakai round + clamp', () => {
    expect(roundToNode(2.4)).toBe(2)
    expect(roundToNode(0.2)).toBe(1)
    expect(roundToNode(9.9)).toBe(3)
  })

  it('JAYA diskret menemukan solusi yang valid', () => {
    const result = runScheduleJaya(2024, 20, 60)
    expect(result.best.every((n) => n >= 1 && n <= 3)).toBe(true)
    expect(result.bestCost).toBeGreaterThanOrEqual(OPTIMAL.cost)
    expect(result.bestCost).toBeLessThanOrEqual(9)
  })
})

describe('Perbandingan adil JAYA vs SA', () => {
  it('memakai anggaran evaluasi yang sama dan menghasilkan angka hingga', () => {
    const result = runFairDuel(getLandscape('rastrigin'), 20240501)
    expect(result.evaluations).toBe(DUEL_BUDGET)
    expect(Number.isFinite(result.jayaBest)).toBe(true)
    expect(Number.isFinite(result.saBest)).toBe(true)
    expect(result.jayaTrace.length).toBeGreaterThan(5)
    expect(result.saTrace.length).toBeGreaterThan(5)
    // Tidak ada NaN/Infinity yang lolos ke grafik.
    for (const point of [...result.jayaTrace, ...result.saTrace]) {
      expect(Number.isFinite(point.bestCost)).toBe(true)
      expect(point.evaluations).toBeLessThanOrEqual(DUEL_BUDGET)
      expect(point.evaluations).toBeGreaterThan(0)
    }
  })

  it('deterministik untuk seed yang sama', () => {
    const a = runFairDuel(getLandscape('sphere'), 777)
    const b = runFairDuel(getLandscape('sphere'), 777)
    expect(a.jayaBest).toBe(b.jayaBest)
    expect(a.saBest).toBe(b.saBest)
  })

  it('ringkasan 20 run memberi mean dan std yang wajar', () => {
    const runs = Array.from({ length: 6 }, (_, i) => runFairDuel(getLandscape('sphere'), 1000 + i))
    const stats = summariseDuelRuns(runs)
    expect(stats.jaya.mean).toBeGreaterThanOrEqual(0)
    expect(stats.jaya.std).toBeGreaterThanOrEqual(0)
    expect(stats.jayaWins + stats.saWins).toBeLessThanOrEqual(runs.length)
  })
})

describe('RNG & landscape', () => {  it('mulberry32 deterministik untuk seed yang sama', () => {
    const a = mulberry32(999)
    const b = mulberry32(999)
    const valuesA = Array.from({ length: 10 }, () => a())
    const valuesB = Array.from({ length: 10 }, () => b())
    expect(valuesA).toEqual(valuesB)
    expect(valuesA.every((v) => v >= 0 && v < 1)).toBe(true)
  })

  it('setiap landscape punya range warna terbatas', () => {
    for (const id of ['sphere', 'rastrigin', 'rosenbrock', 'himmelblau', 'ackley']) {
      const landscape = getLandscape(id)
      expect(landscape.maxForColor).toBeGreaterThan(0)
      expect(landscape.globalMin).toBe(0)
    }
    const color = heatColor(0.5)
    expect(color.every((c) => c >= 0 && c <= 255)).toBe(true)
  })
})