import { describe, expect, it } from 'vitest'
import { parseSmiles, molecularFormula } from '@/lib/chem/molecule-parse'
import { NCERT_TABLE_6_2 } from '@/lib/chem/ncert-c12-unit6-data'
import {
  bondRow,
  enthalpyDifferenceFI,
  getCxBondStepState,
  largestDipoleHalogen,
} from './cxbond-steps'

describe('C–X bond Scrolly step targets', () => {
  it('Step 1 shows only the lopsided C–Cl pair, zoomed, with the cloud', () => {
    const s = getCxBondStepState(0)
    expect(s.rows).toEqual(['Cl'])
    expect(s.zoom).toBe(true)
    expect(s.cloud).toBe(true)
  })

  it('Step 2 stacks all four halogens F → I with pm lengths and no readout', () => {
    const s = getCxBondStepState(1)
    expect(s.rows).toEqual(['F', 'Cl', 'Br', 'I'])
    expect(s.showLength).toBe(true)
    expect(s.readout).toBe('none')
    expect(s.zoom).toBe(false)
  })

  it('Step 3 switches the column to enthalpy bars', () => {
    expect(getCxBondStepState(2).readout).toBe('enthalpy')
  })

  it('Step 4 switches the column to dipoles, highlights CH₃–Cl and dims CH₃–F', () => {
    const s = getCxBondStepState(3)
    expect(s.readout).toBe('dipole')
    expect(s.focus).toBe('Cl')
    expect(s.dim).toEqual(['F'])
  })

  it('Step 5 highlights CH₃–I with the nucleophile approach', () => {
    const s = getCxBondStepState(4)
    expect(s.focus).toBe('I')
    expect(s.approach).toBe(true)
    expect(s.dim).toEqual(['F', 'Cl', 'Br'])
  })
})

describe('C–X bond data (Table 6.2 only)', () => {
  it('reads the four rows in group order with NCERT values', () => {
    expect(NCERT_TABLE_6_2.map((r) => r.lengthPm)).toEqual([139, 178, 193, 214])
    expect(NCERT_TABLE_6_2.map((r) => r.enthalpyKjPerMol)).toEqual([452, 351, 293, 234])
    expect(bondRow('Cl').dipoleDebye).toBe(1.86)
  })

  it('gives the C–F minus C–I enthalpy difference of 218 kJ mol⁻¹', () => {
    expect(enthalpyDifferenceFI()).toBe(218)
  })

  it('finds CH₃–Cl as the largest dipole, not the most electronegative CH₃–F', () => {
    expect(largestDipoleHalogen()).toBe('Cl')
  })

  it('draws CH₃–X molecules whose formulas are CH₃X', () => {
    const smiles: Record<string, string> = { F: 'CF', Cl: 'CCl', Br: 'CBr', I: 'CI' }
    for (const [h, s] of Object.entries(smiles)) {
      expect(molecularFormula(parseSmiles(s))).toBe(`CH3${h}`)
    }
  })
})
