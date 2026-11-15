import { describe, expect, it } from 'vitest'
import {
  gibbsPresets,
  kLadderRungs,
  log10KFromDeltaG,
  reactionEnthalpyFromTable,
  reactionEntropyFromStandard,
  workedKExample,
} from './gibbs-presets'

describe('Gibbs presets', () => {
  const byId = Object.fromEntries(gibbsPresets().map((p) => [p.id, p]))

  it('ice: ΔH = 6.01 kJ mol⁻¹ (Table 5.1) and ΔS ≈ 22.0 J K⁻¹ mol⁻¹ at 273.15 K', () => {
    expect(byId.ice.deltaHKJ).toBeCloseTo(6.01, 6)
    expect(byId.ice.deltaSJ).toBeCloseTo(22.0, 1)
  })

  it('CaCO3: ΔH = +178.32 kJ mol⁻¹ from Table 5.2, ΔS ≈ +160.6 J K⁻¹ mol⁻¹', () => {
    expect(byId.caco3.deltaHKJ).toBeCloseTo(178.32, 2)
    expect(byId.caco3.deltaSJ).toBeCloseTo(160.6, 1)
  })

  it('NH3: ΔH = −92.22 kJ mol⁻¹ (two moles of Table 5.2 NH3) and ΔS ≈ −198.1 J K⁻¹ mol⁻¹', () => {
    expect(byId.nh3.deltaHKJ).toBeCloseTo(-92.22, 2)
    expect(byId.nh3.deltaSJ).toBeCloseTo(-198.1, 1)
  })

  it('reaction sums use the coefficients on both sides', () => {
    expect(
      reactionEntropyFromStandard({
        label: 'x',
        reactants: [{ species: 'H2(g)', coefficient: 1 }],
        products: [{ species: 'H2(g)', coefficient: 2 }],
      })
    ).toBeCloseTo(130.68, 2)
    expect(
      reactionEnthalpyFromTable({
        label: 'x',
        reactants: [{ species: 'CO2(g)', coefficient: 1 }],
        products: [],
      })
    ).toBeCloseTo(393.51, 2)
  })
})

describe('K ladder and worked example', () => {
  it('one decade of K is about 5.7 kJ mol⁻¹ at 298 K, and the ends are ±57.0 kJ mol⁻¹', () => {
    const rungs = kLadderRungs(298)
    expect(rungs[0].exponent).toBe(10)
    expect(rungs[0].deltaGKJ).toBeCloseTo(-57.05, 1)
    expect(rungs[rungs.length - 1].deltaGKJ).toBeCloseTo(57.05, 1)
    expect(rungs[10].deltaGKJ).toBeCloseTo(0, 9)
  })

  it('log K round-trips with ΔG°', () => {
    expect(log10KFromDeltaG(-57.05, 298)).toBeCloseTo(10, 1)
  })

  it('worked example: ΔG = −16.0 kJ mol⁻¹ and K ≈ 1.2 × 10² at 400 K', () => {
    const w = workedKExample()
    expect(w.deltaGKJ).toBeCloseTo(-16, 9)
    expect(w.k).toBeGreaterThan(120)
    expect(w.k).toBeLessThan(125)
    expect(w.crossoverK).toBeCloseTo(666.7, 1)
  })
})
