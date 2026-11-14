import { describe, expect, it } from 'vitest'
import { ELEMENTS } from './elements'
import {
  empiricalFormula,
  formatFormula,
  massPercent,
  molarMass,
  molecularFormula,
  parseFormula,
} from './formula'

describe('ELEMENTS (NCERT Class 11 Unit 1 atomic masses)', () => {
  it('uses the NCERT atomic masses', () => {
    expect(ELEMENTS.H.atomicMass).toBe(1.008)
    expect(ELEMENTS.C.atomicMass).toBe(12.011)
    expect(ELEMENTS.O.atomicMass).toBe(16.0)
    expect(ELEMENTS.Na.atomicMass).toBe(23.0)
    expect(ELEMENTS.Cl.atomicMass).toBe(35.5)
    expect(ELEMENTS.Fe.atomicMass).toBe(55.85)
    expect(ELEMENTS.Ar.atomicMass).toBe(39.95)
  })

  it('is keyed by symbol with name and atomic number', () => {
    expect(ELEMENTS.Cl).toEqual({ symbol: 'Cl', name: 'Chlorine', atomicNumber: 17, atomicMass: 35.5 })
  })
})

describe('parseFormula', () => {
  it('parses simple formulas', () => {
    expect(parseFormula('H2O')).toEqual({ H: 2, O: 1 })
    expect(parseFormula('CO2')).toEqual({ C: 1, O: 2 })
    expect(parseFormula('NaCl')).toEqual({ Na: 1, Cl: 1 })
    expect(parseFormula('C6H12O6')).toEqual({ C: 6, H: 12, O: 6 })
  })

  it('expands parenthesised and bracketed groups', () => {
    expect(parseFormula('CH3COONa')).toEqual({ C: 2, H: 3, O: 2, Na: 1 })
    expect(parseFormula('Ca(OH)2')).toEqual({ Ca: 1, O: 2, H: 2 })
    expect(parseFormula('Al2(SO4)3')).toEqual({ Al: 2, S: 3, O: 12 })
    expect(parseFormula('Ca[Fe(CN)6]')).toEqual({ Ca: 1, Fe: 1, C: 6, N: 6 })
  })

  it('parses hydrates with a middle dot, a full stop or an asterisk', () => {
    const expected = { Cu: 1, S: 1, O: 9, H: 10 }
    expect(parseFormula('CuSO4·5H2O')).toEqual(expected)
    expect(parseFormula('CuSO4.5H2O')).toEqual(expected)
    expect(parseFormula('CuSO4*5H2O')).toEqual(expected)
  })

  it('throws RangeError on unknown element symbols', () => {
    expect(() => parseFormula('Xx2')).toThrow(RangeError)
    expect(() => parseFormula('Q')).toThrow(RangeError)
  })

  it('throws RangeError on malformed input', () => {
    expect(() => parseFormula('')).toThrow(RangeError)
    expect(() => parseFormula('h2o')).toThrow(RangeError)
    expect(() => parseFormula('H0')).toThrow(RangeError)
    expect(() => parseFormula('(H2O')).toThrow(RangeError)
    expect(() => parseFormula('H2O)')).toThrow(RangeError)
    expect(() => parseFormula('(H2]')).toThrow(RangeError)
    expect(() => parseFormula('2H2O')).toThrow(RangeError)
    expect(() => parseFormula('H2O·')).toThrow(RangeError)
    expect(() => parseFormula('H2 O')).toThrow(RangeError)
  })
})

describe('molarMass (NCERT worked examples)', () => {
  it('H2O ≈ 18.02 g/mol', () => {
    expect(Math.abs(molarMass('H2O') - 18.02)).toBeLessThanOrEqual(0.01)
  })

  it('NaCl = 58.5 g/mol (Na 23.0 + Cl 35.5)', () => {
    expect(molarMass('NaCl')).toBeCloseTo(58.5, 6)
  })

  it('C6H12O6 ≈ 180.16 g/mol (NCERT Problem 1.1)', () => {
    expect(Math.abs(molarMass('C6H12O6') - 180.16)).toBeLessThanOrEqual(0.01)
  })

  it('CH4 ≈ 16.043 g/mol', () => {
    expect(molarMass('CH4')).toBeCloseTo(16.043, 6)
  })
})

describe('massPercent (NCERT ethanol example)', () => {
  it('C2H5OH: C ≈ 52.14%, H ≈ 13.13%, O ≈ 34.73%', () => {
    const pct = massPercent('C2H5OH')
    expect(Math.abs(pct.C - 52.14)).toBeLessThanOrEqual(0.05)
    expect(Math.abs(pct.H - 13.13)).toBeLessThanOrEqual(0.05)
    expect(Math.abs(pct.O - 34.73)).toBeLessThanOrEqual(0.05)
  })

  it('percentages sum to 100', () => {
    const total = Object.values(massPercent('CuSO4·5H2O')).reduce((a, b) => a + b, 0)
    expect(total).toBeCloseTo(100, 9)
  })
})

describe('empiricalFormula', () => {
  it('NCERT Problem 1.2: H 4.07%, C 24.27%, Cl 71.65% gives CH2Cl', () => {
    const counts = empiricalFormula({ H: 4.07, C: 24.27, Cl: 71.65 })
    expect(counts).toEqual({ C: 1, H: 2, Cl: 1 })
    expect(formatFormula(counts)).toBe('CH2Cl')
  })

  it('a 1:1 mole ratio gives a 1:1 formula (NaCl)', () => {
    expect(empiricalFormula({ Na: 39.34, Cl: 60.66 })).toEqual({ Na: 1, Cl: 1 })
  })

  it('ratio near x.5 is doubled: C:O = 1:1.5 gives C2O3', () => {
    expect(empiricalFormula({ C: 33.36, O: 66.64 })).toEqual({ C: 2, O: 3 })
  })

  it('ratio near x.33 is tripled: C:H = 1:1.333 gives C3H4', () => {
    expect(empiricalFormula({ C: 89.94, H: 10.06 })).toEqual({ C: 3, H: 4 })
  })

  it('ratio near x.25 is quadrupled: C:O = 1:1.25 gives C4O5', () => {
    expect(empiricalFormula({ C: 37.52, O: 62.48 })).toEqual({ C: 4, O: 5 })
  })

  it('throws RangeError on unknown symbols or non-positive percentages', () => {
    expect(() => empiricalFormula({ Xx: 50, C: 50 })).toThrow(RangeError)
    expect(() => empiricalFormula({ C: 0, H: 100 })).toThrow(RangeError)
    expect(() => empiricalFormula({ C: -5, H: 100 })).toThrow(RangeError)
  })
})

describe('molecularFormula (NCERT Problem 1.2)', () => {
  it('CH2Cl with molar mass 98.96 g/mol gives C2H4Cl2', () => {
    const molecular = molecularFormula({ C: 1, H: 2, Cl: 1 }, 98.96)
    expect(molecular).toEqual({ C: 2, H: 4, Cl: 2 })
    expect(formatFormula(molecular)).toBe('C2H4Cl2')
  })

  it('throws RangeError when the molar mass is not a whole multiple', () => {
    expect(() => molecularFormula({ C: 1, H: 2, Cl: 1 }, 70)).toThrow(RangeError)
    expect(() => molecularFormula({ C: 1, H: 2, Cl: 1 }, 0)).toThrow(RangeError)
  })
})

describe('formatFormula (Hill-style order)', () => {
  it('puts C first, H second, then alphabetical, and omits counts of 1', () => {
    expect(formatFormula({ O: 1, H: 2 })).toBe('H2O')
    expect(formatFormula({ O: 2, Na: 1, C: 2, H: 3 })).toBe('C2H3NaO2')
    expect(formatFormula({ Cl: 1, H: 1 })).toBe('HCl')
    expect(formatFormula({ O: 1, Cl: 1, C: 1 })).toBe('CClO')
  })

  it('throws RangeError on non-positive or non-integer counts', () => {
    expect(() => formatFormula({ H: 0 })).toThrow(RangeError)
    expect(() => formatFormula({ H: 1.5 })).toThrow(RangeError)
  })
})
