import { describe, expect, it } from 'vitest'
import {
  FIRST_SERIES_SYMBOLS,
  firstSeriesIe,
  ionisationState,
  parallelSpinPairs,
  subshellLosingElectron,
} from './ionisation-explorer'

describe('ionisation explorer model', () => {
  it('lists Sc to Zn', () => {
    expect(FIRST_SERIES_SYMBOLS).toEqual(['Sc', 'Ti', 'V', 'Cr', 'Mn', 'Fe', 'Co', 'Ni', 'Cu', 'Zn'])
  })

  it('reads IE values from Table 4.2', () => {
    expect(firstSeriesIe('Mn')).toEqual([717, 1509, 3260])
    expect(firstSeriesIe('Fe')).toEqual([762, 1561, 2962])
    expect(firstSeriesIe('Zn')).toEqual([906, 1734, 3837])
    expect(() => firstSeriesIe('Hf')).toThrow(RangeError)
  })

  it('counts parallel-spin pairs with the same numbers as the Section fact sheet', () => {
    expect(parallelSpinPairs(0)).toBe(0)
    expect(parallelSpinPairs(3)).toBe(3)
    expect(parallelSpinPairs(4)).toBe(6)
    expect(parallelSpinPairs(5)).toBe(10)
    expect(parallelSpinPairs(6)).toBe(10)
    expect(parallelSpinPairs(9)).toBe(16)
    expect(parallelSpinPairs(10)).toBe(20)
    expect(() => parallelSpinPairs(11)).toThrow(RangeError)
  })

  it('removes ns electrons before (n−1)d', () => {
    expect(ionisationState('Cr', 0).display).toBe('[Ar] 3d⁵4s¹')
    expect(ionisationState('Cr', 1).display).toBe('[Ar] 3d⁵')
    expect(ionisationState('Cr', 2).display).toBe('[Ar] 3d⁴')
    expect(ionisationState('V', 1).display).toBe('[Ar] 3d³4s¹')
    expect(ionisationState('V', 2).display).toBe('[Ar] 3d³')
    expect(ionisationState('Mn', 2).display).toBe('[Ar] 3d⁵')
    expect(ionisationState('Mn', 3).display).toBe('[Ar] 3d⁴')
    expect(ionisationState('Fe', 2).display).toBe('[Ar] 3d⁶')
    expect(ionisationState('Fe', 3).display).toBe('[Ar] 3d⁵')
    expect(ionisationState('Cu', 2).display).toBe('[Ar] 3d⁹')
    expect(ionisationState('Zn', 2).display).toBe('[Ar] 3d¹⁰')
  })

  it('matches the pair counts in the fact sheet for the contrasting ions', () => {
    expect(ionisationState('Mn', 2).pairs).toBe(10)
    expect(ionisationState('Mn', 3).pairs).toBe(6)
    expect(ionisationState('Fe', 2).pairs).toBe(10)
    expect(ionisationState('Fe', 3).pairs).toBe(10)
    expect(ionisationState('Cu', 1).pairs).toBe(20)
    expect(ionisationState('Cu', 2).pairs).toBe(16)
  })

  it('labels ions with real superscripts', () => {
    expect(ionisationState('Mn', 2).label).toBe('Mn²⁺')
    expect(ionisationState('Mn', 0).label).toBe('Mn')
  })

  it('names the subshell that loses each electron', () => {
    expect(subshellLosingElectron('Mn', 1)).toBe('4s')
    expect(subshellLosingElectron('Mn', 2)).toBe('4s')
    expect(subshellLosingElectron('Mn', 3)).toBe('3d')
    expect(subshellLosingElectron('Zn', 1)).toBe('4s')
    expect(subshellLosingElectron('Zn', 3)).toBe('3d')
    expect(subshellLosingElectron('Mn', 0)).toBeNull()
  })
})
