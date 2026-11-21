import { describe, expect, it } from 'vitest'
import {
  DELTA_G_DANIELL_DOUBLED_KJ,
  DELTA_G_DANIELL_KJ,
  E0_CU_AG,
  E0_DANIELL,
  K_DANIELL,
  LOG_K_CU_AG,
  LOG_K_DANIELL,
  N_F_DANIELL,
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

  it('takes the Daniell E° from Table 2.1 and the Cu/Ag E° as 0.46 V', () => {
    expect(E0_DANIELL).toBeCloseTo(1.1, 6)
    expect(E0_CU_AG).toBeCloseTo(0.46, 6)
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

  it('gives log K of about 37.3 for Daniell and 15.6 for Cu/Ag, with K about 2 × 10³⁷', () => {
    expect(LOG_K_DANIELL).toBeCloseTo(37.29, 1)
    expect(LOG_K_CU_AG).toBeCloseTo(15.59, 1)
    expect(K_DANIELL / 1e37).toBeCloseTo(1.94, 1)
  })

  it('gives ΔrG° = −212.27 kJ mol⁻¹ and doubles it when the equation is doubled, with E unchanged', () => {
    expect(DELTA_G_DANIELL_KJ).toBeCloseTo(-212.27, 1)
    expect(DELTA_G_DANIELL_DOUBLED_KJ).toBeCloseTo(-424.5, 1)
    expect(DELTA_G_DANIELL_DOUBLED_KJ / DELTA_G_DANIELL_KJ).toBeCloseTo(2, 9)
    expect(getRundownStepState(5).cellV).toBeCloseTo(1.1, 6)
  })

  it('gives nF = 1.93 × 10⁵ C mol⁻¹ for n = 2', () => {
    expect(N_F_DANIELL / 1e5).toBeCloseTo(1.93, 2)
  })

  it('clamps out-of-range Step indices', () => {
    expect(clampRundownStep(-3)).toBe(0)
    expect(clampRundownStep(99)).toBe(RUNDOWN_STEP_COUNT - 1)
    expect(clampRundownStep(Number.NaN)).toBe(0)
  })
})
