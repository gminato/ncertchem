/**
 * Step-by-step breakdown of a systematic IUPAC element name (NCERT Class 11 Unit 3, section
 * 3.4, Table 3.4). Each digit of Z gives one root, the roots are joined in order, and "ium"
 * is added. The final name and symbol come from periodicity.ts so the builder can never
 * disagree with the rest of the site. This module adds the intermediate steps the builder
 * shows.
 */

import { NCERT_TABLE_3_4_ROOTS } from './ncert-unit3-tables'
import { iupacName, iupacSymbol } from './periodicity'

export interface IupacSegment {
  /** The digit of Z at this place, 0 to 9. */
  digit: number
  root: string
  abbreviation: string
}

export interface IupacBreakdown {
  Z: number
  segments: IupacSegment[]
  /** The roots joined in order, before the ending is added. */
  joined: string
  /** The roots with "ium" added, before any elision. */
  raw: string
  /**
   * The elision applied to the raw name, if any. A root that ends in "i" (bi, tri) keeps
   * its "i", so the "i" of "ium" is dropped: "bi" + "ium" gives "bium". `index` is the
   * position in `raw` of the dropped letter.
   */
  elision: { index: number; letter: string } | null
  /** The final name, from iupacName(Z). */
  name: string
  /** The systematic symbol, from iupacSymbol(Z). */
  symbol: string
}

/**
 * Breaks element Z into its digits, roots and ending, and reports the elision applied.
 *
 * @throws {RangeError} If Z is not an integer from 100 to 999
 */
export function iupacBreakdown(Z: number): IupacBreakdown {
  const name = iupacName(Z)
  const symbol = iupacSymbol(Z)
  const segments: IupacSegment[] = String(Z)
    .split('')
    .map(Number)
    .map((digit) => {
      const row = NCERT_TABLE_3_4_ROOTS.rows.find((r) => r.digit === digit)
      if (!row) throw new RangeError(`No IUPAC root for digit ${digit}`)
      return { digit, root: row.root, abbreviation: row.abbreviation }
    })
  const joined = segments.map((s) => s.root).join('')
  const raw = `${joined}ium`
  const lastRoot = segments[segments.length - 1].root
  const elision = lastRoot.endsWith('i') ? { index: joined.length, letter: 'i' } : null
  return { Z, segments, joined, raw, elision, name, symbol }
}

/**
 * The name the breakdown reconstructs from the raw name and the elision. It should match
 * `name` for every Z except those where a root "enn" meets "nil" (see the report on
 * periodicity.ts), which this function does not claim to handle.
 */
export function reconstructName(b: IupacBreakdown): string {
  if (!b.elision) return b.raw
  return b.raw.slice(0, b.elision.index) + b.raw.slice(b.elision.index + 1)
}
