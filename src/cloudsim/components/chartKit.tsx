import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'

/** Lebar elemen yang mengikuti perubahan ukuran (grafik SVG responsif). */
export function useElementWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [width, setWidth] = useState(0)

  useLayoutEffect(() => {
    const element = ref.current
    if (!element) return
    setWidth(Math.round(element.getBoundingClientRect().width))
    const observer = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)))
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return [ref, width] as const
}

/** true setelah web font halaman selesai dimuat, supaya ukuran teks diukur dengan font yang benar. */
export function useFontsReady(): boolean {
  const [ready, setReady] = useState(() => document.fonts?.status === 'loaded')

  useEffect(() => {
    if (ready || !document.fonts) return
    let alive = true
    document.fonts.ready.then(() => alive && setReady(true))
    return () => {
      alive = false
    }
  }, [ready])

  return ready
}

/** Font label grafik (EB Garamond, sama dengan kelas font-body). */
export const chartFont = (px: number) => `${px}px "EB Garamond", Georgia, serif`

let measureContext: CanvasRenderingContext2D | null | undefined

/** Lebar teks dalam piksel untuk font tertentu; perkiraan kasar bila canvas tidak tersedia. */
export function textWidth(text: string, font: string): number {
  if (measureContext === undefined) measureContext = document.createElement('canvas').getContext('2d')
  if (!measureContext) return text.length * 6.5
  measureContext.font = font
  return measureContext.measureText(text).width
}

export type LegendKey = 'line' | 'band' | 'rule'

export function Legend({ items }: { items: { label: string; color: string; key: LegendKey }[] }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1.5 font-body text-[13px] text-leather-700">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-1.5">
          <svg width="18" height="10" aria-hidden="true" className="shrink-0">
            {item.key === 'line' && <line x1="1" y1="5" x2="17" y2="5" stroke={item.color} strokeWidth="2" strokeLinecap="round" />}
            {item.key === 'rule' && <line x1="1" y1="5" x2="17" y2="5" stroke={item.color} strokeWidth="1.25" />}
            {item.key === 'band' && <rect x="1" y="1" width="16" height="8" rx="1" fill={item.color} opacity="0.18" />}
          </svg>
          {item.label}
        </li>
      ))}
    </ul>
  )
}

/** Tooltip HTML di dalam wrapper relatif, dijaga agar tidak keluar tepi. */
export function Tooltip({
  x,
  y,
  width,
  title,
  children,
}: {
  x: number
  y: number
  width: number
  title: string
  children: ReactNode
}) {
  const tooltipWidth = 214
  const left = Math.max(4, Math.min(x + 14, width - tooltipWidth - 4))
  return (
    <div
      role="status"
      className="pointer-events-none absolute z-10 border border-leather-700/30 bg-parchment-50 px-3 py-2 font-body text-[13px] text-ink shadow-card"
      style={{ left, top: Math.max(0, y), width: tooltipWidth }}
    >
      <p className="mb-1 font-heading text-[10px] font-semibold uppercase tracking-[0.14em] text-leather-600">{title}</p>
      {children}
    </div>
  )
}

/** Satu baris tooltip: nilai di depan (tebal), nama seri di belakang, kunci garis berwarna. */
export function TooltipRow({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2 leading-snug">
      <svg width="12" height="8" aria-hidden="true" className="shrink-0 self-center">
        <line x1="0" y1="4" x2="12" y2="4" stroke={color} strokeWidth="2" />
      </svg>
      <span className="font-mono text-[12px] font-semibold tabular-nums text-leather-900">{value}</span>
      <span className="truncate text-leather-600">{label}</span>
    </div>
  )
}

/**
 * Bingkai grafik: judul berupa pertanyaan yang dijawab grafik, keterangan,
 * legenda, permukaan grafik, dan tabel sebagai pengganti hover/warna.
 */
export function ChartFrame({
  title,
  caption,
  legend,
  children,
  table,
  controls,
}: {
  title: string
  caption?: ReactNode
  legend?: ReactNode
  children: ReactNode
  table?: ReactNode
  controls?: ReactNode
}) {
  return (
    <figure className="chart-surface p-4 sm:p-5">
      <figcaption className="mb-3">
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
          <h4 className="font-heading text-[15px] font-semibold leading-snug text-leather-800 sm:text-base">{title}</h4>
          {controls}
        </div>
        {caption && <div className="mt-1 max-w-3xl font-body text-[14px] leading-relaxed text-leather-700/90">{caption}</div>}
        {legend && <div className="mt-3">{legend}</div>}
      </figcaption>
      {children}
      {table && (
        <details className="group mt-3 border-t border-leather-700/15 pt-2">
          <summary className="cursor-pointer select-none font-heading text-[10px] font-semibold uppercase tracking-[0.18em] text-leather-600 hover:text-leather-800">
            Lihat sebagai tabel
          </summary>
          <div className="mt-2 overflow-x-auto">{table}</div>
        </details>
      )}
    </figure>
  )
}
