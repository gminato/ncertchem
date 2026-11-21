import { describe, expect, it } from 'vitest'
import { VANT_HOFF_STEPS, clampVantHoffStep } from './vanthoff-steps'

describe('vanthoff-steps metadata', () => {
  it('defines exactly 5 ordered steps with sequential indices', () => {
    expect(VANT_HOFF_STEPS).toHaveLength(5)
    VANT_HOFF_STEPS.forEach((step, idx) => {
      expect(step.index).toBe(idx)
      expect(step.title.length).toBeGreaterThan(4)
      expect(step.ariaSummary.length).toBeGreaterThan(20)
    })
  })

  it('encodes physically consistent i and apparent molar mass ratios for particle steps', () => {
    const [baseline, dissociation, association] = VANT_HOFF_STEPS
    expect(baseline.targetI).toBe(1)
    expect(baseline.targetMassRatio).toBeCloseTo(1 / baseline.targetI, 6)

    expect(dissociation.targetI).toBe(2)
    expect(dissociation.targetMassRatio).toBeCloseTo(1 / dissociation.targetI, 6)
    expect(dissociation.particleCount).toBe(12)

    expect(association.targetI).toBe(0.5)
    expect(association.targetMassRatio).toBeCloseTo(1 / association.targetI, 6)
    expect(association.particleCount).toBe(3)
  })

  it('clamps out-of-range step indices safely', () => {
    expect(clampVantHoffStep(-3)).toBe(0)
    expect(clampVantHoffStep(0)).toBe(0)
    expect(clampVantHoffStep(2.4)).toBe(2)
    expect(clampVantHoffStep(99)).toBe(4)
    expect(clampVantHoffStep(Number.NaN)).toBe(0)
  })
})
