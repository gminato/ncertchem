/**
 * Structural isomers of the alkynes CnH(2n-2) (NCERT 9.4.1). Every acyclic alkyne has one C≡C
 * between two carbons that each carry at most one other carbon: an end carbon (CH) or a
 * chain carbon with two carbon neighbours. The isomers are found by placing one triple bond on
 * each carbon skeleton from alkaneIsomers, then de-duplicating by canonicalKey. Names come from
 * the Unit 8 namer (iupacName), so every name is the lib's.
 */

import type { MolGraph } from './molecule-graph'
import { alkaneIsomers } from './isomers'
import { canonicalKey, molecularFormula } from './molecule-parse'
import { iupacName } from './iupac-organic'

/** One structural isomer of an alkyne: its graph, IUPAC name and molecular formula. */
export interface AlkyneIsomer {
  graph: MolGraph
  name: string
  formula: string
}

/** Smallest and largest n that alkyneIsomers accepts (C2H2 to C6H10). */
export const ALKYNE_MIN_N = 2
export const ALKYNE_MAX_N = 6

/**
 * Every structural isomer of CnH(2n-2) with one C≡C and no other multiple bond, each once.
 * Counts: C2H2 1, C3H4 1, C4H6 2, C5H8 3, C6H10 7.
 *
 * @throws {RangeError} If n is not an integer from 2 to 6
 */
export function alkyneIsomers(n: number): AlkyneIsomer[] {
  if (!Number.isInteger(n) || n < ALKYNE_MIN_N || n > ALKYNE_MAX_N) {
    throw new RangeError(`alkyneIsomers supports n from ${ALKYNE_MIN_N} to ${ALKYNE_MAX_N}`)
  }
  const seen = new Map<string, AlkyneIsomer>()
  for (const skeleton of alkaneIsomers(n)) {
    const { atoms, bonds } = skeleton.graph
    const degree = atoms.map(() => 0)
    for (const b of bonds) {
      degree[b.a]++
      degree[b.b]++
    }
    bonds.forEach((bond, k) => {
      // A triple-bonded carbon has one more bond to spare for each carbon neighbour it lacks.
      if (degree[bond.a] > 2 || degree[bond.b] > 2) return
      const next: MolGraph = {
        atoms: atoms.map((atom, i) =>
          i === bond.a || i === bond.b ? { ...atom, hCount: 2 - degree[i] } : { ...atom },
        ),
        bonds: bonds.map((b, j) => ({ ...b, order: j === k ? (3 as const) : b.order })),
      }
      const key = canonicalKey(next)
      if (!seen.has(key)) {
        seen.set(key, { graph: next, name: iupacName(next), formula: molecularFormula(next) })
      }
    })
  }
  return [...seen.values()].sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))
}
