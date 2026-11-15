import { describe, expect, it } from 'vitest'
import {
  ENTHALPY_STEP_COUNT,
  PATH_STEP_COUNT,
  PISTON_STEP_COUNT,
  enthalpyExample,
  pathStep,
  pistonStep,
  pistonWork,
  signed,
} from './work-steps'

describe('signed', () => {
  it('uses a true minus sign and fixed decimals', () => {
    expect(signed(-6, 2)).toBe('−6.00')
    expect(signed(1.5, 1)).toBe('1.5')
  })
})

describe('piston Scrolly', () => {
  it('has four Steps, and the work is −p_ex ΔV = −6.00 L bar = −600 J', () => {
    expect(PISTON_STEP_COUNT).toBe(4)
    const w = pistonWork()
    expect(w.litreBar).toBeCloseTo(-6, 10)
    expect(w.joule).toBeCloseTo(-600, 10)
    expect(pistonStep(2).working).toContain('−6.00 L bar = −600 J')
  })

  it('reverses the sign of the work for the compression Step', () => {
    expect(pistonStep(3).working).toContain('+600 J')
  })

  it('clamps out-of-range Steps', () => {
    expect(pistonStep(-3)).toEqual(pistonStep(0))
    expect(pistonStep(99)).toEqual(pistonStep(PISTON_STEP_COUNT - 1))
  })
})

describe('path Scrolly', () => {
  it('has four Steps: one, two, eight and the reversible limit', () => {
    expect(PATH_STEP_COUNT).toBe(4)
    expect(pathStep(0).steps).toBe(1)
    expect(pathStep(1).steps).toBe(2)
    expect(pathStep(2).steps).toBe(8)
    expect(pathStep(3).steps).toBe('reversible')
  })

  it('gives the one-step fraction of the reversible maximum as 72%, and the reversible as 100%', () => {
    expect(pathStep(0).fraction).toBeCloseTo(0.7212, 3)
    expect(pathStep(3).fraction).toBeCloseTo(1, 10)
  })
})

describe('enthalpy Scrolly', () => {
  it('has four Steps', () => {
    expect(ENTHALPY_STEP_COUNT).toBe(4)
  })

  it('gives ΔH = −92.22 kJ mol⁻¹ and ΔU = −87.26 kJ mol⁻¹ for N₂ + 3H₂ → 2NH₃ at 298 K', () => {
    const ex = enthalpyExample()
    expect(ex.ammonia.deltaH).toBeCloseTo(-92.22, 10)
    expect(ex.ammonia.deltaNg).toBe(-2)
    expect(ex.ammonia.deltaU).toBeCloseTo(-87.26, 1)
    expect(ex.ammonia.check).toBeCloseTo(ex.ammonia.deltaH, 10)
  })

  it('gives ΔH − ΔU = Δn_g RT = −4.96 kJ mol⁻¹ for ammonia', () => {
    const ex = enthalpyExample()
    expect(ex.ammonia.gap).toBeCloseTo(-4.955, 2)
  })

  it('gives ΔH = ΔU for graphite to diamond, with Δn_g = 0', () => {
    const ex = enthalpyExample()
    expect(ex.diamond.deltaNg).toBe(0)
    expect(ex.diamond.deltaH).toBeCloseTo(1.89, 10)
    expect(ex.diamond.gap).toBe(0)
  })
})
