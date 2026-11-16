/**
 * Pure data for the benzene-structure Scrolly (Section 9.5.2): the five Steps in order, and the bond ladder
 * C–C, benzene C–C and C=C. Every length is read from NCERT_UNIT9_BOND_DATA, never typed here.
 */

import { NCERT_UNIT9_BOND_DATA } from '@/lib/chem/ncert-unit9-tables'

/** The Steps: Kekulé's double bonds sliding, the ortho pair, the hybrid circle, the p orbitals, the bond ladder. */
export const BENZENE_STEP_KINDS = ['kekule-slide', 'ortho-pair', 'hybrid-circle', 'pi-doughnuts', 'bond-ladder'] as const
export type BenzeneStepKind = (typeof BENZENE_STEP_KINDS)[number]

/** One bar of the ladder: a bond with its NCERT length in pm. */
export interface BenzeneRung {
  label: string
  lengthPm: number
}

/** The NCERT value of a quantity, found by its label in NCERT_UNIT9_BOND_DATA. */
function valueOf(quantity: string): number {
  const found = NCERT_UNIT9_BOND_DATA.find((d) => d.quantity === quantity)
  if (!found) throw new RangeError(`No NCERT bond datum for "${quantity}"`)
  return found.value
}

/**
 * The three lengths in order, longest first: a C–C single bond, the benzene C–C bond, and a C=C double bond.
 * The C=C length is the 134 pm of NCERT's structure of the double bond (the 133 pm of 9.5.2 is not printed beside it).
 */
export function benzeneLadder(): BenzeneRung[] {
  return [
    { label: 'C–C', lengthPm: valueOf('C–C bond length (alkanes)') },
    { label: 'benzene', lengthPm: valueOf('benzene C–C bond length') },
    { label: 'C=C', lengthPm: valueOf('C=C bond length') },
  ]
}

/** The benzene C–C length, from NCERT_UNIT9_BOND_DATA. */
export function benzeneBondPm(): number {
  return valueOf('benzene C–C bond length')
}

/** Bar length in viewBox units for a length in pm, on one scale for the whole ladder. */
export function barLength(lengthPm: number, unitsPerPm = 2): number {
  return lengthPm * unitsPerPm
}
