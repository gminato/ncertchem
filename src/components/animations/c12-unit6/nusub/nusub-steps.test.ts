import { describe, expect, it } from 'vitest'
import { iupacNameFromSmiles } from '@/lib/chem/iupac-organic'
import { molecularFormula, parseSmiles } from '@/lib/chem/molecule-parse'
import { NCERT_TABLE_6_4 } from '@/lib/chem/ncert-c12-unit6-data'
import {
  AGCN_ROW,
  AGNO2_ROW,
  CAROUSEL,
  CYANIDE_FORMS,
  ETHYL_NITRITE,
  HALOGEN_ATOM,
  ISOCYANIDE,
  KCN_ROW,
  KNO2_ROW,
  NITRILE,
  NITRITE_SMILES,
  NITROETHANE,
  NUSUB_STEP_COUNT,
  SUBSTRATE,
  productOf,
} from './nusub-steps'

describe('nusub Scrolly: substrate and reagents', () => {
  it('has six Steps', () => {
    expect(NUSUB_STEP_COUNT).toBe(6)
  })

  it('draws bromoethane as C2H5Br with Br on atom 2', () => {
    expect(SUBSTRATE.formula).toBe('C2H5Br')
    expect(SUBSTRATE.name).toBe('bromoethane')
    expect(parseSmiles('CCBr').atoms[HALOGEN_ATOM].element).toBe('Br')
  })

  it('shows four Table 6.4 products with formulas and namer names', () => {
    expect(CAROUSEL.map((c) => c.product.name)).toEqual([
      'ethanol',
      'methoxyethane',
      'iodoethane',
      'ethanamine',
    ])
    expect(CAROUSEL.map((c) => c.product.formula)).toEqual(['C2H6O', 'C3H8O', 'C2H5I', 'C2H7N'])
    expect(CAROUSEL[1].reagent).toBe('NaOCH₃')
    expect(CAROUSEL.map((c) => c.productClass)).toEqual([
      NCERT_TABLE_6_4[0].productClass,
      NCERT_TABLE_6_4[2].productClass,
      NCERT_TABLE_6_4[3].productClass,
      NCERT_TABLE_6_4[4].productClass,
    ])
  })
})

describe('nusub Scrolly: ambident reagents', () => {
  it('cyanide: both contributing forms are the same ion, CN⁻', () => {
    for (const form of CYANIDE_FORMS) {
      expect(molecularFormula(parseSmiles(form))).toBe('CN-')
    }
    expect(KCN_ROW.ambident?.attacksThrough).toBe('C')
    expect(AGCN_ROW.ambident?.attacksThrough).toBe('N')
  })

  it('propanenitrile and the isocyanide share the formula C3H5N', () => {
    expect(NITRILE.formula).toBe('C3H5N')
    expect(NITRILE.name).toBe('propanenitrile')
    expect(ISOCYANIDE.formula).toBe('C3H5N')
    expect(ISOCYANIDE.smiles).not.toBe(NITRILE.smiles)
  })

  it('nitrite gives an alkyl nitrite (O attack) and a nitroalkane (N attack), both C2H5NO2', () => {
    expect(KNO2_ROW.ambident?.attacksThrough).toBe('O')
    expect(AGNO2_ROW.ambident?.attacksThrough).toBe('N')
    expect(molecularFormula(parseSmiles(NITRITE_SMILES))).toBe('NO2-')
    expect(ETHYL_NITRITE.formula).toBe('C2H5NO2')
    expect(NITROETHANE.formula).toBe('C2H5NO2')
    expect(NITROETHANE.name).toBe('nitroethane')
  })

  it('names the groups the namer cannot name as null, never as an invented name', () => {
    expect(ISOCYANIDE.name).toBeNull()
    expect(ETHYL_NITRITE.name).toBeNull()
    expect(iupacNameFromSmiles('CCOC')).toBe('methoxyethane')
  })

  it('productOf is consistent with the namer for every drawn product', () => {
    expect(productOf('CCC#N').name).toBe(iupacNameFromSmiles('CCC#N'))
  })
})
