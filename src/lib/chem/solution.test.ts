import { describe, expect, it } from 'vitest'
import {
  molalityOfSolution,
  molarityAtTemperature,
  solutionDensity,
  solutionVolumeLitres,
  waterDensity,
} from './solution'

describe('waterDensity', () => {
  it('matches the tabulated values at table points', () => {
    expect(waterDensity(4)).toBeCloseTo(0.99997, 5)
    expect(waterDensity(25)).toBeCloseTo(0.99704, 5)
    expect(waterDensity(80)).toBeCloseTo(0.97179, 5)
  })

  it('interpolates between table points', () => {
    expect(waterDensity(22.5)).toBeCloseTo((0.9982 + 0.99704) / 2, 5)
  })

  it('falls as water warms above 4 °C', () => {
    expect(waterDensity(25)).toBeLessThan(waterDensity(4))
    expect(waterDensity(80)).toBeLessThan(waterDensity(25))
  })

  it('rejects temperatures outside liquid water', () => {
    expect(() => waterDensity(-1)).toThrow(RangeError)
    expect(() => waterDensity(101)).toThrow(RangeError)
  })
})

describe('solution density and volume', () => {
  it('equals the stated density at 25 °C and scales with water between temperatures', () => {
    expect(solutionDensity(1.02, 25)).toBeCloseTo(1.02, 9)
    expect(solutionDensity(1.02, 80)).toBeCloseTo((1.02 * 0.97179) / 0.99704, 9)
  })

  it('volume is total mass divided by density', () => {
    const v = solutionVolumeLitres(0.5, 58.5, 1, 1.02, 25)
    expect(v).toBeCloseTo((1000 + 0.5 * 58.5) / 1.02 / 1000, 9)
  })
})

describe('molarity and molality with temperature', () => {
  const n = 0.5
  const M_NaCl = 58.5
  const solventKg = 1
  const density25 = 1.02

  it('molarity falls as the solution is heated, because the volume grows', () => {
    const cool = molarityAtTemperature(n, M_NaCl, solventKg, density25, 25)
    const hot = molarityAtTemperature(n, M_NaCl, solventKg, density25, 80)
    expect(hot).toBeLessThan(cool)
  })

  it('molality is unchanged, since it uses only the mass of solvent', () => {
    expect(molalityOfSolution(n, solventKg)).toBe(0.5)
  })
})
