import { describe, expect, it } from 'vitest'
import {
  boilingTemperatureC,
  dynamicEquilibrium,
  henryConcentration,
  approachSealedEquilibrium,
  waterVapourPressureBar,
  waterVapourPressureMmHg,
} from './physical-equilibrium'

describe('vapour pressure of water (Section 6.1.2, Antoine equation)', () => {
  it('gives about 760 mmHg at 100 °C', () => {
    expect(waterVapourPressureMmHg(100)).toBeCloseTo(760, -1)
  })

  it('gives about 23.8 mmHg at 25 °C', () => {
    expect(waterVapourPressureMmHg(25)).toBeCloseTo(23.8, 0)
  })

  it('rises with temperature', () => {
    expect(waterVapourPressureMmHg(60)).toBeGreaterThan(waterVapourPressureMmHg(40))
  })

  it('converts to bar with 750.06 mmHg per bar', () => {
    expect(waterVapourPressureBar(100)).toBeCloseTo(760 / 750.062, 1)
  })

  it('rejects temperatures outside the Antoine range of 1 to 100 °C', () => {
    expect(() => waterVapourPressureMmHg(120)).toThrow(RangeError)
  })
})

describe('boiling point against pressure (NCERT normal and standard boiling points)', () => {
  it('gives about 99.6 °C at 1 bar (the standard boiling point)', () => {
    expect(boilingTemperatureC(1)).toBeCloseTo(99.6, 0)
  })

  it('gives about 100 °C at 1 atm (1.01325 bar, the normal boiling point)', () => {
    expect(boilingTemperatureC(1.01325)).toBeCloseTo(100, 0)
  })

  it('inverts the vapour pressure function', () => {
    const p = waterVapourPressureBar(80)
    expect(boilingTemperatureC(p)).toBeCloseTo(80, 4)
  })

  it('rejects a non-positive pressure', () => {
    expect(() => boilingTemperatureC(0)).toThrow(RangeError)
  })
})

describe("Henry's law (gas solubility, Section 6.1)", () => {
  it('gives c = kH × p', () => {
    expect(henryConcentration(0.034, 2)).toBeCloseTo(0.068, 12)
  })

  it('rejects a negative pressure', () => {
    expect(() => henryConcentration(0.034, -1)).toThrow(RangeError)
  })
})

describe('dynamic evaporation and condensation in a sealed container', () => {
  it('has condensation equal to evaporation at the equilibrium vapour pressure', () => {
    const state = dynamicEquilibrium({ evaporationRate: 2, condensationConstant: 4, vapourPressure: 0.5 })
    expect(state.condensation).toBeCloseTo(state.evaporation, 12)
    expect(state.net).toBeCloseTo(0, 12)
  })

  it('evaporates faster than it condenses when the vapour is thinner than equilibrium', () => {
    const state = dynamicEquilibrium({ evaporationRate: 2, condensationConstant: 4, vapourPressure: 0.1 })
    expect(state.net).toBeGreaterThan(0)
  })

  it('approaches p* = evaporation / condensation from zero vapour', () => {
    const series = approachSealedEquilibrium({
      evaporationRate: 2,
      condensationConstant: 4,
      initialVapour: 0,
      dt: 0.01,
      steps: 5000,
    })
    expect(series[series.length - 1].vapourPressure).toBeCloseTo(0.5, 3)
    expect(series[0].vapourPressure).toBe(0)
  })

  it('rejects a non-positive rate constant', () => {
    expect(() => dynamicEquilibrium({ evaporationRate: 0, condensationConstant: 4, vapourPressure: 1 })).toThrow(RangeError)
  })
})
