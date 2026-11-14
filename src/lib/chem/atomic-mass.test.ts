import { describe, expect, it } from 'vitest'
import { AMU_GRAMS } from './constants'
import {
  CHLORINE_ISOTOPES,
  averageAtomicMass,
  fractionAcrossIsotopes,
  massOfAtomGrams,
  sumAtomicMasses,
} from './atomic-mass'
import { molarMass } from './formula'

describe('averageAtomicMass (chlorine, NCERT Exercise 1.9)', () => {
  it('weights the two isotopes by their abundance', () => {
    const expected = 0.7577 * 34.9689 + 0.2423 * 36.9659
    expect(averageAtomicMass(CHLORINE_ISOTOPES)).toBeCloseTo(expected, 10)
  })

  it('gives 35.45 u to two decimal places', () => {
    expect(averageAtomicMass(CHLORINE_ISOTOPES).toFixed(2)).toBe('35.45')
  })

  it('lies between the lightest and heaviest isotope', () => {
    const avg = averageAtomicMass(CHLORINE_ISOTOPES)
    expect(avg).toBeGreaterThan(34.9689)
    expect(avg).toBeLessThan(36.9659)
  })

  it('rejects abundances that do not add up to 100 per cent', () => {
    expect(() =>
      averageAtomicMass([
        { label: 'a', massU: 1, abundancePercent: 50 },
        { label: 'b', massU: 2, abundancePercent: 40 },
      ])
    ).toThrow(RangeError)
  })

  it('rejects an empty list and non-positive masses', () => {
    expect(() => averageAtomicMass([])).toThrow(RangeError)
    expect(() => averageAtomicMass([{ label: 'x', massU: 0, abundancePercent: 100 }])).toThrow(RangeError)
  })
})

describe('fractionAcrossIsotopes', () => {
  it('places the average at about 0.24 of the way from 35Cl to 37Cl', () => {
    const avg = averageAtomicMass(CHLORINE_ISOTOPES)
    expect(fractionAcrossIsotopes(CHLORINE_ISOTOPES, avg)).toBeCloseTo(0.2423, 3)
  })
})

describe('mass of one atom', () => {
  it('converts u to grams with 1 u = 1.66056 × 10⁻²⁴ g', () => {
    expect(AMU_GRAMS).toBe(1.66056e-24)
    expect(massOfAtomGrams(1)).toBeCloseTo(1.66056e-24, 30)
  })

  it('gives about 5.81 × 10⁻²³ g for one 35Cl atom', () => {
    expect(massOfAtomGrams(34.9689) / 1e-23).toBeCloseTo(5.807, 3)
  })
})

describe('sumAtomicMasses', () => {
  it('summing every atom of CH4 gives molarMass("CH4") = 16.043', () => {
    const atoms = ['C', 'H', 'H', 'H', 'H']
    expect(sumAtomicMasses(atoms)).toBeCloseTo(molarMass('CH4'), 10)
    expect(sumAtomicMasses(atoms).toFixed(3)).toBe('16.043')
  })

  it('summing H2O atoms gives 18.016 and NaCl gives 58.5', () => {
    expect(sumAtomicMasses(['O', 'H', 'H'])).toBeCloseTo(molarMass('H2O'), 10)
    expect(sumAtomicMasses(['Na', 'Cl'])).toBeCloseTo(58.5, 10)
  })

  it('throws on an unknown symbol', () => {
    expect(() => sumAtomicMasses(['Xx'])).toThrow(RangeError)
  })
})
