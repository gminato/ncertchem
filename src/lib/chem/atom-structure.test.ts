import { describe, expect, it } from 'vitest'
import { ELEMENTS } from './elements'
import { ELEMENT_NAMES_Z, areIsobars, areIsotopes, nucleons } from './atom-structure'

// NCERT Problem 2.1: 80 35Br has 35 protons, 45 neutrons, 35 electrons
describe('nucleons (NCERT Problem 2.1)', () => {
  it('gives 35 protons, 45 neutrons and 35 electrons for 80Br', () => {
    expect(nucleons(35, 80)).toEqual({ protons: 35, neutrons: 45, electrons: 35 })
  })
})

// NCERT Problem 2.2: 18 electrons, 16 protons, 16 neutrons -> S (mass 32) with charge -2
describe('nucleons with charge (NCERT Problem 2.2)', () => {
  it('gives 18 electrons for a 2- ion of 16 protons and 16 neutrons', () => {
    expect(nucleons(16, 32, -2)).toEqual({ protons: 16, neutrons: 16, electrons: 18 })
  })
  it('gives 10 electrons for a 1+ ion (Z = 11, charge +1)', () => {
    expect(nucleons(11, 23, 1).electrons).toBe(10)
  })
})

describe('nucleons validation', () => {
  it('rejects non-integer or non-positive Z', () => {
    expect(() => nucleons(0, 1)).toThrow(RangeError)
    expect(() => nucleons(1.5, 3)).toThrow(RangeError)
  })
  it('rejects A smaller than Z', () => {
    expect(() => nucleons(6, 5)).toThrow(RangeError)
  })
  it('rejects non-integer charge', () => {
    expect(() => nucleons(6, 12, 0.5)).toThrow(RangeError)
  })
})

describe('isotopes and isobars', () => {
  const C12 = { Z: 6, A: 12 }
  const C14 = { Z: 6, A: 14 }
  const N14 = { Z: 7, A: 14 }
  it('same Z and different A are isotopes', () => {
    expect(areIsotopes(C12, C14)).toBe(true)
  })
  it('same A and different Z are isobars', () => {
    expect(areIsobars(C14, N14)).toBe(true)
  })
  it('the same nuclide is neither', () => {
    expect(areIsotopes(C12, C12)).toBe(false)
    expect(areIsobars(C12, C12)).toBe(false)
  })
  it('unrelated nuclides are neither', () => {
    expect(areIsotopes(C12, N14)).toBe(false)
    expect(areIsobars(C12, C14)).toBe(false)
  })
})

describe('ELEMENT_NAMES_Z', () => {
  it('covers Z = 1 to 36 with a symbol and name each', () => {
    for (let z = 1; z <= 36; z++) {
      expect(ELEMENT_NAMES_Z[z]).toBeDefined()
      expect(ELEMENT_NAMES_Z[z].symbol.length).toBeGreaterThan(0)
      expect(ELEMENT_NAMES_Z[z].name.length).toBeGreaterThan(0)
    }
  })
  it('gives the NCERT symbols for key elements', () => {
    expect(ELEMENT_NAMES_Z[1].symbol).toBe('H')
    expect(ELEMENT_NAMES_Z[19].symbol).toBe('K')
    expect(ELEMENT_NAMES_Z[24].symbol).toBe('Cr')
    expect(ELEMENT_NAMES_Z[29].symbol).toBe('Cu')
    expect(ELEMENT_NAMES_Z[36].symbol).toBe('Kr')
  })
  it('agrees with the ELEMENTS table wherever the two overlap', () => {
    for (const el of Object.values(ELEMENTS)) {
      if (el.atomicNumber > 36) continue // ELEMENT_NAMES_Z covers Z = 1 to 36 only
      expect(ELEMENT_NAMES_Z[el.atomicNumber].symbol).toBe(el.symbol)
    }
  })
})
