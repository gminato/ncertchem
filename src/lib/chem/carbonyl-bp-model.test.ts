import { describe, expect, it } from 'vitest'
import { molecularFormula, parseSmiles } from './molecule-parse'
import { CARBONYL_BOILING_POINTS, unit8Name } from './ncert-c12-unit8-data'
import {
  CHAIN_LADDER,
  SOLUBILITY_NOTES,
  hasOHGroup,
  interactionsFor,
  polarSite,
} from './carbonyl-bp-model'

const FORMULA: Record<string, string> = {
  CCCC: 'C4H10',
  COCC: 'C3H8O',
  'CCC=O': 'C3H6O',
  'CC(C)=O': 'C3H6O',
  CCCO: 'C3H8O',
  'C=O': 'CH2O',
  'CCCCC=O': 'C5H10O',
  'CCCCCC=O': 'C6H12O',
}

describe('carbonyl boiling-point model', () => {
  it('asserts the molecular formula of every molecule the Simulation draws', () => {
    const drawn = [...CARBONYL_BOILING_POINTS.map((r) => r.smiles), ...CHAIN_LADDER.map((c) => c.smiles)]
    for (const smiles of drawn) {
      expect(molecularFormula(parseSmiles(smiles)), smiles).toBe(FORMULA[smiles])
    }
  })

  it('finds the polar C=O and C–O–C groups, and no polar site in an alkane or alcohol', () => {
    expect(polarSite(parseSmiles('CCC=O'))).toEqual({ oxygen: 3, partner: 2 })
    expect(polarSite(parseSmiles('CC(C)=O'))?.oxygen).toBe(3)
    expect(polarSite(parseSmiles('COCC'))?.oxygen).toBe(1)
    expect(polarSite(parseSmiles('CCCC'))).toBeNull()
    expect(polarSite(parseSmiles('CCCO'))).toBeNull()
  })

  it('detects the O–H group of propan-1-ol only', () => {
    expect(hasOHGroup(parseSmiles('CCCO'))).toBe(true)
    expect(hasOHGroup(parseSmiles('CCC=O'))).toBe(false)
    expect(hasOHGroup(parseSmiles('COCC'))).toBe(false)
  })

  it('gives each table compound the attraction the table names', () => {
    for (const row of CARBONYL_BOILING_POINTS) {
      const expected = row.attraction === 'dipole–dipole (weak)' ? 'dipole–dipole' : row.attraction
      expect(interactionsFor(row.smiles)[0], row.name).toBe(expected)
      expect(interactionsFor(row.smiles)).toContain('van der Waals')
    }
  })

  it('keeps the solubility ladder to one note per step, with the namer names for the chain', () => {
    expect(SOLUBILITY_NOTES).toHaveLength(CHAIN_LADDER.length)
    expect(unit8Name('C=O')).toBe('methanal')
    expect(unit8Name('CCCCCC=O')).toBe('hexanal')
    for (const step of CHAIN_LADDER) expect(unit8Name(step.smiles)).not.toBe('ethanal')
  })
})
