import { useEffect, useState } from 'react'

/** Frame per detik pada kecepatan 1×. */
const BASE_FPS = 8

/**
 * Pemutar replay: indeks frame, status putar, dan kecepatan. Kembali ke frame 0
 * setiap kali `resetKey` berubah (misalnya skenario diganti).
 */
export function usePlayer(frameCount: number, resetKey: string) {
  const [frame, setFrame] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const last = Math.max(0, frameCount - 1)
  const current = Math.min(frame, last)

  useEffect(() => {
    setFrame(0)
    setPlaying(false)
  }, [resetKey])

  useEffect(() => {
    if (!playing) return
    const timer = window.setInterval(() => setFrame((value) => Math.min(last, value + 1)), 1000 / (BASE_FPS * speed))
    return () => window.clearInterval(timer)
  }, [playing, speed, last])

  // Berhenti sendiri di frame terakhir.
  useEffect(() => {
    if (playing && current >= last) setPlaying(false)
  }, [playing, current, last])

  const toggle = () => {
    if (!playing && current >= last) setFrame(0)
    setPlaying(!playing)
  }

  const seek = (value: number) => {
    setPlaying(false)
    setFrame(Math.max(0, Math.min(last, value)))
  }

  return { frame: current, last, playing, speed, setSpeed, toggle, seek, step: (delta: number) => seek(current + delta) }
}
