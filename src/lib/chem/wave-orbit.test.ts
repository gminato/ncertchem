import { describe, expect, it } from 'vitest'
import {
  deBroglieOnOrbitPm,
  orbitCircumferencePm,
  orbitSpeedMs,
  photonMomentum,
  waveClosesOnItself,
} from './wave-orbit'

describe('orbitSpeedMs', () => {
  it('gives about 2.19 × 10⁶ m/s for the first Bohr orbit', () => {
    expect(orbitSpeedMs(1) / 1e6).toBeCloseTo(2.19, 2)
  })
  it('falls as 1/n', () => {
    expect(orbitSpeedMs(2) / orbitSpeedMs(1)).toBeCloseTo(0.5, 10)
  })
})

describe('de Broglie wavelength on a Bohr orbit', () => {
  it('equals the circumference divided by n, for every orbit', () => {
    for (const n of [1, 2, 3, 4]) {
      expect(deBroglieOnOrbitPm(n)).toBeCloseTo(orbitCircumferencePm(n) / n, 6)
    }
  })
  it('is 332.5 pm for n = 1 (2π × 52.9 pm)', () => {
    expect(deBroglieOnOrbitPm(1)).toBeCloseTo(332.3, 0)
  })
})

describe('waveClosesOnItself', () => {
  it('closes for whole numbers of wavelengths', () => {
    expect(waveClosesOnItself(1)).toBe(true)
    expect(waveClosesOnItself(2)).toBe(true)
    expect(waveClosesOnItself(4)).toBe(true)
  })
  it('does not close for 3.5 wavelengths', () => {
    expect(waveClosesOnItself(3.5)).toBe(false)
  })
  it('rejects non-positive counts', () => {
    expect(() => waveClosesOnItself(0)).toThrow(RangeError)
  })
})

describe('photonMomentum', () => {
  it('gives 9.47 × 10⁻²⁸ kg m s⁻¹ for red light at 700 nm', () => {
    expect(photonMomentum(700e-9) / 1e-28).toBeCloseTo(9.466, 3)
  })
  it('is 1000 times larger at 0.7 nm than at 700 nm', () => {
    expect(photonMomentum(0.7e-9) / photonMomentum(700e-9)).toBeCloseTo(1000, 6)
  })
})
