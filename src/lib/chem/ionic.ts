/**
 * Born–Haber cycle for NaCl, for NCERT Class 11 Unit 4, Section 4.2 and 4.2.1 (ionic bond and
 * lattice enthalpy). NCERT prints the ionisation enthalpy of Na, the electron gain enthalpy of
 * Cl and the lattice enthalpy of NaCl. It does not print the sublimation or dissociation steps,
 * so those come from standard data and are labelled as such.
 *
 * Sign convention: every step is signed for the formation direction,
 * Na(s) + ½ Cl₂(g) → NaCl(s), so the steps add to the standard enthalpy of formation.
 * NCERT defines lattice enthalpy as the energy needed to separate the solid (positive, 788 kJ
 * mol⁻¹), but its cycle uses the formation direction (−788). This module uses the formation
 * direction and reports the magnitude where NCERT's printed sign is needed.
 */

import { NCERT_NACL_LATTICE_ENTHALPY_KJ, NCERT_NACL_STEPS } from './ncert-unit4-tables'

/** Where a Born–Haber value comes from. */
export type BornHaberSource =
  | 'NCERT text (Section 4.2, book p. 106)'
  | 'NCERT text (Section 4.2.1, book p. 107)'
  | 'Standard data (not printed in NCERT Unit 4)'

/** One step of the Born–Haber cycle, signed for the formation direction. */
export interface BornHaberStep {
  label: string
  /** Enthalpy of the step in kJ mol⁻¹. Positive is endothermic. */
  enthalpyKj: number
  source: BornHaberSource
}

/**
 * The NaCl Born–Haber steps, in cycle order. The sublimation and dissociation values are
 * standard reference data (Na(s) → Na(g) about +108.4 kJ mol⁻¹; ½ Cl₂(g) → Cl(g) about
 * +121.3 kJ mol⁻¹). The ionisation, electron gain and lattice values are NCERT's. Together they
 * close on the standard enthalpy of formation of NaCl(s), about −411.2 kJ mol⁻¹, which is the
 * check used in the tests. The standard values were recalled and not re-checked in this session.
 */
export const NACL_BORN_HABER: readonly BornHaberStep[] = [
  { label: 'Sublimation, Na(s) → Na(g)', enthalpyKj: 108.4, source: 'Standard data (not printed in NCERT Unit 4)' },
  { label: 'Dissociation, ½ Cl₂(g) → Cl(g)', enthalpyKj: 121.3, source: 'Standard data (not printed in NCERT Unit 4)' },
  { label: 'Ionisation, Na(g) → Na⁺(g) + e⁻', enthalpyKj: 495.8, source: 'NCERT text (Section 4.2, book p. 106)' },
  { label: 'Electron gain, Cl(g) + e⁻ → Cl⁻(g)', enthalpyKj: -348.7, source: 'NCERT text (Section 4.2, book p. 106)' },
  { label: 'Lattice formation, Na⁺(g) + Cl⁻(g) → NaCl(s)', enthalpyKj: -NCERT_NACL_LATTICE_ENTHALPY_KJ, source: 'NCERT text (Section 4.2.1, book p. 107)' },
]

/** Standard enthalpy of formation of NaCl(s), kJ mol⁻¹ (recalled; the cycle is checked against it). */
export const NACL_STANDARD_FORMATION_KJ = -411.2

/**
 * Sum of the steps in a cycle, in the formation direction. For a closed cycle this equals the
 * enthalpy of formation.
 */
export function bornHaberSum(steps: readonly BornHaberStep[]): number {
  return steps.reduce((sum, step) => sum + step.enthalpyKj, 0)
}

/**
 * Lattice formation enthalpy that closes a cycle, given the other steps and the formation
 * enthalpy. Use this to derive lattice enthalpy from standard data when it is not printed.
 * The result is negative for an exothermic lattice formation.
 *
 * @param otherSteps Every step of the cycle except the lattice step.
 * @param formationKj Enthalpy of formation of the solid, kJ mol⁻¹.
 */
export function solveLatticeEnthalpy(otherSteps: readonly BornHaberStep[], formationKj: number): number {
  return formationKj - bornHaberSum(otherSteps)
}

/**
 * The NCERT-printed ionisation plus electron gain sum for NaCl, kJ mol⁻¹. NCERT says this
 * sum (147.1 kJ mol⁻¹) is positive, and the lattice enthalpy more than compensates for it.
 */
export function ionisationPlusElectronGain(): number {
  const ionisation = NCERT_NACL_STEPS[0].value
  const gain = NCERT_NACL_STEPS[1].value
  return ionisation + gain
}

/**
 * Whether the lattice formation of a salt compensates for the energy spent on forming its ions
 * from the free atoms. True when the ion-forming steps (ionisation plus electron gain) are
 * smaller in magnitude than the lattice enthalpy released.
 *
 * @param ionFormationKj Sum of ionisation and electron gain enthalpies, kJ mol⁻¹ (may be positive).
 * @param latticeMagnitudeKj Lattice enthalpy as a positive magnitude, kJ mol⁻¹.
 * @throws {RangeError} If the lattice magnitude is not positive
 */
export function latticeCompensates(ionFormationKj: number, latticeMagnitudeKj: number): boolean {
  if (!(latticeMagnitudeKj > 0)) throw new RangeError(`lattice magnitude must be positive (received ${latticeMagnitudeKj})`)
  return ionFormationKj < latticeMagnitudeKj
}
