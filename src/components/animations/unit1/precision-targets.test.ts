import { describe, expect, it } from 'vitest'
import {
  TARGET_STEPS,
  TRUE_MASS_G,
  meanText,
  snapshotForStep,
  spreadText,
} from './precision-targets'

describe('PrecisionAccuracy targets', () => {
  it('reports the mean of each group to three significant figures', () => {
    expect(TARGET_STEPS.map(meanText)).toEqual(['5.00', '5.43', '5.00', '5.10'])
  })

  it('reports the spread (largest minus smallest reading) in grams', () => {
    expect(TARGET_STEPS.map(spreadText)).toEqual(['0.02', '0.02', '0.38', '1.15'])
  })

  it('makes the first group accurate (mean equals the true mass) and precise (tiny spread)', () => {
    expect(meanText(TARGET_STEPS[0])).toBe(TRUE_MASS_G.toFixed(2))
    expect(Number(spreadText(TARGET_STEPS[0]))).toBeLessThan(0.05)
  })

  it('keeps every dart inside the target', () => {
    for (const step of TARGET_STEPS) {
      for (const dart of step.darts) {
        expect(Math.hypot(dart.x, dart.y)).toBeLessThanOrEqual(1)
      }
    }
  })

  it('has one snapshot entry per dart coordinate plus the mean cross', () => {
    const snapshot = snapshotForStep(2)
    expect(Object.keys(snapshot)).toHaveLength(4 * 2 + 2)
  })
})
