/**
 * Radii used in NCERT Class 11 Unit 3, Sections 3.7.1(a) and 3.7.1(b), and in the
 * isoelectronic Simulation.
 *
 * Atomic radii are NCERT's Tables 3.6(a) and 3.6(b). Every ionic radius is from ONE source,
 * Pauling's crystal radii (L. Pauling, The Nature of the Chemical Bond, 3rd ed., 1960), so
 * that the ions of an isoelectronic series compare on one scale. NCERT prints F⁻ 136 pm and
 * Na⁺ 95 pm in Section 3.7.1(b), which are the same Pauling values. NCERT's radii table in
 * Section 3.7.2 gives Na⁺ as 102 pm. That table is out of scope here, and this module uses
 * the 3.7.1(b) text value, 95 pm.
 *
 * Never mix these with PubChem atomicRadius (periodic-data.ts): PubChem uses another scale.
 */

import { NCERT_TABLE_3_6A_RADII_ACROSS_PERIODS, NCERT_TABLE_3_6B_RADII_DOWN_A_FAMILY } from './ncert-unit3-tables'

export type RadiusSource = 'ncert-atom' | 'pauling-crystal' | 'noble-gas' | 'untabulated'

const PAULING = 'Ionic radii: Pauling (1960)'

export interface SpeciesRadius {
  /** Radius in pm, or null where no value is recorded. */
  pm: number | null
  source: RadiusSource
  /** Short citation, shown on screen in small print. */
  citation: string
}

/**
 * Pauling crystal ionic radii in pm, keyed "symbol:charge". The 10-electron, 18-electron
 * and 2-electron series of the isoelectronic Simulation. NCERT 3.7.1(b) prints F⁻ 136 and
 * Na⁺ 95, both matching these values.
 */
const IONIC: Readonly<Record<string, SpeciesRadius>> = {
  'N:-3': { pm: 171, source: 'pauling-crystal', citation: PAULING },
  'O:-2': { pm: 140, source: 'pauling-crystal', citation: PAULING },
  'F:-1': { pm: 136, source: 'pauling-crystal', citation: PAULING },
  'Na:1': { pm: 95, source: 'pauling-crystal', citation: PAULING },
  'Mg:2': { pm: 65, source: 'pauling-crystal', citation: PAULING },
  'Al:3': { pm: 50, source: 'pauling-crystal', citation: PAULING },
  'S:-2': { pm: 184, source: 'pauling-crystal', citation: PAULING },
  'Cl:-1': { pm: 181, source: 'pauling-crystal', citation: PAULING },
  'K:1': { pm: 133, source: 'pauling-crystal', citation: PAULING },
  'Ca:2': { pm: 99, source: 'pauling-crystal', citation: PAULING },
  'H:-1': { pm: 208, source: 'pauling-crystal', citation: PAULING },
  'Li:1': { pm: 60, source: 'pauling-crystal', citation: PAULING },
  'Be:2': { pm: 31, source: 'pauling-crystal', citation: PAULING },
}

/** Atomic numbers of the noble gases, which NCERT compares with van der Waals radii instead. */
const NOBLE_Z: ReadonlySet<number> = new Set([2, 10, 18, 36, 54, 86])

/** Radius of the neutral atom from NCERT Tables 3.6(a) and 3.6(b), or null if not printed. */
export function ncertAtomRadiusPm(symbol: string): number | null {
  const row =
    NCERT_TABLE_3_6A_RADII_ACROSS_PERIODS.rows.find((r) => r.symbol === symbol) ??
    NCERT_TABLE_3_6B_RADII_DOWN_A_FAMILY.rows.find((r) => r.symbol === symbol)
  return row ? row.value : null
}

/**
 * Radius of the species with atomic number Z, its element symbol and the given charge.
 * Neutral atoms come from NCERT Tables 3.6. Ions come from the IONIC table. Noble gases and
 * species not recorded here return pm: null.
 */
export function speciesRadius(Z: number, symbol: string, charge: number): SpeciesRadius {
  if (charge === 0) {
    if (NOBLE_Z.has(Z)) {
      return { pm: null, source: 'noble-gas', citation: 'Noble gas: NCERT compares with van der Waals radii' }
    }
    const pm = ncertAtomRadiusPm(symbol)
    return pm === null
      ? { pm: null, source: 'untabulated', citation: 'Not printed by NCERT' }
      : { pm, source: 'ncert-atom', citation: 'NCERT Table 3.6' }
  }
  return IONIC[`${symbol}:${charge}`] ?? { pm: null, source: 'untabulated', citation: 'Not in this module' }
}

/**
 * Half of a separation: the covalent radius is half the distance between two bonded atoms,
 * and the metallic radius is half the distance between neighbouring metal cores (NCERT
 * 3.7.1(a)).
 *
 * @throws {RangeError} If the separation is not a positive finite number of pm
 */
export function radiusFromSeparation(separationPm: number): number {
  if (!Number.isFinite(separationPm) || separationPm <= 0) {
    throw new RangeError(`Separation must be a positive number of pm (received ${separationPm})`)
  }
  return separationPm / 2
}
