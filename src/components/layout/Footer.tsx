import { identity } from '../../lib/content'
import { CrestMonogram, FleurDeLis, OrnamentDivider } from '../ornaments/Ornaments'

export function Footer() {
  return (
    <footer className="stone-panel relative overflow-hidden text-parchment-200">
      <div className="pointer-events-none absolute inset-0 opacity-40" aria-hidden="true">
        <div className="page-blotch absolute inset-0" />
      </div>
      <div className="page-shell relative py-12 sm:py-16">
        <div className="flex flex-col items-center text-center">
          <CrestMonogram className="h-14 w-14" />
          <p className="mt-4 font-display text-lg font-bold tracking-[0.24em] text-parchment-100">
            METAHEURISTIK
          </p>
          <p className="mt-1 font-body text-[15px] italic text-parchment-300/80">
            Algoritma JAYA &amp; Simulated Annealing
          </p>
          <div className="mt-5 w-full max-w-md text-gold/60">
            <OrnamentDivider motif="crown" />
          </div>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2">
            <h3 className="flex items-center gap-2 font-heading text-[10px] font-semibold uppercase tracking-[0.24em] text-gold-light/80">
              <FleurDeLis className="h-3.5 w-3.5" /> Daftar Anggota Kelompok
            </h3>
            <ul className="mt-3 grid gap-x-8 gap-y-1.5 sm:grid-cols-2">
              {identity.members.map((member) => (
                <li
                  key={member.nrp}
                  className="flex items-baseline justify-between gap-2 border-b border-parchment-300/10 pb-1 text-[13px]"
                >
                  <span className="text-parchment-200/90">{member.name}</span>
                  <span className="shrink-0 font-mono text-[11px] text-gold-light/60">{member.nrp}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-heading text-[10px] font-semibold uppercase tracking-[0.24em] text-gold-light/80">
              Institusi
            </h3>
            <p className="mt-3 text-[13px] leading-relaxed text-parchment-200/80">
              {identity.group}
              <br />
              {identity.institution}
            </p>
            <p className="mt-2 text-[12px] italic text-parchment-300/55">
              Materi dari presentasi kuliah Metaheuristik.
            </p>
          </div>
          <div>
            <h3 className="font-heading text-[10px] font-semibold uppercase tracking-[0.24em] text-gold-light/80">
              Bagian
            </h3>
            <ul className="mt-3 space-y-1 text-[13px]">
              {[
                { href: `${import.meta.env.BASE_URL}#jaya`, label: 'Algoritma JAYA' },
                { href: `${import.meta.env.BASE_URL}#sa`, label: 'Simulated Annealing' },
                { href: `${import.meta.env.BASE_URL}#arena`, label: 'Perbandingan' },
                { href: `${import.meta.env.BASE_URL}#arsip`, label: 'Referensi' },
                { href: `${import.meta.env.BASE_URL}cloudsim/`, label: 'Simulasi CloudSim JAYA' },
              ].map((item) => (
                <li key={item.href}>
                  <a href={item.href} className="text-parchment-200/80 transition-colors hover:text-gold-light">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center gap-2 border-t border-parchment-300/10 pt-5 text-center">
          <p className="font-body text-[12px] italic text-parchment-300/50">
            Seluruh ornamen, tekstur, dan ilustrasi dibuat orisinal dengan CSS, SVG, dan canvas.
          </p>
          <p className="font-heading text-[9px] uppercase tracking-[0.28em] text-parchment-300/40">
            {new Date().getFullYear()} · Kelompok 4 Kelas C
          </p>
        </div>
      </div>
    </footer>
  )
}