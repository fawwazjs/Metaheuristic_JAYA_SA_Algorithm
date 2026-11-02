import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import type { WorkStep } from '../../lib/content'
import { Tex } from '../math/Tex'
import { IconBack, IconChevron, IconCrown, OrnamentDivider } from '../ornaments/Ornaments'
import { AccuracyNote, FormulaPanel } from './Blocks'

export function Stepper({
  steps,
  tone,
  accentLabel,
  onStepChange,
  syncTargetId,
  extras,
}: {
  steps: readonly WorkStep[]
  tone: 'forest' | 'ember'
  accentLabel: string
  onStepChange?: (index: number, phase?: string) => void
  syncTargetId?: string
  extras?: Partial<Record<number, React.ReactNode>>
}) {
  const [index, setIndex] = useState(0)
  const [direction, setDirection] = useState(1)
  const reduce = useReducedMotion()
  const step = steps[index]
  const accent = tone === 'forest' ? 'text-forest' : 'text-ember'
  const accentBorder = tone === 'forest' ? 'border-forest/35' : 'border-ember/35'
  const accentBg = tone === 'forest' ? 'bg-forest/8' : 'bg-ember/8'

  useEffect(() => {
    onStepChange?.(index, step.plate)
  }, [index])

  const go = (next: number) => {
    if (next < 0 || next >= steps.length) return
    setDirection(next > index ? 1 : -1)
    setIndex(next)
  }

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      go(index + 1)
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault()
      go(index - 1)
    } else if (event.key === 'Home') {
      event.preventDefault()
      go(0)
    } else if (event.key === 'End') {
      event.preventDefault()
      go(steps.length - 1)
    }
  }

  return (
    <div className="space-y-3">
      {extras?.[index]}

      <div className="grid gap-0 lg:grid-cols-2">
        <div
          className={`parchment-card relative order-2 lg:order-1 lg:border-r-0 ${accentBorder}`}
          onKeyDown={onKeyDown}
          tabIndex={-1}
          role="group"
          aria-roledescription="langkah stepper"
          aria-label={`Langkah ${index + 1} dari ${steps.length}: ${step.title}`}
        >
          <div className="flex h-full flex-col">
            {/* Indikator progres langkah */}
            <div className="border-b border-leather-700/15 px-3 py-2.5 sm:px-4">
              <div className="flex items-center justify-between gap-2">
                <span className={`font-heading text-[9px] font-semibold uppercase tracking-[0.18em] ${accent}`}>
                  {accentLabel} · Langkah {index + 1} / {steps.length}
                </span>
                <span className="font-body text-[11px] italic text-leather-600/70">{step.kicker}</span>
              </div>
              <div className="mt-2 flex items-center gap-0.5" role="tablist" aria-label="Pilih langkah">
                {steps.map((item, i) => {
                  const done = i < index
                  const active = i === index
                  return (
                    <button
                      key={item.numeral}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      aria-label={`Langkah ${i + 1}: ${item.title}`}
                      onClick={() => go(i)}
                      className="group relative flex h-11 flex-1 items-center justify-center"
                    >
                      <span
                        className={`h-1 w-full transition-colors duration-300 ${
                          active
                            ? tone === 'forest'
                              ? 'bg-forest'
                              : 'bg-ember'
                            : done
                              ? 'bg-gold/60'
                              : 'bg-leather-700/20 group-hover:bg-gold/40'
                        }`}
                      />
                      <span
                        className={`absolute -top-0.5 h-2.5 w-2.5 rotate-45 border transition-all ${
                          active
                            ? tone === 'forest'
                              ? 'scale-125 border-forest bg-forest'
                              : 'scale-125 border-ember bg-ember'
                            : done
                              ? 'border-gold/60 bg-gold/40'
                              : 'border-leather-700/30 bg-parchment-100'
                        }`}
                      />
                    </button>
                  )
                })}
              </div>
            </div>

            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={index}
                initial={reduce ? false : { opacity: 0, rotateY: direction > 0 ? -8 : 8, x: direction * 8 }}
                animate={{ opacity: 1, rotateY: 0, x: 0 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, rotateY: direction > 0 ? 8 : -8, x: -direction * 8 }}
                transition={{ duration: 0.36, ease: [0.22, 0.8, 0.3, 1] }}
                className="flex flex-1 flex-col p-4 sm:p-5"
                style={{ transformOrigin: direction > 0 ? 'left center' : 'right center' }}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 font-display text-[13px] font-bold ${accentBorder} ${accentBg} ${accent}`}
                  >
                    {step.numeral}
                  </span>
                  <div className="min-w-0">
                    <h4 className="font-heading text-[clamp(1.05rem,2vw,1.3rem)] font-semibold leading-tight text-leather-800">
                      Langkah {index + 1} — {step.title}
                    </h4>
                    <p className="mt-0.5 font-body text-[12px] italic text-leather-600/80">{step.kicker}</p>
                  </div>
                </div>

                {step.latex && (
                  <div className="mt-3">
                    <FormulaPanel latex={step.latex} tone={tone} />
                  </div>
                )}

                <div className="mt-3 space-y-2">
                  {step.paragraphs.map((paragraph, i) => (
                    <p key={i} className="font-body text-[15px] leading-[1.7] text-ink/88">
                      {paragraph}
                    </p>
                  ))}
                </div>

                {step.bullets && (
                  <ul className="mt-2.5 space-y-1 border-t border-leather-700/15 pt-2.5">
                    {step.bullets.map((bullet) => (
                      <li key={bullet.term} className="flex gap-2 text-[13px] leading-snug">
                        <span className={`mt-1.5 h-1 w-1 shrink-0 rotate-45 ${tone === 'forest' ? 'bg-forest' : 'bg-ember'}`} aria-hidden="true" />
                        <span className="text-leather-700/90">
                          <span className="font-mono text-[12px] font-semibold text-leather-900">{bullet.term}</span>{' '}
                          {bullet.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}

                {step.example && (
                  <div className="mt-3 border-l-2 border-gold/60 bg-gold/5 px-3 py-2">
                    <p className="font-heading text-[9px] font-semibold uppercase tracking-[0.16em] text-leather-600">
                      {step.example.label}
                    </p>
                    <div className="mt-1 overflow-x-auto">
                      <Tex display>{step.example.latex}</Tex>
                    </div>
                    {step.example.note && (
                      <p className="mt-1 font-body text-[12px] italic leading-snug text-leather-700/85">
                        {step.example.note}
                      </p>
                    )}
                  </div>
                )}

                {step.note && <AccuracyNote>{step.note}</AccuracyNote>}
              </motion.div>
            </AnimatePresence>

            <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-leather-700/15 px-3 py-2.5 sm:px-4">
              <button
                type="button"
                onClick={() => go(index - 1)}
                disabled={index === 0}
                className="btn-ritual btn-ritual-light !min-h-[40px] !px-3 !text-[9px] disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Langkah sebelumnya"
              >
                <IconBack size={13} className="-scale-x-100" /> Sebelumnya
              </button>
              {syncTargetId && (
                <a
                  href={`#${syncTargetId}`}
                  className="inline-flex min-h-[40px] items-center gap-1 font-heading text-[9px] font-semibold uppercase tracking-[0.16em] text-leather-600 transition-colors hover:text-leather-900"
                >
                  Lihat di Simulator
                  <IconChevron size={13} />
                </a>
              )}
              <button
                type="button"
                onClick={() => go(index + 1)}
                disabled={index === steps.length - 1}
                className="btn-ritual !min-h-[40px] !px-3 !text-[9px] disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Langkah berikutnya"
              >
                Berikutnya <IconChevron size={13} />
              </button>
            </div>
          </div>
        </div>

        {/* Kolom kanan: visual */}
        <div className={`parchment-card relative order-1 flex flex-col overflow-hidden border-l-0 lg:order-2 ${accentBorder}`}>
          <div className="flex items-center justify-between border-b border-leather-700/15 px-3 py-2">
            <span className="font-heading text-[8px] font-semibold uppercase tracking-[0.2em] text-leather-600">
              Ilustrasi Langkah
            </span>
            <span className="inline-flex items-center gap-1 font-heading text-[8px] uppercase tracking-wider text-gold">
              <IconCrown size={11} /> {step.plate}
            </span>
          </div>
          <div className="relative flex flex-1 items-center justify-center p-3 sm:p-4">
            <div className="absolute inset-0 opacity-[0.25]" aria-hidden="true">
              <div className="page-blotch absolute inset-0" />
            </div>
            <StepPlate plate={step.plate} tone={tone} />
          </div>
          <div className="border-t border-leather-700/15 px-3 py-2">
            <p className="font-body text-[12px] italic leading-snug text-leather-600/85">{step.caption}</p>
          </div>
        </div>
      </div>

      <div className="lg:hidden">
        <div className="mt-1 text-gold/60">
          <OrnamentDivider motif={tone === 'forest' ? 'crown' : 'anvil'} animate={false} />
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Plate ilustrasi per langkah                                        */
/* ------------------------------------------------------------------ */

import {
  PlateCooling, PlateCost, PlateDelta, PlateETC, PlateFitness, PlateInit, PlateLoads,
  PlateLoop, PlateMetropolis, PlateNeighbor, PlateSAUpdate, PlateSelect, PlateSolution,
  PlateTemp0, PlateUpdate, PlateBestFlag,
} from './Plates'

function StepPlate({ plate, tone }: { plate: string; tone: 'forest' | 'ember' }) {
  const map: Record<string, React.ReactNode> = {
    'jaya-init': <PlateInit tone={tone} />,
    'jaya-fitness': <PlateFitness tone={tone} />,
    'jaya-update': <PlateUpdate tone={tone} />,
    'jaya-select': <PlateSelect tone={tone} />,
    'jaya-loop': <PlateLoop tone={tone} />,
    'sa-etc': <PlateETC tone={tone} />,
    'sa-solution': <PlateSolution tone={tone} />,
    'sa-loads': <PlateLoads tone={tone} />,
    'sa-cost': <PlateCost tone={tone} />,
    'sa-temp0': <PlateTemp0 tone={tone} />,
    'sa-neighbor': <PlateNeighbor tone={tone} />,
    'sa-delta': <PlateDelta tone={tone} />,
    'sa-metropolis': <PlateMetropolis tone={tone} />,
    'sa-best': <PlateBestFlag tone={tone} />,
    'sa-cool': <PlateCooling tone={tone} />,
  }
  return <div className="relative z-10 w-full">{map[plate] ?? <PlateSAUpdate tone={tone} />}</div>
}