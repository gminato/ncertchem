import { describe, expect, it } from 'vitest'
import { HESS_CO_OXIDATION_KJ, HESS_LEVEL_CO2_KJ, HESS_LEVEL_CO_KJ, HESS_STEP_COUNT, clampHessStep, highlightForStep } from './hess-steps'

describe('Hess route Scrolly data', () => {
  it('takes the levels from Table 5.2: CO₂ at −393.51 and CO at −110.53 kJ mol⁻¹', () => {
    expect(HESS_LEVEL_CO2_KJ).toBeCloseTo(-393.51, 6)
    expect(HESS_LEVEL_CO_KJ).toBeCloseTo(-110.53, 6)
  })

  it('the CO oxidation step is −282.98 ≈ −283.0 kJ mol⁻¹, so the two routes agree', () => {
    expect(HESS_CO_OXIDATION_KJ).toBeCloseTo(-282.98, 6)
    expect(HESS_LEVEL_CO_KJ + HESS_CO_OXIDATION_KJ).toBeCloseTo(HESS_LEVEL_CO2_KJ, 9)
  })

  it('highlights the direct route first, the two-step route next, and nothing at the end', () => {
    expect(HESS_STEP_COUNT).toBe(4)
    expect([0, 1, 2, 3].map(highlightForStep)).toEqual(['direct', 'two-step', 'two-step', undefined])
  })

  it('clamps the Step index', () => {
    expect(clampHessStep(-1)).toBe(0)
    expect(clampHessStep(10)).toBe(3)
  })
})
