import { describe, expect, it } from 'vitest'
import { NCERT_TABLE_6_4 } from './ncert-c12-unit6-data'
import {
  PICKER_REAGENTS,
  PICKER_SUBSTRATES,
  pickerName,
  pickerProduct,
} from './nucleophile-picker'

describe('nucleophile picker: substrates and reagents', () => {
  it('names each substrate with the namer', () => {
    expect(PICKER_SUBSTRATES.map((s) => pickerName(s.smiles))).toEqual([
      'bromoethane',
      '1-bromobutane',
      '2-bromopropane',
    ])
  })

  it('covers every row of NCERT Table 6.4 exactly once', () => {
    const rows = PICKER_REAGENTS.map((r) => r.row).sort((a, b) => a - b)
    expect(rows).toEqual(NCERT_TABLE_6_4.map((_, i) => i))
  })

  it('pairs each ambident reagent with its partner, and names both ways of attack', () => {
    const byId = new Map(PICKER_REAGENTS.map((r) => [r.id, r]))
    expect(byId.get('kcn')?.attackAtom).toBe('C')
    expect(byId.get('agcn')?.attackAtom).toBe('N')
    expect(byId.get('kno2')?.attackAtom).toBe('O')
    expect(byId.get('agno2')?.attackAtom).toBe('N')
    expect(byId.get('kcn')?.partner).toBe('agcn')
    expect(byId.get('agcn')?.partner).toBe('kcn')
    expect(byId.get('kno2')?.partner).toBe('agno2')
    expect(byId.get('agno2')?.partner).toBe('kno2')
  })
})

describe('nucleophile picker: products', () => {
  const cases: [string, string, string][] = [
    ['bromoethane', 'naoh', 'C2H6O'],
    ['bromoethane', 'h2o', 'C2H6O'],
    ['bromoethane', 'naor', 'C3H8O'],
    ['bromoethane', 'nai', 'C2H5I'],
    ['bromoethane', 'nh3', 'C2H7N'],
    ['bromoethane', 'r-nh2', 'C3H9N'],
    ['bromoethane', 'r2-nh', 'C4H11N'],
    ['bromoethane', 'kcn', 'C3H5N'],
    ['bromoethane', 'agcn', 'C3H5N'],
    ['bromoethane', 'kno2', 'C2H5NO2'],
    ['bromoethane', 'agno2', 'C2H5NO2'],
    ['bromoethane', 'r-coo-ag', 'C4H8O2'],
    ['bromoethane', 'lialh4', 'C2H6'],
    ['bromoethane', 'r-m', 'C3H8'],
    ['1-bromobutane', 'kcn', 'C5H9N'],
    ['1-bromobutane', 'naoh', 'C4H10O'],
    ['2-bromopropane', 'nh3', 'C3H9N'],
  ]

  it.each(cases)('%s with %s has formula %s', (sub, reagent, formula) => {
    expect(pickerProduct(sub, reagent).formula).toBe(formula)
  })

  it('gives the names the namer prints for the products it can name', () => {
    expect(pickerProduct('bromoethane', 'naoh').name).toBe('ethanol')
    expect(pickerProduct('bromoethane', 'kcn').name).toBe('propanenitrile')
    expect(pickerProduct('bromoethane', 'agno2').name).toBe('nitroethane')
    expect(pickerProduct('bromoethane', 'nh3').name).toBe('ethanamine')
    expect(pickerProduct('bromoethane', 'naor').name).toBe('methoxyethane')
    expect(pickerProduct('bromoethane', 'nai').name).toBe('iodoethane')
    expect(pickerProduct('bromoethane', 'lialh4').name).toBe('ethane')
    expect(pickerProduct('bromoethane', 'r-m').name).toBe('propane')
    expect(pickerProduct('2-bromopropane', 'nai').name).toBe('2-iodopropane')
    expect(pickerProduct('1-bromobutane', 'kcn').name).toBe('pentanenitrile')
  })

  it('gives no name for groups the namer refuses, and never an error sentence in place of a name', () => {
    for (const r of ['agcn', 'kno2', 'r-nh2', 'r2-nh']) {
      expect(pickerProduct('bromoethane', r).name).toBeNull()
    }
    for (const sub of PICKER_SUBSTRATES) {
      for (const r of PICKER_REAGENTS) {
        const name = pickerProduct(sub.id, r.id).name
        if (name !== null) {
          expect(name).not.toMatch(/named|rules/)
        }
      }
    }
  })

  it('puts the attacking atom at the highlighted index, with the reagent element', () => {
    for (const sub of PICKER_SUBSTRATES) {
      for (const r of PICKER_REAGENTS) {
        const p = pickerProduct(sub.id, r.id)
        if (r.attackAtom === null) {
          expect(p.attackIndex).toBeNull()
        } else {
          expect(p.graph.atoms[p.attackIndex!].element).toBe(r.attackAtom)
        }
      }
    }
  })

  it('finds the carbon that bore the halogen', () => {
    expect(pickerProduct('bromoethane', 'naoh').carbonIndex).toBe(1)
    expect(pickerProduct('1-bromobutane', 'naoh').carbonIndex).toBe(3)
    expect(pickerProduct('2-bromopropane', 'naoh').carbonIndex).toBe(1)
  })

  it('carries the Table 6.4 product class', () => {
    expect(pickerProduct('bromoethane', 'kcn').productClass).toBe('Nitrile (cyanide)')
    expect(pickerProduct('bromoethane', 'agcn').productClass).toBe('Isonitrile (isocyanide)')
  })
})
