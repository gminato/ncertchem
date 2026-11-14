/**
 * Pure logic for Mendeleev's 1869 table and his predictions for eka-aluminium and
 * eka-silicon (NCERT Section 3.2, Table 3.3). Used by the Scrolly that shows the gaps
 * and by the "Predict like Mendeleev" Simulation.
 *
 * Reviewer note: PubChem's YearDiscovered column is not reliable for this purpose
 * (it lists aluminium as "Ancient"), so the 1869 set below is a hand-written list
 * from standard chemical history, not a computed one. It needs a review against a
 * primary source before release.
 */

import { NCERT_TABLE_3_3_MENDELEEV } from './ncert-unit3-tables'
import { PERIODIC_TABLE, elementBySymbol } from './periodic-data'
import type { ElementRecord } from './periodic-data'

/**
 * Elements Mendeleev could have placed in his 1869 table, by symbol. Standard chemical
 * history: each was known as an element by 1869 (fluorine was recognised as an element
 * then and isolated only in 1886). Excluded on purpose: the noble gases (not in his
 * table), scandium, gallium and germanium (found 1879, 1875 and 1886), and technetium
 * (1937). Review against a primary source before release.
 */
export const KNOWN_IN_1869_SYMBOLS: readonly string[] = [
  'H', 'Li', 'Be', 'B', 'C', 'N', 'O', 'F',
  'Na', 'Mg', 'Al', 'Si', 'P', 'S', 'Cl',
  'K', 'Ca', 'Ti', 'V', 'Cr', 'Mn', 'Fe', 'Co', 'Ni', 'Cu', 'Zn', 'As', 'Se', 'Br',
  'Rb', 'Sr', 'Y', 'Zr', 'Nb', 'Mo', 'Ru', 'Rh', 'Pd', 'Ag', 'Cd', 'In', 'Sn', 'Sb', 'Te', 'I',
  'Cs', 'Ba', 'La', 'Ce', 'Ta', 'W', 'Os', 'Ir', 'Pt', 'Au', 'Hg', 'Tl', 'Pb', 'Bi', 'Th', 'U',
]

/** Atomic numbers of the 1869-known set. Throws if a symbol is missing from the data. */
export const KNOWN_IN_1869: ReadonlySet<number> = new Set(
  KNOWN_IN_1869_SYMBOLS.map((symbol) => {
    const el = elementBySymbol(symbol)
    if (!el) throw new Error(`Unknown symbol in the 1869 list: ${symbol}`)
    return el.Z
  })
)

/** The oxide formula of a group-n element, from its valence (group − 10 for groups 13 to 17). */
export function oxideFormula(group: number, element = 'E'): string {
  const valence = group - 10
  const divisor = gcd(2, valence)
  const e = 2 / divisor
  const o = valence / divisor
  return `${element}${e === 1 ? '' : e}O${o === 1 ? '' : o}`
}

/** The chloride formula of a group-n element, from its valence. */
export function chlorideFormula(group: number, element = 'E'): string {
  return `${element}Cl${group - 10}`
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b)
}

/** Arithmetic mean. */
export function mean(values: readonly number[]): number {
  if (values.length === 0) throw new RangeError('mean needs at least one value')
  return values.reduce((sum, v) => sum + v, 0) / values.length
}

/** Absolute percentage error of an estimate against a reference value. */
export function percentError(estimate: number, reference: number): number {
  if (reference === 0) throw new RangeError('percentError needs a non-zero reference')
  return (Math.abs(estimate - reference) / Math.abs(reference)) * 100
}

/** The nearest known neighbour in each direction of a gap, or null where there is none. */
export interface Neighbours {
  left: ElementRecord | null
  right: ElementRecord | null
  above: ElementRecord | null
  below: ElementRecord | null
}

/**
 * Finds the nearest 1869-known element left, right, above and below a main-table cell
 * (row = period, col = group). Gaps are skipped, as Mendeleev skipped them: the
 * neighbour of a gap is the nearest element that was actually known.
 */
export function nearestKnownNeighbours(
  row: number,
  col: number,
  known: ReadonlySet<number> = KNOWN_IN_1869
): Neighbours {
  const cellAt = (r: number, c: number): ElementRecord | null => {
    const hit = PERIODIC_TABLE.find(
      (el) => el.fBlockRow === null && el.period === r && el.group === c && known.has(el.Z)
    )
    return hit ?? null
  }
  const scan = (dr: number, dc: number): ElementRecord | null => {
    for (let k = 1; k <= 18; k++) {
      const hit = cellAt(row + dr * k, col + dc * k)
      if (hit) return hit
    }
    return null
  }
  return {
    left: scan(0, -1),
    right: scan(0, 1),
    above: scan(-1, 0),
    below: scan(1, 0),
  }
}

/** One of Mendeleev's eka-elements, with his prediction and the value later found. */
export interface EkaElement {
  /** Mendeleev's name, for example "Eka-aluminium". */
  name: string
  /** The symbol NCERT uses for the predicted element. */
  symbol: 'E'
  /** Main-table position of the gap: period (row) and group (col). */
  row: number
  col: number
  /** The element that was later found in the gap, from PERIODIC_TABLE. */
  found: ElementRecord
  predicted: { atomicMass: number; density: number; oxide: string; chloride: string }
  measured: { atomicMass: number; density: number; oxide: string; chloride: string }
}

/** Reads a number from a printed NCERT Table 3.3 cell, failing loudly if it is not numeric. */
function printedNumber(text: string): number {
  const value = Number(text)
  if (!Number.isFinite(value)) throw new RangeError(`Not a number in Table 3.3: ${text}`)
  return value
}

function table33Row(property: string) {
  const row = NCERT_TABLE_3_3_MENDELEEV.rows.find((r) => r.property === property)
  if (!row) throw new RangeError(`Table 3.3 has no row named ${property}`)
  return row
}

const ATOMIC_WEIGHT = table33Row('Atomic weight')
const DENSITY = table33Row('Density/(g/cm3)')
const OXIDE = table33Row('Formula of oxide')
const CHLORIDE = table33Row('Formula of chloride')

function ekaElement(
  name: string,
  row: number,
  col: number,
  foundSymbol: string,
  pick: 'aluminium' | 'silicon'
): EkaElement {
  const found = elementBySymbol(foundSymbol)
  if (!found) throw new RangeError(`Unknown element ${foundSymbol}`)
  const predicted =
    pick === 'aluminium'
      ? {
          atomicMass: printedNumber(ATOMIC_WEIGHT.ekaAluminium.predicted),
          density: printedNumber(DENSITY.ekaAluminium.predicted),
          oxide: OXIDE.ekaAluminium.predicted,
          chloride: CHLORIDE.ekaAluminium.predicted,
        }
      : {
          atomicMass: printedNumber(ATOMIC_WEIGHT.ekaSilicon.predicted),
          density: printedNumber(DENSITY.ekaSilicon.predicted),
          oxide: OXIDE.ekaSilicon.predicted,
          chloride: CHLORIDE.ekaSilicon.predicted,
        }
  const measured =
    pick === 'aluminium'
      ? {
          atomicMass: printedNumber(ATOMIC_WEIGHT.ekaAluminium.gallium),
          density: printedNumber(DENSITY.ekaAluminium.gallium),
          oxide: OXIDE.ekaAluminium.gallium,
          chloride: CHLORIDE.ekaAluminium.gallium,
        }
      : {
          atomicMass: printedNumber(ATOMIC_WEIGHT.ekaSilicon.germanium),
          density: printedNumber(DENSITY.ekaSilicon.germanium),
          oxide: OXIDE.ekaSilicon.germanium,
          chloride: CHLORIDE.ekaSilicon.germanium,
        }
  return { name, symbol: 'E', row, col, found, predicted, measured }
}

/** Eka-aluminium: the gap in period 4, group 13, later filled by gallium (Z = 31). */
export const EKA_ALUMINIUM: EkaElement = ekaElement('Eka-aluminium', 4, 13, 'Ga', 'aluminium')
/** Eka-silicon: the gap in period 4, group 14, later filled by germanium (Z = 32). */
export const EKA_SILICON: EkaElement = ekaElement('Eka-silicon', 4, 14, 'Ge', 'silicon')

