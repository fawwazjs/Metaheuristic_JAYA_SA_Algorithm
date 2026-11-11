import { formatNumber } from '../../lib/algorithms/rng'
import { SectionFrame } from '../../components/layout/SectionFrame'
import type { Summary } from '../data'
import { datacenterLabel } from '../replay'

/** Satu sayap datacenter: host berderet, masing-masing dengan core-nya. */
function DatacenterWing({
  name,
  mips,
  hosts,
  pes,
  vms,
  vmsPerType,
}: {
  name: string
  mips: number
  hosts: number
  pes: number
  vms: number
  vmsPerType: number
}) {
  return (
    <div className="parchment-inset p-4">
      <p className="font-heading text-[13px] font-semibold uppercase tracking-[0.16em] text-leather-800">{datacenterLabel(name)}</p>
      <p className="font-body text-[14px] italic text-leather-600">
        {hosts} host · {pes} core × {formatNumber(mips, 0)} MIPS
      </p>
      <ul className="mt-3 grid grid-cols-5 gap-1.5" aria-label={`${hosts} host di ${datacenterLabel(name)}`}>
        {Array.from({ length: hosts }, (_, h) => (
          <li key={h} className="border border-leather-700/30 bg-parchment-100 p-1" title={`Host ${h + 1}`}>
            <span className="grid grid-cols-3 gap-0.5" aria-hidden="true">
              {Array.from({ length: pes }, (_, p) => (
                <span key={p} className="h-1.5 bg-leather-600/55" />
              ))}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3 font-body text-[14px] text-leather-700">
        Menampung {vms} VM ({vmsPerType} dari setiap tipe).
      </p>
    </div>
  )
}

export function EnvironmentSection({ summary }: { summary: Summary }) {
  const infra = summary.infrastructure
  const jaya = summary.parameters.jaya
  const sa = summary.parameters.sa
  const maxVms = Math.max(...summary.scenarios.map((s) => s.vms))
  const vmsPerDatacenter = maxVms / infra.datacenters.length
  const hosts = infra.hostsPerDatacenter * infra.datacenters.length

  return (
    <SectionFrame
      id="lingkungan"
      eyebrow="Lingkungan simulasi"
      title={`${infra.datacenters.length} Datacenter, ${hosts} Host, ${maxVms} VM`}
      subtitle="Desain infrastruktur Tugas 2A Kelompok 4, dengan spesifikasi VM diambil dari rentang Tabel 2 Mishra dkk. (2022)."
      motif="fleur"
    >
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] [&>*]:min-w-0">
        <div>
          <div className="grid gap-4 sm:grid-cols-2">
            {infra.datacenters.map((name, i) => (
              <DatacenterWing
                key={name}
                name={name}
                mips={infra.hostPeMips[i]}
                hosts={infra.hostsPerDatacenter}
                pes={infra.hostPes}
                vms={vmsPerDatacenter}
                vmsPerType={vmsPerDatacenter / infra.vmTypes.length}
              />
            ))}
          </div>
          <p className="mt-4 font-body text-[15px] leading-relaxed text-ink/85">
            Setiap task (cloudlet) memakai 1 core dan dikerjakan bergantian di VM tujuannya (
            <code className="font-mono text-[13px]">{infra.cloudletScheduler}</code>). Semua task sudah tersedia di detik 0, jadi
            penjadwal membagi satu kumpulan task sekaligus. Bila VM punya 2 atau 3 core, sebanyak itu task berjalan bersamaan.
          </p>
        </div>

        <div className="space-y-6">
          <table className="data-table w-full">
            <caption className="mb-2 text-left font-heading text-[11px] font-semibold uppercase tracking-[0.16em] text-leather-700">
              {infra.vmTypes.length} tipe VM, {maxVms / infra.vmTypes.length} VM per tipe
            </caption>
            <thead>
              <tr>
                <th scope="col">Tipe</th>
                <th scope="col">MIPS</th>
                <th scope="col">Core</th>
                <th scope="col">RAM</th>
              </tr>
            </thead>
            <tbody>
              {infra.vmTypes.map((type) => (
                <tr key={type.name}>
                  <th scope="row">{type.name}</th>
                  <td>{formatNumber(type.mips, 0)}</td>
                  <td>{type.pes}</td>
                  <td>{formatNumber(infra.vmRamMb, 0)} MB</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div>
            <h3 className="label-cinzel mb-2">Parameter algoritma</h3>
            <dl className="space-y-2 font-body text-[15px] text-ink/85">
              <div>
                <dt className="inline font-semibold text-leather-800">JAYA: </dt>
                <dd className="inline">
                  {jaya.population} kandidat × {jaya.iterations} iterasi ({formatNumber(jaya.evaluations, 0)} evaluasi). Tanpa
                  parameter khusus.
                </dd>
              </div>
              <div>
                <dt className="inline font-semibold text-leather-800">SA: </dt>
                <dd className="inline">
                  suhu awal {formatNumber(sa.initialTemperature, 0)}, akhir {formatNumber(sa.minTemperature, 3)}, laju pendinginan{' '}
                  {formatNumber(sa.coolingRate, 2)}, {sa.neighboursPerTemperature} tetangga per suhu. Diambil dari branch CloudSim-SA.
                </dd>
              </div>
              <div>
                <dt className="inline font-semibold text-leather-800">Sufferage dan Round Robin: </dt>
                <dd className="inline">heuristik tanpa parameter; Sufferage mengikuti Maheswaran dkk. (1999).</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-2 [&>*]:min-w-0">
        {summary.datasets.map((dataset) => (
          <article key={dataset.id} className="border-t-2 border-leather-700/30 pt-4">
            <p className="label-cinzel">{dataset.id === 'gocj' ? 'Dataset utama' : 'Dataset paper'}</p>
            <h3 className="mt-1 font-heading text-[17px] font-semibold text-leather-800">{dataset.name}</h3>
            <p className="mt-2 font-body text-[15px] leading-relaxed text-ink/85">{dataset.description}</p>
            <p className="mt-2 font-body text-[14px] text-leather-600">
              {dataset.citation}. DOI{' '}
              <a className="underline decoration-gold/60 underline-offset-2 hover:text-leather-800" href={`https://doi.org/${dataset.doi}`}>
                {dataset.doi}
              </a>
              {dataset.datasetDoi && (
                <>
                  ; data{' '}
                  <a
                    className="underline decoration-gold/60 underline-offset-2 hover:text-leather-800"
                    href={`https://doi.org/${dataset.datasetDoi}`}
                  >
                    {dataset.datasetDoi}
                  </a>
                </>
              )}
              {dataset.license && <> ({dataset.license})</>}
              {dataset.source && <>. {dataset.source}</>}.
            </p>
          </article>
        ))}
      </div>
    </SectionFrame>
  )
}
