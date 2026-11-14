import { describe, expect, it } from 'vitest'
import {
  THERMOMETER_STEPS,
  levelForCelsius,
  readoutsFor,
  snapshotForStep,
} from './thermometer-steps'

describe('ThermometerTrio steps', () => {
  it('shows ice point, body temperature, boiling point and the crossover', () => {
    expect(THERMOMETER_STEPS.map((s) => s.celsius)).toEqual([0, 37, 100, -40])
  })

  it('reads 273.15 K, 32 °F at the ice point', () => {
    expect(readoutsFor(0)).toEqual({ c: '0 °C', k: '273.15 K', f: '32.0 °F' })
  })

  it('reads 310.15 K and 98.6 °F at body temperature', () => {
    expect(readoutsFor(37)).toEqual({ c: '37 °C', k: '310.15 K', f: '98.6 °F' })
  })

  it('reads 373.15 K and 212.0 °F at the boiling point', () => {
    expect(readoutsFor(100)).toEqual({ c: '100 °C', k: '373.15 K', f: '212.0 °F' })
  })

  it('uses a true minus sign and shows −40 on both °C and °F', () => {
    expect(readoutsFor(-40)).toEqual({ c: '−40 °C', k: '233.15 K', f: '−40.0 °F' })
  })

  it('maps temperature linearly to the column, from 0 at −40 °C to 1 at 110 °C', () => {
    expect(levelForCelsius(-40)).toBe(0)
    expect(levelForCelsius(110)).toBe(1)
    expect(levelForCelsius(35)).toBeCloseTo(0.5, 9)
  })

  it('clamps out-of-range steps', () => {
    expect(snapshotForStep(-3)).toEqual({ celsius: 0 })
    expect(snapshotForStep(99)).toEqual({ celsius: -40 })
  })
})
