import { describe, expect, it } from 'vitest'
import { rateState, ratesEqual } from '@/components/equilibrium/geometry'
import { waterVapourPressureMmHg } from '@/lib/chem/physical-equilibrium'
import {
  GAUGE_FULL_SCALE_MMHG,
  PHYSICAL_T_C,
  WATER_P_STAR_MMHG,
  physicalSteps,
  progressForFraction,
} from './physical-steps'

describe('physical equilibria Scrolly steps (Section 6.1)', () => {
  const steps = physicalSteps()

  it('has five Steps: sealed water, building up, equilibrium, open dish, sealed sugar', () => {
    expect(steps.map((s) => s.scene)).toEqual(['sealed-water', 'sealed-water', 'sealed-water', 'open-dish', 'sealed-sugar'])
  })

  it('takes the equilibrium pressure from the water Antoine lib at 25 °C', () => {
    expect(PHYSICAL_T_C).toBe(25)
    expect(WATER_P_STAR_MMHG).toBeCloseTo(waterVapourPressureMmHg(25), 10)
    expect(WATER_P_STAR_MMHG).toBeGreaterThan(23)
    expect(WATER_P_STAR_MMHG).toBeLessThan(24)
  })

  it('reads the dial at p* on the equilibrium Step and zero before any vapour', () => {
    expect(steps[0].pressureMmHg).toBe(0)
    expect(steps[2].pressureMmHg).toBeCloseTo(WATER_P_STAR_MMHG, 10)
    expect(steps[2].pressureMmHg!).toBeLessThanOrEqual(GAUGE_FULL_SCALE_MMHG)
  })

  it('has its condensation rate between 0 and the evaporation rate on the building-up Step', () => {
    const s = steps[1]
    const { forward, reverse } = rateState(s.rates.progress, s.rates)
    expect(reverse).toBeGreaterThan(0)
    expect(reverse).toBeLessThan(forward)
  })

  it('has equal rates only on the equilibrium and sugar Steps', () => {
    const equal = steps.map((s) => {
      const { forward, reverse } = rateState(s.rates.progress, s.rates)
      return ratesEqual(forward, reverse)
    })
    expect(equal).toEqual([false, false, true, false, true])
  })

  it('keeps the open dish far from equilibrium', () => {
    const s = steps[3]
    const { forward, reverse } = rateState(s.rates.progress, s.rates)
    expect(reverse / forward).toBeLessThan(0.2)
  })

  it('puts the reverse rate at the share p / p* of evaporation on the building-up Step', () => {
    const s = steps[1]
    const { forward, reverse } = rateState(s.rates.progress, s.rates)
    const fraction = s.pressureMmHg! / WATER_P_STAR_MMHG
    expect(reverse / forward).toBeCloseTo(fraction, 6)
  })
})

describe('progressForFraction', () => {
  it('inverts the ease-out cubic of RateBars', () => {
    for (const f of [0, 0.1, 0.5, 0.9, 1]) {
      const p = progressForFraction(f)
      const eased = 1 - (1 - p) ** 3
      expect(eased).toBeCloseTo(f, 10)
    }
  })

  it('clamps outside 0 to 1', () => {
    expect(progressForFraction(-0.2)).toBe(0)
    expect(progressForFraction(1.5)).toBe(1)
  })
})
