import { accuracyNotes, identity, intro, references } from '../../lib/content'
import { SectionFrame, SubHeading } from '../layout/SectionFrame'
import { Reveal } from '../ui/Reveal'
import { CompareArena } from '../sim/CompareArena'
import { OrnamentDivider, CrestMonogram, FleurDeLis, StarMotif } from '../ornaments/Ornaments'
import { WaxSealish } from '../ornaments/WaxSealish'
import { ParchmentCard } from '../ui/ParchmentCard'
import { AccuracyNote } from './Blocks'

export function IntroSection() {
  return (
    <SectionFrame
      id="pengantar"
      eyebrow="Pengantar"
      title="Mengapa Metaheuristik?"
      subtitle={intro.lead}
      motif="star"
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Reveal className="parchment-card p-5 sm:p-6">
          <p className="drop-cap font-body text-[17px] leading-[1.78] text-ink/90">{intro.body}</p>
        </Reveal>
        <div className="space-y-2.5">
          {intro.contrast.map((card, index) => (
            <Reveal key={card.key} delay={index * 0.1}>
              <div className={`border-l-2 p-3 ${card.key === 'jaya' ? 'border-forest/60 bg-forest/5' : 'border-ember/60 bg-ember/5'}`}>
                <p className={`font-heading text-[10px] font-semibold uppercase tracking-[0.2em] ${card.key === 'jaya' ? 'text-forest' : 'text-ember'}`}>
                  {card.title}
                </p>
                <p className="mt-1 font-body text-[13px] leading-snug text-leather-700/90">{card.text}</p>
              </div>
            </Reveal>
          ))}
          <Reveal delay={0.2}>
            <div className="border border-gold/30 bg-gold/5 p-3">
              <p className="font-heading text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">Cara membaca</p>
              <p className="mt-1 font-body text-[13px] leading-snug text-leather-700/90">
                Setiap bagian memiliki langkah bernomor, simulator, dan alat hitung. Gunakan Daftar Isi di atas untuk
                melompat ke bagian tertentu.
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </SectionFrame>
  )
}

export function ArenaSection() {
  return (
    <SectionFrame
      id="arena"
      eyebrow="Perbandingan · JAYA vs SA"
      title="Perbandingan JAYA dan Simulated Annealing"
      subtitle="Anggaran evaluasi fungsi disamakan agar perbandingan adil: sumbu-x adalah jumlah evaluasi, bukan iterasi."
      motif="sword"
    >
      <CompareArena />
    </SectionFrame>
  )
}

export function ReferenceSection() {
  return (
    <SectionFrame
      id="arsip"
      eyebrow="Referensi"
      title="Referensi"
      subtitle="Seluruh isi halaman ini bersumber dari presentasi kuliah Metaheuristik Kelompok 4 Kelas C."
      motif="fleur"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {references.map((reference, index) => (
          <Reveal key={reference.title} delay={index * 0.1}>
            <ParchmentCard className="flex h-full flex-col p-4">
              <div className="flex items-center justify-between">
                <span className="font-heading text-[9px] uppercase tracking-[0.2em] text-leather-600">
                  Referensi {index + 1}
                </span>
                <span className="border border-gold/35 px-1.5 py-0.5 font-mono text-[9px] text-gold">
                  {reference.year}
                </span>
              </div>
              <h3 className="mt-2 font-heading text-[15px] font-semibold leading-snug text-leather-800">
                {reference.title}
              </h3>
              <p className="mt-1.5 font-body text-[12.5px] italic leading-snug text-leather-600">{reference.authors}</p>
              <p className="mt-1 font-body text-[12px] leading-snug text-leather-700/85">{reference.source}</p>
              <div aria-hidden="true" className="mt-auto pt-3">
                <div className="h-px bg-gradient-to-r from-gold/50 to-transparent" />
              </div>
            </ParchmentCard>
          </Reveal>
        ))}
      </div>

      <div className="mt-6">
        <SubHeading title="Catatan Akurasi" caption="Hal-hal yang ditangani hati-hati tanpa mengubah isi materi." />
        <ParchmentCard className="p-4">
          <ol className="space-y-1.5">
            {accuracyNotes.map((note, index) => (
              <li key={index} className="flex gap-2 font-body text-[13px] leading-snug text-leather-700/90">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-gold/50 font-mono text-[8px] text-gold">
                  {index + 1}
                </span>
                <span>{note}</span>
              </li>
            ))}
          </ol>
          <AccuracyNote>
            Angka contoh telah diverifikasi: JAYA → 3; SA: C₁ = 9, f(S₀) = 9, T₀ ≈ 18,98, P ≈ 0,6703 dan 0,0183, T₁ = 9,98,
            T₂ = 9,96004, T₃ ≈ 9,94012. Semuanya diuji otomatis di <code className="font-mono text-[11px]">src/lib/algorithms/algorithms.test.ts</code>.
          </AccuracyNote>
        </ParchmentCard>
      </div>
    </SectionFrame>
  )
}

export function ClosingSection() {
  return (
    <section
      id="penutup"
      aria-labelledby="penutup-title"
      className="relative scroll-mt-24 overflow-hidden bg-leather-900 py-20 text-parchment-100 sm:py-28"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-30">
        <div className="page-blotch absolute inset-0" />
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_45%,rgba(184,134,43,.16),transparent_62%)]"
      />
      <div className="relative mx-auto max-w-page px-4 text-center sm:px-6">
        <div className="mx-auto flex h-14 w-14 items-center justify-center">
          <StarMotif className="h-10 w-10 text-gold-light/70" />
        </div>
        <p className="mt-4 font-heading text-[10px] font-semibold uppercase tracking-[0.4em] text-gold-light/80">
          Penutup
        </p>
        <h2 id="penutup-title" className="display-title mt-3 text-[clamp(2rem,6vw,3.6rem)] leading-tight text-parchment-50">
          TERIMA KASIH
        </h2>
        <div className="mx-auto mt-5 max-w-md text-gold/60">
          <OrnamentDivider motif="crown" />
        </div>
        <p className="mx-auto mt-5 max-w-xl font-body text-[16px] italic leading-relaxed text-parchment-200/80">
          “Satu kesimpulan dari kedua algoritma: kadang solusi terbaik dicapai dengan bergerak bersama populasi,
          kadang dengan menerima langkah yang tampak lebih buruk untuk sementara.”
        </p>

        <div className="mx-auto mt-8 flex max-w-lg flex-col items-center gap-3">
          <CrestMonogram className="h-16 w-16" />
          <p className="font-heading text-sm font-semibold uppercase tracking-[0.28em] text-gold-light">
            {identity.group}
          </p>
          <p className="font-body text-[13px] italic text-parchment-300/70">{identity.institution}</p>
        </div>

        <ul className="mx-auto mt-7 grid max-w-2xl gap-x-8 gap-y-1.5 text-left sm:grid-cols-2">
          {identity.members.map((member, index) => (
            <li
              key={member.nrp}
              className="flex items-baseline justify-between gap-2 border-b border-parchment-300/12 pb-1 font-body text-[12.5px]"
            >
              <span className="text-parchment-200/85">
                <span className="mr-1.5 font-mono text-[9px] text-gold-light/50">{String(index + 1).padStart(2, '0')}</span>
                {member.name}
              </span>
              <span className="shrink-0 font-mono text-[10px] text-gold-light/55">{member.nrp}</span>
            </li>
          ))}
        </ul>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <a href="#gerbang" className="btn-ritual !min-h-[44px]">
            <FleurDeLis className="h-3.5 w-3.5" /> Kembali ke Atas
          </a>
          <WaxSealish className="hidden h-10 w-10 sm:block" />
        </div>
      </div>
    </section>
  )
}