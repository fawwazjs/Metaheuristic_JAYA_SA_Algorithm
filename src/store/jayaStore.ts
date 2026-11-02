import { create } from 'zustand'
import { JayaEngine, type JayaPhase, type JayaSnapshot } from '../lib/algorithms/jaya'
import { getLandscape } from '../lib/algorithms/landscapes'
import { randomSeed } from '../lib/algorithms/rng'

export type JayaSpeed = 0.25 | 0.5 | 1 | 2 | 4

interface JayaSettings {
  landscapeId: string
  popSize: number
  maxIter: number
  seed: number
}

interface JayaStore extends JayaSettings {
  speed: JayaSpeed
  running: boolean
  showVectors: boolean
  showTrail: boolean
  showContour: boolean
  simultaneous: boolean
  phaseFocus: JayaPhase | null
  snapshot: JayaSnapshot | null
  selected: number | null
  engine: JayaEngine | null
  totalSteps: number

  init: () => void
  setLandscape: (id: string) => void
  setPopSize: (size: number) => void
  setMaxIter: (value: number) => void
  setSeed: (seed: number) => void
  newSeed: () => void
  setSpeed: (speed: JayaSpeed) => void
  toggleRunning: () => void
  pause: () => void
  toggleVectors: () => void
  toggleTrail: () => void
  toggleContour: () => void
  toggleSimultaneous: () => void
  setPhaseFocus: (phase: JayaPhase | null) => void
  select: (index: number | null) => void
  stepPhase: () => void
  stepIteration: () => void
  undo: () => void
  reset: () => void
  demoPhase: (phase: JayaPhase) => void
}

function buildEngine(settings: JayaSettings): JayaEngine {
  const landscape = getLandscape(settings.landscapeId)
  return new JayaEngine({
    popSize: settings.popSize,
    bounds: landscape.domain.map((bound) => [...bound]) as [number, number][],
    fn: (x) => landscape.fn(x[0], x[1]),
    maxIter: settings.maxIter,
    seed: settings.seed,
    stagnationLimit: 18,
  })
}

function settingsOf(state: JayaStore): JayaSettings {
  return {
    landscapeId: state.landscapeId,
    popSize: state.popSize,
    maxIter: state.maxIter,
    seed: state.seed,
  }
}

/** Putar ulang mesin deterministik dari awal hingga `steps` langkah. */
function replay(settings: JayaSettings, steps: number): { engine: JayaEngine; snapshot: JayaSnapshot } {
  const engine = buildEngine(settings)
  let snapshot = engine.snapshot()
  for (let i = 0; i < steps; i++) {
    if (snapshot.done) break
    snapshot = engine.step()
  }
  return { engine, snapshot }
}

export const useJayaStore = create<JayaStore>((set, get) => ({
  landscapeId: 'rastrigin',
  popSize: 24,
  maxIter: 40,
  seed: 20240501,
  speed: 1,
  running: false,
  showVectors: true,
  showTrail: true,
  showContour: true,
  simultaneous: true,
  phaseFocus: null,
  snapshot: null,
  selected: null,
  engine: null,
  totalSteps: 0,

  init: () => {
    const { engine, snapshot } = replay(settingsOf(get()), 1)
    set({ engine, snapshot, running: false, selected: null, totalSteps: 1 })
  },

  setLandscape: (id) => {
    set({ landscapeId: id })
    get().init()
  },
  setPopSize: (size) => {
    set({ popSize: Math.min(60, Math.max(4, Math.round(size))) })
    get().init()
  },
  setMaxIter: (value) => {
    set({ maxIter: Math.min(300, Math.max(5, Math.round(value))) })
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
  setSpeed: (speed) => set({ speed }),
  toggleRunning: () => {
    const { running, snapshot } = get()
    if (!running && snapshot?.done) {
      const { engine, snapshot: fresh } = replay(settingsOf(get()), 1)
      set({ engine, snapshot: fresh, totalSteps: 1, running: true })
      return
    }
    set({ running: !running })
  },
  pause: () => set({ running: false }),
  toggleVectors: () => set((state) => ({ showVectors: !state.showVectors })),
  toggleTrail: () => set((state) => ({ showTrail: !state.showTrail })),
  toggleContour: () => set((state) => ({ showContour: !state.showContour })),
  toggleSimultaneous: () => set((state) => ({ simultaneous: !state.simultaneous })),
  setPhaseFocus: (phase) => set({ phaseFocus: phase }),
  select: (index) => set({ selected: index }),

  stepPhase: () => {
    const { engine, totalSteps } = get()
    if (!engine || engine.snapshot().done) return
    const snapshot = engine.step()
    set({ snapshot, totalSteps: totalSteps + 1 })
  },

  stepIteration: () => {
    const { engine, totalSteps } = get()
    if (!engine) return
    let steps = 0
    let sawCycle = false
    let snapshot = engine.snapshot()
    for (let i = 0; i < 12; i++) {
      if (snapshot.done) break
      snapshot = engine.step()
      steps += 1
      if (snapshot.phase === 'update' || snapshot.phase === 'select' || snapshot.phase === 'iterate') {
        sawCycle = true
      }
      if (snapshot.phase === 'done') break
      if (snapshot.phase === 'bestWorst' && sawCycle) break
    }
    set({ snapshot, totalSteps: totalSteps + steps })
  },

  undo: () => {
    const state = get()
    const target = state.totalSteps - 1
    if (target < 1) return
    const { engine, snapshot } = replay(settingsOf(state), target)
    set({ engine, snapshot, totalSteps: target, running: false })
  },

  reset: () => {
    get().init()
  },

  demoPhase: (phase) => {
    const { engine } = get()
    if (!engine) return
    const snapshot = engine.runUntilPhase(phase)
    set({ snapshot, totalSteps: get().totalSteps + 1 })
  },
}))