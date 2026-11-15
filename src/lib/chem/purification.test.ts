import { describe, expect, it } from 'vitest'
import {
  BENZENE_ANTOINE,
  TOLUENE_ANTOINE,
  WATER_ANTOINE_HIGH,
  fractionalDistillation,
  partitionExtraction,
  reducedPressureBoilingPoint,
  rf,
  steamDistillation,
  theoreticalPlates,
} from './purification'

describe('rf (NCERT 8.8.5)', () => {
  it('is the spot distance over the solvent-front distance', () => {
    expect(rf(3, 10)).toBeCloseTo(0.3, 10)
  })

  it('validates its inputs', () => {
    expect(() => rf(0, 10)).toThrow(RangeError)
    expect(() => rf(11, 10)).toThrow(RangeError)
    expect(() => rf(3, 0)).toThrow(RangeError)
  })
})

describe('fractionalDistillation (ideal Raoult mixture)', () => {
  it('boils at the pure liquid boiling point at x = 1 and x = 0', () => {
    const pureBenzene = fractionalDistillation(BENZENE_ANTOINE, TOLUENE_ANTOINE, 1)
    expect(pureBenzene.boilingPointC).toBeCloseTo(80.1, 0)
    const pureToluene = fractionalDistillation(BENZENE_ANTOINE, TOLUENE_ANTOINE, 0)
    expect(pureToluene.boilingPointC).toBeCloseTo(110.6, 0)
  })

  it('enriches the vapour in the more volatile liquid', () => {
    const mix = fractionalDistillation(BENZENE_ANTOINE, TOLUENE_ANTOINE, 0.5)
    expect(mix.boilingPointC).toBeGreaterThan(80.1)
    expect(mix.boilingPointC).toBeLessThan(110.6)
    expect(mix.vapourFractionA).toBeGreaterThan(0.5)
    expect(mix.boilingPointK).toBeCloseTo(mix.boilingPointC + 273.15, 6)
  })

  it('rejects a mole fraction outside 0 to 1', () => {
    expect(() => fractionalDistillation(BENZENE_ANTOINE, TOLUENE_ANTOINE, 1.2)).toThrow(RangeError)
  })
})

describe('theoreticalPlates', () => {
  it('is the column length over the height equivalent to a theoretical plate', () => {
    expect(theoreticalPlates(120, 10)).toBe(12)
  })

  it('rejects non-positive inputs', () => {
    expect(() => theoreticalPlates(0, 10)).toThrow(RangeError)
    expect(() => theoreticalPlates(120, 0)).toThrow(RangeError)
  })
})

describe('steamDistillation (NCERT 8.8.4)', () => {
  it('a water-immiscible organic liquid boils below 373 K with steam (toluene, about 357 K)', () => {
    const result = steamDistillation(WATER_ANTOINE_HIGH, TOLUENE_ANTOINE, 760)
    expect(result.boilingPointK).toBeLessThan(373.15)
    expect(result.boilingPointK).toBeGreaterThan(350)
  })
})

describe('reducedPressureBoilingPoint (Clausius-Clapeyron)', () => {
  it('returns the normal boiling point at 760 mmHg', () => {
    expect(reducedPressureBoilingPoint(373.15, 760, 40700)).toBeCloseTo(373.15, 6)
  })

  it('boils lower at reduced pressure', () => {
    const t = reducedPressureBoilingPoint(373.15, 20, 40700)
    expect(t).toBeLessThan(320)
    expect(t).toBeGreaterThan(280)
  })

  it('rejects non-positive pressures', () => {
    expect(() => reducedPressureBoilingPoint(373.15, 0, 40700)).toThrow(RangeError)
  })
})

describe('partitionExtraction (NCERT 8.8.4 differential extraction)', () => {
  it('leaves a fraction (V_aq / (V_aq + K V_org))^n after n extractions', () => {
    expect(partitionExtraction(5, 100, 50, 1)).toBeCloseTo(100 / 350, 10)
  })

  it('several small extractions beat one large one with the same total solvent', () => {
    const one = partitionExtraction(5, 100, 50, 1)
    const two = partitionExtraction(5, 100, 25, 2)
    expect(two).toBeLessThan(one)
  })

  it('rejects a non-integer or zero number of extractions', () => {
    expect(() => partitionExtraction(5, 100, 50, 0)).toThrow(RangeError)
    expect(() => partitionExtraction(5, 100, 50, 1.5)).toThrow(RangeError)
  })
})
