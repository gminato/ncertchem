import { describe, expect, it } from 'vitest'
import { parseSmiles } from './molecule-parse'
import { alkeneGeometry, assertBalanced, balancedEquation, CO2, countsOf, deleteAtoms, formulaFromCounts, formulaOf, hydrogenCarbons, O2, placeAlkene, rebuild, speciesOf, type Term, WATER } from './hydrocarbon-species'

const term = (coef: number, species: ReturnType<typeof speciesOf>): Term => ({ coef, species })

const g = parseSmiles

describe('species helpers', () => {
  it('speciesOf gives a condensed label, counts and a name', () => {
    const s = speciesOf(g('CC=C'))
    expect(s.label).toBe('CH3CH=CH2')
    expect(s.counts).toEqual({ C: 3, H: 6 })
    expect(s.name).toBe('propene')
  })
  it('formulaFromCounts uses Hill order', () => {
    expect(formulaFromCounts({ H: 2, O: 1 })).toBe('H2O')
    expect(formulaFromCounts({ Na: 1, C: 2, H: 1 })).toBe('C2HNa')
    expect(formulaFromCounts({ C: 6, H: 6 })).toBe('C6H6')
  })
  it('countsOf counts atoms by element', () => {
    expect(countsOf(g('C=C'))).toEqual({ C: 2, H: 4 })
  })
  it('balancedEquation builds a mhchem string and checks the balance', () => {
    const h2 = { label: 'H2', counts: { H: 2 }, name: 'hydrogen' }
    const eq = balancedEquation([term(1, speciesOf(g('C=C'))), term(1, h2)], [term(1, speciesOf(g('CC')))])
    expect(eq).toBe('\\ce{CH2=CH2 + H2 -> CH3CH3}')
  })
  it('an unbalanced equation is rejected', () => {
    expect(() => assertBalanced([term(1, speciesOf(g('C=C')))], [term(1, speciesOf(g('CC')))])).toThrow()
  })
  it('equation text uses the reagent constants (water, oxygen, carbon dioxide)', () => {
    expect(WATER.label).toBe('H2O')
    expect(O2.counts).toEqual({ O: 2 })
    expect(CO2.counts).toEqual({ C: 1, O: 2 })
  })
  it('placeAlkene sets the geometry that alkeneGeometry reads', () => {
    const cis = placeAlkene(g('CC=CC'), 1, 2, true)
    const trans = placeAlkene(g('CC=CC'), 1, 2, false)
    expect(alkeneGeometry(cis)).toBe('cis')
    expect(alkeneGeometry(trans)).toBe('trans')
  })
  it('placeAlkene rejects a pair that is not a C=C', () => {
    expect(() => placeAlkene(g('CCC'), 0, 1, true)).toThrow(RangeError)
  })
  it('hydrogenCarbons lists each carbon with its hydrogens', () => {
    expect(hydrogenCarbons(g('CC=C')).map((x) => x.hydrogens)).toEqual([3, 1, 2])
  })
  it('formulaOf gives the molecular formula', () => {
    expect(formulaOf(g('C#C'))).toBe('C2H2')
  })
  it('deleteAtoms removes atoms and rebuilds the hydrogens', () => {
    const r = deleteAtoms(g('CCBr'), [2])
    expect(countsOf(r)).toEqual({ C: 2, H: 6 })
  })
  it('rebuild gives a carbon the hydrogens its valence needs', () => {
    const m = rebuild([{ element: 'C' }, { element: 'C' }], [{ a: 0, b: 1, order: 2 }])
    expect(countsOf(m)).toEqual({ C: 2, H: 4 })
  })
})
