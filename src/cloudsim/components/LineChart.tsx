import { memo, useMemo, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { clamp, formatNumber } from '../../lib/algorithms/rng'
import { axisNumber, nearestIndex, niceTicks, seconds, stepIndex } from '../replay'
import { chartFont, textWidth, Tooltip, TooltipRow, useElementWidth, useFontsReady } from './chartKit'

export interface LineSeries {
  id: string
  label: string
  color: string
  x: number[]
  y: number[]
  /** Kurva berundak: nilai bertahan sampai titik berikutnya (best-so-far SA). */
  step?: boolean
}

export interface LineBand {
  id: string
  label: string
  color: string
  x: number[]
  lo: number[]
  hi: number[]
}

export interface ReferenceLine {
  id: string
  label: string
  color: string
  y: number
}

interface Props {
  series: LineSeries[]
  bands?: LineBand[]
  references?: ReferenceLine[]
  ariaLabel: string
  xLabel: string
  yLabel: string
  /** Nilai x yang ditandai garis kursor (posisi replay atau skenario terpilih). */
  cursorX?: number | null
  cursorLabel?: string
  xTicks?: number[]
  yFromZero?: boolean
  height?: number
}

const MARGIN = { top: 14, bottom: 42, left: 58 }
const END_LABEL_FONT = chartFont(12)
/** Ruang di kanan sumbu untuk kunci garis sebelum teks label ujung. */
const END_LABEL_OFFSET = 26
/** Nilai ikut ditulis di label ujung selama area plot masih selebar ini dari total lebar. */
const MIN_PLOT_SHARE = 0.6
const NO_BANDS: LineBand[] = []
const NO_REFERENCES: ReferenceLine[] = []
const formatX = (value: number) => formatNumber(value, 0)
const formatY = seconds

function labelSpace(texts: string[]): number {
  return Math.ceil(END_LABEL_OFFSET + Math.max(0, ...texts.map((text) => textWidth(text, END_LABEL_FONT))) + 6)
}

function valueAt(series: LineSeries, x: number): number {
  const index = series.step ? stepIndex(series.x, x) : nearestIndex(series.x, x)
  return series.y[index]
}

export const LineChart = memo(function LineChart({
  series,
  bands = NO_BANDS,
  references = NO_REFERENCES,
  ariaLabel,
  xLabel,
  yLabel,
  cursorX = null,
  cursorLabel,
  xTicks,
  yFromZero = false,
  height = 300,
}: Props) {
  const [wrapperRef, width] = useElementWidth<HTMLDivElement>()
  const [hover, setHover] = useState<number | null>(null)
  const fontsReady = useFontsReady()
  // Label ujung: nama + nilai akhir selama plot masih cukup lebar; jika tidak, cukup nama
  // (nilainya tetap ada di tooltip dan tabel).
  const { endTexts, right } = useMemo(() => {
    const ends = [
      ...series.map((s) => ({ id: s.id, label: s.label, value: s.y[s.y.length - 1] })),
      ...references.map((r) => ({ id: r.id, label: r.label, value: r.y })),
    ]
    const withValues = ends.map((end) => [end.id, `${end.label} ${formatY(end.value)}`] as const)
    const valueSpace = labelSpace(withValues.map(([, text]) => text))
    const fits = width - MARGIN.left - valueSpace >= width * MIN_PLOT_SHARE
    const chosen = fits ? withValues : ends.map((end) => [end.id, end.label] as const)
    return { endTexts: new Map(chosen), right: fits ? valueSpace : labelSpace(chosen.map(([, text]) => text)) }
    // fontsReady: ukur ulang setelah EB Garamond termuat.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [series, references, width, fontsReady])

  const layout = useMemo(() => {
    const allX = series.flatMap((s) => s.x)
    const allY = [
      ...series.flatMap((s) => s.y),
      ...bands.flatMap((b) => [...b.lo, ...b.hi]),
      ...references.map((r) => r.y),
    ]
    const xMin = Math.min(...allX)
    const xMax = Math.max(...allX)
    const yLow = yFromZero ? 0 : Math.min(...allY)
    const yTicks = niceTicks(yFromZero ? 0 : yLow - (Math.max(...allY) - yLow) * 0.05, Math.max(...allY), 5)
    const plotWidth = Math.max(10, width - MARGIN.left - right)
    const plotHeight = height - MARGIN.top - MARGIN.bottom
    const yMin = yTicks[0]
    const yMax = yTicks[yTicks.length - 1]
    const sx = (v: number) => MARGIN.left + ((v - xMin) / (xMax - xMin || 1)) * plotWidth
    const sy = (v: number) => MARGIN.top + (1 - (v - yMin) / (yMax - yMin || 1)) * plotHeight
    const round = (v: number) => Math.round(v * 10) / 10

    const paths = series.map((s) => {
      let d = ''
      s.x.forEach((xv, i) => {
        const px = round(sx(xv))
        const py = round(sy(s.y[i]))
        if (i === 0) d = `M${px} ${py}`
        else d += s.step ? `H${px}V${py}` : `L${px} ${py}`
      })
      return d
    })

    const bandPaths = bands.map((b) => {
      const upper = b.x.map((xv, i) => `${i === 0 ? 'M' : 'L'}${round(sx(xv))} ${round(sy(b.hi[i]))}`).join('')
      const lower = b.x
        .map((xv, i) => [xv, b.lo[i]] as const)
        .reverse()
        .map(([xv, yv]) => `L${round(sx(xv))} ${round(sy(yv))}`)
        .join('')
      return `${upper}${lower}Z`
    })

    // Label ujung: diurutkan menurut posisi y lalu diberi jarak minimum; leader line
    // menghubungkan label yang tergeser ke ujung garisnya.
    const ends = [
      ...series.map((s) => ({ id: s.id, label: s.label, color: s.color, value: s.y[s.y.length - 1] })),
      ...references.map((r) => ({ id: r.id, label: r.label, color: r.color, value: r.y })),
    ]
      .map((end) => ({ ...end, anchorY: sy(end.value), labelY: sy(end.value) }))
      .sort((a, b) => a.anchorY - b.anchorY)
    const gap = 15
    for (let i = 1; i < ends.length; i++) {
      ends[i].labelY = Math.max(ends[i].labelY, ends[i - 1].labelY + gap)
    }
    const overflow = ends.length ? ends[ends.length - 1].labelY - (MARGIN.top + plotHeight) : 0
    if (overflow > 0) {
      for (const end of ends) end.labelY -= overflow
      for (let i = ends.length - 2; i >= 0; i--) {
        ends[i].labelY = Math.min(ends[i].labelY, ends[i + 1].labelY - gap)
      }
    }

    return { xMin, xMax, sx, sy, yTicks, plotWidth, plotHeight, paths, bandPaths, ends }
  }, [series, bands, references, width, height, right, yFromZero])

  const ticksX = xTicks ?? niceTicks(layout.xMin, layout.xMax, width < 520 ? 3 : 6).filter((t) => t <= layout.xMax)
  const domainX = series[0]?.x ?? []

  const pointerToX = (event: PointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const fraction = (event.clientX - rect.left - MARGIN.left) / layout.plotWidth
    if (fraction < -0.02 || fraction > 1.02) return null
    const raw = layout.xMin + Math.min(1, Math.max(0, fraction)) * (layout.xMax - layout.xMin)
    return domainX[nearestIndex(domainX, raw)]
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    event.preventDefault()
    const current = hover === null ? domainX.length - 1 : nearestIndex(domainX, hover)
    const next = clamp(current + (event.key === 'ArrowRight' ? 1 : -1), 0, domainX.length - 1)
    setHover(domainX[next])
  }

  const hoverPx = hover === null ? null : layout.sx(hover)

  return (
    <div
      ref={wrapperRef}
      className="relative outline-none focus-visible:ring-2 focus-visible:ring-gold"
      tabIndex={0}
      role="group"
      aria-roledescription="grafik"
      aria-label={`${ariaLabel}. Gunakan panah kiri dan kanan untuk membaca nilai.`}
      onKeyDown={onKeyDown}
      onFocus={() => setHover((value) => value ?? domainX[domainX.length - 1] ?? null)}
      onBlur={() => setHover(null)}
    >
      {width > 0 && (
        <svg
          width={width}
          height={height}
          className="block touch-pan-y select-none"
          onPointerMove={(event) => setHover(pointerToX(event))}
          onPointerLeave={() => setHover(null)}
        >
          {layout.yTicks.map((tick) => (
            <g key={tick}>
              <line
                x1={MARGIN.left}
                x2={MARGIN.left + layout.plotWidth}
                y1={layout.sy(tick)}
                y2={layout.sy(tick)}
                stroke="var(--chart-grid)"
                strokeWidth="1"
              />
              <text x={MARGIN.left - 8} y={layout.sy(tick)} dy="0.32em" textAnchor="end" className="fill-leather-600 font-mono text-[11px] tabular-nums">
                {axisNumber(tick)}
              </text>
            </g>
          ))}
          <line
            x1={MARGIN.left}
            x2={MARGIN.left + layout.plotWidth}
            y1={MARGIN.top + layout.plotHeight}
            y2={MARGIN.top + layout.plotHeight}
            stroke="var(--chart-axis)"
            strokeWidth="1"
          />
          {ticksX.map((tick) => (
            <text
              key={tick}
              x={layout.sx(tick)}
              y={MARGIN.top + layout.plotHeight + 16}
              textAnchor="middle"
              className="fill-leather-600 font-mono text-[11px] tabular-nums"
            >
              {formatX(tick)}
            </text>
          ))}
          <text x={MARGIN.left + layout.plotWidth / 2} y={height - 4} textAnchor="middle" className="fill-leather-700 font-body text-[12px] italic">
            {xLabel}
          </text>
          <text
            transform={`translate(13 ${MARGIN.top + layout.plotHeight / 2}) rotate(-90)`}
            textAnchor="middle"
            className="fill-leather-700 font-body text-[12px] italic"
          >
            {yLabel}
          </text>

          {bands.map((band, i) => (
            <path key={band.id} d={layout.bandPaths[i]} fill={band.color} opacity="0.12" />
          ))}
          {references.map((reference) => (
            <line
              key={reference.id}
              x1={MARGIN.left}
              x2={MARGIN.left + layout.plotWidth}
              y1={layout.sy(reference.y)}
              y2={layout.sy(reference.y)}
              stroke={reference.color}
              strokeWidth="1.5"
            />
          ))}
          {series.map((s, i) => (
            <path key={s.id} d={layout.paths[i]} fill="none" stroke={s.color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
          ))}

          {layout.ends.map((end) => {
            const x0 = MARGIN.left + layout.plotWidth
            const moved = Math.abs(end.labelY - end.anchorY) > 2
            return (
              <g key={end.id}>
                {moved && <line x1={x0 + 2} y1={end.anchorY} x2={x0 + 9} y2={end.labelY} stroke="var(--chart-axis)" strokeWidth="1" />}
                <line x1={x0 + 10} x2={x0 + 20} y1={end.labelY} y2={end.labelY} stroke={end.color} strokeWidth="2" />
                <text x={x0 + END_LABEL_OFFSET} y={end.labelY} dy="0.32em" className="fill-leather-800 font-body text-[12px]">
                  {endTexts.get(end.id)}
                </text>
              </g>
            )
          })}

          {cursorX !== null && (
            <g>
              <line
                x1={layout.sx(cursorX)}
                x2={layout.sx(cursorX)}
                y1={MARGIN.top}
                y2={MARGIN.top + layout.plotHeight}
                stroke="var(--ink)"
                strokeWidth="1.5"
              />
              {cursorLabel && (
                <text
                  x={Math.min(layout.sx(cursorX) + 5, MARGIN.left + layout.plotWidth - 4)}
                  y={MARGIN.top + 10}
                  textAnchor={layout.sx(cursorX) + 5 > MARGIN.left + layout.plotWidth - 60 ? 'end' : 'start'}
                  className="fill-ink font-heading text-[10px] font-semibold uppercase tracking-[0.12em]"
                >
                  {cursorLabel}
                </text>
              )}
            </g>
          )}

          {hoverPx !== null && hover !== null && (
            <g pointerEvents="none">
              <line x1={hoverPx} x2={hoverPx} y1={MARGIN.top} y2={MARGIN.top + layout.plotHeight} stroke="var(--chart-axis)" strokeWidth="1" />
              {series.map((s) => (
                <circle
                  key={s.id}
                  cx={hoverPx}
                  cy={layout.sy(valueAt(s, hover))}
                  r="4.5"
                  fill={s.color}
                  stroke="var(--chart-surface)"
                  strokeWidth="2"
                />
              ))}
            </g>
          )}
        </svg>
      )}

      {hover !== null && hoverPx !== null && (
        <Tooltip x={hoverPx} y={MARGIN.top} width={width} title={`${xLabel}: ${formatX(hover)}`}>
          {series.map((s) => (
            <TooltipRow key={s.id} color={s.color} label={s.label} value={formatY(valueAt(s, hover))} />
          ))}
          {bands.map((band) => {
            const index = nearestIndex(band.x, hover)
            return (
              <TooltipRow
                key={band.id}
                color={band.color}
                label={band.label}
                value={`${formatY(band.lo[index])} – ${formatY(band.hi[index])}`}
              />
            )
          })}
          {references.map((reference) => (
            <TooltipRow key={reference.id} color={reference.color} label={reference.label} value={formatY(reference.y)} />
          ))}
        </Tooltip>
      )}
    </div>
  )
})
