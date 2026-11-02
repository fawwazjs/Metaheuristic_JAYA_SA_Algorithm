import { useRef } from 'react'
import { jaya } from '../../lib/content'
import { SectionFrame, SubHeading } from '../layout/SectionFrame'
import { Stepper } from './Stepper'
import { ContextCallout, DefinisiBlock, FlowChain, PhilosophyBlock, ProsCons, TraitCards, AccuracyNote } from './Blocks'
import { JayaSim, JayaDriver } from '../sim/JayaSim'
import { JayaUpdateCalculator } from '../sim/Calculators'
import { CrestJaya, OrnamentDivider } from '../ornaments/Ornaments'
import { ParchmentCard } from '../ui/ParchmentCard'
import { useJayaStore } from '../../store/jayaStore'
import { lazy, Suspense } from 'react'
import { useInViewport } from '../../lib/hooks'
import { JayaSceneIllustration, ScenePlate, ScenePoster } from '../three/Illustrations'

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

            <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,.85fr)] lg:items-stretch">
              <ScenePlate
                eyebrow="Ilustrasi 3D · Pergerakan Populasi JAYA"
                caption="Lanskap Rastrigin isometrik: kandidat hijau bergerak menuju P_best (emas) dan menjauhi P_worst (merah)."
                illustration={<JayaSceneIllustration className="block h-auto w-full" />}
              />
              <ParchmentCard className="p-4">
                <p className="eyebrow">Keterangan gambar</p>
                <h4 className="font-heading text-lg font-semibold text-leather-800">Membaca medan 3D</h4>
                <ul className="mt-2 space-y-1.5 font-body text-[13px] leading-snug text-leather-700/90">
                  {[
                    ['#55744b', 'Bidak hijau', 'kandidat solusi pada populasi.'],
                    ['#e3b64f', 'Bidak emas', 'P_best — solusi terbaik dengan pilar cahaya.'],
                    ['#a8322a', 'Bidak merah', 'P_worst — solusi terburuk dengan cincin merah.'],
                    ['#b8862b', 'Panah', 'arah tarik menuju P_best dan tolak dari P_worst.'],
                  ].map(([color, name, text]) => (
                    <li key={name} className="flex items-start gap-2">
                      <span
                        aria-hidden="true"
                        className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full border border-leather-700/35"
                        style={{ backgroundColor: color }}
                      />
                      <span>
                        <span className="font-semibold text-leather-800">{name}</span> {text}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-2.5 border-t border-leather-700/20 pt-2 font-body text-[12px] italic leading-snug text-leather-600">
                  Ilustrasi di samping adalah gambar statis. Panel di bawah menampilkan medan yang sama secara
                  interaktif: seret untuk memutar, scroll untuk zoom, dan klik kandidat untuk memilihnya.
                </p>
              </ParchmentCard>
            </div>

            <div className="mt-3">
              {arenaInView ? (
                <Suspense
                  fallback={
                    <ScenePoster
                      illustration={<JayaSceneIllustration className="block h-full w-full" />}
                      label="Visualisasi 3D populasi JAYA"
                      className="h-[320px]"
                    />
                  }
                >
                  <JayaArena3D />
                </Suspense>
              ) : (
                <ScenePoster
                  illustration={<JayaSceneIllustration className="block h-full w-full" />}
                  label="Visualisasi 3D populasi JAYA"
                  className="h-[320px]"
                />
              )}
            </div>
          </div>
        </div>
      </SectionFrame>
    </>
  )
}