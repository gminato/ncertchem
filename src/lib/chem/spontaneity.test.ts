import { describe, expect, it } from 'vitest'
import {
  classifyTable54,
  crossoverTemperature,
  entropyOfPhaseChange,
  entropyOfSurroundings,
  gibbsEnergyChange,
  kFromStandardGibbs,
  kpForDissociation2,
  spontaneityFromGibbs,
  standardGibbsFromK,
  totalEntropyChange,
} from './spontaneity'

describe('entropy of surroundings and total entropy (Section 5.6(b), equation 5.19)', () => {
  it('gives ΔS_surr = −ΔH/T with the kJ to J conversion', () => {
    // ΔH = −1648 kJ mol⁻¹ at 298 K → +5530.2 J K⁻¹ mol⁻¹ (Problem 5.11).
    expect(entropyOfSurroundings(-1648, 298)).toBeCloseTo(5530.2, 1)
  })

  it('reproduces Problem 5.11: ΔS_total ≈ 4980.8 J K⁻¹ mol⁻¹ for 4Fe + 3O2 → 2Fe2O3', () => {
    // ΔS_sys = −549.4 J K⁻¹ mol⁻¹ (NCERT). NCERT prints 4980.6 from the rounded 5530.
    expect(totalEntropyChange(-549.4, -1648, 298)).toBeCloseTo(4980.8, 1)
  })

  it('is positive, so the reaction is spontaneous, despite the negative ΔS_sys', () => {
    expect(totalEntropyChange(-549.4, -1648, 298)).toBeGreaterThan(0)
  })

  it('gives ΔS_surr = 0 for a process with no heat change', () => {
    expect(entropyOfSurroundings(0, 298)).toBe(0)
  })

  it('rejects a non-positive temperature', () => {
    expect(() => entropyOfSurroundings(-10, 0)).toThrow(RangeError)
    expect(() => totalEntropyChange(10, -10, -5)).toThrow(RangeError)
  })
})

describe('Gibbs energy and spontaneity (Section 5.6(c), equations 5.21 and 5.22)', () => {
  it('computes ΔG = ΔH − TΔS with the kJ to J conversion', () => {
    // ΔH = +10 kJ, ΔS = +50 J K⁻¹ at 300 K: ΔG = 10 − 300×50/1000 = −5 kJ.
    expect(gibbsEnergyChange(10, 300, 50)).toBeCloseTo(-5, 10)
  })

  it('gives negative ΔG (spontaneous) for ΔH < 0 with ΔS > 0 at any temperature', () => {
    expect(spontaneityFromGibbs(gibbsEnergyChange(-20, 1000, 10))).toBe('spontaneous')
  })

  it('classifies ΔG > 0 as non-spontaneous and ΔG = 0 as equilibrium', () => {
    expect(spontaneityFromGibbs(3)).toBe('non-spontaneous')
    expect(spontaneityFromGibbs(0)).toBe('equilibrium')
    expect(spontaneityFromGibbs(-0.5)).toBe('spontaneous')
  })

  it('rejects a non-finite input', () => {
    expect(() => spontaneityFromGibbs(Number.NaN)).toThrow(RangeError)
  })
})

describe('crossover temperature (Table 5.4)', () => {
  it('gives the melting point of ice from ΔfusH = 6.01 kJ mol⁻¹ and ΔfusS = ΔH/T at 273.15 K', () => {
    const dS = entropyOfPhaseChange(6.01, 273.15)
    expect(dS).toBeCloseTo(22.0, 1)
    expect(crossoverTemperature(6.01, dS)).toBeCloseTo(273.15, 6)
  })

  it('gives a positive crossover when ΔH and ΔS are both positive (non-spontaneous at low T, spontaneous at high T)', () => {
    expect(crossoverTemperature(100, 200)).toBeCloseTo(500, 10)
  })

  it('gives a positive crossover when ΔH and ΔS are both negative (spontaneous at low T)', () => {
    expect(crossoverTemperature(-100, -200)).toBeCloseTo(500, 10)
  })

  it('returns null when ΔH and ΔS have opposite signs (no real temperature gives ΔG = 0)', () => {
    expect(crossoverTemperature(100, -200)).toBeNull()
    expect(crossoverTemperature(-100, 200)).toBeNull()
  })

  it('rejects ΔS = 0', () => {
    expect(() => crossoverTemperature(10, 0)).toThrow(RangeError)
  })
})

describe('entropy of phase change (Section 5.6(b) and Table 5.1)', () => {
  it('gives ΔvapS of water at its boiling point, 40.79 kJ mol⁻¹ at 373.15 K ≈ 109.3 J K⁻¹ mol⁻¹', () => {
    expect(entropyOfPhaseChange(40.79, 373.15)).toBeCloseTo(109.3, 1)
  })
})

describe('Table 5.4 classification', () => {
  it('gives one row, valid at all temperatures, for ΔH < 0 and ΔS > 0', () => {
    const rows = classifyTable54(-10, 5)
    expect(rows).toHaveLength(1)
    expect(rows[0].temperature).toBe('all')
    expect(rows[0].deltaG).toBe('-')
    expect(rows[0].description).toBe('Reaction spontaneous at all temperatures')
  })

  it('gives one row, valid at all temperatures, for ΔH > 0 and ΔS < 0', () => {
    const rows = classifyTable54(10, -5)
    expect(rows).toHaveLength(1)
    expect(rows[0].description).toBe('Reaction nonspontaneous at all temperatures')
  })

  it('gives two rows for ΔH < 0 and ΔS < 0: spontaneous at low T, nonspontaneous at high T', () => {
    const rows = classifyTable54(-10, -5)
    expect(rows.map((r) => r.description)).toEqual([
      'Reaction spontaneous at low temperature',
      'Reaction nonspontaneous at high temperature',
    ])
    expect(rows.map((r) => r.deltaG)).toEqual(['-', '+'])
  })

  it('gives two rows for ΔH > 0 and ΔS > 0: nonspontaneous at low T, spontaneous at high T', () => {
    const rows = classifyTable54(10, 5)
    expect(rows.map((r) => r.description)).toEqual([
      'Reaction nonspontaneous at low temperature',
      'Reaction spontaneous at high temperature',
    ])
  })

  it('rejects a zero ΔH or ΔS', () => {
    expect(() => classifyTable54(0, 5)).toThrow(RangeError)
    expect(() => classifyTable54(5, 0)).toThrow(RangeError)
  })
})

describe('standard Gibbs energy and equilibrium constant (equations 5.23 and 5.24)', () => {
  it('reproduces Problem 5.12: ΔG° = +163 kJ mol⁻¹ for 3/2 O2 → O3 with Kp = 2.47 × 10⁻²⁹ at 298 K', () => {
    expect(standardGibbsFromK(2.47e-29, 298)).toBeCloseTo(163.2, 0)
  })

  it('reproduces Problem 5.13: K = 2.4 × 10² from ΔG° = −13.6 kJ mol⁻¹ at 298 K', () => {
    const k = kFromStandardGibbs(-13.6, 298)
    expect(Math.log10(k)).toBeCloseTo(2.38, 2)
    expect(k).toBeCloseTo(2.4e2, -1)
  })

  it('reproduces Problem 5.14: Kp = 4/3 for N2O4 50% dissociated at 1 atm (NCERT rounds to 1.33)', () => {
    expect(kpForDissociation2(0.5, 1)).toBeCloseTo(4 / 3, 12)
  })

  it('gives ΔG° ≈ −0.80 kJ mol⁻¹ for Problem 5.14 at 333 K (NCERT prints −763.8, which is wrong)', () => {
    const dG = standardGibbsFromK(4 / 3, 333)
    expect(dG).toBeCloseTo(-0.8, 2)
    expect(dG).toBeLessThan(0)
  })

  it('round-trips K and ΔG°', () => {
    expect(kFromStandardGibbs(standardGibbsFromK(42, 310), 310)).toBeCloseTo(42, 9)
  })

  it('rejects a non-positive equilibrium constant or temperature', () => {
    expect(() => standardGibbsFromK(0, 298)).toThrow(RangeError)
    expect(() => standardGibbsFromK(2, -1)).toThrow(RangeError)
  })

  it('rejects an invalid degree of dissociation or pressure', () => {
    expect(() => kpForDissociation2(0, 1)).toThrow(RangeError)
    expect(() => kpForDissociation2(1, 1)).toThrow(RangeError)
    expect(() => kpForDissociation2(0.5, 0)).toThrow(RangeError)
  })
})
