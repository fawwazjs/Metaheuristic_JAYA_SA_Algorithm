import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { identity, intro } from '../../lib/content'
import { WaxSealButton } from '../ui/WaxSealButton'
import { EmberParticles, CrestJaya, CrestSa, Torch, OrnamentDivider, FleurDeLis } from '../ornaments/Ornaments'
import { useInViewport } from '../../lib/hooks'

const HeroLandscape = lazy(() => import('../three/HeroLandscape').then((m) => ({ default: m.HeroLandscape })))

export function Hero() {
  const reduce = useReducedMotion()
  const sceneRef = useRef<HTMLDivElement>(null)
  const inView = useInViewport(sceneRef, '300px')
  const [sceneReady, setSceneReady] = useState(false)

  useEffect(() => {
    if (!inView) return
    const timer = window.setTimeout(() => setSceneReady(true), reduce ? 0 : 120)
    return () => window.clearTimeout(timer)
  }, [inView, reduce])

  return (
    <section
      id="gerbang"
      aria-labelledby="gerbang-title"
      className="relative min-h-[calc(100svh-62px)] overflow-hidden bg-leather-900 text-parchment-100"
    >
      {/* Scene 3D sebagai latar */}
      <div ref={sceneRef} className="absolute inset-0">
        {sceneReady && (
          <Suspense
            fallback={
              <div className="h-full w-full bg-[radial-gradient(ellipse_at_50%_35%,#3b2513,#1b1008_70%)]" />
            }
          >
            <HeroLandscape />
          </Suspense>
        )}
      </div>

      <div className="pointer-events-none absolute inset-0 bg-leather-900/40" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_58%_48%_at_50%_52%,rgba(23,13,6,.88)_0%,rgba(23,13,6,.55)_58%,rgba(23,13,6,0)_78%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-leather-900 via-leather-900/70 to-transparent" />
      <div className="pointer-events-none absolute inset-0 opacity-20">
        <div className="page-noise absolute inset-0" />
      </div>
      {!reduce && <EmberParticles count={18} />}

      {/* Obor dekoratif kiri-kanan (desktop) */}
      <Torch className="absolute bottom-[18%] left-[3%] hidden lg:block" />
      <Torch className="absolute bottom-[18%] right-[3%] hidden lg:block" flip />

      <div className="relative mx-auto flex min-h-[calc(100svh-62px)] max-w-page flex-col items-center justify-center px-4 pb-44 pt-14 text-center sm:px-6 lg:pb-32">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 0.8, 0.3, 1] }}
          className="flex flex-col items-center"
        >
          <div className="mb-5 flex max-w-full items-center gap-2.5 rounded-sm border border-gold/35 bg-black/25 px-3 py-1.5 backdrop-blur-sm">
            <FleurDeLis className="h-4 w-4 shrink-0 text-gold-light" />
            <span className="min-w-0 break-words text-center font-heading text-[8px] font-semibold uppercase leading-snug tracking-[0.22em] text-parchment-200/90 sm:text-[9px] sm:tracking-[0.3em]">
              {identity.group} · {identity.institution}
            </span>
          </div>

          <div className="relative">
            <p className="mb-3 font-heading text-[10px] font-semibold uppercase tracking-[0.44em] text-gold-light/85 sm:text-[11px]">
              Pendahuluan
            </p>
            <h1
              id="gerbang-title"
              className="display-title gold-text mx-auto max-w-full text-[clamp(2.1rem,8.4vw,6.4rem)] leading-[0.95] tracking-[0.06em] sm:tracking-[0.08em]"
            >
              METAHEURISTIK
            </h1>
            <div className="mt-4 flex w-full max-w-md items-center justify-center gap-2 sm:gap-3">
              <span className="h-px flex-1 bg-gradient-to-r from-transparent to-gold/70 sm:w-20 sm:flex-none" aria-hidden="true" />
              <p className="max-w-[15rem] text-balance font-heading text-[clamp(.7rem,2.4vw,1.05rem)] font-medium uppercase leading-snug tracking-[0.18em] text-parchment-100 sm:max-w-none sm:tracking-[0.26em]">
                Algoritma JAYA &amp; Simulated Annealing
              </p>
              <span className="h-px flex-1 bg-gradient-to-l from-transparent to-gold/70 sm:w-20 sm:flex-none" aria-hidden="true" />
            </div>
          </div>

          <p className="mx-auto mt-5 max-w-xl font-body text-[15px] italic leading-relaxed text-parchment-200/75 sm:text-base">
            “Dua algoritma metaheuristik, satu tujuan: menemukan solusi terbaik di antara tak terhingga kemungkinan.”
          </p>

          {/* Dua lambang */}
          <div className="mt-7 flex items-end justify-center gap-8 sm:gap-14">
            <div className="flex flex-col items-center">
              <CrestJaya className="h-20 w-auto drop-shadow-[0_8px_24px_rgba(0,0,0,.6)] sm:h-24" />
              <span className="mt-1.5 font-heading text-[8px] uppercase tracking-[0.24em] text-[#a9c79b] sm:text-[9px]">
                Berbasis Populasi
              </span>
              <span className="font-body text-[10px] italic text-parchment-300/55">JAYA</span>
            </div>
            <div className="mb-8 h-16 w-px bg-gradient-to-b from-transparent via-gold/40 to-transparent" aria-hidden="true" />
            <div className="flex flex-col items-center">
              <CrestSa className="h-20 w-auto drop-shadow-[0_8px_24px_rgba(0,0,0,.6)] sm:h-24" />
              <span className="mt-1.5 font-heading text-[8px] uppercase tracking-[0.24em] text-[#f0a06a] sm:text-[9px]">
                Solusi Tunggal
              </span>
              <span className="font-body text-[10px] italic text-parchment-300/55">Simulated Annealing</span>
            </div>
          </div>

          <div className="mt-9 flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
            <WaxSealButton
              label="Mulai"
              sublabel="Lihat daftar isi"
              href="#peta"
              dark
              ariaLabel="Mulai, lihat daftar isi"
            />
            <a
              href="#jaya"
              className="group inline-flex min-h-[44px] items-center gap-2 border border-parchment-200/25 px-4 py-2 font-heading text-[10px] font-semibold uppercase tracking-[0.22em] text-parchment-200/85 transition-colors hover:border-gold/60 hover:text-gold-light"
            >
              Langsung ke Algoritma JAYA
              <svg viewBox="0 0 24 24" className="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" aria-hidden="true">
                <path d="M5 12h13M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </div>
        </motion.div>
      </div>

      <div className="absolute inset-x-0 bottom-0 flex h-6 items-center">
        <div className="w-full text-gold/40">
          <OrnamentDivider motif="star" />
        </div>
      </div>
    </section>
  )
}

export function KingdomMap() {
  const reduce = useReducedMotion()
  const sections = [
    { id: 'pengantar', numeral: 'I', title: 'Pengantar', detail: 'Apa itu metaheuristik, dan mengapa dua algoritma ini berbeda.', accent: 'gold' },
    { id: 'jaya', numeral: 'II', title: 'Algoritma JAYA', detail: 'Definisi · Karakteristik · Keunggulan & Kelemahan · Cara Kerja · Simulator', accent: 'forest' },
    { id: 'sa', numeral: 'III', title: 'Simulated Annealing', detail: 'Definisi · Karakteristik · Keunggulan & Kelemahan · Cara Kerja · Simulator & Visualisasi 3D', accent: 'ember' },
    { id: 'arena', numeral: 'IV', title: 'Perbandingan', detail: 'Tabel perbandingan dan simulasi berdampingan dengan anggaran evaluasi yang sama.', accent: 'gold' },
    { id: 'arsip', numeral: 'V', title: 'Referensi', detail: 'Dua paper sumber materi presentasi.', accent: 'gold' },
    { id: 'penutup', numeral: 'VI', title: 'Penutup', detail: 'Kelompok 4 Kelas C, Institut Teknologi Sepuluh Nopember.', accent: 'gold' },
  ]

  return (
    <section id="peta" aria-labelledby="peta-title" className="relative scroll-mt-24 py-16 sm:py-20 lg:py-24">
      <div className="page-shell">
        <div className="mb-8 text-center">
          <p className="eyebrow mb-2">Navigasi</p>
          <h2 id="peta-title" className="display-title text-[clamp(1.6rem,3.6vw,2.4rem)] text-leather-800">
            Daftar Isi
          </h2>
          <p className="mx-auto mt-2 max-w-lg font-body text-[15px] italic text-leather-600">
            Enam bagian utama. Pilih salah satu untuk melompat ke bagian tersebut.
          </p>
        </div>

        <div className="relative">
          {/* Bilah atas/bawah */}
          <div aria-hidden="true" className="relative z-10 mx-auto h-3 w-[98%] rounded-full bg-gradient-to-b from-[#8a5a2b] via-[#6b4423] to-[#3d2612] shadow-[0_2px_6px_rgba(31,18,8,.45)]" />
          <div className="parchment-card relative -my-1 px-3 py-5 sm:px-6">
            <div aria-hidden="true" className="absolute inset-y-0 left-2 w-px bg-gradient-to-b from-transparent via-gold/30 to-transparent" />
            <div aria-hidden="true" className="absolute inset-y-0 right-2 w-px bg-gradient-to-b from-transparent via-gold/30 to-transparent" />
            <ol className="grid gap-1.5 sm:grid-cols-2">
              {sections.map((section, index) => {
                const accentText = section.accent === 'forest' ? 'text-forest' : section.accent === 'ember' ? 'text-ember' : 'text-gold'
                return (
                  <motion.li
                    key={section.id}
                    initial={reduce ? false : { opacity: 0, x: -8 }}
                    whileInView={reduce ? undefined : { opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{ duration: 0.45, delay: index * 0.05, ease: [0.22, 0.8, 0.3, 1] }}
                  >
                    <a
                      href={`#${section.id}`}
                      className="group flex items-start gap-3 border-b border-leather-700/15 px-2 py-2.5 transition-colors hover:bg-parchment-50/50"
                    >
                      <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gold/40 bg-parchment-50/70 font-display text-[11px] font-bold ${accentText}`}>
                        {section.numeral}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-heading text-[13px] font-semibold uppercase tracking-[0.1em] text-leather-800 transition-colors group-hover:text-leather-900">
                          {section.title}
                        </span>
                        <span className="mt-0.5 block font-body text-[12px] leading-snug text-leather-600/85">
                          {section.detail}
                        </span>
                      </span>
                      <svg viewBox="0 0 24 24" className="mt-1 h-4 w-4 shrink-0 text-gold/50 transition-transform group-hover:translate-x-0.5 group-hover:text-gold" fill="none" aria-hidden="true">
                        <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </a>
                  </motion.li>
                )
              })}
            </ol>
          </div>
          <div aria-hidden="true" className="relative z-10 mx-auto h-3 w-[98%] rounded-full bg-gradient-to-t from-[#8a5a2b] via-[#6b4423] to-[#3d2612] shadow-[0_-2px_6px_rgba(31,18,8,.35)]" />
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {intro.contrast.map((card) => (
            <a
              key={card.key}
              href={`#${card.key}`}
              className={`group border p-3 transition-colors ${
                card.key === 'jaya'
                  ? 'border-forest/30 bg-forest/5 hover:border-forest/50'
                  : 'border-ember/30 bg-ember/5 hover:border-ember/50'
              }`}
            >
              <p className={`font-heading text-[9px] uppercase tracking-[0.2em] ${card.key === 'jaya' ? 'text-forest' : 'text-ember'}`}>
                {card.key === 'jaya' ? 'JAYA' : 'SA'}
              </p>
              <p className="mt-0.5 font-heading text-sm font-semibold text-leather-800">{card.title}</p>
              <p className="mt-1 font-body text-[12px] leading-snug text-leather-700/85">{card.text}</p>
            </a>
          ))}
          <div className="border border-gold/30 bg-gold/5 p-3">
            <p className="font-heading text-[9px] uppercase tracking-[0.2em] text-gold">Tambahan</p>
            <p className="mt-0.5 font-heading text-sm font-semibold text-leather-800">Tiga visualisasi 3D</p>
            <p className="mt-1 font-body text-[12px] leading-snug text-leather-700/85">
              Visualisasi lanskap fungsi, proses pendinginan logam, dan pergerakan populasi JAYA — semuanya bisa diputar.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}