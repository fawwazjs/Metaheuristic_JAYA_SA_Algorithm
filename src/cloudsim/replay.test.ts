import { describe, expect, it } from 'vitest'
import {
  axisNumber,
  groupVmsByDatacenter,
  keyFindings,
  nearestIndex,
  niceTicks,
  seconds,
  stepIndex,
} from './replay'
import type { ScenarioSummary, Stats, Summary } from './data'

const stats = (mean: number, min = mean, max = mean): Stats => ({ mean, std: 0, min, max })

function result(algorithm: string, makespan: number, avgResponse = 100) {
  return {
    algorithm,
    runs: 1,
    makespan: stats(makespan),
    makespanCloudSim: stats(makespan + 1),
    gapPercentMax: 0.2,
    aru: stats(0.8),
    throughput: stats(0.5),
    doi: stats(0.3),
    avgResponse: stats(avgResponse),
    avgWaiting: stats(10),
    energy: stats(1000),
    runtimeMs: stats(5),
    lastImprovement: stats(0),
    finishedMin: 100,
  }
}

function scenario(
  id: string,
  dataset: 'gocj' | 'nasa',
  makespans: Record<string, number>,
  responses: Record<string, number> = {},
  jobBound = 100,
): ScenarioSummary {
  return {
    id,
    group: dataset === 'nasa' ? 'nasa' : 'tc1',
    dataset,
    tasks: 100,
    vms: 50,
    jobBound,
    results: Object.entries(makespans).map(([name, value]) => result(name, value, responses[name])),
  }
}

describe('Skala sumbu', () => {
  it('memakai langkah 1, 2, atau 5 kali pangkat sepuluh', () => {
    expect(niceTicks(0, 9837, 5)).toEqual([0, 2000, 4000, 6000, 8000, 10000])
    expect(niceTicks(0, 1, 5)).toEqual([0, 0.2, 0.4, 0.6, 0.8, 1])
  })

  it('selalu mencakup nilai maksimum', () => {
    const ticks = niceTicks(0, 874160, 5)
    expect(ticks[ticks.length - 1]).toBeGreaterThanOrEqual(874160)
  })

  it('angka sumbu ringkas mulai 10 ribu', () => {
    expect(axisNumber(2000)).toBe('2.000')
    expect(axisNumber(20000)).toBe('20 rb')
    expect(axisNumber(1_400_000)).toBe('1,4 jt')
  })
})

describe('Pencarian titik untuk tooltip dan replay', () => {
  const xs = [30, 60, 90, 120]

  it('menemukan indeks terdekat', () => {
    expect(nearestIndex(xs, 74)).toBe(1)
    expect(nearestIndex(xs, 76)).toBe(2)
    expect(nearestIndex(xs, -5)).toBe(0)
    expect(nearestIndex(xs, 999)).toBe(3)
  })

  it('nilai berundak memakai titik terakhir yang sudah lewat', () => {
    expect(stepIndex(xs, 89)).toBe(1)
    expect(stepIndex(xs, 90)).toBe(2)
    expect(stepIndex(xs, 10)).toBe(0)
  })

})

describe('Format waktu', () => {
  it('detik besar tanpa desimal, detik kecil satu desimal', () => {
    expect(seconds(3008.75)).toBe('3.009 s')
    expect(seconds(874160)).toBe('874.160 s')
    expect(seconds(930.94)).toBe('930,9 s')
  })
})

describe('Pengelompokan VM', () => {
  it('membagi per datacenter lalu mengurutkan dari VM paling lambat', () => {
    const vms = [
      { index: 0, type: 'V1', mips: 500, pes: 1, datacenter: 'DC-Jakarta' },
      { index: 1, type: 'V2', mips: 800, pes: 1, datacenter: 'DC-Surabaya' },
      { index: 2, type: 'V3', mips: 1000, pes: 2, datacenter: 'DC-Jakarta' },
      { index: 3, type: 'V4', mips: 1300, pes: 2, datacenter: 'DC-Surabaya' },
      { index: 4, type: 'V5', mips: 1600, pes: 3, datacenter: 'DC-Jakarta' },
      { index: 5, type: 'V1', mips: 500, pes: 1, datacenter: 'DC-Surabaya' },
    ]

    const groups = groupVmsByDatacenter(vms)

    expect(groups.map((g) => g.datacenter)).toEqual(['DC-Jakarta', 'DC-Surabaya'])
    expect(groups[0].vms.map((vm) => vm.index)).toEqual([0, 2, 4])
    expect(groups[1].vms.map((vm) => vm.index)).toEqual([5, 1, 3])
  })
})

describe('Temuan utama dihitung dari data', () => {
  const summary = {
    scenarios: [
      scenario('tc1-100x50', 'gocj', { JAYA: 300, SA: 100, Sufferage: 150, 'Round Robin': 600 }),
      scenario('tc1-200x50', 'gocj', { JAYA: 500, SA: 250, Sufferage: 200, 'Round Robin': 1000 }),
      scenario('nasa-750x50', 'nasa', { JAYA: 874160, SA: 890000, Sufferage: 924000, 'Round Robin': 1400000 },
        { JAYA: 120000, SA: 100000, Sufferage: 40000, 'Round Robin': 100000 }, 874160),
    ],
  } as unknown as Summary

  it('menghitung pemenang dan rasio di skenario GoCJ', () => {
    const findings = keyFindings(summary)

    expect(findings.goCjCount).toBe(2)
    expect(findings.wins).toEqual({ SA: 1, Sufferage: 1 })
    // JAYA/SA: 300/100 = 3 dan 500/250 = 2 -> rata-rata 2,5
    expect(findings.jayaVsSa).toBeCloseTo(2.5)
    // 1 - JAYA/RR: 0,5 dan 0,5
    expect(findings.jayaVsRoundRobin).toBeCloseTo(0.5)
  })

  it('skor seri tidak dihitung sebagai kemenangan siapa pun', () => {
    const tied = {
      scenarios: [
        scenario('tc1-100x50', 'gocj', { JAYA: 562.5, SA: 562.5, Sufferage: 580, 'Round Robin': 2030 }, {}, 562.5),
        scenario('tc1-200x50', 'gocj', { JAYA: 900, SA: 400, Sufferage: 450, 'Round Robin': 2000 }, {}, 400),
      ],
    } as unknown as Summary

    const findings = keyFindings(tied)

    expect(findings.wins).toEqual({ SA: 1 })
    expect(findings.ties).toEqual([{ scenario: 'tc1-100x50', algorithms: ['JAYA', 'SA'], atJobBound: true }])
  })

  it('klaim batas job terbesar hanya bila makespan terbaik memang di batas itu', () => {
    const findings = keyFindings({
      scenarios: [
        scenario('tc1-300x50', 'gocj', { JAYA: 700, SA: 700, Sufferage: 800, 'Round Robin': 3000 }, {}, 562.5),
        scenario('nasa-750x50', 'nasa', { JAYA: 900000, SA: 890000, Sufferage: 924000, 'Round Robin': 1400000 }, {}, 874160),
      ],
    } as unknown as Summary)

    expect(findings.ties).toEqual([{ scenario: 'tc1-300x50', algorithms: ['JAYA', 'SA'], atJobBound: false }])
    expect(findings.nasa?.atJobBound).toBe(false)
  })

  it('melaporkan JAYA di NASA beserta waktu responsnya', () => {
    const findings = keyFindings(summary)

    expect(findings.nasa?.jayaRank).toBe(1)
    expect(findings.nasa?.atJobBound).toBe(true)
    // Tiga algoritma lain lebih cepat (40.000, 100.000, 100.000 < 120.000) -> peringkat 4
    expect(findings.nasa?.jayaResponseRank).toBe(4)
  })
})
