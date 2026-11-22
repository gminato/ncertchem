import { describe, expect, it } from 'vitest'
import { electrodeCycle, eStandardM2, eStandardM3M2, liberatesH2FromDiluteAcid } from '@/lib/chem/dblock'
import {
  BELOW_TREND,
  CYCLE_METALS,
  STEP_COUNT,
  THREE_D,
  bubblesH2,
  cycleBars,
  cycleTotal,
  highestHalides,
  plotX,
  signedKj,
  signedVolt,
} from './electrode-steps'

describe('Section 5 Scrolly numbers (Table 4.4 cycle, Table 4.2 potentials)', () => {
  it('has five Steps', () => {
    expect(STEP_COUNT).toBe(5)
  })

  it('takes the zinc and copper cycles from Table 4.4 (R7)', () => {
    expect(cycleBars('Zn')).toEqual([130, 2640, -2059])
    expect(cycleTotal('Zn')).toBe(711)
    expect(cycleBars('Cu')).toEqual([339, 2703, -2121])
    expect(cycleTotal('Cu')).toBe(921)
    expect(cycleTotal('Ni')).toBe(798)
  })

  it('has every cycle total positive, so the Scrolly must compare metals, not signs', () => {
    for (const metal of CYCLE_METALS) {
      expect(cycleTotal(metal)).toBeGreaterThan(0)
    }
  })

  it('has copper as the largest cycle total in the 3d row', () => {
    const totals = CYCLE_METALS.map((m) => [m, cycleTotal(m)] as const)
    const top = totals.reduce((a, b) => (b[1] > a[1] ? b : a))
    expect(top[0]).toBe('Cu')
  })

  it('has copper as the only positive E° and the only metal that does not liberate H₂', () => {
    const positive = THREE_D.filter((m) => (eStandardM2(m) ?? 0) > 0)
    expect(positive).toEqual(['Cu'])
    expect(liberatesH2FromDiluteAcid('Cu')).toBe(false)
    expect(bubblesH2('Zn')).toBe(true)
    expect(bubblesH2('Sc')).toBeNull()
  })

  it('reads the M³⁺/M²⁺ couples from Table 4.2, with a dash where NCERT has none', () => {
    expect(eStandardM3M2('Co')).toBe(1.97)
    expect(eStandardM3M2('Mn')).toBe(1.57)
    expect(eStandardM3M2('Ti')).toBe(-0.37)
    expect(eStandardM3M2('Ni')).toBeNull()
    expect(eStandardM3M2('Sc')).toBeNull()
  })

  it('places the 3d metals on plot positions Sc = 1 to Zn = 10 and marks the trend exceptions', () => {
    expect(plotX('Sc')).toBe(1)
    expect(plotX('Zn')).toBe(10)
    expect(BELOW_TREND).toEqual(['Mn', 'Ni', 'Zn'])
    expect(() => plotX('Y')).toThrow(RangeError)
  })

  it('reports the highest halide state of each metal from Table 4.5', () => {
    const rows = highestHalides(['Ti', 'V', 'Cr', 'Mn'])
    expect(rows.map((r) => [r.metal, r.state])).toEqual([
      ['Ti', 4],
      ['V', 5],
      ['Cr', 6],
      ['Mn', 4],
    ])
    expect(rows[3].formula).toBe('MnF₄')
  })

  it('formats signs with a true minus and keeps the lib cycle for Sc out of the cycle list', () => {
    expect(signedKj(-2059)).toBe('−2059')
    expect(signedKj(130)).toBe('+130')
    expect(signedVolt(-0.76)).toBe('−0.76')
    expect(signedVolt(0.34)).toBe('+0.34')
    expect(() => electrodeCycle('Sc')).toThrow(RangeError)
    expect(CYCLE_METALS).not.toContain('Sc')
  })
})
