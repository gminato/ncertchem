import { AVOGADRO, EV_JOULES, PLANCK, SPEED_OF_LIGHT } from './constants'

/** Electromagnetic spectrum regions returned by {@link emRegion}. */
export type EmRegion =
  | 'gamma'
  | 'x-ray'
  | 'ultraviolet'
  | 'visible'
  | 'infrared'
  | 'microwave'
  | 'radio'

/**
 * Input for photon energy: either a frequency in Hz, or an object giving
 * exactly one of a frequency (Hz) or a wavelength (m).
 */
export type PhotonInput = number | { frequencyHz: number } | { wavelengthM: number }

function requirePositive(value: number, name: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${name} must be a positive finite number (received ${value})`)
  }
}

/**
 * Returns the frequency (Hz) of radiation with the given wavelength: ν = c / λ.
 *
 * @param wavelengthM Wavelength in metres (m)
 * @throws {RangeError} If the wavelength is not a positive finite number
 */
export function frequencyFromWavelength(wavelengthM: number): number {
  requirePositive(wavelengthM, 'Wavelength')
  return SPEED_OF_LIGHT / wavelengthM
}

/**
 * Returns the wavelength (m) of radiation with the given frequency: λ = c / ν.
 *
 * @param frequencyHz Frequency in hertz (s⁻¹)
 * @throws {RangeError} If the frequency is not a positive finite number
 */
export function wavelengthFromFrequency(frequencyHz: number): number {
  requirePositive(frequencyHz, 'Frequency')
  return SPEED_OF_LIGHT / frequencyHz
}

/**
 * Returns the wavenumber ν̄ = 1 / λ in m⁻¹ (multiply by 0.01 to get cm⁻¹).
 *
 * @param wavelengthM Wavelength in metres (m)
 * @throws {RangeError} If the wavelength is not a positive finite number
 */
export function wavenumber(wavelengthM: number): number {
  requirePositive(wavelengthM, 'Wavelength')
  return 1 / wavelengthM
}

/**
 * Returns the energy of one photon in joules: E = hν = hc / λ.
 * Accepts a frequency in Hz directly, or `{ frequencyHz }` or `{ wavelengthM }`.
 *
 * @throws {RangeError} If the frequency or wavelength is not a positive finite number
 */
export function photonEnergyJ(input: PhotonInput): number {
  if (typeof input === 'number') {
    requirePositive(input, 'Frequency')
    return PLANCK * input
  }
  if ('frequencyHz' in input) {
    requirePositive(input.frequencyHz, 'Frequency')
    return PLANCK * input.frequencyHz
  }
  requirePositive(input.wavelengthM, 'Wavelength')
  return (PLANCK * SPEED_OF_LIGHT) / input.wavelengthM
}

/**
 * Returns the energy of one photon in electronvolts, using EV_JOULES
 * (1 eV = 1.602 × 10⁻¹⁹ J, the NCERT value).
 *
 * @throws {RangeError} If the frequency or wavelength is not a positive finite number
 */
export function photonEnergyEv(input: PhotonInput): number {
  return photonEnergyJ(input) / EV_JOULES
}

/**
 * Converts the energy of one particle (J) to the energy of one mole of
 * particles (J mol⁻¹), using the NCERT Avogadro constant.
 *
 * @param energyJ Energy per particle in joules
 */
export function energyPerMole(energyJ: number): number {
  return energyJ * AVOGADRO
}

/**
 * Classifies a wavelength (m) into an electromagnetic region.
 *
 * Boundaries used (wavelength, lower limits in brackets):
 * - gamma: below 0.01 nm
 * - x-ray: 0.01 nm to below 10 nm
 * - ultraviolet: 10 nm to below 380 nm
 * - visible: 380 nm to 750 nm inclusive (same range as spectrumRegion in bohr.ts)
 * - infrared: above 750 nm to below 1 mm
 * - microwave: 1 mm to below 1 m
 * - radio: 1 m and above
 *
 * The UV/X-ray and X-ray/gamma boundaries are conventional; NCERT does not fix them.
 *
 * @param wavelengthM Wavelength in metres (m)
 * @throws {RangeError} If the wavelength is not a positive finite number
 */
export function emRegion(wavelengthM: number): EmRegion {
  requirePositive(wavelengthM, 'Wavelength')
  const nm = wavelengthM * 1e9
  if (nm < 0.01) return 'gamma'
  if (nm < 10) return 'x-ray'
  if (nm < 380) return 'ultraviolet'
  if (nm <= 750) return 'visible'
  if (wavelengthM < 1e-3) return 'infrared'
  if (wavelengthM < 1) return 'microwave'
  return 'radio'
}
