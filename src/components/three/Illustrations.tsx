/**
 * Ilustrasi 3D statis (SVG) untuk bagian visualisasi.
 *
 * Dipakai sebagai "plate" bergambar di dalam bab, sebagai poster saat scene
 * dimuat, dan sebagai fallback bila WebGL tidak tersedia. Semua bentuk dibuat
 * orisinal dari geometri prosedural — tidak memakai aset dari luar.
 */
import { useId, type ReactNode } from 'react'
import { getLandscape, heatColor, normalizeCost, normalizedHeight } from '../../lib/algorithms/landscapes'

const VIEW_W = 480
const VIEW_H = 320

/* ------------------------------------------------------------------ */
/* JAYA — lanskap isometrik + bidak populasi                          */
/* ------------------------------------------------------------------ */

const terrainLandscape = getLandscape('rastrigin')

interface TerrainPoint {
  x: number
  y: number
  h: number
  t: number
}

function terrainPoint(u: number, v: number): TerrainPoint {
  const [[x0, x1], [y0, y1]] = terrainLandscape.domain
  const wx = x0 + u * (x1 - x0)
  const wy = y0 + v * (y1 - y0)
  const cost = terrainLandscape.fn(wx, wy)
  const h = normalizedHeight(terrainLandscape, cost)
  const t = normalizeCost(cost, terrainLandscape.maxForColor)
  return {
    x: 240 + (u - v) * 205,
    y: 150 + (u + v - 1) * 80 - h * 52,
    h,
    t,
  }
}

const TERRAIN_N = 14

const terrain = (() => {
  const grid: TerrainPoint[][] = []
  for (let j = 0; j < TERRAIN_N; j++) {
    const row: TerrainPoint[] = []
    for (let i = 0; i < TERRAIN_N; i++) {
      row.push(terrainPoint(i / (TERRAIN_N - 1), j / (TERRAIN_N - 1)))
    }
    grid.push(row)
  }

  const cells: Array<{ points: string; fill: string; depth: number; stroke: string }> = []
  for (let j = 0; j < TERRAIN_N - 1; j++) {
    for (let i = 0; i < TERRAIN_N - 1; i++) {
      const a = grid[j][i]
      const b = grid[j][i + 1]
      const c = grid[j + 1][i + 1]
      const d = grid[j + 1][i]
      const t = (a.t + b.t + c.t + d.t) / 4
      const h = (a.h + b.h + c.h + d.h) / 4
      const [r, g, bl] = heatColor(t)
      const lift = 0.78 + h * 0.32
      cells.push({
        points: `${a.x.toFixed(1)},${a.y.toFixed(1)} ${b.x.toFixed(1)},${b.y.toFixed(1)} ${c.x.toFixed(1)},${c.y.toFixed(1)} ${d.x.toFixed(1)},${d.y.toFixed(1)}`,
        fill: `rgb(${Math.min(255, Math.round(r * lift))} ${Math.min(255, Math.round(g * lift))} ${Math.min(255, Math.round(bl * lift))})`,
        depth: i + j,
        stroke: `rgba(43,26,14,${0.12 + (1 - h) * 0.14})`,
      })
    }
  }
  cells.sort((left, right) => left.depth - right.depth)

  // Skirt (ketebalan) di dua sisi depan agar lanskap terbaca sebagai objek 3D.
  const skirt: string[] = []
  for (const edge of [
    grid[TERRAIN_N - 1],
    grid.map((row) => row[TERRAIN_N - 1]),
  ]) {
    for (let index = 0; index < edge.length - 1; index++) {
      const a = edge[index]
      const b = edge[index + 1]
      const drop = 20
      skirt.push(
        `${a.x.toFixed(1)},${a.y.toFixed(1)} ${b.x.toFixed(1)},${b.y.toFixed(1)} ${b.x.toFixed(1)},${(b.y + drop).toFixed(1)} ${a.x.toFixed(1)},${(a.y + drop).toFixed(1)}`,
      )
    }
  }

  return { grid, cells, skirt }
})()

const embers = [
  [78, 92, 1.3, 0.45], [112, 54, 0.9, 0.32], [156, 112, 1.5, 0.5], [204, 40, 1.1, 0.36],
  [268, 70, 1.4, 0.42], [318, 108, 0.9, 0.3], [366, 62, 1.2, 0.38], [410, 128, 1.5, 0.4],
  [132, 210, 1.1, 0.32], [198, 258, 1.3, 0.3], [296, 250, 0.9, 0.26], [356, 216, 1.2, 0.3],
  [246, 24, 1, 0.3], [62, 168, 0.8, 0.24], [430, 176, 1, 0.24],
] as const

type PieceKind = 'normal' | 'best' | 'worst'

function piecePoint(u: number, v: number) {
  return terrainPoint(u, v)
}

function Pawn({
  u,
  v,
  kind,
  gradientId,
  glowId,
}: {
  u: number
  v: number
  kind: PieceKind
  gradientId: string
  glowId: string
}) {
  const point = piecePoint(u, v)
  const scale = kind === 'best' ? 1.5 : kind === 'worst' ? 1.15 : 1
  const bodyFill = kind === 'best' ? `url(#${gradientId})` : kind === 'worst' ? '#43130f' : '#55744b'
  const headFill = kind === 'best' ? '#f7e2a8' : kind === 'worst' ? '#7a1e1e' : '#6d8a61'
  const accent = kind === 'best' ? '#f0c56a' : kind === 'worst' ? '#a8322a' : '#c9a870'

  return (
    <g transform={`translate(${point.x.toFixed(1)} ${point.y.toFixed(1)}) scale(${scale})`}>
      <ellipse cx="0" cy="1.5" rx="5.6" ry="2.1" fill="#000" opacity="0.42" />

      {kind === 'best' && (
        <g>
          <rect x="-6" y="-42" width="12" height="38" rx="6" fill={`url(#${glowId})`} opacity="0.38" />
          <circle cx="0" cy="-17" r="11" fill="#e3b64f" opacity="0.08" />
          <circle cx="0" cy="-17" r="7" fill="#e3b64f" opacity="0.12" />
        </g>
      )}

      {kind === 'worst' && (
        <ellipse cx="0" cy="1.8" rx="7.4" ry="2.8" fill="none" stroke="#a8322a" strokeWidth="1" opacity="0.75" />
      )}

      <path
        d="M -2.4 -2 L -1.2 -12 L 1.2 -12 L 2.4 -2 Z"
        fill={bodyFill}
        stroke={kind === 'normal' ? '#2b1a0e' : 'none'}
        strokeWidth="0.7"
      />
      <ellipse cx="0" cy="-1.8" rx="3.1" ry="1.15" fill={bodyFill} />
      <circle cx="0" cy="-13.2" r="2.5" fill={headFill} stroke={kind === 'normal' ? '#2b1a0e' : 'none'} strokeWidth="0.6" />

      {kind === 'best' && (
        <g fill="#f7e2a8">
          <path d="M -3.6 -15.6 L -2.4 -19.4 L -0.6 -16.8 L 0.6 -20 L 2.4 -16.8 L 3.6 -19.4 L 4.2 -15.4 Z" />
          <circle cx="0" cy="-21" r="0.8" fill={accent} />
        </g>
      )}

      {kind === 'normal' && <circle cx="-0.8" cy="-13.8" r="0.7" fill="#f4e8cc" opacity="0.5" />}
    </g>
  )
}

const population: Array<{ u: number; v: number; kind: PieceKind }> = [
  { u: 0.2, v: 0.24, kind: 'normal' },
  { u: 0.31, v: 0.14, kind: 'normal' },
  { u: 0.46, v: 0.22, kind: 'normal' },
  { u: 0.66, v: 0.16, kind: 'normal' },
  { u: 0.79, v: 0.27, kind: 'normal' },
  { u: 0.15, v: 0.45, kind: 'normal' },
  { u: 0.33, v: 0.38, kind: 'normal' },
  { u: 0.52, v: 0.34, kind: 'normal' },
  { u: 0.7, v: 0.42, kind: 'normal' },
  { u: 0.87, v: 0.46, kind: 'normal' },
  { u: 0.22, v: 0.64, kind: 'normal' },
  { u: 0.42, v: 0.58, kind: 'normal' },
  { u: 0.61, v: 0.68, kind: 'normal' },
  { u: 0.78, v: 0.62, kind: 'normal' },
  { u: 0.34, v: 0.82, kind: 'normal' },
  { u: 0.56, v: 0.86, kind: 'normal' },
  { u: 0.1, v: 0.78, kind: 'normal' },
  { u: 0.9, v: 0.78, kind: 'normal' },
  { u: 0.52, v: 0.5, kind: 'best' },
  { u: 0.24, v: 0.72, kind: 'worst' },
]

export function JayaSceneIllustration({ className = '' }: { className?: string }) {
  const uid = useId().replace(/[:]/g, '')
  const bg = `${uid}-bg`
  const glow = `${uid}-glow`
  const gold = `${uid}-gold`
  const beam = `${uid}-beam`
  const goldPiece = `${uid}-piece`

  const best = piecePoint(0.52, 0.5)
  const worst = piecePoint(0.24, 0.72)
  const towardBest: Array<[number, number, number, number]> = [
    [0.31, 0.14, 0.46, 0.42],
    [0.87, 0.46, 0.63, 0.5],
    [0.22, 0.64, 0.44, 0.56],
  ]

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      className={className}
      role="img"
      aria-labelledby={`${uid}-title ${uid}-desc`}
      preserveAspectRatio="xMidYMid meet"
    >
      <title id={`${uid}-title`}>Ilustrasi 3D pergerakan populasi JAYA</title>
      <desc id={`${uid}-desc`}>
        Lanskap fungsi Rastrigin dalam tampilan isometrik. Bidak hijau adalah kandidat solusi, bidak emas
        bermahkota adalah P_best, dan bidak merah adalah P_worst. Panah menunjukkan arah kandidat menuju
        solusi terbaik dan menjauhi solusi terburuk.
      </desc>

      <defs>
        <radialGradient id={bg} cx="50%" cy="36%" r="78%">
          <stop offset="0%" stopColor="#412812" />
          <stop offset="55%" stopColor="#241509" />
          <stop offset="100%" stopColor="#150d07" />
        </radialGradient>
        <radialGradient id={glow} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#f0c56a" stopOpacity="0.55" />
          <stop offset="60%" stopColor="#c8561e" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#c8561e" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={gold} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffe9ad" />
          <stop offset="45%" stopColor="#e3b64f" />
          <stop offset="100%" stopColor="#8a5a2b" />
        </linearGradient>
        <linearGradient id={beam} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#e3b64f" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#e3b64f" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={goldPiece} cx="34%" cy="24%" r="80%">
          <stop offset="0%" stopColor="#fff4cd" />
          <stop offset="42%" stopColor="#e3b64f" />
          <stop offset="100%" stopColor="#7a4a1c" />
        </radialGradient>
        <marker id={`${uid}-arrow-gold`} viewBox="0 0 8 8" refX="6" refY="4" markerWidth="5" markerHeight="5" orient="auto">
          <path d="M0 0 L8 4 L0 8 Z" fill="#e3b64f" opacity="0.8" />
        </marker>
        <marker id={`${uid}-arrow-red`} viewBox="0 0 8 8" refX="6" refY="4" markerWidth="5" markerHeight="5" orient="auto">
          <path d="M0 0 L8 4 L0 8 Z" fill="#a8322a" opacity="0.75" />
        </marker>
        <radialGradient id={`${uid}-vignette`} cx="50%" cy="45%" r="70%">
          <stop offset="60%" stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.5" />
        </radialGradient>
      </defs>

      <rect width={VIEW_W} height={VIEW_H} fill={`url(#${bg})`} />

      {/* cincin altar di bawah lanskap */}
      <ellipse cx="240" cy="232" rx="196" ry="58" fill="#0e0804" opacity="0.55" />
      <ellipse cx="240" cy="232" rx="190" ry="54" fill="none" stroke="#b8862b" strokeOpacity="0.28" strokeWidth="0.9" />
      <ellipse cx="240" cy="232" rx="168" ry="46" fill="none" stroke="#b8862b" strokeOpacity="0.16" strokeWidth="0.7" strokeDasharray="2 6" />
      <ellipse cx="240" cy="180" rx="150" ry="70" fill={`url(#${glow})`} opacity="0.55" />

      {/* ketebalan lanskap */}
      {terrain.skirt.map((points, index) => (
        <polygon key={`skirt-${index}`} points={points} fill="#241309" stroke="#1a0e06" strokeWidth="0.4" />
      ))}

      {/* permukaan lanskap */}
      {terrain.cells.map((cell, index) => (
        <polygon
          key={`cell-${index}`}
          points={cell.points}
          fill={cell.fill}
          stroke={cell.stroke}
          strokeWidth="0.5"
          strokeLinejoin="round"
        />
      ))}

      {/* ember melayang */}
      {embers.map(([x, y, r, opacity], index) => (
        <circle key={`ember-${index}`} cx={x} cy={y} r={r} fill="#f0c56a" opacity={opacity} />
      ))}

      {/* panah dorong/tarik */}
      {towardBest.map(([u1, v1, u2, v2], index) => {
        const from = piecePoint(u1, v1)
        const to = piecePoint(u2, v2)
        const midX = (from.x + to.x) / 2
        const midY = Math.min(from.y, to.y) - 24
        return (
          <path
            key={`pull-${index}`}
            d={`M ${from.x.toFixed(1)} ${(from.y - 6).toFixed(1)} Q ${midX.toFixed(1)} ${midY.toFixed(1)} ${to.x.toFixed(1)} ${(to.y - 6).toFixed(1)}`}
            fill="none"
            stroke="#e3b64f"
            strokeWidth="1.1"
            strokeDasharray="4 3"
            opacity="0.55"
            markerEnd={`url(#${uid}-arrow-gold)`}
          />
        )
      })}
      {[
        [-36, 36],
        [30, 42],
      ].map(([dx, dy], index) => (
        <path
          key={`push-${index}`}
          d={`M ${(worst.x + dx * 0.3).toFixed(1)} ${(worst.y - 4).toFixed(1)} Q ${(worst.x + dx * 0.75).toFixed(1)} ${(worst.y - 24).toFixed(1)} ${(worst.x + dx).toFixed(1)} ${(worst.y + dy).toFixed(1)}`}
          fill="none"
          stroke="#a8322a"
          strokeWidth="1.1"
          strokeDasharray="4 3"
          opacity="0.5"
          markerEnd={`url(#${uid}-arrow-red)`}
        />
      ))}

      {/* pilar cahaya P_best */}
      <rect x={best.x - 7} y={best.y - 96} width="14" height="92" rx="7" fill={`url(#${beam})`} opacity="0.42" />
      <circle cx={best.x} cy={best.y - 30} r="26" fill={`url(#${glow})`} opacity="0.4" />

      {/* populasi */}
      {population.map((piece, index) => (
        <Pawn
          key={`piece-${index}`}
          u={piece.u}
          v={piece.v}
          kind={piece.kind}
          gradientId={goldPiece}
          glowId={beam}
        />
      ))}

      <rect width={VIEW_W} height={VIEW_H} fill={`url(#${uid}-vignette)`} pointerEvents="none" />
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/* SA — landasan tempa, batang logam, dan kisi atom                   */
/* ------------------------------------------------------------------ */

const forgeAtoms = (() => {
  const atoms: Array<{ x: number; y: number; r: number; o: number; hot: number }> = []
  const rows = 4
  const cols = 6
  const layers = 2
  for (let layer = 0; layer < layers; layer++) {
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const jitterSeed = Math.sin((layer + 1) * 12.9898 + (row + 1) * 78.233 + (col + 1) * 37.719)
        const jitter = (jitterSeed - Math.floor(jitterSeed) - 0.5) * 2.4
        const hot = (layer * 13 + row * 7 + col * 3) % 17 < 5
        atoms.push({
          x: 252 + (col - (cols - 1) / 2) * 13 - (row - (rows - 1) / 2) * 5 + jitter,
          y: 140 + (row - (rows - 1) / 2) * 5 + (col - (cols - 1) / 2) * 1.4 - layer * 9 + jitter * 0.4,
          r: 2.7 - layer * 0.35 + (hot ? 0.5 : 0),
          o: 0.72 + layer * 0.12,
          hot: hot ? 1 : 0,
        })
      }
    }
  }
  // atom yang terlepas dari kisi (cacat / getaran termal)
  const stray = [
    [196, 104, 2.2], [214, 86, 1.7], [236, 72, 2.4], [262, 66, 1.8], [288, 82, 2.1],
    [310, 100, 1.6], [182, 128, 1.9], [318, 132, 2.2], [208, 148, 1.5], [300, 156, 1.8],
    [226, 118, 1.4], [276, 110, 1.6], [192, 78, 1.2], [326, 90, 1.3], [248, 94, 1.4],
  ] as const
  stray.forEach(([x, y, r], index) => {
    atoms.push({ x, y, r, o: 0.38 + (index % 4) * 0.12, hot: index % 3 === 0 ? 1 : 0 })
  })
  return atoms
})()

const sparks = [
  [212, 88, 1.1, 0.7], [228, 62, 0.9, 0.5], [246, 48, 1.3, 0.8], [262, 74, 0.8, 0.45],
  [278, 54, 1.1, 0.65], [296, 92, 0.9, 0.5], [204, 120, 1.2, 0.55], [318, 118, 1, 0.4],
  [238, 34, 0.8, 0.4], [286, 30, 0.9, 0.35], [222, 106, 0.7, 0.5], [306, 68, 0.7, 0.4],
] as const

export function ForgeSceneIllustration({ className = '' }: { className?: string }) {
  const uid = useId().replace(/[:]/g, '')
  const bg = `${uid}-bg`
  const glow = `${uid}-glow`
  const steel = `${uid}-steel`
  const steelTop = `${uid}-steel-top`
  const hot = `${uid}-hot`
  const hotSide = `${uid}-hot-side`
  const atom = `${uid}-atom`
  const atomHot = `${uid}-atom-hot`
  const vignette = `${uid}-vignette`

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      className={className}
      role="img"
      aria-labelledby={`${uid}-title ${uid}-desc`}
      preserveAspectRatio="xMidYMid meet"
    >
      <title id={`${uid}-title`}>Ilustrasi 3D proses pendinginan logam</title>
      <desc id={`${uid}-desc`}>
        Landasan tempa dengan batang logam berpijar dan kisi atom. Warna logam mengikuti temperatur:
        putih-kuning saat panas, memudar menjadi oranye, merah, lalu abu baja saat dingin.
      </desc>

      <defs>
        <radialGradient id={bg} cx="50%" cy="42%" r="76%">
          <stop offset="0%" stopColor="#3d2110" />
          <stop offset="52%" stopColor="#21130a" />
          <stop offset="100%" stopColor="#120b06" />
        </radialGradient>
        <radialGradient id={glow} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffd88a" stopOpacity="0.7" />
          <stop offset="38%" stopColor="#e07a2a" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#c8561e" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={steel} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7b848c" />
          <stop offset="50%" stopColor="#4d535a" />
          <stop offset="100%" stopColor="#2b3035" />
        </linearGradient>
        <linearGradient id={steelTop} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8f99a2" />
          <stop offset="100%" stopColor="#4a5057" />
        </linearGradient>
        <linearGradient id={hot} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fffdf2" />
          <stop offset="42%" stopColor="#ffe6a8" />
          <stop offset="100%" stopColor="#e3b64f" />
        </linearGradient>
        <linearGradient id={hotSide} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c8561e" />
          <stop offset="70%" stopColor="#7a3a22" />
          <stop offset="100%" stopColor="#3a2a1f" />
        </linearGradient>
        <radialGradient id={atom} cx="34%" cy="28%" r="78%">
          <stop offset="0%" stopColor="#fff8de" />
          <stop offset="45%" stopColor="#e9c77a" />
          <stop offset="100%" stopColor="#8a5a2b" />
        </radialGradient>
        <radialGradient id={atomHot} cx="34%" cy="28%" r="78%">
          <stop offset="0%" stopColor="#fffdf2" />
          <stop offset="55%" stopColor="#ffd88a" />
          <stop offset="100%" stopColor="#d06a22" />
        </radialGradient>
        <radialGradient id={vignette} cx="50%" cy="46%" r="70%">
          <stop offset="58%" stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.55" />
        </radialGradient>
        <filter id={`${uid}-blur`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
      </defs>

      <rect width={VIEW_W} height={VIEW_H} fill={`url(#${bg})`} />

      {/* aura panas */}
      <ellipse cx="252" cy="196" rx="150" ry="86" fill={`url(#${glow})`} />
      <ellipse cx="252" cy="176" rx="82" ry="42" fill="#ffb35c" opacity="0.12" filter={`url(#${uid}-blur)`} />

      {/* lantai tempa */}
      <ellipse cx="240" cy="258" rx="166" ry="44" fill="#0f0905" opacity="0.7" />
      <ellipse cx="240" cy="250" rx="150" ry="36" fill="#251810" stroke="#b8862b" strokeOpacity="0.32" strokeWidth="0.9" />
      <ellipse cx="240" cy="250" rx="116" ry="27" fill="none" stroke="#b8862b" strokeOpacity="0.18" strokeWidth="0.8" strokeDasharray="3 5" />
      <ellipse cx="240" cy="251" rx="64" ry="17" fill="none" stroke="#e3b64f" strokeOpacity="0.22" strokeWidth="0.8" />

      {/* landasan */}
      <path d="M 182 264 L 298 264 L 314 280 L 166 280 Z" fill="#17110d" stroke="#0d0805" strokeWidth="0.7" />
      <path d="M 200 242 L 280 242 L 294 266 L 186 266 Z" fill="#241d18" stroke="#0f0a07" strokeWidth="0.6" />
      <path d="M 216 218 L 264 218 L 278 246 L 202 246 Z" fill={`url(#${steel})`} stroke="#1a1410" strokeWidth="0.6" />
      <path d="M 216 218 L 264 218 L 270 228 L 210 228 Z" fill="#8f99a2" opacity="0.35" />

      {/* badan landasan (isometrik) */}
      <path d="M 162 196 L 248 168 L 332 192 L 246 224 Z" fill={`url(#${steelTop})`} stroke="#1c1713" strokeWidth="0.8" />
      <path d="M 162 196 L 246 224 L 246 234 L 162 206 Z" fill="#3d4349" stroke="#1c1713" strokeWidth="0.6" />
      <path d="M 246 224 L 332 192 L 332 202 L 246 234 Z" fill="#2b3035" stroke="#1c1713" strokeWidth="0.6" />
      {/* tanduk landasan */}
      <path d="M 162 196 L 118 194 L 112 200 L 158 207 Z" fill="#5b636b" stroke="#1c1713" strokeWidth="0.6" />
      <path d="M 126 196 L 116 198 L 120 202 L 150 203 Z" fill="#98a2ab" opacity="0.35" />

      {/* batang logam berpijar */}
      <path d="M 194 178 L 252 160 L 310 179 L 252 199 Z" fill={`url(#${hot})`} />
      <path d="M 194 178 L 252 199 L 252 211 L 194 190 Z" fill={`url(#${hotSide})`} />
      <path d="M 252 199 L 310 179 L 310 191 L 252 211 Z" fill="#8f3d16" />
      <path d="M 206 175 L 252 161 L 292 173 L 248 187 Z" fill="#fffdf2" opacity="0.75" />
      <ellipse cx="252" cy="182" rx="58" ry="14" fill="#fff2c4" opacity="0.18" filter={`url(#${uid}-blur)`} />

      {/* kisi atom */}
      {forgeAtoms.map((atomShape, index) => (
        <g key={`atom-${index}`}>
          <circle cx={atomShape.x} cy={atomShape.y} r={atomShape.r * 2.1} fill={atomShape.hot ? '#f0a06a' : '#c9a870'} opacity={atomShape.o * 0.1} />
          <circle
            cx={atomShape.x}
            cy={atomShape.y}
            r={atomShape.r}
            fill={`url(#${atomShape.hot ? atomHot : atom})`}
            opacity={atomShape.o}
          />
        </g>
      ))}

      {/* percikan */}
      {sparks.map(([x, y, r, opacity], index) => (
        <circle key={`spark-${index}`} cx={x} cy={y} r={r} fill="#ffcf7a" opacity={opacity} />
      ))}

      {/* palu */}
      <g transform="rotate(20 344 244)">
        <rect x="339" y="126" width="10" height="120" rx="4.5" fill="#6b4423" stroke="#2b1a0e" strokeWidth="0.7" />
        <rect x="342" y="132" width="3" height="106" rx="1.5" fill="#9a6a3a" opacity="0.5" />
        <path d="M 318 108 L 368 108 L 372 128 L 314 128 Z" fill={`url(#${steel})`} stroke="#1a1410" strokeWidth="0.8" />
        <path d="M 324 111 L 364 111 L 366 118 L 322 118 Z" fill="#9aa4ad" opacity="0.45" />
      </g>

      {/* gelombang panas */}
      <ellipse cx="248" cy="128" rx="72" ry="30" fill="none" stroke="#f0a06a" strokeOpacity="0.16" strokeWidth="1" />
      <ellipse cx="254" cy="108" rx="54" ry="22" fill="none" stroke="#f0c56a" strokeOpacity="0.12" strokeWidth="0.8" />

      <rect width={VIEW_W} height={VIEW_H} fill={`url(#${vignette})`} pointerEvents="none" />
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/* Bingkai plate / poster                                             */
/* ------------------------------------------------------------------ */

export function ScenePlate({
  illustration,
  eyebrow,
  caption,
  className = '',
}: {
  illustration: ReactNode
  eyebrow: string
  caption: string
  className?: string
}) {
  return (
    <figure className={`relative overflow-hidden border border-gold/30 bg-leather-900 ${className}`}>
      <div className="pointer-events-none absolute inset-0 z-10 border border-gold/10" />
      {illustration}
      <figcaption className="relative z-20 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-t border-gold/20 bg-leather-900/85 px-3 py-2">
        <span className="font-heading text-[8px] uppercase tracking-[0.22em] text-gold-light/80">{eyebrow}</span>
        <span className="font-body text-[11px] italic leading-snug text-parchment-200/75">{caption}</span>
      </figcaption>
    </figure>
  )
}

export function ScenePoster({
  illustration,
  label,
  className = '',
}: {
  illustration: ReactNode
  label: string
  className?: string
}) {
  return (
    <div className={`relative overflow-hidden border border-gold/25 bg-leather-900 ${className}`}>
      <div className="absolute inset-0 [&>svg]:h-full [&>svg]:w-full">{illustration}</div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
      <div className="relative flex h-full min-h-[260px] flex-col items-center justify-end gap-1 p-4 text-center">
        <span className="font-heading text-[9px] uppercase tracking-[0.24em] text-gold-light/85">{label}</span>
        <span className="font-body text-[11px] italic text-parchment-200/65">
          Memuat visualisasi interaktif…
        </span>
      </div>
    </div>
  )
}
