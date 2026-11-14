import { describe, expect, it } from 'vitest'
import {
  K_ALPHA_FACTOR_HZ,
  MOSELEY_SLOPE_SCALED,
  kAlphaFrequencyHz,
  moseleyLine,
  sqrtFrequencyScaled,
} from './moseley'

describe('Moseley K-alpha approximation (NCERT 3.3)', () => {
  it('gives (3/4) R∞c close to 2.468 × 10¹⁵ Hz', () => {
    expect(K_ALPHA_FACTOR_HZ / 1e15).toBeCloseTo(2.468, 2)
  })

  it('grows as (Z − 1)² and is taken from Z = 2 upward', () => {
    expect(kAlphaFrequencyHz(2)).toBeCloseTo(K_ALPHA_FACTOR_HZ, -3)
    expect(kAlphaFrequencyHz(5) / kAlphaFrequencyHz(3)).toBeCloseTo(16 / 4, 10)
  })

  it('makes √ν linear in Z with the stated slope', () => {
    const pts = moseleyLine(10, 30)
    for (let i = 1; i < pts.length; i++) {
      expect(pts[i].y - pts[i - 1].y).toBeCloseTo(MOSELEY_SLOPE_SCALED, 6)
    }
    expect(sqrtFrequencyScaled(2)).toBeCloseTo(MOSELEY_SLOPE_SCALED, 6)
  })

  it('rejects out-of-range Z', () => {
    expect(() => kAlphaFrequencyHz(1)).toThrow(RangeError)
    expect(() => moseleyLine(20, 10)).toThrow(RangeError)
  })
})
