/**
 * The alkane synthesis planner (NCERT 9.2.2): a learner picks a target alkane, a route and the
 * starting material or materials from a menu, and the reaction models in hydrocarbon-reactions.ts
 * say what forms. Every name, product, equation, condition and carbon count comes from those
 * models; this file only chooses the menus and reads the results.
 */

import { parseSmiles, canonicalKey } from './molecule-parse'
import type { MolGraph } from './molecule-graph'
import { nameOf } from './hydrocarbon-species'
import { decarboxylate, hydrogenate, kolbe, reduceAlkylHalide, wurtz, type Reaction } from './hydrocarbon-reactions'

export type PlannerRoute = 'hydrogenate' | 'reduce' | 'wurtz' | 'decarboxylate' | 'kolbe'

export interface MenuItem {
  /** Stable id for the select element. */
  id: string
  /** A SMILES string for the starting material or target. */
  smiles: string
}

export const ROUTE_LABELS: Record<PlannerRoute, string> = {
  hydrogenate: 'Hydrogenation (H₂, Pt/Pd/Ni)',
  reduce: 'Zinc and acid reduction',
  wurtz: 'Wurtz reaction (Na, dry ether)',
  decarboxylate: 'Decarboxylation (sodalime)',
  kolbe: "Kolbe's electrolysis",
}

/** Targets the learner tries to make: one per row of the NCERT alkane list plus one branched alkane. */
export const TARGET_MENU: readonly MenuItem[] = [
  { id: 'methane', smiles: 'C' },
  { id: 'ethane', smiles: 'CC' },
  { id: 'propane', smiles: 'CCC' },
  { id: 'butane', smiles: 'CCCC' },
  { id: 'pentane', smiles: 'CCCCC' },
  { id: 'hexane', smiles: 'CCCCCC' },
  { id: 'dimethylbutane', smiles: 'CC(C)C(C)C' },
]

/** Starting materials for each route. The Wurtz menu is used for both partners. */
export const MATERIAL_MENU: Record<PlannerRoute, readonly MenuItem[]> = {
  hydrogenate: [
    { id: 'ethyne', smiles: 'C#C' },
    { id: 'ethene', smiles: 'C=C' },
    { id: 'propyne', smiles: 'C#CC' },
    { id: 'but-1-ene', smiles: 'C=CCC' },
  ],
  reduce: [
    { id: 'chloromethane', smiles: 'CCl' },
    { id: 'bromoethane', smiles: 'CCBr' },
    { id: '1-chloropropane', smiles: 'CCCCl' },
    { id: '2-bromopropane', smiles: 'CC(C)Br' },
  ],
  wurtz: [
    { id: 'bromomethane', smiles: 'CBr' },
    { id: 'bromoethane', smiles: 'CCBr' },
    { id: '1-bromopropane', smiles: 'CCCBr' },
    { id: '1-bromobutane', smiles: 'CCCCBr' },
  ],
  decarboxylate: [
    { id: 'ethanoic', smiles: 'CC(=O)O' },
    { id: 'propanoic', smiles: 'CCC(=O)O' },
    { id: 'butanoic', smiles: 'CCCC(=O)O' },
    { id: 'pentanoic', smiles: 'CCCCC(=O)O' },
  ],
  kolbe: [
    { id: 'ethanoic', smiles: 'CC(=O)O' },
    { id: 'propanoic', smiles: 'CCC(=O)O' },
    { id: 'butanoic', smiles: 'CCCC(=O)O' },
    { id: 'methanoic', smiles: 'C(=O)O' },
  ],
}

/** One product as the planner shows it. */
export interface PlannedProduct {
  /** The product's graph, for drawing. */
  graph: MolGraph
  name: string
  formula: string
  carbons: number
  isTarget: boolean
  major: boolean
}

/**
 * What the route gives for the learner's choice.
 * - 'target': the route gives the target and nothing else.
 * - 'mixture': the target is one of several products (Wurtz with two different halides).
 * - 'other': the route gives products, none of which is the target.
 * - 'none': the route does not apply to these materials (the lib names the reason in `error`).
 */
export type PlanOutcome = 'target' | 'mixture' | 'other' | 'none'

export interface PlanResult {
  outcome: PlanOutcome
  products: PlannedProduct[]
  /** The balanced equation of the first channel, mhchem. Empty when the route does not apply. */
  equation: string
  /** One equation per product channel. */
  equations: string[]
  conditions: string
  /** The carbon arithmetic, written out from the counts in the materials and in the products. */
  carbonArithmetic: string
  /** A one-line verdict for the learner. */
  headline: string
  error?: string
}

/** The number of carbon atoms in a graph. */
export function carbonCount(g: MolGraph): number {
  return g.atoms.filter((a) => a.element === 'C').length
}

/** The graph of a menu item. */
export function graphOf(item: MenuItem): MolGraph {
  return parseSmiles(item.smiles)
}

/** "1 carbon" or "2 carbons". */
function cs(n: number): string {
  return n === 1 ? '1 carbon' : `${n} carbons`
}

function carbonArithmeticFor(route: PlannerRoute, materials: MolGraph[], products: PlannedProduct[]): string {
  const counts = materials.map(carbonCount)
  const total = products.map((p) => p.carbons)
  switch (route) {
    case 'hydrogenate':
    case 'reduce':
      return `${cs(counts[0])} in, ${cs(total[0])} out: no carbon is gained or lost.`
    case 'wurtz': {
      if (counts.length === 1 || counts[0] === counts[1]) {
        return `${counts[0]} + ${counts[0]} = ${2 * counts[0]} carbons: each partner gives one alkyl group, and the two join.`
      }
      const [a, b] = counts
      return `${a} + ${a} = ${2 * a}, ${a} + ${b} = ${a + b} and ${b} + ${b} = ${2 * b} carbons: one alkane for each pair of alkyl groups.`
    }
    case 'decarboxylate':
      return `${cs(counts[0])} in the acid − 1 (the carboxyl carbon leaves as carbonate, Na₂CO₃) = ${cs(total[0])}.`
    case 'kolbe':
      return `2 × (${counts[0]} − 1) = ${cs(total[0])}: the carboxyl carbon leaves at the anode, and the two alkyl groups join.`
  }
}

/**
 * Plans one route for the learner's materials.
 *
 * @param route The synthesis route.
 * @param target The target alkane's SMILES.
 * @param materials The starting material SMILES (one, or two for Wurtz).
 */
export function planAlkaneSynthesis(route: PlannerRoute, target: string, materials: readonly string[]): PlanResult {
  const targetKey = canonicalKey(parseSmiles(target))
  const mats = materials.map((s) => parseSmiles(s))
  let reaction: Reaction
  if (route === 'kolbe' && mats[0] && carbonCount(mats[0]) === 1) {
    const message = 'Kolbe needs an alkyl group. Methanoic acid has none, so no alkane forms, and methane cannot be made this way.'
    return { outcome: 'none', products: [], equation: '', equations: [], conditions: '', carbonArithmetic: '', headline: message, error: message }
  }
  try {
    switch (route) {
      case 'hydrogenate':
        reaction = hydrogenate(mats[0])
        break
      case 'reduce':
        reaction = reduceAlkylHalide(mats[0])
        break
      case 'wurtz':
        if (mats.length < 2) throw new RangeError('Wurtz needs two alkyl halides (the same one twice is allowed)')
        reaction = wurtz(mats[0], mats[1])
        break
      case 'decarboxylate':
        reaction = decarboxylate(mats[0])
        break
      case 'kolbe':
        reaction = kolbe(mats[0])
        break
    }
  } catch (err) {
    const message = err instanceof RangeError ? err.message : 'This route does not apply to these materials.'
    return {
      outcome: 'none',
      products: [],
      equation: '',
      equations: [],
      conditions: '',
      carbonArithmetic: '',
      headline: message,
      error: message,
    }
  }

  const products: PlannedProduct[] = reaction.products
    .filter((p) => p.graph.atoms.length > 0)
    .map((p) => ({
      graph: p.graph,
      name: p.name,
      formula: p.formula,
      carbons: carbonCount(p.graph),
      isTarget: canonicalKey(p.graph) === targetKey,
      major: p.major === true,
    }))

  const hits = products.filter((p) => p.isTarget).length
  const outcome: PlanOutcome = hits === 0 ? 'other' : products.length === 1 ? 'target' : 'mixture'
  const targetName = nameOf(parseSmiles(target))
  const headline =
    outcome === 'target'
      ? `Gives ${targetName}, and nothing else.`
      : outcome === 'mixture'
        ? `Gives ${targetName}, but only as one of ${products.length} products.`
        : `Does not give ${targetName}.`

  return {
    outcome,
    products,
    equation: reaction.equation,
    equations: reaction.equations,
    conditions: reaction.conditions,
    carbonArithmetic: carbonArithmeticFor(route, mats, products),
    headline,
  }
}
