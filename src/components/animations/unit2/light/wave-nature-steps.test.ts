import { describe, it, expect } from 'vitest'
import {
  BAND_MAX_M,
  BAND_MIN_M,
  bandFraction,
  clampWaveStep,
  emRegionSpans,
  wavelengthFacts,
  waveStepDescription,
} from './wave-nature-steps'

describe('clampWaveStep', () => {
  it('keeps the step inside 0 to 3', () => {
    expect(clampWaveStep(-2)).toBe(0)
    expect(clampWaveStep(9)).toBe(3)
    expect(clampWaveStep(Number.NaN)).toBe(0)
  })
})

describe('emRegionSpans', () => {
  const spans = emRegionSpans()
  const find = (region: string) => spans.find((s) => s.region === region)

  it('covers the whole band in order, with no gaps', () => {
    expect(spans[0].startM).toBeCloseTo(BAND_MIN_M, 20)
    expect(spans[spans.length - 1].endM).toBeCloseTo(BAND_MAX_M, 0)
    for (let i = 1; i < spans.length; i++) {
      expect(spans[i].startM).toBeCloseTo(spans[i - 1].endM, 12)
    }
  })

  it('puts the visible boundaries at 380 nm and 750 nm', () => {
    const visible = find('visible')
    expect(visible).toBeDefined()
    expect(visible!.startM * 1e9).toBeCloseTo(380, 3)
    expect(visible!.endM * 1e9).toBeCloseTo(750, 3)
  })

  it('lists the seven regions from gamma to radio', () => {
    expect(spans.map((s) => s.region)).toEqual([
      'gamma',
      'x-ray',
      'ultraviolet',
      'visible',
      'infrared',
      'microwave',
      'radio',
    ])
  })
})

describe('bandFraction', () => {
  it('runs from 0 at 1 pm to 1 at 1 km', () => {
    expect(bandFraction(BAND_MIN_M)).toBeCloseTo(0, 12)
    expect(bandFraction(BAND_MAX_M)).toBeCloseTo(1, 12)
  })
})

describe('wavelengthFacts', () => {
  it('gives ν = c/λ and the wavenumber in cm⁻¹ for 500 nm', () => {
    const f = wavelengthFacts(500)
    expect(f.frequencyHz / 1e14).toBeCloseTo(6, 9)
    expect(f.wavenumberPerCm / 1e4).toBeCloseTo(2, 9)
    expect(f.region).toBe('visible')
  })

  it('gives the visible frequency limits quoted in NCERT (about 4.0 to 7.5 × 10¹⁴ Hz)', () => {
    expect(wavelengthFacts(750).frequencyHz / 1e14).toBeCloseTo(4, 9)
    expect(wavelengthFacts(400).frequencyHz / 1e14).toBeCloseTo(7.5, 9)
  })
})

describe('waveStepDescription', () => {
  it('quotes the frequency at 500 nm with the ×10 notation', () => {
    expect(waveStepDescription(1)).toContain('6.00 × 10¹⁴ Hz')
  })
})
