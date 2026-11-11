import { memo, useMemo, useState } from 'react'
import { formatNumber } from '../../lib/algorithms/rng'
import type { AlgorithmResult } from '../data'
import { algorithmColor, axisNumber, niceTicks, seconds } from '../replay'
import { chartFont, textWidth, Tooltip, TooltipRow, useElementWidth, useFontsReady } from './chartKit'

const ROW = 40
const BAR = 18
const TOP = 6
const AXIS = 26
const NAME_FONT = chartFont(13)

/**
 * Makespan rata-rata per algoritma, dari tercepat ke terlambat. Garis tipis di atas
 * batang = rentang terbaik–terburuk dari semua seed (hanya untuk JAYA dan SA).
 */
export const RankedBars = memo(function RankedBars({ results }: { results: AlgorithmResult[] }) {
  const [wrapperRef, width] = useElementWidth<HTMLDivElement>()
  const [active, setActive] = useState<string | null>(null)
  const fontsReady = useFontsReady()
  const ranked = useMemo(() => [...results].sort((a, b) => a.makespan.mean - b.makespan.mean), [results])
  // Kolom nama selebar nama algoritma terpanjang (diukur ulang setelah font termuat).
  const labelWidth = useMemo(
    () => Math.ceil(Math.max(...ranked.map((r) => textWidth(r.algorithm, NAME_FONT))) + 20),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ranked, fontsReady],
  )
  const ticks = useMemo(() => niceTicks(0, Math.max(...ranked.map((r) => r.makespan.max)), width < 520 ? 3 : 5), [ranked, width])
  const top = ticks[ticks.length - 1]
  const valueSpace = width < 520 ? 74 : 96
  const plotWidth = Math.max(10, width - labelWidth - valueSpace)
  const sx = (value: number) => labelWidth + (value / top) * plotWidth
  const height = TOP + ranked.length * ROW + AXIS
  const activeIndex = ranked.findIndex((r) => r.algorithm === active)
  const activeResult = activeIndex >= 0 ? ranked[activeIndex] : undefined

  return (
    <div ref={wrapperRef} className="relative">
      {width > 0 && (
        <svg width={width} height={height} className="block select-none" aria-hidden="true">
          {ticks.map((tick) => (
            <g key={tick}>
              <line x1={sx(tick)} x2={sx(tick)} y1={TOP} y2={TOP + ranked.length * ROW} stroke="var(--chart-grid)" strokeWidth="1" />
              <text x={sx(tick)} y={height - 8} textAnchor="middle" className="fill-leather-600 font-mono text-[11px] tabular-nums">
                {axisNumber(tick)}
              </text>
            </g>
          ))}
          <line x1={labelWidth} x2={labelWidth} y1={TOP} y2={TOP + ranked.length * ROW} stroke="var(--chart-axis)" strokeWidth="1" />
          {ranked.map((result, i) => {
            const y = TOP + i * ROW + (ROW - BAR) / 2
            const end = sx(result.makespan.mean)
            const r = Math.min(4, end - labelWidth)
            const color = algorithmColor(result.algorithm)
            const spread = result.runs > 1 && result.makespan.max > result.makespan.min
            return (
              <g key={result.algorithm} opacity={active === null || active === result.algorithm ? 1 : 0.55}>
                <text x={labelWidth - 10} y={y + BAR / 2} dy="0.32em" textAnchor="end" className="fill-leather-800 font-body text-[13px]">
                  {result.algorithm}
                </text>
                <path
                  d={`M${labelWidth} ${y}H${end - r}Q${end} ${y} ${end} ${y + r}V${y + BAR - r}Q${end} ${y + BAR} ${end - r} ${y + BAR}H${labelWidth}Z`}
                  fill={color}
                />
                {spread && (
                  <g stroke="var(--leather-800)" strokeWidth="1">
                    <line x1={sx(result.makespan.min)} x2={sx(result.makespan.max)} y1={y - 4} y2={y - 4} />
                    <line x1={sx(result.makespan.min)} x2={sx(result.makespan.min)} y1={y - 7} y2={y - 1} />
                    <line x1={sx(result.makespan.max)} x2={sx(result.makespan.max)} y1={y - 7} y2={y - 1} />
                  </g>
                )}
                <text
                  x={Math.max(end, spread ? sx(result.makespan.max) : end) + 8}
                  y={y + BAR / 2}
                  dy="0.32em"
                  className="fill-leather-900 font-mono text-[12px] font-semibold tabular-nums"
                >
                  {seconds(result.makespan.mean)}
                </text>
              </g>
            )
          })}
        </svg>
      )}
      <ul className="absolute inset-0" style={{ top: TOP, height: ranked.length * ROW }}>
        {ranked.map((result) => (
          <li key={result.algorithm} style={{ height: ROW }}>
            <button
              type="button"
              className="h-full w-full outline-none focus-visible:ring-2 focus-visible:ring-gold"
              aria-label={`${result.algorithm}: makespan rata-rata ${seconds(result.makespan.mean)}${
                result.runs > 1 ? `, terbaik ${seconds(result.makespan.min)}, terburuk ${seconds(result.makespan.max)}, ${result.runs} run` : ''
              }`}
              onPointerEnter={() => setActive(result.algorithm)}
              onPointerLeave={() => setActive(null)}
              onFocus={() => setActive(result.algorithm)}
              onBlur={() => setActive(null)}
            />
          </li>
        ))}
      </ul>
      {activeResult && (
        <Tooltip
          x={sx(activeResult.makespan.mean)}
          y={TOP + activeIndex * ROW + ROW}
          width={width}
          title={`${activeResult.algorithm} · ${activeResult.runs} run`}
        >
          <TooltipRow color={algorithmColor(activeResult.algorithm)} label="rata-rata" value={seconds(activeResult.makespan.mean)} />
          {activeResult.runs > 1 && (
            <>
              <p className="text-leather-700">± {formatNumber(activeResult.makespan.std, 1)} s (simpangan baku)</p>
              <p className="text-leather-700">
                terbaik {seconds(activeResult.makespan.min)}, terburuk {seconds(activeResult.makespan.max)}
              </p>
            </>
          )}
          <p className="text-leather-700">CloudSim: {seconds(activeResult.makespanCloudSim.mean)}</p>
        </Tooltip>
      )}
    </div>
  )
})
