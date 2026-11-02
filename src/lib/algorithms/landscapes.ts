/**
 * Fungsi uji (landscape) yang diminimalkan, beserta metadata untuk pewarnaan
 * heatmap 2D dan pendisplacementan lanskap 3D.
 */
export type Bounds = [[number, number], [number, number]]

export interface Landscape {
  id: string
  name: string
  epithet: string
  fn: (x: number, y: number) => number
  domain: Bounds
  globalMin: number
  globalPoint: [number, number]
  /** Nilai maksimum hasil sampling, dipakai untuk normalisasi warna. */
  maxForColor: number
  /** Eksponen untuk menipiskan tinggi 3D agar tidak terlalu curam. */
  heightPower: number
  description: string
}

const sphere = (x: number, y: number) => x * x + y * y

const rastrigin = (x: number, y: number) =>
  20 + x * x + y * y - 10 * (Math.cos(2 * Math.PI * x) + Math.cos(2 * Math.PI * y))

const rosenbrock = (x: number, y: number) => (1 - x) ** 2 + 100 * (y - x * x) ** 2

const himmelblau = (x: number, y: number) => (x * x + y - 11) ** 2 + (x + y * y - 7) ** 2

const ackley = (x: number, y: number) =>
  -20 * Math.exp(-0.2 * Math.sqrt(0.5 * (x * x + y * y))) -
  Math.exp(0.5 * (Math.cos(2 * Math.PI * x) + Math.cos(2 * Math.PI * y))) +
  Math.E +
  20

function sampleMax(fn: (x: number, y: number) => number, domain: Bounds, steps = 64): number {
  let max = 0
  const [[x0, x1], [y0, y1]] = domain
  for (let i = 0; i <= steps; i++) {
    for (let j = 0; j <= steps; j++) {
      const value = fn(x0 + ((x1 - x0) * i) / steps, y0 + ((y1 - y0) * j) / steps)
      if (value > max) max = value
    }
  }
  return max
}

function makeLandscape(
  input: Omit<Landscape, 'maxForColor'> & { maxForColor?: number },
): Landscape {
  const maxForColor = input.maxForColor ?? sampleMax(input.fn, input.domain)
  return { ...input, maxForColor }
}

export const LANDSCAPES: Landscape[] = [
  makeLandscape({
    id: 'sphere',
    name: 'Sphere',
    epithet: 'Unimodal',
    fn: sphere,
    domain: [
      [-5, 5],
      [-5, 5],
    ],
    globalMin: 0,
    globalPoint: [0, 0],
    heightPower: 0.6,
    description: 'Unimodal dan mulus — uji dasar untuk setiap algoritma.',
  }),
  makeLandscape({
    id: 'rastrigin',
    name: 'Rastrigin',
    epithet: 'Banyak optimum lokal',
    fn: rastrigin,
    domain: [
      [-5.12, 5.12],
      [-5.12, 5.12],
    ],
    globalMin: 0,
    globalPoint: [0, 0],
    heightPower: 0.5,
    description: 'Banyak optimum lokal; populasi mudah terjebak di lembah lokal.',
  }),
  makeLandscape({
    id: 'rosenbrock',
    name: 'Rosenbrock',
    epithet: 'Lembah sempit',
    fn: rosenbrock,
    domain: [
      [-2, 2],
      [-2, 2],
    ],
    globalMin: 0,
    globalPoint: [1, 1],
    heightPower: 0.28,
    description: 'Lembah sempit dan melengkung menuju (1, 1).',
  }),
  makeLandscape({
    id: 'himmelblau',
    name: 'Himmelblau',
    epithet: 'Empat minimum global',
    fn: himmelblau,
    domain: [
      [-5, 5],
      [-5, 5],
    ],
    globalMin: 0,
    globalPoint: [3, 2],
    heightPower: 0.3,
    description: 'Empat cekungan dengan nilai minimum — banyak titik awal bisa menuju optimum.',
  }),
  makeLandscape({
    id: 'ackley',
    name: 'Ackley',
    epithet: 'Dataran beriak',
    fn: ackley,
    domain: [
      [-5, 5],
      [-5, 5],
    ],
    globalMin: 0,
    globalPoint: [0, 0],
    heightPower: 0.7,
    description: 'Dataran luas beriak dengan kawah global yang dalam.',
  }),
]

export const DEFAULT_LANDSCAPE_ID = 'rastrigin'

export function getLandscape(id: string): Landscape {
  return LANDSCAPES.find((item) => item.id === id) ?? LANDSCAPES[1]
}

/** Normalisasi nilai fungsi ke [0,1] (logaritmik agar kawah tetap terbaca). */
export function normalizeCost(value: number, max: number): number {
  const safeMax = Math.max(max, 1e-6)
  const clamped = Math.max(0, value)
  return Math.min(1, Math.log1p(clamped) / Math.log1p(safeMax))
}

/** Tinggi 3D ternormalisasi, dengan eksponen per-lanskap. */
export function normalizedHeight(landscape: Landscape, cost: number): number {
  return normalizeCost(cost, landscape.maxForColor) ** landscape.heightPower
}

/** Warna heatmap krem → cokelat → merah tua. */
export function heatColor(t: number): [number, number, number] {
  const stops: Array<[number, number, number, number]> = [
    [0.0, 0xf4, 0xe8, 0xcc],
    [0.3, 0xe0, 0xc7, 0x96],
    [0.52, 0xc4, 0xa2, 0x63],
    [0.72, 0x8a, 0x5a, 0x2b],
    [0.87, 0x6b, 0x2c, 0x20],
    [1.0, 0x4a, 0x17, 0x16],
  ]
  const value = Math.min(1, Math.max(0, t))
  for (let i = 1; i < stops.length; i++) {
    if (value <= stops[i][0]) {
      const [t0, r0, g0, b0] = stops[i - 1]
      const [t1, r1, g1, b1] = stops[i]
      const local = (value - t0) / Math.max(1e-6, t1 - t0)
      const eased = local * local * (3 - 2 * local)
      return [
        Math.round(r0 + (r1 - r0) * eased),
        Math.round(g0 + (g1 - g0) * eased),
        Math.round(b0 + (b1 - b0) * eased),
      ]
    }
  }
  return [74, 23, 22]
}

export function heatColorCss(t: number, alpha = 1): string {
  const [r, g, b] = heatColor(t)
  return alpha >= 1 ? `rgb(${r} ${g} ${b})` : `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/** Simulasi satu langkah gradient descent kecil untuk bola dekoratif hero. */
export function gradientDescentStep(fn: (x: number, y: number) => number, x: number, y: number, h = 0.04) {
  const dx = (fn(x + h, y) - fn(x - h, y)) / (2 * h)
  const dy = (fn(x, y + h) - fn(x, y - h)) / (2 * h)
  return { dx, dy }
}