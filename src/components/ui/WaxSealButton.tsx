import { useRef, useState, type MouseEvent } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { CornerFrame } from '../ornaments/Ornaments'
import { ParchmentCard } from './ParchmentCard'

interface Ripple {
  id: number
  x: number
  y: number
}

export function WaxSealButton({
  label,
  sublabel,
  href = '#peta',
  onClick,
  tone = 'wax',
  dark = false,
  className = '',
  ariaLabel,
}: {
  label: string
  sublabel?: string
  href?: string
  onClick?: () => void
  tone?: 'wax' | 'gold'
  dark?: boolean
  className?: string
  ariaLabel?: string
}) {
  const [ripples, setRipples] = useState<Ripple[]>([])
  const counter = useRef(0)
  const reduce = useReducedMotion()

  const spawn = (event: MouseEvent<HTMLAnchorElement>) => {
    if (reduce) return
    const rect = event.currentTarget.getBoundingClientRect()
    const id = counter.current++
    setRipples((current) => [
      ...current.slice(-3),
      { id, x: event.clientX - rect.left, y: event.clientY - rect.top },
    ])
    window.setTimeout(() => {
      setRipples((current) => current.filter((item) => item.id !== id))
    }, 800)
  }

  return (
    <a
      href={href}
      onClick={(event) => {
        spawn(event)
        onClick?.()
      }}
      aria-label={ariaLabel ?? label}
      className={`group inline-flex min-h-[64px] items-center gap-4 rounded-sm px-2 py-2 transition-colors duration-300 focus-visible:outline-none ${className}`}
    >
      <span className="relative block h-[68px] w-[68px] shrink-0">
        <span
          className={`absolute inset-0 rounded-full transition-transform duration-500 ease-quill group-hover:scale-[1.04] ${
            tone === 'wax'
              ? 'bg-[radial-gradient(circle_at_34%_28%,#a83a32,#7a1e1e_42%,#521010_78%,#3a0909)]'
              : 'bg-[radial-gradient(circle_at_34%_28%,#f0d79a,#d0a33c_45%,#8a5a2b_78%,#4e3119)]'
          }`}
          style={{
            boxShadow:
              tone === 'wax'
                ? 'inset 0 2px 3px rgba(255,180,150,.28), inset 0 -4px 8px rgba(0,0,0,.55), 0 6px 14px -6px rgba(31,18,8,.8), 0 0 0 2px rgba(122,30,30,.18)'
                : 'inset 0 2px 3px rgba(255,250,220,.55), inset 0 -4px 8px rgba(53,33,15,.55), 0 6px 14px -6px rgba(31,18,8,.8)',
          }}
        />
        <span
          aria-hidden="true"
          className={`absolute inset-[9px] rounded-full border ${
            tone === 'wax' ? 'border-[#d98a7d]/35' : 'border-[#6b4423]/35'
          }`}
          style={{ boxShadow: 'inset 0 0 6px rgba(0,0,0,.35)' }}
        />
        <span className="absolute inset-0 flex items-center justify-center">
          <svg viewBox="0 0 40 40" className="h-9 w-9" aria-hidden="true">
            <path
              d="M20 6 L32 11 V21 C32 28.5 27 33.5 20 36 C13 33.5 8 28.5 8 21 V11Z"
              fill="none"
              stroke={tone === 'wax' ? '#f0d79a' : '#35210f'}
              strokeWidth="1.4"
              opacity=".9"
            />
            <path
              d="M14 25V15l6 7 6-7v10"
              fill="none"
              stroke={tone === 'wax' ? '#f7e5b8' : '#35210f'}
              strokeWidth="2.1"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="20" cy="19.5" r="1.2" fill={tone === 'wax' ? '#f7e5b8' : '#35210f'} />
          </svg>
        </span>
        {ripples.map((ripple) => (
          <motion.span
            key={ripple.id}
            aria-hidden="true"
            className="pointer-events-none absolute h-4 w-4 rounded-full border border-parchment-50/70"
            style={{ left: ripple.x - 8, top: ripple.y - 8 }}
            initial={{ scale: 0, opacity: 0.85 }}
            animate={{ scale: 8, opacity: 0 }}
            transition={{ duration: 0.75, ease: 'easeOut' }}
          />
        ))}
      </span>
      <span className="text-left">
        <span className="block font-heading text-[13px] font-semibold uppercase tracking-[0.26em] transition-colors">
          <span className={dark ? 'text-parchment-100 group-hover:text-gold-light' : 'text-leather-800 group-hover:text-leather-900'}>
            {label}
          </span>
        </span>
        {sublabel && (
          <span
            className={`mt-0.5 block font-body text-[14px] italic ${
              dark ? 'text-parchment-300/75' : 'text-leather-600'
            }`}
          >
            {sublabel}
          </span>
        )}
      </span>
      <span
        aria-hidden="true"
        className="ml-1 hidden h-px w-10 bg-gradient-to-r from-gold to-transparent transition-all duration-500 group-hover:w-16 sm:block"
      />
    </a>
  )
}

export function SealPanel({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <ParchmentCard className="relative p-6 sm:p-8">
      <CornerFrame />
      <div className="flex items-start gap-4">
        <div className="mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-gold/50 bg-wax/95 text-parchment-50 shadow-[inset_0_2px_3px_rgba(255,180,150,.25),inset_0_-3px_6px_rgba(0,0,0,.45)]">
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
            <path d="M12 4l7 2.5V13c0 4-3 6.5-7 8-4-1.5-7-4-7-8V6.5z" stroke="currentColor" strokeWidth="1.3" />
            <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="min-w-0">
          <h3 className="font-heading text-lg font-semibold text-leather-800">{title}</h3>
          <div className="mt-1 text-[16px] leading-relaxed text-ink/85">{children}</div>
        </div>
      </div>
    </ParchmentCard>
  )
}

export function EmptySeal() {
  return (
    <AnimatePresence>
      <span className="inline-block h-10 w-10 rounded-full bg-wax/90" />
    </AnimatePresence>
  )
}