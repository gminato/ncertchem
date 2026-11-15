import { describe, expect, it } from 'vitest'
import {
  ionicProduct,
  kspExpression,
  kspFromSolubility,
  molarSolubility,
  solubilityWithCommonIon,
  willPrecipitate,
} from './solubility'

describe('kspExpression (Section 6.13.1, equation 6.44)', () => {
  it('builds [Ag⁺]² [CrO4²⁻] for Ag2CrO4', () => {
    const expression = kspExpression({ cation: 'Ag', cationCharge: 1, x: 2, anion: 'CrO4', anionCharge: 2, y: 1 })
    expect(expression.expression).toBe('[Ag+]^2 [CrO4^2-]')
    expect(expression.x).toBe(2)
    expect(expression.y).toBe(1)
  })

  it('rejects a salt that is not charge-neutral', () => {
    expect(() => kspExpression({ cation: 'Ca', cationCharge: 2, x: 1, anion: 'Cl', anionCharge: 1, y: 1 })).toThrow(RangeError)
  })
})

describe('molar solubility (equation 6.45)', () => {
  it('gives S = √Ksp for BaSO4, Ksp = 1.1 × 10⁻¹⁰ (NCERT example, S ≈ 1.05 × 10⁻⁵)', () => {
    expect(molarSolubility(1.1e-10, 1, 1)).toBeCloseTo(1.05e-5, 6)
  })

  it('gives Problem 6.26: A2X3 with Ksp = 1.1 × 10⁻²³ has S = 1.0 × 10⁻⁵ mol L⁻¹', () => {
    expect(molarSolubility(1.1e-23, 2, 3)).toBeCloseTo(1.0e-5, 6)
  })

  it('gives S⁷ with 3³·4⁴ = 6912 for a 3:4 salt (zirconium phosphate form)', () => {
    const s = molarSolubility(1e-40, 3, 4)
    expect(6912 * s ** 7).toBeCloseTo(1e-40, 50)
  })

  it('round-trips with kspFromSolubility', () => {
    const s = molarSolubility(2e-15, 1, 2)
    expect(kspFromSolubility(s, 1, 2)).toBeCloseTo(2e-15, 20)
  })

  it('rejects a non-positive Ksp or stoichiometry', () => {
    expect(() => molarSolubility(0, 1, 1)).toThrow(RangeError)
    expect(() => molarSolubility(1e-10, 0, 1)).toThrow(RangeError)
  })
})

describe('ionic product and precipitation (Section 6.13.1 and 6.6.2)', () => {
  it('gives Qsp = [M]^x [X]^y', () => {
    expect(ionicProduct(0.01, 0.01, 1, 1)).toBeCloseTo(1e-4, 12)
  })

  it('reports precipitation when Qsp exceeds Ksp (Problem 6.27: Ni(OH)2 and AgCN are compared by S)', () => {
    expect(willPrecipitate(2e-10, 1.1e-10)).toBe('precipitates')
    expect(willPrecipitate(1e-10, 1.1e-10)).toBe('no precipitate')
    expect(willPrecipitate(1.1e-10, 1.1e-10)).toBe('at saturation')
  })
})

describe('Problem 6.27: which salt is more soluble', () => {
  it('gives S(AgCN) = 7.7 × 10⁻⁹ M for Ksp = 6 × 10⁻¹⁷', () => {
    expect(molarSolubility(6e-17, 1, 1)).toBeCloseTo(7.75e-9, 10)
  })

  it('gives S(Ni(OH)2) = 7.9 × 10⁻⁶ M for Ksp = 2.0 × 10⁻¹⁵ (NCERT prints 0.58 × 10⁻⁴)', () => {
    const s = molarSolubility(2e-15, 1, 2)
    expect(s).toBeCloseTo(7.94e-6, 8)
    expect(s).toBeGreaterThan(molarSolubility(6e-17, 1, 1))
  })
})

describe('common ion effect (Section 6.13.2, Problem 6.28)', () => {
  it('gives S = 2.0 × 10⁻¹³ M for Ni(OH)2 in 0.10 M NaOH (Problem 6.28)', () => {
    expect(solubilityWithCommonIon(2e-15, 1, 2, 0.1, 'anion')).toBeCloseTo(2.0e-13, 15)
  })

  it('reduces BaSO4 solubility with 0.01 M Ba²⁺ to about 1.1 × 10⁻⁸ M', () => {
    expect(solubilityWithCommonIon(1.1e-10, 1, 1, 0.01, 'cation')).toBeCloseTo(1.1e-8, 10)
  })

  it('is smaller than the pure-water solubility whenever the common ion is present', () => {
    expect(solubilityWithCommonIon(1.1e-10, 1, 1, 0.01, 'cation')).toBeLessThan(molarSolubility(1.1e-10, 1, 1))
  })

  it('gives the pure-water solubility when the common ion concentration is zero', () => {
    expect(solubilityWithCommonIon(1.1e-10, 1, 1, 0, 'cation')).toBeCloseTo(molarSolubility(1.1e-10, 1, 1), 12)
  })

  it('rejects a negative common ion concentration', () => {
    expect(() => solubilityWithCommonIon(1e-10, 1, 1, -0.1, 'anion')).toThrow(RangeError)
  })
})
