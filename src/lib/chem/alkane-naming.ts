/**
 * The parent chain and its numbering for an acyclic alkane (NCERT Class 11 Unit 8, Section 8.5.2).
 *
 * The chain choice and the numbering follow iupac-organic.ts: the longest chain wins, and between
 * chains of equal length the one with more side chains wins. Numbering gives the lowest locant set
 * to the substituents, comparing the two ends by the first point of difference. This module exposes
 * the atoms that the lib's name is built on, so an animation can show them; iupacName stays the
 * source of every name. Tests check that these atoms and locants agree with nameSteps.
 *
 * Only neutral, saturated, acyclic carbon skeletons are accepted. Anything else throws a RangeError.
 */

import type { MolGraph } from './molecule-graph'
import { neighbours } from './molecule-parse'

/** The parent chain: its atoms in path order (one end first) and the number of side chains on it. */
export interface AlkaneChain {
  atoms: number[]
  /** Carbons bonded to the chain but not part of it, counted once each. */
  substituentCount: number
}

/** The two ways of numbering a chain, and the one the name uses. */
export interface ChainNumbering {
  /** Sorted substituent locants when the chain is numbered from its first atom. */
  fromFirst: number[]
  /** Sorted substituent locants when the chain is numbered from its last atom. */
  fromLast: number[]
  /** `order[k]` is the chain atom that carries locant k + 1 in the numbering the name uses. */
  order: number[]
  /** The substituent locants of that numbering, sorted. */
  locants: number[]
  /**
   * True when there are two or more side chains and both ends give the same locant set. The name
   * then turns on the alphabetical rule (or on symmetry), so `order` is only a placeholder: read the
   * direction from the name, not from this flag.
   */
  tie: boolean
}

/** Throws unless g is a connected, neutral, saturated, acyclic carbon skeleton. */
export function assertAlkaneSkeleton(g: MolGraph): void {
  const n = g.atoms.length
  if (n === 0) throw new RangeError('An empty molecule has no chain')
  if (g.atoms.some((a) => a.element !== 'C' || (a.charge ?? 0) !== 0 || (a.radical ?? 0) !== 0)) {
    throw new RangeError('Only neutral carbon skeletons are named here')
  }
  if (g.bonds.some((b) => b.order !== 1)) {
    throw new RangeError('Only saturated (single-bonded) skeletons are named here')
  }
  if (g.bonds.length !== n - 1) {
    throw new RangeError('Only acyclic skeletons are named here')
  }
  const seen = new Set<number>([0])
  const queue = [0]
  while (queue.length > 0) {
    const x = queue.pop() as number
    for (const nb of neighbours(g, x)) {
      if (!seen.has(nb.atom)) {
        seen.add(nb.atom)
        queue.push(nb.atom)
      }
    }
  }
  if (seen.size !== n) throw new RangeError('The skeleton is in more than one piece')
}

/** Breadth-first order from `start`, and the parent of each atom on the tree path from `start`. */
function bfsTree(g: MolGraph, start: number): { order: number[]; parent: Map<number, number> } {
  const parent = new Map<number, number>([[start, -1]])
  const order = [start]
  for (let k = 0; k < order.length; k++) {
    const x = order[k]
    for (const nb of neighbours(g, x)) {
      if (!parent.has(nb.atom)) {
        parent.set(nb.atom, x)
        order.push(nb.atom)
      }
    }
  }
  return { order, parent }
}

/** The tree path from `start` to `end`, both included. */
function pathBetween(parent: Map<number, number>, start: number, end: number): number[] {
  const path: number[] = []
  for (let x = end; x !== -1; x = parent.get(x) as number) path.push(x)
  path.reverse()
  if (path[0] !== start) throw new RangeError('No path between the atoms')
  return path
}

/** Carbons bonded to the path but not on it. In an alkane every such neighbour is a side chain. */
function sideChainCount(g: MolGraph, path: number[]): number {
  const on = new Set(path)
  let count = 0
  for (const x of path) {
    for (const nb of neighbours(g, x)) if (!on.has(nb.atom)) count++
  }
  return count
}

/**
 * The parent chain the name is built on: the longest carbon path, and between equal paths the one
 * with the most side chains. Equal scores keep the first path found, searching from the lowest-
 * numbered atom, exactly as iupac-organic.ts does, so the two always agree.
 *
 * @example alkaneChain(parseSmiles('CCCCC(CC)C(C)C')).atoms.length // 7
 * @throws {RangeError} If g is not a saturated acyclic carbon skeleton
 */
export function alkaneChain(g: MolGraph): AlkaneChain {
  assertAlkaneSkeleton(g)
  const n = g.atoms.length
  if (n === 1) return { atoms: [0], substituentCount: 0 }
  let best: { length: number; subs: number; path: number[] } | null = null
  for (let u = 0; u < n; u++) {
    const { order, parent } = bfsTree(g, u)
    for (const v of order) {
      if (v < u) continue
      const path = pathBetween(parent, u, v)
      const subs = sideChainCount(g, path)
      if (best === null || path.length > best.length || (path.length === best.length && subs > best.subs)) {
        best = { length: path.length, subs, path }
      }
    }
  }
  const chosen = best as { length: number; subs: number; path: number[] }
  return { atoms: chosen.path, substituentCount: chosen.subs }
}

/** Sorted locants of the side chains when the chain atoms are numbered in the given order. */
function locantsFor(g: MolGraph, order: number[]): number[] {
  const on = new Set(order)
  const out: number[] = []
  order.forEach((x, k) => {
    for (const nb of neighbours(g, x)) if (!on.has(nb.atom)) out.push(k + 1)
  })
  return out.sort((a, b) => a - b)
}

/**
 * The two numberings of a chain and the one the name uses: the lower locant set wins, compared
 * term by term from the smallest (the first point of difference).
 *
 * @throws {RangeError} If the chain is not a path of the skeleton
 */
export function chainNumbering(g: MolGraph, chain: AlkaneChain): ChainNumbering {
  assertAlkaneSkeleton(g)
  const forward = chain.atoms
  const reverse = chain.atoms.slice().reverse()
  for (let k = 0; k + 1 < forward.length; k++) {
    if (!neighbours(g, forward[k]).some((nb) => nb.atom === forward[k + 1])) {
      throw new RangeError('The chain atoms are not bonded in sequence')
    }
  }
  const fromFirst = locantsFor(g, forward)
  const fromLast = locantsFor(g, reverse)
  const cmp = fromFirst.findIndex((x, i) => x !== fromLast[i])
  const useFirst = cmp < 0 || fromFirst[cmp] < fromLast[cmp]
  return {
    fromFirst,
    fromLast,
    order: useFirst ? forward : reverse,
    locants: useFirst ? fromFirst : fromLast,
    tie: cmp < 0 && fromFirst.length >= 2,
  }
}

/** The locant (1-based) of every chain atom in the chosen numbering, or null for atoms off the chain. */
export function locantByAtom(g: MolGraph, numbering: ChainNumbering): (number | null)[] {
  const out: (number | null)[] = g.atoms.map(() => null)
  numbering.order.forEach((x, k) => {
    out[x] = k + 1
  })
  return out
}

const STEM_SIZE: Record<string, number> = { meth: 1, eth: 2, prop: 3, but: 4, pent: 5, hex: 6, hept: 7, oct: 8, non: 9, dec: 10 }
const TRIVIAL_SIZE: Record<string, number> = { isopropyl: 3, 'sec-butyl': 4, isobutyl: 4, 'tert-butyl': 4 }

/**
 * Carbons in a side chain, read from the name the lib gives it (for example 'ethyl' is 2 and
 * 'sec-butyl' is 4). Null for a name this function does not recognise.
 */
export function alkylSize(text: string): number | null {
  if (TRIVIAL_SIZE[text] !== undefined) return TRIVIAL_SIZE[text]
  const m = /^(meth|eth|prop|but|pent|hex|hept|oct|non|dec)yl$/.exec(text)
  return m ? STEM_SIZE[m[1]] : null
}

/** Carbons on each side chain of the chain, as (size, locant) pairs in the given numbering. */
function sideChainSizes(g: MolGraph, order: number[]): { size: number; locant: number }[] {
  const on = new Set(order)
  const out: { size: number; locant: number }[] = []
  order.forEach((x, k) => {
    for (const nb of neighbours(g, x)) {
      if (on.has(nb.atom)) continue
      const seen = new Set<number>([x, nb.atom])
      const stack = [nb.atom]
      while (stack.length > 0) {
        const y = stack.pop() as number
        for (const z of neighbours(g, y)) {
          if (!seen.has(z.atom)) {
            seen.add(z.atom)
            stack.push(z.atom)
          }
        }
      }
      out.push({ size: seen.size - 1, locant: k + 1 })
    }
  })
  return out
}

/**
 * Settles a tie in the numbering with the lib's own substituent list (the `substituent` steps of
 * nameSteps, in the order the name prints them). Where the locant sets are equal, the name puts
 * the alphabetically first side chain on the lower locant; this picks the direction whose side
 * chain sizes at each locant match the name. Returns the numbering unchanged when the name's
 * side chains cannot be matched to either direction.
 */
export function resolveTie(
  g: MolGraph,
  numbering: ChainNumbering,
  substituents: readonly { text: string; locant: number }[]
): ChainNumbering {
  if (!numbering.tie) return numbering
  const sizes = substituents.map((s) => alkylSize(s.text))
  if (sizes.some((x) => x === null)) return numbering
  const libPairs = substituents.map((s, i) => `${sizes[i]}@${s.locant}`).sort().join(' ')
  const forward = sideChainSizes(g, numbering.order)
  const reverseOrder = numbering.order.slice().reverse()
  const reverse = sideChainSizes(g, reverseOrder)
  const pairKey = (list: { size: number; locant: number }[]) =>
    list.map((p) => `${p.size}@${p.locant}`).sort().join(' ')
  const matchFwd = pairKey(forward) === libPairs
  const matchRev = pairKey(reverse) === libPairs
  if (matchFwd && !matchRev) return { ...numbering, tie: false }
  if (matchRev && !matchFwd) return { ...numbering, order: reverseOrder, locants: numbering.fromLast, tie: false }
  if (matchFwd && matchRev) return { ...numbering, tie: false }
  return numbering
}
