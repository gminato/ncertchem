import { describe, expect, it } from 'vitest'
import {
  NCERT_FE2O3_REDUCTION,
  NCERT_HESS_CO2_FORMATION,
  NCERT_HESS_CO_OXIDATION,
  NCERT_HESS_CO_TARGET,
  NCERT_PROBLEM_5_9_BENZENE_COMBUSTION,
  NCERT_PROBLEM_5_9_BENZENE_FORMATION,
  NCERT_PROBLEM_5_9_WATER,
  type ThermoEquation,
  addEquations,
  formationEnthalpyKJ,
  reactionEnthalpyFromFormation,
  reverseEquation,
  sameSpeciesBalance,
  scaleEquation,
  solveHess,
} from './hess'

const N2_SYNTHESIS: ThermoEquation = {
  label: 'N2(g) + 3H2(g) → 2NH3(g)',
  reactants: [
    { species: 'N2(g)', coefficient: 1 },
    { species: 'H2(g)', coefficient: 3 },
  ],
  products: [{ species: 'NH3(g)', coefficient: 2 }],
  deltaHKJ: -91.8,
}

describe('scaling and reversing thermochemical equations (Section 5.4(e), rules 2 and 3)', () => {
  it('halves the coefficients and ΔH when scaled by ½', () => {
    const half = scaleEquation(N2_SYNTHESIS, 0.5)
    expect(half.deltaHKJ).toBeCloseTo(-45.9, 10)
    expect(half.products).toEqual([{ species: 'NH3(g)', coefficient: 1 }])
    expect(half.reactants).toEqual([
      { species: 'N2(g)', coefficient: 0.5 },
      { species: 'H2(g)', coefficient: 1.5 },
    ])
  })

  it('reverses the sign of ΔH when the equation is reversed (NCERT: +91.8 kJ mol⁻¹)', () => {
    const reversed = reverseEquation(N2_SYNTHESIS)
    expect(reversed.deltaHKJ).toBeCloseTo(91.8, 10)
    expect(reversed.reactants).toEqual([{ species: 'NH3(g)', coefficient: 2 }])
    expect(sameSpeciesBalance(reversed, { ...N2_SYNTHESIS, reactants: N2_SYNTHESIS.products, products: N2_SYNTHESIS.reactants })).toBe(true)
  })

  it('rejects a zero scale factor', () => {
    expect(() => scaleEquation(N2_SYNTHESIS, 0)).toThrow(RangeError)
    expect(() => scaleEquation(N2_SYNTHESIS, Number.NaN)).toThrow(RangeError)
  })
})

describe('adding thermochemical equations', () => {
  it('cancels species that appear on opposite sides', () => {
    // C(graphite) + O2 → CO2 (−393.5) plus CO2 → CO + ½O2 (+283.0) gives C + ½O2 → CO (−110.5)
    const reverseOxidation = reverseEquation(NCERT_HESS_CO_OXIDATION)
    const sum = addEquations(NCERT_HESS_CO2_FORMATION, reverseOxidation)
    expect(sameSpeciesBalance(sum, NCERT_HESS_CO_TARGET)).toBe(true)
    expect(sum.deltaHKJ).toBeCloseTo(-110.5, 10)
  })
})

describe('Hess’s law: NCERT CO example (Section 5.4(e))', () => {
  it('finds the multipliers +1 and −1 and gives ΔrH = −110.5 kJ mol⁻¹', () => {
    const solution = solveHess(NCERT_HESS_CO_TARGET, [NCERT_HESS_CO2_FORMATION, NCERT_HESS_CO_OXIDATION])
    expect(solution).not.toBeNull()
    expect(solution!.multipliers).toEqual([1, -1])
    expect(solution!.deltaHKJ).toBeCloseTo(-110.5, 10)
  })

  it('returns null when the available equations cannot build the target', () => {
    // Only the CO2 formation is available; CO cannot be made from it alone.
    expect(solveHess(NCERT_HESS_CO_TARGET, [NCERT_HESS_CO2_FORMATION])).toBeNull()
  })

  it('returns null when there are no available equations', () => {
    expect(solveHess(NCERT_HESS_CO_TARGET, [])).toBeNull()
  })
})

describe('Hess’s law: NCERT Problem 5.9 (benzene formation from combustion data)', () => {
  it('gives ΔfH(C6H6, l) = +48.51 kJ mol⁻¹ (NCERT prints the sign as −48.51; see ncert-unit5-tables.ts)', () => {
    const solution = solveHess(NCERT_PROBLEM_5_9_BENZENE_FORMATION, [
      NCERT_PROBLEM_5_9_BENZENE_COMBUSTION,
      NCERT_HESS_CO2_FORMATION,
      NCERT_PROBLEM_5_9_WATER,
    ])
    expect(solution).not.toBeNull()
    // Multipliers: −1 for the combustion (reversed), +6 for CO2 formation, +3 for water formation.
    expect(solution!.multipliers).toEqual([-1, 6, 3])
    expect(solution!.deltaHKJ).toBeCloseTo(48.51, 2)
  })
})

describe('Table 5.2 formation enthalpies (Section 5.4(c))', () => {
  it('reads ΔfH from Table 5.2 for a compound', () => {
    expect(formationEnthalpyKJ('H2O(l)')).toBe(-285.83)
    expect(formationEnthalpyKJ('CO2(g)')).toBe(-393.51)
  })

  it('gives zero for an element in its reference state, whether printed or not', () => {
    expect(formationEnthalpyKJ('H2(g)')).toBe(0)
    expect(formationEnthalpyKJ('C(graphite)')).toBe(0)
    expect(formationEnthalpyKJ('O2(g)')).toBe(0)
    expect(formationEnthalpyKJ('Fe(s)')).toBe(0)
  })

  it('rejects a species that is not in the table', () => {
    expect(() => formationEnthalpyKJ('Xe(g)')).toThrow(RangeError)
  })
})

describe('reaction enthalpy from formation enthalpies (equation 5.15)', () => {
  it('gives ΔrH = −33.3 kJ mol⁻¹ for Fe2O3 + 3H2 → 2Fe + 3H2O(l) (Section 5.4(d))', () => {
    expect(reactionEnthalpyFromFormation(NCERT_FE2O3_REDUCTION)).toBeCloseTo(-33.3, 1)
  })

  it('gives ΔrH = +178.3 kJ mol⁻¹ for the decomposition CaCO3 → CaO + CO2', () => {
    const decomposition = {
      label: 'CaCO3(s) → CaO(s) + CO2(g)',
      reactants: [{ species: 'CaCO3(s)', coefficient: 1 }],
      products: [
        { species: 'CaO(s)', coefficient: 1 },
        { species: 'CO2(g)', coefficient: 1 },
      ],
    }
    expect(reactionEnthalpyFromFormation(decomposition)).toBeCloseTo(178.3, 1)
  })

  it('gives ΔrH = −1648 kJ mol⁻¹ for 4Fe + 3O2 → 2Fe2O3 (the Problem 5.11 value)', () => {
    const oxidation = {
      label: '4Fe(s) + 3O2(g) → 2Fe2O3(s)',
      reactants: [
        { species: 'Fe(s)', coefficient: 4 },
        { species: 'O2(g)', coefficient: 3 },
      ],
      products: [{ species: 'Fe2O3(s)', coefficient: 2 }],
    }
    expect(reactionEnthalpyFromFormation(oxidation)).toBeCloseTo(-1648.4, 1)
  })

  it('rejects a species missing from Table 5.2 and the reference states', () => {
    expect(() =>
      reactionEnthalpyFromFormation({
        label: 'bad',
        reactants: [{ species: 'Xe(g)', coefficient: 1 }],
        products: [{ species: 'H2(g)', coefficient: 1 }],
      }),
    ).toThrow(RangeError)
  })
})
