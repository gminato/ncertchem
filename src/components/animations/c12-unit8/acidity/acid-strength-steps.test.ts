import { describe, expect, it } from 'vitest'
import { ACID_STRENGTH_BEATS, ACETIC_SMILES, CHLOROACETIC_SMILES, PHENOXIDE_ORTHO_SMILES, PHENOXIDE_PARA_SMILES, PHENOXIDE_SMILES, RULER_BANDS, RULER_MAX, RULER_MIN, STRIP_FORMULAS, WATER_SMILES, ACETATE_SMILES, HYDRONIUM_SMILES, pkaRow, rulerY, stripIndices } from './acid-strength-steps'
import { molecularFormula, parseSmiles } from '@/lib/chem/molecule-parse'
import { pkaBand } from '@/lib/chem/ncert-c12-unit8-data'

// Ions: molecularFormula keeps the charge sign; the atom counts are what is asserted here.
const formula = (smiles: string) => molecularFormula(parseSmiles(smiles)).replace(/[+\-−]+$/, '')

describe('acid-strength Scrolly Steps', () => {
  it('has the six Steps in the Prose order', () => {
    expect(ACID_STRENGTH_BEATS).toHaveLength(6)
    expect(ACID_STRENGTH_BEATS[0]).toBe('dimer')
    expect(ACID_STRENGTH_BEATS[2]).toBe('acetate')
    expect(ACID_STRENGTH_BEATS[5]).toBe('inductive-strip')
  })

  it('draws every molecule with the formula its SMILES gives', () => {
    expect(formula(ACETIC_SMILES)).toBe('C2H4O2')
    expect(formula(WATER_SMILES)).toBe('H2O')
    expect(formula(HYDRONIUM_SMILES)).toBe('H3O')
    expect(formula(ACETATE_SMILES)).toBe('C2H3O2')
    expect(formula(PHENOXIDE_SMILES)).toBe('C6H5O')
    expect(formula(PHENOXIDE_ORTHO_SMILES)).toBe('C6H5O')
    expect(formula(PHENOXIDE_PARA_SMILES)).toBe('C6H5O')
    expect(formula(CHLOROACETIC_SMILES)).toBe('C2H3ClO2')
  })

  it('places each pKa on the ruler in order, from the top of the scale to the bottom', () => {
    expect(rulerY(RULER_MIN)).toBe(100)
    expect(rulerY(RULER_MAX)).toBe(540)
    expect(rulerY(0.23)).toBeGreaterThan(rulerY(-7))
    expect(rulerY(4.76)).toBeGreaterThan(rulerY(4.19))
    expect(rulerY(16)).toBeGreaterThan(rulerY(10))
  })

  it('takes every ruler value from NCERT and names its band with pkaBand', () => {
    expect(pkaRow('Hydrochloric acid').pKa).toBe(-7)
    expect(pkaRow('Trifluoroacetic acid').pKa).toBe(0.23)
    expect(pkaRow('Benzoic acid').pKa).toBe(4.19)
    expect(pkaRow('Acetic acid').pKa).toBe(4.76)
    expect(pkaRow('Phenol').pKa).toBe(10)
    expect(pkaRow('Ethanol').approx).toBe(true)
    expect(RULER_BANDS.map((b) => b.name)).toEqual(['strong', 'moderately strong', 'weak', 'extremely weak'])
    expect(pkaBand(pkaRow('Benzoic acid').pKa)).toBe('moderately strong')
    expect(pkaBand(pkaRow('Phenol').pKa)).toBe('weak')
  })

  it('shows the strip in the NCERT series order, strongest first', () => {
    expect(STRIP_FORMULAS).toHaveLength(6)
    const idx = stripIndices()
    expect([...idx].sort((a, b) => a - b)).toEqual(idx)
    expect(STRIP_FORMULAS[0]).toBe('CF₃COOH')
    expect(STRIP_FORMULAS[5]).toBe('CH₃CH₂COOH')
  })
})
