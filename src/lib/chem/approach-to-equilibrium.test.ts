import { describe, expect, it } from 'vitest'
import {
  SPEED_CHOICES,
  approachPresets,
  concentrationsAt,
  kcFromTable62,
  meanKcFromTable62,
  rateConstants,
  ratesOf,
  runApproach,
  settledTimeOf,
  tableKp,
  timeReaching,
} from './approach-to-equilibrium'
import { kcFromConcentrations, reactionQuotient } from './equilibrium'

const presets = approachPresets()
const byId = (id: string) => {
  const preset = presets.find((p) => p.id === id)
  if (!preset) throw new Error(`no preset ${id}`)
  return preset
}

describe('equilibrium constants for the presets', () => {
  it('takes Kc for H2 + I2 as the mean of the six Table 6.2 experiments', () => {
    const values = kcFromTable62()
    expect(values).toHaveLength(6)
    const mean = values.reduce((a, b) => a + b, 0) / values.length
    expect(byId('h2-i2').k).toBeCloseTo(mean, 12)
    expect(meanKcFromTable62()).toBeCloseTo(mean, 12)
  })

  it('converts Table 6.5 Kp values to Kc with Kc = Kp (RT)^(−Δn)', () => {
    // N2O4 ⇌ 2NO2: Δn = +1, so Kc = Kp / (RT)
    expect(byId('n2o4').k).toBeCloseTo(47.9 / (0.0831 * 400), 9)
    // N2 + 3H2 ⇌ 2NH3: Δn = −2, so Kc = Kp (RT)²
    expect(byId('nh3').k).toBeCloseTo(3.6e-2 * (0.0831 * 500) ** 2, 9)
    // 2SO2 + O2 ⇌ 2SO3: Δn = −1, so Kc = Kp (RT)
    expect(byId('so3').k).toBeCloseTo(3.0e4 * (0.0831 * 700), 3)
  })

  it('reads the printed Kp values from Table 6.5', () => {
    expect(tableKp('N2O4(g) ⇌ 2NO2(g)', 400)).toBe(47.9)
    expect(() => tableKp('N2O4(g) ⇌ 2NO2(g)', 123)).toThrow(RangeError)
  })

  it('starts each product mixture with the same atoms as its reactant mixture', () => {
    // H2 + I2: 0.02 + 0.02 mol L⁻¹ of H2 and I2 holds 0.04 of H and 0.04 of I; 0.04 HI holds the same
    expect(byId('h2-i2').fromProducts.HI).toBeCloseTo(2 * byId('h2-i2').fromReactants.H2, 12)
    // N2O4 → 2NO2: N atoms 2 × 0.05 = 0.1 = NO2 0.1
    expect(byId('n2o4').fromProducts.NO2).toBeCloseTo(2 * byId('n2o4').fromReactants.N2O4, 12)
    // N2 + 3H2 → 2NH3: N2 0.5 gives 1.0 N; H2 1.5 gives 3.0 H; NH3 1.0 gives 1.0 N and 3.0 H
    expect(byId('nh3').fromProducts.NH3).toBeCloseTo(2 * byId('nh3').fromReactants.N2, 12)
    expect(byId('nh3').fromReactants.H2).toBeCloseTo(3 * byId('nh3').fromReactants.N2, 12)
    // 2SO2 + O2 → 2SO3: SO2 0.1 gives 0.1 SO3
    expect(byId('so3').fromProducts.SO3).toBeCloseTo(byId('so3').fromReactants.SO2, 12)
  })
})

describe('rate constants and the time course', () => {
  it('sets kr = kf / K so that the mass-action equilibrium has the constant K', () => {
    for (const p of presets) {
      for (const speed of SPEED_CHOICES) {
        const { kf, kr } = rateConstants(p, speed)
        expect(kf / kr).toBeCloseTo(p.k, 9)
      }
    }
  })

  it('rejects a non-positive speed', () => {
    expect(() => rateConstants(byId('h2-i2'), 0)).toThrow(RangeError)
  })

  it('reaches the solveIce equilibrium from reactants and from products, and Q ends at K', () => {
    for (const p of presets) {
      for (const start of [p.fromReactants, p.fromProducts]) {
        const run = runApproach(p, start, 1)
        const last = run.samples[run.samples.length - 1].concentrations
        for (const name of Object.keys(run.equilibrium.equilibrium)) {
          expect(Math.abs(last[name] - run.equilibrium.equilibrium[name])).toBeLessThan(0.01 * p.concMax)
        }
        const q = reactionQuotient(p.reaction, run.equilibrium.equilibrium)
        expect(q / p.k).toBeCloseTo(1, 6)
      }
    }
  })

  it('gives the same equilibrium from either side when the atoms match', () => {
    for (const p of presets) {
      const fromR = runApproach(p, p.fromReactants, 1).equilibrium.equilibrium
      const fromP = runApproach(p, p.fromProducts, 1).equilibrium.equilibrium
      for (const name of Object.keys(fromR)) {
        expect(fromP[name]).toBeCloseTo(fromR[name], 6)
      }
    }
  })

  it('has its default time window long enough for each preset to settle', () => {
    for (const p of presets) {
      const run = runApproach(p, p.fromReactants, 1)
      const settle = settledTimeOf(run, run.equilibrium.equilibrium, 0.01 * p.concMax)
      expect(settle).toBeLessThan(0.9 * p.tEnd)
    }
  })

  it('keeps the Kc of the H2 + I2 curves at 731 K, and the first sample at the initial amounts', () => {
    const p = byId('h2-i2')
    const run = runApproach(p, p.fromReactants, 1)
    expect(run.samples[0].concentrations).toEqual(p.fromReactants)
    expect(kcFromConcentrations(p.reaction, run.equilibrium.equilibrium)).toBeCloseTo(p.k, 6)
  })
})

describe('rates and interpolation helpers', () => {
  it('computes forward and reverse rates from the rate laws', () => {
    const p = byId('h2-i2')
    const rates = ratesOf(p, 100, 100 / p.k, { H2: 0.02, I2: 0.02, HI: 0 })
    expect(rates.forward).toBeCloseTo(0.04, 12)
    expect(rates.reverse).toBe(0)
  })

  it('reports equal rates at the equilibrium composition', () => {
    for (const p of presets) {
      const { kf, kr } = rateConstants(p, 1)
      const eq = runApproach(p, p.fromReactants, 1).equilibrium.equilibrium
      const rates = ratesOf(p, kf, kr, eq)
      expect(rates.forward / rates.reverse).toBeCloseTo(1, 6)
    }
  })

  it('interpolates concentrations between samples and finds a crossing time', () => {
    const p = byId('h2-i2')
    const run = runApproach(p, p.fromReactants, 1)
    const half = run.equilibrium.equilibrium.HI / 2
    const t = timeReaching(run.samples, 'HI', half)
    expect(t).toBeGreaterThan(0)
    expect(concentrationsAt(run.samples, t).HI).toBeCloseTo(half, 4)
    expect(concentrationsAt(run.samples, -1).HI).toBe(0)
  })
})
