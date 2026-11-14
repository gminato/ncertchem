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

export interface IupacElision {
  /** Position of the dropped letter in `raw`. */
  index: number
  letter: string
  /** Which rule drops it. */
  rule: 'i-of-ium' | 'n-of-enn'
}

export interface IupacBreakdown {
  Z: number
  segments: IupacSegment[]
  /** The roots joined in order, before the ending is added. */
  joined: string
  /** The roots with "ium" added, before any elision. */
  raw: string
  /**
   * Letters dropped from `raw`, in order of position. Two rules apply. A root that ends in
   * "i" (bi, tri) keeps its "i", so the "i" of "ium" is dropped: "bi" + "ium" gives "bium".
   * Before "nil", one "n" of "enn" is dropped: "enn" + "nil" gives "ennil".
   */
  elisions: IupacElision[]
  /** The final name, from iupacName(Z). */
  name: string
  /** The systematic symbol, from iupacSymbol(Z). */
  symbol: string
}

/**
 * Breaks element Z into its digits, roots and ending, and lists the elisions applied.
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
  const elisions: IupacElision[] = []
  let offset = 0
  segments.forEach((seg, i) => {
    const next = segments[i + 1]
    if (seg.root === 'enn' && next && next.root === 'nil') {
      // The last letter of "enn" is the dropped n.
      elisions.push({ index: offset + 2, letter: 'n', rule: 'n-of-enn' })
    }
    offset += seg.root.length
  })
  const lastRoot = segments[segments.length - 1].root
  if (lastRoot.endsWith('i')) {
    elisions.push({ index: joined.length, letter: 'i', rule: 'i-of-ium' })
  }
  return { Z, segments, joined, raw, elisions, name, symbol }
}

/**
 * The name the breakdown reconstructs by dropping each elided letter from `raw`. For every
 * Z from 100 to 999 this equals `name`, which the tests check.
 */
export function reconstructName(b: IupacBreakdown): string {
  let out = b.raw
  for (const e of [...b.elisions].reverse()) {
    out = out.slice(0, e.index) + out.slice(e.index + 1)
  }
  return out
}
