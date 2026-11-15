import { describe, expect, it } from 'vitest'
import { ANION_SOURCES, CATION_SOURCES, commonIonSalts, mixEqualVolumes, pairSalt, solubilityPair, tableKsp } from './precipitation'
import { NCERT_TABLE_6_9_KSP } from './ncert-unit6-tables'

describe('pairSalt', () => {
  it('finds the Table 6.9 Ksp for a pair that forms a listed salt', () => {
    expect(pairSalt('Ag', 'Cl')).toEqual({ formula: 'AgCl', x: 1, y: 1, ksp: 1.8e-10 })
    expect(pairSalt('Pb', 'I')).toEqual({ formula: 'PbI2', x: 1, y: 2, ksp: 7.1e-9 })
  })

  it('returns null for a pair whose salt Table 6.9 does not list', () => {
    expect(pairSalt('Ba', 'Cl')).toBeNull()
    expect(pairSalt('Ag', 'F')).toBeNull()
  })

  it('has a Table 6.9 row for every salt it names', () => {
    for (const cation of CATION_SOURCES) {
      for (const anion of ANION_SOURCES) {
        const salt = pairSalt(cation.id, anion.id)
        if (salt) expect(NCERT_TABLE_6_9_KSP.rows.some((r) => r.formula === salt.formula)).toBe(true)
      }
    }
  })
})

describe('mixEqualVolumes', () => {
  it('halves each ion on mixing and gives Qsp = [M]^x [X]^y', () => {
    const m = mixEqualVolumes('Ag', 'Cl', 2e-4, 2e-4)!
    expect(m.cationConc).toBeCloseTo(1e-4, 12)
    expect(m.anionConc).toBeCloseTo(1e-4, 12)
    expect(m.qsp).toBeCloseTo(1e-8, 14)
    expect(m.verdict).toBe('precipitates')
  })

  it('reports no precipitate when Qsp is below Ksp', () => {
    const m = mixEqualVolumes('Ag', 'Cl', 1e-6, 1e-6)!
    expect(m.qsp).toBeCloseTo(2.5e-13, 15)
    expect(m.verdict).toBe('no precipitate')
  })

  it('uses x and y for a salt with two anions', () => {
    const m = mixEqualVolumes('Pb', 'I', 0.02, 0.02)!
    // [Pb²⁺] = 0.01 M, [I⁻] = 0.01 M: Qsp = 0.01 × 0.01² = 1.0 × 10⁻⁶
    expect(m.qsp).toBeCloseTo(1e-6, 14)
    expect(m.ratio).toBeCloseTo(1e-6 / 7.1e-9, 0)
    expect(m.verdict).toBe('precipitates')
  })

  it('returns null when Table 6.9 lists no salt for the pair', () => {
    expect(mixEqualVolumes('Ba', 'I', 0.1, 0.1)).toBeNull()
  })
})

describe('common-ion solubility', () => {
  it('gives the pure-water molar solubility as the zero-added value', () => {
    const [agcl] = commonIonSalts().filter((s) => s.formula === 'AgCl')
    const { pure, withIon } = solubilityPair(agcl, 0)
    expect(pure).toBeCloseTo(Math.sqrt(1.8e-10), 12)
    expect(withIon).toBeCloseTo(pure, 12)
  })

  it('lowers BaSO4 solubility to about Ksp / 0.010 in 0.010 M sulphate', () => {
    const [baso4] = commonIonSalts().filter((s) => s.formula === 'BaSO4')
    const { pure, withIon } = solubilityPair(baso4, 0.01)
    expect(pure).toBeCloseTo(1.049e-5, 7)
    expect(withIon).toBeCloseTo(1.1e-8, 10)
  })

  it('gives the Table 6.9 Ksp for each common-ion salt', () => {
    expect(commonIonSalts().map((s) => [s.formula, s.ksp])).toEqual([
      ['AgCl', 1.8e-10],
      ['BaSO4', 1.1e-10],
      ['PbI2', 7.1e-9],
    ])
    expect(tableKsp('XYZ')).toBeNull()
  })
})
