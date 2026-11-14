/**
 * Unit conversions used in NCERT Class 11 Unit 1, section 1.3 (temperature,
 * mass and weight, density, unit factors).
 */

/**
 * Offset between the Celsius and kelvin scales: K = °C + 273.15.
 * NCERT gives this relationship with 273.15; this site uses that value only.
 */
export const KELVIN_OFFSET = 273.15

/**
 * Surface gravitational acceleration at Earth, in m s⁻². Rounded to one decimal
 * place for teaching. This is not an NCERT value.
 */
export const G_EARTH = 9.8

/**
 * Surface gravitational acceleration at the Moon, in m s⁻². An approximate,
 * commonly quoted value. This is not an NCERT value.
 */
export const G_MOON = 1.62

/** Kelvin from degrees Celsius: K = °C + 273.15. */
export function celsiusToKelvin(celsius: number): number {
  return celsius + KELVIN_OFFSET
}

/** Degrees Celsius from kelvin: °C = K − 273.15. */
export function kelvinToCelsius(kelvin: number): number {
  return kelvin - KELVIN_OFFSET
}

/** Degrees Fahrenheit from degrees Celsius: °F = (9/5)·°C + 32. */
export function celsiusToFahrenheit(celsius: number): number {
  return (9 * celsius) / 5 + 32
}

/** Degrees Celsius from degrees Fahrenheit: °C = (5/9)·(°F − 32). */
export function fahrenheitToCelsius(fahrenheit: number): number {
  return ((fahrenheit - 32) * 5) / 9
}

/**
 * Weight in newtons from mass in kilograms and gravitational acceleration in
 * m s⁻²: W = m × g. Mass does not change with g; weight does.
 */
export function weightNewton(massKg: number, gMetresPerSecondSquared: number): number {
  return massKg * gMetresPerSecondSquared
}

/** Density in kg m⁻³ from a value in g cm⁻³: 1 g cm⁻³ = 10⁻³ kg / 10⁻⁶ m³ = 1000 kg m⁻³. */
export function gPerCm3ToKgPerM3(density: number): number {
  return density * 1000
}

/**
 * Running values of a conversion done one unit factor at a time. The first
 * entry is the starting value; each later entry multiplies the one before by
 * the next factor. For 2.5 h, factors [60, 60]: [2.5, 150, 9000].
 */
export function applyUnitFactors(start: number, factors: readonly number[]): number[] {
  const values = [start]
  for (const factor of factors) {
    values.push(values[values.length - 1] * factor)
  }
  return values
}
