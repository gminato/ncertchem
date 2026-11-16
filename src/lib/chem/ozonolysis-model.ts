/**
 * The models behind the ozonolysis Section (NCERT 9.3.5, items 6 to 8). Every product, name, equation
 * and condition comes from hydrocarbon-reactions.ts and hydrocarbon-species.ts. This file adds only what
 * those do not give: the forward reagent choice, the carbonyl carbons a learner may join in the reverse
 * puzzle (checked against ozonolysisReverse), and the polymer equation written for the repeat unit.
 */

import { canonicalKey, parseSmiles } from './molecule-parse'
import type { MolBond, MolGraph } from './molecule-graph'
import { deleteAtoms, joinGraphs, speciesOf } from './hydrocarbon-species'
import {
  acidicPermanganate,
  baeyer,
  ozonolysis,
  ozonolysisReverse,
  polymerise,
  type Reaction,
} from './hydrocarbon-reactions'
import { conditionFor } from './ncert-unit9-tables'

export type ForwardReagent = 'ozone' | 'baeyer' | 'acidic'

export const FORWARD_REAGENTS: readonly { value: ForwardReagent; label: string }[] = [
  { value: 'ozone', label: 'Ozone, then Zn and water' },
  { value: 'baeyer', label: 'Cold dilute KMnO₄' },
  { value: 'acidic', label: 'Hot acidic KMnO₄' },
]

/** Alkenes the forward model offers as presets. The last one is a diene: two C=C bonds. */
export const FORWARD_PRESETS = [
  { id: 'but-2-ene', smiles: 'CC=CC' },
  { id: '2-methylbut-2-ene', smiles: 'CC=C(C)C' },
  { id: '1-methylcyclohexene', smiles: 'CC1=CCCCC1' },
  { id: 'penta-1,3-diene', smiles: 'C=CC=CC' },
] as const

/**
 * A straight-chain alkene with n carbons and its C=C between carbons k and k + 1 (1-based k).
 *
 * @throws {RangeError} If n is below 2 or k is not a position inside the chain
 */
export function chainAlkeneSmiles(n: number, k: number): string {
  if (!Number.isInteger(n) || n < 2) throw new RangeError('A chain alkene needs at least two carbons')
  if (!Number.isInteger(k) || k < 1 || k > n - 1) throw new RangeError('The double bond must lie between two carbons of the chain')
  let s = ''
  for (let i = 1; i <= n; i++) {
    s += 'C'
    if (i === k) s += '='
  }
  return s
}

/** The reaction of an alkene with the chosen reagent, from the lib.
 *
 * @throws {RangeError} If the reagent does not apply (Baeyer's test takes one C=C; ozonolysis needs one)
 */
export function forwardReaction(alkene: MolGraph, reagent: ForwardReagent): Reaction {
  if (reagent === 'ozone') return ozonolysis(alkene)
  if (reagent === 'baeyer') return baeyer(alkene)
  return acidicPermanganate(alkene)
}

/** The number of C=C bonds in a graph. */
export function doubleBondCount(g: MolGraph): number {
  return g.bonds.filter((b) => b.order === 2 && g.atoms[b.a].element === 'C' && g.atoms[b.b].element === 'C').length
}

/** A carbon that carries a C=O, and the oxygen of that C=O. `part` indexes the products. */
export interface CarbonylCarbon {
  part: number
  atom: number
  oxygen: number
}

/** The carbonyl carbons of a set of products: each C=O carbon with no C=C (an aldehyde or ketone). */
export function carbonylCarbons(products: readonly MolGraph[]): CarbonylCarbon[] {
  const found: CarbonylCarbon[] = []
  products.forEach((p, part) => {
    p.bonds.forEach((b) => {
      for (const [c, o] of [
        [b.a, b.b],
        [b.b, b.a],
      ] as const) {
        if (b.order !== 2 || p.atoms[c].element !== 'C' || p.atoms[o].element !== 'O') continue
        const carbonDouble = p.bonds.some(
          (x) => x.order === 2 && ((x.a === c && p.atoms[x.b].element === 'C') || (x.b === c && p.atoms[x.a].element === 'C')),
        )
        if (!carbonDouble && !found.some((f) => f.part === part && f.atom === c)) found.push({ part, atom: c, oxygen: o })
      }
    })
  })
  return found.sort((x, y) => x.part - y.part || x.atom - y.atom)
}

/**
 * The alkene made by joining two carbonyl carbons with a C=C: their oxygens are removed and the
 * carbons are bonded. The graph is returned as the learner builds it; the caller checks it.
 *
 * @throws {RangeError} If the two picks are the same carbon, or either is not a carbonyl carbon
 */
export function joinCarbonyls(products: readonly MolGraph[], a: CarbonylCarbon, b: CarbonylCarbon): MolGraph {
  if (a.part === b.part && a.atom === b.atom) throw new RangeError('Choose two different carbons')
  const known = carbonylCarbons(products)
  const isKnown = (x: CarbonylCarbon) => known.some((k) => k.part === x.part && k.atom === x.atom)
  if (!isKnown(a) || !isKnown(b)) throw new RangeError('Only the carbons of C=O groups can be joined')
  const picks = [a, b]
  const stripped = products.map((p, part) => {
    const drop = picks.filter((x) => x.part === part).map((x) => x.oxygen)
    return drop.length ? deleteAtoms(p, drop) : p
  })
  const newIndex = (x: CarbonylCarbon) => {
    const drop = picks.filter((k) => k.part === x.part).map((k) => k.oxygen)
    return x.atom - drop.filter((o) => o < x.atom).length
  }
  const offsets: number[] = []
  let running = 0
  for (const p of stripped) {
    offsets.push(running)
    running += p.atoms.length
  }
  const bond: MolBond = { a: offsets[a.part] + newIndex(a), b: offsets[b.part] + newIndex(b), order: 2 }
  return joinGraphs(stripped, [bond])
}

/** The reverse puzzle: the alkene the learner builds, the lib's answer, and whether they agree. */
export function checkReverse(
  products: readonly MolGraph[],
  a: CarbonylCarbon,
  b: CarbonylCarbon,
): { matches: boolean; built: MolGraph; expected: MolGraph; expectedName: string } {
  const built = joinCarbonyls(products, a, b)
  const answer = ozonolysisReverse([...products]).products[0]
  return {
    matches: canonicalKey(built) === canonicalKey(answer.graph),
    built,
    expected: answer.graph,
    expectedName: answer.name,
  }
}

/** The reverse puzzles: the carbonyl products the lib cuts an alkene into (each set has exactly two carbonyl carbons). */
export const REVERSE_PUZZLES = [
  { id: 'two-molecules', label: 'Propanal and propanone', smiles: ['CCC=O', 'CC(=O)C'] },
  { id: 'one-molecule', label: '6-Oxoheptanal', smiles: ['O=CCCCCC(=O)C'] },
  { id: 'hept-3-ene', label: 'Butanal and propanal', smiles: ['CCCC=O', 'CCC=O'] },
] as const

/** The graphs of a reverse puzzle. */
export function puzzleProducts(id: (typeof REVERSE_PUZZLES)[number]['id']): MolGraph[] {
  const puzzle = REVERSE_PUZZLES.find((p) => p.id === id)
  if (!puzzle) throw new RangeError(`No reverse puzzle called ${id}`)
  return puzzle.smiles.map((s) => parseSmiles(s))
}

/**
 * The equation of polymerisation, written for the repeat unit: the C=C of each monomer is opened and
 * the units join end to end. The lib's polymerise() keeps the double bond in its printed product, so
 * the repeat unit is taken from its graph here, with the conditions NCERT gives (9.53, 9.54).
 */
export function polymerEquation(monomer: MolGraph): { equation: string; unit: string; monomer: string } {
  const r = polymerise(monomer)
  const unit = r.products[0].graph
  const monomerLabel = speciesOf(monomer).label
  const unitLabel = speciesOf(unit).label.replace(/=/g, '')
  const condition = conditionFor('polymerisation').text
  return {
    monomer: monomerLabel,
    unit: unitLabel,
    equation: `\\ce{n ${monomerLabel} ->[${condition}] (${unitLabel})_{n}}`,
  }
}
