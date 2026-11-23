import { describe, expect, it } from 'vitest'
import { parseSmiles, molecularFormula } from './molecule-parse'
import { unit8Name } from './ncert-c12-unit8-data'
import { BENCH_ACIDS, BENCH_REAGENTS, acidSmiles, benchOutcome, highlightedBonds, type AcidId, type ReagentId } from './acid-derivative-bench'

describe('acid-derivative-bench', () => {
  it('draws each acid with the formula of its R-COOH', () => {
    expect(molecularFormula(parseSmiles(acidSmiles('ethanoic')))).toBe('C2H4O2')
    expect(molecularFormula(parseSmiles(acidSmiles('butanoic')))).toBe('C4H8O2')
    expect(molecularFormula(parseSmiles(acidSmiles('pentanoic')))).toBe('C5H10O2')
  })

  it('gives the hand-checked formula for each product of butanoic acid', () => {
    const want: Partial<Record<ReagentId, string>> = {
      anhydride: 'C8H14O3',
      methanol: 'C5H10O2',
      pcl5: 'C4H7ClO',
      pcl3: 'C4H7ClO',
      socl2: 'C4H7ClO',
      nh3: 'C4H9NO',
      lialh4: 'C4H10O',
      b2h6: 'C4H10O',
      'soda-lime': 'C3H8',
    }
    for (const [reagent, formula] of Object.entries(want)) {
      const p = benchOutcome('butanoic', reagent as ReagentId).product
      expect(p, reagent).not.toBeNull()
      expect(p!.formula, reagent).toBe(formula)
      expect(molecularFormula(parseSmiles(p!.smiles)), reagent).toBe(formula)
    }
  })

  it('asserts the formula of every drawn molecule for every acid and reagent', () => {
    for (const { id } of BENCH_ACIDS) {
      for (const reagent of BENCH_REAGENTS) {
        const o = benchOutcome(id as AcidId, reagent)
        if (!o.product) continue
        expect(o.product.formula).toBe(molecularFormula(parseSmiles(o.product.smiles)))
        if (reagent !== 'anhydride') expect(o.product.name).toBe(unit8Name(o.product.smiles))
        else expect(o.product.name).toBe(`${unit8Name(acidSmiles(id as AcidId)).replace(/ acid$/, '')} anhydride`)
      }
    }
  })

  it('names the acyl chloride and the ethanoic anhydride as the namer does', () => {
    expect(benchOutcome('butanoic', 'socl2').product!.name).toBe('butanoyl chloride')
    expect(benchOutcome('ethanoic', 'anhydride').product!.formula).toBe('C4H6O3')
    expect(benchOutcome('ethanoic', 'anhydride').product!.name).toBe('ethanoic anhydride')
    expect(benchOutcome('butanoic', 'anhydride').product!.name).toBe('butanoic anhydride')
    expect(['ethanoic', 'propanoic', 'butanoic', 'pentanoic'].map((a) => benchOutcome(a as AcidId, 'anhydride').product!.name)).toEqual([
      'ethanoic anhydride',
      'propanoic anhydride',
      'butanoic anhydride',
      'pentanoic anhydride',
    ])
  })

  it('counts carbons: soda-lime removes one, reduction and substitution keep the count', () => {
    const sl = benchOutcome('pentanoic', 'soda-lime')
    expect([sl.carbonsBefore, sl.carbonsAfter]).toEqual([5, 4])
    const red = benchOutcome('propanoic', 'lialh4')
    expect([red.carbonsBefore, red.carbonsAfter]).toEqual([3, 3])
  })

  it('says NaBH4 does not react, and which bond breaks for each reagent', () => {
    const nab = benchOutcome('butanoic', 'nabh4')
    expect(nab.reacts).toBe(false)
    expect(nab.product).toBeNull()
    expect(nab.bondBroken).toBe('none')
    expect(benchOutcome('butanoic', 'socl2').bondBroken).toBe('C–OH')
    expect(benchOutcome('butanoic', 'soda-lime').bondBroken).toBe('C–C')
  })

  it('shades exactly one C–OH bond or one C–C bond in the acid', () => {
    const g = parseSmiles(acidSmiles('butanoic'))
    const oh = highlightedBonds(g, 'C–OH')
    expect(oh).toHaveLength(1)
    const b = g.bonds[oh[0]]
    const ends = [g.atoms[b.a].element, g.atoms[b.b].element].sort()
    expect(ends).toEqual(['C', 'O'])
    const cc = highlightedBonds(g, 'C–C')
    expect(cc).toHaveLength(1)
    expect(highlightedBonds(g, 'none')).toEqual([])
  })

  it('gives methanol as CH4O', () => {
    expect(molecularFormula(parseSmiles('CO'))).toBe('CH4O')
  })
})
