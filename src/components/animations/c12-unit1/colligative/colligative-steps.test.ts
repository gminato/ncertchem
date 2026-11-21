import { describe, expect, it } from 'vitest'
import {
  ATM_PRESSURE_V,
  clampColligativeStep,
  COLLIGATIVE_STEPS,
  MAX_LOWERING_ALPHA,
  PURE_BOILING_U,
  PURE_FREEZING_U,
  PURE_FREEZING_V,
  pureVapourPressure,
  solidVapourPressure,
  solutionVapourPressure,
  solveBoilingU,
  solveFreezingU,
} from './colligative-steps'

describe('colligative-steps specification and curve math', () => {
  it('defines exactly 5 sequential steps with non-empty metadata', () => {
    expect(COLLIGATIVE_STEPS).toHaveLength(5)
    COLLIGATIVE_STEPS.forEach((step, idx) => {
      expect(step.index).toBe(idx)
      expect(step.title.length).toBeGreaterThan(5)
      expect(step.ariaLabel.length).toBeGreaterThan(20)
    })
  })

  it('clamps out-of-range and non-finite step indices cleanly', () => {
    expect(clampColligativeStep(-3)).toBe(0)
    expect(clampColligativeStep(0)).toBe(0)
    expect(clampColligativeStep(4)).toBe(4)
    expect(clampColligativeStep(99)).toBe(4)
    expect(clampColligativeStep(Number.NaN)).toBe(0)
  })

  it('anchors the pure solvent curve exactly at T_f⁰ and T_b⁰', () => {
    expect(pureVapourPressure(PURE_FREEZING_U)).toBeCloseTo(PURE_FREEZING_V, 8)
    expect(solidVapourPressure(PURE_FREEZING_U)).toBeCloseTo(PURE_FREEZING_V, 8)
    expect(pureVapourPressure(PURE_BOILING_U)).toBeCloseTo(ATM_PRESSURE_V, 8)
  })

  it('solves exact lowered freezing and elevated boiling intersections', () => {
    const uF = solveFreezingU(MAX_LOWERING_ALPHA)
    const uB = solveBoilingU(MAX_LOWERING_ALPHA)

    expect(uF).toBeLessThan(PURE_FREEZING_U)
    expect(uB).toBeGreaterThan(PURE_BOILING_U)

    // Solution curve equals solid curve at uF
    expect(solutionVapourPressure(uF, MAX_LOWERING_ALPHA)).toBeCloseTo(
      solidVapourPressure(uF),
      8
    )
    // Solution curve equals 1.013 bar (v = 1.0) at uB
    expect(solutionVapourPressure(uB, MAX_LOWERING_ALPHA)).toBeCloseTo(ATM_PRESSURE_V, 8)
  })

  it('returns pure anchors when lowering alpha is 0', () => {
    expect(solveFreezingU(0)).toBe(PURE_FREEZING_U)
    expect(solveBoilingU(0)).toBe(PURE_BOILING_U)
  })
})
