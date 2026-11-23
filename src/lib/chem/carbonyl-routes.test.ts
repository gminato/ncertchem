import { describe, expect, it } from 'vitest'
import { molecularFormula, parseSmiles } from './molecule-parse'
import { CLASSES, ROUTES, REAGENTS, outcome, nameOfSpecies, BYPRODUCTS } from './carbonyl-routes'

const FORMULAS: Record<string, string> = {
  CCCCO: 'C4H10O',
  'CCCC=O': 'C4H8O',
  'CCC(O)CC': 'C5H12O',
  'CCC(=O)CC': 'C5H10O',
  CO: 'CH4O',
  'C=O': 'CH2O',
  'CC(C)=CC': 'C5H10',
  'CC(C)=O': 'C3H6O',
  'CC=O': 'C2H4O',
  'C#C': 'C2H2',
  'CC#CC': 'C4H6',
  'CCC(C)=O': 'C4H8O',
  'CCCC(=O)Cl': 'C4H7ClO',
  'CCCCC#N': 'C5H9N',
  'CCCCC=O': 'C5H10O',
  'CCCC(=O)OCC': 'C6H12O2',
}

describe('carbonyl route finder model', () => {
  it('asserts the molecular formula of every drawn compound and product', () => {
    const drawn = new Set<string>()
    for (const c of CLASSES) c.compounds.forEach((s) => drawn.add(s))
    for (const r of ROUTES) {
      drawn.add(r.smiles)
      r.products.filter((p) => !BYPRODUCTS.includes(p)).forEach((p) => drawn.add(p))
    }
    for (const s of drawn) {
      expect(FORMULAS[s], `expected formula listed for ${s}`).toBeDefined()
      expect(molecularFormula(parseSmiles(s)), s).toBe(FORMULAS[s])
    }
  })

  it('has every reagent used by a route and every class with compounds', () => {
    for (const r of REAGENTS) expect(ROUTES.some((x) => x.reagent === r.id), r.id).toBe(true)
    expect(CLASSES.every((c) => c.compounds.length > 0)).toBe(true)
  })

  it('oxidises a primary alcohol to an aldehyde and a secondary alcohol to a ketone', () => {
    expect(outcome('CCCCO', 'oxidise')).toMatchObject({ kind: 'product', names: ['butanal', 'H₂O'] })
    expect(outcome('CCC(O)CC', 'oxidise')).toMatchObject({ kind: 'product', names: ['pentan-3-one', 'H₂O'] })
  })

  it('dehydrogenates methanol over Ag or Cu to methanal and H₂', () => {
    expect(outcome('CO', 'agCu')).toMatchObject({ kind: 'product', names: ['methanal', 'H₂'] })
  })

  it('splits 2-methylbut-2-ene by ozonolysis into propan-2-one and ethanal', () => {
    expect(outcome('CC(C)=CC', 'ozone')).toMatchObject({ kind: 'product', names: ['propan-2-one', 'ethanal'] })
  })

  it('gives ethanal from ethyne and butan-2-one from but-2-yne', () => {
    expect(outcome('C#C', 'hydration')).toMatchObject({ kind: 'product', names: ['ethanal'] })
    expect(outcome('CC#CC', 'hydration')).toMatchObject({ kind: 'product', names: ['butan-2-one'] })
  })

  it('reduces butanoyl chloride to butanal with Rosenmund and pentanenitrile to pentanal with Stephen or DIBAL-H', () => {
    expect(outcome('CCCC(=O)Cl', 'rosenmund')).toMatchObject({ kind: 'product', names: ['butanal', 'HCl'] })
    expect(outcome('CCCCC#N', 'stephen')).toMatchObject({ kind: 'product', names: ['pentanal'] })
    expect(outcome('CCCCC#N', 'dibal')).toMatchObject({ kind: 'product', names: ['pentanal'] })
  })

  it('gives butanal from ethyl butanoate with DIBAL-H', () => {
    expect(outcome('CCCC(=O)OCC', 'dibal')).toMatchObject({ kind: 'product', names: ['butanal'] })
  })

  it('gives no product, with the reason, for a reagent set that does not start from this compound', () => {
    expect(outcome('CCCC(=O)Cl', 'stephen')).toEqual({
      kind: 'none',
      reason: 'Stephen reaction starts from a nitrile.',
      reagent: 'SnCl₂ + HCl, then H₃O⁺',
    })
    expect(outcome('C#C', 'oxidise')).toMatchObject({ kind: 'none', reason: 'Oxidation with [O] needs an alcohol.' })
    expect(outcome('CC(C)=CC', 'hydration')).toMatchObject({ kind: 'none' })
  })

  it('names by-products as formulas and organic species with the namer', () => {
    expect(nameOfSpecies('H₂O')).toBe('H₂O')
    expect(nameOfSpecies('CCCC=O')).toBe('butanal')
  })
})
