import { describe, it, expect } from 'vitest'
import { blackBodyCurve, peakWavelengthNm, planckRadiance } from './black-body'

describe('planckRadiance', () => {
  it('matches the closed form at 500 nm and 5000 K', () => {
    const h = 6.626e-34
    const c = 3.0e8
    const k = 1.380649e-23
    const lambda = 500e-9
    const T = 5000
    const expected = (2 * h * c * c) / lambda ** 5 / (Math.exp((h * c) / (lambda * k * T)) - 1)
    expect(planckRadiance(lambda, T) / expected).toBeCloseTo(1, 12)
    expect(expected).toBeGreaterThan(1.1e13)
    expect(expected).toBeLessThan(1.25e13)
  })

  it('increases at every wavelength as the temperature rises', () => {
    for (const nm of [200, 500, 1000, 2000]) {
      const low = planckRadiance(nm * 1e-9, 3000)
      const high = planckRadiance(nm * 1e-9, 4000)
      expect(high).toBeGreaterThan(low)
    }
  })

  it('falls to almost zero at very short wavelengths (Wien tail)', () => {
    const peak = planckRadiance(500e-9, 3000)
    expect(planckRadiance(50e-9, 3000)).toBeLessThan(peak * 1e-6)
  })

  it('returns 0 rather than NaN for extreme exponents', () => {
    expect(planckRadiance(1e-9, 1000)).toBe(0)
  })

  it('rejects non-positive inputs', () => {
    expect(() => planckRadiance(0, 3000)).toThrow(RangeError)
    expect(() => planckRadiance(500e-9, 0)).toThrow(RangeError)
    expect(() => planckRadiance(Number.NaN, 3000)).toThrow(RangeError)
  })
})

describe('peakWavelengthNm', () => {
  it('shifts to shorter wavelengths as the temperature rises', () => {
    const p3000 = peakWavelengthNm(3000)
    const p4000 = peakWavelengthNm(4000)
    const p6000 = peakWavelengthNm(6000)
    expect(p4000).toBeLessThan(p3000)
    expect(p6000).toBeLessThan(p4000)
  })

  it('agrees with Wien’s displacement law (λmax·T ≈ 2.898 × 10⁻³ m K) to 0.5 %', () => {
    for (const T of [3000, 4000, 5000, 6000]) {
      const wienNm = (2.898e-3 / T) * 1e9
      expect(Math.abs(peakWavelengthNm(T) - wienNm) / wienNm).toBeLessThan(0.005)
    }
  })

  it('gives about 967 nm at 3000 K and 483 nm at 6000 K', () => {
    expect(Math.round(peakWavelengthNm(3000))).toBe(967)
    expect(Math.round(peakWavelengthNm(6000))).toBe(483)
  })
})

describe('blackBodyCurve', () => {
  it('samples the wavelength grid from min to max inclusive', () => {
    const curve = blackBodyCurve(4000, 100, 4000, 10)
    expect(curve[0].nm).toBe(100)
    expect(curve[curve.length - 1].nm).toBe(4000)
    expect(curve.length).toBe(391)
  })

  it('has its largest sample near the computed peak', () => {
    const curve = blackBodyCurve(5000, 100, 4000, 1)
    const best = curve.reduce((a, b) => (b.radiance > a.radiance ? b : a))
    expect(Math.abs(best.nm - peakWavelengthNm(5000))).toBeLessThan(2)
  })

  it('rejects an invalid grid', () => {
    expect(() => blackBodyCurve(4000, 500, 100, 10)).toThrow(RangeError)
    expect(() => blackBodyCurve(4000, 100, 500, 0)).toThrow(RangeError)
  })
})
