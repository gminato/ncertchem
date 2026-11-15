import { describe, expect, it } from 'vitest'
import { approachSealedEquilibrium, dynamicEquilibrium, waterVapourPressureMmHg } from './physical-equilibrium'
import {
  AIR_CO2_BAR,
  CO2_HENRY_298,
  co2HenryConstant,
  dissolvedCO2,
  relaxToEquilibrium,
  sealedApproach,
  sealedFraction,
  vapourPressureMmHg,
} from './sealed-container'

describe('vapour pressure by substance (Section 6.1.2)', () => {
  it('uses the water Antoine values for water', () => {
    expect(vapourPressureMmHg('water', 25)).toBeCloseTo(waterVapourPressureMmHg(25), 10)
  })

  it('gives about 760 mmHg for ethanol at its normal boiling point, 78.4 °C', () => {
    expect(vapourPressureMmHg('ethanol', 78.4)).toBeCloseTo(760, -1)
  })

  it('gives about 59 mmHg for ethanol at 25 °C', () => {
    expect(vapourPressureMmHg('ethanol', 25)).toBeCloseTo(58.8, 0)
  })

  it('gives 0.31 mmHg for iodine at its 25 °C anchor', () => {
    expect(vapourPressureMmHg('iodine', 25)).toBeCloseTo(0.31, 10)
  })

  it('rises with temperature for every substance', () => {
    for (const s of ['water', 'ethanol', 'iodine'] as const) {
      expect(vapourPressureMmHg(s, 60)).toBeGreaterThan(vapourPressureMmHg(s, 30))
    }
  })

  it('ranks the three at 25 °C: ethanol and water far above iodine', () => {
    expect(vapourPressureMmHg('ethanol', 25)).toBeGreaterThan(vapourPressureMmHg('water', 25) * 2)
    expect(vapourPressureMmHg('water', 25)).toBeGreaterThan(vapourPressureMmHg('iodine', 25) * 10)
  })

  it('rejects temperatures outside 1 to 100 °C', () => {
    expect(() => vapourPressureMmHg('ethanol', 120)).toThrow(RangeError)
    expect(() => vapourPressureMmHg('iodine', 0)).toThrow(RangeError)
  })
})

describe('sealed box approach to equilibrium', () => {
  it('starts from an empty box', () => {
    expect(sealedApproach(23.7, 0.5, 0)).toBe(0)
  })

  it('is within 1% of p* after 10 time constants', () => {
    expect(sealedApproach(23.7, 0.5, 20)).toBeCloseTo(23.7, 1)
  })

  it('agrees with the forward-Euler integration of the lib, to the step error', () => {
    const pStar = 23.7
    const kc = 0.5
    const euler = approachSealedEquilibrium({
      evaporationRate: kc * pStar,
      condensationConstant: kc,
      initialVapour: 0,
      dt: 0.001,
      steps: 4000,
    })
    const last = euler[euler.length - 1]
    expect(sealedApproach(pStar, kc, last.time)).toBeCloseTo(last.vapourPressure, 2)
  })

  it('has evaporation equal to condensation at p*, using the lib', () => {
    const pStar = 23.7
    const kc = 0.5
    const balance = dynamicEquilibrium({ evaporationRate: kc * pStar, condensationConstant: kc, vapourPressure: pStar })
    expect(balance.net).toBeCloseTo(0, 10)
  })

  it('gives a fraction of 0.5 at t = ln2 / kc', () => {
    expect(sealedFraction(0.5, Math.LN2 / 0.5)).toBeCloseTo(0.5, 10)
  })

  it('rejects a non-positive condensation constant', () => {
    expect(() => sealedApproach(1, 0, 1)).toThrow(RangeError)
  })
})

describe("Henry's law for CO₂ in a sealed bottle", () => {
  it('uses kH = 0.034 mol L⁻¹ bar⁻¹ at 25 °C', () => {
    expect(co2HenryConstant(25)).toBeCloseTo(CO2_HENRY_298, 2)
  })

  it('dissolves more CO₂ at a lower temperature', () => {
    expect(co2HenryConstant(5)).toBeGreaterThan(co2HenryConstant(25))
  })

  it('gives about 0.10 mol L⁻¹ in a bottle at 3 bar and 25 °C', () => {
    expect(dissolvedCO2(25, 3)).toBeCloseTo(0.102, 3)
  })

  it('falls about 7000-fold in air, from 3 bar to the air partial pressure', () => {
    const sealed = dissolvedCO2(25, 3)
    const open = dissolvedCO2(25, AIR_CO2_BAR)
    expect(sealed / open).toBeGreaterThan(5000)
    expect(sealed / open).toBeLessThan(10000)
  })

  it('relaxes from the sealed value to the new equilibrium', () => {
    const c0 = dissolvedCO2(25, 3)
    const cEq = dissolvedCO2(25, AIR_CO2_BAR)
    expect(relaxToEquilibrium(c0, cEq, 0, 1.5)).toBeCloseTo(c0, 12)
    expect(relaxToEquilibrium(c0, cEq, 60, 1.5)).toBeCloseTo(cEq, 6)
  })
})

describe('iodine vapour pressure (approximate)', () => {
  it('rises by about 15 mmHg at 80 °C', () => {
    expect(vapourPressureMmHg('iodine', 80)).toBeGreaterThan(10)
    expect(vapourPressureMmHg('iodine', 80)).toBeLessThan(25)
  })
})
