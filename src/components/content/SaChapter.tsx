import { useRef } from 'react'
import { lazy, Suspense } from 'react'
import { sa } from '../../lib/content'
import { SectionFrame, SubHeading } from '../layout/SectionFrame'
import { Stepper } from './Stepper'
import { DefinisiBlock, ProsCons, TraitCards } from './Blocks'
import { SaSim, SaDriver } from '../sim/SaSim'
import { ProbabilityCalc } from '../sim/Calculators'
import { TaskSchedulingDemo } from '../sim/TaskSchedulingDemo'
import { CrestSa, OrnamentDivider, IconAnvil } from '../ornaments/Ornaments'
import { useInViewport } from '../../lib/hooks'
import { ParchmentCard } from '../ui/ParchmentCard'
import { Tex } from '../math/Tex'

const AnnealingForge = lazy(() => import('../three/AnnealingForge').then((m) => ({ default: m.AnnealingForge })))

export function SaChapter() {
  const forgeRef = useRef<HTMLDivElement>(null)
  const forgeInView = useInViewport(forgeRef, '260px')

  return (
    <SectionFrame
      id="sa"
      eyebrow="Simulated Annealing"
      title="Simulated Annealing (SA)"
      subtitle="Satu solusi berjalan melalui proses pendinginan: menerima solusi yang lebih buruk pada awal untuk mengeksplorasi ruang solusi."
      quote={sa.motto}
      motif="anvil"
      className="border-y border-leather-700/20"
    >
      <div className="space-y-10">
        <DefinisiBlock
          kicker="Definisi"
          title="Apa itu Simulated Annealing?"
          text={sa.definisi}
          highlights={sa.definisiHighlights}
          crest={<CrestSa className="h-24 w-auto" />}
        />

        <div>
          <SubHeading numeral="I" title="Karakteristik" caption="Empat sifat utama Simulated Annealing." tone="ember" />
          <TraitCards cards={sa.characteristics} tone="ember" />
        </div>

        <div>
          <SubHeading numeral="II" title="Keunggulan & Kelemahan" caption="Klik setiap butir untuk membaca penjelasannya." tone="ember" />
          <ProsCons pros={sa.pros} cons={sa.cons} />
        </div>

        <div>
          <SubHeading
            numeral="III"
            title="Cara Kerja"
            caption="Sepuluh langkah, dari matriks ETC hingga cooling schedule."
            tone="ember"
          />
          <Stepper steps={sa.steps} tone="ember" accentLabel="SA" syncTargetId="simulator-sa" />
        </div>

        <div>
          <SubHeading
            numeral="IV"
            title="Demo Penjadwalan Task pada Node"
            caption="Langkah I–IV dan VI–IX dalam bentuk konkret: ubah penempatan task, lalu jalankan SA."
            tone="ember"
          />
          <TaskSchedulingDemo />
        </div>

        <div id="simulator-sa" className="scroll-mt-24">
          <SubHeading
            numeral="V"
            title="Simulator Simulated Annealing"
            caption="Satu solusi bergerak pada lanskap fungsi; kriteria Metropolis menentukan apakah solusi yang lebih buruk diterima."
            tone="ember"
          />
          <SaDriver />
          <SaSim />
        </div>

        <div>
          <SubHeading
            numeral="VI"
            title="Kalkulator Interaktif"
            caption="Tiga contoh angka dari slide yang dapat Anda periksa sendiri."
            tone="ember"
          />
          <ProbabilityCalc />
        </div>

        <div ref={forgeRef}>
          <SubHeading
            numeral="VII"
            title="Visualisasi Proses Pendinginan Logam"
            caption="Kisi atom menata diri saat temperatur turun — ilustrasi proses annealing."
            tone="ember"
          />
          <div className="text-gold/60">
            <OrnamentDivider motif="anvil" animate={false} />
          </div>
          <div className="mt-3">
            {forgeInView ? (
              <Suspense
                fallback={
                  <div className="flex h-[320px] items-center justify-center border border-gold/25 bg-leather-900/60">
                    <span className="font-heading text-[10px] uppercase tracking-[0.2em] text-parchment-200">
                      Memuat visualisasi…
                    </span>
                  </div>
                }
              >
                <AnnealingForge />
              </Suspense>
            ) : (
              <div className="flex h-[320px] items-center justify-center border border-gold/25 bg-leather-900/40">
                <span className="flex items-center gap-2 font-heading text-[10px] uppercase tracking-[0.2em] text-parchment-300/60">
                  <IconAnvil size={14} /> Visualisasi dimuat saat terlihat
                </span>
              </div>
            )}
          </div>
        </div>

        <ParchmentCard className="p-4">
          <p className="eyebrow">Rangkuman matematis</p>
          <h4 className="font-heading text-lg font-semibold text-leather-800">
            Tiga rumus inti
          </h4>
          <div className="mt-2 grid gap-2.5 sm:grid-cols-3">
            {[
              { label: 'Cost solusi', latex: 'f(S) = \\max_j C_j(S)' },
              { label: 'Penerimaan solusi buruk', latex: 'P = e^{-\\Delta C / T}' },
              { label: 'Pendinginan', latex: 'T_{baru} = \\alpha\\, T_{lama}' },
            ].map((item) => (
              <div key={item.label} className="border border-leather-700/25 bg-parchment-50/60 p-2">
                <p className="font-heading text-[8px] uppercase tracking-wider text-leather-600">{item.label}</p>
                <div className="mt-1 overflow-x-auto">
                  <Tex display>{item.latex}</Tex>
                </div>
              </div>
            ))}
          </div>
        </ParchmentCard>
      </div>
    </SectionFrame>
  )
}
