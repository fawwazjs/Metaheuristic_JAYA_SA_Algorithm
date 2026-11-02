import { useEffect, useRef } from 'react'
import { getLandscape, LANDSCAPES } from '../../lib/algorithms/landscapes'
import { formatNumber } from '../../lib/algorithms/rng'
import type { SaSnapshot, SaTrial } from '../../lib/algorithms/sa'
import { useSaStore } from '../../store/saStore'
import { Tex } from '../math/Tex'
import {
  IconBack, IconCheck, IconCross, IconPause, IconPlay, IconReset, IconStep,
} from '../ornaments/Ornaments'
import { Lever, NumberField, Segmented, SelectPlaque, Stat, ToggleWood } from '../ui/Controls'
import {
  drawArrow, drawFlag, drawGlow, drawSpark, mapToCanvas, paintMap, useCanvasLoop,
  type CanvasSize,
} from './canvas'

/** Warna bola logam mengikuti temperatur relatif. */
export function temperatureColor(ratio: number): string {
  const stops: Array<[number, string]> = [
    [0, '#7d8a92'],
    [0.12, '#a25b3b'],
    [0.3, '#c8561e'],
    [0.55, '#e3b64f'],
    [0.8, '#ffd98a'],
    [1, '#fff8dd'],
  ]
  const t = Math.min(1, Math.max(0, ratio))
  for (let i = 1; i < stops.length; i++) {
    if (t <= stops[i][0]) {
      const [t0, c0] = stops[i - 1]
      const [t1, c1] = stops[i]
      const local = (t - t0) / Math.max(1e-6, t1 - t0)
      return mixHex(c0, c1, local)
    }
  }
  return stops[stops.length - 1][1]
}

function mixHex(a: string, b: string, t: number): string {
  const parse = (hex: string) => [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ]
  const [r1, g1, b1] = parse(a)
  const [r2, g2, b2] = parse(b)
  const eased = t * t * (3 - 2 * t)
  return `rgb(${Math.round(r1 + (r2 - r1) * eased)}, ${Math.round(g1 + (g2 - g1) * eased)}, ${Math.round(b1 + (b2 - b1) * eased)})`
}

const DECISION_LABEL: Record<string, { label: string; tone: string }> = {
  improve: { label: 'Diterima — cost turun', tone: 'text-[#a9c79b]' },
  equal: { label: 'Diterima — cost tetap', tone: 'text-gold-light' },
  'worse-accepted': { label: 'Diterima walau lebih buruk', tone: 'text-[#f0a06a]' },
  'worse-rejected': { label: 'Ditolak — r ≥ P', tone: 'text-[#e79a8f]' },
}

export function SaSim() {
  const snapshot = useSaStore((s) => s.snapshot)
  const landscapeId = useSaStore((s) => s.landscapeId)
  const alpha = useSaStore((s) => s.alpha)
  const innerLoops = useSaStore((s) => s.innerLoops)
  const Tfinal = useSaStore((s) => s.Tfinal)
  const stepSize = useSaStore((s) => s.stepSize)
  const t0Mode = useSaStore((s) => s.t0Mode)
  const T0 = useSaStore((s) => s.T0)
  const hec = useSaStore((s) => s.hec)
  const seed = useSaStore((s) => s.seed)
  const speed = useSaStore((s) => s.speed)
  const running = useSaStore((s) => s.running)
  const showGhost = useSaStore((s) => s.showGhost)
  const showTrail = useSaStore((s) => s.showTrail)
  const showThermometer = useSaStore((s) => s.showThermometer)

  const setLandscape = useSaStore((s) => s.setLandscape)
  const setT0Mode = useSaStore((s) => s.setT0Mode)
  const setT0 = useSaStore((s) => s.setT0)
  const setAlpha = useSaStore((s) => s.setAlpha)
  const setInnerLoops = useSaStore((s) => s.setInnerLoops)
  const setTfinal = useSaStore((s) => s.setTfinal)
  const setStepSize = useSaStore((s) => s.setStepSize)
  const setSeed = useSaStore((s) => s.setSeed)
  const newSeed = useSaStore((s) => s.newSeed)
  const setHec = useSaStore((s) => s.setHec)
  const setSpeed = useSaStore((s) => s.setSpeed)
  const toggleRunning = useSaStore((s) => s.toggleRunning)
  const toggleGhost = useSaStore((s) => s.toggleGhost)
  const toggleTrail = useSaStore((s) => s.toggleTrail)
  const toggleThermometer = useSaStore((s) => s.toggleThermometer)
  const step = useSaStore((s) => s.step)
  const stepTemperature = useSaStore((s) => s.stepTemperature)
  const undo = useSaStore((s) => s.undo)
  const reset = useSaStore((s) => s.reset)

  useEffect(() => {
    if (!useSaStore.getState().snapshot) useSaStore.getState().init()
  }, [])

  const landscape = getLandscape(landscapeId)
  const positionRef = useRef<[number, number] | null>(null)

  const draw = (ctx: CanvasRenderingContext2D, size: CanvasSize, time: number) => {
    const snap = useSaStore.getState().snapshot
    paintMap(ctx, size, landscape, true)
    if (!snap) return

    const ratio = Math.max(0, Math.min(1, snap.T / Math.max(1e-9, snap.T0)))
    const color = temperatureColor(ratio)

    if (useSaStore.getState().showTrail && snap.trail.length > 1) {
      ctx.save()
      ctx.lineWidth = 1.3
      for (let i = 1; i < snap.trail.length; i++) {
        const a = snap.trail[i - 1]
        const b = snap.trail[i]
        const [ax, ay] = mapToCanvas(landscape, a.state[0], a.state[1], size)
        const [bx, by] = mapToCanvas(landscape, b.state[0], b.state[1], size)
        const alpha = 0.08 + (i / snap.trail.length) * 0.42
        ctx.strokeStyle = temperatureColor(a.T / Math.max(1e-9, snap.T0)).replace('rgb', 'rgba').replace(')', `, ${alpha})`)
        ctx.beginPath()
        ctx.moveTo(ax, ay)
        ctx.lineTo(bx, by)
        ctx.stroke()
      }
      ctx.restore()
    }

    const [cx, cy] = mapToCanvas(landscape, snap.cur[0], snap.cur[1], size)
    const [bx, by] = mapToCanvas(landscape, snap.best[0], snap.best[1], size)
    drawFlag(ctx, bx, by - 6, '#e3b64f')
    ctx.save()
    ctx.font = '9px "JetBrains Mono", monospace'
    ctx.fillStyle = 'rgba(53,33,15,.75)'
    ctx.fillText('S_best', bx + 8, by - 16)
    ctx.restore()

    const trial = snap.lastTrial
    if (trial && useSaStore.getState().showGhost) {
      const [nx, ny] = mapToCanvas(landscape, trial.next[0], trial.next[1], size)
      const accepted = trial.accepted
      const worse = trial.deltaC > 0
      const lineColor = accepted
        ? worse
          ? 'rgba(200,86,30,.9)'
          : 'rgba(63,91,58,.9)'
        : 'rgba(122,30,30,.85)'
      drawArrow(ctx, cx, cy, nx, ny, lineColor, !accepted, 1.3, 5)
      ctx.save()
      ctx.beginPath()
      ctx.arc(nx, ny, 4.2, 0, Math.PI * 2)
      ctx.fillStyle = accepted ? 'rgba(63,91,58,.35)' : 'rgba(122,30,30,.2)'
      ctx.fill()
      ctx.strokeStyle = lineColor
      ctx.setLineDash([2, 2])
      ctx.stroke()
      ctx.restore()
      if (accepted && worse) {
        drawSpark(ctx, nx, ny, (Math.sin(time / 160) + 1) / 2, '#e3b64f')
      }
    }

    if (positionRef.current) {
      const [px, py] = mapToCanvas(landscape, positionRef.current[0], positionRef.current[1], size)
      drawGlow(ctx, px, py, 14, '#e3b64f', 0.25 * ratio)
    }
    drawGlow(ctx, cx, cy, 22 + ratio * 22 + Math.sin(time / 500) * 2, color, 0.75)
    ctx.save()
    ctx.beginPath()
    ctx.arc(cx, cy, 7.5, 0, Math.PI * 2)
    const ballGradient = ctx.createRadialGradient(cx - 2.4, cy - 2.8, 1, cx, cy, 8)
    ballGradient.addColorStop(0, '#fffdf3')
    ballGradient.addColorStop(0.45, color)
    ballGradient.addColorStop(1, '#3a2a1c')
    ctx.fillStyle = ballGradient
    ctx.fill()
    ctx.strokeStyle = 'rgba(53,33,15,.8)'
    ctx.lineWidth = 1
    ctx.stroke()
    ctx.restore()

    positionRef.current = [snap.cur[0], snap.cur[1]]
  }

  const { canvasRef } = useCanvasLoop(draw)

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      step()
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault()
      undo()
    } else if (event.key === ' ') {
      event.preventDefault()
      toggleRunning()
    }
  }

  const ratio = snapshot ? Math.max(0, Math.min(1, snapshot.T / Math.max(1e-9, snapshot.T0))) : 1
  const decision = snapshot?.lastTrial ? DECISION_LABEL[snapshot.lastTrial.decision] : null
  const summary = snapshot
    ? `Temperatur ${formatNumber(snapshot.T, 3)}, best cost ${formatNumber(snapshot.bestCost, 3)}, evaluasi ${snapshot.evaluations}`
    : 'Simulator SA belum siap'

  return (
    <div className="sim-shell relative overflow-hidden border border-gold/25">
      <div className="border-b border-gold/20 px-3 py-2.5 sm:px-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="font-heading text-[9px] uppercase tracking-[0.22em] text-[#f0a06a]/85">
              Proses Pendinginan
            </p>
            <h3 className="font-heading text-base font-semibold text-parchment-50 sm:text-lg">Simulator SA</h3>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-sm border border-ember/40 bg-black/25 px-2 py-1 font-mono text-[10px] text-[#f0a06a]">
              T = {formatNumber(snapshot?.T ?? 0, 3)}
            </span>
            <span className={`rounded-sm border px-2 py-1 font-heading text-[9px] uppercase tracking-[0.16em] ${
              snapshot?.done ? 'border-[#6f8f63]/50 text-[#a9c79b]' : 'border-gold/25 text-parchment-200/80'
            }`}>
              {snapshot?.done ? 'Selesai (T < T_final)' : `Iterasi suhu ${snapshot?.iteration ?? 0}`}
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-3 p-3 sm:p-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          <div
            className="relative overflow-hidden rounded-sm border border-gold/25 outline-none focus-visible:ring-2 focus-visible:ring-gold-light"
            tabIndex={0}
            role="application"
            aria-label="Area simulasi Simulated Annealing. Panah kanan untuk satu langkah, panah kiri untuk mundur, spasi untuk bermain."
            onKeyDown={onKeyDown}
          >
            <canvas ref={canvasRef} className="block aspect-[4/3] w-full touch-none sm:aspect-[16/10]" aria-hidden="true" />
            {showThermometer && (
              <div className="pointer-events-none absolute bottom-8 right-2 top-8 w-6 sm:right-3">
                <div className="relative h-full w-full overflow-hidden rounded-full border border-gold/40 bg-leather-900/55 shadow-inner backdrop-blur-[1px]">
                  <div
                    className="absolute inset-x-0 bottom-0 transition-[height] duration-500"
                    style={{
                      height: `${Math.max(2, ratio * 100)}%`,
                      background: `linear-gradient(to top, #5e6a73, #8a3a24 30%, ${temperatureColor(ratio)} 100%)`,
                    }}
                  />
                  <div
                    className="absolute inset-x-0 border-t border-dashed border-parchment-100/70"
                    style={{ bottom: `${Math.min(100, (Tfinal / Math.max(snapshot?.T0 ?? 1, 1e-9)) * 100)}%` }}
                  />
                </div>
                <span className="absolute -left-3 top-1/2 origin-center -translate-y-1/2 -rotate-90 font-heading text-[7px] uppercase tracking-[0.16em] text-gold-light/80">
                  T
                </span>
              </div>
            )}
            <div className="pointer-events-none absolute left-2 top-2 flex flex-col gap-1">
              <span className="flex items-center gap-1 rounded-sm border border-gold/30 bg-leather-900/75 px-1.5 py-0.5 font-heading text-[7px] uppercase tracking-wider text-gold-light">
                <span className="h-1.5 w-1.5 rounded-full bg-gold-light" /> S_best {formatNumber(snapshot?.bestCost ?? 0, 3)}
              </span>
              <span className="rounded-sm border border-ember/35 bg-leather-900/75 px-1.5 py-0.5 font-mono text-[8px] text-[#f0a06a]">
                T/T0 = {formatNumber(ratio * 100, 1)}%
              </span>
            </div>
            <div className="pointer-events-none absolute bottom-2 left-2 right-2 flex flex-wrap items-center gap-1">
              <span className="rounded-sm border border-gold/25 bg-leather-900/70 px-1.5 py-0.5 font-body text-[9px] italic text-parchment-200/75">
                Bola = solusi saat ini · garis = usulan neighbor · panji = S_best
              </span>
            </div>
          </div>
          <p aria-live="polite" className="sr-only">{summary}</p>

          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <button type="button" className="rune-btn" onClick={toggleRunning} aria-label={running ? 'Jeda simulasi SA' : 'Mainkan simulasi SA'}>
              {running ? <IconPause size={18} /> : <IconPlay size={18} />}
            </button>
            <button type="button" className="rune-btn" onClick={step} aria-label="Satu percobaan neighbor" disabled={snapshot?.done}>
              <IconStep size={18} />
            </button>
            <button type="button" className="rune-btn w-auto px-2.5" onClick={stepTemperature} aria-label="Langkah sampai suhu turun" disabled={snapshot?.done}>
              <span className="font-heading text-[8px] uppercase tracking-wider">Turunkan T</span>
            </button>
            <button type="button" className="rune-btn" onClick={undo} aria-label="Mundur satu langkah">
              <IconBack size={18} />
            </button>
            <button type="button" className="rune-btn" onClick={reset} aria-label="Reset simulasi SA">
              <IconReset size={18} />
            </button>
            <span className="mx-1 h-5 w-px bg-gold/20" aria-hidden="true" />
            {decision ? (
              <span className={`inline-flex items-center gap-1 font-heading text-[8px] uppercase tracking-wider ${decision.tone}`}>
                {snapshot?.lastTrial?.accepted ? <IconCheck size={12} /> : <IconCross size={12} />}
                {decision.label}
              </span>
            ) : (
              <span className="font-heading text-[8px] uppercase tracking-wider text-parchment-300/55">Siap</span>
            )}
            <span className="ml-auto font-mono text-[9px] text-parchment-300/55">{snapshot?.evaluations ?? 0} evaluasi</span>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat label="Cost saat ini" value={formatNumber(snapshot?.curCost ?? 0, 3)} tone="ember" />
            <Stat label="S_best" value={formatNumber(snapshot?.bestCost ?? 0, 3)} tone="gold" />
            <Stat label="ΔC terakhir" value={formatNumber(snapshot?.lastTrial?.deltaC ?? 0, 3)} />
            <Stat label="Diterima (buruk)" value={snapshot?.acceptedWorse ?? 0} tone="wax" />
          </div>

          <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
            <div className="sim-panel p-2.5">
              <div className="flex items-center justify-between">
                <span className="label-cinzel !text-parchment-300">Cost vs evaluasi</span>
                <span className="value-mono !text-parchment-200/55">cur / best</span>
              </div>
              <CostChart snapshot={snapshot} />
            </div>
            <div className="sim-panel p-2.5">
              <div className="flex items-center justify-between">
                <span className="label-cinzel !text-parchment-300">Temperatur (log)</span>
                <span className="value-mono !text-parchment-200/55">α = {alpha}</span>
              </div>
              <TempChart snapshot={snapshot} />
            </div>
          </div>
        </div>

        <aside className="min-w-0 space-y-2.5">
          <div className="sim-panel p-3">
            <div className="flex items-center justify-between">
              <span className="label-cinzel !text-parchment-300">Probabilitas Metropolis</span>
              <span className="font-mono text-[9px] text-parchment-200/55">P = e^(−ΔC/T)</span>
            </div>
            <ProbabilityMeter trial={snapshot?.lastTrial ?? null} />
            <div className="mt-1 grid grid-cols-2 gap-1.5">
              <Stat label="P terima" value={snapshot?.lastTrial ? formatNumber(snapshot.lastTrial.P, 4) : '—'} tone="gold" />
              <Stat label="r acak" value={snapshot?.lastTrial ? formatNumber(snapshot.lastTrial.r, 4) : '—'} tone={snapshot?.lastTrial?.accepted ? 'forest' : 'wax'} />
            </div>
          </div>

          <div className="sim-panel p-3">
            <span className="label-cinzel !text-parchment-300">Temperatur awal</span>
            {t0Mode === 'auto' ? (
              <div className="mt-1 space-y-1.5">
                <div className="overflow-x-auto text-parchment-100">
                  <Tex display>{'T_0 = -\\frac{\\overline{\\Delta C}}{\\ln(HEC)}'}</Tex>
                </div>
                <p className="font-mono text-[10px] leading-relaxed text-parchment-200/70">
                  ΔC̄ = {formatNumber(snapshot?.t0Info?.meanDelta ?? 0, 3)} · HEC = {hec} <br />
                  T₀ = <span className="text-gold-light">{formatNumber(snapshot?.T0 ?? 0, 2)}</span>
                  {' '}({snapshot?.t0Info?.samples ?? 0} sampel)
                </p>
              </div>
            ) : (
              <p className="mt-1 font-mono text-[11px] text-parchment-200/80">
                T₀ manual = <span className="text-gold-light">{formatNumber(snapshot?.T0 ?? 0, 2)}</span>
              </p>
            )}
          </div>

          <div className="sim-panel p-3">
            <div className="flex items-center justify-between">
              <span className="label-cinzel !text-parchment-300">Riwayat keputusan</span>
              <span className="value-mono !text-parchment-200/50">7 terakhir</span>
            </div>
            <ul className="mt-1.5 space-y-1">
              {useSaStore.getState().log.length === 0 && (
                <li className="font-body text-[11px] italic text-parchment-300/50">
                  Belum ada percobaan. Tekan langkah untuk memulai.
                </li>
              )}
              {useSaStore((s) => s.log).slice().reverse().map((trial, index) => (
                <TrialRow key={`${index}-${trial.T}-${trial.r}`} trial={trial} />
              ))}
            </ul>
          </div>

          <div className="sim-panel space-y-2 p-3">
            <SelectPlaque
              label="Fungsi uji"
              value={landscapeId}
              onChange={setLandscape}
              dark
              options={LANDSCAPES.map((item) => ({ value: item.id, label: `${item.name} · ${item.epithet}` }))}
            />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="label-cinzel !text-parchment-300">T₀</span>
              <Segmented
                ariaLabel="Mode temperatur awal"
                value={t0Mode}
                onChange={(value) => setT0Mode(value)}
                dark
                options={[
                  { value: 'auto', label: 'Otomatis' },
                  { value: 'manual', label: 'Manual' },
                ]}
              />
            </div>
            {t0Mode === 'manual' && (
              <Lever label="T₀" value={T0} min={1} max={100} step={0.5} onChange={setT0} dark format={(v) => formatNumber(v, 1)} />
            )}
            {t0Mode === 'auto' && (
              <Lever label="HEC (target terima buruk)" value={hec} min={0.5} max={0.99} step={0.01} onChange={setHec} dark format={(v) => formatNumber(v, 2)} />
            )}
            <Lever label="α (cooling rate)" value={alpha} min={0.8} max={0.999} step={0.001} onChange={setAlpha} dark format={(v) => formatNumber(v, 3)} />
            <Lever label="Inner loop" value={innerLoops} min={1} max={200} step={1} onChange={setInnerLoops} dark />
            <Lever label="Ukuran langkah" value={stepSize} min={0.05} max={3} step={0.05} onChange={setStepSize} dark format={(v) => formatNumber(v, 2)} />
            <Lever label="T_final" value={Tfinal} min={0.001} max={1} step={0.001} onChange={setTfinal} dark format={(v) => formatNumber(v, 3)} />
            <div className="grid grid-cols-[1fr_auto] items-end gap-2">
              <NumberField label="Seed" value={seed} min={0} max={9999999} onChange={setSeed} dark />
              <button type="button" className="btn-ritual !min-h-[44px] !px-3 !text-[9px]" onClick={newSeed} aria-label="Buat seed baru">
                Seed baru
              </button>
            </div>
            <div>
              <span className="label-cinzel !text-parchment-300">Kecepatan</span>
              <div className="mt-1">
                <Segmented
                  ariaLabel="Kecepatan simulasi SA"
                  value={String(speed) as '0.25' | '0.5' | '1' | '2' | '4' | '8'}
                  onChange={(value) => setSpeed(Number(value) as 0.25 | 0.5 | 1 | 2 | 4 | 8)}
                  dark
                  options={[
                    { value: '0.25', label: '¼×' },
                    { value: '0.5', label: '½×' },
                    { value: '1', label: '1×' },
                    { value: '2', label: '2×' },
                    { value: '4', label: '4×' },
                    { value: '8', label: '8×' },
                  ]}
                />
              </div>
            </div>
            <div className="grid gap-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <ToggleWood label="Solusi sebelumnya" checked={showGhost} onChange={toggleGhost} dark />
              <ToggleWood label="Jejak" checked={showTrail} onChange={toggleTrail} dark />
              <ToggleWood label="Termometer" checked={showThermometer} onChange={toggleThermometer} dark />
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

export function SaDriver() {
  const running = useSaStore((s) => s.running)
  const speed = useSaStore((s) => s.speed)

  useEffect(() => {
    if (!running) return
    const delay = Math.max(40, 420 / speed)
    const timer = window.setInterval(() => {
      const state = useSaStore.getState()
      if (!state.snapshot || state.snapshot.done) {
        useSaStore.setState({ running: false })
        return
      }
      state.step()
    }, delay)
    return () => window.clearInterval(timer)
  }, [running, speed])

  return null
}

function TrialRow({ trial }: { trial: SaTrial<number[]> }) {
  const meta = DECISION_LABEL[trial.decision]
  return (
    <li className="flex items-center justify-between gap-2 border-b border-gold/10 pb-0.5 font-mono text-[9px]">
      <span className="shrink-0 text-parchment-300/55">Δ{trial.deltaC >= 0 ? '+' : ''}{formatNumber(trial.deltaC, 2)}</span>
      <span className="shrink-0 text-parchment-300/55">T {formatNumber(trial.T, 1)}</span>
      <span className="shrink-0 text-gold-light/70">P {formatNumber(trial.P, 2)}</span>
      <span className={`truncate text-right ${meta.tone}`}>{trial.accepted ? '✔' : '✖'} {trial.decision === 'worse-accepted' ? 'terima buruk' : trial.decision === 'worse-rejected' ? 'tolak' : trial.decision === 'improve' ? 'membaik' : 'seri'}</span>
    </li>
  )
}

function ProbabilityMeter({ trial }: { trial: SaTrial<number[]> | null }) {
  const P = trial?.P ?? 0
  const r = trial?.r ?? 0
  const accepted = trial?.accepted ?? false
  const width = 220
  const height = 118
  const cx = width / 2
  const cy = 96
  const radius = 78

  const angle = (value: number) => Math.PI - Math.min(1, Math.max(0, value)) * Math.PI
  const point = (value: number, rr = radius) => {
    const a = angle(value)
    return [cx + Math.cos(a) * rr, cy - Math.sin(a) * rr] as const
  }
  const arc = (from: number, to: number, rr: number) => {
    const [x1, y1] = point(from, rr)
    const [x2, y2] = point(to, rr)
    return `M ${x1} ${y1} A ${rr} ${rr} 0 0 1 ${x2} ${y2}`
  }

  return (
    <div className="mt-1">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label={`Probabilitas penerimaan ${formatNumber(P, 3)}, bilangan acak r ${formatNumber(r, 3)}`}>
        <path d={arc(0, 1, radius)} fill="none" stroke="rgba(227,182,79,.16)" strokeWidth="13" />
        <path d={arc(0, Math.max(0.0001, P), radius)} fill="none" stroke={accepted ? '#d9a94a' : '#8a5a2b'} strokeWidth="13" />
        {(() => {
          const [nx, ny] = point(P, radius - 12)
          const [ox, oy] = point(P, radius + 8)
          return <line x1={ox} y1={oy} x2={nx} y2={ny} stroke="rgba(251,244,228,.55)" strokeWidth="1" strokeDasharray="2 2" />
        })()}
        {(() => {
          const [nx, ny] = point(r, radius + 10)
          return (
            <>
              <line x1={cx} y1={cy} x2={nx} y2={ny} stroke={accepted ? '#8fbb7e' : '#e08a7d'} strokeWidth="1.8" />
              <circle cx={nx} cy={ny} r="3" fill={accepted ? '#a9c79b' : '#e79a8f'} />
            </>
          )
        })()}
        <circle cx={cx} cy={cy} r="4" fill="#e3b64f" />
        <text x="16" y={cy - 4} fill="rgba(244,232,204,.45)" fontSize="8" fontFamily="JetBrains Mono, monospace">0</text>
        <text x={width - 16} y={cy - 4} textAnchor="end" fill="rgba(244,232,204,.45)" fontSize="8" fontFamily="JetBrains Mono, monospace">1</text>
        <text x={cx} y="16" textAnchor="middle" fill={accepted ? '#a9c79b' : '#e79a8f'} fontSize="9" fontFamily="Cinzel, serif">
          {trial ? (accepted ? 'DITERIMA' : 'DITOLAK') : 'MENUNGGU'}
        </text>
        <text x={cx} y={height - 4} textAnchor="middle" fill="rgba(227,182,79,.75)" fontSize="8" fontFamily="JetBrains Mono, monospace">
          P {formatNumber(P, 3)} · r {formatNumber(r, 3)}
        </text>
      </svg>
    </div>
  )
}

function CostChart({ snapshot }: { snapshot: SaSnapshot<number[]> | null }) {
  const width = 420
  const height = 120
  const pad = 12
  if (!snapshot || snapshot.trace.length < 2) {
    return (
      <div className="mt-1.5 flex h-[96px] items-center justify-center border border-dashed border-gold/20 bg-black/10">
        <p className="font-body text-[11px] italic text-parchment-300/50">Grafik muncul setelah evaluasi berjalan.</p>
      </div>
    )
  }
  const trace = snapshot.trace
  const maxCost = Math.max(...trace.map((p) => Math.max(p.curCost, p.bestCost)), 1e-6)
  const minCost = Math.min(...trace.map((p) => p.bestCost), 0)
  const span = Math.max(1e-6, maxCost - minCost)
  const xFor = (i: number) => pad + (i / Math.max(1, trace.length - 1)) * (width - pad * 2)
  const yFor = (value: number) => height - pad - ((value - minCost) / span) * (height - pad * 2)
  const path = (key: 'curCost' | 'bestCost') =>
    trace.map((p, i) => `${i === 0 ? 'M' : 'L'}${xFor(i).toFixed(1)},${yFor(p[key]).toFixed(1)}`).join(' ')
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="mt-1 w-full" role="img" aria-label="Grafik cost saat ini dan best terhadap evaluasi">
      <rect width={width} height={height} fill="rgba(0,0,0,.12)" />
      <path d={path('curCost')} fill="none" stroke="rgba(200,86,30,.7)" strokeWidth="1" />
      <path d={path('bestCost')} fill="none" stroke="#e3b64f" strokeWidth="1.6" />
      <text x={width - pad} y="12" textAnchor="end" fill="rgba(227,182,79,.8)" fontSize="8" fontFamily="JetBrains Mono, monospace">
        best {formatNumber(snapshot.bestCost, 3)}
      </text>
    </svg>
  )
}

function TempChart({ snapshot }: { snapshot: SaSnapshot<number[]> | null }) {
  const width = 420
  const height = 120
  const pad = 14
  if (!snapshot || snapshot.history.length < 2) {
    return (
      <div className="mt-1.5 flex h-[96px] items-center justify-center border border-dashed border-gold/20 bg-black/10">
        <p className="font-body text-[11px] italic text-parchment-300/50">Kurva pendinginan muncul setelah satu blok inner loop.</p>
      </div>
    )
  }
  const history = snapshot.history
  const T0 = Math.max(1e-6, history[0].T)
  const Tmin = Math.max(1e-6, Math.min(snapshot.Tfinal, history[history.length - 1].T))
  const logMax = Math.log(T0)
  const logMin = Math.log(Tmin)
  const span = Math.max(1e-6, logMax - logMin)
  const xFor = (i: number) => pad + (i / Math.max(1, history.length - 1)) * (width - pad * 2)
  const yFor = (T: number) => height - pad - ((Math.log(Math.max(T, Tmin)) - logMin) / span) * (height - pad * 2)
  const path = history.map((p, i) => `${i === 0 ? 'M' : 'L'}${xFor(i).toFixed(1)},${yFor(p.T).toFixed(1)}`).join(' ')
  const finalY = yFor(snapshot.Tfinal)
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="mt-1 w-full" role="img" aria-label="Kurva penurunan temperatur secara logaritmik">
      <rect width={width} height={height} fill="rgba(0,0,0,.12)" />
      <line x1={pad} x2={width - pad} y1={finalY} y2={finalY} stroke="rgba(122,30,30,.7)" strokeWidth="1" strokeDasharray="3 3" />
      <path d={path} fill="none" stroke="#e08a44" strokeWidth="1.6" />
      <text x={pad} y={finalY - 4} fill="rgba(231,154,143,.75)" fontSize="7" fontFamily="JetBrains Mono, monospace">T_final</text>
      <text x={pad} y="12" fill="rgba(240,160,106,.85)" fontSize="8" fontFamily="JetBrains Mono, monospace">T0 {formatNumber(T0, 2)}</text>
      <text x={width - pad} y="12" textAnchor="end" fill="rgba(244,232,204,.4)" fontSize="8" fontFamily="JetBrains Mono, monospace">
        T {formatNumber(snapshot.T, 4)}
      </text>
    </svg>
  )
}