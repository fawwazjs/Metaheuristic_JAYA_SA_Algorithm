/**
 * Ilustrasi "plate" untuk setiap langkah Cara Kerja.
 * Semua orisinal: SVG garis tinta dengan aksen sesuai bagian.
 */
import { ETC, TASK_COLORS } from '../../lib/algorithms/scheduling'

type Tone = 'forest' | 'ember'

const palette = (tone: Tone) => ({
  accent: tone === 'forest' ? '#3F5B3A' : '#C8561E',
  accentSoft: tone === 'forest' ? 'rgba(63,91,58,.16)' : 'rgba(200,86,30,.14)',
  ink: '#35210F',
  gold: '#B8862B',
  goldLight: '#E3B64F',
  paper: '#FBF4E4',
  wax: '#7A1E1E',
})

function Frame({ children, label }: { children: React.ReactNode; label?: string }) {
  return (
    <svg viewBox="0 0 320 220" className="w-full" role="img" aria-label={label ?? 'Ilustrasi langkah'}>
      <rect x="0" y="0" width="320" height="220" fill="rgba(251,244,228,.35)" />
      {children}
    </svg>
  )
}

/* ---------------------------- JAYA ---------------------------- */

export function PlateInit({ tone }: { tone: Tone }) {
  const c = palette(tone)
  const points = [
    [64, 66], [120, 52], [176, 74], [236, 58], [86, 118], [146, 104], [204, 126], [258, 108],
    [58, 168], [118, 156], [182, 170], [244, 158],
  ]
  return (
    <Frame label="Sebaran kandidat awal di dalam batas ruang solusi">
      <rect x="34" y="36" width="252" height="152" fill="none" stroke={c.ink} strokeWidth="1.2" strokeDasharray="5 3" />
      <rect x="26" y="28" width="252" height="152" fill="none" stroke={c.gold} strokeWidth=".8" opacity=".55" />
      <text x="34" y="26" fill={c.ink} fontSize="8" fontFamily="JetBrains Mono, monospace">X_min</text>
      <text x="286" y="26" textAnchor="end" fill={c.ink} fontSize="8" fontFamily="JetBrains Mono, monospace">X_max</text>
      <text x="286" y="202" textAnchor="end" fill={c.ink} fontSize="8" fontFamily="JetBrains Mono, monospace">r ∈ [0,1]</text>
      {points.map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="5.5" fill={c.accent} stroke={c.ink} strokeWidth="1" opacity={0.85} />
          <circle cx={x - 1.4} cy={y - 1.6} r="1.4" fill={c.paper} opacity=".65" />
        </g>
      ))}
      <path d="M40 188 C90 176 150 196 214 182 C248 175 268 186 288 178" fill="none" stroke={c.gold} strokeWidth=".8" opacity=".5" />
    </Frame>
  )
}

export function PlateFitness({ tone }: { tone: Tone }) {
  const c = palette(tone)
  const bars = [
    { h: 42, label: 'F₁', best: false },
    { h: 78, label: 'F₂', best: false },
    { h: 26, label: 'F₃', best: true },
    { h: 64, label: 'F₄', best: false },
    { h: 96, label: 'F₅', best: false },
  ]
  return (
    <Frame label="Nilai fitness setiap kandidat; yang minimum menjadi P_best">
      <line x1="40" y1="178" x2="288" y2="178" stroke={c.ink} strokeWidth="1.2" />
      <line x1="40" y1="178" x2="40" y2="44" stroke={c.ink} strokeWidth="1.2" />
      {bars.map((bar, i) => {
        const x = 56 + i * 46
        return (
          <g key={bar.label}>
            <rect
              x={x}
              y={178 - bar.h}
              width="30"
              height={bar.h}
              fill={bar.best ? c.goldLight : c.accentSoft}
              stroke={bar.best ? c.gold : c.accent}
              strokeWidth={bar.best ? 1.6 : 1}
            />
            <text x={x + 15} y={172 - bar.h} textAnchor="middle" fill={c.ink} fontSize="8" fontFamily="JetBrains Mono, monospace">
              F{i + 1}
            </text>
            <text x={x + 15} y={192} textAnchor="middle" fill={c.ink} fontSize="7.5" fontFamily="JetBrains Mono, monospace">
              k{i + 1}
            </text>
          </g>
        )
      })}
      <text x="60" y="36" fill={c.gold} fontSize="8.5" fontFamily="Cinzel, serif" letterSpacing="1.4">P_best = argmin F</text>
      <path d="M228 40 l6 6 -6 6" fill="none" stroke={c.wax} strokeWidth="1.2" />
      <text x="238" y="50" fill={c.wax} fontSize="8" fontFamily="JetBrains Mono, monospace">P_worst</text>
    </Frame>
  )
}

export function PlateUpdate({ tone }: { tone: Tone }) {
  const c = palette(tone)
  return (
    <Frame label="Vektor tarik ke P_best, tolak dari P_worst, dan hasilnya">
      <circle cx="90" cy="140" r="6" fill={c.accent} stroke={c.ink} strokeWidth="1.1" />
      <text x="72" y="158" fill={c.ink} fontSize="8" fontFamily="JetBrains Mono, monospace">Xᵏ</text>
      <circle cx="248" cy="62" r="7" fill={c.goldLight} stroke={c.gold} strokeWidth="1.4" />
      <text x="258" y="58" fill={c.gold} fontSize="8" fontFamily="JetBrains Mono, monospace">P_best</text>
      <circle cx="228" cy="176" r="7" fill={c.wax} stroke={c.ink} strokeWidth="1.2" />
      <text x="238" y="192" fill={c.wax} fontSize="8" fontFamily="JetBrains Mono, monospace">P_worst</text>
      <path d="M96 136 L236 68" fill="none" stroke={c.accent} strokeWidth="1.6" />
      <path d="M236 68 l-9 -1.5 2.5 7" fill={c.accent} stroke="none" />
      <path d="M94 145 L206 172" fill="none" stroke={c.wax} strokeWidth="1.3" strokeDasharray="4 3" />
      <circle cx="160" cy="96" r="7" fill={c.goldLight} stroke={c.gold} strokeWidth="1.5" />
      <path d="M120 128 C136 112 146 104 152 100" fill="none" stroke={c.gold} strokeWidth="1.5" />
      <path d="M152 100 l-7 -1.5 2 6" fill={c.gold} stroke="none" />
      <text x="168" y="94" fill={c.gold} fontSize="8" fontFamily="JetBrains Mono, monospace">X′</text>
      <text x="44" y="42" fill={c.ink} fontSize="8" fontFamily="JetBrains Mono, monospace">r₁(B − |X|)</text>
      <text x="44" y="54" fill={c.wax} fontSize="8" fontFamily="JetBrains Mono, monospace">− r₂(W − |X|)</text>
    </Frame>
  )
}

export function PlateSelect({ tone }: { tone: Tone }) {
  const c = palette(tone)
  return (
    <Frame label="Seleksi: kandidat baru diterima hanya jika fitness lebih kecil">
      <rect x="34" y="60" width="112" height="88" fill="none" stroke={c.ink} strokeWidth="1.1" strokeDasharray="4 3" />
      <text x="90" y="52" textAnchor="middle" fill={c.ink} fontSize="8" fontFamily="JetBrains Mono, monospace">Xᵏ  (F lama)</text>
      <circle cx="90" cy="98" r="8" fill={c.accent} stroke={c.ink} strokeWidth="1.1" />
      <rect x="176" y="60" width="112" height="88" fill="none" stroke={c.gold} strokeWidth="1.2" />
      <text x="232" y="52" textAnchor="middle" fill={c.gold} fontSize="8" fontFamily="JetBrains Mono, monospace">Xᵏ⁺¹ (F baru)</text>
      <circle cx="232" cy="98" r="8" fill={c.goldLight} stroke={c.gold} strokeWidth="1.2" />
      <path d="M150 98 L172 98" stroke={c.ink} strokeWidth="1.2" />
      <path d="M172 98 l-5 -4 M172 98 l-5 4" stroke={c.ink} strokeWidth="1.2" fill="none" />
      <text x="161" y="88" textAnchor="middle" fill={c.ink} fontSize="7" fontFamily="JetBrains Mono, monospace">F?</text>
      <path d="M200 76 l7 7 12 -13" stroke={c.accent} strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <path d="M222 126 l9 9 M231 126 l-9 9" stroke={c.wax} strokeWidth="2" fill="none" strokeLinecap="round" />
      <text x="60" y="178" fill={c.ink} fontSize="8.5" fontFamily="JetBrains Mono, monospace">F(Xᵏ⁺¹) &lt; F(Xᵏ) → terima</text>
      <text x="60" y="194" fill={c.wax} fontSize="8.5" fontFamily="JetBrains Mono, monospace">selain itu → Xᵏ dipertahankan</text>
    </Frame>
  )
}

export function PlateLoop({ tone }: { tone: Tone }) {
  const c = palette(tone)
  const nodes = [
    { x: 160, y: 46, label: 'Evaluasi' },
    { x: 258, y: 104, label: 'P_best' },
    { x: 160, y: 166, label: 'Pembaruan' },
    { x: 62, y: 104, label: 'Seleksi' },
  ]
  return (
    <Frame label="Siklus iterasi JAYA">
      <circle cx="160" cy="106" r="66" fill="none" stroke={c.gold} strokeWidth="1" strokeDasharray="3 4" opacity=".7" />
      {nodes.map((node, i) => (
        <g key={node.label}>
          <circle cx={node.x} cy={node.y} r="24" fill={c.paper} stroke={c.accent} strokeWidth="1.3" />
          <text x={node.x} y={node.y + (node.label === 'Pembaruan' ? 0 : 2)} textAnchor="middle" fill={c.ink} fontSize="8" fontFamily="Cinzel, serif">
            {node.label}
          </text>
          <text x={node.x} y={node.y + (node.label === 'Pembaruan' ? 10 : 12)} textAnchor="middle" fill={c.ink} fontSize="6.5" fontFamily="JetBrains Mono, monospace" opacity=".6">
            {['fitness', '& P_worst', 'kandidat', 'greedy'][i]}
          </text>
        </g>
      ))}
      {[
        [184, 54, 236, 84], [242, 126, 186, 156], [136, 158, 82, 128], [86, 80, 136, 52],
      ].map(([x1, y1, x2, y2], i) => (
        <path key={i} d={`M${x1} ${y1} Q${(x1 + x2) / 2 + 12} ${(y1 + y2) / 2 - 12} ${x2} ${y2}`} fill="none" stroke={c.accent} strokeWidth="1.2" />
      ))}
      <text x="160" y="112" textAnchor="middle" fill={c.gold} fontSize="11" fontFamily="Cinzel, serif">↻</text>
    </Frame>
  )
}

/* ---------------------------- SA ---------------------------- */

export function PlateETC({ tone }: { tone: Tone }) {
  const c = palette(tone)
  return (
    <Frame label="Matriks ETC empat tugas tiga node">
      <text x="34" y="34" fill={c.ink} fontSize="9" fontFamily="Cinzel, serif" letterSpacing="1">Matriks ETC</text>
      {['N1', 'N2', 'N3'].map((node, j) => (
        <text key={node} x={126 + j * 54} y={52} textAnchor="middle" fill={c.ink} fontSize="8" fontFamily="JetBrains Mono, monospace">{node}</text>
      ))}
      {ETC.map((row, i) => (
        <g key={i}>
          <text x="82" y={78 + i * 32} textAnchor="middle" fill={c.ink} fontSize="8" fontFamily="JetBrains Mono, monospace">t{i + 1}</text>
          {row.map((value, j) => (
            <g key={j}>
              <rect
                x={100 + j * 54}
                y={62 + i * 32}
                width="52"
                height="26"
                fill={i === 0 && j === 0 ? 'rgba(200,86,30,.14)' : 'rgba(251,244,228,.5)'}
                stroke={c.ink}
                strokeWidth="0.9"
              />
              <text
                x={126 + j * 54}
                y={79 + i * 32}
                textAnchor="middle"
                fill={i === 0 && j === 0 ? c.wax : c.ink}
                fontSize="10"
                fontFamily="JetBrains Mono, monospace"
              >
                {value}
              </text>
            </g>
          ))}
        </g>
      ))}
      <rect x="100" y="62" width="52" height="26" fill="none" stroke={c.gold} strokeWidth="1.8" />
      <text x="96" y="188" fill={c.wax} fontSize="8" fontFamily="JetBrains Mono, monospace">ETC(1,1) = 4</text>
      <text x="96" y="202" fill={c.ink} fontSize="7.5" fontFamily="JetBrains Mono, monospace" opacity=".7">waktu t₁ pada node 1</text>
    </Frame>
  )
}

export function PlateSolution({ tone }: { tone: Tone }) {
  const c = palette(tone)
  const solution = [1, 2, 3, 1]
  return (
    <Frame label="Representasi solusi S sebagai larik nomor node">
      <text x="160" y="40" textAnchor="middle" fill={c.ink} fontSize="9" fontFamily="Cinzel, serif">S = [ s₁, s₂, s₃, s₄ ]</text>
      {solution.map((node, i) => (
        <g key={i}>
          <rect x={62 + i * 52} y={68} width="44" height="44" fill={c.paper} stroke={c.accent} strokeWidth="1.3" />
          <text x={84 + i * 52} y={96} textAnchor="middle" fill={c.ink} fontSize="15" fontFamily="JetBrains Mono, monospace">{node}</text>
          <text x={84 + i * 52} y={128} textAnchor="middle" fill={c.ink} fontSize="7.5" fontFamily="JetBrains Mono, monospace" opacity=".65">t{i + 1}</text>
        </g>
      ))}
      <path d="M84 138 L84 152 M136 138 L136 152 M188 138 L188 152 M240 138 L240 152" stroke={c.gold} strokeWidth="0.9" strokeDasharray="2 2" />
      {['Node 1', 'Node 2', 'Node 3', 'Node 1'].map((label, i) => (
        <text key={i} x={84 + i * 52} y={166} textAnchor="middle" fill={c.accent} fontSize="7.5" fontFamily="Cinzel, serif">{label}</text>
      ))}
      <text x="160" y="194" textAnchor="middle" fill={c.ink} fontSize="8" fontFamily="JetBrains Mono, monospace" opacity=".7">sᵢ ∈ &#123;1, 2, 3&#125;</text>
    </Frame>
  )
}

export function PlateLoads({ tone }: { tone: Tone }) {
  const c = palette(tone)
  const blocks = [
    { node: 'N1', items: [4, 5] },
    { node: 'N2', items: [3] },
    { node: 'N3', items: [2] },
  ]
  return (
    <Frame label="Beban per node: batang tumpukan">
      <line x1="44" y1="176" x2="286" y2="176" stroke={c.ink} strokeWidth="1.2" />
      {blocks.map((block, i) => {
        let y = 176
        return (
          <g key={block.node}>
            <text x={76 + i * 74} y={192} textAnchor="middle" fill={c.ink} fontSize="8" fontFamily="JetBrains Mono, monospace">{block.node}</text>
            {block.items.map((value, k) => {
              const h = value * 10
              y -= h
              return (
                <g key={k}>
                  <rect x={62 + i * 74} y={y} width="30" height={h} fill={TASK_COLORS[k === 0 ? i : 0]} stroke={c.ink} strokeWidth="0.9" opacity=".92" />
                  <text x={77 + i * 74} y={y + h / 2 + 3} textAnchor="middle" fill={c.paper} fontSize="8" fontFamily="JetBrains Mono, monospace">{value}</text>
                </g>
              )
            })}
            <text x={77 + i * 74} y={y - 6} textAnchor="middle" fill={c.accent} fontSize="8" fontFamily="JetBrains Mono, monospace">
              C = {block.items.reduce((a, b) => a + b, 0)}
            </text>
          </g>
        )
      })}
      <text x="160" y="36" textAnchor="middle" fill={c.ink} fontSize="9" fontFamily="Cinzel, serif">C_j = Σ ETC(i,j)·1(s_i = j)</text>
    </Frame>
  )
}

export function PlateCost({ tone }: { tone: Tone }) {
  const c = palette(tone)
  return (
    <Frame label="Makespan adalah beban node terbesar">
      <line x1="44" y1="170" x2="286" y2="170" stroke={c.ink} strokeWidth="1.2" />
      {[
        { h: 108, label: 'C₁ = 9' },
        { h: 36, label: 'C₂ = 3' },
        { h: 24, label: 'C₃ = 2' },
      ].map((bar, i) => (
        <g key={i}>
          <rect
            x={70 + i * 74}
            y={170 - bar.h}
            width="38"
            height={bar.h}
            fill={i === 0 ? c.accentSoft : 'rgba(251,244,228,.55)'}
            stroke={i === 0 ? c.accent : c.ink}
            strokeWidth={i === 0 ? 1.6 : 1}
          />
          <text x={89 + i * 74} y={184} textAnchor="middle" fill={c.ink} fontSize="8" fontFamily="JetBrains Mono, monospace">{bar.label}</text>
        </g>
      ))}
      <line x1="44" y1="62" x2="286" y2="62" stroke={c.wax} strokeWidth="1.5" strokeDasharray="5 3" />
      <text x="48" y="56" fill={c.wax} fontSize="8.5" fontFamily="JetBrains Mono, monospace">makespan = max(9, 3, 2) = 9</text>
      <path d="M280 62 L280 158" stroke={c.wax} strokeWidth=".8" strokeDasharray="2 3" opacity=".5" />
    </Frame>
  )
}

export function PlateTemp0({ tone }: { tone: Tone }) {
  const c = palette(tone)
  return (
    <Frame label="Termometer untuk menentukan temperatur awal T₀">
      <rect x="76" y="36" width="26" height="128" rx="13" fill="rgba(251,244,228,.6)" stroke={c.ink} strokeWidth="1.2" />
      <rect x="81" y="74" width="16" height="86" rx="8" fill={c.accent} opacity=".85" />
      <circle cx="89" cy="176" r="16" fill={c.accent} stroke={c.ink} strokeWidth="1.2" />
      {[0.25, 0.5, 0.75].map((f) => (
        <line key={f} x1="102" y1={36 + 128 * f} x2="112" y2={36 + 128 * f} stroke={c.ink} strokeWidth=".8" />
      ))}
      <text x="128" y="86" fill={c.ink} fontSize="8.5" fontFamily="JetBrains Mono, monospace">T₀ = −ΔC̄ / ln(HEC)</text>
      <text x="128" y="102" fill={c.ink} fontSize="8" fontFamily="JetBrains Mono, monospace" opacity=".8">= −2 / ln(0,9)</text>
      <text x="128" y="120" fill={c.wax} fontSize="11" fontFamily="JetBrains Mono, monospace">≈ 18,98</text>
      <text x="128" y="142" fill={c.ink} fontSize="7.5" fontFamily="JetBrains Mono, monospace" opacity=".65">HEC = 0,9</text>
      <text x="128" y="154" fill={c.ink} fontSize="7.5" fontFamily="JetBrains Mono, monospace" opacity=".65">ΔC̄ = 2 satuan</text>
      <g opacity=".7">
        <path d="M89 26 c3 4 5 6 5 9 a5 5 0 0 1-10 0 c0-3 2-5 5-9z" fill={c.goldLight} />
      </g>
    </Frame>
  )
}

export function PlateNeighbor({ tone }: { tone: Tone }) {
  const c = palette(tone)
  const ops = ['Node baru', 'Swap', 'Shuffle', 'Displace', 'Insert', 'Invert']
  const rows = [
    [1, 2, 3, 1, 2],
    [1, 3, 2, 1, 2],
    [2, 1, 3, 1, 2],
    [1, 2, 1, 3, 2],
    [2, 1, 3, 1, 2],
    [1, 2, 1, 3, 2],
    [1, 2, 3, 2, 1],
  ]
  return (
    <Frame label="Enam jenis perturbation pada larik solusi">
      {ops.map((op, i) => (
        <g key={op}>
          <text x="16" y={44 + i * 22} fill={c.ink} fontSize="7.5" fontFamily="Cinzel, serif" opacity=".85">{op}</text>
          {rows[i].map((value, k) => (
            <g key={k}>
              <rect x={96 + k * 30} y={33 + i * 22} width="24" height="16" fill="rgba(251,244,228,.55)" stroke={c.ink} strokeWidth=".7" />
              <text x={108 + k * 30} y={44 + i * 22} textAnchor="middle" fill={c.ink} fontSize="7.5" fontFamily="JetBrains Mono, monospace">{value}</text>
            </g>
          ))}
          <text x="260" y={44 + i * 22} fill={c.accent} fontSize="7" fontFamily="JetBrains Mono, monospace">→ S′</text>
        </g>
      ))}
      <rect x="0" y="0" width="0" height="0" />
    </Frame>
  )
}

export function PlateDelta({ tone }: { tone: Tone }) {
  const c = palette(tone)
  const states = [
    { icon: '↓', label: 'ΔC < 0', action: 'Terima', color: c.accent },
    { icon: '=', label: 'ΔC = 0', action: 'Terima', color: c.gold },
    { icon: '↑', label: 'ΔC > 0', action: 'Uji P', color: c.wax },
  ]
  return (
    <Frame label="Tiga kondisi perubahan cost">
      {states.map((state, i) => (
        <g key={state.label}>
          <rect x={30 + i * 88} y="62" width="76" height="86" fill="rgba(251,244,228,.5)" stroke={c.ink} strokeWidth="1" />
          <text x={68 + i * 88} y="92" textAnchor="middle" fill={state.color} fontSize="20" fontFamily="JetBrains Mono, monospace">{state.icon}</text>
          <text x={68 + i * 88} y="114" textAnchor="middle" fill={c.ink} fontSize="9" fontFamily="JetBrains Mono, monospace">{state.label}</text>
          <text x={68 + i * 88} y="132" textAnchor="middle" fill={state.color} fontSize="8.5" fontFamily="Cinzel, serif">{state.action}</text>
        </g>
      ))}
      <text x="160" y="42" textAnchor="middle" fill={c.ink} fontSize="9" fontFamily="Cinzel, serif">ΔC = C_next − C_cur</text>
      <text x="160" y="180" textAnchor="middle" fill={c.ink} fontSize="7.5" fontFamily="JetBrains Mono, monospace" opacity=".7">hanya ΔC &gt; 0 yang melewati kriteria Metropolis</text>
    </Frame>
  )
}

export function PlateMetropolis({ tone }: { tone: Tone }) {
  const c = palette(tone)
  return (
    <Frame label="Meteran probabilitas penerimaan Metropolis">
      <path d="M60 150 A85 85 0 0 1 260 150" fill="none" stroke="rgba(53,33,15,.2)" strokeWidth="14" />
      <path d="M60 150 A85 85 0 0 1 214 82" fill="none" stroke={c.accent} strokeWidth="14" opacity=".85" />
      <circle cx="160" cy="150" r="6" fill={c.gold} />
      <line x1="160" y1="150" x2="196" y2="88" stroke={c.ink} strokeWidth="2" />
      <text x="160" y="60" textAnchor="middle" fill={c.ink} fontSize="8.5" fontFamily="JetBrains Mono, monospace">P = e^(−ΔC/T)</text>
      <text x="64" y="170" fill={c.ink} fontSize="8" fontFamily="JetBrains Mono, monospace">0</text>
      <text x="256" y="170" textAnchor="end" fill={c.ink} fontSize="8" fontFamily="JetBrains Mono, monospace">1</text>
      <text x="160" y="192" textAnchor="middle" fill={c.accent} fontSize="8.5" fontFamily="Cinzel, serif">r &lt; P → terima</text>
      <circle cx="206" cy="76" r="3.5" fill={c.wax} />
      <text x="214" y="74" fill={c.wax} fontSize="7.5" fontFamily="JetBrains Mono, monospace">r</text>
    </Frame>
  )
}

export function PlateBestFlag({ tone }: { tone: Tone }) {
  const c = palette(tone)
  return (
    <Frame label="S_best tetap disimpan saat solusi saat ini memburuk">
      <path d="M40 170 L90 130 L130 148 L176 96 L214 118 L262 70" fill="none" stroke={c.accent} strokeWidth="1.3" opacity=".7" />
      {[[40, 170], [90, 130], [130, 148], [176, 96], [214, 118], [262, 70]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="3.4" fill={i === 4 ? c.wax : c.accent} opacity=".9" />
      ))}
      <line x1="176" y1="96" x2="176" y2="62" stroke={c.ink} strokeWidth="1.2" />
      <path d="M176 62 L200 68 L176 76 Z" fill={c.goldLight} stroke={c.gold} strokeWidth="1" />
      <text x="204" y="60" fill={c.gold} fontSize="8" fontFamily="JetBrains Mono, monospace">S_best</text>
      <circle cx="214" cy="118" r="5" fill="none" stroke={c.wax} strokeWidth="1.2" />
      <text x="222" y="132" fill={c.wax} fontSize="7.5" fontFamily="JetBrains Mono, monospace">S_cur turun</text>
      <text x="40" y="196" fill={c.ink} fontSize="8" fontFamily="JetBrains Mono, monospace" opacity=".75">jika f(S_cur) &lt; f(S_best) → S_best ← S_cur</text>
    </Frame>
  )
}

export function PlateCooling({ tone }: { tone: Tone }) {
  const c = palette(tone)
  const points: string[] = []
  for (let i = 0; i <= 40; i++) {
    const t = i / 40
    const T = 10 * Math.pow(0.85, i)
    const x = 44 + t * 236
    const y = 176 - (Math.log(Math.max(T, 0.01)) - Math.log(0.01)) / (Math.log(10) - Math.log(0.01)) * 120
    points.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`)
  }
  return (
    <Frame label="Kurva pendinginan eksponensial">
      <line x1="44" y1="176" x2="286" y2="176" stroke={c.ink} strokeWidth="1.1" />
      <line x1="44" y1="176" x2="44" y2="40" stroke={c.ink} strokeWidth="1.1" />
      <path d={points.join(' ')} fill="none" stroke={c.accent} strokeWidth="1.8" />
      <line x1="44" y1="152" x2="286" y2="152" stroke={c.wax} strokeWidth="1" strokeDasharray="4 3" />
      <text x="250" y="148" textAnchor="end" fill={c.wax} fontSize="7.5" fontFamily="JetBrains Mono, monospace">T_final = 0,01</text>
      <text x="48" y="52" fill={c.ink} fontSize="8" fontFamily="JetBrains Mono, monospace">T = αT</text>
      <text x="160" y="196" textAnchor="middle" fill={c.ink} fontSize="8" fontFamily="JetBrains Mono, monospace" opacity=".7">α = 0,998 · T₁ = 9,98 · T₂ = 9,96004</text>
    </Frame>
  )
}

export function PlateSAUpdate({ tone }: { tone: Tone }) {
  const c = palette(tone)
  return (
    <Frame label="Pembaruan S_cur dan S_best">
      {[
        { label: 'S_cur', value: 'f = 11', color: c.wax },
        { label: 'S_next', value: 'f = 13', color: c.ink },
        { label: 'S_best', value: 'f = 9', color: c.gold },
      ].map((item, i) => (
        <g key={item.label}>
          <rect x={26 + i * 96} y="76" width="80" height="52" fill="rgba(251,244,228,.55)" stroke={item.color} strokeWidth="1.3" />
          <text x={66 + i * 96} y="98" textAnchor="middle" fill={c.ink} fontSize="9" fontFamily="Cinzel, serif">{item.label}</text>
          <text x={66 + i * 96} y="116" textAnchor="middle" fill={item.color} fontSize="9" fontFamily="JetBrains Mono, monospace">{item.value}</text>
        </g>
      ))}
      <path d="M108 102 L118 102 M206 102 L216 102" stroke={c.ink} strokeWidth="1.2" />
      <path d="M118 102 l-4 -3 M118 102 l-4 3 M216 102 l-4 -3 M216 102 l-4 3" fill="none" stroke={c.ink} strokeWidth="1" />
      <text x="160" y="52" textAnchor="middle" fill={c.ink} fontSize="8" fontFamily="JetBrains Mono, monospace">diterima (r &lt; P) → S_cur ← S_next</text>
      <text x="160" y="156" textAnchor="middle" fill={c.gold} fontSize="8" fontFamily="JetBrains Mono, monospace">S_best hanya bergerak bila S_cur lebih baik</text>
      <text x="160" y="176" textAnchor="middle" fill={c.ink} fontSize="7.5" fontFamily="JetBrains Mono, monospace" opacity=".7">13 &gt; 9 → S_best tetap 9</text>
    </Frame>
  )
}