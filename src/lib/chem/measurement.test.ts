import { describe, expect, it } from 'vitest'
import { mean, spread } from './measurement'

describe('mean and spread', () => {
  it('mean of the readings for the accurate and precise group is the true value', () => {
    expect(mean([4.99, 5.01, 5.0, 5.0])).toBeCloseTo(5.0, 9)
  })

  it('spread is the largest minus the smallest reading', () => {
    expect(spread([4.99, 5.01, 5.0, 5.0])).toBeCloseTo(0.02, 9)
    expect(spread([5.7, 4.55, 5.3, 4.85])).toBeCloseTo(1.15, 9)
  })

  it('throws on an empty set', () => {
    expect(() => mean([])).toThrow(RangeError)
    expect(() => spread([])).toThrow(RangeError)
  })
})
