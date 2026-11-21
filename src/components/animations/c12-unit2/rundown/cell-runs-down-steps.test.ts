import { describe, expect, it } from 'vitest'
import {
  DELTA_G_FE_NI_DOUBLED_KJ,
  DELTA_G_FE_NI_KJ,
  E0_FE_NI,
  E0_DANIELL,
  K_DANIELL,
  LOG_K_FE_NI,
  LOG_K_DANIELL,
  N_F_TWO,
  RUNDOWN_STEPS,
  RUNDOWN_STEP_COUNT,
  clampRundownStep,
  getRundownStepState,
} from './cell-runs-down-steps'

describe('cell-runs-down steps', () => {
  it('has six Steps in the order the Prose describes', () => {
    expect(RUNDOWN_STEP_COUNT).toBe(6)
    expect(RUNDOWN_STEPS.map((s) => s.scene)).toEqual(['cell', 'cell', 'cell', 'log', 'bar', 'double'])
  })

  it('takes the Daniell E° from Table 2.1 and the Fe/Ni E° as 0.19 V', () => {
    expect(E0_DANIELL).toBeCloseTo(1.1, 6)
    expect(E0_FE_NI).toBeCloseTo(0.19, 6)
  })

  it('reads 1.10 V fresh, about 1.04 V at Q = 100, and zero at equilibrium', () => {
    expect(getRundownStepState(0).q).toBe(1)
    expect(getRundownStepState(0).cellV).toBeCloseTo(1.1, 6)
    expect(getRundownStepState(1).q).toBe(100)
    expect(getRundownStepState(1).cellV).toBeCloseTo(1.041, 2)
    expect(getRundownStepState(2).cellV).toBe(0)
    expect(getRundownStepState(2).q).toBeCloseTo(K_DANIELL, -30)
  })

  it('stops electron flow only at equilibrium', () => {
    expect(RUNDOWN_STEPS.map((s) => s.flowing)).toEqual([true, true, false, false, false, false])
  })

  it('gives log K of about 37.3 for Daniell and 6.44 for Fe/Ni, with K about 2 × 10³⁷', () => {
    expect(LOG_K_DANIELL).toBeCloseTo(37.29, 1)
    expect(LOG_K_FE_NI).toBeCloseTo(6.44, 2)
    expect(K_DANIELL / 1e37).toBeCloseTo(1.94, 1)
  })

  it('gives ΔrG° = −36.67 kJ mol⁻¹ for Fe/Ni and doubles it when the equation is doubled, with E unchanged', () => {
    expect(DELTA_G_FE_NI_KJ).toBeCloseTo(-36.67, 2)
    expect(DELTA_G_FE_NI_DOUBLED_KJ).toBeCloseTo(-73.33, 2)
    expect(DELTA_G_FE_NI_DOUBLED_KJ / DELTA_G_FE_NI_KJ).toBeCloseTo(2, 9)
    expect(getRundownStepState(5).cellV).toBeCloseTo(0.19, 6)
  })

  it('gives nF = 1.93 × 10⁵ C mol⁻¹ for n = 2', () => {
    expect(N_F_TWO / 1e5).toBeCloseTo(1.93, 2)
  })

  it('clamps out-of-range Step indices', () => {
    expect(clampRundownStep(-3)).toBe(0)
    expect(clampRundownStep(99)).toBe(RUNDOWN_STEP_COUNT - 1)
    expect(clampRundownStep(Number.NaN)).toBe(0)
  })
})
