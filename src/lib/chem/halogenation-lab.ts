/**
 * Pure models for the halogenation lab (Section 9.2.3): which alkanes the lab offers, the statistical
 * split of the monohalogenated products, the qualitative reactivity order, and the combustion balance.
 * Every product, name, equation and count comes from hydrocarbon-reactions.ts and hydrocarbon-species.ts.
 *
 * The lab does not compute a product ratio from relative reactivities. NCERT gives only the order
 * 3° > 2° > 1° for the C–H bonds, and the libs hold no documented numeric values, so the reactivity
 * mode says which product is favoured by the order and never prints a percentage for it.
 */

import { combust, halogenate, type Reaction, type ReactionProduct } from './hydrocarbon-reactions'
import { iupacName } from './iupac-organic'
import { parseSmiles } from './molecule-parse'
import type { MolGraph } from './molecule-graph'

export type LabHalogen = 'Cl' | 'Br'

/** The alkanes the lab offers, by SMILES. Their names come from iupacName. */
export const LAB_ALKANES: readonly { id: string; smiles: string }[] = [
  { id: 'methane', smiles: 'C' },
  { id: 'ethane', smiles: 'CC' },
  { id: 'propane', smiles: 'CCC' },
  { id: 'butane', smiles: 'CCCC' },
  { id: '2-methylpropane', smiles: 'CC(C)C' },
  { id: 'pentane', smiles: 'CCCCC' },
  { id: '2-methylbutane', smiles: 'CCC(C)C' },
  { id: '2,2-dimethylpropane', smiles: 'CC(C)(C)C' },
]

/** The graph of a lab alkane, by its id. @throws {RangeError} For an id the lab does not offer. */
export function labAlkane(id: string): MolGraph {
  const entry = LAB_ALKANES.find((a) => a.id === id)
  if (!entry) throw new RangeError(`"${id}" is not an alkane of the halogenation lab`)
  return parseSmiles(entry.smiles)
}

/** The name of a lab alkane, from the lib. */
export function labAlkaneName(id: string): string {
  return iupacName(labAlkane(id))
}

/** One monohalogenated product with its statistical share of the substitutions. */
export interface ProductShare {
  product: ReactionProduct
  hydrogens: number
  /** Share of all the C–H bonds of the alkane, in percent, to one decimal place. */
  percent: number
}

/** Total hydrogens that a monohalogenation can replace (sum over the products). */
export function totalSubstitutableHydrogens(reaction: Reaction): number {
  return reaction.products.reduce((sum, p) => sum + (p.hydrogens ?? 0), 0)
}

/**
 * The statistical split: each product's share is its equivalent hydrogens over all the hydrogens
 * of the alkane. This ignores how reactive each kind of C–H is, which is why it is labelled statistical.
 */
export function statisticalShares(reaction: Reaction): ProductShare[] {
  const total = totalSubstitutableHydrogens(reaction)
  return reaction.products.map((product) => {
    const hydrogens = product.hydrogens ?? 0
    return { product, hydrogens, percent: Math.round((1000 * hydrogens) / total) / 10 }
  })
}

/** Rank of a carbon by its degree in the NCERT order 3° > 2° > 1° (methane's 0° is last). */
export function reactivityRank(degree: string | undefined): number {
  return degree === '3°' ? 3 : degree === '2°' ? 2 : degree === '1°' ? 1 : 0
}

/** The products ordered by the NCERT reactivity order: 3° first, then 2°, then 1°. */
export function productsByReactivity(reaction: Reaction): ReactionProduct[] {
  return [...reaction.products].sort((p, q) => reactivityRank(q.degree) - reactivityRank(p.degree))
}

/** The halogenation of a lab alkane with Cl₂ or Br₂, from the lib. */
export function labHalogenation(id: string, halogen: LabHalogen): Reaction {
  return halogenate(labAlkane(id), halogen)
}

/** The combustion of CₙH₂ₙ₊₂, from the lib. @throws {RangeError} For n below 1 */
export function labCombustion(n: number): Reaction {
  if (!Number.isInteger(n) || n < 1) throw new RangeError('The carbon number must be a whole number of at least 1')
  return combust(parseSmiles('C'.repeat(n)))
}

/**
 * Oxygen needed for one mole of CₙH₂ₙ₊₂, from equation 9.19 of NCERT: (3n + 1)/2 mol O₂. The lib's
 * equation is doubled when this is a half-integer; this value is per mole of alkane.
 */
export function oxygenPerMole(n: number): number {
  return (3 * n + 1) / 2
}
