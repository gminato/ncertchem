import { PLANCK, SPEED_OF_LIGHT } from './constants'

/**
 * Boltzmann constant k in J K⁻¹ (exact SI value). NCERT Class 11, Unit 2 does not
 * give k, so this is the only constant in this file that is not from the NCERT text.
 */
export const BOLTZMANN = 1.380649e-23

/**
 * Planck's law for black-body radiation: the spectral radiance B_λ(λ, T) in
 * W sr⁻¹ m⁻³, from the quantised energy E = hν of the oscillators in the walls:
 *
 *   B_λ(λ, T) = (2 h c² / λ⁵) · 1 / (exp(h c / (λ k T)) − 1)
 *
 * Uses the NCERT values of h and c (see constants.ts).
 *
 * @param wavelengthM Wavelength in metres (m)
 * @param temperatureK Absolute temperature in kelvin (K)
 * @throws {RangeError} If the wavelength or temperature is not a positive finite number
 */
export function planckRadiance(wavelengthM: number, temperatureK: number): number {
  if (!Number.isFinite(wavelengthM) || wavelengthM <= 0) {
    throw new RangeError(`Wavelength must be a positive finite number (received ${wavelengthM})`)
  }
  if (!Number.isFinite(temperatureK) || temperatureK <= 0) {
    throw new RangeError(`Temperature must be a positive finite number (received ${temperatureK})`)
  }
  const prefactor = (2 * PLANCK * SPEED_OF_LIGHT * SPEED_OF_LIGHT) / Math.pow(wavelengthM, 5)
  const exponent = (PLANCK * SPEED_OF_LIGHT) / (wavelengthM * BOLTZMANN * temperatureK)
  return prefactor / Math.expm1(exponent)
}

/** One point of a black-body curve. */
export interface BlackBodyPoint {
  /** Wavelength in nanometres (nm). */
  nm: number
  /** Spectral radiance in W sr⁻¹ m⁻³ (see {@link planckRadiance}). */
  radiance: number
}

/**
 * Samples the black-body curve at `temperatureK` on a regular wavelength grid.
 *
 * @param temperatureK Absolute temperature in kelvin (K)
 * @param minNm First wavelength in nm (default 100)
 * @param maxNm Last wavelength in nm (default 4000)
 * @param stepNm Grid spacing in nm (default 10)
 * @throws {RangeError} If the grid or temperature is invalid
 */
export function blackBodyCurve(
  temperatureK: number,
  minNm = 100,
  maxNm = 4000,
  stepNm = 10
): BlackBodyPoint[] {
  if (!(stepNm > 0) || !(minNm > 0) || !(maxNm > minNm)) {
    throw new RangeError('Invalid wavelength grid for the black-body curve')
  }
  const points: BlackBodyPoint[] = []
  for (let nm = minNm; nm <= maxNm + 1e-9; nm += stepNm) {
    points.push({ nm, radiance: planckRadiance(nm * 1e-9, temperatureK) })
  }
  return points
}

/**
 * The wavelength (nm) at which the black-body radiance peaks at `temperatureK`.
 * Found by a coarse log-spaced search followed by a fine search near the best
 * sample, so the result is good to about 0.1 nm. It shifts to shorter
 * wavelengths as the temperature rises.
 *
 * @throws {RangeError} If the temperature is not a positive finite number
 */
export function peakWavelengthNm(temperatureK: number): number {
  if (!Number.isFinite(temperatureK) || temperatureK <= 0) {
    throw new RangeError(`Temperature must be a positive finite number (received ${temperatureK})`)
  }
  const lo = Math.log10(10)
  const hi = Math.log10(1e6)
  let bestLog = lo
  let bestValue = -Infinity
  const coarse = 2000
  for (let i = 0; i <= coarse; i++) {
    const logNm = lo + ((hi - lo) * i) / coarse
    const value = planckRadiance(Math.pow(10, logNm) * 1e-9, temperatureK)
    if (value > bestValue) {
      bestValue = value
      bestLog = logNm
    }
  }
  const span = (hi - lo) / coarse
  let from = bestLog - span
  let to = bestLog + span
  for (let pass = 0; pass < 60; pass++) {
    let localBest = from
    let localValue = -Infinity
    for (let i = 0; i <= 20; i++) {
      const logNm = from + ((to - from) * i) / 20
      const value = planckRadiance(Math.pow(10, logNm) * 1e-9, temperatureK)
      if (value > localValue) {
        localValue = value
        localBest = logNm
      }
    }
    const width = (to - from) / 10
    from = localBest - width
    to = localBest + width
    bestLog = localBest
  }
  return Math.pow(10, bestLog)
}
