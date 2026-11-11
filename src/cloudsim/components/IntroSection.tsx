import { formatNumber } from '../../lib/algorithms/rng'
import { OrnamentLabel } from '../../components/ornaments/Ornaments'
import type { Summary } from '../data'
import { percent, seconds, type Findings } from '../replay'

function generatedAt(iso: string): string {
  const date = new Date(iso)
  return Number.isNaN(date.getTime())
    ? iso
    : date.toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })
}

/** Pembuka halaman: apa yang disimulasikan dan temuan utamanya, dihitung dari summary.json. */
export function IntroSection({ summary, findings }: { summary: Summary; findings: Findings }) {
  const maxVms = Math.max(...summary.scenarios.map((s) => s.vms))
  const winners = Object.entries(findings.wins).sort((a, b) => b[1] - a[1])
  const nasa = findings.nasa

  const items: { lead: string; body: string }[] = []
  if (findings.jayaVsSa !== null) {
    const winnerText = winners.map(([name, count]) => `${name} di ${count}`).join(', ')
    const tieText = findings.ties
      .map(
        (tie) =>
          ` Seri di ${tie.scenario} (${tie.algorithms.join(' dan ')})${tie.atJobBound ? ', keduanya tepat di batas job terbesar sehingga tidak mungkin lebih cepat' : ''}.`,
      )
      .join('')
    items.push({
      lead: `${formatNumber(findings.jayaVsSa, 1)}×`,
      body: `Makespan JAYA rata-rata ${formatNumber(findings.jayaVsSa, 1)} kali makespan SA pada ${findings.goCjCount} skenario GoCJ. Tercepat per skenario: ${winnerText}.${tieText} JAYA murni menggeser semua task sekaligus di setiap iterasi, jadi perbaikannya lambat pada ratusan task.`,
    })
  }
  if (findings.jayaVsRoundRobin !== null) {
    items.push({
      lead: percent(findings.jayaVsRoundRobin, 0),
      body: `Penurunan makespan JAYA dibanding Round Robin, rata-rata pada skenario GoCJ. Mencari dengan fitness tetap jauh lebih baik daripada membagi task bergiliran tanpa melihat kecepatan VM.`,
    })
  }
  if (nasa) {
    items.push({
      lead: seconds(nasa.jaya.makespan.mean),
      body: `Pada log NASA (dataset paper Mishra dkk.), makespan JAYA berperingkat ${nasa.jayaRank} dari ${nasa.algorithms}${
        nasa.atJobBound ? ', tepat di batas job terbesar sehingga tidak mungkin lebih cepat' : ''
      }. Waktu respons rata-ratanya berperingkat ${nasa.jayaResponseRank} dari ${nasa.algorithms}, jadi job lain menunggu lebih lama.`,
    })
  }

  return (
    <section id="awal" aria-labelledby="awal-title" className="page-shell scroll-mt-24 py-12 sm:py-16 lg:py-20">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-14 [&>*]:min-w-0">
        <div>
          <OrnamentLabel>Simulasi CloudSim · Kelompok 4</OrnamentLabel>
          <h1 id="awal-title" className="display-title mt-4 text-balance break-words text-[clamp(1.6rem,3.6vw,2.75rem)] leading-[1.08] text-leather-800">
            Menjadwalkan Task dengan JAYA di CloudSim
          </h1>
          <p className="mt-5 max-w-prose font-body text-[clamp(1.05rem,1.6vw,1.2rem)] leading-relaxed text-ink/85">
            Ratusan sampai ribuan job dari dataset nyata dibagi ke {maxVms} VM di {summary.infrastructure.datacenters.length}{' '}
            datacenter. JAYA mencari pembagian yang membuat semua job selesai
            paling cepat (makespan terkecil), lalu hasilnya dijalankan di CloudSim Plus dan dibandingkan dengan Simulated Annealing,
            Sufferage, dan Round Robin.
          </p>
          <p className="mt-4 max-w-prose font-body text-[15px] italic text-leather-600">
            Semua angka di halaman ini dibaca dari hasil perintah <code className="font-mono text-[13px] not-italic">./sim run</code>{' '}
            ({summary.simulator}, {formatNumber(findings.totalRuns, 0)} run), dibuat {generatedAt(summary.generatedAt)}.
          </p>
        </div>

        <div>
          <h2 className="label-cinzel mb-4">Temuan utama</h2>
          <ol className="divide-y divide-leather-700/15 border-y border-leather-700/20">
            {items.map((item) => (
              <li key={item.lead} className="grid gap-x-5 gap-y-1 py-4 sm:grid-cols-[10rem_minmax(0,1fr)]">
                <p className="whitespace-nowrap font-mono text-[24px] font-semibold leading-tight text-leather-900">{item.lead}</p>
                <p className="font-body text-[16px] leading-relaxed text-ink/85">{item.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
