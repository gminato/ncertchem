import { describe, expect, it } from 'vitest'
import { DALTON_STEP_COUNT, ratioOfAtoms, snapshotForStep, stepDescription } from './dalton-steps'

describe('DaltonPostulates steps', () => {
  it('has one Step per postulate (four)', () => {
    expect(DALTON_STEP_COUNT).toBe(4)
  })

  it('animates the regrouping only on the last Step', () => {
    expect(snapshotForStep(0).morph).toBe(0)
    expect(snapshotForStep(2).morph).toBe(0)
    expect(snapshotForStep(3).morph).toBe(1)
  })
})

describe('fixed whole-number ratios', () => {
  it('water has 2 H to 1 O, and carbon dioxide has 1 C to 2 O', () => {
    expect(ratioOfAtoms('H2O', 'H', 'O')).toBe('2 : 1')
    expect(ratioOfAtoms('CO2', 'C', 'O')).toBe('1 : 2')
  })

  it('throws when an element is missing', () => {
    expect(() => ratioOfAtoms('H2O', 'C', 'O')).toThrow(RangeError)
  })

  it('quotes the same ratio in the Step text', () => {
    expect(stepDescription(2)).toContain('2 : 1')
    expect(stepDescription(2)).toContain('1 : 2')
  })
})
