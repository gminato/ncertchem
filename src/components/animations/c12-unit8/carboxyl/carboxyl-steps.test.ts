import { describe, expect, it } from 'vitest'
import { molecularFormula, parseSmiles } from '@/lib/chem/molecule-parse'
import {
  ACID_ANHYDRIDE,
  ACYL_CHLORIDE,
  ACETIC_ACID,
  AMIDE,
  BENZOIC_ACID,
  CARBOXYL_FORMULAS,
  CARBOXYL_NAMES,
  CARBOXYL_STEP_MOLECULES,
  commonNameOf,
  ESTER,
  HEPTANEDIOIC_ACID,
  iupacOf,
  METHYLPENTANOIC_ACID,
  PHTHALIC_ACID,
  RESONANCE_NEUTRAL,
  RESONANCE_ZWITTERION,
  SOURCE_NOTES,
} from './carboxyl-steps'

describe('carboxyl-group Scrolly Steps', () => {
  it('has the six Steps in the Prose order with one target state each', () => {
    expect(CARBOXYL_STEP_MOLECULES).toHaveLength(6)
    expect(CARBOXYL_STEP_MOLECULES[0]).toEqual([ACETIC_ACID])
    expect(CARBOXYL_STEP_MOLECULES[1]).toEqual([RESONANCE_NEUTRAL, RESONANCE_ZWITTERION])
    expect(CARBOXYL_STEP_MOLECULES[5]).toEqual([ACYL_CHLORIDE, ACID_ANHYDRIDE, ESTER, AMIDE])
  })

  it('asserts a molecular formula for every drawn molecule', () => {
    const drawn = new Set(CARBOXYL_STEP_MOLECULES.flat())
    for (const smiles of drawn) {
      expect(CARBOXYL_FORMULAS[smiles], smiles).toBeDefined()
      expect(molecularFormula(parseSmiles(smiles)), smiles).toBe(CARBOXYL_FORMULAS[smiles])
    }
    expect(drawn.size).toBe(Object.keys(CARBOXYL_FORMULAS).length)
  })

  it('prints the namer output for every named acid in the Steps', () => {
    for (const [smiles, name] of Object.entries(CARBOXYL_NAMES)) {
      expect(iupacOf(smiles), smiles).toBe(name)
    }
    expect(iupacOf(METHYLPENTANOIC_ACID)).toBe('3-methylpentanoic acid')
    expect(iupacOf(HEPTANEDIOIC_ACID)).toBe('heptanedioic acid')
    expect(iupacOf(BENZOIC_ACID)).toBe('benzoic acid')
    expect(iupacOf(PHTHALIC_ACID)).toBe('benzene-1,2-dicarboxylic acid')
  })

  it('takes the common names of Step 3 from Table 8.3', () => {
    expect(SOURCE_NOTES.map((n) => commonNameOf(n.smiles))).toEqual(['Formic acid', 'Acetic acid', 'Butyric acid'])
    expect(SOURCE_NOTES.map((n) => n.source)).toEqual(['red ants', 'vinegar', 'rancid butter'])
  })

  it('keeps the acyl group CH3CO in every Step 6 derivative', () => {
    const acyl: Record<string, readonly number[]> = {
      [ACYL_CHLORIDE]: [0, 1, 2],
      [ACID_ANHYDRIDE]: [0, 1, 2],
      [ESTER]: [3, 4, 5],
      [AMIDE]: [0, 1, 3],
    }
    for (const [smiles, atoms] of Object.entries(acyl)) {
      const g = parseSmiles(smiles)
      expect(atoms.map((i) => g.atoms[i].element), smiles).toEqual(['C', 'C', 'O'])
    }
  })
})
