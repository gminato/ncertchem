/**
 * Spontaneity, Gibbs energy and equilibrium for NCERT Class 11 Unit 5, Section 5.6 (spontaneity,
 * entropy and the second law), Section 5.7 (Gibbs energy and equilibrium) and Table 5.4.
 *
 * Units, used throughout: enthalpies and Gibbs energies in kJ mol⁻¹; entropies in J K⁻¹ mol⁻¹;
 * temperatures in kelvin. Each function converts kJ to J where the two meet. The gas constant is
 * R = 8.314 J K⁻¹ mol⁻¹, as NCERT uses in Problems 5.12 to 5.14.
 */

import { NCERT_TABLE_5_4_SPONTANEITY, type SpontaneityCaseRow } from './ncert-unit5-tables'
import { R_J_PER_MOL_K } from './pv-work'

function assertPositiveTemperature(temperatureK: number): void {
  if (!Number.isFinite(temperatureK) || temperatureK <= 0) {
    throw new RangeError(`temperature must be positive in kelvin (received ${temperatureK})`)
  }
}

function assertFinite(name: string, value: number): void {
  if (!Number.isFinite(value)) {
    throw new RangeError(`${name} must be a finite number (received ${value})`)
  }
}

/**
 * Entropy change of the surroundings, ΔS_surr = −ΔH_sys / T (Section 5.6(b)). The heat given to the
 * surroundings at constant T and P is −ΔH_sys.
 *
 * @param deltaHSysKJ Enthalpy change of the system, kJ mol⁻¹.
 * @param temperatureK Temperature, K.
 * @returns Entropy change of the surroundings, J K⁻¹ mol⁻¹.
 */
export function entropyOfSurroundings(deltaHSysKJ: number, temperatureK: number): number {
  assertFinite('ΔH', deltaHSysKJ)
  assertPositiveTemperature(temperatureK)
  // Adding 0 turns a negative zero (from a zero ΔH) into a plain zero.
  return (-deltaHSysKJ * 1000) / temperatureK + 0
}

/**
 * Total entropy change, ΔS_total = ΔS_sys + ΔS_surr (equation 5.19). A spontaneous process has
 * ΔS_total > 0.
 *
 * @param deltaSSysJ Entropy change of the system, J K⁻¹ mol⁻¹.
 * @param deltaHSysKJ Enthalpy change of the system, kJ mol⁻¹.
 * @param temperatureK Temperature, K.
 * @returns Total entropy change, J K⁻¹ mol⁻¹.
 */
export function totalEntropyChange(deltaSSysJ: number, deltaHSysKJ: number, temperatureK: number): number {
  assertFinite('ΔS', deltaSSysJ)
  return deltaSSysJ + entropyOfSurroundings(deltaHSysKJ, temperatureK)
}

/**
 * Gibbs energy change at constant temperature and pressure, ΔG = ΔH − TΔS (equation 5.21).
 *
 * @param deltaHKJ Enthalpy change, kJ mol⁻¹.
 * @param temperatureK Temperature, K.
 * @param deltaSJ Entropy change, J K⁻¹ mol⁻¹.
 * @returns ΔG in kJ mol⁻¹.
 */
export function gibbsEnergyChange(deltaHKJ: number, temperatureK: number, deltaSJ: number): number {
  assertFinite('ΔH', deltaHKJ)
  assertFinite('ΔS', deltaSJ)
  assertPositiveTemperature(temperatureK)
  return deltaHKJ - (temperatureK * deltaSJ) / 1000
}

/** Which way a process runs at constant T and P, from the sign of ΔG (Section 5.6(c)). */
export type SpontaneityVerdict = 'spontaneous' | 'non-spontaneous' | 'equilibrium'

/** Spontaneity from ΔG: negative is spontaneous, positive non-spontaneous, zero at equilibrium. */
export function spontaneityFromGibbs(deltaGKJ: number): SpontaneityVerdict {
  assertFinite('ΔG', deltaGKJ)
  if (deltaGKJ < 0) return 'spontaneous'
  if (deltaGKJ > 0) return 'non-spontaneous'
  return 'equilibrium'
}

/**
 * Temperature at which ΔG = 0 for a process whose ΔH and ΔS do not change with temperature:
 * T = ΔH / ΔS. ΔH and ΔS of the same sign give a positive T, which is the crossover of Table 5.4.
 * When they have opposite signs the ratio is negative, no real temperature gives ΔG = 0, and the
 * function returns null.
 *
 * @param deltaHKJ Enthalpy change, kJ mol⁻¹.
 * @param deltaSJ Entropy change, J K⁻¹ mol⁻¹, non-zero.
 * @throws {RangeError} If ΔS is zero
 */
export function crossoverTemperature(deltaHKJ: number, deltaSJ: number): number | null {
  assertFinite('ΔH', deltaHKJ)
  assertFinite('ΔS', deltaSJ)
  if (deltaSJ === 0) throw new RangeError('ΔS must be non-zero to find a crossover temperature')
  const t = (deltaHKJ * 1000) / deltaSJ
  return t > 0 ? t : null
}

/**
 * Entropy change at a phase transition, ΔS = ΔH / T, where the two phases are in equilibrium at T
 * (Section 5.6(b) and Table 5.1).
 *
 * @param deltaHKJ Enthalpy of the transition, kJ mol⁻¹ (fusion, vaporisation or sublimation).
 * @param temperatureK Transition temperature, K.
 * @returns Entropy change, J K⁻¹ mol⁻¹.
 */
export function entropyOfPhaseChange(deltaHKJ: number, temperatureK: number): number {
  assertFinite('ΔH', deltaHKJ)
  assertPositiveTemperature(temperatureK)
  return (deltaHKJ * 1000) / temperatureK
}

/**
 * Standard Gibbs energy change from the equilibrium constant, ΔG° = −RT ln K (equation 5.23), in
 * kJ mol⁻¹. Equivalent to −2.303 RT log K. K may be Kp or Kc, in its standard state.
 *
 * @throws {RangeError} If K or T is not positive
 */
export function standardGibbsFromK(k: number, temperatureK: number): number {
  if (!Number.isFinite(k) || k <= 0) throw new RangeError(`K must be positive (received ${k})`)
  assertPositiveTemperature(temperatureK)
  return (-R_J_PER_MOL_K * temperatureK * Math.log(k)) / 1000
}

/**
 * Equilibrium constant from the standard Gibbs energy change, K = exp(−ΔG° / RT). The inverse of
 * standardGibbsFromK.
 *
 * @param deltaGKJ Standard Gibbs energy change, kJ mol⁻¹.
 * @param temperatureK Temperature, K.
 */
export function kFromStandardGibbs(deltaGKJ: number, temperatureK: number): number {
  assertFinite('ΔG°', deltaGKJ)
  assertPositiveTemperature(temperatureK)
  return Math.exp((-deltaGKJ * 1000) / (R_J_PER_MOL_K * temperatureK))
}

/**
 * Kp for the dissociation A ⇌ 2B, with degree of dissociation α at total pressure P (NCERT Problem
 * 5.14, N2O4(g) ⇌ 2NO2(g)). At equilibrium the mole fractions are (1 − α)/(1 + α) and 2α/(1 + α).
 * Kp = 4α²P / (1 − α²), in the pressure unit of P (atm in Problem 5.14).
 *
 * @param alpha Degree of dissociation, 0 < α < 1.
 * @param totalPressure Total pressure, positive.
 * @throws {RangeError} If α or P is out of range
 */
export function kpForDissociation2(alpha: number, totalPressure: number): number {
  if (!Number.isFinite(alpha) || alpha <= 0 || alpha >= 1) {
    throw new RangeError(`degree of dissociation must be between 0 and 1 (received ${alpha})`)
  }
  if (!Number.isFinite(totalPressure) || totalPressure <= 0) {
    throw new RangeError(`total pressure must be positive (received ${totalPressure})`)
  }
  return (4 * alpha * alpha * totalPressure) / (1 - alpha * alpha)
}

/**
 * The rows of Table 5.4 for the signs of ΔH and ΔS. Opposite-sign pairs give one row, valid at all
 * temperatures. Same-sign pairs give two rows, one for low and one for high temperature, because
 * the sign of ΔG changes with T. A zero is not allowed: Table 5.4 is written for definite signs.
 *
 * @throws {RangeError} If ΔH or ΔS is zero or not finite
 */
export function classifyTable54(deltaHKJ: number, deltaSJ: number): readonly SpontaneityCaseRow[] {
  assertFinite('ΔH', deltaHKJ)
  assertFinite('ΔS', deltaSJ)
  if (deltaHKJ === 0 || deltaSJ === 0) {
    throw new RangeError('Table 5.4 is written for non-zero ΔH and ΔS')
  }
  const hSign = deltaHKJ > 0 ? '+' : '-'
  const sSign = deltaSJ > 0 ? '+' : '-'
  return NCERT_TABLE_5_4_SPONTANEITY.rows.filter((r) => r.deltaH === hSign && r.deltaS === sSign)
}
