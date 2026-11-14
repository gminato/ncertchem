/**
 * Moseley's X-ray relation for K-alpha lines (NCERT Class 11 Unit 3, section 3.3).
 *
 * Moseley plotted the square root of the X-ray frequency against atomic number and got a
 * straight line. The textbook approximation behind that line is
 *
 *   ν(Kα) = (3/4) · R∞ · c · (Z − 1)²
 *
 * so √ν = (Z − 1) · √(3R∞c / 4). The line therefore has a slope of √(3R∞c / 4) and crosses
 * zero at Z = 1. This is a computed approximation, not Moseley's measured data. R∞c is
 * taken from the site constants: RYDBERG_CM (cm⁻¹) converted to m⁻¹, times c = 3.0 × 10⁸ m s⁻¹.
 */

import { RYDBERG_CM, SPEED_OF_LIGHT } from './constants'

/** R∞c in hertz: the Rydberg constant as a frequency, from the site constants. */
export const RYDBERG_FREQUENCY_HZ = RYDBERG_CM * 100 * SPEED_OF_LIGHT

/** The K-alpha frequency factor (3/4)R∞c, in hertz. */
export const K_ALPHA_FACTOR_HZ = 0.75 * RYDBERG_FREQUENCY_HZ

function requireZ(Z: number): void {
  if (!Number.isInteger(Z) || Z < 2 || Z > 118) {
    throw new RangeError(`Atomic number Z must be an integer from 2 to 118 (received ${Z})`)
  }
}

/**
 * K-alpha frequency of element Z in hertz, from ν = (3/4) R∞c (Z − 1)².
 *
 * @throws {RangeError} If Z is not an integer from 2 to 118
 */
export function kAlphaFrequencyHz(Z: number): number {
  requireZ(Z)
  return K_ALPHA_FACTOR_HZ * (Z - 1) ** 2
}

/**
 * √(ν / Hz) for element Z, expressed in units of 10⁸ Hz^½ so the plotted numbers are
 * readable. Linear in Z: the value at Z is (Z − 1) times the slope.
 *
 * @throws {RangeError} If Z is not an integer from 2 to 118
 */
export function sqrtFrequencyScaled(Z: number): number {
  return Math.sqrt(kAlphaFrequencyHz(Z)) / 1e8
}

/** The slope of √(ν / 10⁸ Hz^½) against Z, which is √(3R∞c/4) in the same units. */
export const MOSELEY_SLOPE_SCALED = Math.sqrt(K_ALPHA_FACTOR_HZ) / 1e8

/**
 * The points of the Moseley line for Z from zMin to zMax inclusive.
 *
 * @throws {RangeError} If either end is not an integer from 2 to 118, or zMin > zMax
 */
export function moseleyLine(zMin: number, zMax: number): { Z: number; y: number }[] {
  requireZ(zMin)
  requireZ(zMax)
  if (zMin > zMax) throw new RangeError('zMin must not exceed zMax')
  const points: { Z: number; y: number }[] = []
  for (let Z = zMin; Z <= zMax; Z++) points.push({ Z, y: sqrtFrequencyScaled(Z) })
  return points
}
