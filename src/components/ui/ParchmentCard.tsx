import type { HTMLAttributes, ReactNode } from 'react'
import { CornerFrame } from '../ornaments/Ornaments'

type Tone = 'parchment' | 'dark' | 'plain'

const toneClass: Record<Tone, string> = {
  parchment: 'parchment-card',
  dark: 'leather-panel text-parchment-100',
  plain: 'border border-leather-700/25 bg-parchment-100/40',
}

export function ParchmentCard({
  children,
  className = '',
  tone = 'parchment',
  corners = true,
  ...rest
}: {
  children: ReactNode
  className?: string
  tone?: Tone
  corners?: boolean
} & HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`relative ${toneClass[tone]} ${className}`} {...rest}>
      {corners && <CornerFrame tone={tone === 'dark' ? 'light' : 'gold'} />}
      {children}
    </div>
  )
}