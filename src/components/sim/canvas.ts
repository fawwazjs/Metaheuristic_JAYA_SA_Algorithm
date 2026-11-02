import { useEffect, useRef, useState } from 'react'
import { heatColor, normalizeCost, type Landscape } from '../../lib/algorithms/landscapes'

export interface CanvasSize {
  width: number
  height: number
  dpr: number
}

type DrawFn = (ctx: CanvasRenderingContext2D, size: CanvasSize, time: number) => void

/**
 * Canvas dua dimensi dengan ResizeObserver, DPR ≤ 2, dan penghentian loop saat
 * elemen di luar viewport atau tab tidak terlihat.
 */
export function useCanvasLoop(draw: DrawFn, pauseWhenOffscreen = true) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawRef = useRef(draw)
  const [size, setSize] = useState<CanvasSize>({ width: 0, height: 0, dpr: 1 })
  drawRef.current = draw

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let raf = 0
    let visible = true
    let width = 0
    let height = 0
    let dpr = 1

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const nextDpr = Math.min(2, window.devicePixelRatio || 1)
      width = Math.max(1, Math.round(rect.width))
      height = Math.max(1, Math.round(rect.height))
      dpr = nextDpr
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      setSize({ width, height, dpr })
    }

    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(canvas)

    let intersection: IntersectionObserver | null = null
    if (pauseWhenOffscreen && typeof IntersectionObserver !== 'undefined') {
      intersection = new IntersectionObserver(
        (entries) => {
          visible = entries[0].isIntersecting
        },
        { rootMargin: '100px' },
      )
      intersection.observe(canvas)
    }

    const loop = (time: number) => {
      if ((!pauseWhenOffscreen || visible) && !document.hidden) {
        const ctx = canvas.getContext('2d')
        if (ctx && width > 0 && height > 0) {
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
          ctx.clearRect(0, 0, width, height)
          drawRef.current(ctx, { width, height, dpr }, time)
        }
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
      intersection?.disconnect()
    }
  }, [pauseWhenOffscreen])

  return { canvasRef, size }
}

/* ------------------------------------------------------------------ */
/* Heatmap cache                                                       */
/* ------------------------------------------------------------------ */

const HEAT_CACHE = new Map<string, HTMLCanvasElement>()
const HEAT_RES = 280

export function getHeatmap(landscape: Landscape, contours: boolean): HTMLCanvasElement {
  const key = `${landscape.id}-${contours ? 'c' : 'p'}`
  const cached = HEAT_CACHE.get(key)
  if (cached) return cached

  const canvas = document.createElement('canvas')
  canvas.width = HEAT_RES
  canvas.height = HEAT_RES
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas
  const image = ctx.createImageData(HEAT_RES, HEAT_RES)
  const data = image.data
  const [[x0, x1], [y0, y1]] = landscape.domain
  const bands: number[] = new Array(HEAT_RES * HEAT_RES)

  for (let py = 0; py < HEAT_RES; py++) {
    for (let px = 0; px < HEAT_RES; px++) {
      const x = x0 + (px / (HEAT_RES - 1)) * (x1 - x0)
      const y = y1 - (py / (HEAT_RES - 1)) * (y1 - y0)
      const cost = landscape.fn(x, y)
      const t = normalizeCost(cost, landscape.maxForColor)
      bands[py * HEAT_RES + px] = t
      const [r, g, b] = heatColor(t)
      // Sedikit variasi serat kertas deterministik.
      const grain = ((px * 13 + py * 7) % 11) / 11 - 0.5
      const index = (py * HEAT_RES + px) * 4
      data[index] = Math.max(0, Math.min(255, r + grain * 6))
      data[index + 1] = Math.max(0, Math.min(255, g + grain * 5))
      data[index + 2] = Math.max(0, Math.min(255, b + grain * 4))
      data[index + 3] = 255
    }
  }

  if (contours) {
    const levels = 18
    for (let py = 1; py < HEAT_RES - 1; py++) {
      for (let px = 1; px < HEAT_RES - 1; px++) {
        const i = py * HEAT_RES + px
        const band = Math.floor(bands[i] * levels)
        const left = Math.floor(bands[i - 1] * levels)
        const up = Math.floor(bands[i - HEAT_RES] * levels)
        if (band !== left || band !== up) {
          const index = i * 4
          data[index] = Math.round(data[index] * 0.58)
          data[index + 1] = Math.round(data[index + 1] * 0.55)
          data[index + 2] = Math.round(data[index + 2] * 0.52)
        }
      }
    }
  }

  ctx.putImageData(image, 0, 0)
  HEAT_CACHE.set(key, canvas)
  return canvas
}

/* ------------------------------------------------------------------ */
/* Coordinates                                                         */
/* ------------------------------------------------------------------ */

export interface MapRect {
  x: number
  y: number
  width: number
  height: number
  pad: number
}

export function getMapRect(size: CanvasSize, pad = 26): MapRect {
  return {
    x: pad,
    y: pad,
    width: Math.max(1, size.width - pad * 2),
    height: Math.max(1, size.height - pad * 2),
    pad,
  }
}

export function mapToCanvas(
  landscape: Landscape,
  x: number,
  y: number,
  size: CanvasSize,
  pad = 26,
): [number, number] {
  const rect = getMapRect(size, pad)
  const [[x0, x1], [y0, y1]] = landscape.domain
  const u = (x - x0) / (x1 - x0)
  const v = (y - y0) / (y1 - y0)
  return [rect.x + u * rect.width, rect.y + rect.height - v * rect.height]
}

export function canvasToMap(
  landscape: Landscape,
  px: number,
  py: number,
  size: CanvasSize,
  pad = 26,
): [number, number] {
  const rect = getMapRect(size, pad)
  const [[x0, x1], [y0, y1]] = landscape.domain
  const u = (px - rect.x) / rect.width
  const v = 1 - (py - rect.y) / rect.height
  return [x0 + u * (x1 - x0), y0 + v * (y1 - y0)]
}

/* ------------------------------------------------------------------ */
/* Painters                                                            */
/* ------------------------------------------------------------------ */

export function paintMap(
  ctx: CanvasRenderingContext2D,
  size: CanvasSize,
  landscape: Landscape,
  contours: boolean,
) {
  const rect = getMapRect(size)
  const heat = getHeatmap(landscape, contours)

  ctx.save()
  // Bingkai luar
  ctx.fillStyle = '#e9d5a8'
  ctx.fillRect(0, 0, size.width, size.height)
  const edge = ctx.createLinearGradient(0, 0, size.width, size.height)
  edge.addColorStop(0, 'rgba(31,18,8,.16)')
  edge.addColorStop(0.5, 'rgba(31,18,8,0)')
  edge.addColorStop(1, 'rgba(31,18,8,.22)')
  ctx.fillStyle = edge
  ctx.fillRect(0, 0, size.width, size.height)

  ctx.drawImage(heat, rect.x, rect.y, rect.width, rect.height)

  // Vignette tepi
  const vignette = ctx.createRadialGradient(
    size.width / 2,
    size.height / 2,
    Math.min(size.width, size.height) * 0.28,
    size.width / 2,
    size.height / 2,
    Math.max(size.width, size.height) * 0.72,
  )
  vignette.addColorStop(0, 'rgba(53,33,15,0)')
  vignette.addColorStop(1, 'rgba(53,33,15,.38)')
  ctx.fillStyle = vignette
  ctx.fillRect(rect.x, rect.y, rect.width, rect.height)

  // Grid koordinat
  ctx.strokeStyle = 'rgba(53,33,15,.14)'
  ctx.lineWidth = 0.6
  for (let i = 1; i < 4; i++) {
    const gx = rect.x + (rect.width * i) / 4
    const gy = rect.y + (rect.height * i) / 4
    ctx.beginPath()
    ctx.moveTo(gx, rect.y)
    ctx.lineTo(gx, rect.y + rect.height)
    ctx.moveTo(rect.x, gy)
    ctx.lineTo(rect.x + rect.width, gy)
    ctx.stroke()
  }

  // Bingkai emas–tinta
  ctx.strokeStyle = 'rgba(53,33,15,.7)'
  ctx.lineWidth = 1.4
  ctx.strokeRect(rect.x + 0.5, rect.y + 0.5, rect.width - 1, rect.height - 1)
  ctx.strokeStyle = 'rgba(184,134,43,.7)'
  ctx.lineWidth = 0.8
  ctx.strokeRect(rect.x - 4.5, rect.y - 4.5, rect.width + 9, rect.height + 9)

  // Sudut ornamen
  const corner = 12
  ctx.strokeStyle = 'rgba(184,134,43,.85)'
  ctx.lineWidth = 1
  const corners: Array<[number, number, number, number]> = [
    [rect.x - 4, rect.y - 4, 1, 1],
    [rect.x + rect.width + 4, rect.y - 4, -1, 1],
    [rect.x - 4, rect.y + rect.height + 4, 1, -1],
    [rect.x + rect.width + 4, rect.y + rect.height + 4, -1, -1],
  ]
  for (const [cx, cy, sx, sy] of corners) {
    ctx.beginPath()
    ctx.moveTo(cx, cy + sy * corner)
    ctx.lineTo(cx, cy)
    ctx.lineTo(cx + sx * corner, cy)
    ctx.stroke()
  }

  // Label domain
  const [[x0, x1], [y0, y1]] = landscape.domain
  ctx.fillStyle = 'rgba(53,33,15,.55)'
  ctx.font = '9px "JetBrains Mono", monospace'
  ctx.textAlign = 'left'
  ctx.fillText(`${x0}`, rect.x, rect.y + rect.height + 14)
  ctx.textAlign = 'right'
  ctx.fillText(`${x1}`, rect.x + rect.width, rect.y + rect.height + 14)
  ctx.textAlign = 'left'
  ctx.fillText(`${y1}`, rect.x - 6, rect.y + 4)
  ctx.fillText(`${y0}`, rect.x - 6, rect.y + rect.height + 4)

  // Nama lanskap
  ctx.textAlign = 'right'
  ctx.fillStyle = 'rgba(53,33,15,.42)'
  ctx.font = 'italic 10px "EB Garamond", Georgia, serif'
  ctx.fillText(landscape.name, rect.x + rect.width - 8, rect.y + 16)

  // Kompas kecil
  drawCompass(ctx, size.width - 40, size.height - 40, 15)
  ctx.restore()
}

function drawCompass(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.save()
  ctx.translate(x, y)
  ctx.strokeStyle = 'rgba(53,33,15,.42)'
  ctx.fillStyle = 'rgba(53,33,15,.42)'
  ctx.lineWidth = 0.7
  ctx.beginPath()
  ctx.arc(0, 0, r, 0, Math.PI * 2)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(0, -r * 0.9)
  ctx.lineTo(r * 0.24, r * 0.35)
  ctx.lineTo(0, r * 0.15)
  ctx.lineTo(-r * 0.24, r * 0.35)
  ctx.closePath()
  ctx.fill()
  ctx.font = '7px "Cinzel", serif'
  ctx.textAlign = 'center'
  ctx.fillText('U', 0, -r - 3)
  ctx.restore()
}

export function drawArrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  dashed = false,
  width = 1.4,
  head = 6,
) {
  const angle = Math.atan2(y2 - y1, x2 - x1)
  const length = Math.hypot(x2 - x1, y2 - y1)
  if (length < 2) return
  ctx.save()
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = width
  ctx.setLineDash(dashed ? [4, 3] : [])
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  ctx.stroke()
  ctx.setLineDash([])
  ctx.beginPath()
  ctx.moveTo(x2, y2)
  ctx.lineTo(x2 - head * Math.cos(angle - 0.4), y2 - head * Math.sin(angle - 0.4))
  ctx.lineTo(x2 - head * Math.cos(angle + 0.4), y2 - head * Math.sin(angle + 0.4))
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

export function drawGlow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string,
  alpha = 0.35,
) {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
  gradient.addColorStop(0, color)
  gradient.addColorStop(1, 'transparent')
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

export function drawCrown(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale = 1,
) {
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(scale, scale)
  ctx.fillStyle = '#e3b64f'
  ctx.strokeStyle = '#4e3119'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(-7, 3)
  ctx.lineTo(-7, -3)
  ctx.lineTo(-3.5, 0)
  ctx.lineTo(0, -5)
  ctx.lineTo(3.5, 0)
  ctx.lineTo(7, -3)
  ctx.lineTo(7, 3)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
  ctx.restore()
}

export function drawFlag(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color = '#e3b64f',
) {
  ctx.save()
  ctx.strokeStyle = '#4e3119'
  ctx.lineWidth = 1.2
  ctx.beginPath()
  ctx.moveTo(x, y + 10)
  ctx.lineTo(x, y - 12)
  ctx.stroke()
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(x, y - 12)
  ctx.lineTo(x + 12, y - 9)
  ctx.lineTo(x, y - 4)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

export function drawSkull(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale = 1,
) {
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(scale, scale)
  ctx.strokeStyle = '#3a0909'
  ctx.fillStyle = '#e9d5a8'
  ctx.lineWidth = 0.9
  ctx.beginPath()
  ctx.arc(0, -1, 4.6, Math.PI * 0.9, Math.PI * 0.1)
  ctx.lineTo(3, 4.4)
  ctx.lineTo(-3, 4.4)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = '#3a0909'
  ctx.beginPath()
  ctx.arc(-1.7, -1, 1, 0, Math.PI * 2)
  ctx.arc(1.7, -1, 1, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(0, 1.2)
  ctx.lineTo(1, 2.5)
  ctx.lineTo(-1, 2.5)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

export function drawPawn(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  fill: string,
  stroke = '#2a1b0e',
  highlight = 'rgba(251,244,228,.55)',
) {
  ctx.save()
  ctx.beginPath()
  ctx.arc(x, y - radius * 0.55, radius * 0.55, 0, Math.PI * 2)
  ctx.fillStyle = fill
  ctx.fill()
  ctx.strokeStyle = stroke
  ctx.lineWidth = 1.1
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(x - radius * 0.8, y + radius * 0.9)
  ctx.quadraticCurveTo(x, y - radius * 0.35, x + radius * 0.8, y + radius * 0.9)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(x - radius * 0.18, y - radius * 0.7, radius * 0.16, 0, Math.PI * 2)
  ctx.fillStyle = highlight
  ctx.fill()
  ctx.restore()
}

export function drawSpark(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  progress: number,
  color = '#e3b64f',
) {
  if (progress <= 0 || progress >= 1) return
  ctx.save()
  ctx.globalAlpha = 1 - progress
  ctx.strokeStyle = color
  ctx.lineWidth = 1
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2 + progress * 1.6
    const radius = 4 + progress * 16
    ctx.beginPath()
    ctx.moveTo(x + Math.cos(angle) * radius * 0.4, y + Math.sin(angle) * radius * 0.4)
    ctx.lineTo(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius)
    ctx.stroke()
  }
  ctx.restore()
}