import { useEffect, useMemo, useState } from 'react'
import { Footer } from '../components/layout/Footer'
import { useSummary, type ScenarioSummary } from './data'
import { keyFindings } from './replay'
import { CloudSimHeader } from './components/CloudSimHeader'
import { ComparisonSection } from './components/ComparisonSection'
import { EnvironmentSection } from './components/EnvironmentSection'
import { GuideSection } from './components/GuideSection'
import { IntroSection } from './components/IntroSection'
import { ReplaySection } from './components/ReplaySection'
import { ScenarioPicker } from './components/ScenarioPicker'

const DEFAULT_SCENARIO = 'tc2-750x50'
const PARAM = 'skenario'

function initialScenario(): string {
  return new URLSearchParams(window.location.search).get(PARAM) ?? DEFAULT_SCENARIO
}

/** Skenario terpilih disimpan di URL (?skenario=…) agar tautan bisa dibagikan saat presentasi. */
function useScenarioSelection(scenarios: ScenarioSummary[] | null) {
  const [requested, setRequested] = useState(initialScenario)
  const selected = useMemo(
    () => scenarios?.find((s) => s.id === requested) ?? scenarios?.find((s) => s.id === DEFAULT_SCENARIO) ?? scenarios?.[0] ?? null,
    [scenarios, requested],
  )

  useEffect(() => {
    if (!selected) return
    const url = new URL(window.location.href)
    url.searchParams.set(PARAM, selected.id)
    window.history.replaceState(null, '', url)
  }, [selected])

  return [selected, setRequested] as const
}

export function CloudSimPage() {
  const summary = useSummary()
  const scenarios = summary.status === 'ready' ? summary.data.scenarios : null
  const [scenario, setScenario] = useScenarioSelection(scenarios)
  const findings = useMemo(() => (summary.status === 'ready' ? keyFindings(summary.data) : null), [summary])

  return (
    <>
      <a
        href="#awal"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-[70] focus:border focus:border-gold focus:bg-leather-900 focus:px-3 focus:py-2 focus:font-heading focus:text-[11px] focus:uppercase focus:tracking-widest focus:text-parchment-50"
      >
        Lompat ke konten
      </a>
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[60]">
        <div className="page-noise absolute inset-0 opacity-[0.1]" />
      </div>
      <CloudSimHeader />
      <main>
        {summary.status === 'loading' && (
          <p className="page-shell py-24 font-body text-[17px] text-leather-700">Memuat hasil simulasi…</p>
        )}
        {summary.status === 'error' && (
          <div role="alert" className="page-shell py-20">
            <h1 className="display-title text-[clamp(1.6rem,4vw,2.4rem)] text-leather-800">Data simulasi belum tersedia</h1>
            <p className="mt-4 max-w-prose font-body text-[17px] leading-relaxed text-ink/85">
              Halaman ini membaca <code className="font-mono text-[14px]">data/cloudsim/summary.json</code>, tetapi file itu tidak bisa
              dimuat ({summary.message}). Jalankan simulasinya dulu:
            </p>
            <pre className="mt-4 max-w-xl overflow-x-auto bg-leather-900 p-4 font-mono text-[13px] text-parchment-100">
              <code>{'cd cloudsim-jaya\nmvn -q package\n./sim run'}</code>
            </pre>
            <p className="mt-4 font-body text-[17px] text-ink/85">Setelah selesai, muat ulang halaman ini.</p>
          </div>
        )}
        {summary.status === 'ready' && scenario && findings && (
          <>
            <IntroSection summary={summary.data} findings={findings} />
            <EnvironmentSection summary={summary.data} />
            <ReplaySection
              scenario={scenario}
              summary={summary.data}
              picker={<ScenarioPicker id="skenario-replay" scenarios={summary.data.scenarios} value={scenario.id} onChange={setScenario} />}
            />
            <ComparisonSection
              summary={summary.data}
              scenario={scenario}
              findings={findings}
              picker={
                <ScenarioPicker id="skenario-perbandingan" scenarios={summary.data.scenarios} value={scenario.id} onChange={setScenario} />
              }
            />
            <GuideSection />
          </>
        )}
      </main>
      <Footer />
    </>
  )
}
