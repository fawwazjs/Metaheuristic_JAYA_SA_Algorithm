import type { ReactNode } from 'react'
import { motion, useReducedMotion, type Variants } from 'framer-motion'

export const quillEase = [0.22, 0.8, 0.3, 1] as const

export function Reveal({
  children,
  delay = 0,
  y = 18,
  className = '',
  once = true,
  as = 'div',
}: {
  children: ReactNode
  delay?: number
  y?: number
  className?: string
  once?: boolean
  as?: 'div' | 'section' | 'li' | 'article'
}) {
  const reduce = useReducedMotion()
  const MotionTag = motion[as]
  if (reduce) {
    const Tag = as
    return <Tag className={className}>{children}</Tag>
  }
  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: '-70px' }}
      transition={{ duration: 0.62, delay, ease: quillEase }}
    >
      {children}
    </MotionTag>
  )
}

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
}

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: quillEase } },
}

export function InkRipple({ x, y }: { x: number; y: number }) {
  return (
    <motion.span
      aria-hidden="true"
      className="pointer-events-none absolute h-3 w-3 rounded-full border border-gold-light/70"
      style={{ left: x, top: y }}
      initial={{ scale: 0, opacity: 0.8 }}
      animate={{ scale: 14, opacity: 0 }}
      transition={{ duration: 0.75, ease: 'easeOut' }}
    />
  )
}