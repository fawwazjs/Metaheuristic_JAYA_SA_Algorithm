import { formatNumber } from '../../lib/algorithms/rng'
import type { ScenarioSummary } from '../data'
import { scenarioLabel } from '../replay'

/** Label kelompok skenario, dibaca dari data agar tetap benar bila skenario berubah. */
function groupLabel(group: ScenarioSummary['group'], items: ScenarioSummary[]): string {
  if (group === 'tc1') return `TC1: jumlah task bervariasi (${items[0].vms} VM, GoCJ)`
  if (group === 'tc2') return `TC2: jumlah VM bervariasi (${formatNumber(items[0].tasks, 0)} task, GoCJ)`
  return 'Dataset paper: NASA iPSC 1993'
}

const GROUPS: ScenarioSummary['group'][] = ['tc1', 'tc2', 'nasa']

/** Baris pemilih skenario; diletakkan di atas semua grafik yang dicakupnya. */
export function ScenarioPicker({
  id,
  scenarios,
  value,
  onChange,
}: {
  id: string
  scenarios: ScenarioSummary[]
  value: string
  onChange: (id: string) => void
}) {
  const selected = scenarios.find((s) => s.id === value)
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-y border-leather-700/20 py-3">
      <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
        <label htmlFor={id} className="label-cinzel">
          Skenario
        </label>
        <select
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="min-h-[44px] min-w-0 max-w-full border border-leather-700/40 bg-parchment-50 px-3 font-body text-[15px] text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold"
        >
          {GROUPS.map((group) => {
            const items = scenarios.filter((s) => s.group === group)
            if (items.length === 0) return null
            return (
              <optgroup key={group} label={groupLabel(group, items)}>
                {items.map((scenario) => (
                  <option key={scenario.id} value={scenario.id}>
                    {scenarioLabel(scenario)}
                  </option>
                ))}
              </optgroup>
            )
          })}
        </select>
      </div>
      {selected && <p className="font-body text-[14px] italic text-leather-600">{scenarioLabel(selected)}</p>}
    </div>
  )
}
