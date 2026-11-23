import { describe, expect, it } from 'vitest'
import { molecularFormula, parseSmiles } from '@/lib/chem/molecule-parse'
import { FORMULA, type MoleculeKey, SMILES, STEP_MOLECULES } from './acid-derivatives-steps'

describe('acid-derivatives Scrolly: drawn molecules', () => {
  for (const key of Object.keys(SMILES) as MoleculeKey[]) {
    it(`${key} (${SMILES[key]}) has formula ${FORMULA[key]}`, () => {
      expect(molecularFormula(parseSmiles(SMILES[key]))).toBe(FORMULA[key])
    })
  }

  it('every Step lists only known molecules, and each is drawn once per Step', () => {
    for (const step of [1, 2, 3, 4, 5, 6] as const) {
      const keys = STEP_MOLECULES[step]
      expect(keys.length).toBeGreaterThan(0)
      expect(new Set(keys).size).toBe(keys.length)
      for (const key of keys) expect(SMILES[key]).toBeDefined()
    }
  })

  it('Step 1 shows the anhydride, and Step 4 the acyl chloride (C–OH replaced by C–Cl)', () => {
    expect(FORMULA.anhydride).toBe('C4H6O3')
    expect(molecularFormula(parseSmiles(SMILES.butanoylChloride))).toBe('C4H7ClO')
    expect(molecularFormula(parseSmiles(SMILES.butanoicAcid))).toBe('C4H8O2')
  })

  it('Step 6 carbon count: the alcohol keeps five carbons, the acid had five', () => {
    expect(molecularFormula(parseSmiles(SMILES.pentanoicAcid))).toBe('C5H10O2')
    expect(molecularFormula(parseSmiles(SMILES.pentanol))).toBe('C5H12O')
    expect(molecularFormula(parseSmiles(SMILES.pentane))).toBe('C5H12')
  })
})
