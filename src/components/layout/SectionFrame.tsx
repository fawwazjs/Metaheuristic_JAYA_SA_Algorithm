import type { ReactNode } from 'react'
import { Reveal } from '../ui/Reveal'
import { OrnamentDivider, OrnamentLabel, type DividerMotif } from '../ornaments/Ornaments'

export function SectionFrame({
  id,
  eyebrow,
  title,
  stylizedTitle,
  subtitle,
  quote,
  children,
  motif = 'fleur',
  tone = 'parchment',
  bleed = false,
  className = '',
  headingLevel = 2,
}: {
  id: string
  eyebrow?: string
  title: string
  stylizedTitle?: string
  subtitle?: string
  quote?: string
  children: ReactNode
  motif?: DividerMotif
  tone?: 'parchment' | 'dark'
  bleed?: boolean
  className?: string
  headingLevel?: 2 | 3
}) {
  const Heading = headingLevel === 2 ? 'h2' : 'h3'
  const isDark = tone === 'dark'

  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className={`relative scroll-mt-24 py-16 sm:py-20 lg:py-28 ${isDark ? 'stone-panel text-parchment-100' : ''} ${className}`}
    >
      {isDark && (
        <div className="pointer-events-none absolute inset-0 opacity-[0.35]">
          <div className="page-blotch absolute inset-0" />
        </div>
      )}
      <div className={`relative ${bleed ? '' : 'page-shell'}`}>
        <Reveal className="mx-auto mb-10 max-w-3xl text-center sm:mb-14">
          {eyebrow && (
            <div className={`mb-4 flex justify-center ${isDark ? '!text-parchment-300' : ''}`}>
              <OrnamentLabel>{eyebrow}</OrnamentLabel>
            </div>
          )}
          {stylizedTitle && (
            <p
              className={`mb-2 font-heading text-[10px] font-semibold uppercase tracking-[0.34em] ${
                isDark ? 'text-gold-light/80' : 'text-leather-600/80'
              }`}
            >
              {stylizedTitle}
            </p>
          )}
          <Heading
            id={`${id}-title`}
            className={`display-title text-balance text-[clamp(1.75rem,4.2vw,2.9rem)] leading-[1.15] ${
              isDark ? 'text-parchment-50' : 'text-leather-800'
            }`}
          >
            {title}
          </Heading>
          {subtitle && (
            <p
              className={`mx-auto mt-4 max-w-2xl text-[clamp(1rem,1.5vw,1.15rem)] leading-relaxed ${
                isDark ? 'text-parchment-200/85' : 'text-ink/80'
              }`}
            >
              {subtitle}
            </p>
          )}
          {quote && (
            <p
              className={`mx-auto mt-4 max-w-xl font-body text-[15px] italic ${
                isDark ? 'text-gold-light/75' : 'text-leather-600'
              }`}
            >
              “{quote}”
            </p>
          )}
          <div className={`mt-7 ${isDark ? 'text-gold/70' : ''}`}>
            <OrnamentDivider motif={motif} tone={isDark ? 'gold' : 'gold'} />
          </div>
        </Reveal>
        {children}
      </div>
    </section>
  )
}

export function SubHeading({
  numeral,
  title,
  caption,
  tone = 'forest',
}: {
  numeral?: string
  title: string
  caption?: string
  tone?: 'forest' | 'ember' | 'plain'
}) {
  const accent =
    tone === 'forest' ? 'text-forest' : tone === 'ember' ? 'text-ember' : 'text-leather-600'
  return (
    <Reveal className="mb-6 flex items-end justify-between gap-4 border-b border-leather-700/20 pb-3">
      <div className="min-w-0">
        <h3 className="flex items-baseline gap-3 font-heading text-[clamp(1.15rem,2.2vw,1.5rem)] font-semibold leading-tight text-leather-800">
          {numeral && (
            <span className={`font-display text-[0.8em] tracking-widest ${accent}`} aria-hidden="true">
              {numeral}
            </span>
          )}
          <span>{title}</span>
        </h3>
        {caption && <p className="mt-1 max-w-xl font-body text-[15px] italic text-leather-600/85">{caption}</p>}
      </div>
      <svg viewBox="0 0 60 14" className={`hidden h-3 w-14 shrink-0 sm:block ${accent}`} fill="none" aria-hidden="true">
        <path d="M0 7h44M44 7l-6-4M44 7l-6 4" stroke="currentColor" strokeWidth="1" />
        <circle cx="52" cy="7" r="2.4" stroke="currentColor" strokeWidth="1" />
      </svg>
    </Reveal>
  )
}