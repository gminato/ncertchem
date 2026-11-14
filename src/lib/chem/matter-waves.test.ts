import { describe, expect, it } from 'vitest'
import { PLANCK } from './constants'
import { deBroglieWavelength, uncertaintyMinDeltaV, uncertaintyMinDeltaX } from './matter-waves'

// NCERT Problem 2.12: 0.1 kg at 10 m/s -> 6.626e-34 m
describe('de Broglie wavelength (NCERT Problem 2.12)', () => {
  it('gives 6.626e-34 m for a 0.1 kg ball at 10 m/s', () => {
    expect(deBroglieWavelength(0.1, 10) / 1e-34).toBeCloseTo(6.626, 3)
  })
  it('rejects non-positive mass or speed', () => {
    expect(() => deBroglieWavelength(0, 10)).toThrow(RangeError)
    expect(() => deBroglieWavelength(0.1, -1)).toThrow(RangeError)
  })
})

// NCERT Problem 2.13: electron with KE 3.0e-25 J -> v = 812 m/s, lambda = 896.7 nm.
// NCERT prints "8967 x 10^-10 m"; the arithmetic gives 8.967 x 10^-7 m = 896.7 nm.
describe('electron wavelength (NCERT Problem 2.13)', () => {
  const mass = 9.1e-31
  const speed = Math.sqrt((2 * 3.0e-25) / mass)

  it('gives v = 812 m/s', () => {
    expect(speed).toBeCloseTo(812, 0)
  })
  it('gives 896.7 nm', () => {
    expect(deBroglieWavelength(mass, speed) * 1e9).toBeCloseTo(896.7, 1)
  })
})

// NCERT Problem 2.14: a photon of wavelength 3.6 Å has mass m = h / (λ c).
// NCERT prints "6.135 × 10⁻²⁹ kg", but h / (λ c) = 6.626e-34 / (3.6e-10 × 3e8) = 6.135e-33 kg.
// The test asserts the arithmetic value; the printed exponent in NCERT appears to be a typo.
describe('photon mass (NCERT Problem 2.14)', () => {
  it('gives 6.135e-33 kg (arithmetic; NCERT prints 10^-29)', () => {
    const photonMass = PLANCK / (3.6e-10 * 3.0e8)
    expect(photonMass / 1e-33).toBeCloseTo(6.135, 3)
  })
})

// NCERT Problem 2.15: electron located within 0.1 Å -> delta v = 5.79e6 m/s
describe('uncertainty principle (NCERT Problem 2.15)', () => {
  it('gives delta v = 5.79e6 m/s for delta x = 1e-11 m', () => {
    expect(uncertaintyMinDeltaV(9.11e-31, 1e-11) / 1e6).toBeCloseTo(5.79, 2)
  })
  it('satisfies delta x * delta p = h / 4 pi at the minimum', () => {
    const dv = uncertaintyMinDeltaV(9.11e-31, 1e-11)
    expect((1e-11 * 9.11e-31 * dv) / (PLANCK / (4 * Math.PI))).toBeCloseTo(1, 10)
  })
})

// NCERT Problem 2.16: golf ball 40 g, speed 45 m/s, accuracy 2% -> delta x = 1.46e-33 m
describe('golf ball (NCERT Problem 2.16)', () => {
  it('gives delta x = 1.46e-33 m', () => {
    const dv = 0.02 * 45
    expect(uncertaintyMinDeltaX(0.04, dv) / 1e-33).toBeCloseTo(1.46, 2)
  })
})

// NCERT's 1 mg example: for a milligram object, the velocity uncertainty is negligible,
// while for an electron at the same position uncertainty it is large.
describe('1 mg object versus electron at delta x = 1e-8 m', () => {
  it('the 1 mg object has a velocity uncertainty about 1e-27 times that of the electron', () => {
    const dvMg = uncertaintyMinDeltaV(1e-6, 1e-8)
    const dvElectron = uncertaintyMinDeltaV(9.11e-31, 1e-8)
    expect(dvElectron / dvMg).toBeCloseTo(1e-6 / 9.11e-31, -20)
    expect(dvElectron).toBeGreaterThan(1e3)
    expect(dvMg).toBeLessThan(1e-20)
  })
})

describe('inverse relations and validation', () => {
  it('uncertaintyMinDeltaX inverts uncertaintyMinDeltaV', () => {
    const dv = uncertaintyMinDeltaV(9.11e-31, 1e-10)
    expect(uncertaintyMinDeltaX(9.11e-31, dv)).toBeCloseTo(1e-10, 15)
  })
  it('rejects non-positive inputs', () => {
    expect(() => uncertaintyMinDeltaV(1, 0)).toThrow(RangeError)
    expect(() => uncertaintyMinDeltaX(0, 1)).toThrow(RangeError)
  })
})
