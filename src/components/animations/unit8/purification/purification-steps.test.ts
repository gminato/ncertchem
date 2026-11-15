import { describe, expect, it } from 'vitest'
import { clampStep, purificationTargets } from './purification-steps'

describe('purificationTargets', () => {
  const targets = purificationTargets()

  it('has six Steps in the order of Section 8.8: sublimation, crystallisation, filtration, distillation, steam, funnel', () => {
    expect(targets.map((t) => t.stage)).toEqual(['sublimation', 'cooling', 'filtration', 'fractional', 'steam', 'funnel'])
  })

  it('keeps every progress between 0 and 1', () => {
    for (const t of targets) {
      expect(t.progress).toBeGreaterThanOrEqual(0)
      expect(t.progress).toBeLessThanOrEqual(1)
    }
  })

  it('takes the fractional boiling point from the lib: between the two pure boiling points', () => {
    const t = targets[3].temperatureC
    expect(t).toBeGreaterThan(80.1)
    expect(t).toBeLessThan(110.6)
  })

  it('takes the steam boiling point below 100 °C', () => {
    expect(targets[4].temperatureC).toBeGreaterThan(80)
    expect(targets[4].temperatureC).toBeLessThan(100)
  })
})

describe('clampStep', () => {
  it('rounds and clamps to the Steps', () => {
    expect(clampStep(-0.4, 6)).toBe(0)
    expect(clampStep(2.6, 6)).toBe(3)
    expect(clampStep(9, 6)).toBe(5)
  })
})
