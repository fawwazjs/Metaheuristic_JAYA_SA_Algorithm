/**
 * RNG deterministik (mulberry32). Semua keacakan simulasi harus melewati
 * fungsi ini agar hasil dapat direproduksi dari seed yang sama.
 */
export type Rng = () => number

export function mulberry32(seed: number): Rng {
  let a = seed >>> 0
  return function next() {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Seed acak baru yang ramah dibaca manusia. */
export function randomSeed(): number {
  return Math.floor(Math.random() * 900000) + 100000
}

/** Ubah teks apa pun menjadi seed 32-bit (FNV-1a). */
export function hashSeed(text: string): number {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function randomInt(rng: Rng, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1))
}

export function pick<T>(rng: Rng, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)]
}

export function shuffle<T>(rng: Rng, arr: readonly T[]): T[] {
  const out = arr.slice()
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/** Gaussian standar via Box–Muller (satu nilai per panggilan, cache internal). */
export function makeGaussian(rng: Rng): () => number {
  let spare: number | null = null
  return function gauss() {
    if (spare !== null) {
      const value = spare
      spare = null
      return value
    }
    let u = 0
    let v = 0
    let s = 0
    do {
      u = rng() * 2 - 1
      v = rng() * 2 - 1
      s = u * u + v * v
    } while (s === 0 || s >= 1)
    const mul = Math.sqrt((-2 * Math.log(s)) / s)
    spare = v * mul
    return u * mul
  }
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function roundTo(value: number, digits = 2): number {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

/**
 * Format angka gaya Indonesia: pemisah desimal koma, pemisah ribuan titik.
 * Dipakai untuk seluruh teks yang dibaca pengguna (bukan koordinat SVG).
 */
export function formatNumber(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return '—'
  const safeDigits = Math.max(0, Math.min(6, digits))
  const rounded = Number(value.toFixed(safeDigits))
  const [whole, fraction] = Math.abs(rounded).toFixed(safeDigits).split('.')
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  const sign = rounded < 0 ? '−' : ''
  return fraction ? `${sign}${grouped},${fraction}` : `${sign}${grouped}`
}

/** Sama seperti formatNumber tetapi selalu tanpa pemisah ribuan (untuk input). */
export function formatPlain(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return '—'
  return value.toFixed(Math.max(0, Math.min(6, digits))).replace('.', ',')
}