/**
 * Radii used in NCERT Class 11 Unit 3, Sections 3.7.1(a) and 3.7.1(b), and in the
 * isoelectronic Simulation. Each value carries its source. NCERT's printed values are used
 * wherever NCERT prints them. The one value NCERT does not print here, O²⁻, comes from
 * Shannon's effective ionic radius (CN 6) and is labelled as such.
 *
 * Never mix these with PubChem atomicRadius (periodic-data.ts): PubChem uses another scale.
 */

import { NCERT_TABLE_3_6A_RADII_ACROSS_PERIODS, NCERT_TABLE_3_6B_RADII_DOWN_A_FAMILY } from './ncert-unit3-tables'

export type RadiusSource = 'ncert-text' | 'ncert-table' | 'ncert-atom' | 'shannon-cn6' | 'noble-gas' | 'untabulated'

export interface SpeciesRadius {
  /** Radius in pm, or null where no value is recorded. */
  pm: number | null
  source: RadiusSource
  /** Short citation, shown on screen in small print. */
  citation: string
}

/** Ionic radii with an explicit value, keyed "symbol:charge". */
const IONIC: Readonly<Record<string, SpeciesRadius>> = {
  // NCERT Section 3.7.1(b) text (kech103-layout.txt lines 731 and 734).
  'F:-1': { pm: 136, source: 'ncert-text', citation: 'NCERT 3.7.1(b) text' },
  'Na:1': { pm: 95, source: 'ncert-text', citation: 'NCERT 3.7.1(b) text' },
  // NCERT radii table in the anomalous-properties discussion (layout lines 1104 and 1113),
  // printed in a row labelled "M⁺/pm".
  'Li:1': { pm: 76, source: 'ncert-table', citation: 'NCERT radii table, row “M⁺/pm”' },
  'Be:2': { pm: 31, source: 'ncert-table', citation: 'NCERT radii table, row “M⁺/pm”' },
  'Mg:2': { pm: 72, source: 'ncert-table', citation: 'NCERT radii table, row “M⁺/pm”' },
  // Shannon, R. D. (1976), Acta Cryst. A32, 751: effective ionic radius, six-coordinate.
  // NCERT does not print this value. Checked against secondary tables, not the original.
  'O:-2': { pm: 140, source: 'shannon-cn6', citation: 'Shannon (1976), effective radius, CN 6' },
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
