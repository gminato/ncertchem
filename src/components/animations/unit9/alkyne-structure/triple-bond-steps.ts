/**
 * Pure data for the triple-bond Scrolly (Section 9.4): the four Steps in order, and the bond ladder
 * C–C, C=C, C≡C. Every length and enthalpy is read from NCERT_UNIT9_BOND_DATA, never typed here.
 */

import { NCERT_UNIT9_BOND_DATA } from '@/lib/chem/ncert-unit9-tables'

/** The Steps: the separate π lobes, the merged cylinder, the bond ladder, the carbide generator. */
export const TRIPLE_BOND_STEP_KINDS = ['pi-separate', 'pi-cylinder', 'bond-ladder', 'carbide'] as const
export type TripleBondStepKind = (typeof TRIPLE_BOND_STEP_KINDS)[number]

/** One rung of the ladder: a bond of order 1, 2 or 3 with its NCERT length and enthalpy. */
export interface LadderRung {
  order: 1 | 2 | 3
  label: string
  lengthPm: number
  enthalpyKJ: number
}

/** The NCERT value of a quantity, found by its label in NCERT_UNIT9_BOND_DATA. */
function valueOf(quantity: string): number {
  const found = NCERT_UNIT9_BOND_DATA.find((d) => d.quantity === quantity)
  if (!found) throw new RangeError(`No NCERT bond datum for "${quantity}"`)
  return found.value
}

/**
 * The three carbon–carbon bonds in order of bond order. The C=C length is the 134 pm of NCERT's
 * structure of the double bond (the 133 pm of 9.4.2 is not printed beside it).
 */
export function bondLadder(): LadderRung[] {
  return [
    { order: 1, label: 'C–C', lengthPm: valueOf('C–C bond length (alkanes)'), enthalpyKJ: valueOf('C–C bond enthalpy') },
    { order: 2, label: 'C=C', lengthPm: valueOf('C=C bond length'), enthalpyKJ: valueOf('C=C bond enthalpy') },
    { order: 3, label: 'C≡C', lengthPm: valueOf('C≡C bond length'), enthalpyKJ: valueOf('C≡C bond enthalpy') },
  ]
}
