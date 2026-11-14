import { describe, expect, it } from 'vitest'
import {
  countSigFigs,
  decimalPlacesForSum,
  roundToSigFigs,
  sigFigsForProduct,
  toScientific,
} from './sigfigs'

describe('countSigFigs (NCERT 1.4.2 rules)', () => {
  it('leading zeros are not significant', () => {
    expect(countSigFigs('0.0025')).toBe(2)
    expect(countSigFigs('0.03')).toBe(1)
    expect(countSigFigs('0.0052')).toBe(2)
  })

  it('zeros between non-zero digits are significant', () => {
    expect(countSigFigs('2.005')).toBe(4)
    expect(countSigFigs('285')).toBe(3)
  })

  it('trailing zeros after a decimal point are significant', () => {
    expect(countSigFigs('2.500')).toBe(4)
    expect(countSigFigs('0.200')).toBe(3)
  })

  it('trailing zeros with no decimal point are not significant (NCERT: 100 has one)', () => {
    expect(countSigFigs('100')).toBe(1)
  })

  it('a trailing decimal point makes trailing zeros significant (100. has three)', () => {
    expect(countSigFigs('100.')).toBe(3)
  })

  it('scientific notation counts only the mantissa', () => {
    expect(countSigFigs('2.0e3')).toBe(2)
    expect(countSigFigs('2.0×10³')).toBe(2)
    expect(countSigFigs('2.0×10^3')).toBe(2)
    expect(countSigFigs('8.256×10-3')).toBe(4)
    expect(countSigFigs('4.01×10^2')).toBe(3)
  })

  it('throws RangeError on malformed input', () => {
    expect(() => countSigFigs('')).toThrow(RangeError)
    expect(() => countSigFigs('abc')).toThrow(RangeError)
    expect(() => countSigFigs('1.2.3')).toThrow(RangeError)
  })
})

describe('roundToSigFigs (NCERT round-half-even rule)', () => {
  it('rounds up when the first removed digit is greater than 5 (1.386 -> 1.39)', () => {
    expect(roundToSigFigs(1.386, 3)).toBe('1.39')
  })

  it('rounds down when the first removed digit is less than 5 (4.334 -> 4.33)', () => {
    expect(roundToSigFigs(4.334, 3)).toBe('4.33')
  })

  it('a removed 5 rounds to the even digit: 6.35 -> 6.4, 6.25 -> 6.2', () => {
    expect(roundToSigFigs(6.35, 2)).toBe('6.4')
    expect(roundToSigFigs(6.25, 2)).toBe('6.2')
  })

  it('a removed 5 followed by any non-zero digit rounds up', () => {
    expect(roundToSigFigs(6.2501, 2)).toBe('6.3')
  })

  it('preserves trailing zeros (2.0004 -> 2.00)', () => {
    expect(roundToSigFigs(2.0004, 3)).toBe('2.00')
  })

  it('handles carry into a new decade', () => {
    expect(roundToSigFigs(9.96, 2)).toBe('10')
  })

  it('handles negative numbers and values below one', () => {
    expect(roundToSigFigs(-0.0012345, 2)).toBe('-0.0012')
    expect(roundToSigFigs(0.0025, 1)).toBe('0.002')
  })

  it('throws RangeError for invalid precision or non-finite values', () => {
    expect(() => roundToSigFigs(1.5, 0)).toThrow(RangeError)
    expect(() => roundToSigFigs(1.5, 1.5)).toThrow(RangeError)
    expect(() => roundToSigFigs(Number.NaN, 2)).toThrow(RangeError)
  })
})

describe('toScientific', () => {
  it('formats with the requested significant figures using ×10^', () => {
    expect(toScientific(0.0025, 2)).toBe('2.5×10^-3')
    expect(toScientific(56100, 3)).toBe('5.61×10^4')
    expect(toScientific(-285, 2)).toBe('-2.8×10^2')
  })

  it('applies round-half-even to the mantissa', () => {
    expect(toScientific(6.25, 2)).toBe('6.2×10^0')
  })
})

describe('sigFigsForProduct and decimalPlacesForSum', () => {
  it('a product keeps the fewest significant figures (2.5 × 1.25 -> 2)', () => {
    expect(sigFigsForProduct('2.5', '1.25')).toBe(2)
    expect(sigFigsForProduct('285', '2.0', '3.000')).toBe(2)
  })

  it('a sum keeps the fewest decimal places (18.0 + 13.12 -> one place)', () => {
    expect(decimalPlacesForSum('18.0', '13.12')).toBe(1)
    expect(decimalPlacesForSum('100', '2.5')).toBe(0)
  })

  it('throws RangeError when called with no arguments', () => {
    expect(() => sigFigsForProduct()).toThrow(RangeError)
    expect(() => decimalPlacesForSum()).toThrow(RangeError)
  })
})
