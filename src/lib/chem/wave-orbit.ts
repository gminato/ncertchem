import { ELECTRON_MASS_KG, PLANCK } from './constants'
import { orbitRadiusPm } from './bohr'

function requirePositive(value: number, name: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${name} must be a positive finite number (received ${value})`)
  }
}

/**
 * Circumference of the n-th Bohr orbit of hydrogen, in picometres: 2π rₙ.
 *
 * @throws {RangeError} If n is not a positive integer
 */
export function orbitCircumferencePm(n: number): number {
  return 2 * Math.PI * orbitRadiusPm(n)
}

/**
 * Speed of the electron in the n-th Bohr orbit of hydrogen, in m/s. It comes
 * from the Bohr condition m v r = n h / 2π, so v = n h / (2π m r).
 *
 * @throws {RangeError} If n is not a positive integer
 */
export function orbitSpeedMs(n: number): number {
  const rMetres = orbitRadiusPm(n) * 1e-12
  return (n * PLANCK) / (2 * Math.PI * ELECTRON_MASS_KG * rMetres)
}

/**
 * de Broglie wavelength of the electron in the n-th Bohr orbit, in picometres:
 * λ = h / (m v). Substituting the Bohr speed gives λ = 2π rₙ / n, so n such
 * wavelengths fit exactly around the orbit.
 *
 * @throws {RangeError} If n is not a positive integer
 */
export function deBroglieOnOrbitPm(n: number): number {
  const metres = PLANCK / (ELECTRON_MASS_KG * orbitSpeedMs(n))
  return metres * 1e12
}

/**
 * True when a whole number of wavelengths fits around the circumference, so
 * the wave closes on itself. `count` is circumference ÷ wavelength.
 *
 * @param count Number of wavelengths around the orbit
 * @param tolerance How far from a whole number still counts as closed
 */
export function waveClosesOnItself(count: number, tolerance = 1e-9): boolean {
  requirePositive(count, 'Number of wavelengths')
  return Math.abs(count - Math.round(count)) <= tolerance
}

/**
 * Momentum of a photon of the given wavelength, p = h / λ, in kg m s⁻¹.
 *
 * @param wavelengthM Wavelength in metres
 * @throws {RangeError} If the wavelength is not a positive finite number
 */
export function photonMomentum(wavelengthM: number): number {
  requirePositive(wavelengthM, 'Wavelength')
  return PLANCK / wavelengthM
}
