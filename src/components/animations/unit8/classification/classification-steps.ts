/**
 * The Steps of the classification-tree Scrolly (Section 8.4). Steps 1 to 4 sort real molecules
 * into NCERT's classes, one class per Step. Step 5 lays out the alcohol homologous series and
 * marks the carbon each member adds. Step 6 plots the boiling points. Pure data: the drawing
 * component reads it, and every class, name, formula and boiling point comes from the lib.
 */

import type { MolGraph } from '@/lib/chem/molecule-graph'
import { parseSmiles, molecularFormula } from '@/lib/chem/molecule-parse'
import { classifyMolecule, type RingClass, type Subclass } from '@/lib/chem/classification'
import { alcoholSeries, safeName, type AlcoholMember } from '@/lib/chem/classification-examples'

/** The four classes drawn as tree columns, in the order NCERT's tree lists them. */
export type ColumnKey = RingClass

export interface TreeColumn {
  key: ColumnKey
  /** Node text, numbered as NCERT numbers the branches. */
  label: string
  /** Centre x of the column in the drawing's 580-unit width. */
  x: number
  /** The real molecules sorted into this class. */
  leaves: readonly string[]
}

export const TREE_COLUMNS: readonly TreeColumn[] = [
  { key: 'acyclic', label: 'I. Acyclic', x: 100, leaves: ['CCCCCC', 'CC(C)CCC', 'CC(=O)O'] },
  { key: 'alicyclic', label: 'II(a). Alicyclic', x: 235, leaves: ['C1CC1', 'C1CCCCC1', 'C1=CCCCC1'] },
  { key: 'aromatic', label: 'II(b). Aromatic', x: 370, leaves: ['C1=CC=CC=C1', 'C1=CC=C2C=CC=CC2=C1', 'O=C1C=CC=CC=C1'] },
  { key: 'heterocyclic', label: 'II(c). Heterocyclic', x: 505, leaves: ['C1=COC=C1', 'C1=CC=NC=C1', 'C1CCOC1'] },
]

/** One drawn molecule in a tree column, with the lib's class and subclass for it. */
export interface TreeLeaf {
  smiles: string
  graph: MolGraph
  formula: string
  name: string | null
  ringClass: RingClass
  subclass: Subclass
}

/** The leaves of one column, classified by the lib. */
export function treeLeaves(column: TreeColumn): TreeLeaf[] {
  return column.leaves.map((smiles) => {
    const graph = parseSmiles(smiles)
    const c = classifyMolecule(graph)
    return { smiles, graph, formula: molecularFormula(graph), name: safeName(graph), ringClass: c.ringClass, subclass: c.subclass }
  })
}

export type ClassificationStep =
  | { kind: 'tree'; active: ColumnKey; revealed: ColumnKey[] }
  | { kind: 'ladder' }
  | { kind: 'boiling' }

/** The Steps in order: four tree Steps (one class each), the ladder and the boiling points. */
export function classificationSteps(): ClassificationStep[] {
  const order: ColumnKey[] = ['acyclic', 'alicyclic', 'aromatic', 'heterocyclic']
  const tree: ClassificationStep[] = order.map((key, i) => ({
    kind: 'tree',
    active: key,
    revealed: order.slice(0, i + 1),
  }))
  return [...tree, { kind: 'ladder' }, { kind: 'boiling' }]
}

/**
 * The carbon that a member adds to the one before it in a straight alcohol series: the carbon
 * farthest from the oxygen along the chain. For CH₃CH₂OH that is the CH₃ carbon; the chain of
 * the next member is one carbon longer, and so is this one.
 */
export function farthestCarbonFromOxygen(g: MolGraph): number {
  const o = g.atoms.findIndex((a) => a.element === 'O')
  if (o < 0) throw new RangeError('the molecule has no oxygen')
  const dist = new Map<number, number>([[o, 0]])
  const queue = [o]
  while (queue.length > 0) {
    const u = queue.shift() as number
    for (const b of g.bonds) {
      const v = b.a === u ? b.b : b.b === u ? b.a : -1
      if (v >= 0 && !dist.has(v)) {
        dist.set(v, (dist.get(u) ?? 0) + 1)
        queue.push(v)
      }
    }
  }
  let best = -1
  let bestDist = -1
  for (const [atom, d] of dist) {
    if (g.atoms[atom].element === 'C' && d > bestDist) {
      best = atom
      bestDist = d
    }
  }
  return best
}

/** The alcohol series with the carbon each member adds (none for methanol, its only carbon). */
export function ladderMembers(): (AlcoholMember & { newCarbon: number })[] {
  return alcoholSeries().map((m) => ({ ...m, newCarbon: farthestCarbonFromOxygen(m.graph) }))
}

/** The difference in boiling point between each pair of neighbouring alcohols, in degrees. */
export function boilingRises(members: readonly AlcoholMember[]): number[] {
  return members.slice(1).map((m, i) => m.boilingPointC - members[i].boilingPointC)
}
