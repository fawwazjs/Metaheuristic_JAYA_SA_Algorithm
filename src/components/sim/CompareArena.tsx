import { useEffect, useRef, useState } from 'react'
import { getLandscape, LANDSCAPES, type Landscape } from '../../lib/algorithms/landscapes'
import {
  DUEL_BUDGET, runFairDuel, summariseDuelRuns, type DuelResult, type DuelTracePoint,
} from '../../lib/algorithms/duel'
import { formatNumber, randomSeed } from '../../lib/algorithms/rng'
import { comparison } from '../../lib/content'
import { IconDice, IconPlay, IconReset } from '../ornaments/Ornaments'
import { Lever, SelectPlaque } from '../ui/Controls'
import { drawGlow, paintMap, useCanvasLoop, type CanvasSize } from './canvas'

const TOTAL_EVALUATIONS = DUEL_BUDGET

export function CompareArena() {
  const [landscapeId, setLandscapeId] = useState('rastrigin')
  const [seed, setSeed] = useState(20240501)
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<DuelResult | null>(null)
  const [batch, setBatch] = useState<DuelResult[]>([])
  const [batchRunning, setBatchRunning] = useState(false)
  const landscape = getLandscape(landscapeId)

  const resetAll = () => {
    setResult(null)
    setBatch([])
    setProgress(0)
    setRunning(false)
  }

  const start = () => {
    setResult(runFairDuel(landscape, seed))
    setProgress(0)
    setBatch([])
    setRunning(true)
  }

  useEffect(() => {
    if (!running) return
    let frame = 0
    const tick = () => {
      setProgress((current) => {
        const next = current + 0.014
        if (next >= 1) {
          setRunning(false)
          return 1
        }
        return next
      })
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [running])

  const runBatch = () => {
    if (batchRunning) return
    setBatchRunning(true)
    const runs: DuelResult[] = []
    for (let i = 0; i < 20; i++) {
      runs.push(runFairDuel(landscape, seed + i * 7919))
    }
    setBatch(runs)
    setBatchRunning(false)
  }

  const stats = batch.length > 0 ? summariseDuelRuns(batch) : null

  return (
    <div className="space-y-4">
      <DuelCanvas
        landscape={landscape}
        result={result}
        progress={running ? progress : 1}
        running={running}
      />

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="parchment-card p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="eyebrow">Grafik best-so-far</p>
              <p className="font-heading text-sm font-semibold text-leather-800">
                Adil menurut jumlah evaluasi fungsi
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button type="button" className="btn-ritual !min-h-[36px] !px-2.5 !text-[8px]" onClick={start} aria-label="Mulai perbandingan JAYA vs SA">
                <IconPlay size={12} /> Mulai Perbandingan
              </button>
              <button
                type="button"
                className="btn-ritual btn-ritual-light !min-h-[36px] !px-2.5 !text-[8px]"
                onClick={() => {
                  setSeed(randomSeed())
                  resetAll()
                }}
                aria-label="Ganti seed perbandingan"
              >
                <IconDice size={12} /> Seed baru
              </button>
              <button
                type="button"
                className="btn-ritual btn-ritual-light !min-h-[36px] !px-2.5 !text-[8px]"
                onClick={resetAll}
                aria-label="Reset perbandingan"
              >
                <IconReset size={12} /> Reset
              </button>
            </div>
          </div>
          <DuelChart result={result} total={TOTAL_EVALUATIONS} />
          {result ? (
            <p aria-live="polite" className="mt-1.5 border-t border-leather-700/20 pt-1.5 font-body text-[12px] italic text-leather-700">
              JAYA menemukan <strong className="text-forest">{formatNumber(result.jayaBest, 4)}</strong>; SA menemukan{' '}
              <strong className="text-ember">{formatNumber(result.saBest, 4)}</strong> — keduanya dalam{' '}
              {result.evaluations} evaluasi fungsi.
            </p>
          ) : (
            <p className="mt-1.5 border-t border-leather-700/20 pt-1.5 font-body text-[12px] italic text-leather-600">
              Tekan “Mulai Perbandingan” untuk menjalankan kedua algoritma pada lanskap yang sama.
            </p>
          )}
        </div>

        <div className="parchment-card space-y-2 p-3">
          <SelectPlaque
            label="Fungsi uji"
            value={landscapeId}
            onChange={(id) => {
              setLandscapeId(id)
              resetAll()
            }}
            options={LANDSCAPES.map((item) => ({ value: item.id, label: `${item.name} · ${item.epithet}` }))}
          />
          <Lever label="Seed" value={seed} min={0} max={9999999} step={1} onChange={setSeed} />
          <div className="border border-leather-700/25 bg-parchment-50/45 p-2">
            <p className="font-heading text-[8px] uppercase tracking-wider text-leather-600">Uji 20 kali (mean ± std)</p>
            <button
              type="button"
              onClick={runBatch}
              disabled={batchRunning}
              className="btn-ritual mt-1 w-full !min-h-[34px] !text-[8px] disabled:opacity-50"
            >
              {batchRunning ? 'Menjalankan…' : 'Jalankan 20 kali'}
            </button>
            {stats && (
              <>
                <div className="mt-1.5 grid grid-cols-2 gap-1.5 font-mono text-[10px]">
                  <div className="border border-forest/30 bg-forest/5 p-1 text-center">
                    <div className="font-heading text-[7px] uppercase tracking-wider text-leather-600">JAYA</div>
                    <div className="text-forest">{formatNumber(stats.jaya.mean, 3)}</div>
                    <div className="text-[8px] text-leather-600">± {formatNumber(stats.jaya.std, 3)}</div>
                  </div>
                  <div className="border border-ember/30 bg-ember/5 p-1 text-center">
                    <div className="font-heading text-[7px] uppercase tracking-wider text-leather-600">SA</div>
                    <div className="text-ember">{formatNumber(stats.sa.mean, 3)}</div>
                    <div className="text-[8px] text-leather-600">± {formatNumber(stats.sa.std, 3)}</div>
                  </div>
                </div>
                <p className="mt-1 text-center font-mono text-[9px] text-leather-600">
                  JAYA unggul {stats.jayaWins}/20 · SA unggul {stats.saWins}/20
                </p>
              </>
            )}
            <p className="mt-1 text-[10px] italic text-leather-600/80">
              Hasil acak; ulangi dengan seed berbeda.
            </p>
          </div>
        </div>
      </div>

      <ComparisonTable />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Grafik perbandingan                                                 */
/* ------------------------------------------------------------------ */

function DuelCanvas({
  landscape,
  result,
  progress,
  running,
}: {
  landscape: Landscape
  result: DuelResult | null
  progress: number
  running: boolean
}) {
  const progressRef = useRef(progress)
  progressRef.current = progress

  const draw = (ctx: CanvasRenderingContext2D, size: CanvasSize, time: number) => {
    paintMap(ctx, size, landscape, true)
    const current = result
    if (!current) {
      drawGlow(ctx, size.width / 2, size.height / 2, 70, '#e3b64f', 0.16)
      ctx.save()
      ctx.font = 'italic 13px "EB Garamond", Georgia, serif'
      ctx.fillStyle = 'rgba(53,33,15,.65)'
      ctx.textAlign = 'center'
      ctx.fillText('Tekan “Mulai Perbandingan” untuk menjalankan JAYA dan SA', size.width / 2, size.height / 2)
      ctx.restore()
      return
    }
    const p = progressRef.current

    const drawTrace = (trace: DuelTracePoint[], color: string) => {
      const valid = trace.filter((point) => Number.isFinite(point.bestCost))
      if (valid.length < 2) return
      const limit = Math.max(2, Math.floor(valid.length * p))
      ctx.save()
      ctx.strokeStyle = color
      ctx.lineWidth = 1.7
      ctx.beginPath()
      for (let i = 0; i < limit; i++) {
        const point = valid[i]
        const x = 42 + (Math.min(point.evaluations, TOTAL_EVALUATIONS) / TOTAL_EVALUATIONS) * (size.width - 84)
        const y = size.height - 34 - (1 - Math.min(1, point.bestCost / Math.max(1, landscape.maxForColor))) * (size.height - 76)
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()
      ctx.restore()
    }
    drawTrace(current.jayaTrace, 'rgba(63,91,58,.9)')
    drawTrace(current.saTrace, 'rgba(200,86,30,.9)')

    ctx.save()
    ctx.font = '9px "JetBrains Mono", monospace'
    ctx.fillStyle = 'rgba(63,91,58,.95)'
    ctx.fillText('JAYA', size.width - 108, 26)
    ctx.fillStyle = 'rgba(200,86,30,.95)'
    ctx.fillText('SA', size.width - 68, 26)
    ctx.fillStyle = 'rgba(53,33,15,.5)'
    ctx.fillText(`evaluasi ${Math.round(TOTAL_EVALUATIONS * p)} / ${TOTAL_EVALUATIONS}`, 38, 26)
    ctx.restore()
    if (running) {
      drawGlow(ctx, size.width / 2, 18, 26, '#e3b64f', 0.18 + Math.sin(time / 200) * 0.06)
    }
  }

  const { canvasRef } = useCanvasLoop(draw)

  return (
    <div className="sim-shell overflow-hidden border border-gold/25">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gold/20 px-3 py-2">
        <p className="font-heading text-[9px] uppercase tracking-[0.2em] text-gold-light/80">
          Perbandingan · {landscape.name}
        </p>
        <div className="flex gap-2 font-heading text-[8px] uppercase tracking-wider">
          <span className="flex items-center gap-1 text-[#a9c79b]"><span className="h-1.5 w-4 bg-[#6f8f63]" /> JAYA</span>
          <span className="flex items-center gap-1 text-[#f0a06a]"><span className="h-1.5 w-4 bg-ember" /> SA</span>
        </div>
      </div>
      <canvas ref={canvasRef} className="block aspect-[16/9] w-full" aria-hidden="true" />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Grafik pembanding                                                   */
/* ------------------------------------------------------------------ */

function chartDomain(traces: DuelTracePoint[][]) {
  const values = traces
    .flat()
    .map((point) => point.bestCost)
    .filter((value) => Number.isFinite(value))
  if (values.length === 0) return { min: 0, max: 1, span: 1 }
  const max = Math.max(...values)
  const min = Math.min(...values)
  return { min, max, span: Math.max(1e-6, max - min) }
}

function DuelChart({ result, total }: { result: DuelResult | null; total: number }) {
  const width = 560
  const height = 170
  const pad = 34

  if (!result) {
    return (
      <div className="mt-2 flex h-[150px] items-center justify-center border border-dashed border-leather-700/25 bg-parchment-50/40">
        <p className="font-body text-[12px] italic text-leather-600">
          Grafik perbandingan muncul setelah perbandingan dijalankan.
        </p>
      </div>
    )
  }

  const { min, max, span } = chartDomain([result.jayaTrace, result.saTrace])
  const xFor = (evaluations: number) => pad + (Math.min(evaluations, total) / total) * (width - pad * 2)
  const yFor = (cost: number) =>
    Number.isFinite(cost) ? height - pad - ((cost - min) / span) * (height - pad * 2) : height - pad

  const path = (trace: DuelTracePoint[]) => {
    const step = Math.max(1, Math.floor(trace.length / 140))
    return trace
      .filter((point, index) => Number.isFinite(point.bestCost) && (index % step === 0 || index === trace.length - 1))
      .map((point, index) => `${index === 0 ? 'M' : 'L'}${xFor(point.evaluations).toFixed(1)},${yFor(point.bestCost).toFixed(1)}`)
      .join(' ')
  }

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="mt-2 w-full"
      role="img"
      aria-label="Grafik best-so-far JAYA dan SA terhadap jumlah evaluasi fungsi"
    >
      <rect width={width} height={height} fill="rgba(78,49,25,.05)" />
      {[0, 0.25, 0.5, 0.75, 1].map((fraction) => (
        <line
          key={fraction}
          x1={pad}
          x2={width - pad}
          y1={pad + fraction * (height - pad * 2)}
          y2={pad + fraction * (height - pad * 2)}
          stroke="rgba(78,49,25,.1)"
          strokeWidth="0.7"
        />
      ))}
      <path d={path(result.jayaTrace)} fill="none" stroke="#3F5B3A" strokeWidth="1.8" />
      <path d={path(result.saTrace)} fill="none" stroke="#C8561E" strokeWidth="1.8" />
      <text x={pad} y={12} fill="rgba(53,33,15,.6)" fontSize="8" fontFamily="JetBrains Mono, monospace">
        best cost {formatNumber(max, 2)}
      </text>
      <text x={pad} y={height - 8} fill="rgba(53,33,15,.5)" fontSize="8" fontFamily="JetBrains Mono, monospace">
        0 eval
      </text>
      <text x={width - pad} y={height - 8} textAnchor="end" fill="rgba(53,33,15,.5)" fontSize="8" fontFamily="JetBrains Mono, monospace">
        {total} eval
      </text>
      <text x={width - pad} y={12} textAnchor="end" fill="rgba(63,91,58,.9)" fontSize="8" fontFamily="JetBrains Mono, monospace">
        JAYA {formatNumber(result.jayaBest, 3)}
      </text>
      <text x={width - pad} y={24} textAnchor="end" fill="rgba(200,86,30,.9)" fontSize="8" fontFamily="JetBrains Mono, monospace">
        SA {formatNumber(result.saBest, 3)}
      </text>
    </svg>
  )
}

function ComparisonTable() {
  return (
    <div className="parchment-card overflow-hidden">
      <div className="border-b border-leather-700/20 px-3 py-2">
        <p className="eyebrow">Tabel perbandingan</p>
        <p className="font-heading text-sm font-semibold text-leather-800">JAYA dan Simulated Annealing</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-left text-[13px]">
          <caption className="sr-only">Perbandingan algoritma JAYA dan Simulated Annealing</caption>
          <thead>
            <tr>
              <th scope="col" className="w-[24%] border-b border-leather-700/25 bg-leather-700/5 px-3 py-2 font-heading text-[9px] uppercase tracking-[0.16em] text-leather-600">
                Aspek
              </th>
              <th scope="col" className="w-[38%] border-b border-l border-leather-700/25 bg-forest/5 px-3 py-2 font-heading text-[9px] uppercase tracking-[0.16em] text-forest">
                JAYA
              </th>
              <th scope="col" className="w-[38%] border-b border-l border-leather-700/25 bg-ember/5 px-3 py-2 font-heading text-[9px] uppercase tracking-[0.16em] text-ember">
                Simulated Annealing
              </th>
            </tr>
          </thead>
          <tbody>
            {comparison.rows.map((row, index) => (
              <tr key={row.aspect} className={index % 2 === 0 ? 'bg-parchment-50/30' : ''}>
                <th scope="row" className="border-b border-leather-700/12 px-3 py-2 align-top font-heading text-[11px] font-semibold text-leather-800">
                  {row.aspect}
                </th>
                <td className="border-b border-l border-leather-700/12 px-3 py-2 align-top text-ink/85">{row.jaya}</td>
                <td className="border-b border-l border-leather-700/12 px-3 py-2 align-top text-ink/85">{row.sa}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}