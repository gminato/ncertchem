import { elementByZ, tablePosition } from '../../lib/chem/periodic-data'
import type { ElementRecord, TablePosition } from './types'

/**
 * A small subset of the real periodic data, for unit tests only. Records and
 * positions are the real ones, so tests break if the data changes meaning.
 * The /vocab demo uses the full PERIODIC_TABLE instead.
 */
const FIXTURE_Z = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 58]

export const FIXTURE_ELEMENTS: readonly ElementRecord[] = FIXTURE_Z.map((Z) => elementByZ(Z))

/** Table position from the data module (throws RangeError for an invalid Z). */
export function fixturePosition(Z: number): TablePosition {
  return tablePosition(Z)
}
