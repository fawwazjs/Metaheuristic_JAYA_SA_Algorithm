import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useScroll, useSpring } from 'framer-motion'
import { navSections } from '../../lib/content'
import { useScrollSpy } from '../../lib/hooks'
import { CrestMonogram, FleurDeLis } from '../ornaments/Ornaments'

const NAV_ITEMS = [
  { id: 'gerbang', label: 'Awal', detail: 'Pendahuluan' },
  { id: 'peta', label: 'Daftar Isi', detail: 'Navigasi' },
  { id: 'jaya', label: 'JAYA', detail: 'Algoritma JAYA' },
  { id: 'sa', label: 'SA', detail: 'Simulated Annealing' },
  { id: 'arena', label: 'Perbandingan', detail: 'JAYA vs SA' },
  { id: 'arsip', label: 'Referensi', detail: 'Sumber' },
  { id: 'penutup', label: 'Penutup', detail: 'Terima kasih' },
]

const IDS = NAV_ITEMS.map((item) => item.id)

export function Navbar() {
  const active = useScrollSpy(IDS)
  const [open, setOpen] = useState(false)
  const { scrollYProgress } = useScroll()
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 24, mass: 0.3 })

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <header className="sticky top-0 z-50">
      <div className="wood-panel relative border-b border-gold/40">
        <div className="page-shell flex h-[62px] items-center justify-between gap-3 sm:h-[70px]">
          <a
            href="#gerbang"
            className="group flex min-w-0 items-center gap-2.5"
            aria-label="Kembali ke bagian awal"
          >
            <CrestMonogram className="h-9 w-9 shrink-0 transition-transform duration-500 group-hover:-rotate-3 sm:h-10 sm:w-10" />
            <span className="min-w-0">
              <span className="block truncate font-display text-[13px] font-bold leading-tight tracking-[0.22em] text-parchment-100 sm:text-[15px]">
                METAHEURISTIK
              </span>
              <span className="hidden font-heading text-[8px] uppercase tracking-[0.3em] text-gold-light/70 sm:block">
                JAYA &amp; Simulated Annealing
              </span>
            </span>
          </a>

          <nav aria-label="Navigasi bagian" className="hidden items-center gap-0.5 lg:flex">
            {NAV_ITEMS.map((item) => {
              const isActive = active === item.id
              return (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  aria-current={isActive ? 'location' : undefined}
                  className={`group relative flex min-h-[44px] flex-col items-center justify-center px-2.5 py-1 transition-colors duration-300 ${
                    isActive ? 'text-gold-light' : 'text-parchment-200/75 hover:text-parchment-50'
                  }`}
                >
                  <span className="font-heading text-[10px] font-semibold uppercase tracking-[0.18em]">
                    {item.label}
                  </span>
                  <span className="font-body text-[9px] italic tracking-wide text-parchment-300/45">
                    {item.detail}
                  </span>
                  <span
                    aria-hidden="true"
                    className={`absolute bottom-0 h-px transition-all duration-500 ${
                      isActive ? 'w-7 bg-gold-light' : 'w-0 bg-gold-light/50 group-hover:w-3'
                    }`}
                  />
                </a>
              )
            })}
          </nav>

          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-1.5 border border-gold/25 px-2.5 py-1 font-heading text-[8px] uppercase tracking-[0.2em] text-parchment-300/70 xl:inline-flex">
              <FleurDeLis className="h-3.5 w-3.5 text-gold-light/70" />
              Kelompok 4 · Kelas C
            </span>
            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? 'Tutup daftar navigasi' : 'Buka daftar navigasi'}
              className="flex h-11 w-11 items-center justify-center border border-gold/35 bg-black/20 text-parchment-100 transition-colors hover:border-gold-light/60 hover:text-gold-light lg:hidden"
            >
              {open ? (
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
                  <path d="M7 4h11a2 2 0 0 1 2 2v1H9a2.5 2.5 0 0 0 0 5h9a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H7" stroke="currentColor" strokeWidth="1.4" />
                  <path d="M7 4a2.5 2.5 0 0 0 0 5M7 16a2.5 2.5 0 0 0 0 5h11" stroke="currentColor" strokeWidth="1.4" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 h-[2px] bg-black/30" aria-hidden="true">
          <motion.div
            className="h-full origin-left bg-gradient-to-r from-gold via-gold-light to-gold"
            style={{ scaleX: progress }}
          />
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: [0.22, 0.8, 0.3, 1] }}
            className="absolute inset-x-0 top-full mx-auto w-full max-w-[560px] px-3 lg:hidden"
          >
            <div className="parchment-card relative overflow-hidden border-t-0 p-3 shadow-2xl">
              <div className="absolute inset-x-3 top-2 h-1 rounded-full bg-leather-600/30 shadow-inner" aria-hidden="true" />
              <div className="mt-2 grid grid-cols-2 gap-1">
                {NAV_ITEMS.map((item) => {
                  const isActive = active === item.id
                  return (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      onClick={() => setOpen(false)}
                      aria-current={isActive ? 'location' : undefined}
                      className={`flex min-h-[48px] items-center gap-2 border px-3 py-2 transition-colors ${
                        isActive
                          ? 'border-gold/50 bg-leather-700/10 text-leather-900'
                          : 'border-leather-700/15 text-leather-700 hover:border-gold/40 hover:bg-parchment-50/50'
                      }`}
                    >
                      <FleurDeLis className={`h-4 w-4 shrink-0 ${isActive ? 'text-wax' : 'text-gold/60'}`} />
                      <span>
                        <span className="block font-heading text-[10px] font-semibold uppercase tracking-[0.16em]">
                          {item.label}
                        </span>
                        <span className="block text-[11px] italic text-leather-600/75">{item.detail}</span>
                      </span>
                    </a>
                  )
                })}
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-leather-700/15 pt-2">
                <span className="font-heading text-[8px] uppercase tracking-[0.2em] text-leather-600/70">
                  {navSections.find((s) => s.id === active)?.style ?? 'Daftar Isi'}
                </span>
                <span className="font-body text-[11px] italic text-leather-600/70">Kelompok 4 Kelas C</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}