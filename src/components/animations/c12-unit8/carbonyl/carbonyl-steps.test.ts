import { describe, expect, it } from 'vitest'
import { unit8Name } from '@/lib/chem/ncert-c12-unit8-data'
import { molecularFormula, parseSmiles } from '@/lib/chem/molecule-parse'
import { CARBONYL_BEATS, CARBONYL_STATE, beatAt, type CarbonylMolecule } from './carbonyl-steps'

const ALL: CarbonylMolecule[] = CARBONYL_BEATS.flatMap((beat) => [...CARBONYL_STATE[beat]])

describe('carbonyl Scrolly target state', () => {
  it('has one target state per Step, clamped to the Step range', () => {
    expect(CARBONYL_BEATS).toHaveLength(6)
    expect(beatAt(0)).toBe('planar')
    expect(beatAt(2)).toBe('polarised')
    expect(beatAt(5)).toBe('rings')
    expect(beatAt(-1)).toBe('planar')
    expect(beatAt(9)).toBe('rings')
  })

  it('draws the expected molecules in each Step', () => {
    expect(CARBONYL_STATE.planar.map((m) => m.smiles)).toEqual(['C=O'])
    expect(CARBONYL_STATE.polarised.map((m) => m.smiles)).toEqual(['C=O', '[CH2+][O-]'])
    expect(CARBONYL_STATE['aldehyde-ketone'].map((m) => m.smiles)).toEqual(['CC=O', 'CC(C)=O'])
    expect(CARBONYL_STATE['chain-name'].map((m) => m.smiles)).toEqual(['CC(Cl)CC=O'])
    expect(CARBONYL_STATE.rings.map((m) => m.smiles)).toEqual(['O=CC1=CC=CC=C1', 'CC1CCCC(C1)C=O', 'CC(=O)C1=CC=CC=C1'])
  })

  it.each(ALL.map((m) => [m.smiles, m] as const))('%s has the formula its Step states', (_smiles, m) => {
    expect(molecularFormula(parseSmiles(m.smiles))).toBe(m.formula)
  })

  it.each(ALL.map((m) => [m.smiles, m] as const))('%s has a carbonyl carbon bonded to oxygen', (_smiles, m) => {
    const g = parseSmiles(m.smiles)
    const bonds = g.bonds.filter((b) => b.a === m.carbonyl || b.b === m.carbonyl)
    const others = bonds.map((b) => (b.a === m.carbonyl ? b.b : b.a))
    expect(g.atoms[m.carbonyl].element).toBe('C')
    expect(others.some((i) => g.atoms[i].element === 'O')).toBe(true)
  })

  it.each(ALL.filter((m) => m.name !== null).map((m) => [m.smiles, m] as const))('%s is named by the namer', (_smiles, m) => {
    expect(unit8Name(m.smiles)).toBe(m.name)
  })
})
