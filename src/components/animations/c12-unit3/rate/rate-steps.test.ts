import { describe, expect, it } from 'vitest'
import {
  EXAMPLE_R0,
  READOUTS,
  RATE_STEPS,
  concA,
  getRateStepState,
  instantRate,
  stoichiometryRates,
  tangentSlopeAt,
  windowAverage,
} from './rate-steps'

describe('Section 3.1 rate steps', () => {
  it('has five steps in the order of the MDX', () => {
    expect(RATE_STEPS.map((s) => s.id)).toEqual(['average', 'shrink', 'tangent', 'stoichiometry', 'units'])
    expect(RATE_STEPS.map((s) => s.index)).toEqual([0, 1, 2, 3, 4])
  })

  it('clamps the step index', () => {
    expect(getRateStepState(-3).id).toBe('average')
    expect(getRateStepState(99).id).toBe('units')
    expect(getRateStepState(2.2).id).toBe('tangent')
  })

  it('starts from the stated concentration and falls to the stated values', () => {
    expect(READOUTS.concAt0).toBe('0.100')
    expect(READOUTS.concAt500).toBe('0.0368')
    expect(READOUTS.productAt500).toBe('0.0632')
    expect(concA(0)).toBeCloseTo(EXAMPLE_R0, 12)
  })

  it('gives the average rates quoted in the Prose', () => {
    expect(READOUTS.avgFull).toBe('1.26 × 10⁻⁴')
    expect(READOUTS.avgShort).toBe('1.22 × 10⁻⁴')
    expect(READOUTS.avgNarrow).toBe('1.21 × 10⁻⁴')
    expect(windowAverage(0, 500)).toBeGreaterThan(0)
  })

  it('gives the instantaneous rate at 250 s as the tangent slope with its sign reversed', () => {
    expect(READOUTS.instant).toBe('1.21 × 10⁻⁴')
    expect(READOUTS.tangentSlope).toBe('−1.21 × 10⁻⁴')
    expect(instantRate(250)).toBeCloseTo(-tangentSlopeAt(250), 15)
    expect(instantRate(250)).toBeGreaterThan(0)
  })

  it('shares one reaction rate between the species of 3A → 2B, taken from the curve at 250 s', () => {
    const { reaction, dA, dB } = stoichiometryRates()
    const minusDAdt = instantRate(250)
    expect(reaction).toBeCloseTo(minusDAdt / 3, 15)
    expect(dA).toBeCloseTo(-minusDAdt, 15)
    expect(dB).toBeCloseTo((2 * minusDAdt) / 3, 15)
    expect(READOUTS.dA).toBe('1.21 × 10⁻⁴')
    expect(READOUTS.dB).toBe('8.09 × 10⁻⁵')
    expect(READOUTS.reaction).toBe('4.04 × 10⁻⁵')
  })
})
