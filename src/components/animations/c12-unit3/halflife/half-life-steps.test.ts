import { describe, expect, it } from 'vitest'
import { firstOrderHalfLife, zeroOrderHalfLife, zeroOrderTimeToZero } from '@/lib/chem/kinetics'
import {
  HALF_LIFE_STEPS,
  HALF_LIFE_STEP_COUNT,
  HL_K,
  HL_R0,
  HL_R0_DOUBLE,
  T_HALF_FIRST,
  T_HALF_ZERO,
  T_HALF_ZERO_DOUBLE,
  T_ZERO_END,
  T_ZERO_END_DOUBLE,
  clampHalfLifeStep,
  firstCurve,
  fmtSig,
  getHalfLifeStepState,
  remainingFraction,
  zeroCurve,
} from './half-life-steps'

describe('half-life step targets', () => {
  it('has six Steps, indexed 0 to 5, in the order the Prose uses', () => {
    expect(HALF_LIFE_STEP_COUNT).toBe(6)
    expect(HALF_LIFE_STEPS.map((s) => s.index)).toEqual([0, 1, 2, 3, 4, 5])
    expect(HALF_LIFE_STEPS.map((s) => s.id)).toEqual([
      'one-half-life',
      'each-interval',
      'double-start',
      'zero-line',
      'zero-double',
      'orders-card',
    ])
  })

  it('treats the Scrolly step as 0-based and clamps out-of-range values', () => {
    expect(getHalfLifeStepState(0).id).toBe('one-half-life')
    expect(getHalfLifeStepState(5).id).toBe('orders-card')
    expect(clampHalfLifeStep(-1)).toBe(0)
    expect(clampHalfLifeStep(9)).toBe(5)
    expect(clampHalfLifeStep(Number.NaN)).toBe(0)
  })

  it('takes every half-life from the lib (ln 2 / k, [R]₀ / 2k)', () => {
    expect(T_HALF_FIRST).toBeCloseTo(firstOrderHalfLife(HL_K), 12)
    expect(T_HALF_FIRST).toBeCloseTo(Math.LN2 / HL_K, 12)
    expect(T_HALF_ZERO).toBeCloseTo(zeroOrderHalfLife(HL_R0, HL_K), 12)
    expect(T_HALF_ZERO_DOUBLE).toBeCloseTo(zeroOrderHalfLife(HL_R0_DOUBLE, HL_K), 12)
    expect(T_ZERO_END).toBeCloseTo(zeroOrderTimeToZero(HL_R0, HL_K), 12)
    expect(T_ZERO_END_DOUBLE).toBeCloseTo(zeroOrderTimeToZero(HL_R0_DOUBLE, HL_K), 12)
  })

  it('shows the Prose values: 13.9 s, 10.0 s and 20.0 s at one decimal', () => {
    expect(fmtSig(T_HALF_FIRST)).toBe('13.9')
    expect(fmtSig(T_HALF_ZERO)).toBe('10.0')
    expect(fmtSig(T_HALF_ZERO_DOUBLE)).toBe('20.0')
    expect(fmtSig(T_ZERO_END_DOUBLE)).toBe('40.0')
  })

  it('draws the first-order curve so that it is at half its start at one half-life, for both starts', () => {
    expect(firstCurve(HL_R0)(T_HALF_FIRST)).toBeCloseTo(0.5, 10)
    expect(firstCurve(HL_R0_DOUBLE)(T_HALF_FIRST)).toBeCloseTo(1, 10)
  })

  it('draws the zero-order lines to half their start at t½ and to zero at the end time', () => {
    expect(zeroCurve(HL_R0)(T_HALF_ZERO)).toBeCloseTo(0.5, 10)
    expect(zeroCurve(HL_R0)(T_ZERO_END)).toBeCloseTo(0, 10)
    expect(zeroCurve(HL_R0_DOUBLE)(T_HALF_ZERO_DOUBLE)).toBeCloseTo(1, 10)
  })

  it('gives remaining fractions 1/2, 1/4 and 1/8 at the first three half-lives', () => {
    expect([1, 2, 3].map((n) => fmtSig(remainingFraction(n)))).toEqual(['0.500', '0.250', '0.125'])
  })


  it('shows the first-order markers one at a time and the bands only in Step 2', () => {
    expect(HALF_LIFE_STEPS[0].markers).toBe(1)
    expect(HALF_LIFE_STEPS[1].markers).toBe(3)
    expect(HALF_LIFE_STEPS.filter((s) => s.bands > 0).map((s) => s.index)).toEqual([1])
  })

  it('draws the card only in the last Step, with the plot faded out', () => {
    const card = HALF_LIFE_STEPS[5]
    expect(card.card).toBe(1)
    expect(card.plot).toBe(0)
    for (const s of HALF_LIFE_STEPS.slice(0, 5)) expect(s.card).toBe(0)
  })
})
