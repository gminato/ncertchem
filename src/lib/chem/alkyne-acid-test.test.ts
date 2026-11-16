import { describe, expect, it } from 'vitest'
import { parseSmiles } from './molecule-parse'
import { acidTest, ACID_TEST_SMILES, toDisplay } from './alkyne-acid-test'
import { addToAlkyne } from './hydrocarbon-reactions'
import { nameOf } from './hydrocarbon-species'

describe('acidTest (NCERT 9.4.4 A)', () => {
  it('ethyne with sodium: 2 HC≡CH + 2 Na gives 2 HC≡CNa and H2', () => {
    const r = acidTest(parseSmiles('C#C'), 'Na')
    expect(r.reacts).toBe(true)
    expect(r.equation).toBe('\\ce{2CH#CH + 2Na -> 2CH#CNa + H2}')
    expect(r.salt?.name).toBe('sodium ethynide')
    expect(r.salt?.formula).toBe('C2HNa')
    expect(r.byproduct).toBe('H₂')
  })

  it('propyne with sodamide gives the propynide with the whole CH3 kept', () => {
    const r = acidTest(parseSmiles('CC#C'), 'NaNH2')
    expect(r.equation).toBe('\\ce{CH#CCH3 + NaNH2 -> CH3C#CNa + NH3}')
    expect(r.salt?.label).toBe('CH3C#CNa')
    expect(r.salt?.name).toBe('sodium propynide')
    expect(r.salt?.formula).toBe('C3H3Na')
    expect(r.byproduct).toBe('NH₃')
  })

  it('but-1-yne keeps its ethyl group in the salt label', () => {
    const r = acidTest(parseSmiles('CCC#C'), 'Na')
    expect(r.salt?.label).toBe('CH3CH2C#CNa')
    expect(r.salt?.name).toBe('sodium but-1-ynide')
  })

  it('but-2-yne (internal) does not react with either base', () => {
    for (const base of ['Na', 'NaNH2'] as const) {
      const r = acidTest(parseSmiles('CC#CC'), base)
      expect(r.reacts).toBe(false)
      expect(r.equation).toBeUndefined()
    }
  })

  it('ethane and ethene do not react', () => {
    expect(acidTest(parseSmiles('CC'), 'Na').reacts).toBe(false)
    expect(acidTest(parseSmiles('C=C'), 'NaNH2').reacts).toBe(false)
  })

  it('the six test hydrocarbons have names from the lib', () => {
    const names = ACID_TEST_SMILES.map((s) => nameOf(parseSmiles(s)))
    expect(names).toEqual(['ethane', 'ethene', 'ethyne', 'propyne', 'but-1-yne', 'but-2-yne'])
  })

  it('rejects a molecule with a heteroatom', () => {
    expect(() => acidTest(parseSmiles('C#CO'), 'Na')).toThrow(RangeError)
  })
})

describe('addToAlkyne on the test list', () => {
  it('propyne with HBr twice gives 2,2-dibromopropane as the end product', () => {
    const r = addToAlkyne(parseSmiles('CC#C'), 'HX', { x: 'Br' })
    expect(r.products[1].name).toBe('2,2-dibromopropane')
  })
})

describe('toDisplay', () => {
  it('turns mhchem text into display text', () => {
    expect(toDisplay('CH#CNa')).toBe('CH≡CNa')
    expect(toDisplay('CCl4 solvent')).toBe('CCl₄ solvent')
    expect(toDisplay('Hg2+ and H+ (dilute H2SO4) at 333 K')).toBe('Hg²⁺ and H⁺ (dilute H₂SO₄) at 333 K')
    expect(toDisplay('Ca(OH)2')).toBe('Ca(OH)₂')
  })
})
