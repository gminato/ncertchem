import { describe, expect, it } from 'vitest'
import { molecularFormula, parseSmiles } from './molecule-parse'
import {
  ACID_STRENGTH_SERIES,
  CARBONYL_BOILING_POINTS,
  PKA_VALUES,
  TABLE_8_1_ALDEHYDES,
  TABLE_8_1_KETONES,
  TABLE_8_3_ACIDS,
  pkaBand,
  unit8Name,
} from './ncert-c12-unit8-data'

const lowerName = (s: string) => s.toLowerCase().replace(/\s+/g, '')

describe('Tables 8.1 and 8.3', () => {
  it.each([...TABLE_8_1_ALDEHYDES, ...TABLE_8_1_KETONES, ...TABLE_8_3_ACIDS])('$iupac: the shown name is NCERT’s', (c) => {
    // NCERT prints benzoic acid as "Benzenecarboxylic acid (Benzoic acid)": either of its names is NCERT's.
    const ncertNames = c.iupac.split(/\s*\(|\)/).filter(Boolean).map(lowerName)
    expect(ncertNames).toContain(lowerName(unit8Name(c.smiles)))
  })

  it('structures have the formulas their names imply', () => {
    const f = (s: string) => molecularFormula(parseSmiles(s))
    expect(f('C=O')).toBe('CH2O')
    expect(f('CC1CCCC(C1)C=O')).toBe('C8H14O')
    expect(f('O=CC1=CC=CC=C1C=O')).toBe('C8H6O2')
    expect(f('CC(C)=CC(C)=O')).toBe('C6H10O')
    expect(f('OC(=O)CC(CC(O)=O)C(O)=O')).toBe('C6H8O6')
    expect(f('OC(=O)C1=CC=CC=C1C(O)=O')).toBe('C8H6O4')
  })

  it('every aldehyde has a CHO group and every ketone a C=O between two carbons', () => {
    for (const a of TABLE_8_1_ALDEHYDES) expect(a.smiles).toMatch(/C=O|O=C/)
    for (const k of TABLE_8_1_KETONES) expect(unit8Name(k.smiles)).toMatch(/one$/)
  })
})

describe('8.3 boiling points', () => {
  it('rise in NCERT’s order, for molar masses 58 and 60', () => {
    const bps = CARBONYL_BOILING_POINTS.map((r) => r.bpK)
    expect(bps).toEqual([...bps].sort((a, b) => a - b))
    for (const r of CARBONYL_BOILING_POINTS) {
      const mass = Math.round(
        [...molecularFormula(parseSmiles(r.smiles)).matchAll(/([A-Z][a-z]?)(\d*)/g)].reduce(
          (sum, [, el, n]) => sum + ({ C: 12, H: 1, O: 16 } as Record<string, number>)[el] * (n ? Number(n) : 1),
          0
        )
      )
      expect(mass).toBe(r.molarMass)
    }
  })
})

describe('8.9.1 acidity', () => {
  it('bands follow NCERT’s cut-offs', () => {
    expect(pkaBand(-7)).toBe('strong')
    expect(pkaBand(0.23)).toBe('strong')
    expect(pkaBand(4.76)).toBe('moderately strong')
    expect(pkaBand(10)).toBe('weak')
    expect(pkaBand(16)).toBe('extremely weak')
  })

  it('the strongest-first series agrees with every pKa NCERT prints for its members', () => {
    const pka = new Map(PKA_VALUES.map((r) => [r.smiles, r.pKa]))
    const known = ACID_STRENGTH_SERIES.filter((a) => pka.has(a.smiles)).map((a) => pka.get(a.smiles)!)
    expect(known.length).toBeGreaterThanOrEqual(3)
    expect(known).toEqual([...known].sort((a, b) => a - b))
  })

  it('every acid in the series is a carboxylic acid with a parseable structure', () => {
    for (const a of ACID_STRENGTH_SERIES) {
      expect(a.smiles).toMatch(/C\(O\)=O|OC=O|OC\(=O\)/)
      expect(molecularFormula(parseSmiles(a.smiles))).toMatch(/^C/)
    }
  })
})
