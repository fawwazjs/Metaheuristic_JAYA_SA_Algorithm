import type { ReactNode, SVGProps } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

type IconProps = SVGProps<SVGSVGElement> & { size?: number }

function iconProps({ size = 24, ...rest }: IconProps) {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    ...rest,
  }
}

export function IconCompass(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <path d="M12 3.5v2M12 18.5v2M3.5 12h2M18.5 12h2" />
      <path d="M15.8 8.2l-2.1 5.5-5.5 2.1 2.1-5.5z" />
    </svg>
  )
}

export function IconCrowd(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <circle cx="8" cy="8" r="2.2" />
      <circle cx="16" cy="8" r="2.2" />
      <path d="M4 19c0-2.5 1.8-4.2 4-4.2s4 1.7 4 4.2M12 19c0-2.5 1.8-4.2 4-4.2s4 1.7 4 4.2" />
      <path d="M12 4.2c1 0 1.8.8 1.8 1.8M12 4.2c-1 0-1.8.8-1.8 1.8" opacity=".7" />
    </svg>
  )
}

export function IconBolt(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <path d="M13.5 3L6 13.5h4.5L10 21l7.5-10.5H13z" />
      <path d="M4 7.5l1.5 1M20 16.5L18.5 16" opacity=".6" />
    </svg>
  )
}

export function IconScroll(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <path d="M7 4h11.5a2 2 0 0 1 2 2v1.5H9.5A2.5 2.5 0 0 0 7 10z" />
      <path d="M7 4a2.5 2.5 0 0 0-2.5 2.5V17A2 2 0 0 0 6.5 19H18" />
      <path d="M18.5 19a2 2 0 0 0 2-2v-2.5H9.5" />
      <path d="M10 9.5h7M10 12.5h5" opacity=".65" />
    </svg>
  )
}

export function IconPoint(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <circle cx="12" cy="12" r="2.4" fill="currentColor" stroke="none" />
      <ellipse cx="12" cy="12" rx="8.5" ry="4.5" transform="rotate(-28 12 12)" opacity=".65" />
      <circle cx="19" cy="7" r="1.1" fill="currentColor" stroke="none" />
      <path d="M3 20l3-3" opacity=".6" />
    </svg>
  )
}

export function IconScales(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <path d="M12 4v15M8 19.5h8M6 6.5h12" />
      <path d="M6 6.5l-2.5 5a3 3 0 0 0 5 0zM18 6.5l-2.5 5a3 3 0 0 0 5 0z" />
      <circle cx="12" cy="4" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function IconSnow(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <path d="M12 2.5v19M3.8 7.2l16.4 9.6M20.2 7.2L3.8 16.8" />
      <path d="M9.5 4.2L12 6l2.5-1.8M9.5 19.8L12 18l2.5 1.8M5.3 9.2L8 9.5l.8-2.6M18.7 14.8L16 14.5l-.8 2.6M18.7 9.2L16 9.5l-.8-2.6M5.3 14.8L8 14.5l.8 2.6" />
    </svg>
  )
}

export function IconFeather(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <path d="M19.5 4.5c-4 0-8 1.5-10.5 4s-3.5 6.5-3.5 10c3.5 0 7.5-1 10-3.5s4-6.5 4-10.5z" />
      <path d="M5.5 18.5L15 9M8 15.5h4M11 12.5h4" opacity=".7" />
    </svg>
  )
}

export function IconPlay(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <path d="M8 5.5l10 6.5-10 6.5z" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function IconPause(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <rect x="7" y="5.5" width="3.4" height="13" rx="1" fill="currentColor" stroke="none" />
      <rect x="13.6" y="5.5" width="3.4" height="13" rx="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function IconStep(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <path d="M6 5.5l8.5 6.5L6 18.5z" fill="currentColor" stroke="none" />
      <path d="M17.5 5.5v13" />
    </svg>
  )
}

export function IconBack(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <path d="M18 5.5L9.5 12l8.5 6.5z" fill="currentColor" stroke="none" />
      <path d="M6.5 5.5v13" />
    </svg>
  )
}

export function IconReset(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <path d="M4.5 9.5A8 8 0 1 1 4 14" />
      <path d="M4 4.5v5h5" />
    </svg>
  )
}

export function IconChevron(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <path d="M9 5l7 7-7 7" />
    </svg>
  )
}

export function IconCheck(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <path d="M5 12.5l4.5 4.5L19.5 6.5" />
    </svg>
  )
}

export function IconCross(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  )
}

export function IconDice(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="2.5" />
      <circle cx="8.5" cy="8.5" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="8.5" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="8.5" cy="15.5" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="15.5" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function IconAnvil(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <path d="M3 9.5h11l3.5-3h1.5c.5 2.2 2 3.2 3.5 3.4-1 2.2-3 3.1-5 3.1H9.5l-1.5 3H3l1-3H3z" />
      <path d="M8 18.5h8M10 15.5l-1 3M15 15.5l1 3" />
    </svg>
  )
}

export function IconFlame(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <path d="M12 3.5c.4 3-2.2 4-2.2 6.2 0 1.2.7 2 1.7 2.3-1.6-3.8 2.2-4.5 2.7-7.3 2 2.2 3.8 4.4 3.8 7.4a6 6 0 0 1-12 0c0-2.4 1.2-4.2 2.4-5.6.4 1.4 1.1 2.2 2 2.6C9.7 6.5 11.2 5.2 12 3.5z" />
    </svg>
  )
}

export function IconCrown(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <path d="M4 17.5h16M4.5 7l3.6 4L12 5l3.9 6L19.5 7l-1.3 8.5H5.8z" />
      <circle cx="12" cy="18.6" r=".9" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function IconShield(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <path d="M12 3l7.5 2.7v5.8c0 4.3-3 7.6-7.5 9.5-4.5-1.9-7.5-5.2-7.5-9.5V5.7z" />
      <path d="M12 7.5l1.6 3.2 3.4.4-2.5 2.4.7 3.4L12 15.2l-3.2 1.7.7-3.4L7 11.1l3.4-.4z" opacity=".7" />
    </svg>
  )
}

export function IconSkull(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <path d="M12 3.5c-4.4 0-7.5 3-7.5 7 0 2.6 1.2 4.4 3 5.5v3.5h9V16c1.8-1.1 3-2.9 3-5.5 0-4-3.1-7-7.5-7z" />
      <circle cx="9" cy="10.5" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="15" cy="10.5" r="1.4" fill="currentColor" stroke="none" />
      <path d="M10.5 19.5v-2M13.5 19.5v-2M12 14l.9 1.4h-1.8z" />
    </svg>
  )
}

export function IconCandle(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <path d="M12 2.5c1.4 1.6 2 2.6 2 3.6a2 2 0 0 1-4 0c0-1 .6-2 2-3.6z" />
      <path d="M9.5 9.5h5V20h-5z" />
      <path d="M9.5 11.5h5M8 20h8" />
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/* Crest / heraldic shields                                            */
/* ------------------------------------------------------------------ */

interface CrestProps {
  className?: string
  title?: string
}

export function CrestJaya({ className, title = 'Ikon JAYA: populasi kandidat solusi' }: CrestProps) {
  return (
    <svg viewBox="0 0 120 144" className={className} role="img" aria-label={title}>
      <defs>
        <linearGradient id="jayaShield" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#557a4d" />
          <stop offset="0.55" stopColor="#3f5b3a" />
          <stop offset="1" stopColor="#263a23" />
        </linearGradient>
        <linearGradient id="jayaGold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f0d79a" />
          <stop offset="0.5" stopColor="#e3b64f" />
          <stop offset="1" stopColor="#b8862b" />
        </linearGradient>
      </defs>
      <path
        d="M60 4 L108 20 V66 C108 102 88 126 60 140 C32 126 12 102 12 66 V20 Z"
        fill="url(#jayaShield)"
        stroke="url(#jayaGold)"
        strokeWidth="3"
      />
      <path
        d="M60 12 L100 25 V66 C100 98 83 119 60 131 C37 119 20 98 20 66 V25 Z"
        fill="none"
        stroke="#e3b64f"
        strokeWidth="1"
        opacity="0.55"
      />
      {/* crown */}
      <path
        d="M38 49 L47 38 L56 47 L60 34 L64 47 L73 38 L82 49 L79 62 H41 Z"
        fill="url(#jayaGold)"
        stroke="#6b4423"
        strokeWidth="1.2"
      />
      <circle cx="60" cy="69" r="3" fill="#e3b64f" />
      <circle cx="46" cy="44" r="1.7" fill="#fbf4e4" />
      <circle cx="60" cy="39" r="1.7" fill="#fbf4e4" />
      <circle cx="74" cy="44" r="1.7" fill="#fbf4e4" />
      {/* wings */}
      <path d="M28 76 C38 72 43 76 44 84 C38 81 33 84 30 91 C27 86 26 81 28 76Z" fill="#e3b64f" opacity=".9" />
      <path d="M92 76 C82 72 77 76 76 84 C82 81 87 84 90 91 C93 86 94 81 92 76Z" fill="#e3b64f" opacity=".9" />
      {/* rising star + banner */}
      <path d="M60 82 l4 8 9 1 -6.5 6.2 1.5 9 -8-4.3 -8 4.3 1.5-9L47 91l9-1z" fill="none" stroke="#f0d79a" strokeWidth="1.4" />
      <path d="M40 112 H80 L76 118 L60 122 L44 118 Z" fill="#e3b64f" opacity=".85" />
      <path d="M48 120 l-3 12 5-3 4 5 2-9" fill="none" stroke="#e3b64f" strokeWidth="1.4" />
      <path d="M72 120 l3 12 -5-3 -4 5 -2-9" fill="none" stroke="#e3b64f" strokeWidth="1.4" />
    </svg>
  )
}

export function CrestSa({ className, title = 'Ikon SA: proses pendinginan logam' }: CrestProps) {
  return (
    <svg viewBox="0 0 120 144" className={className} role="img" aria-label={title}>
      <defs>
        <linearGradient id="saShield" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8a3a24" />
          <stop offset="0.55" stopColor="#5e2a1d" />
          <stop offset="1" stopColor="#2f1a12" />
        </linearGradient>
        <linearGradient id="saGold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f0d79a" />
          <stop offset="0.5" stopColor="#e3b64f" />
          <stop offset="1" stopColor="#b8862b" />
        </linearGradient>
        <radialGradient id="saGlow">
          <stop offset="0" stopColor="#ffd27a" stopOpacity=".9" />
          <stop offset="1" stopColor="#c8561e" stopOpacity="0" />
        </radialGradient>
      </defs>
      <path
        d="M60 4 L108 20 V66 C108 102 88 126 60 140 C32 126 12 102 12 66 V20 Z"
        fill="url(#saShield)"
        stroke="url(#saGold)"
        strokeWidth="3"
      />
      <path
        d="M60 12 L100 25 V66 C100 98 83 119 60 131 C37 119 20 98 20 66 V25 Z"
        fill="none"
        stroke="#e3b64f"
        strokeWidth="1"
        opacity="0.5"
      />
      <circle cx="60" cy="68" r="34" fill="url(#saGlow)" />
      {/* flame */}
      <path
        d="M60 34 C64 44 71 47 70 57 C69 65 64 69 60 74 C56 69 51 65 50 57 C49 47 56 44 60 34Z"
        fill="#e3b64f"
        stroke="#8a5a2b"
        strokeWidth="1"
      />
      <path d="M60 48 C62 54 66 55 65 61 C64 66 62 68 60 71 C58 68 56 66 55 61 C54 55 58 54 60 48Z" fill="#fbf4e4" />
      {/* anvil */}
      <path
        d="M28 86 H76 L82 80 H90 C91 86 95 89 99 90 C95 95 89 97 82 97 H52 L48 104 H28 L32 97 H28Z"
        fill="#8a9199"
        stroke="#2a1b0e"
        strokeWidth="1.3"
      />
      <path d="M44 97 L40 112 H72 L76 97" fill="#5e6a73" stroke="#2a1b0e" strokeWidth="1.2" />
      <path d="M36 114 H78" stroke="#e3b64f" strokeWidth="2" />
      {/* hammer */}
      <g transform="rotate(-18 86 72)">
        <rect x="82" y="60" width="22" height="7" rx="1.5" fill="#e3b64f" stroke="#4e3119" strokeWidth="1" />
        <rect x="90" y="66" width="4" height="22" rx="1.5" fill="#8a5a2b" stroke="#4e3119" strokeWidth="1" />
      </g>
      {/* sparks */}
      <circle cx="42" cy="78" r="1.4" fill="#f0d79a" />
      <circle cx="72" cy="80" r="1" fill="#f0d79a" />
      <circle cx="34" cy="70" r=".9" fill="#f0d79a" />
    </svg>
  )
}

export function CrestMonogram({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="monoGold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f0d79a" />
          <stop offset="1" stopColor="#b8862b" />
        </linearGradient>
      </defs>
      <path d="M32 3 L57 12 V32 C57 46 46 57 32 62 C18 57 7 46 7 32 V12Z" fill="#35210f" stroke="url(#monoGold)" strokeWidth="2" />
      <path d="M21 45 V20 L32 37 L43 20 V45" fill="none" stroke="url(#monoGold)" strokeWidth="3.4" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx="32" cy="27" r="2" fill="#e3b64f" />
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/* Corner flourishes & dividers                                        */
/* ------------------------------------------------------------------ */

export function CornerFlourish({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" aria-hidden="true">
      <path d="M2 46V14C2 7 7 2 14 2h32" stroke="currentColor" strokeWidth="1.2" />
      <path d="M7 46V16C7 11 11 7 16 7h30" stroke="currentColor" strokeWidth=".7" opacity=".7" />
      <path d="M14 26c-4-1-5-5-2-7 2.5-1.7 5 .4 4.6 3-.3 2-2.3 3-4.2 2.4M26 14c-1-4 2-6 4.6-4.4 2.2 1.4 1.6 4.5-.6 5.2-1.7.6-3.2-.3-3.9-1.7" stroke="currentColor" strokeWidth="1" />
      <circle cx="14" cy="14" r="1.4" fill="currentColor" />
      <path d="M18 38c6-1 10-5 11-11" stroke="currentColor" strokeWidth=".8" opacity=".55" />
    </svg>
  )
}

export function CornerFrame({ tone = 'gold' }: { tone?: 'gold' | 'light' }) {
  const color = tone === 'gold' ? 'text-gold/45' : 'text-parchment-200/40'
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      <CornerFlourish className={`ornament-corner left-1.5 top-1.5 ${color}`} />
      <CornerFlourish className={`ornament-corner right-1.5 top-1.5 rotate-90 ${color}`} />
      <CornerFlourish className={`ornament-corner bottom-1.5 right-1.5 rotate-180 ${color}`} />
      <CornerFlourish className={`ornament-corner bottom-1.5 left-1.5 -rotate-90 ${color}`} />
    </div>
  )
}

export function FleurDeLis({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 40" className={className} fill="none" aria-hidden="true">
      <path d="M16 3c2.8 3.4 2.8 7 .5 10.2h-1C13.2 10 13.2 6.4 16 3Z" fill="currentColor" opacity=".9" />
      <path d="M16 13.5c2.2 0 3.2 1.6 2.6 3.3-.4 1.2-1.4 2-2.6 2.6-1.2-.6-2.2-1.4-2.6-2.6-.6-1.7.4-3.3 2.6-3.3Z" fill="currentColor" opacity=".75" />
      <path d="M12 18c-3.7-.6-6.4-3-6-6.3.5-3.7 4.8-4.6 6.7-1.6 1.5 2.4.7 5.5-.7 7.9M20 18c3.7-.6 6.4-3 6-6.3-.5-3.7-4.8-4.6-6.7-1.6-1.5 2.4-.7 5.5.7 7.9" stroke="currentColor" strokeWidth="1.1" />
      <path d="M16 20v9M11.5 29h9M9 35c3-2.4 5-2.6 7-1 2-1.6 4-1.4 7 1" stroke="currentColor" strokeWidth="1.1" />
    </svg>
  )
}

export function CrownMotif({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 30" className={className} fill="none" aria-hidden="true">
      <path d="M5 22h30M6 9l6.5 6L20 6l7.5 9L34 9l-2 10H8Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <circle cx="6" cy="8" r="1.2" fill="currentColor" />
      <circle cx="20" cy="5" r="1.2" fill="currentColor" />
      <circle cx="34" cy="8" r="1.2" fill="currentColor" />
    </svg>
  )
}

export function SwordMotif({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 44 44" className={className} fill="none" aria-hidden="true">
      <path d="M22 4l2.4 6.5v17h-4.8v-17z" stroke="currentColor" strokeWidth="1.1" />
      <path d="M13 29h18M22 29v10M18.5 39h7" stroke="currentColor" strokeWidth="1.1" />
      <path d="M9 12l8 8M35 12l-8 8" stroke="currentColor" strokeWidth=".9" opacity=".6" />
    </svg>
  )
}

export function StarMotif({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} fill="none" aria-hidden="true">
      <path d="M20 4l4 12 12 4-12 4-4 12-4-12-12-4 12-4z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />
      <circle cx="20" cy="20" r="2.4" fill="currentColor" />
    </svg>
  )
}

export type DividerMotif = 'fleur' | 'crown' | 'sword' | 'star' | 'anvil'

export function OrnamentDivider({
  motif = 'fleur',
  tone = 'gold',
  className = '',
  animate = true,
}: {
  motif?: DividerMotif
  tone?: 'gold' | 'ink' | 'light'
  className?: string
  animate?: boolean
}) {
  const reduce = useReducedMotion()
  const color = tone === 'gold' ? 'text-gold' : tone === 'light' ? 'text-parchment-300' : 'text-leather-700'
  const line = (
    <svg viewBox="0 0 600 28" className="h-7 w-full" fill="none" aria-hidden="true" preserveAspectRatio="none">
      <path d="M0 14h252" stroke="currentColor" strokeWidth="1" opacity=".55" />
      <path d="M348 14h252" stroke="currentColor" strokeWidth="1" opacity=".55" />
      <path d="M256 14c8 0 10-6 18-6M344 14c-8 0-10-6-18-6" stroke="currentColor" strokeWidth="1" opacity=".7" />
      <path d="M256 14c8 0 10 6 18 6M344 14c-8 0-10 6-18 6" stroke="currentColor" strokeWidth="1" opacity=".55" />
      <circle cx="300" cy="14" r="2" fill="currentColor" />
    </svg>
  )
  return (
    <div className={`relative flex items-center justify-center ${color} ${className}`} aria-hidden="true">
      <motion.div
        className="w-full"
        initial={animate && !reduce ? { scaleX: 0.6, opacity: 0 } : false}
        whileInView={animate && !reduce ? { scaleX: 1, opacity: 1 } : undefined}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.9, ease: [0.22, 0.8, 0.3, 1] }}
      >
        {line}
      </motion.div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-current/30 bg-parchment-100 shadow-[inset_0_1px_0_rgba(255,255,255,.6)]">
          {motif === 'fleur' && <FleurDeLis className="h-6 w-6" />}
          {motif === 'crown' && <CrownMotif className="h-6 w-6" />}
          {motif === 'sword' && <SwordMotif className="h-6 w-6" />}
          {motif === 'star' && <StarMotif className="h-6 w-6" />}
          {motif === 'anvil' && <IconAnvil size={20} />}
        </div>
      </div>
    </div>
  )
}

export function Torch({ className = '', flip = false }: { className?: string; flip?: boolean }) {
  return (
    <div className={`pointer-events-none ${className}`} aria-hidden="true">
      <div className={`relative flex flex-col items-center ${flip ? '-scale-x-100' : ''}`}>
        <div className="relative mb-[-6px] h-16 w-10">
          <div className="absolute inset-x-0 bottom-0 mx-auto h-8 w-8 rounded-full bg-ember/30 blur-xl" />
          <div className="absolute bottom-0 left-1/2 h-12 w-7 -translate-x-1/2 animate-flicker rounded-[50%_50%_45%_45%] bg-gradient-to-t from-ember via-gold-light to-[#fff3c4] shadow-[0_0_24px_6px_rgba(200,86,30,.55)] [transform-origin:50%_100%]" />
          <div className="absolute bottom-0 left-1/2 h-8 w-3.5 -translate-x-1/2 animate-flicker rounded-[50%_50%_40%_40%] bg-gradient-to-t from-[#e3b64f] to-[#fffbe8] [animation-delay:.4s] [transform-origin:50%_100%]" />
        </div>
        <div className="h-3 w-7 rounded-t-sm bg-gradient-to-b from-[#4e3119] to-[#35210f] shadow-inner" />
        <div className="h-24 w-2.5 bg-gradient-to-b from-[#5b3a1c] via-[#3d2612] to-[#23150a] shadow-[inset_1px_0_0_rgba(227,182,79,.18)]" />
      </div>
    </div>
  )
}

export function EmberParticles({ count = 22 }: { count?: number }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => {
        const left = (index * 37.7) % 100
        const delay = (index % 9) * 1.1
        const duration = 6 + (index % 5) * 1.7
        const size = 1.5 + (index % 4) * 0.8
        return (
          <span
            key={index}
            className="absolute bottom-0 rounded-full bg-gold-light/80"
            style={{
              left: `${left}%`,
              width: size,
              height: size,
              animation: `ember-rise ${duration}s linear ${delay}s infinite`,
              boxShadow: '0 0 6px 1px rgba(227,182,79,.45)',
            }}
          />
        )
      })}
    </div>
  )
}

export function OrnamentLabel({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 font-heading text-[10px] font-semibold uppercase tracking-[0.24em] text-leather-600">
      <svg viewBox="0 0 24 8" className="h-2 w-6 text-gold" fill="none" aria-hidden="true">
        <path d="M0 4h20M20 4l-4-3M20 4l-4 3" stroke="currentColor" strokeWidth="1" />
      </svg>
      {children}
    </span>
  )
}