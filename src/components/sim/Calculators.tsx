import { useMemo, useState } from 'react'
import { jayaUpdateValue } from '../../lib/algorithms/jaya'
import {
  acceptanceProbability, coolingTable, initialTemperature, iterationsUntilFinal,
} from '../../lib/algorithms/sa'
import { formatNumber } from '../../lib/algorithms/rng'
import { Tex } from '../math/Tex'
import { Lever } from '../ui/Controls'
import { FleurDeLis } from '../ornaments/Ornaments'

/* ------------------------------------------------------------------ */
/* JAYA: kalkulator pembaruan satu variabel                            */
/* ------------------------------------------------------------------ */

export function JayaUpdateCalculator() {
  const [x, setX] = useState(2)
  const [best, setBest] = useState(3)
  const [worst, setWorst] = useState(1)
  const [r1, setR1] = useState(0.5)
  const [r2, setR2] = useState(0.5)
  const [vmCount, setVmCount] = useState(3)

  const raw = jayaUpdateValue(x, best, worst, r1, r2)
  const rounded = Math.min(vmCount, Math.max(1, Math.round(raw)))
  const clamped = Math.min(6, Math.max(-1, raw))

  const sliderPreset = () => {
    setX(2)
    setBest(3)
    setWorst(1)
    setR1(0.5)
    setR2(0.5)
  }

  // Skala garis bilangan -1..6
  const toPercent = (value: number) => ((Math.min(6, Math.max(-1, value)) + 1) / 7) * 100

  return (
    <div className="parchment-card p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="eyebrow">Alat hitung · Langkah III</p>
          <h4 className="font-heading text-lg font-semibold text-leather-800">
            Kalkulator pembaruan JAYA
          </h4>
        </div>
        <button type="button" className="btn-ritual btn-ritual-light !min-h-[36px] !px-2.5 !text-[8px]" onClick={sliderPreset}>
          Preset Contoh Slide
        </button>
      </div>

      <div className="formula-panel mt-3 overflow-x-auto border border-leather-700/25 bg-parchment-50/60 p-2.5">
        <Tex display>{'X_i^{k+1} = X_i^{k} + r_1\\left(P_{best_i} - \\left|X_i^{k}\\right|\\right) - r_2\\left(P_{worst_i} - \\left|X_i^{k}\\right|\\right)'}</Tex>
        <div className="mt-1.5 border-t border-dashed border-leather-700/25 pt-1.5 font-mono text-[11px] leading-relaxed text-leather-800">
          <p>
            X′ = {formatNumber(x, 2)} + {formatNumber(r1, 2)}·({formatNumber(best, 2)} − |{formatNumber(x, 2)}|) −{' '}
            {formatNumber(r2, 2)}·({formatNumber(worst, 2)} − |{formatNumber(x, 2)}|)
          </p>
          <p>
            = {formatNumber(x, 2)} + {formatNumber(r1, 2)}·({formatNumber(best - Math.abs(x), 2)}) −{' '}
            {formatNumber(r2, 2)}·({formatNumber(worst - Math.abs(x), 2)})
          </p>
          <p>
            = {formatNumber(x, 2)} + {formatNumber(r1 * (best - Math.abs(x)), 2)} −{' '}
            {formatNumber(r2 * (worst - Math.abs(x)), 2)}
          </p>
          <p className="text-wax">
            = <span className="text-lg font-semibold">{formatNumber(raw, 3)}</span>
          </p>
        </div>
      </div>

      <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
        <Lever label="X (posisi sekarang)" value={x} min={-1} max={5} step={0.1} onChange={setX} format={(v) => formatNumber(v, 1)} />
        <Lever label="P_best" value={best} min={-1} max={5} step={0.1} onChange={setBest} format={(v) => formatNumber(v, 1)} />
        <Lever label="P_worst" value={worst} min={-1} max={5} step={0.1} onChange={setWorst} format={(v) => formatNumber(v, 1)} />
        <Lever label="r₁" value={r1} min={0} max={1} step={0.05} onChange={setR1} format={(v) => formatNumber(v, 2)} />
        <Lever label="r₂" value={r2} min={0} max={1} step={0.05} onChange={setR2} format={(v) => formatNumber(v, 2)} />
        <Lever label="Jumlah VM (m)" value={vmCount} min={1} max={6} step={1} onChange={setVmCount} />
      </div>

      {/* Garis bilangan */}
      <div className="mt-4">
        <div className="relative h-14">
          <div className="absolute left-0 right-0 top-7 h-0.5 bg-leather-700/30" aria-hidden="true" />
          {[-1, 0, 1, 2, 3, 4, 5, 6].map((tick) => (
            <div key={tick} className="absolute top-6 -translate-x-1/2" style={{ left: `${toPercent(tick)}%` }}>
              <div className="h-2.5 w-px bg-leather-700/40" />
              <span className="mt-1 block font-mono text-[8px] text-leather-600">{tick}</span>
            </div>
          ))}
          {/* X */}
          <Marker left={toPercent(x)} label="X" tone="forest" top={14} />
          {/* P_best */}
          <Marker left={toPercent(best)} label="P_best" tone="gold" top={0} />
          {/* P_worst */}
          <Marker left={toPercent(worst)} label="P_worst" tone="wax" top={26} />
          {/* hasil */}
          <div
            className="absolute top-[22px] -translate-x-1/2 transition-all duration-300"
            style={{ left: `${toPercent(clamped)}%` }}
          >
            <div className="h-3 w-3 rotate-45 border border-leather-900 bg-gold-light shadow-[0_0_8px_rgba(227,182,79,.8)]" />
            <span className="mt-1 block whitespace-nowrap font-heading text-[8px] font-semibold uppercase tracking-wider text-leather-800">
              X′ {formatNumber(raw, 2)}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-leather-700/20 pt-2">
        <span className="font-body text-[12px] text-leather-700">
          Bulatkan ke VM (<code className="font-mono text-[11px]">round</code> + clamp [1, m]):
        </span>
        <span className="border border-wax/35 bg-wax/10 px-2 py-0.5 font-mono text-[12px] font-semibold text-wax">
          VM {rounded}
        </span>
        <span className="font-body text-[11px] italic text-leather-600">
          Menjelaskan kelemahan konversi kontinu → diskret.
        </span>
      </div>

      <p className="mt-2 font-body text-[12px] leading-relaxed text-leather-600">
        <FleurDeLis className="mr-1 inline h-3 w-3 text-gold" aria-hidden="true" />
        Dengan preset slide (X = 2, P_best = 3, P_worst = 1, r₁ = r₂ = 0,5) hasilnya <strong>3</strong>: Task 2
        berpindah dari VM ke-2 ke VM ke-3.
      </p>
    </div>
  )
}

function Marker({
  left,
  label,
  tone,
  top,
}: {
  left: number
  label: string
  tone: 'forest' | 'gold' | 'wax'
  top: number
}) {
  const colors = {
    forest: 'bg-forest border-forest',
    gold: 'bg-gold border-leather-800',
    wax: 'bg-wax border-wax',
  }
  return (
    <div className="absolute -translate-x-1/2 transition-all duration-300" style={{ left: `${left}%`, top }}>
      <span
        className={`block h-2.5 w-2.5 rounded-full border ${colors[tone]} ${tone === 'gold' ? 'shadow-[0_0_0_3px_rgba(227,182,79,.25)]' : ''}`}
      />
      <span className="absolute left-1/2 top-3 -translate-x-1/2 whitespace-nowrap font-heading text-[7px] uppercase tracking-wider text-leather-600">
        {label}
      </span>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* SA: probabilitas & cooling                                          */
/* ------------------------------------------------------------------ */

export function ProbabilityCalc() {
  const [deltaC, setDeltaC] = useState(4)
  const [T, setT] = useState(10)
  const [alpha, setAlpha] = useState(0.998)
  const [T0, setT0] = useState(10)
  const [Tfinal, setTfinal] = useState(0.01)
  const [meanDelta, setMeanDelta] = useState(2)
  const [hec, setHec] = useState(0.9)

  const P = acceptanceProbability(deltaC, T)
  const table = coolingTable(T0, alpha, 3)
  const n = iterationsUntilFinal(T0, alpha, Tfinal)
  const T0calc = initialTemperature(meanDelta, hec)

  // Kurva P terhadap T untuk ΔC tetap
  const curve = useMemo(() => {
    const points: Array<[number, number]> = []
    for (let i = 0; i <= 60; i++) {
      const t = 0.05 + (i / 60) * 50
      points.push([t, acceptanceProbability(deltaC, t)])
    }
    return points
  }, [deltaC])

  const width = 420
  const height = 130
  const pad = 24
  const xFor = (t: number) => pad + (t / 50) * (width - pad * 2)
  const yFor = (p: number) => height - pad - p * (height - pad * 2)
  const path = curve.map(([t, p], i) => `${i === 0 ? 'M' : 'L'}${xFor(t).toFixed(1)},${yFor(p).toFixed(1)}`).join(' ')

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <div className="parchment-card p-4">
        <p className="eyebrow">Alat hitung · Langkah VIII</p>
        <h4 className="font-heading text-lg font-semibold text-leather-800">Penerimaan Metropolis</h4>
        <div className="formula-panel mt-2 overflow-x-auto border border-leather-700/25 bg-parchment-50/60 p-2">
          <Tex display>{'P = \\exp\\left(-\\frac{\\Delta C}{T}\\right) \\quad \\text{untuk } \\Delta C > 0'}</Tex>
        </div>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <Lever label="ΔC" value={deltaC} min={0} max={20} step={0.5} onChange={setDeltaC} format={(v) => formatNumber(v, 1)} />
          <Lever label="Temperatur T" value={T} min={0.01} max={50} step={0.01} onChange={setT} format={(v) => formatNumber(v, 2)} />
        </div>
        <div className="mt-2 flex items-baseline gap-2 border-t border-leather-700/20 pt-2">
          <span className="font-heading text-[9px] uppercase tracking-wider text-leather-600">P =</span>
          <span className="font-mono text-2xl font-semibold text-wax">{formatNumber(P, 4)}</span>
          <span className="font-mono text-[10px] text-leather-600">= e^(−{formatNumber(deltaC / Math.max(T, 1e-9), 3)})</span>
        </div>
        <svg viewBox={`0 0 ${width} ${height}`} className="mt-2 w-full" role="img" aria-label="Kurva probabilitas penerimaan terhadap temperatur">
          <rect width={width} height={height} fill="rgba(78,49,25,.05)" />
          <line x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} stroke="rgba(78,49,25,.4)" strokeWidth="1" />
          <line x1={pad} y1={pad} x2={pad} y2={height - pad} stroke="rgba(78,49,25,.4)" strokeWidth="1" />
          <path d={path} fill="none" stroke="#C8561E" strokeWidth="1.8" />
          <line x1={xFor(T)} y1={pad} x2={xFor(T)} y2={height - pad} stroke="rgba(122,30,30,.35)" strokeDasharray="3 3" />
          <circle cx={xFor(T)} cy={yFor(P)} r="4" fill="#B8862B" stroke="#35210F" strokeWidth="1" />
          <text x={pad} y={12} fill="rgba(53,33,15,.55)" fontSize="8" fontFamily="JetBrains Mono, monospace">P 1.0</text>
          <text x={pad} y={height - 6} fill="rgba(53,33,15,.45)" fontSize="8" fontFamily="JetBrains Mono, monospace">T 0</text>
          <text x={width - pad} y={height - 6} textAnchor="end" fill="rgba(53,33,15,.45)" fontSize="8" fontFamily="JetBrains Mono, monospace">50</text>
        </svg>
        <div className="mt-1 flex flex-wrap gap-1.5">
          <button type="button" className="btn-ritual btn-ritual-light !min-h-[32px] !px-2 !text-[8px]" onClick={() => { setDeltaC(4); setT(10) }}>
            Preset ΔC=4, T=10
          </button>
          <button type="button" className="btn-ritual btn-ritual-light !min-h-[32px] !px-2 !text-[8px]" onClick={() => { setDeltaC(4); setT(1) }}>
            Preset ΔC=4, T=1
          </button>
          <span className="self-center font-mono text-[9px] text-leather-600">0,6703 · 0,0183</span>
        </div>
      </div>

      <div className="parchment-card p-4">
        <p className="eyebrow">Alat hitung · Langkah V & X</p>
        <h4 className="font-heading text-lg font-semibold text-leather-800">Pendinginan & temperatur awal</h4>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <Lever label="α" value={alpha} min={0.8} max={0.999} step={0.001} onChange={setAlpha} format={(v) => formatNumber(v, 3)} />
          <Lever label="T₀" value={T0} min={1} max={50} step={0.5} onChange={setT0} format={(v) => formatNumber(v, 1)} />
          <Lever label="T_final" value={Tfinal} min={0.001} max={1} step={0.001} onChange={setTfinal} format={(v) => formatNumber(v, 3)} />
          <Lever label="ΔC̄" value={meanDelta} min={0.5} max={10} step={0.1} onChange={setMeanDelta} format={(v) => formatNumber(v, 1)} />
          <Lever label="HEC" value={hec} min={0.5} max={0.99} step={0.01} onChange={setHec} format={(v) => formatNumber(v, 2)} />
        </div>

        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <div className="border border-leather-700/25 bg-parchment-50/50 p-2">
            <p className="font-heading text-[8px] uppercase tracking-wider text-leather-600">Tiga langkah pendinginan</p>
            <p className="mt-1 font-mono text-[11px] leading-relaxed text-leather-800">
              T₁ = {formatNumber(table[0], 6)}
              <br />
              T₂ = {formatNumber(table[1], 6)}
              <br />
              T₃ = {formatNumber(table[2], 5)}
            </p>
          </div>
          <div className="border border-leather-700/25 bg-parchment-50/50 p-2">
            <p className="font-heading text-[8px] uppercase tracking-wider text-leather-600">Menuju T_final</p>
            <p className="mt-1 font-mono text-[11px] leading-relaxed text-leather-800">
              n = ⌈ln({Tfinal}/{T0}) / ln({alpha})⌉
              <br />= <span className="text-wax">{Number.isFinite(n) ? n : '∞'}</span> iterasi suhu
            </p>
          </div>
        </div>

        <div className="mt-2 border border-leather-700/25 bg-parchment-50/50 p-2">
          <p className="font-heading text-[8px] uppercase tracking-wider text-leather-600">
            Temperatur awal dari target penerimaan
          </p>
          <Tex display>{'T_0 = -\\frac{\\overline{\\Delta C}}{\\ln(HEC)}'}</Tex>
          <p className="font-mono text-[11px] text-leather-800">
            = −{formatNumber(meanDelta, 2)} / ln({formatNumber(hec, 2)}) ={' '}
            <span className="text-lg font-semibold text-wax">{formatNumber(T0calc, 2)}</span>
          </p>
          <button type="button" className="btn-ritual btn-ritual-light mt-1 !min-h-[30px] !px-2 !text-[8px]" onClick={() => { setMeanDelta(2); setHec(0.9) }}>
            Preset ΔC̄=2, HEC=0,9 → 18,98
          </button>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* SA operator illustration                                            */
/* ------------------------------------------------------------------ */

export function OperatorIllustration() {
  const [active, setActive] = useState(0)
  const base = [1, 2, 3, 1, 2]
  const samples: SolutionSample[] = [
    { id: 'new-node-insertion', label: 'New Node Insertion', result: [1, 4, 3, 1, 2], note: 't₂ pindah ke node 4' },
    { id: 'swap', label: 'Swap', result: [2, 1, 3, 1, 2], note: 't₁ ↔ t₂' },
    { id: 'random-shuffle', label: 'Random Shuffle', result: [3, 2, 1, 1, 2], note: 'subset diacak' },
    { id: 'displacement', label: 'Displacement', result: [2, 1, 3, 1, 2], note: 'segmen digeser' },
    { id: 'insertion', label: 'Insertion', result: [2, 1, 3, 1, 2], note: 's₂ disisipkan ke depan' },
    { id: 'inversion', label: 'Inversion', result: [1, 3, 2, 1, 2], note: 'segmen [2..3] dibalik' },
  ]
  const current = samples[active]

  return (
    <div className="parchment-card p-4">
      <p className="eyebrow">Enam operator perturbation · Langkah VI</p>
      <div className="mt-2 flex flex-wrap gap-1">
        {samples.map((sample, index) => (
          <button
            key={sample.id}
            type="button"
            onClick={() => setActive(index)}
            data-active={index === active}
            className="min-h-[34px] border border-leather-700/25 px-2 font-heading text-[8px] uppercase tracking-wider text-leather-700 transition-colors hover:border-gold/50 data-[active=true]:border-wax/50 data-[active=true]:bg-wax/10 data-[active=true]:text-wax"
          >
            {sample.label}
          </button>
        ))}
      </div>
      <div className="mt-3 space-y-2">
        <SequenceRow label="Saat ini" values={base} />
        <div className="flex justify-center">
          <svg viewBox="0 0 40 26" className="h-6 w-10 text-gold" fill="none" aria-hidden="true">
            <path d="M20 2v18M20 22l-5-6M20 22l5-6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </div>
        <SequenceRow label="Setelah" values={current.result} highlight />
      </div>
      <p className="mt-2 font-mono text-[10px] text-leather-600">{current.note}</p>
      <p className="mt-1 font-body text-[11px] italic text-leather-600/80">
        Ilustrasi pada larik S; nomor node valid dijaga di [1..N].
      </p>
    </div>
  )
}

function SequenceRow({ label, values, highlight = false }: { label: string; values: number[]; highlight?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-14 shrink-0 font-heading text-[8px] uppercase tracking-wider text-leather-600">{label}</span>
      <div className="flex flex-1 gap-1">
        {values.map((value, index) => (
          <span
            key={index}
            className={`flex h-9 flex-1 items-center justify-center border font-mono text-[11px] transition-colors ${
              highlight
                ? 'border-wax/40 bg-wax/10 text-wax'
                : 'border-leather-700/30 bg-parchment-50/60 text-leather-800'
            }`}
          >
            {value}
          </span>
        ))}
      </div>
    </div>
  )
}

interface SolutionSample {
  id: string
  label: string
  result: number[]
  note: string
}