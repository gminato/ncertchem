import { describe, expect, it } from 'vitest'
import {
  AXIS_MAX_NM,
  AXIS_MIN_NM,
  VISIBLE_MAX_NM,
  VISIBLE_MIN_NM,
  pickLevel,
  randomLevelPair,
  spectrumAxisFraction,
  transitionReadout,
} from './hydrogen-spectrum'

describe('transitionReadout', () => {
  it('gives the Balmer H-alpha line for 3 to 2 (about 656 nm, 1.89 eV)', () => {
    const r = transitionReadout(3, 2)
    expect(r.wavelengthNm).toBeCloseTo(656.5, 0)
    expect(r.deltaEnergyEv).toBeCloseTo(1.89, 2)
    expect(r.series).toBe('Balmer')
    expect(r.region).toBe('visible')
    expect(r.onAxis).toBe(true)
  })

  it('treats the order of the two levels as irrelevant', () => {
    expect(transitionReadout(2, 3)).toEqual(transitionReadout(3, 2))
  })

  it('computes the energy in joules from the Bohr formula (3.03e-19 J for 3 to 2)', () => {
    expect(transitionReadout(3, 2).deltaEnergyJ / 1e-19).toBeCloseTo(3.03, 2)
  })

  it('gives the 6 to 3 Paschen line at 1094 nm, in the infrared', () => {
    const r = transitionReadout(6, 3)
    expect(r.wavelengthNm).toBeCloseTo(1094.1, 1)
    expect(r.series).toBe('Paschen')
    expect(r.region).toBe('infrared')
  })

  it('flags lines beyond the axis, such as 6 to 4 at about 2625 nm', () => {
    const r = transitionReadout(6, 4)
    expect(r.wavelengthNm).toBeGreaterThan(AXIS_MAX_NM)
    expect(r.onAxis).toBe(false)
  })

  it('puts Lyman lines in the ultraviolet', () => {
    const r = transitionReadout(2, 1)
    expect(r.wavelengthNm).toBeCloseTo(121.57, 2)
    expect(r.region).toBe('ultraviolet')
    expect(r.series).toBe('Lyman')
  })

  it('computes the frequency as c / lambda', () => {
    const r = transitionReadout(3, 2)
    expect(r.frequencyHz).toBeCloseTo(4.57e14, -12)
  })

  it('rejects equal levels and levels outside 1 to 6', () => {
    expect(() => transitionReadout(2, 2)).toThrow(RangeError)
    expect(() => transitionReadout(0, 2)).toThrow(RangeError)
    expect(() => transitionReadout(7, 2)).toThrow(RangeError)
    expect(() => transitionReadout(2.5, 1)).toThrow(RangeError)
  })
})

describe('spectrumAxisFraction', () => {
  it('maps the ends of the axis to 0 and 1', () => {
    expect(spectrumAxisFraction(AXIS_MIN_NM)).toBeCloseTo(0, 10)
    expect(spectrumAxisFraction(AXIS_MAX_NM)).toBeCloseTo(1, 10)
  })

  it('is continuous at the zone boundaries', () => {
    expect(spectrumAxisFraction(VISIBLE_MIN_NM)).toBeCloseTo(0.2, 10)
    expect(spectrumAxisFraction(VISIBLE_MAX_NM)).toBeCloseTo(0.7, 10)
  })

  it('increases with wavelength', () => {
    const samples = [95, 122, 300, 400, 486, 656, 700, 1094, 1875, 2000]
    for (let i = 1; i < samples.length; i++) {
      expect(spectrumAxisFraction(samples[i])).toBeGreaterThan(spectrumAxisFraction(samples[i - 1]))
    }
  })

  it('spreads the visible lines linearly', () => {
    const gapA = spectrumAxisFraction(434) - spectrumAxisFraction(410)
    const gapB = spectrumAxisFraction(656) - spectrumAxisFraction(486)
    expect(gapA).toBeCloseTo((24 / 370) * 0.5, 6)
    expect(gapB).toBeCloseTo((170 / 370) * 0.5, 6)
  })

  it('clamps wavelengths outside the axis', () => {
    expect(spectrumAxisFraction(10)).toBe(0)
    expect(spectrumAxisFraction(1e5)).toBe(1)
  })
})

describe('pickLevel', () => {
  it('moves the upper level when a higher level is clicked', () => {
    expect(pickLevel({ upper: 3, lower: 2 }, 5)).toEqual({ upper: 5, lower: 2 })
  })

  it('moves the lower level when a lower level is clicked', () => {
    expect(pickLevel({ upper: 3, lower: 2 }, 1)).toEqual({ upper: 3, lower: 1 })
  })

  it('leaves the pair alone when the current level is clicked', () => {
    expect(pickLevel({ upper: 3, lower: 2 }, 2)).toEqual({ upper: 3, lower: 2 })
    expect(pickLevel({ upper: 3, lower: 2 }, 3)).toEqual({ upper: 3, lower: 2 })
  })

  it('moves the lower end to a level between the ends when that level is nearer to it', () => {
    expect(pickLevel({ upper: 5, lower: 1 }, 2)).toEqual({ upper: 5, lower: 2 })
    expect(pickLevel({ upper: 6, lower: 1 }, 3)).toEqual({ upper: 6, lower: 3 })
  })

  it('moves the upper end to a level between the ends when that level is nearer to it', () => {
    expect(pickLevel({ upper: 5, lower: 1 }, 4)).toEqual({ upper: 4, lower: 1 })
  })

  it('always keeps the upper level above the lower one', () => {
    for (let n = 1; n <= 6; n++) {
      for (const pair of [
        { upper: 2, lower: 1 },
        { upper: 4, lower: 3 },
        { upper: 6, lower: 1 },
      ]) {
        const next = pickLevel(pair, n)
        expect(next.upper).toBeGreaterThan(next.lower)
      }
    }
  })
})

describe('randomLevelPair', () => {
  it('always returns two different levels with the upper one higher', () => {
    const seq = [0, 0.1, 0.5, 0.9, 0.99, 0.3, 0.7]
    let i = 0
    const random = () => seq[i++ % seq.length]
    for (let k = 0; k < 20; k++) {
      const [upper, lower] = randomLevelPair(random)
      expect(upper).toBeGreaterThan(lower)
      expect(lower).toBeGreaterThanOrEqual(1)
      expect(upper).toBeLessThanOrEqual(6)
    }
  })
})
