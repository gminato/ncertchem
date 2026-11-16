import { describe, expect, it } from 'vitest'
import { ADDITION_ALKENES, additionCase, doubleBondCarbons, intermediateGraph } from './addition-model'
import { parseSmiles } from './molecule-parse'
import { nameOf } from './hydrocarbon-species'

describe('ADDITION_ALKENES', () => {
  it('offers at least six alkenes, each with exactly one C=C', () => {
    expect(ADDITION_ALKENES.length).toBeGreaterThanOrEqual(6)
    for (const a of ADDITION_ALKENES) expect(() => doubleBondCarbons(parseSmiles(a.smiles))).not.toThrow()
  })

  it('marks symmetrical alkenes as symmetrical in the lib (one candidate product for HBr)', () => {
    for (const a of ADDITION_ALKENES) {
      const c = additionCase(a.smiles, 'HBr')
      const candidates = c.reaction.intermediates?.length ?? 0
      expect(candidates === 1, a.id).toBe(a.symmetric)
    }
  })
})

describe('additionCase', () => {
  it('propene + HBr: the 2° carbocation on carbon 2 gives 2-bromopropane (Markovnikov)', () => {
    const c = additionCase('C=CC', 'HBr')
    expect(c.reaction.products.find((p) => p.major)?.name).toBe('2-bromopropane')
    expect(c.majorCarbon).toBe(1)
    expect(c.correctCarbons).toEqual([1])
    const major = c.intermediates.find((i) => i.major)
    expect(major?.centre).toBe(1)
    expect(major?.kind).toBe('carbocation')
    expect(major?.graph.atoms[1].charge).toBe(1)
  })

  it('propene + HBr with peroxide: the radical gives 1-bromopropane (anti-Markovnikov)', () => {
    const c = additionCase('C=CC', 'HBr-peroxide')
    expect(c.reaction.products.find((p) => p.major)?.name).toBe('1-bromopropane')
    expect(c.correctCarbons).toEqual([0])
    const major = c.intermediates.find((i) => i.major)
    expect(major?.centre).toBe(1)
    expect(major?.kind).toBe('radical')
    expect(major?.graph.atoms[1].radical).toBe(1)
    // The Br• joins the other carbon (index 0, the CH2 end) in the radical intermediate.
    expect(major?.graph.atoms.at(-1)?.element).toBe('Br')
  })

  it('names every offered alkene from the lib, and the product of HBr on it', () => {
    const names = ADDITION_ALKENES.map((a) => nameOf(parseSmiles(a.smiles)))
    expect(names).toEqual(['ethene', 'propene', 'but-1-ene', 'but-2-ene', '2-methylprop-1-ene', '2-methylbut-1-ene', 'cyclohexene'])
    expect(additionCase('C=C(C)CC', 'HBr').reaction.products[0].name).toBe('2-bromo-2-methylbutane')
  })

  it('ethene accepts either carbon, since both give the same product', () => {
    expect(additionCase('C=C', 'HBr').correctCarbons).toEqual([0, 1])
    expect(additionCase('C=C', 'H2O').reaction.products[0].name).toBe('ethanol')
  })

  it('2-methylpropene + H2O: the tertiary cation on carbon 2 gives 2-methylpropan-2-ol', () => {
    const c = additionCase('C=C(C)C', 'H2O')
    expect(c.correctCarbons).toEqual([1])
    expect(nameOf(c.reaction.products[0].graph)).toBe('2-methylpropan-2-ol')
  })

  it('H₂ and Br₂ ask no carbon question, and the lib names their products', () => {
    const h2 = additionCase('C=CC', 'H2')
    expect(h2.asksCarbon).toBe(false)
    expect(h2.reaction.products[0].name).toBe('propane')
    const br = additionCase('C=CC', 'Br2')
    expect(br.reaction.products[0].name).toBe('1,2-dibromopropane')
  })

  it('HI and HCl add by the same Markovnikov orientation on propene', () => {
    expect(additionCase('C=CC', 'HI').majorCarbon).toBe(1)
    expect(additionCase('C=CC', 'HCl').majorCarbon).toBe(1)
  })
})

describe('intermediateGraph', () => {
  it('a carbocation on the centre leaves the other carbon with one more hydrogen', () => {
    const g = parseSmiles('C=CC')
    const cation = intermediateGraph(g, [0, 1], 1, 'carbocation')
    expect(cation.atoms[1].charge).toBe(1)
    expect(cation.atoms[0].hCount).toBe(3)
    expect(cation.atoms[1].hCount).toBe(1)
  })
})
