import { describe, expect, it } from 'vitest'
import { molecularFormula, parseSmiles } from './molecule-parse'
import { ACID_STRENGTH_SERIES, PKA_VALUES } from './ncert-c12-unit8-data'
import {
  REFERENCE_ACIDS,
  RULER_ACIDS,
  STRIP,
  fizzes,
  formatPka,
  pkaRow,
  rulerX,
  stripRank,
  substituentFormula,
  tubeEquation,
} from './acid-strength-lab'

const formulaOf = (smiles: string) => molecularFormula(parseSmiles(smiles))

describe('acid strength lab: molecules on the drawing', () => {
  it('asserts the molecular formula of every acid placed on the ruler', () => {
    expect(formulaOf(pkaRow('Acetic acid').smiles)).toBe('C2H4O2')
    expect(formulaOf(pkaRow('Benzoic acid').smiles)).toBe('C7H6O2')
    expect(formulaOf(pkaRow('4-Nitrobenzoic acid').smiles)).toBe('C7H5NO4')
    expect(formulaOf(pkaRow('Trifluoroacetic acid').smiles)).toBe('C2HF3O2')
  })

  it('asserts the molecular formula of every reference acid on the ruler', () => {
    expect(formulaOf(pkaRow('Hydrochloric acid').smiles)).toBe('ClH')
    expect(formulaOf(pkaRow('Phenol').smiles)).toBe('C6H6O')
    expect(formulaOf(pkaRow('Ethanol').smiles)).toBe('C2H6O')
  })

  it('asserts the molecular formula of every strip entry drawn', () => {
    const expected: Record<string, string> = {
      'CF₃COOH': 'C2HF3O2',
      'CCl₃COOH': 'C2HCl3O2',
      'CHCl₂COOH': 'C2H2Cl2O2',
      'NO₂CH₂COOH': 'C2H3NO4',
      'FCH₂COOH': 'C2H3FO2',
      'ClCH₂COOH': 'C2H3ClO2',
      'BrCH₂COOH': 'C2H3BrO2',
      'HCOOH': 'CH2O2',
      'ClCH₂CH₂COOH': 'C3H5ClO2',
      'C₆H₅COOH': 'C7H6O2',
      'C₆H₅CH₂COOH': 'C8H8O2',
      'CH₃COOH': 'C2H4O2',
      'CH₃CH₂COOH': 'C3H6O2',
    }
    for (const entry of STRIP) {
      expect(formulaOf(entry.smiles), entry.formula).toBe(expected[entry.formula])
    }
    expect(STRIP.length).toBe(ACID_STRENGTH_SERIES.length - 1)
  })

  it('asserts the formula of each substituted acetic acid the panel can show', () => {
    const cases: [string, string][] = [
      ['C₆H₅CH₂COOH', 'C8H8O2'],
      ['FCH₂COOH', 'C2H3FO2'],
      ['ClCH₂COOH', 'C2H3ClO2'],
      ['BrCH₂COOH', 'C2H3BrO2'],
      ['NO₂CH₂COOH', 'C2H3NO4'],
      ['ClCH₂CH₂COOH', 'C3H5ClO2'],
    ]
    for (const [formula, expected] of cases) {
      const entry = ACID_STRENGTH_SERIES.find((e) => e.formula === formula)
      expect(entry, formula).toBeDefined()
      expect(formulaOf(entry!.smiles)).toBe(expected)
    }
  })

  it('asserts the formulas of the acids in the tube equations', () => {
    // Each equation's acid is checked by its formula; the equation strings are fixed text.
    expect(formulaOf('CC(O)=O')).toBe('C2H4O2')
    expect(formulaOf('OC(=O)C1=CC=CC=C1')).toBe('C7H6O2')
    expect(tubeEquation('acetic')).toContain('CH₃COOH')
    expect(tubeEquation('benzoic')).toContain('C₆H₅COOH')
    expect(tubeEquation('phenol')).toBeNull()
  })
})

describe('acid strength lab: values and rules', () => {
  it('takes every ruler and reference value from NCERT\'s printed table', () => {
    for (const name of [...RULER_ACIDS, ...REFERENCE_ACIDS]) {
      expect(PKA_VALUES.some((r) => r.name === name), name).toBe(true)
    }
    expect(pkaRow('Acetic acid').pKa).toBe(4.76)
    expect(pkaRow('Ethanol').approx).toBe(true)
    expect(() => pkaRow('Chloroethanoic acid')).toThrow()
  })

  it('places pKa values on the ruler in order, with HCl at the left end', () => {
    const left = 50
    const width = 460
    expect(rulerX(-7, left, width)).toBeLessThan(rulerX(0.23, left, width))
    expect(rulerX(0.23, left, width)).toBeLessThan(rulerX(4.76, left, width))
    expect(rulerX(4.76, left, width)).toBeLessThan(rulerX(10, left, width))
    expect(rulerX(-8, left, width)).toBe(left)
    expect(rulerX(18, left, width)).toBe(left + width)
  })

  it('applies NCERT bands', () => {
    expect(pkaRow('Hydrochloric acid').band).toBe('strong')
    expect(pkaRow('Trifluoroacetic acid').band).toBe('strong')
    expect(pkaRow('Benzoic acid').band).toBe('moderately strong')
    expect(pkaRow('Acetic acid').band).toBe('moderately strong')
    expect(pkaRow('Phenol').band).toBe('weak')
    expect(pkaRow('Ethanol').band).toBe('extremely weak')
  })

  it('formats pKa with a true minus sign and no caret', () => {
    expect(formatPka(-7)).toBe('−7')
    expect(formatPka(0.23)).toBe('0.23')
    expect(formatPka(16, true)).toBe('≈ 16')
  })

  it('maps group and position to the series NCERT prints, and nothing else', () => {
    expect(substituentFormula('Cl', 'alpha')).toBe('ClCH₂COOH')
    expect(substituentFormula('Cl', 'beta')).toBe('ClCH₂CH₂COOH')
    expect(substituentFormula('CN', 'alpha')).toBeNull()
    expect(substituentFormula('I', 'alpha')).toBeNull()
    expect(stripRank('ClCH₂COOH')).toBe(STRIP.findIndex((e) => e.formula === 'ClCH₂COOH') + 1)
    expect(stripRank(null)).toBeNull()
    expect(STRIP.some((e) => e.formula.startsWith('NC'))).toBe(false)
  })

  it('gives NaHCO₃ fizz to carboxylic acids only', () => {
    expect(fizzes('acetic')).toBe(true)
    expect(fizzes('benzoic')).toBe(true)
    expect(fizzes('phenol')).toBe(false)
  })
})
