import { describe, expect, it } from 'vitest'
import { AVOGADRO, EV_JOULES, PLANCK } from './constants'
import {
  emRegion,
  energyPerMole,
  frequencyFromWavelength,
  photonEnergyEv,
  photonEnergyJ,
  wavelengthFromFrequency,
  wavenumber,
} from './radiation'

// NCERT Class 11 Unit 2, Problem 2.4: violet 400 nm -> 7.50e14 Hz; red 750 nm -> 4.00e14 Hz
describe('frequency and wavelength (NCERT Problem 2.4)', () => {
  it('converts 400 nm to 7.50e14 Hz', () => {
    expect(frequencyFromWavelength(400e-9) / 1e14).toBeCloseTo(7.5, 2)
  })
  it('converts 750 nm to 4.00e14 Hz', () => {
    expect(frequencyFromWavelength(750e-9) / 1e14).toBeCloseTo(4.0, 2)
  })
  it('round-trips wavelength and frequency', () => {
    const lambda = wavelengthFromFrequency(5e14)
    expect(frequencyFromWavelength(lambda)).toBeCloseTo(5e14, -5)
  })
  it('rejects non-positive input', () => {
    expect(() => frequencyFromWavelength(0)).toThrow(RangeError)
    expect(() => wavelengthFromFrequency(-1)).toThrow(RangeError)
  })
})

// NCERT Problem 2.5: yellow light 5800 Å. The printed answer is not in the extracted text,
// so these values are computed from 1/λ and c/λ.
describe('wavenumber and frequency of 5800 Å (NCERT Problem 2.5)', () => {
  it('gives 1.7241e4 cm^-1 (1.7241e6 m^-1)', () => {
    expect(wavenumber(5800e-10) / 1e6).toBeCloseTo(1.7241, 4)
  })
  it('gives 5.17e14 Hz', () => {
    expect(frequencyFromWavelength(5800e-10) / 1e14).toBeCloseTo(5.1724, 3)
  })
})

// NCERT Problem 2.3: 1,368 kHz is a radio wave. The printed answer is not in the extracted text.
describe('radio wavelength (NCERT Problem 2.3)', () => {
  it('gives about 219.3 m for 1368 kHz', () => {
    expect(wavelengthFromFrequency(1368e3)).toBeCloseTo(219.3, 1)
  })
  it('classifies 1368 kHz as radio', () => {
    expect(emRegion(wavelengthFromFrequency(1368e3))).toBe('radio')
  })
})

// NCERT Problem 2.6: E of a 5e14 Hz photon = 3.313e-19 J; one mole = 199.51 kJ/mol
describe('photon energy (NCERT Problem 2.6)', () => {
  it('gives 3.313e-19 J for 5e14 Hz', () => {
    expect(photonEnergyJ(5e14) / 1e-19).toBeCloseTo(3.313, 3)
  })
  it('gives 199.51 kJ/mol for 5e14 Hz', () => {
    expect(energyPerMole(photonEnergyJ(5e14)) / 1e3).toBeCloseTo(199.51, 1)
  })
  it('accepts a wavelength option (300 nm gives 6.626e-19 J, NCERT Problem 2.8)', () => {
    expect(photonEnergyJ({ wavelengthM: 300e-9 }) / 1e-19).toBeCloseTo(6.626, 3)
  })
  it('accepts a frequency option', () => {
    expect(photonEnergyJ({ frequencyHz: 5e14 })).toBeCloseTo(PLANCK * 5e14, 25)
  })
  it('converts to eV using EV_JOULES', () => {
    expect(photonEnergyEv(5e14)).toBeCloseTo(photonEnergyJ(5e14) / EV_JOULES, 10)
  })
  it('rejects non-positive frequency', () => {
    expect(() => photonEnergyJ(0)).toThrow(RangeError)
  })
})

// NCERT Problem 2.7: 400 nm photon energy = 4.969e-19 J; 100 W bulb emits 2.012e20 photons/s
describe('400 nm photons (NCERT Problem 2.7)', () => {
  it('gives 4.969e-19 J', () => {
    expect(photonEnergyJ({ wavelengthM: 400e-9 }) / 1e-19).toBeCloseTo(4.969, 3)
  })
  it('gives 2.012e20 photons per second from a 100 W bulb', () => {
    const photonsPerSecond = 100 / photonEnergyJ({ wavelengthM: 400e-9 })
    expect(photonsPerSecond / 1e20).toBeCloseTo(2.012, 3)
  })
})

// NCERT Problem 2.10: the 5 -> 2 hydrogen transition gives 6.91e14 Hz (4.58e-19 J)
describe('Balmer 5 -> 2 emission (NCERT Problem 2.10)', () => {
  it('gives 4.58e-19 J and 6.91e14 Hz', () => {
    const energyJ = 2.18e-18 * (1 / 4 - 1 / 25)
    expect(energyJ / 1e-19).toBeCloseTo(4.58, 2)
    expect(energyJ / PLANCK / 1e14).toBeCloseTo(6.91, 2)
  })
})

describe('wavenumber', () => {
  it('is the reciprocal of wavelength in m^-1', () => {
    expect(wavenumber(2e-6)).toBeCloseTo(5e5, 6)
  })
  it('rejects non-positive wavelength', () => {
    expect(() => wavenumber(0)).toThrow(RangeError)
  })
})

describe('energyPerMole', () => {
  it('multiplies a per-photon energy by Avogadro constant', () => {
    expect(energyPerMole(1e-19)).toBeCloseTo(1e-19 * AVOGADRO, 10)
  })
})

describe('emRegion', () => {
  it('classifies representative wavelengths', () => {
    expect(emRegion(1e-12)).toBe('gamma')
    expect(emRegion(1e-10)).toBe('x-ray')
    expect(emRegion(200e-9)).toBe('ultraviolet')
    expect(emRegion(500e-9)).toBe('visible')
    expect(emRegion(10e-6)).toBe('infrared')
    expect(emRegion(1e-2)).toBe('microwave')
    expect(emRegion(10)).toBe('radio')
  })
  it('uses 380 nm and 750 nm as the visible boundaries', () => {
    expect(emRegion(379.9e-9)).toBe('ultraviolet')
    expect(emRegion(380e-9)).toBe('visible')
    expect(emRegion(750e-9)).toBe('visible')
    expect(emRegion(750.1e-9)).toBe('infrared')
  })
  it('rejects non-positive wavelength', () => {
    expect(() => emRegion(0)).toThrow(RangeError)
  })
})
