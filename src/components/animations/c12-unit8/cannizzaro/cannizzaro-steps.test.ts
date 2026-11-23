import { describe, expect, it } from 'vitest'
import { skeletalBounds } from '@/components/organic/SkeletalFormula'
import { molecularFormula, parseSmiles } from '@/lib/chem/molecule-parse'
import { unit8Name } from '@/lib/chem/ncert-c12-unit8-data'
import {
  BENZALDEHYDE_SMILES,
  BENZOATE_SMILES,
  BUTANONE_SMILES,
  CANNIZZARO_BEATS,
  CARBONYL_CARBON_INDEX,
  ETHANAL_SMILES,
  formulaOf,
  FORMATE_SMILES,
  METHANAL_EQUATION,
  METHANAL_SMILES,
  METHANOL_SMILES,
  NITRO_BENZALDEHYDE_SMILES,
  PHENYLMETHANOL_SMILES,
  PROPANONE_SMILES,
  subscriptDigits,
  USES_BOARD,
} from './cannizzaro-steps'

const PANEL_W = 580
const PANEL_H = 520
const MARGIN = 12

describe('Cannizzaro Scrolly Steps', () => {
  it('has the six Steps in the Prose order', () => {
    expect(CANNIZZARO_BEATS).toEqual([
      'benzaldehyde-alkali',
      'two-benzaldehyde-reduced-oxidised',
      'methanal-equation',
      'products-side-by-side',
      'meta-nitration',
      'uses-board',
    ])
  })

  it('gives every drawn molecule the formula the Prose states', () => {
    expect(molecularFormula(parseSmiles(BENZALDEHYDE_SMILES))).toBe('C7H6O')
    expect(molecularFormula(parseSmiles(PHENYLMETHANOL_SMILES))).toBe('C7H8O')
    expect(molecularFormula(parseSmiles(NITRO_BENZALDEHYDE_SMILES))).toBe('C7H5NO3')
    expect(molecularFormula(parseSmiles(METHANAL_SMILES))).toBe('CH2O')
    expect(molecularFormula(parseSmiles(METHANOL_SMILES))).toBe('CH4O')
    expect(molecularFormula(parseSmiles(FORMATE_SMILES))).toBe('CHO2-')
    expect(molecularFormula(parseSmiles(BENZOATE_SMILES))).toBe('C7H5O2-')
    expect(molecularFormula(parseSmiles(ETHANAL_SMILES))).toBe('C2H4O')
    expect(molecularFormula(parseSmiles(PROPANONE_SMILES))).toBe('C3H6O')
    expect(molecularFormula(parseSmiles(BUTANONE_SMILES))).toBe('C4H8O')
  })

  it('writes formulas with real subscripts for the captions', () => {
    expect(subscriptDigits('C7H6O')).toBe('C₇H₆O')
    expect(formulaOf(BENZALDEHYDE_SMILES)).toBe('C₇H₆O')
    expect(formulaOf(NITRO_BENZALDEHYDE_SMILES)).toBe('C₇H₅NO₃')
  })

  it('balances the methanal equation in atoms and charge', () => {
    // Reactants: 2 HCHO + NaOH. Products: HCOO⁻ Na⁺ + CH₃OH. Counted per element.
    const hcho = molecularFormula(parseSmiles(METHANAL_SMILES)) // CH2O
    const methanol = molecularFormula(parseSmiles(METHANOL_SMILES)) // CH4O
    const formate = molecularFormula(parseSmiles(FORMATE_SMILES)) // CHO2 (ion)
    expect([hcho, methanol, formate]).toEqual(['CH2O', 'CH4O', 'CHO2-'])
    const reactants = { C: 2, H: 4 + 1, O: 2 + 1, Na: 1 } // 2 CH2O + NaOH
    const products = { C: 1 + 1, H: 1 + 4, O: 2 + 1, Na: 1 } // CHO2⁻ + Na⁺ + CH4O
    expect(reactants).toEqual(products)
    expect(METHANAL_EQUATION).toBe('2HCHO + NaOH → HCOO⁻Na⁺ + CH₃OH')
  })

  it('shades a carbon atom at the carbonyl position of each carbonyl-bearing graph', () => {
    for (const smiles of [BENZALDEHYDE_SMILES, PHENYLMETHANOL_SMILES, BENZOATE_SMILES]) {
      const atom = parseSmiles(smiles).atoms[CARBONYL_CARBON_INDEX]
      expect(atom.element).toBe('C')
    }
  })

  it('takes every IUPAC name from the unit 8 name helper', () => {
    expect(unit8Name(NITRO_BENZALDEHYDE_SMILES)).toBe('3-nitrobenzaldehyde')
    expect(unit8Name(METHANAL_SMILES)).toBe('methanal')
    expect(unit8Name(PROPANONE_SMILES)).toBe('propan-2-one')
    expect(unit8Name(BUTANONE_SMILES)).toBe('butan-2-one')
  })

  it('keeps every drawing inside the panel with the 12-unit margin', () => {
    const mainScales: [string, number][] = [
      [BENZALDEHYDE_SMILES, 96],
      [BENZALDEHYDE_SMILES, 56],
      [PHENYLMETHANOL_SMILES, 56],
      [BENZOATE_SMILES, 56],
      [BENZALDEHYDE_SMILES, 40],
      [NITRO_BENZALDEHYDE_SMILES, 58],
    ]
    for (const [smiles, scale] of mainScales) {
      const b = skeletalBounds(parseSmiles(smiles), scale)
      expect(b.width, `${smiles} at ${scale}`).toBeLessThanOrEqual(PANEL_W - 2 * MARGIN)
      expect(b.height, `${smiles} at ${scale}`).toBeLessThanOrEqual(PANEL_H - 2 * MARGIN)
    }
    // Uses board tiles: each drawing's left and right edges must sit inside the panel margin.
    const tiles: [string, number][] = [
      [BENZALDEHYDE_SMILES, 470],
      [PROPANONE_SMILES, 193],
      [BUTANONE_SMILES, 387],
    ]
    for (const [smiles, centreX] of tiles) {
      const b = skeletalBounds(parseSmiles(smiles), 40)
      expect(centreX - b.width / 2, `left edge ${smiles}`).toBeGreaterThanOrEqual(MARGIN)
      expect(centreX + b.width / 2, `right edge ${smiles}`).toBeLessThanOrEqual(PANEL_W - MARGIN)
    }
  })

  it('lists the uses board with five molecules and their tags', () => {
    expect(USES_BOARD.map((u) => u.key)).toEqual(['methanal', 'ethanal', 'benzaldehyde', 'propan-2-one', 'butan-2-one'])
    expect(USES_BOARD.map((u) => u.tag)).toEqual([
      'preserves specimens',
      'raw material',
      'perfumery and dyes',
      'industrial solvent',
      'industrial solvent',
    ])
  })
})
