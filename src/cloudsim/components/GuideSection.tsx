import { useState } from 'react'
import { SectionFrame } from '../../components/layout/SectionFrame'

const COMMANDS = `cd cloudsim-jaya
mvn -q package          # sekali saja: build dan jalankan tes
./sim                   # wizard uji coba: pilih skenario, tonton prosesnya di terminal
./sim custom --dataset gocj --tasks 300 --vms 20 --algo jaya,sa --runs 3
./sim info              # infrastruktur, dataset, skenario
./sim run               # 16 skenario resmi (sekitar 4,5 menit), tampil di halaman ini`

const WORKFLOWS = [
  {
    title: 'Dua terminal (disarankan)',
    steps: [
      'Terminal 1: npm run dev, lalu biarkan menyala.',
      'Terminal 2: cd cloudsim-jaya, lalu ./sim run sesuai kebutuhan.',
      'Setelah CLI selesai, muat ulang halaman ini.',
    ],
  },
  {
    title: 'Uji coba sambil presentasi',
    steps: [
      'Jalankan ./sim (wizard) atau ./sim custom di terminal.',
      'Prosesnya tampil langsung di terminal: makespan turun, beban VM berubah, lalu tabel hasil.',
      'Hasil uji coba disimpan terpisah di results/custom/ dan tidak mengubah grafik di halaman ini.',
    ],
  },
  {
    title: 'Satu terminal',
    steps: ['Jalankan ./sim run sampai selesai.', 'Lalu jalankan npm run dev dari folder utama.'],
  },
  {
    title: 'Hanya melihat hasil',
    steps: [
      'Cukup npm run dev, tanpa Java dan Maven.',
      'Data run terakhir sudah tersimpan di public/data/cloudsim/ dan ikut di-commit.',
    ],
  },
]

const LIMITATIONS = [
  'Yang diimplementasikan adalah JAYA standar sesuai slide. Metode di paper Mishra dkk. menambahkan load balancing dan konversi biner, jadi angka paper tidak bisa dibandingkan langsung.',
  'Fitness = makespan saja, sama dengan SA. Rumus fitness di slide dan paper (F1 = 1/MS × ARU × AT) arahnya bertentangan dengan pemilihan P_best dari F terkecil.',
  'Semua task tersedia di detik 0 dan tidak ada waktu transfer data. Kedatangan bertahap belum dimodelkan.',
  'Spesifikasi host dan VM dipilih dari rentang Tabel 2 paper; nilai persisnya keputusan tim.',
  'Energi dihitung dengan rumus Eq. 23–24 paper, bukan model daya CloudSim, jadi hanya berguna untuk perbandingan relatif.',
  'Pada log NASA, satu job raksasa menentukan makespan, sehingga perbedaan algoritma lebih terlihat pada waktu respons.',
]

const REFERENCES = [
  'Hussain, A., & Aleem, M. (2018). GoCJ: Google cloud jobs dataset for distributed and cloud computing infrastructures. Data, 3(4), 38. https://doi.org/10.3390/data3040038',
  'Feitelson, D. G., & Nitzberg, B. (1995). Job characteristics of a production parallel scientific workload on the NASA Ames iPSC/860. Dalam Job Scheduling Strategies for Parallel Processing (hlm. 337–360). Springer. https://doi.org/10.1007/3-540-60153-8_38',
  'Maheswaran, M., Ali, S., Siegel, H. J., Hensgen, D., & Freund, R. F. (1999). Dynamic mapping of a class of independent tasks onto heterogeneous computing systems. Journal of Parallel and Distributed Computing, 59(2), 107–131. https://doi.org/10.1006/jpdc.1999.1581',
  'Mishra, K., Pati, J., & Majhi, S. K. (2022). A dynamic load scheduling in IaaS cloud using binary JAYA algorithm. Journal of King Saud University – Computer and Information Sciences, 34(8), 4914–4930. https://doi.org/10.1016/j.jksuci.2020.12.001',
  'Rao, R. V. (2016). Jaya: A simple and new optimization algorithm for solving constrained and unconstrained optimization problems. International Journal of Industrial Engineering Computations, 7, 19–34. https://doi.org/10.5267/j.ijiec.2015.8.004',
  'Silva Filho, M. C., Oliveira, R. L., Monteiro, C. C., Inácio, P. R. M., & Freire, M. M. (2017). CloudSim Plus: A cloud computing simulation framework pursuing software engineering principles for improved modularity, extensibility and correctness. Dalam 2017 IFIP/IEEE Symposium on Integrated Network and Service Management (hlm. 400–406). IEEE. https://doi.org/10.23919/INM.2017.7987304',
]

function CopyCommands() {
  const [copied, setCopied] = useState<'idle' | 'done' | 'failed'>('idle')
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(COMMANDS)
      setCopied('done')
    } catch {
      setCopied('failed')
    }
  }
  return (
    <div className="relative">
      <pre className="overflow-x-auto bg-leather-900 p-4 font-mono text-[13px] leading-relaxed text-parchment-100">
        <code>{COMMANDS}</code>
      </pre>
      <div className="mt-2 flex items-center gap-3">
        <button type="button" onClick={copy} className="btn-ritual">
          Salin perintah
        </button>
        <span role="status" className="font-body text-[14px] italic text-leather-600">
          {copied === 'done' ? 'Tersalin ke clipboard.' : copied === 'failed' ? 'Browser menolak akses clipboard; salin manual dari kotak di atas.' : ''}
        </span>
      </div>
    </div>
  )
}

export function GuideSection() {
  return (
    <SectionFrame
      id="cli"
      eyebrow="Cara menjalankan"
      title="Dari Terminal ke Halaman Ini"
      subtitle="Simulasi dijalankan lewat CLI di folder cloudsim-jaya. Hasil ./sim run otomatis disalin ke data halaman ini; uji coba lewat ./sim disimpan terpisah."
      motif="anvil"
    >
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] [&>*]:min-w-0">
        <div>
          <CopyCommands />
          <p className="mt-4 font-body text-[15px] leading-relaxed text-ink/85">
            Butuh Java 17 atau lebih baru dan Maven. Daftar lengkap opsi ada di <code className="font-mono text-[13px]">./sim help</code>
            , dan panduan lengkap di <code className="font-mono text-[13px]">cloudsim-jaya/README.md</code>.
          </p>
        </div>
        <ol className="space-y-5">
          {WORKFLOWS.map((workflow, i) => (
            <li key={workflow.title} className="grid grid-cols-[2rem_minmax(0,1fr)] gap-x-3">
              <span className="font-display text-[22px] leading-none text-gold" aria-hidden="true">
                {['I', 'II', 'III', 'IV'][i]}
              </span>
              <div>
                <h3 className="font-heading text-[14px] font-semibold uppercase tracking-[0.12em] text-leather-800">{workflow.title}</h3>
                <ul className="mt-1 space-y-1 font-body text-[15px] leading-relaxed text-ink/85">
                  {workflow.steps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-12 grid gap-10 lg:grid-cols-2 [&>*]:min-w-0">
        <div>
          <h3 className="label-cinzel mb-3">Keterbatasan yang perlu diketahui</h3>
          <ul className="list-disc space-y-2 pl-5 font-body text-[15px] leading-relaxed text-ink/85 marker:text-gold">
            {LIMITATIONS.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="label-cinzel mb-3">Referensi</h3>
          <ul className="space-y-2 font-body text-[14px] leading-relaxed text-leather-700">
            {REFERENCES.map((reference) => (
              <li key={reference} className="break-words pl-4 -indent-4">
                {reference}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </SectionFrame>
  )
}
