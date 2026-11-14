import { describe, expect, it } from 'vitest'
import { PERIODIC_TABLE, elementByZ, groupOf, periodOf } from '@/lib/chem/periodic-data'
import {
  CHEMICAL_STEP_COUNT,
  DIAGONAL_PAIRS,
  EXTREME_GROUPS,
  chemicalView,
  clampChemicalStep,
  shortGroup,
} from './chemical-steps'

describe('chemical steps', () => {
  it('has three Steps: oxides, diagonal pairs, extremes', () => {
    expect(CHEMICAL_STEP_COUNT).toBe(3)
    expect([0, 1, 2].map(chemicalView)).toEqual(['oxides', 'diagonal', 'extremes'])
  })

  it('clamps out-of-range and non-finite Steps', () => {
    expect(clampChemicalStep(-4)).toBe(0)
    expect(clampChemicalStep(9)).toBe(2)
    expect(clampChemicalStep(Number.NaN)).toBe(0)
    expect(clampChemicalStep(1.4)).toBe(1)
  })
})

describe('diagonal pairs', () => {
  it('pairs Li with Mg, Be with Al and B with Si', () => {
    const symbols = DIAGONAL_PAIRS.map(([a, b]) => [elementByZ(a).symbol, elementByZ(b).symbol])
    expect(symbols).toEqual([
      ['Li', 'Mg'],
      ['Be', 'Al'],
      ['B', 'Si'],
    ])
  })

  it('places each pair one period apart and one short-form column apart', () => {
    for (const [a, b] of DIAGONAL_PAIRS) {
      expect(periodOf(b) - periodOf(a)).toBe(1)
      expect(shortGroup(groupOf(b) as number) - shortGroup(groupOf(a) as number)).toBe(1)
    }
  })

  it('uses the extreme groups 1 and 17 that exist in the table', () => {
    expect(EXTREME_GROUPS).toEqual([1, 17])
    expect(PERIODIC_TABLE.some((e) => e.group === 1)).toBe(true)
    expect(PERIODIC_TABLE.some((e) => e.group === 17)).toBe(true)
  })
})
