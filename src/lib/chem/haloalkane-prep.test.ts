import { describe, expect, it } from 'vitest'
import { parseSmiles, molecularFormula } from './molecule-parse'
import { iupacNameFromSmiles } from './iupac-organic'
import {
  REAGENTS_FOR,
  STARTING,
  compoundOf,
  prepOutcome,
  startingName,
  type StartingId,
} from './haloalkane-prep'

describe('starting materials', () => {
  it('names each starting material with the namer', () => {
    expect(startingName('butanol')).toBe('butan-1-ol')
    expect(startingName('tert-butanol')).toBe('2-methylpropan-2-ol')
    expect(startingName('butene')).toBe('but-1-ene')
    expect(startingName('butane')).toBe('butane')
    expect(startingName('chlorobutane')).toBe('1-chlorobutane')
    expect(startingName('bromobutane')).toBe('1-bromobutane')
  })

  it('has the formulas NCERT-style counting gives', () => {
    expect(compoundOf('CCCCO').formula).toBe('C₄H₁₀O')
    expect(compoundOf('CC(C)(C)O').formula).toBe('C₄H₁₀O')
    expect(compoundOf('C=CCC').formula).toBe('C₄H₈')
    expect(compoundOf('CCCC').formula).toBe('C₄H₁₀')
    expect(compoundOf('CCCCCl').formula).toBe('C₄H₉Cl')
    expect(compoundOf('CCCCBr').formula).toBe('C₄H₉Br')
    expect(molecularFormula(parseSmiles('CCCCBr'))).toBe('C4H9Br')
  })
})

describe('prepOutcome', () => {
  it('names the products of each route as the Section prose does', () => {
    const cases: [StartingId, Parameters<typeof prepOutcome>[1], string[]][] = [
      ['butanol', 'hbr', ['1-bromobutane']],
      ['butanol', 'socl2', ['1-chlorobutane']],
      ['tert-butanol', 'hcl', ['2-chloro-2-methylpropane']],
      ['butene', 'hbr', ['2-bromobutane']],
      ['butene', 'br2-ccl4', ['1,2-dibromobutane']],
      ['chlorobutane', 'nai', ['1-iodobutane']],
      ['bromobutane', 'nai', ['1-iodobutane']],
      ['chlorobutane', 'agf', ['1-fluorobutane']],
      ['bromobutane', 'agf', ['1-fluorobutane']],
    ]
    for (const [start, reagent, names] of cases) {
      const out = prepOutcome(start, reagent)
      expect(out, `${start} + ${reagent}`).not.toBeNull()
      expect(out!.products.map((p) => p.name)).toEqual(names)
    }
  })

  it('gives the butane chlorination mixture as the monochloro isomers, flagged as a mixture', () => {
    const out = prepOutcome('butane', 'cl2')!
    expect(out.verdict).toBe('mixture')
    expect(out.products.map((p) => p.name).sort()).toEqual(['1-chlorobutane', '2-chlorobutane'])
    expect(out.byProducts).toEqual([{ formula: 'HCl', state: 'gas', text: 'escapes as a gas' }])
  })

  it('gives the Markovnikov product for but-1-ene with HBr', () => {
    const out = prepOutcome('butene', 'hbr')!
    expect(out.verdict).toBe('major')
    expect(out.products[0].name).toBe('2-bromobutane')
    expect(iupacNameFromSmiles('CCC(C)Br')).toBe('2-bromobutane')
  })

  it('lists the by-products with the state NCERT describes', () => {
    expect(prepOutcome('butanol', 'socl2')!.byProducts.map((b) => [b.formula, b.state])).toEqual([
      ['SO₂', 'gas'],
      ['HCl', 'gas'],
    ])
    expect(prepOutcome('chlorobutane', 'nai')!.byProducts).toEqual([
      { formula: 'NaCl', state: 'solid', text: 'settles as a precipitate' },
    ])
    expect(prepOutcome('bromobutane', 'agf')!.byProducts[0].formula).toBe('AgBr')
  })

  it('returns null for a reagent that does not act on the starting material', () => {
    expect(prepOutcome('butane', 'hbr')).toBeNull()
    expect(prepOutcome('butanol', 'agf')).toBeNull()
    expect(prepOutcome('tert-butanol', 'socl2')).toBeNull()
  })

  it('has an outcome for every listed starting material and reagent pair', () => {
    for (const s of STARTING) {
      for (const r of REAGENTS_FOR[s.id]) {
        expect(prepOutcome(s.id, r), `${s.id} + ${r}`).not.toBeNull()
      }
    }
  })
})
