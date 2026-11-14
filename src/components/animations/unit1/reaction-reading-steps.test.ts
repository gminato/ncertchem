import { describe, expect, it } from 'vitest'
import { molarMass } from '@/lib/chem/formula'
import {
  READING_STEP_COUNT,
  clampReadingStep,
  gramsOf,
  massLabel,
  readingSnapshotForStep,
  totalMasses,
} from './reaction-reading-steps'

describe('readingSnapshotForStep', () => {
  it('has four Steps, moving from molecules to moles to grams to conservation', () => {
    expect(READING_STEP_COUNT).toBe(4)
    expect(readingSnapshotForStep(0)).toEqual({ molecules: 1, moles: 0, grams: 0, balance: 0 })
    expect(readingSnapshotForStep(1)).toEqual({ molecules: 0, moles: 1, grams: 0, balance: 0 })
    expect(readingSnapshotForStep(2)).toEqual({ molecules: 0, moles: 0, grams: 1, balance: 0 })
    expect(readingSnapshotForStep(3)).toEqual({ molecules: 0, moles: 0, grams: 1, balance: 1 })
  })

  it('clamps out-of-range steps', () => {
    expect(clampReadingStep(-2)).toBe(0)
    expect(clampReadingStep(10)).toBe(3)
    expect(clampReadingStep(Number.NaN)).toBe(0)
  })
})

describe('masses from molarMass', () => {
  it('uses the molar mass of each species', () => {
    expect(gramsOf('CH4', 1)).toBeCloseTo(molarMass('CH4'), 9)
    expect(gramsOf('O2', 2)).toBeCloseTo(64, 9)
  })

  it('shows the per-species masses to two decimals', () => {
    expect(massLabel('CH4', 1)).toBe('16.04 g')
    expect(massLabel('O2', 2)).toBe('64.00 g')
    expect(massLabel('CO2', 1)).toBe('44.01 g')
    expect(massLabel('H2O', 2)).toBe('36.03 g')
  })

  it('conserves mass: reactant and product totals agree to the displayed digit', () => {
    const totals = totalMasses()
    expect(totals.reactants).toBe('80.04')
    expect(totals.products).toBe('80.04')
  })

  it('the per-species labels add up to the totals as displayed', () => {
    expect(Number(massLabel('CH4', 1).slice(0, -2)) + 64).toBeCloseTo(80.04, 2)
    expect(Number(massLabel('CO2', 1).slice(0, -2)) + Number(massLabel('H2O', 2).slice(0, -2))).toBeCloseTo(80.04, 2)
  })
})
