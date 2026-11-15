import { describe, expect, it } from 'vitest'
import {
  deltaNGas,
  extentVerdict,
  kcExpression,
  kcFromConcentrations,
  kcFromKp,
  kpFromKc,
  kpFromPartialPressures,
  leChatelier,
  predictDirection,
  reactionQuotient,
  solveIce,
  timeCourse,
  transformK,
  vantHoffK,
  type Reaction,
} from './equilibrium'
import { NCERT_TABLE_6_2_H2_I2_HI } from './ncert-unit6-tables'

const H2_I2_HI: Reaction = {
  reactants: [
    { species: 'H2', coefficient: 1, phase: 'g' },
    { species: 'I2', coefficient: 1, phase: 'g' },
  ],
  products: [{ species: 'HI', coefficient: 2, phase: 'g' }],
}

const N2_H2_NH3: Reaction = {
  reactants: [
    { species: 'N2', coefficient: 1, phase: 'g' },
    { species: 'H2', coefficient: 3, phase: 'g' },
  ],
  products: [{ species: 'NH3', coefficient: 2, phase: 'g' }],
}

const N2O4_NO2: Reaction = {
  reactants: [{ species: 'N2O4', coefficient: 1, phase: 'g' }],
  products: [{ species: 'NO2', coefficient: 2, phase: 'g' }],
}

const CO2_C_CO: Reaction = {
  reactants: [
    { species: 'CO2', coefficient: 1, phase: 'g' },
    { species: 'C', coefficient: 1, phase: 's' },
  ],
  products: [{ species: 'CO', coefficient: 2, phase: 'g' }],
}

const PCL5: Reaction = {
  reactants: [{ species: 'PCl5', coefficient: 1, phase: 'g' }],
  products: [
    { species: 'PCl3', coefficient: 1, phase: 'g' },
    { species: 'Cl2', coefficient: 1, phase: 'g' },
  ],
}

describe('kcExpression (Section 6.3, equation 6.4; Section 6.5 heterogeneous equilibria)', () => {
  it('puts products over reactants with the stoichiometric powers', () => {
    expect(kcExpression(N2_H2_NH3)).toEqual({
      numerator: [{ species: 'NH3', power: 2 }],
      denominator: [
        { species: 'N2', power: 1 },
        { species: 'H2', power: 3 },
      ],
    })
  })

  it('leaves out pure solids and liquids (heterogeneous equilibrium)', () => {
    const expression = kcExpression(CO2_C_CO)
    expect(expression.numerator).toEqual([{ species: 'CO', power: 2 }])
    expect(expression.denominator).toEqual([{ species: 'CO2', power: 1 }])
  })

  it('gives an expression with no denominator when every reactant is a solid', () => {
    const reaction: Reaction = {
      reactants: [{ species: 'C', coefficient: 1, phase: 's' }],
      products: [{ species: 'CO2', coefficient: 1, phase: 'g' }],
    }
    expect(kcExpression(reaction)).toEqual({ numerator: [{ species: 'CO2', power: 1 }], denominator: [] })
  })
})

describe('kcFromConcentrations and reaction quotient', () => {
  it('reproduces the constant 46.4 for all six experiments of Table 6.2 (Table 6.3)', () => {
    for (const row of NCERT_TABLE_6_2_H2_I2_HI.rows) {
      const kc = kcFromConcentrations(H2_I2_HI, {
        H2: row.equilibrium.h2 * 1e-2,
        I2: row.equilibrium.i2 * 1e-2,
        HI: row.equilibrium.hi * 1e-2,
      })
      // Experiment 2 gives 47.6 in NCERT's own Table 6.3, about 2.6 % above 46.4; allow 3 %.
      expect(kc / 46.4).toBeGreaterThan(0.97)
      expect(kc / 46.4).toBeLessThan(1.03)
    }
  })

  it('reproduces Problem 6.1 (Kc = 3.56 × 10², NCERT prints 3.55 × 10²)', () => {
    const kc = kcFromConcentrations(N2_H2_NH3, { N2: 1.5e-2, H2: 3.0e-2, NH3: 1.2e-2 })
    expect(kc).toBeCloseTo(355.6, 0)
  })

  it('reproduces Problem 6.2 (Kc = 0.622)', () => {
    const reaction: Reaction = {
      reactants: [
        { species: 'N2', coefficient: 1, phase: 'g' },
        { species: 'O2', coefficient: 1, phase: 'g' },
      ],
      products: [{ species: 'NO', coefficient: 2, phase: 'g' }],
    }
    expect(kcFromConcentrations(reaction, { N2: 3.0e-3, O2: 4.2e-3, NO: 2.8e-3 })).toBeCloseTo(0.622, 3)
  })

  it('treats the reaction quotient of a mixture with no products as zero', () => {
    expect(reactionQuotient(H2_I2_HI, { H2: 0.02, I2: 0.02, HI: 0 })).toBe(0)
  })

  it('treats the reaction quotient with a zero reactant as infinite', () => {
    expect(reactionQuotient(H2_I2_HI, { H2: 0, I2: 0.02, HI: 0.01 })).toBe(Number.POSITIVE_INFINITY)
  })

  it('rejects a negative concentration and a missing species', () => {
    expect(() => kcFromConcentrations(H2_I2_HI, { H2: -1, I2: 1, HI: 1 })).toThrow(RangeError)
    expect(() => kcFromConcentrations(H2_I2_HI, { H2: 1, HI: 1 })).toThrow(RangeError)
  })
})

describe('Kp, Kc and Δn (equations 6.12 to 6.15)', () => {
  it('evaluates Kp from partial pressures with the same expression', () => {
    expect(kpFromPartialPressures(N2O4_NO2, { N2O4: 0.81, NO2: 8.34 })).toBeCloseTo(85.87, 1)
  })

  it('counts Δn over gaseous species only', () => {
    expect(deltaNGas(N2_H2_NH3)).toBe(-2)
    expect(deltaNGas(H2_I2_HI)).toBe(0)
    expect(deltaNGas(N2O4_NO2)).toBe(1)
    expect(deltaNGas(CO2_C_CO)).toBe(1)
  })

  it('converts Kc to Kp with R = 0.0831 bar L mol⁻¹ K⁻¹ and Kp = Kc(RT)^Δn', () => {
    // Problem 6.5: Kc = 3.75 × 10⁻⁶ at 1069 K for 2NOCl ⇌ 2NO + Cl2 (Δn = +1).
    expect(kpFromKc(3.75e-6, 1, 1069)).toBeCloseTo(3.33e-4, 6)
  })

  it('reproduces Problem 6.8: Kp = 85.87 at 400 K gives Kc ≈ 2.58 (NCERT prints 2.6)', () => {
    expect(kcFromKp(85.87, 1, 400)).toBeCloseTo(2.58, 2)
  })

  it('round-trips Kc to Kp and back', () => {
    const kp = kpFromKc(0.0396, -2, 500)
    expect(kcFromKp(kp, -2, 500)).toBeCloseTo(0.0396, 10)
  })

  it('rejects a non-positive temperature or constant', () => {
    expect(() => kpFromKc(1, 1, 0)).toThrow(RangeError)
    expect(() => kcFromKp(-1, 1, 300)).toThrow(RangeError)
  })
})

describe('transformK (Table 6.4)', () => {
  it('takes the inverse when the reaction is reversed', () => {
    expect(transformK(46.4, 'reverse')).toBeCloseTo(1 / 46.4, 12)
  })

  it('raises K to the power n when coefficients are multiplied by n', () => {
    expect(transformK(46.4, { multiplyBy: 2 })).toBeCloseTo(46.4 ** 2, 6)
  })

  it('takes the n-th root when coefficients are divided by n', () => {
    expect(transformK(46.4, { divideBy: 2 })).toBeCloseTo(Math.sqrt(46.4), 12)
  })

  it('rejects a non-positive K or a multiplier below 1', () => {
    expect(() => transformK(0, 'reverse')).toThrow(RangeError)
    expect(() => transformK(2, { multiplyBy: 0 })).toThrow(RangeError)
  })
})

describe('predictDirection and extentVerdict (Sections 6.6.1 and 6.6.2)', () => {
  it('predicts reverse when Q exceeds K (Problem 6.7)', () => {
    expect(predictDirection(1, 2e-3)).toBe('reverse')
  })

  it('predicts forward when Q is below K', () => {
    expect(predictDirection(1e-3, 2e-3)).toBe('forward')
  })

  it('reports equilibrium when Q equals K', () => {
    expect(predictDirection(46.4, 46.4)).toBe('at equilibrium')
  })

  it('uses the 10³ and 10⁻³ thresholds for the extent of reaction', () => {
    expect(extentVerdict(1e5)).toBe('products-predominate')
    expect(extentVerdict(1e-5)).toBe('reactants-predominate')
    expect(extentVerdict(1)).toBe('appreciable-both')
  })
})

describe('solveIce (Section 6.6.3)', () => {
  it('reproduces Problem 6.4 (CO + H2O ⇌ CO2 + H2, Kc = 4.24, 0.10 M each)', () => {
    const reaction: Reaction = {
      reactants: [
        { species: 'CO', coefficient: 1, phase: 'g' },
        { species: 'H2O', coefficient: 1, phase: 'g' },
      ],
      products: [
        { species: 'CO2', coefficient: 1, phase: 'g' },
        { species: 'H2', coefficient: 1, phase: 'g' },
      ],
    }
    const table = solveIce(reaction, { CO: 0.1, H2O: 0.1, CO2: 0, H2: 0 }, 4.24, { basis: 'concentration' })
    expect(table.equilibrium.CO2).toBeCloseTo(0.067, 3)
    expect(table.equilibrium.H2).toBeCloseTo(0.067, 3)
    expect(table.equilibrium.CO).toBeCloseTo(0.033, 3)
    expect(table.equilibrium.H2O).toBeCloseTo(0.033, 3)
  })

  it('reproduces Problem 6.9 (PCl5 3.00 M, Kc = 1.80)', () => {
    const table = solveIce(PCL5, { PCl5: 3, PCl3: 0, Cl2: 0 }, 1.8, { basis: 'concentration' })
    expect(table.equilibrium.PCl3).toBeCloseTo(1.59, 2)
    expect(table.equilibrium.Cl2).toBeCloseTo(1.59, 2)
    expect(table.equilibrium.PCl5).toBeCloseTo(1.41, 2)
  })

  it('reproduces Problem 6.6 by pressure (CO2 + C(s) ⇌ 2CO, Kp = 3.0, p(CO2) = 0.48 bar)', () => {
    const table = solveIce(CO2_C_CO, { CO2: 0.48, CO: 0 }, 3.0, { basis: 'pressure' })
    expect(table.equilibrium.CO).toBeCloseTo(0.665, 2)
    expect(table.equilibrium.CO2).toBeCloseTo(0.147, 2)
  })

  it('starts from products only, as in Table 6.2 experiment 5 (direction reverses)', () => {
    const experiment5 = NCERT_TABLE_6_2_H2_I2_HI.rows[4]
    const table = solveIce(
      H2_I2_HI,
      { H2: 0, I2: 0, HI: experiment5.initial.hi * 1e-2 },
      46.4,
      { basis: 'concentration' }
    )
    expect(table.equilibrium.H2).toBeCloseTo(0.345e-2, 4)
    expect(table.equilibrium.I2).toBeCloseTo(0.345e-2, 4)
    expect(table.equilibrium.HI).toBeCloseTo(2.35e-2, 4)
  })

  it('reproduces experiment 1 of Table 6.2 from its initial composition', () => {
    const table = solveIce(H2_I2_HI, { H2: 2.4e-2, I2: 1.38e-2, HI: 0 }, 46.4, { basis: 'concentration' })
    expect(table.equilibrium.H2).toBeCloseTo(1.14e-2, 4)
    expect(table.equilibrium.I2).toBeCloseTo(0.12e-2, 4)
    expect(table.equilibrium.HI).toBeCloseTo(2.52e-2, 4)
  })

  it('returns the I, C and E rows, with the change equal to the stoichiometry times the extent', () => {
    const table = solveIce(H2_I2_HI, { H2: 0.02, I2: 0.02, HI: 0 }, 46.4, { basis: 'concentration' })
    expect(table.change.HI).toBeCloseTo(-2 * table.change.H2, 12)
    expect(table.equilibrium.HI).toBeCloseTo(table.initial.HI + table.change.HI, 12)
    expect(table.extent).toBeCloseTo(table.change.H2 * -1, 12)
    expect(table.initial).toEqual({ H2: 0.02, I2: 0.02, HI: 0 })
  })

  it('returns the starting state unchanged when it is already at equilibrium', () => {
    const table = solveIce(H2_I2_HI, { H2: 0.0114, I2: 0.0012, HI: 0.0252 }, 46.4, { basis: 'concentration' })
    expect(table.extent).toBeCloseTo(0, 6)
  })

  it('never produces a negative amount, even when the constant is very large', () => {
    const table = solveIce(H2_I2_HI, { H2: 1, I2: 1, HI: 0 }, 1e12, { basis: 'concentration' })
    for (const value of Object.values(table.equilibrium)) {
      expect(value).toBeGreaterThanOrEqual(0)
    }
    expect(table.equilibrium.H2).toBeLessThan(1e-5)
  })

  it('rejects a negative initial amount or a non-positive K', () => {
    expect(() => solveIce(H2_I2_HI, { H2: -1, I2: 1, HI: 0 }, 1, { basis: 'concentration' })).toThrow(RangeError)
    expect(() => solveIce(H2_I2_HI, { H2: 1, I2: 1, HI: 0 }, 0, { basis: 'concentration' })).toThrow(RangeError)
  })
})

describe('timeCourse (mass-action kinetics, Figures 6.4 and 6.5)', () => {
  const kf = 1
  const kr = 1 / 46.4
  const tEnd = 2000
  const steps = 20000

  it('converges to the equilibrium of solveIce when starting from the reactants', () => {
    const initial = { H2: 0.024, I2: 0.0138, HI: 0 }
    const curve = timeCourse(H2_I2_HI, initial, kf, kr, tEnd, steps)
    const last = curve[curve.length - 1].concentrations
    const expected = solveIce(H2_I2_HI, initial, 46.4, { basis: 'concentration' }).equilibrium
    expect(last.H2).toBeCloseTo(expected.H2, 4)
    expect(last.HI).toBeCloseTo(expected.HI, 4)
  })

  it('converges from the products side to the same Kc', () => {
    const initial = { H2: 0, I2: 0, HI: 0.0758 }
    const curve = timeCourse(H2_I2_HI, initial, kf, kr, tEnd, steps)
    const last = curve[curve.length - 1].concentrations
    expect(kcFromConcentrations(H2_I2_HI, last)).toBeCloseTo(46.4, 0)
    const expected = solveIce(H2_I2_HI, initial, 46.4, { basis: 'concentration' }).equilibrium
    expect(last.H2).toBeCloseTo(expected.H2, 4)
  })

  it('starts at the initial state and returns steps + 1 samples', () => {
    const curve = timeCourse(H2_I2_HI, { H2: 0.02, I2: 0.02, HI: 0 }, kf, kr, 1, 10)
    expect(curve).toHaveLength(11)
    expect(curve[0].time).toBe(0)
    expect(curve[0].concentrations.H2).toBeCloseTo(0.02, 12)
  })

  it('rejects a non-positive rate constant or a non-integer step count', () => {
    expect(() => timeCourse(H2_I2_HI, { H2: 1, I2: 1, HI: 0 }, 0, 1, 1, 10)).toThrow(RangeError)
    expect(() => timeCourse(H2_I2_HI, { H2: 1, I2: 1, HI: 0 }, 1, 1, 1, 0)).toThrow(RangeError)
  })
})

describe('vantHoffK (equation 6.20 style, ΔH° in kJ mol⁻¹)', () => {
  it('returns the same K at the same temperature', () => {
    expect(vantHoffK(6.8e5, 298, 298, -92.38)).toBeCloseTo(6.8e5, 3)
  })

  it('lowers K for an exothermic reaction when heated (N2 + 3H2 ⇌ 2NH3)', () => {
    const k400 = vantHoffK(6.8e5, 298, 400, -92.38)
    expect(k400).toBeLessThan(6.8e5)
    // NCERT Table 6.5 gives 41 at 400 K; the integrated van 't Hoff form is within a factor of 2.
    expect(k400 / 41).toBeGreaterThan(0.5)
    expect(k400 / 41).toBeLessThan(2)
  })

  it('raises K for an endothermic reaction when heated', () => {
    expect(vantHoffK(1e-3, 300, 350, 50)).toBeGreaterThan(1e-3)
  })

  it('rejects a non-positive temperature', () => {
    expect(() => vantHoffK(1, 0, 300, 10)).toThrow(RangeError)
  })
})

describe('leChatelier (Section 6.8)', () => {
  // Problem 6.1 composition, Kc = 355.6 for N2 + 3H2 ⇌ 2NH3 at 500 K.
  const haberEquilibrium = { N2: 1.5e-2, H2: 3.0e-2, NH3: 1.2e-2 }
  const haberState = {
    reaction: N2_H2_NH3,
    equilibrium: haberEquilibrium,
    k: kcFromConcentrations(N2_H2_NH3, haberEquilibrium),
  }

  // Table 6.2 experiment 1 composition, Kc = 46.4 for H2 + I2 ⇌ 2HI at 731 K.
  // K is taken from the composition itself so that the state is exactly at equilibrium.
  const hiEquilibrium = { H2: 1.14e-2, I2: 0.12e-2, HI: 2.52e-2 }
  const hiState = {
    reaction: H2_I2_HI,
    equilibrium: hiEquilibrium,
    k: kcFromConcentrations(H2_I2_HI, hiEquilibrium),
  }

  // 2NO2 ⇌ N2O4 family: N2O4 ⇌ 2NO2 with Kc = 0.02² / 0.04 = 0.01.
  const colourState = {
    reaction: N2O4_NO2,
    equilibrium: { N2O4: 0.04, NO2: 0.02 },
    k: 0.01,
  }

  it('shows no shift when H2 + I2 ⇌ 2HI is compressed (Δn = 0)', () => {
    const result = leChatelier(hiState, { kind: 'volume', factor: 0.5 })
    expect(result.shift).toBe('none')
    // Halving the volume doubles every concentration; no shift means HI doubles too.
    expect(result.equilibrium.HI).toBeCloseTo(5.04e-2, 4)
  })

  it('shifts N2 + 3H2 ⇌ 2NH3 to the right when the mixture is compressed', () => {
    const result = leChatelier(haberState, { kind: 'volume', factor: 0.5 })
    expect(result.shift).toBe('right')
    expect(result.equilibrium.NH3).toBeGreaterThan(haberState.equilibrium.NH3)
  })

  it('shifts H2 + I2 ⇌ 2HI to the right when H2 is added', () => {
    const result = leChatelier(hiState, { kind: 'add', species: 'H2', amount: 1e-2 })
    expect(result.shift).toBe('right')
    expect(result.immediateQ).toBeLessThan(hiState.k)
    expect(result.equilibrium.HI).toBeGreaterThan(hiState.equilibrium.HI)
  })

  it('shifts left when a product is added', () => {
    const result = leChatelier(hiState, { kind: 'add', species: 'HI', amount: 1e-2 })
    expect(result.shift).toBe('left')
  })

  it('shifts N2O4 ⇌ 2NO2 to the left when compressed, so the brown colour fades', () => {
    const result = leChatelier(colourState, { kind: 'volume', factor: 0.5 })
    expect(result.shift).toBe('left')
    // Right after compression NO2 is 0.04 M; the shift brings it back down.
    expect(result.equilibrium.NO2).toBeLessThan(0.04)
  })

  it('shifts N2O4 ⇌ 2NO2 to the right when an inert gas is added at constant pressure', () => {
    const result = leChatelier(colourState, { kind: 'inert-constant-pressure', amount: 0.2 })
    expect(result.shift).toBe('right')
  })

  it('shows no shift when an inert gas is added at constant volume', () => {
    const result = leChatelier(colourState, { kind: 'inert-constant-volume', amount: 0.2 })
    expect(result.shift).toBe('none')
    expect(result.equilibrium.NO2).toBeCloseTo(0.02, 6)
  })

  it('shifts N2 + 3H2 ⇌ 2NH3 to the left when heated (ΔH° = −92.38 kJ mol⁻¹)', () => {
    const result = leChatelier(haberState, {
      kind: 'temperature',
      fromK: 500,
      toK: 600,
      deltaHkJ: -92.38,
    })
    expect(result.shift).toBe('left')
    expect(result.k).toBeLessThan(haberState.k)
  })

  it('does not shift for a catalyst, which changes only the rate', () => {
    const result = leChatelier(haberState, { kind: 'catalyst' })
    expect(result.shift).toBe('none')
    expect(result.k).toBe(haberState.k)
    for (const name of Object.keys(haberState.equilibrium)) {
      expect(result.equilibrium[name]).toBeCloseTo(haberState.equilibrium[name as keyof typeof haberState.equilibrium], 10)
    }
  })

  it('rejects a removal larger than the amount present, and an unknown species', () => {
    expect(() => leChatelier(hiState, { kind: 'remove', species: 'H2', amount: 1 })).toThrow(RangeError)
    expect(() => leChatelier(hiState, { kind: 'add', species: 'CH4', amount: 1 })).toThrow(RangeError)
  })
})

describe('solveIce and timeCourse agree on a shared constant', () => {
  it('gives an equilibrium that satisfies its own constant', () => {
    const table = solveIce(N2O4_NO2, { N2O4: 0.1, NO2: 0 }, 0.01, { basis: 'concentration' })
    expect(reactionQuotient(N2O4_NO2, table.equilibrium)).toBeCloseTo(0.01, 8)
  })
})
