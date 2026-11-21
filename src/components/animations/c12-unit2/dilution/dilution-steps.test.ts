import { describe, expect, it } from 'vitest'
import {
  ACETIC_ALPHA,
  ACETIC_KA,
  ACETIC_LAMBDA0,
  ACETIC_ONE_IN,
  DILUTION_STEPS,
  KAPPA_CONC,
  KAPPA_DILUTE,
  KCL_INTERCEPT,
  KCL_SLOPE_A,
  LAMBDA_CONC,
  LAMBDA_DILUTE,
  MGCL2_BARS,
  VOLUME_CONC_CM3,
  VOLUME_DILUTE_CM3,
  aceticMolarConductivity,
  clampDilutionStep,
  groupThousands,
  sciNotation,
} from './dilution-steps'

describe('dilution-conductivity steps', () => {
  it('has six steps with unique ids matching the Prose', () => {
    expect(DILUTION_STEPS).toHaveLength(6)
    expect(new Set(DILUTION_STEPS.map((s) => s.id)).size).toBe(6)
    expect(DILUTION_STEPS.map((s) => s.scene)).toEqual(['cube', 'volume', 'chart', 'chart', 'bars', 'acid'])
  })

  it('clamps out-of-range step indices', () => {
    expect(clampDilutionStep(-3)).toBe(0)
    expect(clampDilutionStep(42)).toBe(5)
    expect(clampDilutionStep(Number.NaN)).toBe(0)
    expect(clampDilutionStep(2.4)).toBe(2)
  })

  it('takes the conductivities and molar conductivities from Table 2.3 (0.10 and 0.010 mol L⁻¹)', () => {
    expect(sciNotation(KAPPA_CONC)).toBe('1.29 × 10⁻²')
    expect(sciNotation(KAPPA_DILUTE)).toBe('1.41 × 10⁻³')
    expect(LAMBDA_CONC).toBeCloseTo(129.0, 6)
    expect(LAMBDA_DILUTE).toBeCloseTo(141.0, 6)
  })

  it('gives the cell volumes per mole in cm³ (1000 / c) with thousands grouped', () => {
    expect(VOLUME_CONC_CM3).toBeCloseTo(10000, 6)
    expect(VOLUME_DILUTE_CM3).toBeCloseTo(100000, 6)
    expect(groupThousands(VOLUME_CONC_CM3)).toBe('10 000')
    expect(groupThousands(VOLUME_DILUTE_CM3)).toBe('100 000')
  })

  it('takes the two-point KCl line from the lib (intercept 146.5, A 55.5)', () => {
    expect(KCL_INTERCEPT).toBeCloseTo(146.5, 1)
    expect(KCL_SLOPE_A).toBeCloseTo(55.5, 1)
  })

  it('gives the MgCl₂ ion total of Step 5', () => {
    expect(MGCL2_BARS.total.toFixed(1)).toBe('258.6')
  })

  it('gives alpha 0.0297, one ionised molecule in 34, and Ka 1.82e-5 for acetic acid in Step 6', () => {
    expect(ACETIC_LAMBDA0.toFixed(1)).toBe('390.5')
    expect(ACETIC_ALPHA.toFixed(4)).toBe('0.0297')
    expect(ACETIC_ONE_IN).toBe(34)
    expect(sciNotation(ACETIC_KA)).toBe('1.82 × 10⁻⁵')
  })

  it('draws the acetic acid sketch consistent with the measured 11.6 at 0.0200 mol L⁻¹', () => {
    expect(Math.abs(aceticMolarConductivity(0.02) - 11.6)).toBeLessThan(0.05)
    expect(aceticMolarConductivity(0.0001)).toBeGreaterThan(aceticMolarConductivity(0.01))
  })
})
