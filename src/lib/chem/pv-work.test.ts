import { describe, expect, it } from 'vitest'
import {
  BAR_PER_ATM,
  JOULE_PER_LITRE_ATM,
  R_J_PER_MOL_K,
  freeExpansionWork,
  irreversibleConstantPressureWork,
  litreAtmFromJoule,
  reversibleIsothermalWork,
  steppedIsothermalWork,
  workFromJoule,
  workFromLitreBar,
} from './pv-work'

/** Reversible isothermal work for 1 mol at 298 K from 2 L to 10 L, in joules: the basis of Problem 5.4. */
const PROBLEM_5_4_REVERSIBLE_J = reversibleIsothermalWork(1, 298, 2, 10).joule

describe('unit conversions (1 L bar = 100 J)', () => {
  it('converts litre-bar to joule and back', () => {
    const w = workFromLitreBar(2.5)
    expect(w.joule).toBe(250)
    expect(workFromJoule(250).litreBar).toBe(2.5)
  })

  it('converts joules to litre-atmospheres with 101.325 J per L atm', () => {
    expect(litreAtmFromJoule(JOULE_PER_LITRE_ATM)).toBeCloseTo(1, 12)
    expect(BAR_PER_ATM).toBeCloseTo(1.01325, 12)
  })

  it('rejects non-finite work values', () => {
    expect(() => workFromLitreBar(Number.NaN)).toThrow(RangeError)
    expect(() => workFromJoule(Number.POSITIVE_INFINITY)).toThrow(RangeError)
  })
})

describe('irreversible expansion against constant external pressure (Problems 5.2, 5.3)', () => {
  it('gives w = −p_ex ΔV for Problem 5.3: 2 L to 10 L against 1 atm', () => {
    const w = irreversibleConstantPressureWork(BAR_PER_ATM, 2, 10)
    // 1 atm × 8 L = 8 L atm = 810.6 J
    expect(litreAtmFromJoule(-w.joule)).toBeCloseTo(8, 10)
    expect(w.joule).toBeCloseTo(-810.6, 1)
    expect(w.litreBar).toBeCloseTo(-8.1060, 3)
  })

  it('gives zero work for Problem 5.2 when the external pressure is zero', () => {
    expect(irreversibleConstantPressureWork(0, 2, 10).joule).toBe(0)
  })

  it('gives positive work when the gas is compressed (ΔV < 0)', () => {
    const w = irreversibleConstantPressureWork(2, 10, 5)
    expect(w.litreBar).toBe(10)
    expect(w.joule).toBe(1000)
  })

  it('rejects a negative external pressure or a non-positive volume', () => {
    expect(() => irreversibleConstantPressureWork(-1, 2, 10)).toThrow(RangeError)
    expect(() => irreversibleConstantPressureWork(1, 0, 10)).toThrow(RangeError)
    expect(() => irreversibleConstantPressureWork(1, 2, -4)).toThrow(RangeError)
  })
})

describe('free expansion (Section 5.2.1)', () => {
  it('does no work when a gas expands into vacuum', () => {
    expect(freeExpansionWork()).toEqual({ litreBar: 0, joule: 0 })
  })

  it('matches Problem 5.2: q = −w = 0 and ΔU = 0 for 2 L → 10 L into vacuum', () => {
    const w = irreversibleConstantPressureWork(0, 2, 10)
    expect(w.joule).toBe(freeExpansionWork().joule)
  })
})

describe('reversible isothermal expansion (Problem 5.4, equation 5.5)', () => {
  it('gives the NCERT magnitude of about 39.36 L atm for 1 mol at 298 K from 2 L to 10 L', () => {
    // NCERT prints 39.366 L atm from R = 0.08206 L atm; R = 8.314 J (converted with 101.325 J per
    // L atm) gives 39.361. The difference is in the gas constant, not the formula.
    expect(litreAtmFromJoule(-PROBLEM_5_4_REVERSIBLE_J)).toBeCloseTo(39.36, 1)
  })

  it('is negative for expansion, so q = −w is positive', () => {
    expect(PROBLEM_5_4_REVERSIBLE_J).toBeLessThan(0)
  })

  it('uses R = 8.314 J mol⁻¹ K⁻¹ and base-10 log with 2.303', () => {
    const expected = -2.303 * 1 * R_J_PER_MOL_K * 298 * Math.log10(5)
    expect(PROBLEM_5_4_REVERSIBLE_J).toBeCloseTo(expected, 9)
  })

  it('gives more work magnitude than the one-step irreversible expansion to the same final volume', () => {
    const reversible = Math.abs(PROBLEM_5_4_REVERSIBLE_J)
    // Irreversible at the final pressure of the reversible path (p_f = nRT / V_f).
    const pFinalBar = (1 * 0.08314 * 298) / 10
    const irreversible = Math.abs(irreversibleConstantPressureWork(pFinalBar, 2, 10).joule)
    expect(reversible).toBeGreaterThan(irreversible)
  })

  it('returns zero work for an isothermal change with no volume change', () => {
    expect(reversibleIsothermalWork(1, 298, 5, 5).joule).toBe(0)
  })

  it('rejects an invalid amount, temperature or volume', () => {
    expect(() => reversibleIsothermalWork(0, 298, 2, 10)).toThrow(RangeError)
    expect(() => reversibleIsothermalWork(1, 0, 2, 10)).toThrow(RangeError)
    expect(() => reversibleIsothermalWork(1, 298, 2, 0)).toThrow(RangeError)
  })
})

describe('stepwise expansion converging to the reversible work (for the animation)', () => {
  const N_MOL = 1
  const T = 298
  const VI = 2
  const VF = 10
  const reversibleLitreBar = reversibleIsothermalWork(N_MOL, T, VI, VF).litreBar

  it('with one step equals the irreversible expansion against the final pressure', () => {
    const one = steppedIsothermalWork(N_MOL, T, VI, VF, 1)
    const pFinal = (N_MOL * 0.08314 * T) / VF
    expect(one.steps).toBe(1)
    expect(one.litreBar).toBeCloseTo(-pFinal * (VF - VI), 10)
  })

  it('moves closer to the reversible work as the number of steps increases', () => {
    const errors = [1, 4, 16, 64, 256].map((n) =>
      Math.abs(steppedIsothermalWork(N_MOL, T, VI, VF, n).litreBar - reversibleLitreBar),
    )
    for (let i = 1; i < errors.length; i++) {
      expect(errors[i]).toBeLessThan(errors[i - 1])
    }
  })

  it('is within 0.1% of the reversible work at 10 000 steps', () => {
    const w = steppedIsothermalWork(N_MOL, T, VI, VF, 10000).litreBar
    expect(Math.abs(w - reversibleLitreBar) / Math.abs(reversibleLitreBar)).toBeLessThan(1e-3)
  })

  it('rejects a non-integer or zero number of steps', () => {
    expect(() => steppedIsothermalWork(N_MOL, T, VI, VF, 0)).toThrow(RangeError)
    expect(() => steppedIsothermalWork(N_MOL, T, VI, VF, 2.5)).toThrow(RangeError)
  })
})
