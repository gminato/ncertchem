import { describe, expect, it } from 'vitest'
import {
  cellConstant,
  cellConstantFromReference,
  conductanceFromResistance,
  conductivityFromCell,
  conductivityFromResistivity,
  degreeOfDissociation,
  dissociationConstantFromAlpha,
  fitDebyeHuckelOnsager,
  lambda0ByCombination,
  lambda0Electrolyte,
  lambda0OfIon,
  molarConductivityScm2,
  molarConductivitySm2,
  molarScm2ToSm2,
  molarSm2ToScm2,
  resistanceFromResistivity,
  sPerCmToSPerM,
  sPerMToSPerCm,
  unknownResistanceFromBridge,
} from './conductance'
import { NCERT_EXAMPLE_2_6_KCL } from './ncert-c12-unit2-tables'

describe('resistance, conductance and conductivity', () => {
  it('R = ρl/A and G = 1/R, κ = 1/ρ', () => {
    expect(resistanceFromResistivity(2, 3, 6)).toBe(1)
    expect(conductanceFromResistance(4)).toBe(0.25)
    expect(conductivityFromResistivity(87.135)).toBeCloseTo(0.011476, 5)
  })

  it('throws for non-positive area, resistance or resistivity', () => {
    expect(() => resistanceFromResistivity(1, 1, 0)).toThrow(RangeError)
    expect(() => conductanceFromResistance(0)).toThrow(RangeError)
    expect(() => conductivityFromResistivity(-1)).toThrow(RangeError)
  })
})

describe('cell constant', () => {
  it('G* = l/A and G* = Rκ agree (Eq. 2.18)', () => {
    expect(cellConstant(1, 0.785)).toBeCloseTo(1.2739, 4)
    expect(cellConstantFromReference(100, 1.29)).toBeCloseTo(129, 9)
  })

  it('Example 2.4: κ = G*/R = 129 m⁻¹ / 520 Ω = 0.248 S m⁻¹', () => {
    const g = cellConstantFromReference(100, 1.29)
    expect(conductivityFromCell(g, 520)).toBeCloseTo(0.248, 3)
  })
})

describe('Wheatstone bridge', () => {
  it('R2 = R1 R4 / R3 (Eq. 2.19)', () => {
    expect(unknownResistanceFromBridge(500, 100, 200)).toBe(1000)
    expect(() => unknownResistanceFromBridge(1, 0, 1)).toThrow(RangeError)
  })
})

describe('unit conversions', () => {
  it('1 S m⁻¹ = 0.01 S cm⁻¹ and 1 S cm² mol⁻¹ = 1e-4 S m² mol⁻¹', () => {
    expect(sPerCmToSPerM(0.1113)).toBeCloseTo(11.13, 9)
    expect(sPerMToSPerCm(1.29)).toBeCloseTo(0.0129, 12)
    expect(molarScm2ToSm2(129)).toBeCloseTo(0.0129, 12)
    expect(molarSm2ToScm2(0.0129)).toBeCloseTo(129, 9)
  })
})

describe('molar conductivity', () => {
  it('Λm = κ × 1000 / c in cm units (Table 2.3, 0.1 M KCl → 129.0)', () => {
    expect(molarConductivityScm2(0.0129, 0.1)).toBeCloseTo(129, 9)
  })

  it('Example 2.4 SI form: 0.248 S m⁻¹ / 20 mol m⁻³ = 124 × 10⁻⁴ S m² mol⁻¹', () => {
    expect(molarConductivitySm2(0.248, 20)).toBeCloseTo(124e-4, 9)
  })

  it('Example 2.5: 0.01148 S cm⁻¹ at 0.05 M gives 229.6 S cm² mol⁻¹', () => {
    expect(molarConductivityScm2(0.01148, 0.05)).toBeCloseTo(229.6, 0)
  })

  it('rejects a non-positive concentration', () => {
    expect(() => molarConductivityScm2(0.01, 0)).toThrow(RangeError)
    expect(() => molarConductivitySm2(0.01, -1)).toThrow(RangeError)
  })
})

describe('Debye–Hückel–Onsager fit (Example 2.6)', () => {
  it('fits Λm against √c to about 149.8 intercept and A ≈ 87.4', () => {
    const fit = fitDebyeHuckelOnsager(NCERT_EXAMPLE_2_6_KCL.map((r) => ({ c: r.c, lambdaScm2: r.lambdaScm2 })))
    expect(fit.lambda0Scm2).toBeCloseTo(149.83, 1)
    expect(fit.A).toBeCloseTo(87.44, 1)
  })

  it('agrees with NCERT graph reading (150.0, 87.46) within 0.2 units', () => {
    const fit = fitDebyeHuckelOnsager(NCERT_EXAMPLE_2_6_KCL.map((r) => ({ c: r.c, lambdaScm2: r.lambdaScm2 })))
    expect(Math.abs(fit.lambda0Scm2 - 150.0)).toBeLessThan(0.2)
    expect(Math.abs(fit.A - 87.46)).toBeLessThan(0.1)
  })

  it('recovers an exact line', () => {
    const fit = fitDebyeHuckelOnsager([
      { c: 0.01, lambdaScm2: 140 - 100 * 0.1 },
      { c: 0.04, lambdaScm2: 140 - 100 * 0.2 },
      { c: 0.09, lambdaScm2: 140 - 100 * 0.3 },
    ])
    expect(fit.lambda0Scm2).toBeCloseTo(140, 9)
    expect(fit.A).toBeCloseTo(100, 9)
  })

  it('throws with fewer than two points or equal concentrations', () => {
    expect(() => fitDebyeHuckelOnsager([{ c: 0.1, lambdaScm2: 1 }])).toThrow(RangeError)
    expect(() => fitDebyeHuckelOnsager([{ c: 0.1, lambdaScm2: 1 }, { c: 0.1, lambdaScm2: 2 }])).toThrow(RangeError)
  })
})

describe('Kohlrausch law (Table 2.4)', () => {
  it('λ° for single ions and Λ° for electrolytes (Example 2.7)', () => {
    expect(lambda0OfIon('Cl-')).toBe(76.3)
    expect(lambda0Electrolyte([{ ion: 'Ca2+', count: 1 }, { ion: 'Cl-', count: 2 }])).toBeCloseTo(271.6, 9)
    expect(lambda0Electrolyte([{ ion: 'Mg2+', count: 1 }, { ion: 'SO4_2-', count: 1 }])).toBeCloseTo(266, 9)
  })

  it('Example 2.8: Λ°(HAc) = 425.9 + 91.0 − 126.4 = 390.5 S cm² mol⁻¹', () => {
    expect(lambda0ByCombination([425.9, 91.0], [126.4])).toBeCloseTo(390.5, 9)
  })

  it('reproduces NaCl, HCl and NaAc from table ions (126.4, 425.9, 91.0)', () => {
    expect(lambda0Electrolyte([{ ion: 'Na+', count: 1 }, { ion: 'Cl-', count: 1 }])).toBeCloseTo(126.4, 9)
    expect(lambda0Electrolyte([{ ion: 'H+', count: 1 }, { ion: 'Cl-', count: 1 }])).toBeCloseTo(425.9, 9)
    expect(lambda0Electrolyte([{ ion: 'Na+', count: 1 }, { ion: 'CH3COO-', count: 1 }])).toBeCloseTo(91.0, 9)
  })
})

describe('weak electrolyte: α and Ka (Example 2.9)', () => {
  it('Λm = 48.15, α = 0.1233, Ka = 1.78 × 10⁻⁵', () => {
    const lambdaM = molarConductivityScm2(4.95e-5, 0.001028)
    expect(lambdaM).toBeCloseTo(48.15, 1)
    const alpha = degreeOfDissociation(lambdaM, 390.5)
    expect(alpha).toBeCloseTo(0.1233, 4)
    expect(dissociationConstantFromAlpha(0.001028, alpha) / 1.78e-5).toBeCloseTo(1, 2)
  })

  it('throws for α outside [0, 1) or c ≤ 0', () => {
    expect(() => dissociationConstantFromAlpha(0.1, 1)).toThrow(RangeError)
    expect(() => dissociationConstantFromAlpha(0, 0.5)).toThrow(RangeError)
    expect(() => degreeOfDissociation(1, 0)).toThrow(RangeError)
  })
})
