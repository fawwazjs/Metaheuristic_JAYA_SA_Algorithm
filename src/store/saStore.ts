import { create } from 'zustand'
import { AnnealingEngine, type SaSnapshot, type SaTrial } from '../lib/algorithms/sa'
import { getLandscape } from '../lib/algorithms/landscapes'
import { clamp, makeGaussian, mulberry32, randomSeed } from '../lib/algorithms/rng'

export type SaSpeed = 0.25 | 0.5 | 1 | 2 | 4 | 8

interface SaSettings {
  landscapeId: string
  t0Mode: 'auto' | 'manual'
  T0: number
  alpha: number
  innerLoops: number
  Tfinal: number
  stepSize: number
  seed: number
  hec: number
}

interface SaStore extends SaSettings {
  speed: SaSpeed
  running: boolean
  showGhost: boolean
  showTrail: boolean
  showThermometer: boolean
  snapshot: SaSnapshot<number[]> | null
  log: SaTrial<number[]>[]
  engine: AnnealingEngine<number[]> | null
  totalSteps: number

  init: () => void
  setLandscape: (id: string) => void
  setT0Mode: (mode: 'auto' | 'manual') => void
  setT0: (value: number) => void
  setAlpha: (value: number) => void
  setInnerLoops: (value: number) => void
  setTfinal: (value: number) => void
  setStepSize: (value: number) => void
  setSeed: (seed: number) => void
  newSeed: () => void
  setHec: (value: number) => void
  setSpeed: (value: SaSpeed) => void
  toggleRunning: () => void
  pause: () => void
  toggleGhost: () => void
  toggleTrail: () => void
  toggleThermometer: () => void
  step: () => void
  stepTemperature: () => void
  undo: () => void
  reset: () => void
}

function createEngine(settings: SaSettings): AnnealingEngine<number[]> {
  const landscape = getLandscape(settings.landscapeId)
  const [[x0, x1], [y0, y1]] = landscape.domain
  const initialRng = mulberry32((settings.seed ^ 0x9e3779b9) >>> 0)
  const initial: [number, number] = [
    x0 + initialRng() * (x1 - x0),
    y0 + initialRng() * (y1 - y0),
  ]
  return new AnnealingEngine<number[]>({
    initial,
    costFn: (p) => landscape.fn(p[0], p[1]),
    neighbor: makeNeighbor(landscape, settings.seed, settings.stepSize),
    T0: settings.t0Mode === 'auto' ? 'auto' : settings.T0,
    alpha: settings.alpha,
    innerLoops: settings.innerLoops,
    Tfinal: settings.Tfinal,
    hec: settings.hec,
    seed: settings.seed,
    maxEvaluations: 20000,
  })
}

function makeNeighbor(
  landscape: ReturnType<typeof getLandscape>,
  seed: number,
  stepSize: number,
) {
  const gaussian = makeGaussian(mulberry32((seed ^ 0x27d4eb2d) >>> 0))
  return (point: number[]) => {
    const next = point.slice()
    const [[x0, x1], [y0, y1]] = landscape.domain
    next[0] = clamp(next[0] + gaussian() * stepSize, x0, x1)
    next[1] = clamp(next[1] + gaussian() * stepSize, y0, y1)
    return next
  }
}

function settingsOf(state: SaStore): SaSettings {
  return {
    landscapeId: state.landscapeId,
    t0Mode: state.t0Mode,
    T0: state.T0,
    alpha: state.alpha,
    innerLoops: state.innerLoops,
    Tfinal: state.Tfinal,
    stepSize: state.stepSize,
    seed: state.seed,
    hec: state.hec,
  }
}

function replay(settings: SaSettings, steps: number) {
  const engine = createEngine(settings)
  let snapshot = engine.snapshot()
  const log: SaTrial<number[]>[] = []
  for (let i = 0; i < steps; i++) {
    if (snapshot.done) break
    snapshot = engine.step()
    if (snapshot.lastTrial) log.push(snapshot.lastTrial)
  }
  return { engine, snapshot, log: log.slice(-7) }
}

export const useSaStore = create<SaStore>((set, get) => ({
  landscapeId: 'rastrigin',
  t0Mode: 'auto',
  T0: 20,
  alpha: 0.99,
  innerLoops: 30,
  Tfinal: 0.01,
  stepSize: 0.6,
  seed: 20240501,
  hec: 0.9,
  speed: 1,
  running: false,
  showGhost: true,
  showTrail: true,
  showThermometer: true,
  snapshot: null,
  log: [],
  engine: null,
  totalSteps: 0,

  init: () => {
    const engine = createEngine(settingsOf(get()))
    set({ engine, snapshot: engine.snapshot(), log: [], running: false, totalSteps: 0 })
  },
  setLandscape: (id) => {
    set({ landscapeId: id })
    get().init()
  },
  setT0Mode: (mode) => {
    set({ t0Mode: mode })
    get().init()
  },
  setT0: (value) => {
    set({ T0: Math.min(200, Math.max(0.1, value)) })
    if (get().t0Mode === 'manual') get().init()
  },
  setAlpha: (value) => {
    set({ alpha: Math.min(0.999, Math.max(0.8, value)) })
    get().init()
  },
  setInnerLoops: (value) => {
    set({ innerLoops: Math.min(200, Math.max(1, Math.round(value))) })
    get().init()
  },
  setTfinal: (value) => {
    set({ Tfinal: Math.min(5, Math.max(0.001, value)) })
    get().init()
  },
  setStepSize: (value) => {
    set({ stepSize: Math.min(3, Math.max(0.05, value)) })
    get().init()
  },
  setSeed: (seed) => {
    set({ seed: Math.max(0, Math.floor(seed)) })
    get().init()
  },
  newSeed: () => {
    set({ seed: randomSeed() })
    get().init()
  },
  setHec: (value) => {
    set({ hec: Math.min(0.999, Math.max(0.5, value)) })
    if (get().t0Mode === 'auto') get().init()
  },
  setSpeed: (value) => set({ speed: value }),
  toggleRunning: () => {
    const { running, snapshot } = get()
    if (!running && snapshot?.done) {
      get().init()
      set({ running: true })
      return
    }
    set({ running: !running })
  },
  pause: () => set({ running: false }),
  toggleGhost: () => set((state) => ({ showGhost: !state.showGhost })),
  toggleTrail: () => set((state) => ({ showTrail: !state.showTrail })),
  toggleThermometer: () => set((state) => ({ showThermometer: !state.showThermometer })),

  step: () => {
    const { engine, totalSteps, log } = get()
    if (!engine) return
    const snapshot = engine.step()
    const nextLog = snapshot.lastTrial ? [...log, snapshot.lastTrial].slice(-7) : log
    set({ snapshot, log: nextLog, totalSteps: totalSteps + 1 })
  },

  stepTemperature: () => {
    const { engine, totalSteps, log } = get()
    if (!engine) return
    let steps = 0
    let snapshot = engine.snapshot()
    const startIteration = snapshot.iteration
    for (let i = 0; i < 100000; i++) {
      if (snapshot.done) break
      snapshot = engine.step()
      steps++
      if (snapshot.lastTrial) log.push(snapshot.lastTrial)
      if (snapshot.done || snapshot.iteration !== startIteration) break
    }
    set({ snapshot, log: log.slice(-7), totalSteps: totalSteps + steps })
  },

  undo: () => {
    const state = get()
    const target = state.totalSteps - 1
    if (target < 0) return
    const { engine, snapshot, log } = replay(settingsOf(state), target)
    set({ engine, snapshot, log, totalSteps: target, running: false })
  },

  reset: () => get().init(),
}))