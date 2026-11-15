import { describe, expect, it } from 'vitest'
import { kwAt, neutralPH, strongAcidFrame, strongBaseFrame, waterFrame, DILUTION_EXPONENTS, REFERENCE_T_K } from './ph-model'
import { phScaleSteps, PH_STEP_COUNT } from './ph-steps'

const close = (a: number, b: number, tol = 1e-9) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(b))

describe('pH model (Section 6.11.1 and 6.11.2)', () => {
  it('Kw is 1.0 × 10⁻¹⁴ at 298 K and rises with temperature', () => {
    expect(kwAt(REFERENCE_T_K)).toBeCloseTo(1e-14, 20)
    expect(kwAt(310)).toBeGreaterThan(kwAt(298))
    expect(kwAt(273)).toBeLessThan(kwAt(298))
  })

  it('pure water is neutral at 298 K (pH 7) and below 7 at 310 K', () => {
    const w298 = waterFrame(298)
    expect(w298.pH).toBeCloseTo(7, 9)
    expect(w298.hPlus).toBeCloseTo(1e-7, 15)
    expect(w298.oh).toBeCloseTo(1e-7, 15)
    const w310 = waterFrame(310)
    expect(w310.pH).toBeLessThan(7)
    expect(w310.pH).toBeCloseTo(neutralPH(310), 12)
    // Still neutral: [H₃O⁺] = [OH⁻] at every temperature.
    expect(close(w310.hPlus, w310.oh, 1e-9)).toBe(true)
  })

  it('pH + pOH = pKw for every frame', () => {
    for (const f of [strongAcidFrame(1e-2), strongBaseFrame(1e-4), waterFrame(310), strongAcidFrame(1e-8)]) {
      expect(f.pH + f.pOH).toBeCloseTo(f.pKw, 9)
    }
  })

  it('a ten-fold dilution of a strong acid moves pH by one unit, until water takes over', () => {
    expect(strongAcidFrame(1e-2).pH).toBeCloseTo(2, 6)
    expect(strongAcidFrame(1e-3).pH).toBeCloseTo(3, 6)
    expect(strongAcidFrame(1e-4).pH).toBeCloseTo(4, 6)
  })

  it('10⁻⁸ M HCl has pH 6.98 (water included), and 10⁻⁹ M HCl stays below 7', () => {
    const f8 = strongAcidFrame(1e-8)
    expect(f8.pH.toFixed(2)).toBe('6.98')
    expect(f8.pH).toBeLessThan(7)
    const f9 = strongAcidFrame(1e-9)
    expect(f9.pH).toBeLessThan(7)
    expect(f9.pH).toBeGreaterThan(6.99)
  })

  it('3.0 × 10⁻⁸ M HCl is pH 6.94 with water included; ignoring water would give 7.52', () => {
    expect(strongAcidFrame(3e-8).pH.toFixed(2)).toBe('6.94')
    expect((-Math.log10(3e-8)).toFixed(2)).toBe('7.52')
  })

  it('the water share of [H₃O⁺] is [OH⁻] and is about 10⁻⁷ mol L⁻¹ for 10⁻⁹ M HCl', () => {
    const f9 = strongAcidFrame(1e-9)
    expect(f9.waterHPlus).toBeCloseTo(f9.oh, 20)
    expect(f9.waterHPlus / 1e-7).toBeGreaterThan(0.95)
    expect(f9.waterHPlus / 1e-7).toBeLessThan(1.01)
  })

  it('a strong base at 10⁻⁴ M has pH 10 and [OH⁻] = 1.0 × 10⁻⁴ mol L⁻¹', () => {
    const f = strongBaseFrame(1e-4)
    expect(f.pH).toBeCloseTo(10, 6)
    expect(Math.abs(f.oh / 1e-4 - 1)).toBeLessThan(1e-6)
  })

  it('the explorer exponents are ten factors of ten from 10⁰ to 10⁻⁹', () => {
    expect(DILUTION_EXPONENTS).toHaveLength(10)
    expect(DILUTION_EXPONENTS[0]).toBe(0)
    expect(DILUTION_EXPONENTS[9]).toBe(-9)
  })
})

describe('pH Scrolly targets', () => {
  it('has six deterministic Steps that match the Scrolly step count', () => {
    const a = phScaleSteps()
    const b = phScaleSteps()
    expect(a).toHaveLength(PH_STEP_COUNT)
    expect(a).toEqual(b)
  })

  it('Steps follow the plan: 2, 3, neutral 298 K, a base at pH 10, neutral 310 K, and 3.0 × 10⁻⁸ M HCl', () => {
    const s = phScaleSteps()
    expect(s[0].pH).toBeCloseTo(2, 6)
    expect(s[1].pH).toBeCloseTo(3, 6)
    expect(s[2].pH).toBeCloseTo(7, 9)
    expect(s[3].pH).toBeCloseTo(10, 6)
    expect(s[4].temperatureK).toBe(310)
    expect(s[4].pH).toBeCloseTo(s[4].neutralPH, 12)
    expect(s[5].pH.toFixed(2)).toBe('6.94')
  })
})
