import { describe, expect, it } from 'vitest'
import {
  COEXISTENCE_HALF_WIDTH_C,
  REFERENCE_TEMPERATURE_K,
  celsiusToKelvin,
  speedScale,
  waterPhaseFractions,
  waterStateAt,
} from './states'

describe('celsiusToKelvin', () => {
  it('adds 273.15', () => {
    expect(celsiusToKelvin(0)).toBeCloseTo(273.15, 10)
    expect(celsiusToKelvin(100)).toBeCloseTo(373.15, 10)
    expect(celsiusToKelvin(-273.15)).toBeCloseTo(0, 10)
  })

  it('rejects non-finite input', () => {
    expect(() => celsiusToKelvin(Number.NaN)).toThrow(RangeError)
    expect(() => celsiusToKelvin(Number.POSITIVE_INFINITY)).toThrow(RangeError)
  })
})

describe('waterStateAt', () => {
  it('names the single phase well away from 0 °C and 100 °C', () => {
    expect(waterStateAt(-50)).toBe('solid')
    expect(waterStateAt(-10)).toBe('solid')
    expect(waterStateAt(25)).toBe('liquid')
    expect(waterStateAt(60)).toBe('liquid')
    expect(waterStateAt(120)).toBe('gas')
    expect(waterStateAt(150)).toBe('gas')
  })

  it('names the coexistence bands at 0 °C and 100 °C', () => {
    expect(waterStateAt(0)).toBe('melting')
    expect(waterStateAt(-COEXISTENCE_HALF_WIDTH_C + 0.5)).toBe('melting')
    expect(waterStateAt(100)).toBe('boiling')
    expect(waterStateAt(100 + COEXISTENCE_HALF_WIDTH_C - 0.5)).toBe('boiling')
  })

  it('switches to the single phase at the edge of each band', () => {
    expect(waterStateAt(-COEXISTENCE_HALF_WIDTH_C)).toBe('solid')
    expect(waterStateAt(COEXISTENCE_HALF_WIDTH_C)).toBe('liquid')
    expect(waterStateAt(100 - COEXISTENCE_HALF_WIDTH_C)).toBe('liquid')
    expect(waterStateAt(100 + COEXISTENCE_HALF_WIDTH_C)).toBe('gas')
  })
})

describe('waterPhaseFractions', () => {
  it('is pure solid below the melting band, pure liquid between, pure gas above the boiling band', () => {
    expect(waterPhaseFractions(-30)).toEqual({ solid: 1, liquid: 0, gas: 0 })
    expect(waterPhaseFractions(40)).toEqual({ solid: 0, liquid: 1, gas: 0 })
    expect(waterPhaseFractions(130)).toEqual({ solid: 0, liquid: 0, gas: 1 })
  })

  it('splits evenly at the centre of the melting band and of the boiling band', () => {
    const melt = waterPhaseFractions(0)
    expect(melt.solid).toBeCloseTo(0.5, 10)
    expect(melt.liquid).toBeCloseTo(0.5, 10)
    const boil = waterPhaseFractions(100)
    expect(boil.liquid).toBeCloseTo(0.5, 10)
    expect(boil.gas).toBeCloseTo(0.5, 10)
  })

  it('always sums to 1 with no negative share, across the whole range', () => {
    for (let t = -50; t <= 150; t += 0.25) {
      const f = waterPhaseFractions(t)
      expect(f.solid).toBeGreaterThanOrEqual(0)
      expect(f.liquid).toBeGreaterThanOrEqual(0)
      expect(f.gas).toBeGreaterThanOrEqual(0)
      expect(f.solid + f.liquid + f.gas).toBeCloseTo(1, 10)
    }
  })

  it('changes smoothly: the solid share never rises as temperature rises', () => {
    let previous = 1
    for (let t = -50; t <= 150; t += 0.1) {
      const { solid } = waterPhaseFractions(t)
      expect(solid).toBeLessThanOrEqual(previous + 1e-12)
      previous = solid
    }
  })

  it('rejects non-finite input', () => {
    expect(() => waterPhaseFractions(Number.NaN)).toThrow(RangeError)
  })
})

describe('speedScale', () => {
  it('is exactly 1 at the reference temperature of 25 °C', () => {
    expect(REFERENCE_TEMPERATURE_K).toBeCloseTo(298.15, 10)
    expect(speedScale(25)).toBeCloseTo(1, 12)
  })

  it('scales with the square root of the kelvin temperature', () => {
    const t1 = -50
    const t2 = 150
    const ratio = speedScale(t2) / speedScale(t1)
    expect(ratio).toBeCloseTo(Math.sqrt(celsiusToKelvin(t2) / celsiusToKelvin(t1)), 12)
  })

  it('is about 0.865 at -50 °C and about 1.191 at 150 °C', () => {
    expect(speedScale(-50)).toBeCloseTo(0.8652, 3)
    expect(speedScale(150)).toBeCloseTo(1.1913, 3)
  })

  it('rejects temperatures at or below absolute zero', () => {
    expect(() => speedScale(-273.15)).toThrow(RangeError)
    expect(() => speedScale(-300)).toThrow(RangeError)
  })
})
