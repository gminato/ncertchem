import { describe, expect, it } from 'vitest'
import { canonicalKey, molecularFormula, parseSmiles } from './molecule-parse'
import { electrophilicSubstitution } from './hydrocarbon-reactions'
import {
  equationTerms,
  formulaText,
  methylCation,
  nitroniumIon,
  sigmaContributor,
  sigmaContributors,
  electrophileFragment,
  substitutionOfBenzene,
} from './eas-mechanism'

const benzene = parseSmiles('C1=CC=CC=C1')

describe('σ-complex contributors', () => {
  it('nitration: every contributor is C6H6NO2+ (benzene plus NO2+)', () => {
    for (const g of sigmaContributors('nitration')) expect(molecularFormula(g)).toBe('C6H6NO2+')
  })

  it('chlorination, alkylation and acylation keep the formula of benzene plus the electrophile', () => {
    for (const g of sigmaContributors('chlorination')) expect(molecularFormula(g)).toBe('C6H6Cl+')
    for (const g of sigmaContributors('alkylation', parseSmiles('CCl'))) expect(molecularFormula(g)).toBe('C7H9+')
    for (const g of sigmaContributors('acylation', parseSmiles('CC(=O)Cl'))) expect(molecularFormula(g)).toBe('C8H9O+')
  })

  it('sulphonation: the zwitterion (ring cation plus SO3⁻ group) is neutral overall', () => {
    for (const g of sigmaContributors('sulphonation')) expect(molecularFormula(g)).toBe('C6H6O3S')
  })

  it('the contributor with the + on position 1 is the same ion as the lib’s σ-complex for nitration', () => {
    const lib = electrophilicSubstitution(benzene, 'nitration').sigmaComplex
    expect(lib).toBeDefined()
    expect(canonicalKey(sigmaContributor(benzene, electrophileFragment('nitration'), 1))).toBe(canonicalKey(lib!.graph))
  })

  it('each contributor has one + ring carbon, and the sp³ carbon (ring atom 0) bears H and the electrophile', () => {
    sigmaContributors('nitration').forEach((g) => {
      const cations = g.atoms.filter((a) => a.charge === 1 && a.element === 'C')
      expect(cations).toHaveLength(1)
      expect(g.atoms[0].hCount).toBe(1)
      expect(g.bonds.some((b) => (b.a === 0 && b.b === 6) || (b.a === 6 && b.b === 0))).toBe(true)
    })
  })

  it('contributors 1 and 5 are mirror images (ortho), contributor 3 is the para form, so two distinct ions', () => {
    const [c1, c3, c5] = sigmaContributors('nitration').map((g) => canonicalKey(g))
    expect(c1).toBe(c5)
    expect(c3).not.toBe(c1)
  })

  it('throws for a ring that is not benzene and for an alkylation with a non-methyl halide', () => {
    expect(() => sigmaContributor(parseSmiles('CC1=CC=CC=C1'), electrophileFragment('nitration'), 1)).toThrow(RangeError)
    expect(() => electrophileFragment('alkylation', parseSmiles('CCCl'))).toThrow(RangeError)
  })
})

describe('electrophiles and the substitution reactions', () => {
  it('nitronium is NO2+ and the methyl cation is CH3+', () => {
    expect(molecularFormula(nitroniumIon())).toBe('NO2+')
    expect(molecularFormula(methylCation())).toBe('CH3+')
  })

  it('substitutionOfBenzene gives the lib’s nitrobenzene and toluene', () => {
    expect(substitutionOfBenzene('nitration').products[0].name).toBe('nitrobenzene')
    expect(substitutionOfBenzene('alkylation', parseSmiles('CCl')).products[0].formula).toBe('C7H8')
  })
})

describe('text for a drawing', () => {
  it('writes subscripts after letters and superscript charges', () => {
    expect(formulaText('NO2+')).toBe('NO₂⁺')
    expect(formulaText('HSO4-')).toBe('HSO₄⁻')
    expect(formulaText('H3O+')).toBe('H₃O⁺')
    expect(formulaText('2HSO4-')).toBe('2HSO₄⁻')
    expect(formulaText('AlCl4-')).toBe('AlCl₄⁻')
  })

  it('reads the species of the nitration electrophile equation from the lib', () => {
    const { electrophile } = electrophilicSubstitution(benzene, 'nitration')
    const { reactants, products } = equationTerms(electrophile!.equation)
    expect(reactants).toEqual(['HNO3', '2H2SO4'])
    expect(products).toEqual(['NO2+', 'H3O+', '2HSO4-'])
  })
})
