/**
 * Bond parameters for NCERT Class 11 Unit 4, Section 4.3: covalent radii (Table 4.4), bond
 * length from radii, bond order from a Lewis structure (Section 4.3.4), and the average bond
 * order of resonance species (Section 4.3.5).
 *
 * Bond length is estimated as the sum of the two covalent radii for the bond order, which is
 * NCERT's own rule (Section 4.3.1: each atom contributes its covalent radius). The estimate is
 * not exact. It differs from the printed Table 4.2 and 4.3 values where lone-pair repulsion
 * lengthens a bond (F–F) or where the table uses a different radius set (C–H, O–H).
 */

import { NCERT_TABLE_4_4_COVALENT_RADII } from './ncert-unit4-tables'
import { bondOrderBetween, type LewisStructure } from './lewis'

/**
 * Covalent radius of an element for a given bond order, in pm, as printed in NCERT Table 4.4.
 * Plain values are single-bond radii; the parenthesised entries are for double and triple bonds.
 *
 * @throws {RangeError} If the table has no radius for that element and bond order
 */
export function covalentRadius(symbol: string, bondOrder: 1 | 2 | 3 = 1): number {
  const row = NCERT_TABLE_4_4_COVALENT_RADII.rows.find((r) => r.symbol === symbol && r.bondOrder === bondOrder)
  if (!row) throw new RangeError(`Table 4.4 has no covalent radius for ${symbol} with bond order ${bondOrder}`)
  return row.radiusPm
}

/**
 * Estimated bond length in pm for a bond of order 1, 2 or 3 between two atoms: the sum of the
 * two covalent radii at that order.
 *
 * @throws {RangeError} If either element has no Table 4.4 radius for that bond order
 */
export function estimateBondLength(a: string, b: string, order: 1 | 2 | 3): number {
  return covalentRadius(a, order) + covalentRadius(b, order)
}

/**
 * Bond order between atoms `i` and `j` of a Lewis structure (Section 4.3.4): the number of
 * shared electron pairs. Zero means the atoms are not bonded.
 */
export function bondOrderFromLewis(structure: LewisStructure, i: number, j: number): number {
  return bondOrderBetween(structure, i, j)
}

/**
 * Bond orders of the equivalent bonds in each canonical (resonance) form of a species. Each row
 * is one canonical form and lists the bond orders of its bonds to the central atom.
 * O3 has two forms (O=O–O and O–O=O). CO3²⁻ and NO3⁻ each have three. (Section 4.3.5, Fig. 4.3–4.4.)
 */
export const RESONANCE_CANONICAL_BOND_ORDERS: Readonly<Record<'O3' | 'CO3²⁻' | 'NO3⁻', readonly (readonly number[])[]>> = {
  O3: [[2, 1], [1, 2]],
  'CO3²⁻': [[2, 1, 1], [1, 2, 1], [1, 1, 2]],
  'NO3⁻': [[2, 1, 1], [1, 2, 1], [1, 1, 2]],
}

/**
 * Average bond order of each equivalent bond of a resonance species, taken over all of its
 * canonical forms. O3 gives 1.5, and CO3²⁻ and NO3⁻ give 4/3 (printed 1.33 in NCERT's
 * discussion).
 */
export function resonanceAverageBondOrder(species: keyof typeof RESONANCE_CANONICAL_BOND_ORDERS): number {
  const forms = RESONANCE_CANONICAL_BOND_ORDERS[species]
  if (!forms) throw new RangeError(`No canonical forms for ${species}`)
  const all = forms.flat()
  return all.reduce((sum, order) => sum + order, 0) / all.length
}
