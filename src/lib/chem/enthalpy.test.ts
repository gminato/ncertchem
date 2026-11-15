import { describe, expect, it } from 'vitest'
import { R_J_PER_MOL_K } from './pv-work'
import {
  classifyProperty,
  cpFromCv,
  deltaNg,
  enthalpyFromInternalEnergy,
  heatFromHeatCapacity,
  heatFromSpecificHeat,
  internalEnergyFromEnthalpy,
  molarHeatCapacity,
  type ReactionSpecies,
} from './enthalpy'

const g = (coefficient: number): ReactionSpecies => ({ coefficient, state: 'g' })
const l = (coefficient: number): ReactionSpecies => ({ coefficient, state: 'l' })
const s = (coefficient: number): ReactionSpecies => ({ coefficient, state: 's' })

describe('Δn_g from a balanced equation (Section 5.2.2(a))', () => {
  it('is zero for C(graphite) + O2(g) → CO2(g) (Problem 5.6)', () => {
    expect(deltaNg([s(1), g(1)], [g(1)])).toBe(0)
  })

  it('is +1 for H2O(l) → H2O(g) (Problem 5.5)', () => {
    expect(deltaNg([l(1)], [g(1)])).toBe(1)
  })

  it('is −2 for N2(g) + 3H2(g) → 2NH3(g) (Section 5.4 example)', () => {
    expect(deltaNg([g(1), g(3)], [g(2)])).toBe(-2)
  })

  it('counts only gases: CH4(g) + 2O2(g) → CO2(g) + 2H2O(l) gives −2', () => {
    expect(deltaNg([g(1), g(2)], [g(1), l(2)])).toBe(-2)
  })

  it('is zero when no gases are present', () => {
    expect(deltaNg([s(2)], [s(1), l(1)])).toBe(0)
  })

  it('rejects a non-positive coefficient', () => {
    expect(() => deltaNg([g(0)], [g(1)])).toThrow(RangeError)
    expect(() => deltaNg([g(1)], [g(-2)])).toThrow(RangeError)
  })
})

describe('ΔH = ΔU + Δn_g RT (equation 5.10)', () => {
  it('reproduces Problem 5.5: ΔU = 41.00 − 1 × 8.3 × 373 J = 37.904 kJ mol⁻¹ with R = 8.3', () => {
    expect(enthalpyFromInternalEnergy(37.904, 1, 373, 8.3)).toBeCloseTo(41.0, 2)
    expect(internalEnergyFromEnthalpy(41.0, 1, 373, 8.3)).toBeCloseTo(37.904, 3)
  })

  it('reproduces Problem 5.7: ΔvapU = 44.01 − 2.48 = 41.53 kJ mol⁻¹ at 298 K', () => {
    expect(internalEnergyFromEnthalpy(44.01, 1, 298)).toBeCloseTo(41.53, 2)
  })

  it('leaves ΔH equal to ΔU when Δn_g = 0 (Problem 5.6, Problem 5.8)', () => {
    expect(enthalpyFromInternalEnergy(-248.4, 0, 298)).toBe(-248.4)
  })

  it('gives ΔH − ΔU = Δn_g RT for NaCl(s) → Na⁺(g) + Cl⁻(g), with Δn_g = 2 (Section 5.5(d))', () => {
    const gasMoles = deltaNg([s(1)], [g(1), g(1)])
    expect(gasMoles).toBe(2)
    // NCERT: ΔU = 788 − 2RT = 783 kJ mol⁻¹ at 298 K.
    expect(internalEnergyFromEnthalpy(788, gasMoles, 298)).toBeCloseTo(783.04, 1)
  })

  it('round-trips between ΔU and ΔH', () => {
    const dU = -123.4
    const dH = enthalpyFromInternalEnergy(dU, -2, 298.15)
    expect(internalEnergyFromEnthalpy(dH, -2, 298.15)).toBeCloseTo(dU, 9)
  })

  it('rejects a non-positive temperature', () => {
    expect(() => enthalpyFromInternalEnergy(10, 1, 0)).toThrow(RangeError)
    expect(() => internalEnergyFromEnthalpy(10, 1, -5)).toThrow(RangeError)
  })
})

describe('heat from heat capacity and specific heat (Section 5.2.2(c))', () => {
  it('gives q = C ΔT for a calorimeter with C = 20.7 kJ K⁻¹ and ΔT = 1 K (Problem 5.6)', () => {
    expect(heatFromHeatCapacity(20.7, 1)).toBeCloseTo(20.7, 10)
  })

  it('gives q = m c ΔT for Problem 5.8: 18 g of water cooled by 100 K with c = 4.2 J g⁻¹ °C⁻¹', () => {
    // NCERT: ΔH1 = −(18 × 4.2 × 100) J = −7560 J.
    expect(heatFromSpecificHeat(18, 4.2, -100)).toBeCloseTo(-7560, 9)
  })

  it('computes the molar heat capacity from C and n', () => {
    expect(molarHeatCapacity(75.3, 2)).toBeCloseTo(37.65, 10)
  })

  it('rejects a zero or negative amount', () => {
    expect(() => molarHeatCapacity(10, 0)).toThrow(RangeError)
    expect(() => molarHeatCapacity(10, -1)).toThrow(RangeError)
  })
})

describe('C_p − C_v = R for an ideal gas (equation 5.13)', () => {
  it('adds R to C_v to give C_p', () => {
    expect(cpFromCv(1.5 * R_J_PER_MOL_K) - 1.5 * R_J_PER_MOL_K).toBeCloseTo(R_J_PER_MOL_K, 12)
  })

  it('gives C_p = 5/2 R for a monatomic ideal gas with C_v = 3/2 R (the value NCERT uses for ionisation)', () => {
    expect(cpFromCv(1.5 * R_J_PER_MOL_K)).toBeCloseTo(2.5 * R_J_PER_MOL_K, 12)
  })
})

describe('extensive and intensive properties (Section 5.2.2(b))', () => {
  it('classifies the extensive properties NCERT names', () => {
    for (const name of ['mass', 'volume', 'internal energy', 'enthalpy', 'heat capacity']) {
      expect(classifyProperty(name)).toBe('extensive')
    }
  })

  it('classifies the intensive properties NCERT names', () => {
    for (const name of ['temperature', 'density', 'pressure', 'molar volume', 'molar heat capacity']) {
      expect(classifyProperty(name)).toBe('intensive')
    }
  })

  it('rejects a property that NCERT does not classify', () => {
    expect(() => classifyProperty('constructor')).toThrow(RangeError)
    expect(() => classifyProperty('colour')).toThrow(RangeError)
  })
})
