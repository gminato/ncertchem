/**
 * Boiling and melting points of the alkanes in NCERT Table 9.2 (Unit 9), and the trends NCERT draws from them:
 * boiling points rise with chain length (larger molecules, more surface contact and van der Waals attraction),
 * and branching lowers the boiling point (a compact molecule has less surface contact).
 */

import { NCERT_TABLE_9_2_ALKANES, type AlkaneBoilingRow } from './ncert-unit9-tables'

/** The straight-chain alkanes of Table 9.2, in order of increasing carbon number. */
export const STRAIGHT_CHAIN_ALKANES: readonly string[] = [
  'Methane',
  'Ethane',
  'Propane',
  'Butane',
  'Pentane',
  'Hexane',
  'Heptane',
  'Octane',
  'Nonane',
  'Decane',
  'Eicosane',
]

/**
 * The Table 9.2 row for an alkane, by the name as printed.
 *
 * @throws {RangeError} If the name is not in Table 9.2
 */
export function alkaneRow(name: string): AlkaneBoilingRow {
  const row = NCERT_TABLE_9_2_ALKANES.rows.find((r) => r.name === name)
  if (!row) throw new RangeError(`"${name}" is not an alkane in NCERT Table 9.2`)
  return row
}

/**
 * The boiling point of an alkane in Table 9.2, in kelvin (as printed).
 *
 * @throws {RangeError} If the name is not in Table 9.2
 */
export function boilingPointK(name: string): number {
  return alkaneRow(name).boilingPointK
}

/**
 * Orders alkanes from highest to lowest boiling point and gives NCERT's reason for the order.
 *
 * @throws {RangeError} If a name is not in Table 9.2
 */
export function boilingPointTrend(names: readonly string[]): { ordered: string[]; reason: string } {
  const ordered = [...names].sort((a, b) => boilingPointK(b) - boilingPointK(a))
  return {
    ordered,
    reason: 'Boiling point rises with molar mass and falls with branching: the intermolecular van der Waals attraction depends on the surface area in contact.',
  }
}

/** True if the straight-chain boiling points of Table 9.2 rise strictly with carbon number. */
export function straightChainBoilingPointsRise(): boolean {
  return STRAIGHT_CHAIN_ALKANES.every((name, i) => i === 0 || boilingPointK(name) > boilingPointK(STRAIGHT_CHAIN_ALKANES[i - 1]))
}

/**
 * True if a branched isomer boils lower than its straight-chain isomer (the branching effect of Table 9.2).
 *
 * @throws {RangeError} If a name is not in Table 9.2
 */
export function branchingLowersBoilingPoint(branched: string, straight: string): boolean {
  return boilingPointK(branched) < boilingPointK(straight)
}
