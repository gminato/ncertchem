/**
 * Structural isomers (NCERT Class 11 Unit 8, Section 8.6.1): enumeration of the alkane isomers
 * and classification of a pair of molecules as identical, chain, position, functional,
 * metameric, or not isomers.
 */

import type { MolGraph } from './molecule-graph'
import { canonicalKey, molecularFormula, neighbours } from './molecule-parse'
import { iupacName } from './iupac-organic'

/** One structural isomer of an alkane: its graph and IUPAC name. */
export interface AlkaneIsomer {
  graph: MolGraph
  name: string
}

/** Builds the tree on `n` labelled carbons from a Prüfer sequence. */
function treeFromPrufer(sequence: number[], n: number): [number, number][] {
  const degree = new Array<number>(n).fill(1)
  for (const x of sequence) degree[x]++
  const edges: [number, number][] = []
  const seq = sequence.slice()
  for (const x of seq) {
    let leaf = 0
    while (degree[leaf] !== 1) leaf++
    edges.push([leaf, x])
    degree[leaf]--
    degree[x]--
  }
  const last = degree.map((d, i) => (d === 1 ? i : -1)).filter((i) => i >= 0)
  edges.push([last[0], last[1]])
  return edges
}

/**
 * All structural isomers of CnH(2n+2) for 1 <= n <= 7, each once, sorted by name. Built from every
 * labelled tree on n carbons with no carbon of more than four bonds, then de-duplicated by
 * canonicalKey. Counts: 1, 1, 1, 2, 3, 5, 9.
 *
 * @throws {RangeError} If n is not an integer from 1 to 7
 */
export function alkaneIsomers(n: number): AlkaneIsomer[] {
  if (!Number.isInteger(n) || n < 1 || n > 7) {
    throw new RangeError('alkaneIsomers supports n from 1 to 7')
  }
  const buildGraph = (edges: [number, number][]): MolGraph => {
    const deg = new Array<number>(n).fill(0)
    for (const [a, b] of edges) {
      deg[a]++
      deg[b]++
    }
    return {
      atoms: deg.map((d) => ({ element: 'C', hCount: 4 - d })),
      bonds: edges.map(([a, b]) => ({ a, b, order: 1 as const })),
    }
  }
  if (n === 1) {
    const g: MolGraph = { atoms: [{ element: 'C', hCount: 4 }], bonds: [] }
    return [{ graph: g, name: iupacName(g) }]
  }
  const seen = new Map<string, AlkaneIsomer>()
  const total = n ** (n - 2)
  for (let code = 0; code < total; code++) {
    const sequence: number[] = []
    let rest = code
    for (let k = 0; k < n - 2; k++) {
      sequence.push(rest % n)
      rest = Math.floor(rest / n)
    }
    const edges = n === 2 ? [[0, 1] as [number, number]] : treeFromPrufer(sequence, n)
    const degrees = new Array<number>(n).fill(0)
    for (const [a, b] of edges) {
      degrees[a]++
      degrees[b]++
    }
    if (degrees.some((d) => d > 4)) continue
    const g = buildGraph(edges)
    const key = canonicalKey(g)
    if (!seen.has(key)) {
      seen.set(key, { graph: g, name: iupacName(g) })
    }
  }
  return [...seen.values()].sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))
}

/** The kinds of isomerism of NCERT 8.6.1 that isomerRelation reports. */
export type IsomerRelation = 'identical' | 'chain' | 'position' | 'functional' | 'metamerism' | 'not isomers'

/** Heteroatom and functional-group summary: element, bonded H count and bond orders to carbon. */
function functionalClassKey(g: MolGraph): string {
  const parts: string[] = []
  g.atoms.forEach((a, i) => {
    if (a.element === 'C' || a.element === 'H') return
    const bonds = neighbours(g, i).map((nb) => {
      const carbonyl = nb.order >= 2 && g.atoms[nb.atom].element === 'C'
      return `${nb.order}${carbonyl ? `c${g.atoms[nb.atom].hCount ?? 0}` : ''}`
    })
    parts.push(`${a.element}h${a.hCount ?? 0}[${bonds.sort().join(',')}]`)
  })
  let cc = 0
  let rings = 0
  g.bonds.forEach((b) => {
    if (g.atoms[b.a].element === 'C' && g.atoms[b.b].element === 'C') {
      cc += b.order - 1
    }
  })
  rings = g.bonds.length - g.atoms.length + 1
  return `${parts.sort().join(';')}|pi${cc}|rings${rings}`
}

/** Sizes of the carbon fragments left when every heteroatom is removed (the alkyl groups). */
function fragmentSizes(g: MolGraph): string {
  const n = g.atoms.length
  const seen = new Array<boolean>(n).fill(false)
  const sizes: number[] = []
  for (let i = 0; i < n; i++) {
    if (seen[i] || g.atoms[i].element !== 'C') continue
    let size = 0
    const stack = [i]
    seen[i] = true
    while (stack.length) {
      const x = stack.pop() as number
      size++
      for (const nb of neighbours(g, x)) {
        if (!seen[nb.atom] && g.atoms[nb.atom].element === 'C') {
          seen[nb.atom] = true
          stack.push(nb.atom)
        }
      }
    }
    sizes.push(size)
  }
  return sizes.sort((a, b) => a - b).join(',')
}

/** Carbon-only skeleton (heteroatoms and bond orders removed), used to test chain isomerism. */
function skeletonKey(g: MolGraph): string {
  const index = new Map<number, number>()
  g.atoms.forEach((a, i) => {
    if (a.element === 'C') index.set(i, index.size)
  })
  const carbons: MolGraph = {
    atoms: [...index.keys()].map(() => ({ element: 'C', hCount: 0 })),
    bonds: g.bonds
      .filter((b) => index.has(b.a) && index.has(b.b))
      .map((b) => ({ a: index.get(b.a) as number, b: index.get(b.b) as number, order: 1 as const })),
  }
  return canonicalKey(carbons)
}

/**
 * Relation between two molecules (NCERT 8.6.1):
 * - 'identical' if they are the same molecule drawn twice;
 * - 'not isomers' if the molecular formulas differ;
 * - 'functional' if the functional groups differ (e.g. alcohol and ether, aldehyde and ketone,
 *   alkene and cycloalkane);
 * - 'metamerism' if the same functional group has different alkyl groups on each side of it;
 * - 'chain' if the carbon skeleton differs;
 * - 'position' if only the position of a group or multiple bond differs.
 */
export function isomerRelation(g1: MolGraph, g2: MolGraph): IsomerRelation {
  if (canonicalKey(g1) === canonicalKey(g2)) return 'identical'
  if (molecularFormula(g1) !== molecularFormula(g2)) return 'not isomers'
  if (functionalClassKey(g1) !== functionalClassKey(g2)) return 'functional'
  if (fragmentSizes(g1) !== fragmentSizes(g2)) return 'metamerism'
  if (skeletonKey(g1) !== skeletonKey(g2)) return 'chain'
  return 'position'
}
