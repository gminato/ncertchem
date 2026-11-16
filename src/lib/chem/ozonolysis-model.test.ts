import { describe, expect, it } from 'vitest'
import { parseSmiles, canonicalKey, molecularFormula } from './molecule-parse'
import { nameOf } from './hydrocarbon-species'
import {
  FORWARD_PRESETS,
  REVERSE_PUZZLES,
  carbonylCarbons,
  chainAlkeneSmiles,
  checkReverse,
  doubleBondCount,
  forwardReaction,
  joinCarbonyls,
  polymerEquation,
  puzzleProducts,
} from './ozonolysis-model'

describe('chainAlkeneSmiles', () => {
  it('places the double bond between carbons k and k + 1', () => {
    expect(chainAlkeneSmiles(4, 2)).toBe('CC=CC')
    expect(chainAlkeneSmiles(5, 1)).toBe('C=CCCC')
    expect(chainAlkeneSmiles(5, 4)).toBe('CCCC=C')
  })
  it('rejects a double bond outside the chain', () => {
    expect(() => chainAlkeneSmiles(4, 0)).toThrow(RangeError)
    expect(() => chainAlkeneSmiles(4, 4)).toThrow(RangeError)
    expect(() => chainAlkeneSmiles(1, 1)).toThrow(RangeError)
  })
})

describe('forward reactions', () => {
  it('ozonolysis of 1-methylcyclohexene gives 6-oxoheptanal', () => {
    const r = forwardReaction(parseSmiles(FORWARD_PRESETS[2].smiles), 'ozone')
    expect(r.products).toHaveLength(1)
    expect(r.products[0].name).toBe('6-oxoheptanal')
    expect(r.products[0].formula).toBe('C7H12O2')
  })
  it('ozonolysis of the diene gives three products (two C=C bonds are cut)', () => {
    const diene = parseSmiles('C=CC=CC')
    expect(doubleBondCount(diene)).toBe(2)
    expect(forwardReaction(diene, 'ozone').products).toHaveLength(3)
  })
  it('Baeyer applies to a mono-alkene and refuses a diene', () => {
    expect(forwardReaction(parseSmiles('CC=CC'), 'baeyer').products[0].name).toBe('butane-2,3-diol')
    expect(() => forwardReaction(parseSmiles('C=CC=CC'), 'baeyer')).toThrow(RangeError)
  })
})

describe('carbonyl carbons and the reverse join', () => {
  it('finds the carbonyl carbons of two aldehydes or ketones', () => {
    const found = carbonylCarbons(puzzleProducts('two-molecules'))
    expect(found).toHaveLength(2)
    expect(found.map((f) => f.part)).toEqual([0, 1])
  })
  it('finds both carbonyl carbons of 6-oxoheptanal', () => {
    expect(carbonylCarbons(puzzleProducts('one-molecule'))).toHaveLength(2)
  })
  it('joining the two carbonyl carbons of ethanal and propanone gives 2-methylbut-2-ene', () => {
    const products = puzzleProducts('two-molecules')
    const [a, b] = carbonylCarbons(products)
    const { matches, built, expectedName } = checkReverse(products, a, b)
    expect(matches).toBe(true)
    expect(expectedName).toBe('2-methylbut-2-ene')
    expect(nameOf(built)).toBe('2-methylbut-2-ene')
    expect(molecularFormula(built)).toBe('C5H10')
  })
  it('joining the carbonyls of 6-oxoheptanal closes the ring to 1-methylcyclohexene', () => {
    const products = puzzleProducts('one-molecule')
    const [a, b] = carbonylCarbons(products)
    const { matches, built } = checkReverse(products, a, b)
    expect(matches).toBe(true)
    expect(canonicalKey(built)).toBe(canonicalKey(parseSmiles('CC1=CCCCC1')))
  })
  it('the reverse puzzles round-trip through the forward ozonolysis', () => {
    for (const p of REVERSE_PUZZLES) {
      const products = puzzleProducts(p.id)
      const [a, b] = carbonylCarbons(products)
      expect(checkReverse(products, a, b).matches).toBe(true)
    }
  })
  it('refuses to join a carbon that has no oxygen, or the same carbon twice', () => {
    const products = puzzleProducts('two-molecules')
    const [a] = carbonylCarbons(products)
    expect(() => joinCarbonyls(products, a, a)).toThrow(RangeError)
    const methyl = { part: 0, atom: 0, oxygen: 0 }
    expect(() => joinCarbonyls(products, a, methyl)).toThrow(RangeError)
  })
})

describe('polymerEquation', () => {
  it('writes the repeat unit of polythene with the NCERT condition', () => {
    const p = polymerEquation(parseSmiles('C=C'))
    expect(p.monomer).toBe('CH2=CH2')
    expect(p.unit).toBe('CH2CH2')
    expect(p.equation).toContain('high temperature and pressure with a catalyst')
    expect(p.equation).not.toMatch(/\(CH2=CH2\)/)
  })
})
