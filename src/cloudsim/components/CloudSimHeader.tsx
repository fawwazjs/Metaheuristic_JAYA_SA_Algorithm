import { CrestMonogram } from '../../components/ornaments/Ornaments'

const LINKS = [
  { href: '#lingkungan', label: 'Lingkungan' },
  { href: '#replay', label: 'Replay' },
  { href: '#perbandingan', label: 'Perbandingan' },
  { href: '#cli', label: 'Cara Menjalankan' },
]

export function CloudSimHeader() {
  return (
    <header className="sticky top-0 z-50">
      <div className="wood-panel relative border-b border-gold/40">
        <div className="page-shell flex h-[62px] items-center justify-between gap-3 sm:h-[70px]">
          <a href="#awal" className="group flex min-w-0 items-center gap-2.5" aria-label="Ke awal halaman simulasi">
            <CrestMonogram className="h-9 w-9 shrink-0 sm:h-10 sm:w-10" />
            <span className="min-w-0">
              <span className="block truncate font-display text-[13px] font-bold leading-tight tracking-[0.2em] text-parchment-100 sm:text-[15px]">
                <span className="hidden sm:inline">SIMULASI </span>CLOUDSIM
              </span>
              <span className="hidden font-heading text-[8px] uppercase tracking-[0.3em] text-gold-light/70 sm:block">
                JAYA di CloudSim Plus 8.0.0
              </span>
            </span>
          </a>

          <nav aria-label="Bagian halaman simulasi" className="hidden items-center gap-1 lg:flex">
            {LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="flex min-h-[44px] items-center px-2.5 font-heading text-[10px] font-semibold uppercase tracking-[0.18em] text-parchment-200/80 transition-colors hover:text-gold-light"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <a
            href={import.meta.env.BASE_URL}
            className="flex min-h-[44px] shrink-0 items-center border border-gold/35 px-3 font-heading text-[10px] font-semibold uppercase tracking-[0.16em] text-parchment-100 transition-colors hover:border-gold-light/70 hover:text-gold-light"
          >
            Materi JAYA &amp; SA
          </a>
        </div>
      </div>
    </header>
  )
}
