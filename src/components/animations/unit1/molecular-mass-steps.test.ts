import { describe, expect, it } from 'vitest'
import { molarMass } from '@/lib/chem/formula'
import {
  MASS_STEPS,
  MOLECULAR_MASS_STEP_COUNT,
  atomicMassText,
  runningTotal,
  stepDescription,
  totalText,
} from './molecular-mass-steps'

describe('MolecularMass steps', () => {
  it('has five Steps: methane built up, water, then sodium chloride', () => {
    expect(MOLECULAR_MASS_STEP_COUNT).toBe(5)
    expect(MASS_STEPS.map((s) => s.formula)).toEqual(['CH4', 'CH4', 'CH4', 'H2O', 'NaCl'])
  })

  it('never adds more atoms than the formula unit holds', () => {
    for (const s of MASS_STEPS) {
      expect(s.added).toBeGreaterThanOrEqual(0)
      expect(s.added).toBeLessThanOrEqual(s.atoms.length)
    }
  })

  it('calls the ionic solid a formula mass, not a molecular mass', () => {
    expect(MASS_STEPS[4].totalName).toBe('formula mass')
    expect(MASS_STEPS[0].totalName).toBe('molecular mass')
  })
})

describe('summing atoms reproduces molarMass()', () => {
  it('the running total of every atom equals molarMass for each formula', () => {
    for (const s of MASS_STEPS) {
      expect(runningTotal(s, s.atoms.length)).toBeCloseTo(molarMass(s.formula), 10)
    }
  })

  it('methane: 12.011 after the carbon, 16.043 after all five atoms (NCERT 1.7.3)', () => {
    const methane = MASS_STEPS[0]
    expect(runningTotal(methane, 1).toFixed(3)).toBe('12.011')
    expect(totalText(methane)).toBe('16.043')
  })

  it('water: 18.016 u (NCERT quotes 18.02 u)', () => {
    expect(totalText(MASS_STEPS[3])).toBe('18.016')
  })

  it('sodium chloride: 23.0 + 35.5 = 58.5 u (NCERT 1.7.4)', () => {
    expect(totalText(MASS_STEPS[4])).toBe('58.500')
    expect(runningTotal(MASS_STEPS[4], 1)).toBeCloseTo(23.0, 10)
  })

  it('shows atomic masses the way the NCERT text writes them', () => {
    expect(atomicMassText('C')).toBe('12.011')
    expect(atomicMassText('H')).toBe('1.008')
    expect(atomicMassText('O')).toBe('16.00')
  })
})

describe('step text', () => {
  it('quotes the methane total from the computed value', () => {
    expect(stepDescription(2)).toContain('16.043')
  })
})
