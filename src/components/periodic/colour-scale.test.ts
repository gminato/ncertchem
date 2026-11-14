import { describe, it, expect } from 'vitest'
import {
  DIVERGING_NEUTRAL,
  SEQUENTIAL_VIRIDIS,
  contrastText,
  divergingRamp,
  divergingScale,
  hexToRgb,
  lightnessOf,
  oklabToRgb,
  rgbToOklab,
  rampColour,
  sequentialScale,
} from './colour-scale'

describe('OKLab round trip', () => {
  it('returns the original colour within rounding', () => {
    for (const hex of ['#440154', '#21918C', '#FDE725', '#1F2023']) {
      const back = oklabToRgb(rgbToOklab(hexToRgb(hex)))
      const expected = hexToRgb(hex)
      back.forEach((v, i) => expect(Math.abs(v - expected[i])).toBeLessThanOrEqual(1))
    }
  })
})

describe('sequentialScale', () => {
  const scale = sequentialScale([0, 10])

  it('is monotone: lightness rises steadily from low to high', () => {
    const samples = Array.from({ length: 11 }, (_, i) => scale(i)) as string[]
    const lightness = samples.map(lightnessOf)
    for (let i = 1; i < lightness.length; i++) {
      expect(lightness[i]).toBeGreaterThanOrEqual(lightness[i - 1] - 1e-6)
    }
    expect(lightness[10]).toBeGreaterThan(lightness[0] + 0.5)
  })

  it('clamps values outside the domain to the end colours', () => {
    expect(scale(-100)).toBe(scale(0))
    expect(scale(100)).toBe(scale(10))
  })

  it('returns null for a missing value', () => {
    expect(scale(null)).toBeNull()
    expect(scale(Number.NaN)).toBeNull()
  })

  it('returns the first and last stop at the domain ends', () => {
    const lower = (s: string | null) => s?.toLowerCase()
    expect(lower(scale(0))).toBe(SEQUENTIAL_VIRIDIS[0].toLowerCase())
    expect(lower(scale(10))).toBe(SEQUENTIAL_VIRIDIS[SEQUENTIAL_VIRIDIS.length - 1].toLowerCase())
  })

  it('returns a mid colour for a degenerate domain instead of dividing by zero', () => {
    const flat = sequentialScale([5, 5])
    expect(flat(5)).toMatch(/^#[0-9a-f]{6}$/i)
  })

  it('gives valid hex output across the ramp', () => {
    for (let t = 0; t <= 1; t += 0.1) {
      expect(rampColour(SEQUENTIAL_VIRIDIS, t)).toMatch(/^#[0-9a-f]{6}$/i)
    }
  })
})

describe('divergingScale', () => {
  const scale = divergingScale([-1, 3], 0)

  it('is neutral at the midpoint', () => {
    expect(scale(0)).toBe(DIVERGING_NEUTRAL)
  })

  it('moves away from neutral in both directions', () => {
    expect(scale(-1)).not.toBe(DIVERGING_NEUTRAL)
    expect(scale(3)).not.toBe(DIVERGING_NEUTRAL)
    expect(scale(-1)).not.toBe(scale(3))
  })

  it('clamps and handles missing values like the sequential scale', () => {
    expect(scale(-50)).toBe(scale(-1))
    expect(scale(50)).toBe(scale(3))
    expect(scale(null)).toBeNull()
  })

  it('builds a legend ramp that runs neutral at the centre', () => {
    const ramp = divergingRamp()
    expect(ramp.length).toBeGreaterThan(3)
    expect(ramp[Math.floor(ramp.length / 2)]).toBe(DIVERGING_NEUTRAL)
  })
})

describe('contrastText', () => {
  it('uses dark ink on light fills', () => {
    expect(contrastText('#FDE725')).toBe('#1F2023')
    expect(contrastText('#FFFFFF')).toBe('#1F2023')
  })

  it('uses white on dark fills', () => {
    expect(contrastText('#440154')).toBe('#FFFFFF')
    expect(contrastText('#000000')).toBe('#FFFFFF')
  })
})
