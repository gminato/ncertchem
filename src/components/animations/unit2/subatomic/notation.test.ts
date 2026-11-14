import { describe, it, expect } from 'vitest'
import { clampIndex, sci, superscript } from './notation'

describe('superscript', () => {
  it('writes integer exponents with Unicode superscripts and a superscript minus', () => {
    expect(superscript(19)).toBe('¹⁹')
    expect(superscript(-19)).toBe('⁻¹⁹')
    expect(superscript(0)).toBe('⁰')
  })
})

describe('sci', () => {
  it('formats the elementary charge with a U+2212 minus and superscript exponent', () => {
    expect(sci(-1.602176e-19, 4)).toBe('−1.602 × 10⁻¹⁹')
  })

  it('formats Thomson’s e/m ratio', () => {
    expect(sci(1.75882e11, 4)).toBe('1.759 × 10¹¹')
  })

  it('handles rounding that carries the mantissa to 10', () => {
    expect(sci(9.9996e5, 3)).toBe('1.00 × 10⁶')
  })

  it('writes zero as 0', () => {
    expect(sci(0, 3)).toBe('0')
  })
})

describe('clampIndex', () => {
  it('keeps the Step inside the animation and rounds it', () => {
    expect(clampIndex(-2, 4)).toBe(0)
    expect(clampIndex(9, 4)).toBe(3)
    expect(clampIndex(1.4, 4)).toBe(1)
    expect(clampIndex(Number.NaN, 4)).toBe(0)
  })
})
