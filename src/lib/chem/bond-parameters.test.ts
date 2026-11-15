import { describe, expect, it } from 'vitest'
import { lewisStructure } from './lewis'
import {
  bondOrderFromLewis,
  covalentRadius,
  estimateBondLength,
  resonanceAverageBondOrder,
} from './bond-parameters'

describe('covalentRadius (Table 4.4)', () => {
  it('returns the printed single-bond radii', () => {
    expect(covalentRadius('H')).toBe(37)
    expect(covalentRadius('Cl')).toBe(99)
    expect(covalentRadius('S')).toBe(104)
  })

  it('returns the parenthesised multiple-bond radii', () => {
    expect(covalentRadius('C', 2)).toBe(67)
    expect(covalentRadius('C', 3)).toBe(60)
    expect(covalentRadius('N', 3)).toBe(55)
  })

  it('throws RangeError when Table 4.4 has no entry for that order', () => {
    expect(() => covalentRadius('Cl', 2)).toThrow(RangeError)
    expect(() => covalentRadius('Xx')).toThrow(RangeError)
  })
})

describe('estimateBondLength', () => {
  it('reproduces the printed Table 4.3 H2 and N2 lengths within 1 pm', () => {
    expect(Math.abs(estimateBondLength('H', 'H', 1) - 74)).toBeLessThanOrEqual(1)
    expect(Math.abs(estimateBondLength('N', 'N', 3) - 109)).toBeLessThanOrEqual(1)
  })

  it('reproduces the printed C–C, C=C and C≡C lengths of Table 4.2 within 1 pm', () => {
    expect(Math.abs(estimateBondLength('C', 'C', 1) - 154)).toBeLessThanOrEqual(1)
    expect(Math.abs(estimateBondLength('C', 'C', 2) - 133)).toBeLessThanOrEqual(1)
    expect(estimateBondLength('C', 'C', 3)).toBe(120)
  })

  it('overestimates F–F (lone-pair repulsion lengthens it) and O–H (table uses a different set)', () => {
    expect(estimateBondLength('F', 'F', 1)).toBe(128)
    expect(estimateBondLength('F', 'F', 1)).toBeLessThan(144)
    expect(estimateBondLength('O', 'H', 1)).toBe(103)
    expect(estimateBondLength('O', 'H', 1)).toBeGreaterThan(96)
  })

  it('rejects an order with no radius', () => {
    expect(() => estimateBondLength('Cl', 'Cl', 2)).toThrow(RangeError)
  })
})

describe('bondOrderFromLewis', () => {
  it('reads the bond orders of N2, CO2 and CO from their structures', () => {
    expect(bondOrderFromLewis(lewisStructure('N2'), 0, 1)).toBe(3)
    expect(bondOrderFromLewis(lewisStructure('CO2'), 0, 1)).toBe(2)
    expect(bondOrderFromLewis(lewisStructure('CO'), 0, 1)).toBe(3)
  })

  it('returns zero for atoms that are not bonded', () => {
    expect(bondOrderFromLewis(lewisStructure('C2H2'), 0, 3)).toBe(0)
  })
})

describe('resonanceAverageBondOrder', () => {
  it('gives 1.5 for O3, as NCERT states', () => {
    expect(resonanceAverageBondOrder('O3')).toBe(1.5)
  })

  it('gives 4/3 (printed 1.33) for CO3²⁻ and NO3⁻', () => {
    expect(resonanceAverageBondOrder('CO3²⁻')).toBeCloseTo(4 / 3, 10)
    expect(resonanceAverageBondOrder('NO3⁻')).toBeCloseTo(1.33, 2)
  })
})
