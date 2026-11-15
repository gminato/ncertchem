import { describe, expect, it } from 'vitest'
import {
  BOX_PRESSURE,
  KPKC_EXAMPLES,
  KPKC_T,
  equationText,
  formatConstant,
  kpKcSteps,
  signedInt,
} from './kpkc-steps'
import { R_BAR_L_PER_MOL_K } from '@/lib/chem/equilibrium'

describe('kp-kc Scrolly steps', () => {
  const steps = kpKcSteps()
  const [h2i2, n2h2, nocl] = KPKC_EXAMPLES

  it('has five Steps: the box, three reactions and a summary', () => {
    expect(steps.map((s) => s.kind)).toEqual(['box', 'example', 'example', 'example', 'summary'])
  })

  it('gives p = [gas] RT for the box: 0.100 mol L⁻¹ at 400 K is 3.32 bar', () => {
    expect(BOX_PRESSURE).toBeCloseTo(0.1 * R_BAR_L_PER_MOL_K * KPKC_T, 12)
    expect(formatConstant(BOX_PRESSURE)).toBe('3.32')
  })

  it('finds Δn = 0, −2 and +1 from the gaseous coefficients', () => {
    expect([h2i2.deltaN, n2h2.deltaN, nocl.deltaN]).toEqual([0, -2, 1])
    expect([n2h2.gasReactants, n2h2.gasProducts]).toEqual([4, 2])
  })

  it('computes Kc from the equilibrium concentrations and Kp = Kc (RT)^Δn', () => {
    expect(h2i2.kc).toBeCloseTo(64, 9)
    expect(h2i2.kp).toBeCloseTo(64, 9)
    expect(n2h2.kc).toBeCloseTo(0.01 / (0.2 * 0.3 ** 3), 9)
    expect(n2h2.kp).toBeCloseTo(n2h2.kc / (R_BAR_L_PER_MOL_K * KPKC_T) ** 2, 12)
    expect(nocl.kc).toBeCloseTo(0.025, 12)
    expect(nocl.kp).toBeCloseTo(0.025 * R_BAR_L_PER_MOL_K * KPKC_T, 12)
  })

  it('assigns the units that follow from Δn', () => {
    expect([h2i2.kpUnit, n2h2.kpUnit, nocl.kpUnit]).toEqual(['none', 'bar⁻²', 'bar'])
    expect([h2i2.kcUnit, n2h2.kcUnit, nocl.kcUnit]).toEqual(['none', 'L² mol⁻²', 'mol L⁻¹'])
  })

  it('writes the equation in Unicode for SVG text', () => {
    expect(equationText(nocl.reaction)).toBe('2NOCl(g) ⇌ 2NO(g) + Cl₂(g)')
  })

  it('formats constants with three figures, and signs with U+2212', () => {
    expect(formatConstant(0.831)).toBe('0.831')
    expect(formatConstant(64)).toBe('64.0')
    expect(formatConstant(0.0016760)).toBe('1.68 × 10⁻³')
    expect(signedInt(-2)).toBe('−2')
    expect(signedInt(1)).toBe('+1')
  })
})
