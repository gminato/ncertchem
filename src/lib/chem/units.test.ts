import { describe, expect, it } from 'vitest'
import {
  G_EARTH,
  G_MOON,
  applyUnitFactors,
  celsiusToFahrenheit,
  celsiusToKelvin,
  fahrenheitToCelsius,
  gPerCm3ToKgPerM3,
  kelvinToCelsius,
  weightNewton,
} from './units'

const close = (actual: number, expected: number) => expect(actual).toBeCloseTo(expected, 9)

describe('temperature scales (NCERT 1.3.7)', () => {
  it('uses K = °C + 273.15', () => {
    close(celsiusToKelvin(0), 273.15)
    close(celsiusToKelvin(37), 310.15)
    close(celsiusToKelvin(100), 373.15)
    close(celsiusToKelvin(-273.15), 0)
  })

  it('uses °F = 9/5 °C + 32', () => {
    close(celsiusToFahrenheit(0), 32)
    close(celsiusToFahrenheit(37), 98.6)
    close(celsiusToFahrenheit(100), 212)
  })

  it('-40 is the one value where °C and °F agree', () => {
    close(celsiusToFahrenheit(-40), -40)
    close(fahrenheitToCelsius(-40), -40)
  })

  it('inverse conversions round-trip', () => {
    close(kelvinToCelsius(celsiusToKelvin(25)), 25)
    close(fahrenheitToCelsius(celsiusToFahrenheit(25)), 25)
  })
})

describe('weight and mass (NCERT 1.3.4)', () => {
  it('weight is mass times gravitational acceleration', () => {
    close(weightNewton(60, G_EARTH), 588)
    close(weightNewton(60, G_MOON), 97.2)
  })

  it('the Moon weight is the Earth weight scaled by the ratio of g values', () => {
    close(weightNewton(60, G_MOON) / weightNewton(60, G_EARTH), G_MOON / G_EARTH)
  })
})

describe('density and unit factors (NCERT 1.3.6, 1.4.3)', () => {
  it('converts g cm⁻³ to kg m⁻³', () => {
    close(gPerCm3ToKgPerM3(1), 1000)
    close(gPerCm3ToKgPerM3(7.9), 7900)
  })

  it('applies unit factors one step at a time', () => {
    expect(applyUnitFactors(2.5, [60, 60])).toEqual([2.5, 150, 9000])
    expect(applyUnitFactors(3, [])).toEqual([3])
  })
})
