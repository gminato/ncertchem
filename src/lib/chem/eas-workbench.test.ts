import { describe, expect, it } from 'vitest'
import { correctStageOrder, electrophileEquationText, isMechanismOrder, MECHANISM_STAGES, protonatedBase, reactionText, subscriptFormulas, workbenchReactions } from './eas-workbench'
import { molecularFormula } from './molecule-parse'

describe('mechanism order', () => {
  it('accepts the order generate, attack, deprotonate, restore and nothing else', () => {
    expect(isMechanismOrder(correctStageOrder())).toBe(true)
    expect(isMechanismOrder(['attack', 'generate', 'deprotonate', 'restore'])).toBe(false)
    expect(isMechanismOrder(['generate', 'attack', 'restore'])).toBe(false)
    expect(isMechanismOrder([...MECHANISM_STAGES].reverse())).toBe(false)
  })
})

describe('workbench reactions', () => {
  const all = workbenchReactions()

  it('has the five substitutions, the addition of Cl2 in UV and the hydrogenation, in that order', () => {
    expect(all.map((r) => r.id)).toEqual(['nitration', 'chlorination', 'sulphonation', 'alkylation', 'acylation', 'bhc', 'hydrogenation'])
    expect(all.filter((r) => r.kind === 'substitution')).toHaveLength(5)
  })

  it('takes the products and equations from the lib', () => {
    const byId = Object.fromEntries(all.map((r) => [r.id, r]))
    expect(byId.nitration.product.name).toBe('nitrobenzene')
    expect(byId.nitration.equation).toBe('\\ce{C6H6 + HNO3 -> C6H5NO2 + H2O}')
    expect(byId.hydrogenation.equation).toBe('\\ce{C6H6 + 3H2 -> C6H12}')
    expect(byId.bhc.equation).toBe('\\ce{C6H6 + 3Cl2 -> C6H6Cl6}')
  })

  it('every substitution has an electrophile, a base and a σ-complex with the right formula', () => {
    for (const r of all.filter((x) => x.kind === 'substitution')) {
      expect(r.electrophile?.name.length).toBeGreaterThan(3)
      expect(r.base).toMatch(/⁻$/)
      expect(r.sigma).toBeDefined()
      expect(r.sigmaFormula).toBeDefined()
    }
    expect(all.find((r) => r.id === 'nitration')!.sigmaFormula).toBe('C₆H₆NO₂⁺')
    expect(all.find((r) => r.id === 'chlorination')!.sigmaFormula).toBe('C₆H₆Cl⁺')
    expect(all.find((r) => r.id === 'nitration')!.base).toBe('HSO₄⁻')
    expect(all.find((r) => r.id === 'alkylation')!.base).toBe('AlCl₄⁻')
  })

  it('sulphonation σ-complex is neutral overall (ring cation with the SO₃⁻ group)', () => {
    const s = all.find((r) => r.id === 'sulphonation')!
    expect(molecularFormula(s.sigma!)).toBe('C6H6O3S')
  })

  it('addition reactions have no electrophile or σ-complex', () => {
    for (const r of all.filter((x) => x.kind === 'addition')) {
      expect(r.electrophile).toBeUndefined()
      expect(r.sigma).toBeUndefined()
    }
  })

  it('writes the nitration electrophile equation with subscripts', () => {
    expect(electrophileEquationText('\\ce{HNO3 + 2H2SO4 -> NO2+ + H3O+ + 2HSO4-}')).toBe('HNO₃ + 2H₂SO₄ → NO₂⁺ + H₃O⁺ + 2HSO₄⁻')
  })
})

describe('bases and equations as text', () => {
  it('the bases of the two electrophile equations are in the table, and their protonated forms are right', () => {
    expect(protonatedBase('HSO₄⁻')).toBe('H₂SO₄')
    expect(protonatedBase('AlCl₄⁻')).toBe('AlCl₃ + HCl')
    expect(() => protonatedBase('FeBr₄⁻')).toThrow(RangeError)
  })

  it('the alkylation electrophile is the methyl cation, and the workbench reaction text has its arrow', () => {
    const alk = workbenchReactions().find((r) => r.id === 'alkylation')!
    expect(alk.electrophile?.formula).toBe('CH₃⁺')
    expect(reactionText('\\ce{C6H6 + 3Cl2 -> C6H6Cl6}')).toBe('C₆H₆ + 3Cl₂ → C₆H₆Cl₆')
  })
})

describe('plain text with formulas', () => {
  it('subscripts the formulas in a condition and leaves numbers and names alone', () => {
    expect(subscriptFormulas('concentrated HNO3 and concentrated H2SO4 (nitrating mixture), heated')).toBe('concentrated HNO₃ and concentrated H₂SO₄ (nitrating mixture), heated')
    expect(subscriptFormulas('ultraviolet light (three Cl2 add to benzene)')).toBe('ultraviolet light (three Cl₂ add to benzene)')
    expect(subscriptFormulas('323-333 K')).toBe('323-333 K')
  })
})
