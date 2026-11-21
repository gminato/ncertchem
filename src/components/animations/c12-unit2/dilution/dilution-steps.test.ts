import { describe, expect, it } from 'vitest'
import {
  ACETIC_ALPHA,
  ACETIC_KA,
  ACETIC_LAMBDA0,
  CACL2_BARS,
  DILUTION_STEPS,
  KAPPA_CONC,
  KAPPA_DILUTE,
  KCL_FIT,
  LAMBDA_CONC,
  LAMBDA_DILUTE,
  MGSO4_BARS,
  aceticMolarConductivity,
  clampDilutionStep,
  litresPerMole,
  sciNotation,
  signed,
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

  it('reproduces the conductivities and volumes quoted in Steps 1 and 2', () => {
    expect(sciNotation(KAPPA_CONC)).toBe('1.45 × 10⁻⁴')
    expect(sciNotation(KAPPA_DILUTE)).toBe('2.94 × 10⁻⁵')
    expect(Math.floor(litresPerMole(0.000989))).toBe(1011)
    expect(Math.floor(litresPerMole(0.000198))).toBe(5050)
    expect(LAMBDA_CONC).toBe(147.09)
    expect(LAMBDA_DILUTE).toBe(148.61)
  })

  it('fits the KCl straight line with intercept near 149.8 and A near 87.4', () => {
    expect(signed(KCL_FIT.lambda0Scm2, 1)).toBe('149.8')
    expect(KCL_FIT.A.toFixed(1)).toBe('87.4')
  })

  it('gives the stacked ion totals of Step 5', () => {
    expect(CACL2_BARS.total.toFixed(1)).toBe('271.6')
    expect(MGSO4_BARS.total.toFixed(1)).toBe('266.0')
  })

  it('gives alpha 0.0423 and Ka 1.86e-5 for acetic acid in Step 6', () => {
    expect(ACETIC_LAMBDA0.toFixed(1)).toBe('390.5')
    expect(ACETIC_ALPHA.toFixed(4)).toBe('0.0423')
    expect(sciNotation(ACETIC_KA)).toBe('1.86 × 10⁻⁵')
  })

  it('draws the acetic acid sketch consistent with the measured 16.5 at 0.0100 mol L⁻¹', () => {
    expect(Math.abs(aceticMolarConductivity(0.01) - 16.5)).toBeLessThan(0.1)
    expect(aceticMolarConductivity(0.0001)).toBeGreaterThan(aceticMolarConductivity(0.01))
  })
})
