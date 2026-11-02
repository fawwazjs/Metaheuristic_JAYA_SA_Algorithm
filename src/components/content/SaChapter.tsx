import { useRef } from 'react'
import { lazy, Suspense } from 'react'
import { sa } from '../../lib/content'
import { SectionFrame, SubHeading } from '../layout/SectionFrame'
import { Stepper } from './Stepper'
import { DefinisiBlock, ProsCons, TraitCards } from './Blocks'
import { SaSim, SaDriver } from '../sim/SaSim'
import { ProbabilityCalc } from '../sim/Calculators'
import { TaskSchedulingDemo } from '../sim/TaskSchedulingDemo'
import { CrestSa, OrnamentDivider } from '../ornaments/Ornaments'
import { useInViewport } from '../../lib/hooks'
import { ParchmentCard } from '../ui/ParchmentCard'
import { Tex } from '../math/Tex'
import { ForgeSceneIllustration, ScenePlate, ScenePoster } from '../three/Illustrations'

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

          <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,.85fr)] lg:items-stretch">
            <ScenePlate
              eyebrow="Ilustrasi 3D · Pendinginan Logam"
              caption="Batang logam berpijar di atas landasan; kisi atom menata diri saat temperatur turun."
              illustration={<ForgeSceneIllustration className="block h-auto w-full" />}
            />
            <ParchmentCard className="p-4">
              <p className="eyebrow">Keterangan gambar</p>
              <h4 className="font-heading text-lg font-semibold text-leather-800">Dari panas ke kisi teratur</h4>
              <ul className="mt-2 space-y-1.5 font-body text-[13px] leading-snug text-leather-700/90">
                {[
                  ['#fff8de', 'Putih-kuning', 'temperatur tinggi: atom bergetar acak dan kisi tidak teratur.'],
                  ['#c8561e', 'Oranye–merah', 'temperatur menurun: atom mulai menempati posisi kisi.'],
                  ['#5e6a73', 'Abu baja', 'temperatur rendah: kisi rapi dan energi mendekati minimum.'],
                  ['#e3b64f', 'Percikan', 'analogi gerak termal yang makin redam seiring pendinginan.'],
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
                Ilustrasi di samping adalah gambar statis. Panel di bawah menampilkan model 3D interaktif dengan
                skedul pendinginan lambat, cepat, dan manual.
              </p>
            </ParchmentCard>
          </div>

          <div className="mt-3">
            {forgeInView ? (
              <Suspense
                fallback={
                  <ScenePoster
                    illustration={<ForgeSceneIllustration className="block h-full w-full" />}
                    label="Visualisasi 3D pendinginan logam"
                    className="h-[300px]"
                  />
                }
              >
                <AnnealingForge />
              </Suspense>
            ) : (
              <ScenePoster
                illustration={<ForgeSceneIllustration className="block h-full w-full" />}
                label="Visualisasi 3D pendinginan logam"
                className="h-[300px]"
              />
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
