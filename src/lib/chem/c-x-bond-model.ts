/**
 * The numbers and helpers behind the C–X Bond Explorer (Class 12 Unit 6, Section 3).
 * Every value comes from NCERT_TABLE_6_2 in the Unit 6 data file; nothing is typed in here.
 */

import { NCERT_TABLE_6_2, formatDipole, type CarbonHalogenBond, type Halogen } from './ncert-c12-unit6-data'

export const CX_HALOGENS: readonly Halogen[] = ['F', 'Cl', 'Br', 'I']

/** CH₃–X as SMILES. The tests tie these to the formula and the namer's names. */
export const CH3X_SMILES: Readonly<Record<Halogen, string>> = { F: 'CF', Cl: 'CCl', Br: 'CBr', I: 'CI' }

/** The Table 6.2 row for one halogen. */
export function bondRow(halogen: Halogen): CarbonHalogenBond {
  const row = NCERT_TABLE_6_2.find((r) => r.halogen === halogen)
  if (!row) throw new RangeError(`No Table 6.2 row for ${halogen}`)
  return row
}

/** The Table 6.2 row with the largest dipole moment (CH₃–Cl, not CH₃–F). */
export function largestDipoleRow(): CarbonHalogenBond {
  return NCERT_TABLE_6_2.reduce((best, r) => (r.dipoleDebye > best.dipoleDebye ? r : best))
}

/** The live summary for one halogen, e.g. "CH₃–Cl: bond 178 pm, enthalpy 351 kJ mol⁻¹, dipole 1.860 D." */
export function bondSummary(halogen: Halogen): string {
  const r = bondRow(halogen)
  return `${r.unicode}: bond ${r.lengthPm} pm, enthalpy ${r.enthalpyKjPerMol} kJ mol⁻¹, dipole ${formatDipole(r.dipoleDebye)}.`
}
