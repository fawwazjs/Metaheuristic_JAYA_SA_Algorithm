/**
 * Demo penjadwalan task → node dengan dataset persis dari slide.
 * Dipakai oleh papan ETC interaktif dan mesin SA diskret.
 */
import { AnnealingEngine } from './sa'
import { jayaUpdateValue, clampToBounds } from './jaya'
import { mulberry32, randomInt, shuffle, type Rng } from './rng'

export const ETC: number[][] = [
  [4, 6, 9],
  [7, 3, 5],
  [8, 4, 2],
  [5, 7, 4],
]

export const TASK_NAMES = ['t1', 't2', 't3', 't4']
export const NODE_NAMES = ['Node 1', 'Node 2', 'Node 3']
export const TASK_COLORS = ['#7A1E1E', '#3F5B3A', '#8A5A2B', '#5E6A73']
export const INITIAL_SOLUTION = [1, 2, 3, 1]

export type Solution = number[]

export function nodeLoads(solution: Solution): number[] {
  const loads = new Array<number>(ETC[0].length).fill(0)
  for (let i = 0; i < ETC.length; i++) {
    const node = solution[i] - 1
    if (node >= 0 && node < loads.length) loads[node] += ETC[i][node]
  }
  return loads
}

/** f(S) = max_j C_j(S). */
export function makespan(solution: Solution): number {
  return Math.max(...nodeLoads(solution))
}

export function isValidSolution(solution: Solution, nodes = ETC[0].length): boolean {
  return (
    solution.length === ETC.length && solution.every((value) => Number.isInteger(value) && value >= 1 && value <= nodes)
  )
}

const OPERATOR_IDS = [
  'new-node-insertion',
  'swap',
  'random-shuffle',
  'displacement',
  'insertion',
  'inversion',
] as const

export type OperatorId = (typeof OPERATOR_IDS)[number] | 'random'

export interface OperatorInfo {
  id: OperatorId
  label: string
  short: string
  description: string
}

export const OPERATORS: OperatorInfo[] = [
  {
    id: 'new-node-insertion',
    label: 'New Node Insertion',
    short: 'Node baru',
    description: 'Satu tugas dipindah ke node baru (acak, berbeda dari node lama).',
  },
  {
    id: 'swap',
    label: 'Swap',
    short: 'Tukar',
    description: 'Dua tugas bertukar node.',
  },
  {
    id: 'random-shuffle',
    label: 'Random Shuffle',
    short: 'Acak ulang',
    description: 'Sebagian tugas diacak penempatannya di antara posisi mereka.',
  },
  {
    id: 'displacement',
    label: 'Displacement',
    short: 'Geser',
    description: 'Sekelompok penempatan diambil lalu digeser ke posisi lain.',
  },
  {
    id: 'insertion',
    label: 'Insertion',
    short: 'Sisip',
    description: 'Satu penempatan diambil dan disisipkan ke posisi lain.',
  },
  {
    id: 'inversion',
    label: 'Inversion',
    short: 'Balik',
    description: 'Urutan sebuah segmen penempatan dibalik.',
  },
]

function newArrangement(solution: Solution): Solution {
  return solution.slice()
}

function differs(a: Solution, b: Solution): boolean {
  return a.some((value, i) => value !== b[i])
}

/** Pastikan operator menghasilkan solusi berbeda bila memungkinkan. */
function ensureChanged(candidate: Solution, base: Solution, rng: Rng): Solution {
  if (differs(candidate, base)) return candidate
  return newNodeInsertion(base, rng)
}

function newNodeInsertion(solution: Solution, rng: Rng): Solution {
  const nodes = ETC[0].length
  for (let attempt = 0; attempt < 8; attempt++) {
    const i = randomInt(rng, 0, solution.length - 1)
    const options: number[] = []
    for (let n = 1; n <= nodes; n++) if (n !== solution[i]) options.push(n)
    if (options.length === 0) return solution.slice()
    const next = newArrangement(solution)
    next[i] = options[randomInt(rng, 0, options.length - 1)]
    if (differs(next, solution)) return next
  }
  return solution.slice()
}

function swap(solution: Solution, rng: Rng): Solution {
  if (solution.length < 2) return solution.slice()
  let a = randomInt(rng, 0, solution.length - 1)
  let b = randomInt(rng, 0, solution.length - 2)
  if (b >= a) b += 1
  const next = newArrangement(solution)
  ;[next[a], next[b]] = [next[b], next[a]]
  return ensureChanged(next, solution, rng)
}

function randomShuffle(solution: Solution, rng: Rng): Solution {
  if (solution.length < 2) return solution.slice()
  const size = randomInt(rng, 2, solution.length)
  const indices = shuffle(
    rng,
    solution.map((_, i) => i),
  ).slice(0, size)
  const values = indices.map((i) => solution[i])
  const shuffled = shuffle(rng, values)
  const next = newArrangement(solution)
  indices.forEach((idx, k) => {
    next[idx] = shuffled[k]
  })
  return ensureChanged(next, solution, rng)
}

function displacement(solution: Solution, rng: Rng): Solution {
  if (solution.length < 3) return swap(solution, rng)
  const a = randomInt(rng, 0, solution.length - 2)
  const b = randomInt(rng, a + 1, solution.length - 1)
  const segment = solution.slice(a, b + 1)
  const rest = [...solution.slice(0, a), ...solution.slice(b + 1)]
  const target = randomInt(rng, 0, rest.length)
  const next = [...rest.slice(0, target), ...segment, ...rest.slice(target)]
  return ensureChanged(next, solution, rng)
}

function insertion(solution: Solution, rng: Rng): Solution {
  if (solution.length < 2) return solution.slice()
  const from = randomInt(rng, 0, solution.length - 1)
  let to = randomInt(rng, 0, solution.length - 2)
  if (to >= from) to += 1
  const next = solution.slice()
  const [value] = next.splice(from, 1)
  next.splice(to, 0, value)
  return ensureChanged(next, solution, rng)
}

function inversion(solution: Solution, rng: Rng): Solution {
  if (solution.length < 2) return swap(solution, rng)
  const a = randomInt(rng, 0, solution.length - 2)
  const b = randomInt(rng, a + 1, solution.length - 1)
  const next = solution.slice()
  const segment = next.slice(a, b + 1).reverse()
  next.splice(a, segment.length, ...segment)
  return ensureChanged(next, solution, rng)
}

export const OPERATOR_FNS: Record<Exclude<OperatorId, 'random'>, (s: Solution, rng: Rng) => Solution> = {
  'new-node-insertion': newNodeInsertion,
  swap,
  'random-shuffle': randomShuffle,
  displacement,
  insertion,
  inversion,
}

export function applyOperator(
  operator: OperatorId,
  solution: Solution,
  rng: Rng,
): Solution {
  if (operator === 'random') {
    const ids = Object.keys(OPERATOR_FNS) as Array<Exclude<OperatorId, 'random'>>
    const picked = ids[Math.floor(rng() * ids.length)]
    return OPERATOR_FNS[picked](solution, rng)
  }
  return OPERATOR_FNS[operator](solution, rng)
}

/** Solusi optimal brute-force (3^4 = 81 kemungkinan). */
export function bruteForceOptimal(): { solution: Solution; cost: number; count: number } {
  const nodes = ETC[0].length
  let bestSolution: Solution = INITIAL_SOLUTION.slice()
  let bestCost = Number.POSITIVE_INFINITY
  let count = 0
  const total = nodes ** ETC.length
  for (let code = 0; code < total; code++) {
    const solution: Solution = []
    let rest = code
    for (let i = 0; i < ETC.length; i++) {
      solution.push((rest % nodes) + 1)
      rest = Math.floor(rest / nodes)
    }
    const cost = makespan(solution)
    if (cost < bestCost) {
      bestCost = cost
      bestSolution = solution
      count = 1
    } else if (cost === bestCost) {
      count++
    }
  }
  return { solution: bestSolution, cost: bestCost, count }
}

export const OPTIMAL = bruteForceOptimal()

export interface ScheduleSaOptions {
  initial?: Solution
  operator?: OperatorId
  T0?: number | 'auto'
  alpha?: number
  innerLoops?: number
  Tfinal?: number
  hec?: number
  seed?: number
}

export function createScheduleSa(options: ScheduleSaOptions = {}): AnnealingEngine<Solution> {
  const seed = options.seed ?? 20240501
  const rng = mulberry32(seed)
  const operator = options.operator ?? 'random'
  return new AnnealingEngine<Solution>({
    initial: (options.initial ?? INITIAL_SOLUTION).slice(),
    costFn: makespan,
    neighbor: (solution) => applyOperator(operator, solution, rng),
    T0: options.T0 ?? 'auto',
    alpha: options.alpha ?? 0.9,
    innerLoops: options.innerLoops ?? 12,
    Tfinal: options.Tfinal ?? 0.01,
    hec: options.hec ?? 0.9,
    seed,
    rng,
  })
}

/** Konversi nilai kontinu JAYA ke nomor node diskret: round + clamp. */
export function roundToNode(value: number, nodeCount = ETC[0].length): number {
  return Math.min(nodeCount, Math.max(1, Math.round(value)))
}

export interface ScheduleJayaResult {
  best: Solution
  bestCost: number
  history: Array<{ iteration: number; best: number; mean: number }>
  evaluations: number
}

/** JAYA diskret untuk dataset yang sama (opsi pembanding di papan penjadwalan). */
export function runScheduleJaya(seed = 20240501, popSize = 16, maxIter = 80): ScheduleJayaResult {
  const rng = mulberry32(seed)
  const nodes = ETC[0].length
  const dim = ETC.length
  const toSolution = (row: number[]) => row.map((value) => roundToNode(value, nodes))
  const fitnessOf = (row: number[]) => makespan(toSolution(row))
  const bounds: Array<[number, number]> = Array.from({ length: dim }, () => [1, nodes])

  let population: number[][] = Array.from({ length: popSize }, () =>
    Array.from({ length: dim }, () => 1 + rng() * (nodes - 1)),
  )
  let fitness = population.map(fitnessOf)
  let evaluations = popSize
  const history: Array<{ iteration: number; best: number; mean: number }> = []
  let bestRow = population[0].slice()
  let bestCost = fitnessOf(bestRow)

  for (let iteration = 1; iteration <= maxIter; iteration++) {
    let bestIndex = 0
    let worstIndex = 0
    for (let k = 1; k < population.length; k++) {
      if (fitness[k] < fitness[bestIndex]) bestIndex = k
      if (fitness[k] > fitness[worstIndex]) worstIndex = k
    }
    const bestRowNow = population[bestIndex].slice()
    const worstRowNow = population[worstIndex].slice()

    for (let k = 0; k < population.length; k++) {
      const current = population[k]
      const next = current.slice()
      for (let d = 0; d < dim; d++) {
        const r1 = rng()
        const r2 = rng()
        next[d] = clampToBounds(
          jayaUpdateValue(current[d], bestRowNow[d], worstRowNow[d], r1, r2),
          bounds[d],
        )
      }
      const nextFitness = fitnessOf(next)
      evaluations++
      if (nextFitness < fitness[k]) {
        population[k] = next
        fitness[k] = nextFitness
        if (nextFitness < bestCost) {
          bestCost = nextFitness
          bestRow = next.slice()
        }
      }
    }

    const bestNow = Math.min(...fitness)
    const meanNow = fitness.reduce((sum, value) => sum + value, 0) / fitness.length
    history.push({ iteration, best: bestNow, mean: meanNow })
  }

  const finalSolution = toSolution(bestRow)
  return {
    best: finalSolution,
    bestCost: makespan(finalSolution),
    history,
    evaluations,
  }
}

/** JAYA kontinu untuk fungsi bernilai vektor (dipakai demo kalkulator). */
export function jayaStepExample(
  x: number,
  best: number,
  worst: number,
  r1: number,
  r2: number,
  bounds: [number, number] = [1, 3],
): { raw: number; clamped: number } {
  const raw = jayaUpdateValue(x, best, worst, r1, r2)
  return { raw, clamped: clampToBounds(raw, bounds) }
}