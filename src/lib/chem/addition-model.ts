/**
 * The addition of a reagent across a C=C, for the addition predictor (NCERT Unit 9, Section 9.3.5).
 * Every product, name, equation and condition comes from hydrocarbon-reactions.ts. This module adds
 * only what the drawing needs: which double-bond carbon the reagent's group joins in the major
 * product, and the carbocation or radical that forms on the other carbon on the way.
 */

import { addH2SO4, addHX, addX2, hydrate, hydrogenate, type Reaction } from './hydrocarbon-reactions'
import { rebuild } from './hydrocarbon-species'
import { neighbours, parseSmiles } from './molecule-parse'
import type { MolAtom, MolBond, MolGraph } from './molecule-graph'

/** A reagent the predictor offers. `asksCarbon` is false where both carbons take a group (H₂, Br₂). */
export const ADDITION_REAGENTS = [
  { id: 'H2', label: 'H₂, Ni', asksCarbon: false },
  { id: 'Br2', label: 'Br₂ in CCl₄', asksCarbon: false },
  { id: 'HCl', label: 'HCl', asksCarbon: true },
  { id: 'HBr', label: 'HBr', asksCarbon: true },
  { id: 'HBr-peroxide', label: 'HBr with peroxide', asksCarbon: true },
  { id: 'HI', label: 'HI', asksCarbon: true },
  { id: 'H2SO4', label: 'cold conc. H₂SO₄', asksCarbon: true },
  { id: 'H2O', label: 'H₂O, a few drops of H₂SO₄', asksCarbon: true },
] as const

export type AdditionReagentId = (typeof ADDITION_REAGENTS)[number]['id']

/**
 * The alkenes the predictor offers, as SMILES written from the end that carries the lowest locant of
 * the double bond, so that the atom indices read as IUPAC carbon numbers. Symmetrical ones are included.
 */
export const ADDITION_ALKENES = [
  { id: 'ethene', smiles: 'C=C', symmetric: true },
  { id: 'propene', smiles: 'C=CC', symmetric: false },
  { id: 'but-1-ene', smiles: 'C=CCC', symmetric: false },
  { id: 'but-2-ene', smiles: 'CC=CC', symmetric: true },
  { id: '2-methylpropene', smiles: 'C=C(C)C', symmetric: false },
  { id: '2-methylbut-1-ene', smiles: 'C=C(C)CC', symmetric: false },
  { id: 'cyclohexene', smiles: 'C1=CCCCC1', symmetric: true },
] as const

/** A carbocation or free radical on one double-bond carbon, drawn for the mechanism strip. */
export interface AdditionIntermediate {
  /** Index of the carbon that carries the positive charge or the unpaired electron. */
  centre: number
  kind: 'carbocation' | 'radical'
  graph: MolGraph
  /** True for the intermediate that leads to the major product. */
  major: boolean
}

export interface AdditionCase {
  reagent: AdditionReagentId
  alkene: MolGraph
  /** The two carbons of the C=C, by atom index (and so by carbon number, minus one). */
  doubleCarbons: [number, number]
  reaction: Reaction
  /** True when the question is which carbon takes the reagent's group. */
  asksCarbon: boolean
  /** The carbons that give the major product when the question is asked (both, for a symmetrical alkene). */
  correctCarbons: number[]
  /** The major-product carbon for the reagent's group (undefined when no question is asked). */
  majorCarbon?: number
  intermediates: AdditionIntermediate[]
}

/** The two carbons joined by the single C=C of a graph, or a RangeError. */
export function doubleBondCarbons(g: MolGraph): [number, number] {
  const dbl = g.bonds.filter((b) => b.order === 2 && g.atoms[b.a].element === 'C' && g.atoms[b.b].element === 'C')
  if (dbl.length !== 1) throw new RangeError('The predictor takes an alkene with exactly one C=C')
  return [dbl[0].a, dbl[0].b]
}

/** The reaction the lib models for a reagent. */
function reactionFor(g: MolGraph, reagent: AdditionReagentId): Reaction {
  switch (reagent) {
    case 'H2':
      return hydrogenate(g)
    case 'Br2':
      return addX2(g, 'Br2')
    case 'HCl':
      return addHX(g, 'HCl')
    case 'HBr':
      return addHX(g, 'HBr')
    case 'HBr-peroxide':
      return addHX(g, 'HBr', { peroxide: true })
    case 'HI':
      return addHX(g, 'HI')
    case 'H2SO4':
      return addH2SO4(g)
    case 'H2O':
      return hydrate(g)
  }
}

/**
 * The double-bond carbon that carries the reagent's group in a product. The group is any atom added to
 * the alkene (its index is past the alkene's own atoms, since the lib appends new atoms).
 */
function carbonBearingGroup(product: MolGraph, alkeneAtoms: number, carbons: readonly number[]): number | undefined {
  return carbons.find((c) => neighbours(product, c).some((n) => n.atom >= alkeneAtoms))
}

/**
 * The carbocation (ionic) or radical (peroxide) formed when the reagent's first atom joins `centre`'s
 * partner. Ionic: the H⁺ joins the other carbon and the cation stays on `centre`. Radical: the Br• joins
 * the other carbon and the unpaired electron stays on `centre`. The graph is rebuilt, so its hydrogens follow.
 */
export function intermediateGraph(g: MolGraph, carbons: [number, number], centre: number, kind: 'carbocation' | 'radical', group?: 'Br'): MolGraph {
  const [a, b] = carbons
  const other = centre === a ? b : a
  const bonds: MolBond[] = g.bonds.map((x) => {
    const isDouble = (x.a === a && x.b === b) || (x.a === b && x.b === a)
    return isDouble ? { ...x, order: 1 } : { ...x }
  })
  const atoms: MolAtom[] = g.atoms.map((x) => ({ ...x }))
  if (kind === 'carbocation') atoms[centre] = { ...atoms[centre], charge: 1 }
  else atoms[centre] = { ...atoms[centre], radical: 1 }
  if (group) {
    atoms.push({ element: group, hCount: 0 })
    bonds.push({ a: other, b: atoms.length - 1, order: 1 })
  }
  return rebuild(atoms, bonds)
}

/**
 * The addition the learner is asked about, for an alkene (SMILES) and a reagent. The product is the
 * lib's major product; the intermediates are drawn from the same double bond, and the major one is the
 * carbon that the lib's ranking chose.
 *
 * @throws {RangeError} If the alkene has no single C=C, or the lib does not model the reagent for it
 */
export function additionCase(smiles: string, reagent: AdditionReagentId): AdditionCase {
  const alkene = parseSmiles(smiles)
  const carbons = doubleBondCarbons(alkene)
  const reaction = reactionFor(alkene, reagent)
  const meta = ADDITION_REAGENTS.find((r) => r.id === reagent)
  const asksCarbon = meta?.asksCarbon ?? false
  const ionic = reagent === 'HCl' || reagent === 'HBr' || reagent === 'HI' || reagent === 'H2SO4' || reagent === 'H2O'
  const radical = reagent === 'HBr-peroxide'

  if (!asksCarbon) {
    return { reagent, alkene, doubleCarbons: carbons, reaction, asksCarbon, correctCarbons: [], intermediates: [] }
  }

  const major = reaction.products.find((p) => p.major) ?? reaction.products[0]
  const majorCarbon = carbonBearingGroup(major.graph, alkene.atoms.length, carbons)
  if (majorCarbon === undefined) throw new RangeError('The major product does not carry the group on a double-bond carbon')

  // One candidate product means the two carbons are equivalent (a symmetrical alkene).
  const symmetric = (reaction.intermediates?.length ?? 0) <= 1
  const correctCarbons = symmetric ? [...carbons] : [majorCarbon]

  // The cation (ionic) or radical (peroxide) sits on the carbon that does not take the group, or on the
  // group's carbon in the ionic case: the ionic cation is on the carbon that receives the anion.
  const kind = ionic ? 'carbocation' : 'radical'
  const group = radical ? ('Br' as const) : undefined
  const intermediates: AdditionIntermediate[] = carbons.map((centre) => {
    // Ionic: the cation is on the carbon the anion joins. Radical: the radical is on the carbon the Br does not join.
    const isMajor = ionic ? centre === majorCarbon : centre !== majorCarbon
    return { centre, kind, graph: intermediateGraph(alkene, carbons, centre, kind, group), major: isMajor }
  })

  return { reagent, alkene, doubleCarbons: carbons, reaction, asksCarbon, correctCarbons, majorCarbon, intermediates }
}
