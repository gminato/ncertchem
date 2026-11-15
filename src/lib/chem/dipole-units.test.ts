import { describe, expect, it } from 'vitest'
import { DEBYE_IN_CM, NCERT_PRINTED_SI_DIPOLES, debyeToCm, printedSiDipole } from './dipole-units'

describe('dipole units', () => {
  it('uses the NCERT conversion factor', () => {
    expect(DEBYE_IN_CM).toBe(3.33564e-30)
    expect(debyeToCm(1)).toBeCloseTo(3.33564e-30, 36)
  })

  it('reproduces the water value NCERT prints in coulomb metres', () => {
    // 1.85 D = 6.17 × 10⁻³⁰ C m (book p. 111).
    expect((debyeToCm(1.85) / 1e-30).toFixed(2)).toBe('6.17')
    expect(NCERT_PRINTED_SI_DIPOLES.H2O).toBe(6.17)
  })

  it('reproduces the NH3 value to rounding, 1.47 D = 4.90 × 10⁻³⁰ C m', () => {
    expect((debyeToCm(1.47) / 1e-30).toFixed(2)).toBe('4.90')
  })

  it('formats only the molecules NCERT prints in SI', () => {
    expect(printedSiDipole('H2O')).toBe('6.17 × 10⁻³⁰ C m')
    expect(printedSiDipole('NH3')).toBe('4.90 × 10⁻³⁰ C m')
    expect(printedSiDipole('NF3')).toBe('0.80 × 10⁻³⁰ C m')
    expect(printedSiDipole('CO2')).toBeNull()
  })
})
