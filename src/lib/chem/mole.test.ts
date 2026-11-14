import { describe, expect, it } from 'vitest'
import { AMU_GRAMS, AVOGADRO } from './constants'
import {
  dilutionVolume,
  massToMoles,
  molality,
  molarity,
  moleFraction,
  molesToMass,
  molesToParticles,
  particlesToMoles,
} from './mole'

describe('Avogadro and atomic mass unit constants', () => {
  it('uses NCERT value 6.022e23 and the amu conversion', () => {
    expect(AVOGADRO).toBe(6.022e23)
    expect(AMU_GRAMS).toBe(1.66056e-24)
  })
})

describe('mass <-> moles', () => {
  it('16 g of CH4 is one mole (molar mass 16.043 g/mol, NCERT Problem 1.3)', () => {
    expect(massToMoles(16.043, 'CH4')).toBeCloseTo(1, 6)
  })

  it('2 mol of H2O is 36 g (NCERT Problem 1.3)', () => {
    expect(molesToMass(2, 'H2O')).toBeCloseTo(36.032, 3)
  })

  it('moles and mass are inverses', () => {
    expect(massToMoles(molesToMass(0.5, 'NaCl'), 'NaCl')).toBeCloseTo(0.5, 12)
  })

  it('rejects negative masses and invalid formulas', () => {
    expect(() => massToMoles(-1, 'H2O')).toThrow(RangeError)
    expect(() => massToMoles(1, 'Xx')).toThrow(RangeError)
    expect(() => molesToMass(-1, 'H2O')).toThrow(RangeError)
  })
})

describe('particles <-> moles', () => {
  it('one mole is 6.022e23 particles', () => {
    expect(molesToParticles(1)).toBe(6.022e23)
    expect(particlesToMoles(6.022e23)).toBeCloseTo(1, 12)
  })

  it('rejects negative inputs', () => {
    expect(() => molesToParticles(-1)).toThrow(RangeError)
    expect(() => particlesToMoles(-1)).toThrow(RangeError)
  })
})

describe('concentration', () => {
  it('molarity: 4 g NaOH in 250 mL is 0.4 M (NCERT Problem 1.7)', () => {
    const moles = massToMoles(4, 'NaOH')
    expect(Math.abs(molarity(moles, 0.25) - 0.4)).toBeLessThanOrEqual(0.001)
  })

  it('molarity rejects zero or negative volume', () => {
    expect(() => molarity(1, 0)).toThrow(RangeError)
    expect(() => molarity(1, -1)).toThrow(RangeError)
  })

  it('molality: 3 mol NaCl in 1.0745 kg water is 2.79 m (NCERT Problem 1.8)', () => {
    expect(Math.abs(molality(3, 1.0745) - 2.79)).toBeLessThanOrEqual(0.005)
  })

  it('molality rejects zero solvent mass', () => {
    expect(() => molality(1, 0)).toThrow(RangeError)
  })

  it('mole fraction', () => {
    expect(moleFraction(1, 4)).toBe(0.25)
    expect(() => moleFraction(5, 4)).toThrow(RangeError)
    expect(() => moleFraction(1, 0)).toThrow(RangeError)
  })

  it('dilution: M1V1 = M2V2 (200 mL of 1 M diluted to 0.2 M gives 1000 mL)', () => {
    expect(dilutionVolume(1.0, 200, 0.2)).toBeCloseTo(1000, 9)
    expect(dilutionVolume(2, 50, 0.5)).toBeCloseTo(200, 9)
  })

  it('dilution rejects a zero target molarity', () => {
    expect(() => dilutionVolume(1, 100, 0)).toThrow(RangeError)
  })
})
