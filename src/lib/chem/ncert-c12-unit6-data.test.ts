import { describe, expect, it } from 'vitest'
import { iupacNameFromSmiles } from './iupac-organic'
import { molecularFormula, parseSmiles } from './molecule-parse'
import {
  ALKYL_HALIDE_BOILING_POINTS_K,
  HALOGENS,
  NCERT_BROMOBUTANE_ISOMER_BP_K,
  NCERT_DICHLOROBENZENE_K,
  NCERT_FIG_6_3_SN2_RELATIVE_RATE,
  NCERT_HALOARENE_HYDROLYSIS,
  NCERT_TABLE_6_1,
  NCERT_TABLE_6_2,
  NCERT_TABLE_6_3,
  NCERT_TABLE_6_4,
  NCERT_ZAITSEV_2_BROMOPENTANE,
  PARENT_ALKANE_BOILING_POINTS_K,
  ROOM_TEMPERATURE_K,
  WATER_DENSITY_G_PER_ML,
  formatDipole,
} from './ncert-c12-unit6-data'

describe('Table 6.1 names', () => {
  it('every SMILES names to NCERT\'s IUPAC name (or its listed alternative)', () => {
    for (const row of NCERT_TABLE_6_1) {
      const name = iupacNameFromSmiles(row.smiles)
      const accepted = [row.iupac, row.iupacAlt].filter(Boolean).map((n) => n!.toLowerCase())
      expect(accepted).toContain(name)
    }
  })
})

describe('Table 6.2 bonds', () => {
  it('bond length rises and bond enthalpy falls from C–F to C–I', () => {
    for (let i = 1; i < NCERT_TABLE_6_2.length; i++) {
      expect(NCERT_TABLE_6_2[i].lengthPm).toBeGreaterThan(NCERT_TABLE_6_2[i - 1].lengthPm)
      expect(NCERT_TABLE_6_2[i].enthalpyKjPerMol).toBeLessThan(NCERT_TABLE_6_2[i - 1].enthalpyKjPerMol)
    }
  })
  it('dipole moments are not monotonic: CH3Cl largest, CH3I smallest', () => {
    const byDipole = [...NCERT_TABLE_6_2].sort((a, b) => b.dipoleDebye - a.dipoleDebye).map((b) => b.halogen)
    expect(byDipole).toEqual(['Cl', 'F', 'Br', 'I'])
    expect(formatDipole(1.86)).toBe('1.860 D')
  })
})

describe('boiling points', () => {
  it('RI > RBr > RCl > RF for each alkyl group, and every halide boils above its parent alkane', () => {
    for (const alkyl of ['methyl', 'ethyl', 'n-propyl'] as const) {
      const bps = HALOGENS.map((h) => ALKYL_HALIDE_BOILING_POINTS_K.find((r) => r.alkyl === alkyl && r.halogen === h)!.bpK)
      expect(bps).toEqual([...bps].sort((a, b) => a - b))
      expect(Math.min(...bps)).toBeGreaterThan(PARENT_ALKANE_BOILING_POINTS_K[alkyl].bpK)
    }
  })
  it('the Fig. 6.1 gases (Cl, Br, I) are exactly CH3Cl, CH3Br and CH3CH2Cl', () => {
    const gases = ALKYL_HALIDE_BOILING_POINTS_K.filter((r) => r.halogen !== 'F' && r.bpK < ROOM_TEMPERATURE_K).map((r) => r.unicode)
    expect(gases).toEqual(['CH₃Cl', 'CH₃Br', 'CH₃CH₂Cl'])
  })
  it('branching lowers the boiling point of C4H9Br; para-dichlorobenzene melts highest', () => {
    const bps = NCERT_BROMOBUTANE_ISOMER_BP_K.map((r) => r.bpK)
    expect(bps).toEqual([...bps].sort((a, b) => b - a))
    for (const r of NCERT_BROMOBUTANE_ISOMER_BP_K) {
      expect(molecularFormula(parseSmiles(r.smiles))).toBe('C4H9Br')
      expect(iupacNameFromSmiles(r.smiles)).toBe(r.name.toLowerCase())
    }
    const para = NCERT_DICHLOROBENZENE_K.find((r) => r.isomer === 'para')!
    expect(Math.max(...NCERT_DICHLOROBENZENE_K.map((r) => r.mpK))).toBe(para.mpK)
    for (const r of NCERT_DICHLOROBENZENE_K) expect(iupacNameFromSmiles(r.smiles)).toBe(r.name.toLowerCase())
  })
})

describe('Table 6.3 densities', () => {
  it('only n-propyl chloride is lighter than water; density rises Cl < Br < I and CH2Cl2 < CHCl3 < CCl4', () => {
    expect(NCERT_TABLE_6_3.filter((r) => r.densityGPerMl < WATER_DENSITY_G_PER_ML).map((r) => r.unicode)).toEqual(['n-C₃H₇Cl'])
    const d = NCERT_TABLE_6_3.map((r) => r.densityGPerMl)
    expect(d[0] < d[1] && d[1] < d[2]).toBe(true)
    expect(d[3] < d[4] && d[4] < d[5]).toBe(true)
  })
})

describe('Table 6.4 and mechanisms', () => {
  it('has the 14 NCERT rows and four ambident rows', () => {
    expect(NCERT_TABLE_6_4).toHaveLength(14)
    expect(NCERT_TABLE_6_4.filter((r) => r.ambident).map((r) => r.reagent)).toEqual(['KCN', 'AgCN', 'KNO₂', 'AgNO₂'])
  })
  it('SN2 relative rates fall methyl > 1° > 2° > 3°', () => {
    const rates = NCERT_FIG_6_3_SN2_RELATIVE_RATE.map((r) => r.relativeRate)
    expect(rates).toEqual([30, 1, 0.02, 0])
  })
  it('Zaitsev: 2-bromopentane gives 81 % pent-2-ene and 19 % pent-1-ene', () => {
    const [major, minor] = NCERT_ZAITSEV_2_BROMOPENTANE.products
    expect(major.percent + minor.percent).toBe(100)
    expect(iupacNameFromSmiles(major.smiles)).toBe('pent-2-ene')
    expect(iupacNameFromSmiles(minor.smiles)).toBe('pent-1-ene')
  })
  it('haloarene hydrolysis gets milder as nitro groups are added', () => {
    const temps = NCERT_HALOARENE_HYDROLYSIS.slice(0, 3).map((r) => r.temperatureK!)
    expect(temps).toEqual([623, 443, 368])
    NCERT_HALOARENE_HYDROLYSIS.forEach((r, i) => expect(r.nitroGroups).toBe(i))
    expect(iupacNameFromSmiles(NCERT_HALOARENE_HYDROLYSIS[1].smiles)).toBe('1-chloro-4-nitrobenzene')
  })
})
