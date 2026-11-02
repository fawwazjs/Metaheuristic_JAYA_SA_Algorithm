import { useEffect, useMemo, useRef } from 'react'
import { useReducedMotion } from 'framer-motion'
import { getLandscape, LANDSCAPES } from '../../lib/algorithms/landscapes'
import { JAYA_PHASE_LABEL, type JayaPhase, type JayaSnapshot } from '../../lib/algorithms/jaya'
import { formatNumber } from '../../lib/algorithms/rng'
import { useJayaStore } from '../../store/jayaStore'
import { Tex } from '../math/Tex'
import {
  IconBack, IconCheck, IconCross, IconPause, IconPlay, IconReset, IconStep,
} from '../ornaments/Ornaments'
import { NumberField, Lever, Segmented, SelectPlaque, Stat, ToggleWood } from '../ui/Controls'
import {
  drawArrow, drawCrown, drawFlag, drawGlow, drawPawn, drawSkull, drawSpark,
  mapToCanvas, paintMap, useCanvasLoop, type CanvasSize,
} from './canvas'

const PHASE_TONE: Record<JayaPhase, string> = {
  init: 'text-parchment-200',
  evaluate: 'text-gold-light',
  bestWorst: 'text-gold-light',
  update: 'text-[#a9c79b]',
  select: 'text-[#f0a06a]',
  iterate: 'text-gold-light',
  done: 'text-[#a9c79b]',
}

export function JayaSim() {
  const reduce = useReducedMotion()
  const snapshot = useJayaStore((s) => s.snapshot)
  const landscapeId = useJayaStore((s) => s.landscapeId)
  const popSize = useJayaStore((s) => s.popSize)
  const maxIter = useJayaStore((s) => s.maxIter)
  const seed = useJayaStore((s) => s.seed)
  const speed = useJayaStore((s) => s.speed)
  const running = useJayaStore((s) => s.running)
  const showVectors = useJayaStore((s) => s.showVectors)
  const showTrail = useJayaStore((s) => s.showTrail)
  const showContour = useJayaStore((s) => s.showContour)
  const simultaneous = useJayaStore((s) => s.simultaneous)
  const selected = useJayaStore((s) => s.selected)
  const selectedIndex = selected

  const setLandscape = useJayaStore((s) => s.setLandscape)
  const setPopSize = useJayaStore((s) => s.setPopSize)
  const setMaxIter = useJayaStore((s) => s.setMaxIter)
  const setSeed = useJayaStore((s) => s.setSeed)
  const newSeed = useJayaStore((s) => s.newSeed)
  const setSpeed = useJayaStore((s) => s.setSpeed)
  const toggleRunning = useJayaStore((s) => s.toggleRunning)
  const toggleVectors = useJayaStore((s) => s.toggleVectors)
  const toggleTrail = useJayaStore((s) => s.toggleTrail)
  const toggleContour = useJayaStore((s) => s.toggleContour)
  const toggleSimultaneous = useJayaStore((s) => s.toggleSimultaneous)
  const select = useJayaStore((s) => s.select)
  const stepPhase = useJayaStore((s) => s.stepPhase)
  const stepIteration = useJayaStore((s) => s.stepIteration)
  const undo = useJayaStore((s) => s.undo)
  const reset = useJayaStore((s) => s.reset)

  useEffect(() => {
    if (!useJayaStore.getState().snapshot) useJayaStore.getState().init()
  }, [])

  const landscape = getLandscape(landscapeId)
  const phase = snapshot?.phase ?? 'init'
  const displayRef = useRef<Array<[number, number]>>([])
  const trailRef = useRef<Array<Array<[number, number]>>>([])
  const lastTrailRef = useRef(0)
  const sizeRef = useRef<CanvasSize>({ width: 1, height: 1, dpr: 1 })
  const hoverRef = useRef<number | null>(null)

  const draw = (ctx: CanvasRenderingContext2D, size: CanvasSize, time: number) => {
    sizeRef.current = size
    const snap = useJayaStore.getState().snapshot
    paintMap(ctx, size, landscape, useJayaStore.getState().showContour)
    if (!snap || snap.positions.length === 0) return

    const positions = snap.positions
    // Tween posisi tampilan menuju snapshot.
    if (displayRef.current.length !== positions.length) {
      displayRef.current = positions.map((p) => [p[0], p[1]] as [number, number])
      trailRef.current = positions.map(() => [])
    }
    const easing = 0.16
    for (let k = 0; k < positions.length; k++) {
      const current = displayRef.current[k]
      current[0] += (positions[k][0] - current[0]) * easing
      current[1] += (positions[k][1] - current[1]) * easing
    }

    const best = mapToCanvas(landscape, snap.best[0], snap.best[1], size)
    const worst = mapToCanvas(landscape, snap.worst[0], snap.worst[1], size)

    // Jejak
    if (useJayaStore.getState().showTrail) {
      const now = time
      if (now - lastTrailRef.current > 90) {
        lastTrailRef.current = now
        displayRef.current.forEach((point, k) => {
          const trail = trailRef.current[k] ?? (trailRef.current[k] = [])
          const last = trail[trail.length - 1]
          if (!last || Math.hypot(last[0] - point[0], last[1] - point[1]) > 0.04) {
            trail.push([point[0], point[1]])
            if (trail.length > 18) trail.shift()
          }
        })
      }
      ctx.save()
      ctx.lineWidth = 0.8
      trailRef.current.forEach((trail) => {
        if (trail.length < 2) return
        ctx.beginPath()
        trail.forEach(([x, y], i) => {
          const [px, py] = mapToCanvas(landscape, x, y, size)
          if (i === 0) ctx.moveTo(px, py)
          else ctx.lineTo(px, py)
        })
        ctx.strokeStyle = 'rgba(63,91,58,.28)'
        ctx.stroke()
      })
      ctx.restore()
    }

    // Aura terbaik & terburuk
    drawGlow(ctx, best[0], best[1], 34 + Math.sin(time / 420) * 5, '#e3b64f', 0.55)
    drawGlow(ctx, worst[0], worst[1], 26, '#7a1e1e', 0.3)

    // Vektor pembaruan
    if (snap.updates.length > 0 && (phase === 'update' || phase === 'select' || phase === 'iterate')) {
      const show = useJayaStore.getState().showVectors
      snap.updates.forEach((update) => {
        if (!show && !useJayaStore.getState().simultaneous) return
        const [x, y] = mapToCanvas(landscape, update.from[0], update.from[1], size)
        const pullX = update.r1[0] * (update.bestAt[0] - Math.abs(update.from[0]))
        const pullY = update.r1[1] * (update.bestAt[1] - Math.abs(update.from[1]))
        const pushX = -update.r2[0] * (update.worstAt[0] - Math.abs(update.from[0]))
        const pushY = -update.r2[1] * (update.worstAt[1] - Math.abs(update.from[1]))
        const [px, py] = mapToCanvas(landscape, update.from[0] + pullX, update.from[1] + pullY, size)
        const [rx, ry] = mapToCanvas(landscape, update.from[0] + pushX, update.from[1] + pushY, size)
        const [gx, gy] = mapToCanvas(landscape, update.proposed[0], update.proposed[1], size)
        if (show) {
          drawArrow(ctx, x, y, px, py, 'rgba(63,91,58,.8)', false, 1.2, 5)
          drawArrow(ctx, x, y, rx, ry, 'rgba(122,30,30,.72)', true, 1.1, 5)
        }
        if (useJayaStore.getState().simultaneous) {
          drawArrow(ctx, x, y, gx, gy, 'rgba(184,134,43,.9)', false, 1.3, 5)
        }
        // Ghost tujuan
        ctx.save()
        ctx.beginPath()
        ctx.arc(gx, gy, 4.4, 0, Math.PI * 2)
        ctx.setLineDash([2.5, 2])
        ctx.strokeStyle = 'rgba(53,33,15,.7)'
        ctx.lineWidth = 1
        ctx.stroke()
        ctx.restore()

        if (phase === 'select' || phase === 'iterate') {
          const accepted = update.accepted
          if (accepted) {
            ctx.save()
            ctx.strokeStyle = '#3f5b3a'
            ctx.lineWidth = 1.8
            ctx.beginPath()
            ctx.moveTo(gx - 4, gy)
            ctx.lineTo(gx - 1, gy + 3.5)
            ctx.lineTo(gx + 5, gy - 4)
            ctx.stroke()
            ctx.restore()
            drawSpark(ctx, px, py, (Math.sin(time / 180) + 1) / 2 * 0.7, '#b8862b')
          } else {
            ctx.save()
            ctx.strokeStyle = 'rgba(122,30,30,.85)'
            ctx.lineWidth = 1.5
            ctx.beginPath()
            ctx.moveTo(gx - 3.5, gy - 3.5)
            ctx.lineTo(gx + 3.5, gy + 3.5)
            ctx.moveTo(gx + 3.5, gy - 3.5)
            ctx.lineTo(gx - 3.5, gy + 3.5)
            ctx.stroke()
            ctx.restore()
          }
        }
      })
    }

    // Kandidat
    displayRef.current.forEach((point, k) => {
      const [px, py] = mapToCanvas(landscape, point[0], point[1], size)
      const isBest = k === snap.bestIndex
      const isWorst = k === snap.worstIndex
      const isSelected = selectedIndex === k || hoverRef.current === k
      if (isSelected) {
        ctx.save()
        ctx.beginPath()
        ctx.arc(px, py, 12, 0, Math.PI * 2)
        ctx.strokeStyle = 'rgba(227,182,79,.9)'
        ctx.lineWidth = 1.4
        ctx.stroke()
        ctx.restore()
      }
      drawPawn(ctx, px, py, isBest ? 7.2 : 5.8, isBest ? '#e3b64f' : isWorst ? '#5a1a1a' : '#3f5b3a')
      if (isBest) {
        drawFlag(ctx, px + 11, py - 8, '#e3b64f')
        drawCrown(ctx, px, py - 14, 1)
      }
      if (isWorst && !isBest) drawSkull(ctx, px + 9, py - 8, 0.9)
    })

    // Penanda best & worst bila kandidatnya tidak terlihat jelas
    if (snap.positions.length > 0) {
      ctx.save()
      ctx.font = '9px "JetBrains Mono", monospace'
      ctx.fillStyle = 'rgba(53,33,15,.72)'
      ctx.textAlign = 'left'
      ctx.fillText('P_best', best[0] + 14, best[1] - 12)
      ctx.textAlign = 'right'
      ctx.fillText('P_worst', worst[0] - 10, worst[1] + 16)
      ctx.restore()
    }
  }

  const { canvasRef } = useCanvasLoop(draw)

  const nearestCandidate = (clientX: number, clientY: number): number | null => {
    const canvas = canvasRef.current
    const snap = useJayaStore.getState().snapshot
    if (!canvas || !snap) return null
    const rect = canvas.getBoundingClientRect()
    const x = clientX - rect.left
    const y = clientY - rect.top
    let nearest: number | null = null
    let bestDist = 20
    snap.positions.forEach((point, index) => {
      const [px, py] = mapToCanvas(landscape, point[0], point[1], {
        width: rect.width,
        height: rect.height,
        dpr: 1,
      })
      const distance = Math.hypot(px - x, py - y)
      if (distance < bestDist) {
        bestDist = distance
        nearest = index
      }
    })
    return nearest
  }

  // Kontrol keyboard pada area grafik
  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      stepPhase()
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault()
      undo()
    } else if (event.key === ' ') {
      event.preventDefault()
      toggleRunning()
    }
  }

  const selectedUpdate = useMemo(
    () => snapshot?.updates.find((u) => u.candidate === selectedIndex) ?? null,
    [snapshot, selectedIndex],
  )

  const summary = snapshot
    ? `Iterasi ${snapshot.iteration}, fase ${JAYA_PHASE_LABEL[snapshot.phase]}, best ${formatNumber(snapshot.bestFitness, 3)}`
    : 'Simulator belum siap'

  return (
    <div className="sim-shell relative overflow-hidden border border-gold/25">
      <div className="border-b border-gold/20 px-3 py-2.5 sm:px-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="font-heading text-[9px] uppercase tracking-[0.22em] text-gold-light/75">
              Lanskap Fungsi Uji
            </p>
            <h3 className="font-heading text-base font-semibold text-parchment-50 sm:text-lg">
              Simulator JAYA
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className={`rounded-sm border border-gold/25 bg-black/25 px-2 py-1 font-heading text-[9px] uppercase tracking-[0.16em] ${PHASE_TONE[phase]}`}>
              {JAYA_PHASE_LABEL[phase]}
            </span>
            <span className="rounded-sm border border-gold/20 bg-black/20 px-2 py-1 font-mono text-[10px] text-parchment-200/80">
              Iter {snapshot?.iteration ?? 1}/{maxIter}
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-3 p-3 sm:p-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          <div
            className="group relative overflow-hidden rounded-sm border border-gold/25 bg-parchment-200 outline-none focus-visible:ring-2 focus-visible:ring-gold-light"
            tabIndex={0}
            role="application"
            aria-label="Area simulasi JAYA. Gunakan panah kanan untuk langkah, panah kiri untuk mundur, spasi untuk bermain."
            onKeyDown={onKeyDown}
            onPointerMove={(event) => {
              hoverRef.current = nearestCandidate(event.clientX, event.clientY)
            }}
            onPointerLeave={() => {
              hoverRef.current = null
            }}
            onClick={(event) => {
              const index = nearestCandidate(event.clientX, event.clientY)
              if (index !== null) select(index)
            }}
          >
            <canvas
              ref={canvasRef}
              className="block aspect-[4/3] w-full touch-none sm:aspect-[16/10]"
              aria-hidden="true"
            />
            <div className="pointer-events-none absolute left-2 top-2 flex flex-wrap gap-1">
              <span className="rounded-sm border border-leather-700/25 bg-parchment-50/80 px-1.5 py-0.5 font-mono text-[8px] text-leather-700 backdrop-blur-[2px]">
                X {snapshot && snapshot.positions[0] ? formatNumber(snapshot.positions[0][0], 2) : '—'}
              </span>
              <span className="rounded-sm border border-leather-700/25 bg-parchment-50/80 px-1.5 py-0.5 font-mono text-[8px] text-leather-700 backdrop-blur-[2px]">
                Y {snapshot && snapshot.positions[0] ? formatNumber(snapshot.positions[0][1], 2) : '—'}
              </span>
            </div>
            <div className="pointer-events-none absolute right-2 top-2 flex flex-col items-end gap-1">
              <span className="flex items-center gap-1 rounded-sm border border-gold/30 bg-leather-900/75 px-1.5 py-0.5 font-heading text-[7px] uppercase tracking-wider text-gold-light">
                <span className="h-1.5 w-1.5 rounded-full bg-gold-light" /> P_best
              </span>
              <span className="flex items-center gap-1 rounded-sm border border-wax/40 bg-leather-900/75 px-1.5 py-0.5 font-heading text-[7px] uppercase tracking-wider text-[#e79a8f]">
                <span className="h-1.5 w-1.5 rounded-full bg-wax" /> P_worst
              </span>
            </div>
            {!snapshot && (
              <div className="absolute inset-0 flex items-center justify-center bg-leather-900/50">
                <span className="font-heading text-[10px] uppercase tracking-[0.2em] text-parchment-200">
                  Memuat lanskap…
                </span>
              </div>
            )}
          </div>

          <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 font-body text-[11px] italic text-parchment-300/60">
            <span>Seret kursor untuk memilih kandidat; klik untuk membuka perhitungannya.</span>
            <span className="inline-flex items-center gap-1"><span className="h-0.5 w-4 bg-[#6f8f63]" /> tarik ke P_best</span>
            <span className="inline-flex items-center gap-1"><span className="h-0.5 w-4 border-t border-dashed border-wax" /> jauhi P_worst</span>
            <span className="inline-flex items-center gap-1"><span className="h-0.5 w-4 bg-gold" /> hasil X′</span>
          </p>
          <p aria-live="polite" className="sr-only">
            {summary}
          </p>
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <button type="button" className="rune-btn" onClick={toggleRunning} aria-label={running ? 'Jeda simulasi JAYA' : 'Mainkan simulasi JAYA'}>
              {running ? <IconPause size={18} /> : <IconPlay size={18} />}
            </button>
            <button type="button" className="rune-btn" onClick={stepPhase} aria-label="Satu fase maju" disabled={snapshot?.done}>
              <IconStep size={18} />
            </button>
            <button type="button" className="rune-btn w-auto px-2.5" onClick={stepIteration} aria-label="Satu iterasi penuh" disabled={snapshot?.done}>
              <span className="font-heading text-[8px] uppercase tracking-wider">Iterasi</span>
            </button>
            <button type="button" className="rune-btn" onClick={undo} aria-label="Mundur satu langkah">
              <IconBack size={18} />
            </button>
            <button type="button" className="rune-btn" onClick={reset} aria-label="Reset simulasi">
              <IconReset size={18} />
            </button>
            <span className="mx-1 h-5 w-px bg-gold/20" aria-hidden="true" />
            <span className={`inline-flex items-center gap-1 font-heading text-[8px] uppercase tracking-wider ${snapshot?.done ? 'text-[#a9c79b]' : 'text-parchment-300/60'}`}>
              {snapshot?.done ? (
                <>
                  <IconCheck size={12} /> {snapshot.stopReason === 'stagnasi' ? 'Stagnasi' : 'Batas iterasi'}
                </>
              ) : running ? 'Berjalan' : 'Siap'}
            </span>
            <span className="ml-auto font-mono text-[9px] text-parchment-300/55">
              {snapshot?.evaluations ?? 0} evaluasi
            </span>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat label="Best F" value={formatNumber(snapshot?.bestFitness ?? 0, 3)} tone="gold" />
            <Stat label="Worst F" value={formatNumber(snapshot?.worstFitness ?? 0, 3)} tone="wax" />
            <Stat label="Diterima" value={snapshot?.acceptedCount ?? 0} tone="forest" />
            <Stat label="Ditolak" value={snapshot?.rejectedCount ?? 0} tone="ember" />
          </div>

          <div className="mt-3 sim-panel p-2.5">
            <div className="flex items-center justify-between">
              <span className="label-cinzel !text-parchment-300">Populasi</span>
              <span className="value-mono !text-parchment-200/70">{popSize} kandidat · {landscape.name}</span>
            </div>
            <ConvergenceChart />
          </div>
        </div>

        <aside className="min-w-0 space-y-2.5">
          <div className="sim-panel p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="label-cinzel !text-parchment-300">Kandidat terpilih</span>
              {selectedIndex !== null && (
                <button
                  type="button"
                  onClick={() => select(null)}
                  className="font-heading text-[8px] uppercase tracking-wider text-parchment-300/60 hover:text-gold-light"
                >
                  lepas
                </button>
              )}
            </div>
            {selectedIndex !== null && snapshot ? (
              <div className="mt-2 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-heading text-sm font-semibold text-gold-light">
                    Kandidat #{selectedIndex + 1}
                  </span>
                  {snapshot.updates[selectedIndex]?.accepted !== undefined && (
                    <span
                      className={`inline-flex items-center gap-1 border px-1.5 py-0.5 font-heading text-[8px] uppercase tracking-wider ${
                        snapshot.updates[selectedIndex].accepted
                          ? 'border-[#6f8f63]/50 text-[#a9c79b]'
                          : 'border-wax/50 text-[#e79a8f]'
                      }`}
                    >
                      {snapshot.updates[selectedIndex].accepted ? <IconCheck size={10} /> : <IconCross size={10} />}
                      {snapshot.updates[selectedIndex].accepted ? 'diterima' : 'ditolak'}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <Stat label="X" value={`(${formatNumber(snapshot.positions[selectedIndex]?.[0] ?? 0, 2)}, ${formatNumber(snapshot.positions[selectedIndex]?.[1] ?? 0, 2)})`} />
                  <Stat label="F(X)" value={formatNumber(snapshot.fitness[selectedIndex] ?? 0, 3)} />
                  <Stat label="P_best" value={`(${formatNumber(snapshot.best[0], 2)}, ${formatNumber(snapshot.best[1], 2)})`} tone="gold" />
                  <Stat label="P_worst" value={`(${formatNumber(snapshot.worst[0], 2)}, ${formatNumber(snapshot.worst[1], 2)})`} tone="wax" />
                </div>
                {selectedUpdate ? (
                  <div className="border border-gold/20 bg-black/20 p-2">
                    <p className="font-heading text-[8px] uppercase tracking-[0.16em] text-parchment-300/60">
                      Perhitungan pembaruan (dimensi 1)
                    </p>
                    <div className="formula-panel mt-1 overflow-x-auto text-parchment-100">
                      <Tex display>
                        {`X'_{1} = ${formatNumber(selectedUpdate.from[0], 2)} + ${formatNumber(selectedUpdate.r1[0], 3)}\\left(${formatNumber(selectedUpdate.bestAt[0], 2)} - \\left|${formatNumber(selectedUpdate.from[0], 2)}\\right|\\right) - ${formatNumber(selectedUpdate.r2[0], 3)}\\left(${formatNumber(selectedUpdate.worstAt[0], 2)} - \\left|${formatNumber(selectedUpdate.from[0], 2)}\\right|\\right)`}
                      </Tex>
                      <p className="mt-1 font-mono text-[10px] text-gold-light/80">
                        X′ = ({formatNumber(selectedUpdate.proposed[0], 2)}, {formatNumber(selectedUpdate.proposed[1], 2)})
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="font-body text-[12px] italic text-parchment-300/55">
                    Jalankan fase Pembaruan untuk melihat r1, r2, dan X′ kandidat ini.
                  </p>
                )}
              </div>
            ) : (
              <p className="mt-2 font-body text-[12px] italic leading-snug text-parchment-300/60">
                Klik salah satu kandidat pada grafik untuk melihat perhitungannya.
              </p>
            )}
          </div>

          <div className="sim-panel space-y-2 p-3">
            <Lever label="Ukuran populasi" value={popSize} min={5} max={60} onChange={setPopSize} dark disabled={running} />
            <Lever label="Batas iterasi" value={maxIter} min={10} max={120} step={5} onChange={setMaxIter} dark disabled={running} />
            <SelectPlaque
              label="Fungsi uji"
              value={landscapeId}
              onChange={setLandscape}
              dark
              options={LANDSCAPES.map((item) => ({ value: item.id, label: `${item.name} · ${item.epithet}` }))}
            />
            <div className="grid grid-cols-[1fr_auto] items-end gap-2">
              <NumberField label="Seed" value={seed} min={0} max={9999999} onChange={setSeed} dark />
              <button type="button" className="btn-ritual !min-h-[44px] !px-3 !text-[9px]" onClick={newSeed} aria-label="Buat seed baru">
                Seed baru
              </button>
            </div>
            <div className="flex items-center justify-between gap-2 pt-1">
              <span className="label-cinzel !text-parchment-300">Kecepatan</span>
              <Segmented
                ariaLabel="Kecepatan simulasi"
                value={String(speed) as '0.25' | '0.5' | '1' | '2' | '4'}
                onChange={(value) => setSpeed(Number(value) as 0.25 | 0.5 | 1 | 2 | 4)}
                dark
                options={[
                  { value: '0.25', label: '¼×' },
                  { value: '0.5', label: '½×' },
                  { value: '1', label: '1×' },
                  { value: '2', label: '2×' },
                  { value: '4', label: '4×' },
                ]}
              />
            </div>
            <div className="grid gap-1 pt-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <ToggleWood label="Vektor" checked={showVectors} onChange={toggleVectors} dark />
              <ToggleWood label="Jejak" checked={showTrail} onChange={toggleTrail} dark />
              <ToggleWood label="Kontur" checked={showContour} onChange={toggleContour} dark />
              <ToggleWood label="Serentak" checked={simultaneous} onChange={toggleSimultaneous} dark description={reduce ? 'Gerak dikurangi' : undefined} />
            </div>
          </div>

          <div className="sim-panel p-3">
            <p className="font-heading text-[8px] uppercase tracking-[0.16em] text-parchment-300/60">
              Catatan akurasi
            </p>
            <p className="mt-1 font-body text-[11px] leading-snug text-parchment-300/70">
              Pada simulator, fitness didefinisikan sebagai nilai yang <em>diminimalkan</em>. Slide memakai F1 yang makin besar makin baik, sehingga arah optimasi F diseragamkan di sini.
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}

export function JayaDriver() {
  const running = useJayaStore((s) => s.running)
  const speed = useJayaStore((s) => s.speed)
  const simultaneous = useJayaStore((s) => s.simultaneous)

  useEffect(() => {
    if (!running) return
    const delay = (simultaneous ? 850 : 520) / speed
    const timer = window.setInterval(() => {
      const state = useJayaStore.getState()
      if (!state.snapshot || state.snapshot.done) {
        useJayaStore.setState({ running: false })
        return
      }
      if (state.simultaneous) state.stepIteration()
      else state.stepPhase()
    }, delay)
    return () => window.clearInterval(timer)
  }, [running, speed, simultaneous])

  return null
}

const EMPTY_HISTORY: NonNullable<JayaSnapshot['history']> = []

function ConvergenceChart() {
  const snapshot = useJayaStore((s) => s.snapshot)
  const history = snapshot?.history ?? EMPTY_HISTORY
  const iteration = snapshot?.iteration ?? 1
  const width = 420
  const height = 132
  const pad = 20

  if (history.length < 2) {
    return (
      <div className="mt-2 flex h-[110px] items-center justify-center border border-dashed border-gold/20 bg-black/10">
        <p className="font-body text-[11px] italic text-parchment-300/50">
          Grafik konvergensi muncul setelah iterasi pertama selesai.
        </p>
      </div>
    )
  }

  const values = history.flatMap((point) => [point.best, point.mean, point.worst])
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = Math.max(1e-6, max - min)
  const xFor = (i: number) => pad + (i / Math.max(1, history.length - 1)) * (width - pad * 2)
  const yFor = (value: number) => height - pad - ((value - min) / span) * (height - pad * 2)

  const line = (key: 'best' | 'mean' | 'worst') =>
    history.map((point, i) => `${i === 0 ? 'M' : 'L'}${xFor(i).toFixed(1)},${yFor(point[key]).toFixed(1)}`).join(' ')

  const currentX = xFor(Math.min(history.length - 1, Math.max(0, iteration - 1)))

  return (
    <div className="mt-1.5">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label="Grafik konvergensi JAYA: best, rata-rata, dan worst per iterasi">
        <rect x="0" y="0" width={width} height={height} fill="rgba(0,0,0,.12)" />
        {[0, 0.25, 0.5, 0.75, 1].map((fraction) => (
          <line
            key={fraction}
            x1={pad}
            x2={width - pad}
            y1={pad + fraction * (height - pad * 2)}
            y2={pad + fraction * (height - pad * 2)}
            stroke="rgba(227,182,79,.1)"
            strokeWidth="0.6"
          />
        ))}
        <path d={line('worst')} fill="none" stroke="rgba(122,30,30,.8)" strokeWidth="1.2" strokeDasharray="3 2" />
        <path d={line('mean')} fill="none" stroke="rgba(233,213,168,.55)" strokeWidth="1" />
        <path d={line('best')} fill="none" stroke="#e3b64f" strokeWidth="1.8" />
        <line x1={currentX} x2={currentX} y1={pad} y2={height - pad} stroke="rgba(227,182,79,.4)" strokeWidth="1" />
        <text x={pad} y={height - 5} fill="rgba(244,232,204,.45)" fontSize="8" fontFamily="JetBrains Mono, monospace">
          iter 1
        </text>
        <text x={width - pad} y={height - 5} textAnchor="end" fill="rgba(244,232,204,.45)" fontSize="8" fontFamily="JetBrains Mono, monospace">
          iter {history.length}
        </text>
        <text x={pad} y={12} fill="rgba(227,182,79,.8)" fontSize="8" fontFamily="Cinzel, serif">
          BEST {formatNumber(history[history.length - 1].best, 3)}
        </text>
      </svg>
      <div className="mt-0.5 flex gap-3 font-heading text-[7px] uppercase tracking-wider text-parchment-300/55">
        <span className="flex items-center gap-1"><span className="h-px w-4 bg-gold-light" /> best</span>
        <span className="flex items-center gap-1"><span className="h-px w-4 bg-parchment-300/60" /> rata-rata</span>
        <span className="flex items-center gap-1"><span className="h-px w-4 border-t border-dashed border-wax" /> worst</span>
      </div>
    </div>
  )
}