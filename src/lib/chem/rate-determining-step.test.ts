import { describe, expect, it } from 'vitest'
import { twoStepSeries } from './kinetics'
import { intermediatePeak, intermediatePeakTime, slowerStep } from './rate-determining-step'

describe('slowerStep', () => {
  it('names the slower step from the rate constants', () => {
    expect(slowerStep(0.1, 1)).toBe('step1')
    expect(slowerStep(1, 0.1)).toBe('step2')
    expect(slowerStep(0.5, 0.5)).toBe('equal')
  })

  it('rejects non-positive rate constants', () => {
    expect(() => slowerStep(0, 1)).toThrow(RangeError)
    expect(() => intermediatePeakTime(1, -2)).toThrow(RangeError)
  })
})

describe('intermediatePeak', () => {
  it('matches the default lab values (k1 = 0.10 s⁻¹, k2 = 1.00 s⁻¹)', () => {
    const { t, I } = intermediatePeak(1, 0.1, 1)
    expect(t).toBeCloseTo(2.5584, 4)
    expect(I).toBeCloseTo(0.07742636, 6)
  })

  it('is a true maximum of [I] (both neighbours are lower)', () => {
    const k1 = 1
    const k2 = 0.1
    const { t, I } = intermediatePeak(1, k1, k2)
    expect(twoStepSeries(1, k1, k2, t * 0.95).I).toBeLessThan(I)
    expect(twoStepSeries(1, k1, k2, t * 1.05).I).toBeLessThan(I)
  })

  it('uses 1/k when the two steps are equally fast', () => {
    const { t, I } = intermediatePeak(1, 0.5, 0.5)
    expect(t).toBeCloseTo(2, 12)
    expect(I).toBeCloseTo(1 / Math.E, 6)
  })

  it('keeps the mass balance at the peak', () => {
    const { t } = intermediatePeak(1, 0.3, 0.9)
    const { A, I, P } = twoStepSeries(1, 0.3, 0.9, t)
    expect(A + I + P).toBeCloseTo(1, 12)
  })
})
