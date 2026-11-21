import { describe, expect, it } from 'vitest'
import {
  E0_DANIELL,
  E0_NI_AG,
  NERNST_STEPS,
  NERNST_STEP_COUNT,
  clampNernstStep,
  cuElectrodePotential,
  daniellPotential,
  getNernstStepState,
  hydrogenPotential,
  niAgPotential,
  niAgReactionQuotient,
} from './nernst-steps'

describe('Nernst animation steps', () => {
  it('defines five ordered steps with unique ids', () => {
    expect(NERNST_STEP_COUNT).toBe(5)
    expect(NERNST_STEPS.map((s) => s.index)).toEqual([0, 1, 2, 3, 4])
    expect(new Set(NERNST_STEPS.map((s) => s.id)).size).toBe(5)
  })

  it('takes standard potentials from Table 2.1', () => {
    expect(E0_DANIELL).toBeCloseTo(1.1, 6)
    expect(E0_NI_AG).toBeCloseTo(1.05, 6)
  })

  it('moves the copper electrode by 0.0295 V per tenfold change (n = 2)', () => {
    expect(cuElectrodePotential(0)).toBeCloseTo(0.34, 6)
    expect(cuElectrodePotential(-1) - cuElectrodePotential(0)).toBeCloseTo(-0.0295, 6)
    expect(cuElectrodePotential(-4)).toBeCloseTo(0.222, 6)
  })

  it('gives the Daniell EMF for [Zn²⁺]/[Cu²⁺] = 0.010', () => {
    expect(daniellPotential(0, 0)).toBeCloseTo(1.1, 6)
    expect(daniellPotential(-2, 0)).toBeCloseTo(1.159, 6)
  })

  it('computes Q = [Ni²⁺]/[Ag⁺]² and the Ni | Ag EMF', () => {
    expect(niAgReactionQuotient(-1, -2)).toBeCloseTo(1000, 6)
    expect(niAgPotential(-1, -2)).toBeCloseTo(1.05 - 0.0295 * 3, 6)
  })

  it('gives the hydrogen electrode at pH 10 as −0.590 V', () => {
    expect(hydrogenPotential(10)).toBeCloseTo(-0.59, 6)
  })

  it('clamps out-of-range step indices', () => {
    expect(clampNernstStep(-3)).toBe(0)
    expect(clampNernstStep(99)).toBe(4)
    expect(clampNernstStep(Number.NaN)).toBe(0)
    expect(getNernstStepState(2).id).toBe('daniell-ratio')
  })
})
