import { useRef } from 'react'
import { jaya } from '../../lib/content'
import { SectionFrame, SubHeading } from '../layout/SectionFrame'
import { Stepper } from './Stepper'
import { ContextCallout, DefinisiBlock, FlowChain, PhilosophyBlock, ProsCons, TraitCards, AccuracyNote } from './Blocks'
import { JayaSim, JayaDriver } from '../sim/JayaSim'
import { JayaUpdateCalculator } from '../sim/Calculators'
import { CrestJaya, OrnamentDivider, IconCrown } from '../ornaments/Ornaments'
import { ParchmentCard } from '../ui/ParchmentCard'
import { useJayaStore } from '../../store/jayaStore'
import { lazy, Suspense } from 'react'
import { useInViewport } from '../../lib/hooks'

const JayaArena3D = lazy(() => import('../three/JayaArena3D').then((m) => ({ default: m.JayaArena3D })))

export function JayaChapter() {
  const simRef = useRef<HTMLDivElement>(null)
  const setPhaseFocus = useJayaStore((s) => s.setPhaseFocus)
  const demoPhase = useJayaStore((s) => s.demoPhase)
  const arenaRef = useRef<HTMLDivElement>(null)
  const arenaInView = useInViewport(arenaRef, '240px')

  const phaseForStep = ['init', 'evaluate', 'update', 'select', 'iterate'] as const

  return (
    <>
      <SectionFrame
        id="jaya"
        eyebrow="Algoritma JAYA"
        title="Algoritma JAYA"
        subtitle="Algoritma berbasis populasi: setiap kandidat bergerak menuju kandidat terbaik dan menjauhi kandidat terburuk."
        quote={jaya.motto}
        motif="crown"
      >
        <div className="space-y-10">
          <DefinisiBlock
            kicker="Definisi"
            title="Apa itu JAYA?"
            text={jaya.definisi}
            highlights={jaya.definisiHighlights}
            crest={<CrestJaya className="h-24 w-auto" />}
          />

          <div>
            <SubHeading numeral="I" title="Filosofi" caption="Dua arah pergerakan yang bekerja bersamaan pada setiap langkah." tone="forest" />
            <PhilosophyBlock items={jaya.philosophy} />
            <div className="mt-3">
              <ContextCallout>{jaya.context}</ContextCallout>
            </div>
          </div>

          <div>
            <SubHeading numeral="II" title="Karakteristik" caption="Empat sifat utama algoritma JAYA." tone="forest" />
            <TraitCards cards={jaya.characteristics} tone="forest" />
          </div>

          <div>
            <SubHeading numeral="III" title="Keunggulan & Kelemahan" caption="Klik setiap butir untuk membaca penjelasannya." tone="forest" />
            <ProsCons pros={jaya.pros} cons={jaya.cons} />
          </div>

          <div ref={simRef}>
            <SubHeading numeral="IV" title="Cara Kerja" caption="Lima langkah bernomor; memilih langkah akan menyinkronkan simulator ke fase terkait." tone="forest" />
            <Stepper
              steps={jaya.steps}
              tone="forest"
              accentLabel="JAYA"
              syncTargetId="simulator-jaya"
              onStepChange={(index) => {
                setPhaseFocus(phaseForStep[index] ?? null)
                demoPhase(phaseForStep[index] ?? 'evaluate')
              }}
            />
          </div>

          <div id="simulator-jaya" className="scroll-mt-24">
            <SubHeading numeral="V" title="Simulator JAYA" caption="Simulator memakai implementasi dari lib/algorithms/jaya.ts — klik salah satu kandidat untuk melihat perhitungannya." tone="forest" />
            <JayaDriver />
            <JayaSim />
            <div className="mt-3 grid gap-3 lg:grid-cols-2">
              <JayaUpdateCalculator />
              <ParchmentCard className="p-4">
                <p className="eyebrow">Sinkronisasi stepper dengan simulator</p>
                <h4 className="font-heading text-lg font-semibold text-leather-800">Alur yang sama, dua arah</h4>
                <p className="mt-1.5 font-body text-[13px] leading-relaxed text-leather-700/90">
                  Memilih langkah pada stepper akan memajukan simulator JAYA ke fase yang sesuai:
                </p>
                <div className="mt-2">
                  <FlowChain items={['I init', 'II evaluate', 'III update', 'IV select', 'V iterate']} />
                </div>
                <p className="mt-2 font-body text-[13px] leading-relaxed text-leather-700/90">
                  Sebaliknya, label fase pada simulator menunjukkan tahap yang sedang berjalan. Gunakan tombol
                  “Satu fase” untuk berhenti tepat di setiap tahap.
                </p>
                <AccuracyNote>
                  Rumus pembaruan memakai |X| persis seperti slide; simulator menambahkan clamp ke batas domain dan
                  batas iterasi maksimum sebagai praktik standar.
                </AccuracyNote>
              </ParchmentCard>
            </div>
          </div>

          <div ref={arenaRef}>
            <SubHeading numeral="VI" title="Visualisasi 3D Pergerakan Populasi" caption="Lanskap fungsi yang sama, dilihat dari ketinggian. Kontrolnya terhubung dengan simulator 2D." tone="forest" />
            <div className="text-gold/60">
              <OrnamentDivider motif="sword" animate={false} />
            </div>
            <div className="mt-3">
              {arenaInView ? (
                <Suspense
                  fallback={
                    <div className="flex h-[320px] items-center justify-center border border-gold/25 bg-leather-900/60">
                      <span className="font-heading text-[10px] uppercase tracking-[0.2em] text-parchment-200">
                        Memuat visualisasi…
                      </span>
                    </div>
                  }
                >
                  <JayaArena3D />
                </Suspense>
              ) : (
                <div className="flex h-[320px] items-center justify-center border border-gold/25 bg-leather-900/40">
                  <span className="flex items-center gap-2 font-heading text-[10px] uppercase tracking-[0.2em] text-parchment-300/60">
                    <IconCrown size={14} /> Visualisasi dimuat saat terlihat
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </SectionFrame>
    </>
  )
}