import { describe, expect, it } from 'vitest'
import { BOMB_EXAMPLE, COFFEE_CUP_EXAMPLE, signedText } from './calorimetry-examples'

describe('bomb calorimeter worked example (Section 5.3(a))', () => {
  it('butane: M = 58.12 g mol⁻¹ and n = 0.40 g / 58.12 g mol⁻¹', () => {
    expect(BOMB_EXAMPLE.molarMassGPerMol).toBeCloseTo(58.12, 2)
    expect(BOMB_EXAMPLE.molesReacted).toBeCloseTo(0.4 / BOMB_EXAMPLE.molarMassGPerMol, 12)
    expect(BOMB_EXAMPLE.molesReacted).toBeCloseTo(6.88e-3, 5)
  })

  it('q(calorimeter) = C × ΔT = +21.56 kJ, so q(reaction) = −21.56 kJ', () => {
    expect(BOMB_EXAMPLE.qCalorimeterKJ).toBeCloseTo(21.56, 6)
    expect(BOMB_EXAMPLE.qReactionKJ).toBeCloseTo(-21.56, 6)
  })

  it('ΔU per mole = −21.56 kJ / 6.882 × 10⁻³ mol ≈ −3133 kJ mol⁻¹', () => {
    expect(BOMB_EXAMPLE.deltaUKJPerMol).toBeCloseTo(-3133, 0)
    expect(signedText(BOMB_EXAMPLE.deltaUKJPerMol, 0)).toBe('−3133')
  })

  it('Δn_g = 4 − 7.5 = −3.5, and ΔH = ΔU + Δn_g RT ≈ −3142 kJ mol⁻¹', () => {
    expect(BOMB_EXAMPLE.deltaNg).toBeCloseTo(-3.5, 10)
    const correction = (-3.5 * 8.314 * 298) / 1000
    expect(BOMB_EXAMPLE.deltaHKJPerMol).toBeCloseTo(BOMB_EXAMPLE.deltaUKJPerMol + correction, 6)
    expect(signedText(BOMB_EXAMPLE.deltaHKJPerMol, 0)).toBe('−3142')
  })
})

describe('coffee-cup worked example (Section 5.3(b))', () => {
  it('total heat capacity of 100 g water at 4.18 J g⁻¹ K⁻¹ is 0.418 kJ K⁻¹', () => {
    expect(COFFEE_CUP_EXAMPLE.heatCapacityKJPerK).toBeCloseTo(0.418, 9)
  })

  it('q(reaction) = −0.418 × 6.8 = −2.84 kJ', () => {
    expect(COFFEE_CUP_EXAMPLE.qReactionKJ).toBeCloseTo(-2.8424, 6)
  })

  it('ΔH per mole of water = −2.8424 / 0.0500 ≈ −56.8 kJ mol⁻¹', () => {
    expect(COFFEE_CUP_EXAMPLE.deltaHKJPerMol).toBeCloseTo(-56.848, 3)
    expect(signedText(COFFEE_CUP_EXAMPLE.deltaHKJPerMol, 1)).toBe('−56.8')
  })
})

describe('signedText', () => {
  it('uses a true minus sign and a plus sign for positive values', () => {
    expect(signedText(-2.5, 1)).toBe('−2.5')
    expect(signedText(2.5, 1)).toBe('+2.5')
  })
})
