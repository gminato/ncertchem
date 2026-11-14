import { describe, expect, it } from 'vitest'
import { massToMoles } from './mole'
import { isBalanced, limitingReagent, type Reaction } from './stoichiometry'

const haberReaction: Reaction = {
  reactants: [
    { formula: 'N2', coeff: 1 },
    { formula: 'H2', coeff: 3 },
  ],
  products: [{ formula: 'NH3', coeff: 2 }],
}

describe('isBalanced', () => {
  it('2H2 + O2 -> 2H2O is balanced', () => {
    expect(
      isBalanced({
        reactants: [
          { formula: 'H2', coeff: 2 },
          { formula: 'O2', coeff: 1 },
        ],
        products: [{ formula: 'H2O', coeff: 2 }],
      })
    ).toBe(true)
  })

  it('H2 + O2 -> H2O is not balanced', () => {
    expect(
      isBalanced({
        reactants: [
          { formula: 'H2', coeff: 1 },
          { formula: 'O2', coeff: 1 },
        ],
        products: [{ formula: 'H2O', coeff: 1 }],
      })
    ).toBe(false)
  })

  it('N2 + 3H2 -> 2NH3 is balanced (NCERT Problem 1.5 reaction)', () => {
    expect(isBalanced(haberReaction)).toBe(true)
  })

  it('CH4 + 2O2 -> CO2 + 2H2O is balanced (NCERT methane combustion)', () => {
    expect(
      isBalanced({
        reactants: [
          { formula: 'CH4', coeff: 1 },
          { formula: 'O2', coeff: 2 },
        ],
        products: [
          { formula: 'CO2', coeff: 1 },
          { formula: 'H2O', coeff: 2 },
        ],
      })
    ).toBe(true)
  })

  it('rejects non-positive or non-integer coefficients', () => {
    expect(() =>
      isBalanced({ reactants: [{ formula: 'H2', coeff: 0 }], products: [{ formula: 'H2', coeff: 1 }] })
    ).toThrow(RangeError)
    expect(() =>
      isBalanced({ reactants: [{ formula: 'H2', coeff: 1.5 }], products: [{ formula: 'H2', coeff: 1 }] })
    ).toThrow(RangeError)
  })
})

describe('limitingReagent (NCERT Problem 1.5)', () => {
  // 50.0 kg N2 and 10.0 kg H2 (NCERT: 17.86e2 mol N2, 4.96e3 mol H2)
  const n2Moles = massToMoles(50000, 'N2')
  const h2Moles = massToMoles(10000, 'H2')

  it('converts the NCERT masses to moles', () => {
    expect(Math.abs(n2Moles - 1786) / 1786).toBeLessThanOrEqual(0.01)
    expect(Math.abs(h2Moles - 4960) / 4960).toBeLessThanOrEqual(0.01)
  })

  it('identifies H2 as limiting and produces about 3.30e3 mol NH3', () => {
    const result = limitingReagent(haberReaction, { N2: n2Moles, H2: h2Moles })
    expect(result.limiting).toBe('H2')
    expect(Math.abs(result.produced.NH3 - 3300) / 3300).toBeLessThanOrEqual(0.01)
  })

  it('reports consumed, remaining and produced amounts consistently', () => {
    const result = limitingReagent(haberReaction, { N2: n2Moles, H2: h2Moles })
    expect(result.extentMol).toBeCloseTo(h2Moles / 3, 6)
    expect(result.consumed.H2).toBeCloseTo(h2Moles, 6)
    expect(result.consumed.N2).toBeCloseTo(h2Moles / 3, 6)
    expect(result.remaining.H2).toBeCloseTo(0, 6)
    expect(result.remaining.N2).toBeCloseTo(n2Moles - h2Moles / 3, 6)
    expect(result.produced.NH3).toBeCloseTo((2 * h2Moles) / 3, 6)
  })

  it('treats a missing reactant as zero available', () => {
    const result = limitingReagent(haberReaction, { N2: 5 })
    expect(result.limiting).toBe('H2')
    expect(result.produced.NH3).toBe(0)
  })

  it('rejects negative available amounts', () => {
    expect(() => limitingReagent(haberReaction, { N2: -1, H2: 1 })).toThrow(RangeError)
  })
})
