import { describe, expect, it } from 'vitest'
import { zeroOrderConc, zeroOrderK, zeroOrderTimeToZero } from '@/lib/chem/kinetics'
import {
  K,
  R0,
  SITE_COUNT,
  T_BEND,
  ZERO_ORDER_STEP_COUNT,
  getZeroOrderStepState,
  idealConc,
  realConc,
} from './zeroorder-steps'

describe('zero-order Scrolly targets', () => {
  it('has five steps and clamps out-of-range indices', () => {
    expect(ZERO_ORDER_STEP_COUNT).toBe(5)
    expect(getZeroOrderStepState(-3).index).toBe(0)
    expect(getZeroOrderStepState(99).index).toBe(4)
    expect(getZeroOrderStepState(Number.NaN).index).toBe(0)
  })

  it('uses the lib values for the example (R0 = 0.80, k = 0.025)', () => {
    expect(R0).toBe(0.8)
    expect(K).toBe(0.025)
    expect(zeroOrderTimeToZero(R0, K)).toBe(32)
    expect(idealConc(12)).toBeCloseTo(zeroOrderConc(R0, K, 12), 12)
    expect(zeroOrderK(R0, 0.5, 12)).toBeCloseTo(0.025, 12)
  })

  it('keeps the site count and the occupied array in step', () => {
    for (let s = 0; s < ZERO_ORDER_STEP_COUNT; s++) {
      expect(getZeroOrderStepState(s).occupied).toHaveLength(SITE_COUNT)
    }
  })

  it('fills every site while the rate holds, and leaves some bare at the end', () => {
    for (let s = 0; s < 4; s++) {
      expect(getZeroOrderStepState(s).occupied.every(Boolean)).toBe(true)
    }
    const last = getZeroOrderStepState(4).occupied
    expect(last.some((x) => !x)).toBe(true)
    expect(last.some(Boolean)).toBe(true)
  })

  it('thins the gas from step 1 to step 2 and keeps the rate arrow the same length until the end', () => {
    expect(getZeroOrderStepState(1).gas).toBeLessThan(getZeroOrderStepState(0).gas)
    expect(getZeroOrderStepState(0).rateLength).toBe(1)
    expect(getZeroOrderStepState(1).rateLength).toBe(1)
    expect(getZeroOrderStepState(2).rateLength).toBe(1)
    expect(getZeroOrderStepState(4).rateLength).toBeLessThan(1)
  })

  it('draws the straight line only from step 3 and the real curve only at the end', () => {
    expect(getZeroOrderStepState(1).lineReveal).toBe(0)
    expect(getZeroOrderStepState(2).lineReveal).toBe(1)
    expect(getZeroOrderStepState(3).guides).toBe(true)
    expect(getZeroOrderStepState(2).guides).toBe(false)
    expect(getZeroOrderStepState(3).curveReveal).toBe(0)
    expect(getZeroOrderStepState(4).curveReveal).toBe(1)
  })

  it('readouts quote the lib numbers in the Prose format', () => {
    expect(getZeroOrderStepState(2).readout).toContain('0.025')
    expect(getZeroOrderStepState(3).readout).toContain('0.80 − 0.50')
    expect(getZeroOrderStepState(3).readout).toContain('0.025')
    expect(getZeroOrderStepState(4).readout).toContain('32 s')
  })
})

describe('schematic real curve', () => {
  it('follows the ideal line up to the bend point', () => {
    expect(realConc(0)).toBeCloseTo(R0, 12)
    expect(realConc(T_BEND)).toBeCloseTo(idealConc(T_BEND), 12)
  })

  it('leaves the ideal line after the bend, stays above zero, and keeps falling', () => {
    const t = 30
    expect(realConc(t)).toBeGreaterThan(0)
    expect(realConc(t)).toBeGreaterThan(idealConc(t))
    expect(realConc(36)).toBeLessThan(realConc(30))
  })

  it('eases away from the ideal line (no kink) and stays above it', () => {
    expect(realConc(T_BEND + 1) - idealConc(T_BEND + 1)).toBeLessThan(0.001)
    expect(realConc(T_BEND + 8)).toBeGreaterThan(idealConc(T_BEND + 8) + 0.01)
    for (let t = T_BEND; t <= 36; t += 0.5) {
      expect(realConc(t)).toBeGreaterThanOrEqual(idealConc(t) - 1e-12)
    }
  })
})
