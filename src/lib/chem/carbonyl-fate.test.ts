import { describe, expect, it } from 'vitest'
import {
  CANNIZZARO_PRODUCTS,
  CARBONYLS,
  NITRO_PRODUCTS,
  alphaHydrogenCaption,
  carbonylById,
  carbonylName,
  formulaOf,
  outcomeOf,
  productsOf,
} from './carbonyl-fate'
import { unit8Name } from '@/lib/chem/ncert-c12-unit8-data'

describe('carbonyl fate: outcomes', () => {
  it('Cannizzaro only for an aldehyde with no alpha-H in concentrated alkali', () => {
    expect(outcomeOf(carbonylById('methanal'), 'conc-alkali')).toBe('cannizzaro')
    expect(outcomeOf(carbonylById('benzaldehyde'), 'conc-alkali')).toBe('cannizzaro')
    expect(outcomeOf(carbonylById('ethanal'), 'conc-alkali')).toBe('none')
    expect(outcomeOf(carbonylById('acetophenone'), 'conc-alkali')).toBe('none')
  })

  it('no Cannizzaro in dilute alkali', () => {
    for (const c of CARBONYLS) expect(outcomeOf(c, 'dilute-alkali')).toBe('none')
  })

  it('meta substitution only for an aromatic carbonyl with the nitrating mix', () => {
    expect(outcomeOf(carbonylById('benzaldehyde'), 'nitrating-mix')).toBe('meta-substitution')
    expect(outcomeOf(carbonylById('acetophenone'), 'nitrating-mix')).toBe('meta-substitution')
    expect(outcomeOf(carbonylById('methanal'), 'nitrating-mix')).toBe('none')
    expect(outcomeOf(carbonylById('ethanal'), 'nitrating-mix')).toBe('none')
  })

  it('draws products only when the outcome is not none', () => {
    expect(productsOf(carbonylById('ethanal'), 'conc-alkali')).toEqual([])
    expect(productsOf(carbonylById('methanal'), 'conc-alkali')).toHaveLength(2)
    expect(productsOf(carbonylById('benzaldehyde'), 'nitrating-mix')).toHaveLength(1)
  })
})

describe('carbonyl fate: every drawn molecule', () => {
  it('carbonyls: formula from molecularFormula and the lib name', () => {
    expect(formulaOf(carbonylById('methanal').smiles)).toBe('CH2O')
    expect(formulaOf(carbonylById('ethanal').smiles)).toBe('C2H4O')
    expect(formulaOf(carbonylById('benzaldehyde').smiles)).toBe('C7H6O')
    expect(formulaOf(carbonylById('acetophenone').smiles)).toBe('C8H8O')
    expect(carbonylName(carbonylById('methanal'))).toBe('methanal')
    expect(carbonylName(carbonylById('ethanal'))).toBe('ethanal')
    expect(carbonylName(carbonylById('benzaldehyde'))).toBe('benzaldehyde')
  })

  it('Cannizzaro products match their expected formula and name', () => {
    for (const list of Object.values(CANNIZZARO_PRODUCTS)) {
      for (const p of list ?? []) {
        expect(formulaOf(p.smiles), p.smiles).toBe(p.formula)
        if (p.name !== null) expect(unit8Name(p.smiles), p.smiles).toBe(p.name)
      }
    }
  })

  it('nitration products match their expected formula', () => {
    for (const p of Object.values(NITRO_PRODUCTS)) {
      if (!p) continue
      expect(formulaOf(p.smiles), p.smiles).toBe(p.formula)
    }
  })
})

describe('carbonyl fate: alpha-hydrogen note', () => {
  it('ethanal under conc. NaOH gives the aldol note, not a Cannizzaro product', () => {
    expect(alphaHydrogenCaption(carbonylById('ethanal')).join(' ')).toBe(
      'Ethanal has α-hydrogens, so it does not undergo the Cannizzaro reaction. With dilute alkali it gives the aldol reaction instead (Section 8.4.4).',
    )
    expect(productsOf(carbonylById('ethanal'), 'conc-alkali')).toEqual([])
  })
})
