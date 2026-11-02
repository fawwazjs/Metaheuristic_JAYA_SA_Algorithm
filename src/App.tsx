import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Navbar } from './components/layout/Navbar'
import { Footer } from './components/layout/Footer'
import { Hero, KingdomMap } from './components/content/Hero'
import { IntroSection, ArenaSection, ReferenceSection, ClosingSection } from './components/content/Sections'
import { JayaChapter } from './components/content/JayaChapter'
import { SaChapter } from './components/content/SaChapter'
import { CrestMonogram, FleurDeLis } from './components/ornaments/Ornaments'

function useIntroCurtain() {
  const reduce = useReducedMotion()
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    if (reduce) {
      setVisible(false)
      return
    }
    const timer = window.setTimeout(() => setVisible(false), 1250)
    return () => window.clearTimeout(timer)
  }, [reduce])

  return { visible, dismiss: () => setVisible(false), reduce }
}

export default function App() {
  const { visible, dismiss, reduce } = useIntroCurtain()

  return (
    <>
      <a
        href="#gerbang"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-[70] focus:border focus:border-gold focus:bg-leather-900 focus:px-3 focus:py-2 focus:font-heading focus:text-[11px] focus:uppercase focus:tracking-widest focus:text-parchment-50"
      >
        Lompat ke konten
      </a>

      <AnimatePresence>
        {visible && (
          <motion.div
            key="curtain"
            className="fixed inset-0 z-[80] flex flex-col items-center justify-center bg-leather-900 text-parchment-100"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.5, ease: [0.22, 0.8, 0.3, 1] } }}
            onClick={dismiss}
            role="presentation"
          >
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-40">
              <div className="page-noise absolute inset-0" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_45%,rgba(184,134,43,.22),transparent_60%)]" />
            </div>
            <motion.div
              initial={{ scale: 0.86, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, ease: [0.22, 0.8, 0.3, 1] }}
              className="relative flex flex-col items-center"
            >
              <CrestMonogram className="h-16 w-16" />
              <p className="mt-4 font-display text-[13px] font-bold tracking-[0.34em] text-parchment-100">
                METAHEURISTIK
              </p>
              <div className="mt-2 flex items-center gap-2">
                <FleurDeLis className="h-3 w-3 text-gold-light/70" />
                <p className="font-heading text-[8px] uppercase tracking-[0.28em] text-gold-light/70">
                  Memuat halaman
                </p>
                <FleurDeLis className="h-3 w-3 text-gold-light/70" />
              </div>
              <div className="mt-4 h-px w-40 overflow-hidden bg-parchment-300/20">
                <motion.div
                  className="h-full bg-gradient-to-r from-gold to-gold-light"
                  initial={{ x: '-100%' }}
                  animate={{ x: '0%' }}
                  transition={{ duration: 1.1, ease: 'easeInOut' }}
                />
              </div>
              <button
                type="button"
                onClick={dismiss}
                className="mt-5 font-heading text-[8px] uppercase tracking-[0.24em] text-parchment-300/55 transition-colors hover:text-gold-light"
              >
                Lewati (klik di mana saja)
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[60]">
        <div className="page-noise absolute inset-0 opacity-[0.13]" />
        <div className="page-blotch absolute inset-0 opacity-[0.16]" />
        <div className="absolute inset-0 shadow-[inset_0_0_140px_60px_rgba(78,49,25,.22)]" />
        {!reduce && (
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-parchment-100/60 to-transparent" />
        )}
      </div>

      <div className="relative">
        <Navbar />
        <main id="konten">
          <Hero />
          <KingdomMap />
          <IntroSection />
          <JayaChapter />
          <SaChapter />
          <ArenaSection />
          <ReferenceSection />
          <ClosingSection />
        </main>
        <Footer />
      </div>
    </>
  )
}