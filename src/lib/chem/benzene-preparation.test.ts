import { describe, expect, it } from 'vitest'
import { atomCounts, BENZOATE_DECARBOXYLATION, CYCLIC_POLYMERISATION, isAtomBalanced, PHENOL_REDUCTION, sideCounts } from './benzene-preparation'

describe('benzene preparations (Section 9.5.4)', () => {
  it('counts atoms in a formula', () => {
    expect(atomCounts('C7H5O2Na')).toEqual({ C: 7, H: 5, O: 2, Na: 1 })
    expect(sideCounts('2NaOH + C6H6')).toEqual({ Na: 2, O: 2, H: 8, C: 6 })
  })

  it('all three equations balance', () => {
    expect(isAtomBalanced(CYCLIC_POLYMERISATION)).toBe(true)
    expect(isAtomBalanced(BENZOATE_DECARBOXYLATION)).toBe(true)
    expect(isAtomBalanced(PHENOL_REDUCTION)).toBe(true)
  })

  it('the sodium salt of benzoic acid has C7H5O2Na (benzoic acid C7H6O2 with H replaced by Na)', () => {
    expect(atomCounts('C6H5COONa')).toEqual({ C: 7, H: 5, O: 2, Na: 1 })
  })

  it('an unbalanced equation is caught', () => {
    expect(isAtomBalanced('C7H6O2Na + NaOH -> C6H6 + Na2CO3')).toBe(false)
  })
})
