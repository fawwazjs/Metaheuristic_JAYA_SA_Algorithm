import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ETC, INITIAL_SOLUTION, NODE_NAMES, OPERATORS, OPTIMAL, TASK_COLORS, TASK_NAMES,
  createScheduleSa, makespan, nodeLoads, runScheduleJaya, applyOperator, type Solution,
} from '../../lib/algorithms/scheduling'
import { formatNumber, mulberry32, randomSeed } from '../../lib/algorithms/rng'
import { Tex } from '../math/Tex'
import { IconCheck, IconCross, IconDice, IconPlay, IconPause, IconReset } from '../ornaments/Ornaments'
import { NumberField, SelectPlaque } from '../ui/Controls'
import type { SaSnapshot, SaTrial } from '../../lib/algorithms/sa'

export function TaskSchedulingDemo() {
  const [solution, setSolution] = useState<Solution>([...INITIAL_SOLUTION])
  const [operator, setOperator] = useState<string>('random')
  const [seed, setSeed] = useState(20240501)
  const [auto, setAuto] = useState(false)
  const [showCalc, setShowCalc] = useState(false)
  const [snapshot, setSnapshot] = useState<SaSnapshot<Solution> | null>(null)
  const [log, setLog] = useState<SaTrial<Solution>[]>([])
  const engineRef = useRef<ReturnType<typeof createScheduleSa> | null>(null)
  const lastSolution = useRef<Solution>([...INITIAL_SOLUTION])
  const dragTask = useRef<number | null>(null)

  const loads = nodeLoads(solution)
  const cost = makespan(solution)
  const optimalGap = cost - OPTIMAL.cost
  const jaya = useMemo(() => runScheduleJaya(seed, 18, 60), [seed])

  const startSa = (autoRun: boolean) => {
    const engine = createScheduleSa({
      initial: solution,
      operator: operator as never,
      seed,
      alpha: 0.9,
      innerLoops: 10,
      Tfinal: 0.01,
    })
    engineRef.current = engine
    lastSolution.current = [...solution]
    setSnapshot(engine.snapshot())
    setLog([])
    setAuto(autoRun)
    if (!autoRun) {
      // Tekan pertama tetap harus menghasilkan satu percobaan neighbor.
      const snap = engine.step()
      setSnapshot(snap)
      if (snap.lastTrial) {
        setLog([snap.lastTrial as SaTrial<Solution>])
        if (snap.lastTrial.accepted) {
          lastSolution.current = [...snap.cur]
          setSolution([...snap.cur])
        }
      }
    }
  }

  const reset = () => {
    setSolution([...INITIAL_SOLUTION])
    setSnapshot(null)
    setLog([])
    setAuto(false)
    engineRef.current = null
    lastSolution.current = [...INITIAL_SOLUTION]
    setShowCalc(false)
  }

  const stepSa = () => {
    const engine = engineRef.current
    if (!engine) return
    const snap = engine.step()
    setSnapshot(snap)
    if (snap.lastTrial) {
      setLog((current) => [...current, snap.lastTrial as SaTrial<Solution>].slice(-8))
      if (snap.lastTrial.accepted) {
        lastSolution.current = [...snap.cur]
        setSolution([...snap.cur])
      }
    }
    if (snap.done) setAuto(false)
  }

  useEffect(() => {
    if (!auto) return
    const timer = window.setInterval(stepSa, 260)
    return () => window.clearInterval(timer)
  }, [auto])

  const moveTask = (taskIndex: number, node: number) => {
    if (node < 1 || node > 3) return
    setSolution((current) => {
      const next = [...current]
      next[taskIndex] = node
      return next
    })
    setSnapshot(null)
    setAuto(false)
    engineRef.current = null
  }

  const shuffleOne = () => {
    const rng = mulberry32(randomSeed())
    const next = applyOperator(operator as never, solution, rng)
    setSolution(next)
    setSnapshot(null)
    lastSolution.current = next
  }

  return (
    <div className="space-y-4">
      {/* Papan pembagian tugas */}
      <div className="parchment-card relative overflow-hidden p-3 sm:p-4">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="font-heading text-[9px] uppercase tracking-[0.2em] text-leather-600">
              Demo Penjadwalan · Data Slide
            </p>
            <h4 className="font-heading text-lg font-semibold text-leather-800">
              Tiga node, empat task
            </h4>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button type="button" className="btn-ritual !min-h-[36px] !px-2.5 !text-[8px]" onClick={shuffleOne} aria-label="Terapkan satu operator perturbation">
              <IconDice size={13} /> Terapkan 1 perturbation
            </button>
            <button type="button" className="btn-ritual !min-h-[36px] !px-2.5 !text-[8px]" onClick={() => startSa(true)} aria-label="Jalankan SA otomatis">
              Jalankan SA otomatis
            </button>
            {auto ? (
              <button type="button" className="btn-ritual btn-ritual-light !min-h-[36px] !px-2.5 !text-[8px]" onClick={() => setAuto(false)}>
                <IconPause size={13} /> Jeda
              </button>
            ) : (
              <button type="button" className="btn-ritual btn-ritual-light !min-h-[36px] !px-2.5 !text-[8px]" onClick={() => (engineRef.current ? stepSa() : startSa(false))}>
                <IconPlay size={13} /> Satu langkah
              </button>
            )}
            <button type="button" className="btn-ritual btn-ritual-light !min-h-[36px] !px-2.5 !text-[8px]" onClick={reset}>
              <IconReset size={13} /> Reset
            </button>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_300px]">
          {/* Batang tumpukan */}
          <div>
            <div className="relative" style={{ height: 250 }}>
              {/* Garis makespan */}
              <div
                className="pointer-events-none absolute inset-x-0 z-10 flex items-center gap-1"
                style={{ bottom: 40 + cost * 11 }}
                aria-hidden="true"
              >
                <div className="h-px flex-1 border-t border-dashed border-wax/80" />
                <span className="bg-parchment-100 px-1 font-mono text-[9px] text-wax">f(S) = {cost}</span>
              </div>
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-around gap-2" style={{ height: 250 }}>
                {NODE_NAMES.map((nodeName, nodeIndex) => {
                  const tasks = solution
                    .map((node, taskIndex) => ({ node, taskIndex }))
                    .filter((item) => item.node === nodeIndex + 1)
                  const total = loads[nodeIndex]
                  const isLeader = total === cost && total > 0
                  return (
                    <div
                      key={nodeName}
                      className="flex h-full w-full max-w-[150px] flex-col justify-end"
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={(event) => {
                        event.preventDefault()
                        const taskIndex = Number(event.dataTransfer.getData('text/plain'))
                        if (Number.isInteger(taskIndex)) moveTask(taskIndex, nodeIndex + 1)
                      }}
                    >
                      <div className="relative w-full pb-[38px]">
                        <div className={`mx-auto flex w-full flex-col-reverse gap-0.5 ${isLeader ? 'drop-shadow-[0_0_10px_rgba(200,86,30,.55)]' : ''}`}>
                          {tasks.map(({ taskIndex }) => {
                            const value = ETC[taskIndex][nodeIndex]
                            return (
                              <button
                                key={taskIndex}
                                type="button"
                                draggable
                                onDragStart={(event) => {
                                  dragTask.current = taskIndex
                                  event.dataTransfer.setData('text/plain', String(taskIndex))
                                }}
                                onClick={() => moveTask(taskIndex, (nodeIndex + 1) % 3 + 1)}
                                title={`${TASK_NAMES[taskIndex]} di ${nodeName} = ${value} satuan. Klik untuk pindah node.`}
                                aria-label={`${TASK_NAMES[taskIndex]} di ${nodeName}, ${value} satuan. Tekan untuk memindah ke node berikutnya.`}
                                className="group relative flex items-center justify-center border border-leather-800/40 font-mono text-[10px] font-semibold text-parchment-50 transition-all hover:brightness-110 focus-visible:ring-2 focus-visible:ring-gold-light"
                                style={{
                                  height: `${Math.max(18, value * 11)}px`,
                                  backgroundColor: TASK_COLORS[taskIndex],
                                  width: '100%',
                                }}
                              >
                                <span className="drop-shadow-[0_1px_1px_rgba(0,0,0,.6)]">
                                  {TASK_NAMES[taskIndex]} · {value}
                                </span>
                              </button>
                            )
                          })}
                        </div>
                        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between">
                          <span className="font-heading text-[9px] uppercase tracking-wider text-leather-700">
                            {nodeName.replace('Node ', 'N')}
                          </span>
                          <span className={`font-mono text-[11px] font-semibold ${isLeader ? 'text-wax' : 'text-leather-800'}`}>
                            C = {total}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="absolute inset-x-0 bottom-[34px] h-0.5 bg-leather-700/60" aria-hidden="true" />
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-2">
              <div className="flex flex-wrap gap-1">
                {TASK_NAMES.map((name, index) => (
                  <span key={name} className="inline-flex items-center gap-1 border border-leather-700/20 bg-parchment-50/60 px-1.5 py-0.5 font-mono text-[9px] text-leather-700">
                    <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: TASK_COLORS[index] }} />
                    {name}
                  </span>
                ))}
              </div>
              <span className="ml-auto font-body text-[11px] italic text-leather-600">
                Seret blok atau klik untuk pindah node
              </span>
            </div>
          </div>

          {/* Tabel ETC + ringkasan */}
          <div className="space-y-2">
            <div className="overflow-x-auto border border-leather-700/25 bg-parchment-50/45">
              <table className="w-full border-collapse font-mono text-[10px]">
                <caption className="sr-only">Matriks ETC: waktu eksekusi setiap tugas pada setiap node</caption>
                <thead>
                  <tr className="bg-leather-700/10">
                    <th scope="col" className="border-b border-leather-700/25 px-1.5 py-1 text-left font-heading text-[8px] uppercase tracking-wider text-leather-700">
                      Task
                    </th>
                    {NODE_NAMES.map((node) => (
                      <th key={node} scope="col" className="border-b border-leather-700/25 px-1.5 py-1 font-heading text-[8px] uppercase tracking-wider text-leather-700">
                        {node.replace('Node ', 'N')}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ETC.map((row, taskIndex) => (
                    <tr key={taskIndex}>
                      <th scope="row" className="border-b border-leather-700/15 px-1.5 py-0.5 text-left font-semibold text-leather-800">
                        {TASK_NAMES[taskIndex]}
                      </th>
                      {row.map((value, nodeIndex) => {
                        const active = solution[taskIndex] === nodeIndex + 1
                        return (
                          <td
                            key={nodeIndex}
                            className={`border-b border-leather-700/15 px-1.5 py-0.5 text-center transition-colors ${
                              active ? 'bg-wax/15 font-bold text-wax' : 'text-leather-700/80'
                            }`}
                          >
                            {value}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="border border-leather-700/25 bg-parchment-50/45 p-2">
              <div className="flex items-center justify-between">
                <span className="font-heading text-[8px] uppercase tracking-wider text-leather-600">Solusi S</span>
                <span className="font-mono text-[10px] text-leather-800">[{solution.join(', ')}]</span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="font-heading text-[8px] uppercase tracking-wider text-leather-600">Beban C</span>
                <span className="font-mono text-[10px] text-leather-800">({loads.join(', ')})</span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="font-heading text-[8px] uppercase tracking-wider text-leather-600">Makespan</span>
                <span className="font-mono text-[11px] font-semibold text-wax">{cost}</span>
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1">
                <span className="border border-forest/35 bg-forest/10 px-1.5 py-0.5 font-mono text-[9px] text-forest">
                  Optimal brute-force: {OPTIMAL.cost} (S = [{OPTIMAL.solution.join(', ')}])
                </span>
                <span className={`border px-1.5 py-0.5 font-mono text-[9px] ${optimalGap === 0 ? 'border-forest/35 bg-forest/10 text-forest' : 'border-wax/30 bg-wax/10 text-wax'}`}>
                  selisih: {optimalGap === 0 ? 'tepat' : `+${optimalGap}`}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setShowCalc((value) => !value)}
                className="btn-ritual btn-ritual-light !min-h-[34px] !px-2 !text-[8px]"
                aria-expanded={showCalc}
              >
                {showCalc ? 'Sembunyikan' : 'Tampilkan'} perhitungan C₁
              </button>
              <span className="self-center font-mono text-[9px] text-leather-600">
                SA {snapshot ? `· ${snapshot.evaluations} eval` : '· siap'}
              </span>
            </div>

            {showCalc && (
              <div className="formula-panel border border-leather-700/25 bg-parchment-50/60 p-2 text-ink">
                <Tex display>{'C_1 = ETC(1,1) + ETC(4,1) = 4 + 5 = 9'}</Tex>
                <p className="mt-1 font-body text-[11px] italic text-leather-600">
                  Hanya t1 dan t4 yang ditempatkan di Node 1 pada S₀ = [1, 2, 3, 1].
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Panel kontrol perturbation */}
        <div className="mt-3 grid gap-2 border-t border-leather-700/20 pt-3 sm:grid-cols-2 lg:grid-cols-4">
          <SelectPlaque
            label="Operator perturbation"
            value={operator}
            onChange={setOperator}
            options={[
              { value: 'random', label: 'Acak dari semuanya' },
              ...OPERATORS.map((item) => ({ value: item.id, label: item.label })),
            ]}
          />
          <NumberField label="Seed SA" value={seed} min={0} max={9999999} onChange={setSeed} />
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => setSeed(randomSeed())}
              className="btn-ritual !min-h-[44px] w-full !px-2 !text-[8px]"
            >
              <IconDice size={13} /> Seed baru
            </button>
          </div>
          <div className="flex items-end">
            <p className="font-body text-[11px] leading-snug text-leather-600">
              {OPERATORS.find((item) => item.id === operator)?.description ??
                'Memilih satu operator acak dari enam jenis perturbation.'}
            </p>
          </div>
        </div>
      </div>

      {/* Log keputusan SA + pembanding JAYA */}
      <div className="grid gap-3 lg:grid-cols-2">
        <div className="parchment-card p-3">
          <div className="flex items-center justify-between">
            <h4 className="font-heading text-sm font-semibold text-leather-800">Log keputusan SA</h4>
            <span className="font-mono text-[9px] text-leather-600">
              {snapshot ? `T = ${formatNumber(snapshot.T, 3)}` : 'T0 dihitung otomatis'}
            </span>
          </div>
          {snapshot?.t0Info && (
            <p className="mt-1 font-mono text-[10px] text-leather-600">
              T₀ = {formatNumber(snapshot.T0, 2)} dari ΔC̄ = {formatNumber(snapshot.t0Info.meanDelta, 2)} ({snapshot.t0Info.samples} sampel buruk)
            </p>
          )}
          <ul className="mt-2 space-y-1">
            {log.length === 0 && (
              <li className="font-body text-[12px] italic text-leather-600">
                Tekan “Satu langkah” atau “Jalankan SA otomatis” untuk mengisi log.
              </li>
            )}
            {log.slice().reverse().map((trial, index) => (
              <li key={index} className="flex flex-wrap items-center justify-between gap-1 border-b border-leather-700/15 pb-0.5 font-mono text-[10px]">
                <span className="text-leather-700">
                  ΔC {trial.deltaC >= 0 ? '+' : ''}
                  {formatNumber(trial.deltaC, 2)}
                </span>
                <span className="text-leather-600">T {formatNumber(trial.T, 2)}</span>
                <span className="text-leather-600">P {formatNumber(trial.P, 3)}</span>
                <span className="text-leather-600">r {formatNumber(trial.r, 3)}</span>
                <span className={`inline-flex items-center gap-1 ${trial.accepted ? 'text-forest' : 'text-wax'}`}>
                  {trial.accepted ? <IconCheck size={11} /> : <IconCross size={11} />}
                  {trial.accepted ? 'Terima' : 'Tolak'}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="parchment-card p-3">
          <h4 className="font-heading text-sm font-semibold text-leather-800">Pembanding: JAYA diskret</h4>
          <p className="mt-1 font-body text-[12px] leading-snug text-leather-600">
            JAYA kontinu dibulatkan ke nomor node dengan <code className="font-mono text-[11px]">round</code> lalu
            di-<em>clamp</em> ke [1, 3] — inilah kelemahan “konversi kontinu ke diskret”.
          </p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            <div className="border border-leather-700/25 bg-parchment-50/45 p-1.5 text-center">
              <div className="font-heading text-[8px] uppercase tracking-wider text-leather-600">JAYA best</div>
              <div className="font-mono text-sm font-semibold text-forest">{jaya.bestCost}</div>
            </div>
            <div className="border border-leather-700/25 bg-parchment-50/45 p-1.5 text-center">
              <div className="font-heading text-[8px] uppercase tracking-wider text-leather-600">SA sekarang</div>
              <div className="font-mono text-sm font-semibold text-wax">{cost}</div>
            </div>
            <div className="border border-leather-700/25 bg-parchment-50/45 p-1.5 text-center">
              <div className="font-heading text-[8px] uppercase tracking-wider text-leather-600">Optimal</div>
              <div className="font-mono text-sm font-semibold text-leather-800">{OPTIMAL.cost}</div>
            </div>
          </div>
          <p className="mt-2 font-mono text-[10px] text-leather-600">
            S_JAYA = [{jaya.best.join(', ')}] · {jaya.evaluations} evaluasi
          </p>
          <MiniConvergence points={jaya.history} />
        </div>
      </div>
    </div>
  )
}

function MiniConvergence({ points }: { points: Array<{ iteration: number; best: number; mean: number }> }) {
  if (points.length < 2) return null
  const width = 320
  const height = 78
  const pad = 8
  const max = Math.max(...points.map((p) => p.mean), 1)
  const min = Math.min(...points.map((p) => p.best), 0)
  const span = Math.max(1e-6, max - min)
  const xFor = (i: number) => pad + (i / (points.length - 1)) * (width - pad * 2)
  const yFor = (v: number) => height - pad - ((v - min) / span) * (height - pad * 2)
  const line = (key: 'best' | 'mean') =>
    points.map((p, i) => `${i === 0 ? 'M' : 'L'}${xFor(i).toFixed(1)},${yFor(p[key]).toFixed(1)}`).join(' ')
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="mt-2 w-full" role="img" aria-label="Konvergensi JAYA diskret pada dataset ETC">
      <rect width={width} height={height} fill="rgba(78,49,25,.06)" />
      <path d={line('mean')} fill="none" stroke="rgba(78,49,25,.35)" strokeWidth="1" />
      <path d={line('best')} fill="none" stroke="#3F5B3A" strokeWidth="1.6" />
    </svg>
  )
}