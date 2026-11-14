import { ELECTRON_MASS_KG, EV_JOULES, PLANCK, SPEED_OF_LIGHT } from './constants'

/**
 * Work functions W₀ in eV for a few metals, exactly as in NCERT Class 11, Unit 2,
 * Table 2.2.
 */
export const WORK_FUNCTIONS_EV: Readonly<Record<string, number>> = {
  Li: 2.42,
  Na: 2.3,
  K: 2.25,
  Mg: 3.7,
  Cu: 4.8,
  Ag: 4.3,
}

/**
 * Input for {@link photoelectronKE}: exactly one of `frequencyHz` or `wavelengthNm`,
 * plus the metal's work function.
 */
export type PhotoelectronInput =
  | { frequencyHz: number; workFunctionEv: number }
  | { wavelengthNm: number; workFunctionEv: number }

/** Result of {@link photoelectronKE}. */
export interface PhotoelectronResult {
  /** True when hν exceeds W₀, so an electron is ejected. */
  emitted: boolean
  /** Maximum kinetic energy of the ejected electron, in joules (0 if not emitted). */
  keJ: number
  /** Maximum kinetic energy in eV (0 if not emitted). */
  keEv: number
  /** Maximum speed of the ejected electron in m/s (0 if not emitted). */
  maxSpeedMs: number
}

function requirePositive(value: number, name: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${name} must be a positive finite number (received ${value})`)
  }
}

/**
 * Returns the threshold frequency ν₀ = W₀ / h (Hz) for a work function in eV.
 *
 * @param workFunctionEv Work function W₀ in electronvolts
 * @throws {RangeError} If the work function is not a positive finite number
 */
export function thresholdFrequency(workFunctionEv: number): number {
  requirePositive(workFunctionEv, 'Work function')
  return (workFunctionEv * EV_JOULES) / PLANCK
}

/**
 * Returns the threshold wavelength λ₀ = c / ν₀ in nanometres.
 *
 * @param workFunctionEv Work function W₀ in electronvolts
 * @throws {RangeError} If the work function is not a positive finite number
 */
export function thresholdWavelengthNm(workFunctionEv: number): number {
  return (SPEED_OF_LIGHT / thresholdFrequency(workFunctionEv)) * 1e9
}

/**
 * Returns the maximum kinetic energy of a photoelectron (Einstein's equation):
 * KE = hν − W₀, where hν is the photon energy. Emission happens only when KE > 0.
 * The maximum speed follows from KE = ½ m_e v².
 *
 * Give either `frequencyHz` or `wavelengthNm`, not both.
 *
 * @throws {RangeError} If neither or both of frequency and wavelength are given,
 *   or if any value is not a positive finite number
 */
export function photoelectronKE(input: PhotoelectronInput): PhotoelectronResult {
  const hasFrequency = 'frequencyHz' in input
  const hasWavelength = 'wavelengthNm' in input
  if (hasFrequency === hasWavelength) {
    throw new RangeError('Provide exactly one of frequencyHz or wavelengthNm')
  }
  requirePositive(input.workFunctionEv, 'Work function')

  const frequencyHz = hasFrequency
    ? (input as { frequencyHz: number }).frequencyHz
    : SPEED_OF_LIGHT / ((input as { wavelengthNm: number }).wavelengthNm * 1e-9)
  requirePositive(frequencyHz, 'Frequency')

  const photonJ = PLANCK * frequencyHz
  const workFunctionJ = input.workFunctionEv * EV_JOULES
  const keJ = photonJ - workFunctionJ

  if (keJ <= 0) {
    return { emitted: false, keJ: 0, keEv: 0, maxSpeedMs: 0 }
  }
  return {
    emitted: true,
    keJ,
    keEv: keJ / EV_JOULES,
    maxSpeedMs: Math.sqrt((2 * keJ) / ELECTRON_MASS_KG),
  }
}

/**
 * Qualitative model for the simulation: the number of photoelectrons emitted per
 * second scales linearly with light intensity, but only when emission happens at all
 * (above threshold). Below threshold, no electrons are emitted at any intensity.
 * This is the NCERT observation that intensity affects the number of electrons, not
 * their kinetic energy. Output is relative (intensity 1 means one unit of emission).
 *
 * @param intensityRelative Relative light intensity (non-negative)
 * @param emitted Whether photon energy exceeds the work function (from photoelectronKE)
 * @throws {RangeError} If the intensity is negative or not finite
 */
export function electronsPerSecond(intensityRelative: number, emitted: boolean): number {
  if (!Number.isFinite(intensityRelative) || intensityRelative < 0) {
    throw new RangeError(
      `Relative intensity must be a non-negative finite number (received ${intensityRelative})`
    )
  }
  return emitted ? intensityRelative : 0
}
