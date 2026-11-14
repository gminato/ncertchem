import { BOHR_RADIUS_PM, RH_JOULES, RYDBERG_CM } from './constants'

export type SeriesName =
  | 'Lyman'
  | 'Balmer'
  | 'Paschen'
  | 'Brackett'
  | 'Pfund'
  | 'Humphreys'

export type SpectrumRegion = 'ultraviolet' | 'visible' | 'infrared'

function validatePrincipalQuantumNumber(n: number, paramName: string): void {
  if (!Number.isInteger(n) || n < 1) {
    throw new RangeError(
      `Principal quantum number ${paramName} must be a positive integer (received ${n})`
    )
  }
}

function validateAtomicNumber(Z: number): void {
  if (!Number.isInteger(Z) || Z < 1) {
    throw new RangeError(
      `Atomic number Z must be an integer greater than or equal to 1 (received ${Z})`
    )
  }
}

/**
 * Returns the energy of the n-th Bohr orbit in joules:
 * E_n = -R_H * Z^2 / n^2
 *
 * @param n Principal quantum number (n = 1, 2, 3, ...)
 * @param Z Atomic number (Z = 1 for hydrogen, default 1)
 * @throws {RangeError} If n is not a positive integer or Z < 1
 */
export function energyLevel(n: number, Z = 1): number {
  validatePrincipalQuantumNumber(n, 'n')
  validateAtomicNumber(Z)
  return (-RH_JOULES * (Z * Z)) / (n * n)
}

/**
 * Returns the radius of the n-th Bohr orbit in picometers (pm):
 * r_n = 52.9 * n^2 / Z
 *
 * @param n Principal quantum number (n = 1, 2, 3, ...)
 * @param Z Atomic number (Z = 1 for hydrogen, default 1)
 * @throws {RangeError} If n is not a positive integer or Z < 1
 */
export function orbitRadiusPm(n: number, Z = 1): number {
  validatePrincipalQuantumNumber(n, 'n')
  validateAtomicNumber(Z)
  return (BOHR_RADIUS_PM * (n * n)) / Z
}

/**
 * Returns the transition energy E_final - E_initial in joules.
 * Negative when emitting (electron drops to lower level).
 * Positive when absorbing (electron excited to higher level).
 *
 * @param nInitial Initial principal quantum number
 * @param nFinal Final principal quantum number
 * @param Z Atomic number (default 1)
 * @throws {RangeError} If nInitial or nFinal is not a positive integer or Z < 1
 */
export function transitionEnergy(nInitial: number, nFinal: number, Z = 1): number {
  validatePrincipalQuantumNumber(nInitial, 'nInitial')
  validatePrincipalQuantumNumber(nFinal, 'nFinal')
  validateAtomicNumber(Z)
  return energyLevel(nFinal, Z) - energyLevel(nInitial, Z)
}

/**
 * Returns the emitted or absorbed photon wavelength in nanometers (nm),
 * using the Rydberg formula with RYDBERG_CM:
 * wavenumber = 109677 * Z^2 * |1/n_low^2 - 1/n_high^2| (in cm^-1)
 * wavelength = 1e7 / wavenumber (in nm)
 *
 * @param nInitial Initial principal quantum number
 * @param nFinal Final principal quantum number
 * @param Z Atomic number (default 1)
 * @throws {RangeError} If nInitial === nFinal or either is not a positive integer or Z < 1
 */
export function transitionWavelengthNm(nInitial: number, nFinal: number, Z = 1): number {
  validatePrincipalQuantumNumber(nInitial, 'nInitial')
  validatePrincipalQuantumNumber(nFinal, 'nFinal')
  validateAtomicNumber(Z)

  if (nInitial === nFinal) {
    throw new RangeError(
      `Initial and final energy levels cannot be equal (nInitial = ${nInitial}, nFinal = ${nFinal})`
    )
  }

  const nLow = Math.min(nInitial, nFinal)
  const nHigh = Math.max(nInitial, nFinal)
  const wavenumberCm = RYDBERG_CM * (Z * Z) * (1 / (nLow * nLow) - 1 / (nHigh * nHigh))

  return 1e7 / wavenumberCm
}

/**
 * Returns the spectral series name for hydrogen atom transitions terminating at nLower:
 * - n = 1: Lyman
 * - n = 2: Balmer
 * - n = 3: Paschen
 * - n = 4: Brackett
 * - n = 5: Pfund
 * - n = 6: Humphreys
 * Otherwise returns null.
 *
 * @param nLower The lower principal quantum number
 */
export function seriesName(nLower: number): SeriesName | null {
  switch (nLower) {
    case 1:
      return 'Lyman'
    case 2:
      return 'Balmer'
    case 3:
      return 'Paschen'
    case 4:
      return 'Brackett'
    case 5:
      return 'Pfund'
    case 6:
      return 'Humphreys'
    default:
      return null
  }
}

/**
 * Returns the spectral region ('ultraviolet' | 'visible' | 'infrared')
 * for a given wavelength in nanometers.
 * Visible is 380–750 nm inclusive.
 *
 * @param nm Wavelength in nanometers
 */
export function spectrumRegion(nm: number): SpectrumRegion {
  if (nm < 380) {
    return 'ultraviolet'
  }
  if (nm <= 750) {
    return 'visible'
  }
  return 'infrared'
}
