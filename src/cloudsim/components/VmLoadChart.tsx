import { memo, useMemo, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { clamp } from '../../lib/algorithms/rng'
import type { VmSpec } from '../data'
import { algorithmColor, axisNumber, datacenterLabel, groupVmsByDatacenter, niceTicks, percent, seconds } from '../replay'
import { Tooltip, TooltipRow, useElementWidth } from './chartKit'

interface Props {
  vms: VmSpec[]
  /** Waktu selesai tiap VM, diindeks dengan VmSpec.index. */
  finish: number[]
  algorithm: string
  /** Batas atas sumbu, dibuat tetap per skenario agar replay tidak "melompat". */
  yMax: number
}

const HEIGHT = 280
const AXIS = 52
const TOP = 26
const BOTTOM = 40

/**
 * Beban VM sebagai kolom: tinggi = waktu VM menyelesaikan semua cloudlet-nya.
 * Dua sayap (satu per datacenter), di dalamnya VM diurutkan dari paling lambat ke
 * paling cepat. Garis gelap mendatar = makespan (VM yang paling akhir selesai).
 */
export const VmLoadChart = memo(function VmLoadChart({ vms, finish, algorithm, yMax }: Props) {
  const [wrapperRef, width] = useElementWidth<HTMLDivElement>()
  const [active, setActive] = useState<number | null>(null)
  const groups = useMemo(() => groupVmsByDatacenter(vms), [vms])
  const ordered = useMemo(() => groups.flatMap((group) => group.vms), [groups])
  const vmByIndex = useMemo(() => new Map(vms.map((vm) => [vm.index, vm])), [vms])
  const ticks = useMemo(() => niceTicks(0, yMax, 4), [yMax])
  const color = algorithmColor(algorithm)
  const stacked = width < 640
  const top = ticks[ticks.length - 1]
  const makespan = Math.max(...finish)
  const panelWidth = stacked ? width : (width - 16) / groups.length
  const plotHeight = HEIGHT - TOP - BOTTOM
  const sy = (value: number) => TOP + (1 - value / top) * plotHeight

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    event.preventDefault()
    const position = active === null ? -1 : ordered.findIndex((vm) => vm.index === active)
    setActive(ordered[clamp(position + (event.key === 'ArrowRight' ? 1 : -1), 0, ordered.length - 1)].index)
  }

  const activeVm = active === null ? undefined : vmByIndex.get(active)
  let tooltipX = 0
  let tooltipY = 0

  const panels = groups.map((group, g) => {
    const offsetX = stacked ? 0 : g * (panelWidth + 16)
    const offsetY = stacked ? g * (HEIGHT + 12) : 0
    const left = g === 0 || stacked ? AXIS : 8
    const plotWidth = Math.max(10, panelWidth - left - 6)
    const slot = plotWidth / group.vms.length
    const barWidth = Math.min(24, Math.max(3, slot - 2))
    const typeRuns: { type: string; mips: number; start: number; end: number }[] = []
    group.vms.forEach((vm, i) => {
      const last = typeRuns[typeRuns.length - 1]
      if (last && last.type === vm.type) last.end = i
      else typeRuns.push({ type: vm.type, mips: vm.mips, start: i, end: i })
    })
    const slowest = Math.max(...group.vms.map((vm) => finish[vm.index]))

    const onPointerMove = (event: PointerEvent<SVGRectElement>) => {
      const svg = event.currentTarget.ownerSVGElement
      if (!svg) return
      const position = Math.floor((event.clientX - svg.getBoundingClientRect().left - offsetX - left) / slot)
      setActive(group.vms[clamp(position, 0, group.vms.length - 1)].index)
    }

    return (
      <g key={group.datacenter} transform={`translate(${offsetX} ${offsetY})`}>
        <text x={left} y={12} className="fill-leather-800 font-heading text-[11px] font-semibold uppercase tracking-[0.14em]">
          {datacenterLabel(group.datacenter)}
        </text>
        <text x={left + plotWidth} y={12} textAnchor="end" className="fill-leather-600 font-body text-[12px] italic">
          {group.vms.length} VM · paling akhir {seconds(slowest)}
        </text>
        {ticks.map((tick) => (
          <g key={tick}>
            <line x1={left} x2={left + plotWidth} y1={sy(tick)} y2={sy(tick)} stroke="var(--chart-grid)" strokeWidth="1" />
            {(g === 0 || stacked) && (
              <text x={left - 8} y={sy(tick)} dy="0.32em" textAnchor="end" className="fill-leather-600 font-mono text-[11px] tabular-nums">
                {axisNumber(tick)}
              </text>
            )}
          </g>
        ))}
        <line x1={left} x2={left + plotWidth} y1={TOP + plotHeight} y2={TOP + plotHeight} stroke="var(--chart-axis)" strokeWidth="1" />
        {group.vms.map((vm, i) => {
          const x = left + i * slot + (slot - barWidth) / 2
          const y = sy(finish[vm.index])
          const h = TOP + plotHeight - y
          const r = Math.min(4, barWidth / 2, h)
          const isActive = active === vm.index
          if (isActive) {
            tooltipX = offsetX + x + barWidth
            tooltipY = offsetY + Math.max(TOP, y - 10)
          }
          // Ujung data membulat 4px, sisi baseline tetap persegi.
          const d =
            h <= 0
              ? ''
              : `M${x} ${TOP + plotHeight}V${y + r}Q${x} ${y} ${x + r} ${y}H${x + barWidth - r}Q${x + barWidth} ${y} ${x + barWidth} ${y + r}V${TOP + plotHeight}Z`
          return <path key={vm.index} d={d} fill={color} opacity={active === null || isActive ? 1 : 0.55} />
        })}
        {typeRuns.map((run) => {
          const x = left + ((run.start + run.end + 1) / 2) * slot
          return (
            <g key={run.type} textAnchor="middle">
              <text x={x} y={TOP + plotHeight + 15} className="fill-leather-700 font-mono text-[10px]">
                {run.type}
              </text>
              <text x={x} y={TOP + plotHeight + 28} className="fill-leather-600 font-mono text-[9px]">
                {axisNumber(run.mips)}
              </text>
            </g>
          )
        })}
        <line x1={left} x2={left + plotWidth} y1={sy(makespan)} y2={sy(makespan)} stroke="var(--ink)" strokeWidth="1.5" />
        <rect
          x={left}
          y={TOP}
          width={plotWidth}
          height={plotHeight}
          fill="transparent"
          onPointerMove={onPointerMove}
          onPointerLeave={() => setActive(null)}
        />
      </g>
    )
  })

  return (
    <div
      ref={wrapperRef}
      className="relative outline-none focus-visible:ring-2 focus-visible:ring-gold"
      tabIndex={0}
      role="group"
      aria-roledescription="grafik"
      aria-label={`Waktu selesai setiap VM untuk ${algorithm}. Makespan ${seconds(makespan)}. Gunakan panah kiri dan kanan untuk membaca tiap VM.`}
      onKeyDown={onKeyDown}
      onBlur={() => setActive(null)}
    >
      {width > 0 && (
        <svg width={width} height={stacked ? groups.length * (HEIGHT + 12) - 12 : HEIGHT} className="block touch-pan-y select-none">
          {panels}
        </svg>
      )}
      {activeVm && (
        <Tooltip x={tooltipX} y={tooltipY} width={width} title={`VM ${activeVm.index} · ${datacenterLabel(activeVm.datacenter)}`}>
          <TooltipRow color={color} label="selesai" value={seconds(finish[activeVm.index])} />
          <p className="mt-1 text-leather-700">
            {activeVm.type}: {axisNumber(activeVm.mips)} MIPS, {activeVm.pes} core
          </p>
          <p className="text-leather-700">{percent(finish[activeVm.index] / makespan, 0)} dari makespan</p>
        </Tooltip>
      )}
    </div>
  )
})
