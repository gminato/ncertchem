import { describe, expect, it } from 'vitest'
import { ELECTRON_MASS_KG, EV_JOULES, PLANCK } from './constants'
import {
  WORK_FUNCTIONS_EV,
  electronsPerSecond,
  photoelectronKE,
  thresholdFrequency,
  thresholdWavelengthNm,
} from './photoelectric'

// NCERT Table 2.2 (work functions in eV)
describe('WORK_FUNCTIONS_EV (NCERT Table 2.2)', () => {
  it('matches the table exactly', () => {
    expect(WORK_FUNCTIONS_EV).toEqual({ Li: 2.42, Na: 2.3, K: 2.25, Mg: 3.7, Cu: 4.8, Ag: 4.3 })
  })
})

describe('thresholds', () => {
  it('threshold frequency is W0 / h', () => {
    expect(thresholdFrequency(2.3)).toBeCloseTo((2.3 * EV_JOULES) / PLANCK, -5)
  })
  it('threshold wavelength is c / nu0 in nm', () => {
    const nu0 = thresholdFrequency(2.3)
    expect(thresholdWavelengthNm(2.3)).toBeCloseTo((3.0e8 / nu0) * 1e9, 6)
  })
  it('rejects non-positive work function', () => {
    expect(() => thresholdFrequency(0)).toThrow(RangeError)
    expect(() => thresholdWavelengthNm(-1)).toThrow(RangeError)
  })
})

// NCERT Problem 2.9: nu0 = 7.0e14 s^-1, nu = 1.0e15 s^-1 -> KE = 1.988e-19 J
describe('photoelectron KE (NCERT Problem 2.9)', () => {
  const workFunctionEv = (PLANCK * 7.0e14) / EV_JOULES

  it('gives KE = 1.988e-19 J for nu = 1.0e15 Hz', () => {
    const r = photoelectronKE({ frequencyHz: 1.0e15, workFunctionEv })
    expect(r.emitted).toBe(true)
    expect(r.keJ / 1e-19).toBeCloseTo(1.988, 3)
  })
  it('reports KE in eV consistently with keJ', () => {
    const r = photoelectronKE({ frequencyHz: 1.0e15, workFunctionEv })
    expect(r.keEv).toBeCloseTo(r.keJ / EV_JOULES, 10)
  })
  it('gives speed sqrt(2 KE / m_e)', () => {
    const r = photoelectronKE({ frequencyHz: 1.0e15, workFunctionEv })
    expect(r.maxSpeedMs).toBeCloseTo(Math.sqrt((2 * r.keJ) / ELECTRON_MASS_KG), -2)
  })
  it('emits nothing below threshold', () => {
    const r = photoelectronKE({ frequencyHz: 5.0e14, workFunctionEv })
    expect(r.emitted).toBe(false)
    expect(r.keJ).toBe(0)
    expect(r.keEv).toBe(0)
    expect(r.maxSpeedMs).toBe(0)
  })
  it('accepts a wavelength in nm (300 nm on a 2.3 eV metal)', () => {
    // hc/λ = 6.626e-19 J at 300 nm
    const r = photoelectronKE({ wavelengthNm: 300, workFunctionEv: 2.3 })
    expect(r.emitted).toBe(true)
    expect(r.keJ).toBeCloseTo(6.626e-19 - 2.3 * EV_JOULES, 25)
  })
  it('rejects input with neither frequency nor wavelength', () => {
    expect(() => photoelectronKE({ workFunctionEv: 2.3 } as never)).toThrow(RangeError)
  })
})

// NCERT Problem 2.8 (sodium, 300 nm): 3.99e5 - 1.68e5 = 2.31e5 J/mol is the minimum energy
// per mole, which gives a threshold wavelength of about 517 nm in NCERT (518 nm computed).
describe('sodium threshold from NCERT Problem 2.8', () => {
  it('2.31e5 J/mol per electron gives a threshold within 1.5 nm of NCERT 517 nm', () => {
    const perElectronJ = 2.31e5 / 6.022e23
    const nm = ((PLANCK * 3.0e8) / perElectronJ) * 1e9
    expect(Math.abs(nm - 517)).toBeLessThan(1.5)
  })
})

describe('electronsPerSecond', () => {
  it('is zero when no emission happens', () => {
    expect(electronsPerSecond(1, false)).toBe(0)
  })
  it('scales linearly with relative intensity when emitted', () => {
    expect(electronsPerSecond(2, true)).toBeCloseTo(2 * electronsPerSecond(1, true), 6)
  })
  it('rejects negative intensity', () => {
    expect(() => electronsPerSecond(-1, true)).toThrow(RangeError)
  })
})
