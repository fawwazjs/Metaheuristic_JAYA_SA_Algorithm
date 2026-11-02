import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Tex } from '../math/Tex'
import { CornerFrame, IconAnvil, IconCrown, IconCheck, IconSkull, IconShield, OrnamentDivider } from '../ornaments/Ornaments'
import { Reveal, staggerContainer, staggerItem } from '../ui/Reveal'

/* ------------------------------------------------------------------ */
/* Definisi                                                            */
/* ------------------------------------------------------------------ */

export function DefinisiBlock({
  kicker,
  title,
  text,
  highlights,
  crest,
}: {
  kicker: string
  title: string
  text: string
  highlights: readonly string[]
  crest: React.ReactNode
}) {
  const parts = text.split(new RegExp(`(${highlights.map((h) => h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'g'))

  return (
    <div className="grid gap-4 md:grid-cols-[auto_minmax(0,1fr)] md:items-start">
      <div className="mx-auto flex w-24 flex-col items-center md:mx-0 md:w-28">
        {crest}
      </div>
      <div className="parchment-card relative p-5 sm:p-6">
        <CornerFrame />
        <p className="eyebrow">{kicker}</p>
        <h3 className="mt-1 font-heading text-xl font-semibold text-leather-800 sm:text-2xl">{title}</h3>
        <p className="drop-cap mt-3 text-[17px] leading-[1.75] text-ink/90 sm:text-[18px]">
          {parts.map((part, index) =>
            highlights.includes(part) ? (
              <mark
                key={index}
                className="bg-gold/20 px-0.5 font-semibold text-leather-900 [box-decoration-break:clone]"
              >
                {part}
              </mark>
            ) : (
              <span key={index}>{part}</span>
            ),
          )}
        </p>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Kartu karakteristik                                               */
/* ------------------------------------------------------------------ */

const ICON_MAP = {
  compass: <IconCompassish />,
  crowd: <IconCrowdish />,
  bolt: <IconBoltish />,
  scroll: <IconScrollish />,
  point: <IconPointish />,
  scales: <IconScalesish />,
  snow: <IconSnowish />,
  feather: <IconFeatherish />,
}

export function TraitCards({
  cards,
  tone,
}: {
  cards: ReadonlyArray<{ title: string; description: string; icon: string }>
  tone: 'forest' | 'ember'
}) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      variants={staggerContainer}
      initial={reduce ? 'visible' : 'hidden'}
      whileInView="visible"
      viewport={{ once: true, margin: '-60px' }}
      className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
    >
      {cards.map((card) => (
        <motion.div
          key={card.title}
          variants={staggerItem}
          className={`parchment-card hover-lift group relative overflow-hidden p-4 ${
            tone === 'forest' ? 'hover:shadow-[0_0_24px_-6px_rgba(63,91,58,.45)]' : 'hover:shadow-[0_0_24px_-6px_rgba(200,86,30,.4)]'
          }`}
          style={reduce ? undefined : { transformStyle: 'preserve-3d' }}
        >
          <div
            aria-hidden="true"
            className={`absolute inset-x-0 top-0 h-0.5 ${tone === 'forest' ? 'bg-forest/60' : 'bg-ember/60'}`}
          />
          <div className="absolute right-2 top-2 font-display text-[10px] text-gold/40">✦</div>
          <div
            className={`mb-3 inline-flex h-11 w-11 items-center justify-center rounded-full border ${
              tone === 'forest' ? 'border-forest/35 bg-forest/10 text-forest' : 'border-ember/35 bg-ember/10 text-ember'
            }`}
          >
            {ICON_MAP[card.icon as keyof typeof ICON_MAP] ?? ICON_MAP.compass}
          </div>
          <h4 className="font-heading text-[13px] font-semibold leading-snug text-leather-800">{card.title}</h4>
          <p className="mt-1 font-body text-[13px] leading-snug text-leather-700/85">{card.description}</p>
          <div aria-hidden="true" className="mt-3 h-px w-full bg-gradient-to-r from-gold/40 via-gold/15 to-transparent" />
        </motion.div>
      ))}
    </motion.div>
  )
}

/* Ikon inline sederhana agar tidak menambah impor melingkar */
function IconCompassish() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M15.8 8.2l-2.1 5.5-5.5 2.1 2.1-5.5z" />
    </svg>
  )
}
function IconCrowdish() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      <circle cx="8" cy="8" r="2.2" />
      <circle cx="16" cy="8" r="2.2" />
      <path d="M4 19c0-2.5 1.8-4.2 4-4.2s4 1.7 4 4.2M12 19c0-2.5 1.8-4.2 4-4.2s4 1.7 4 4.2" />
    </svg>
  )
}
function IconBoltish() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" aria-hidden="true">
      <path d="M13.5 3L6 13.5h4.5L10 21l7.5-10.5H13z" />
    </svg>
  )
}
function IconScrollish() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      <path d="M7 4h11.5a2 2 0 0 1 2 2v1.5H9.5A2.5 2.5 0 0 0 7 10z" />
      <path d="M7 4a2.5 2.5 0 0 0-2.5 2.5V17A2 2 0 0 0 6.5 19H18" />
      <path d="M18.5 19a2 2 0 0 0 2-2v-2.5H9.5" />
    </svg>
  )
}
function IconPointish() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <ellipse cx="12" cy="12" rx="8.5" ry="4.5" transform="rotate(-28 12 12)" opacity=".7" />
      <circle cx="12" cy="12" r="2.4" fill="currentColor" stroke="none" />
      <circle cx="19" cy="7" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  )
}
function IconScalesish() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      <path d="M12 4v15M8 19.5h8M6 6.5h12" />
      <path d="M6 6.5l-2.5 5a3 3 0 0 0 5 0zM18 6.5l-2.5 5a3 3 0 0 0 5 0z" />
    </svg>
  )
}
function IconSnowish() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" aria-hidden="true">
      <path d="M12 2.5v19M3.8 7.2l16.4 9.6M20.2 7.2L3.8 16.8" />
      <path d="M9.5 4.2L12 6l2.5-1.8M9.5 19.8L12 18l2.5 1.8" />
    </svg>
  )
}
function IconFeatherish() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      <path d="M19.5 4.5c-4 0-8 1.5-10.5 4s-3.5 6.5-3.5 10c3.5 0 7.5-1 10-3.5s4-6.5 4-10.5z" />
      <path d="M5.5 18.5L15 9" />
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/* Filosofi                                                            */
/* ------------------------------------------------------------------ */

export function PhilosophyBlock({
  items,
}: {
  items: ReadonlyArray<{ title: string; text: string; icon: string }>
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((item, index) => (
        <Reveal key={item.title} delay={index * 0.08}>
          <div className="parchment-card h-full p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gold/40 bg-gold/10">
                {item.icon === 'approach' ? (
                  <svg viewBox="0 0 24 24" className="h-5 w-5 text-forest" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                    <path d="M4 18L18 6" strokeDasharray="3 2" />
                    <path d="M13 6h5v5" />
                    <circle cx="4" cy="18" r="1.6" fill="currentColor" />
                    <circle cx="19" cy="5" r="2.2" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="h-5 w-5 text-wax" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                    <path d="M20 18L6 6" strokeDasharray="3 2" />
                    <path d="M11 6H6v5" />
                    <circle cx="20" cy="18" r="1.6" fill="currentColor" />
                    <circle cx="4" cy="4" r="2.2" />
                  </svg>
                )}
              </div>
              <div>
                <h4 className="font-heading text-[14px] font-semibold text-leather-800">{item.title}</h4>
                <p className="mt-1 font-body text-[13px] leading-snug text-leather-700/85">{item.text}</p>
              </div>
            </div>
          </div>
        </Reveal>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Keunggulan & Kelemahan                                                */
/* ------------------------------------------------------------------ */

export function ProsCons({
  pros,
  cons,
}: {
  pros: ReadonlyArray<{ title: string; detail: string }>
  cons: ReadonlyArray<{ title: string; detail: string }>
}) {
  const [openPro, setOpenPro] = useState<number | null>(0)
  const [openCon, setOpenCon] = useState<number | null>(0)

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <ProsConsColumn
        label="Keunggulan"
        sublabel="Kekuatan"
        items={pros}
        open={openPro}
        onToggle={setOpenPro}
        variant="pros"
      />
      <ProsConsColumn
        label="Kelemahan"
        sublabel="Keterbatasan"
        items={cons}
        open={openCon}
        onToggle={setOpenCon}
        variant="cons"
      />
    </div>
  )
}

function ProsConsColumn({
  label,
  sublabel,
  items,
  open,
  onToggle,
  variant,
}: {
  label: string
  sublabel: string
  items: ReadonlyArray<{ title: string; detail: string }>
  open: number | null
  onToggle: (index: number | null) => void
  variant: 'pros' | 'cons'
}) {
  const isPro = variant === 'pros'
  return (
    <div className={`parchment-card h-full overflow-hidden ${isPro ? '' : 'border-wax/25'}`}>
      <div className={`flex items-center justify-between border-b px-3 py-2 ${isPro ? 'border-forest/25 bg-forest/5' : 'border-wax/25 bg-wax/5'}`}>
        <div className="flex items-center gap-2">
          <span className={`flex h-7 w-7 items-center justify-center rounded-full border ${isPro ? 'border-forest/40 bg-forest/10 text-forest' : 'border-wax/40 bg-wax/10 text-wax'}`}>
            {isPro ? <IconShield size={16} /> : <IconSkull size={16} />}
          </span>
          <div>
            <p className={`font-heading text-[10px] font-semibold uppercase tracking-[0.18em] ${isPro ? 'text-forest' : 'text-wax'}`}>
              {label}
            </p>
            <p className="font-body text-[10px] italic text-leather-600/70">{sublabel}</p>
          </div>
        </div>
        <span className="font-mono text-[9px] text-leather-600/60">{items.length}</span>
      </div>
      <ul className="divide-y divide-leather-700/12">
        {items.map((item, index) => {
          const expanded = open === index
          return (
            <li key={item.title}>
              <button
                type="button"
                aria-expanded={expanded}
                onClick={() => onToggle(expanded ? null : index)}
                className="flex w-full items-start gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-parchment-50/50"
              >
                <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${isPro ? 'border-forest/40 text-forest' : 'border-wax/40 text-wax'}`}>
                  {isPro ? <IconCheck size={11} /> : <IconSkull size={11} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-heading text-[12.5px] font-semibold leading-snug text-leather-800">
                    {index + 1}. {item.title}
                  </span>
                  <motion.span
                    initial={false}
                    animate={{ height: expanded ? 'auto' : 0, opacity: expanded ? 1 : 0 }}
                    transition={{ duration: 0.28, ease: [0.22, 0.8, 0.3, 1] }}
                    className="block overflow-hidden"
                  >
                    <span className="mt-1 block font-body text-[12.5px] leading-snug text-leather-700/85">
                      {item.detail}
                    </span>
                  </motion.span>
                </span>
                <svg
                  viewBox="0 0 24 24"
                  className={`mt-1 h-3.5 w-3.5 shrink-0 text-leather-600/50 transition-transform ${expanded ? 'rotate-90' : ''}`}
                  fill="none"
                  aria-hidden="true"
                >
                  <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </li>
          )
        })}
      </ul>
      <div aria-hidden="true" className={`h-0.5 w-full ${isPro ? 'bg-forest/40' : 'bg-wax/40'}`} />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Catatan akurasi                                                     */
/* ------------------------------------------------------------------ */

export function AccuracyNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-3 flex items-start gap-2 border border-gold/30 border-dashed bg-gold/5 px-3 py-2">
      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-gold/60 font-heading text-[9px] font-bold text-gold">
        !
      </span>
      <p className="font-body text-[12px] leading-snug text-leather-700/90">{children}</p>
    </div>
  )
}

export function FormulaPanel({
  latex,
  variables,
  tone = 'gold',
}: {
  latex: string
  variables?: ReadonlyArray<{ term: string; text: string }>
  tone?: 'gold' | 'forest' | 'ember'
}) {
  const accentBorder = tone === 'forest' ? 'border-forest/30' : tone === 'ember' ? 'border-ember/30' : 'border-leather-700/25'
  return (
    <div className={`formula-panel relative border border-dashed ${accentBorder} bg-parchment-50/65 px-3 py-3`}>
      <div className="overflow-x-auto">
        <Tex display>{latex}</Tex>
      </div>
      {variables && variables.length > 0 && (
        <dl className="mt-2 grid gap-x-3 gap-y-0.5 border-t border-leather-700/15 pt-2 sm:grid-cols-2">
          {variables.map((variable) => (
            <div key={variable.term} className="flex gap-1.5 text-[12px] leading-snug">
              <dt className="shrink-0 font-mono text-[11px] font-semibold text-leather-800">{variable.term}</dt>
              <dd className="text-leather-700/85">= {variable.text}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  )
}

export function ContextCallout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative border-l-2 border-gold/50 bg-parchment-50/40 px-3 py-2">
      <p className="font-body text-[12.5px] italic leading-relaxed text-leather-700/90">{children}</p>
    </div>
  )
}

export function FlowChain({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {items.map((item, index) => (
        <span key={item} className="flex items-center gap-1.5">
          <span className="border border-leather-700/25 bg-parchment-50/60 px-2 py-0.5 font-heading text-[9px] uppercase tracking-wider text-leather-700">
            {item}
          </span>
          {index < items.length - 1 && (
            <svg viewBox="0 0 16 10" className="h-2 w-4 text-gold" fill="none" aria-hidden="true">
              <path d="M0 5h12M12 5l-4-3M12 5l-4 3" stroke="currentColor" strokeWidth="1.2" />
            </svg>
          )}
        </span>
      ))}
    </div>
  )
}

export function OrnamentHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <div className="text-gold/70">
        <OrnamentDivider motif="crown" animate={false} />
      </div>
      <h4 className="mt-1 text-center font-heading text-[13px] font-semibold uppercase tracking-[0.18em] text-leather-700">
        {children}
      </h4>
    </div>
  )
}

export const ICONS = { IconCrown, IconAnvil, IconSkull, IconShield }
