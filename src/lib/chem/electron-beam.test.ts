import { describe, it, expect } from 'vitest'
import {
  beamPath,
  chargeToMassFromBalance,
  fieldExitPoint,
  magneticRadius,
  screenDeflection,
  thomsonScenario,
  type BeamSetup,
} from './electron-beam'
import { ELECTRON_CHARGE_TO_MASS } from './constants'

const scenario = thomsonScenario()
const setup: BeamSetup = {
  fieldLength: 0.02,
  screenDistance: 0.06,
  electricField: scenario.electricField,
  magneticField: scenario.magneticField,
  speed: scenario.speed,
}

describe('thomsonScenario', () => {
  it('chooses the speed so that the crossed fields balance (v = E / B)', () => {
    expect(scenario.speed).toBeCloseTo(scenario.electricField / scenario.magneticField, 3)
    expect(scenario.speed).toBeCloseTo(7.0e6, -2)
  })

  it('gives a magnetic radius of about 4 cm', () => {
    expect(scenario.radius).toBeGreaterThan(0.039)
    expect(scenario.radius).toBeLessThan(0.041)
  })

  it('uses the library charge-to-mass ratio', () => {
    expect(scenario.chargeToMass).toBe(ELECTRON_CHARGE_TO_MASS)
  })
})

describe('chargeToMassFromBalance', () => {
  it('recovers e/m from the field strengths and the measured radius', () => {
    const r = magneticRadius(scenario.speed, scenario.magneticField)
    const value = chargeToMassFromBalance(scenario.electricField, scenario.magneticField, r)
    expect(value / ELECTRON_CHARGE_TO_MASS).toBeCloseTo(1, 9)
  })

  it('rejects non-positive inputs', () => {
    expect(() => chargeToMassFromBalance(0, 1, 1)).toThrow(RangeError)
  })
})

describe('beamPath', () => {
  it('is a straight line when both fields are off', () => {
    for (const p of beamPath(setup, 0, 0)) expect(p.y).toBeCloseTo(0, 12)
  })

  it('bends towards the positive plate (up) under the electric field alone', () => {
    expect(screenDeflection(setup, 1, 0)).toBeGreaterThan(0)
  })

  it('matches the parabola y = (1/2)(e/m) E (L/v)^2 at the field exit', () => {
    const path = beamPath(setup, 1, 0)
    const exit = fieldExitPoint(path, setup.fieldLength)
    const expected = 0.5 * ELECTRON_CHARGE_TO_MASS * setup.electricField * (exit.x / setup.speed) ** 2
    expect(exit.y / expected).toBeCloseTo(1, 3)
  })

  it('bends towards the negative plate (down) under the magnetic field alone', () => {
    expect(screenDeflection(setup, 0, 1)).toBeLessThan(0)
  })

  it('follows a circle of radius r = mv/(eB) under the magnetic field alone', () => {
    const r = magneticRadius(setup.speed, setup.magneticField)
    const exit = fieldExitPoint(beamPath(setup, 0, 1), setup.fieldLength)
    const circle = r - Math.sqrt(r * r - exit.x * exit.x)
    expect(-exit.y / circle).toBeCloseTo(1, 3)
  })

  it('stays straight when the two fields balance (v = E/B)', () => {
    for (const p of beamPath(setup, 1, 1)) expect(Math.abs(p.y)).toBeLessThan(1e-9)
  })

  it('rejects non-positive geometry', () => {
    expect(() => beamPath({ ...setup, speed: 0 }, 1, 0)).toThrow(RangeError)
  })
})
