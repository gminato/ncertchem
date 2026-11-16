/**
 * The two-step preparation of an alkyne from a vicinal dihalide (NCERT 9.4.3, item 2): alcoholic
 * KOH removes one HX and gives an alkenyl (vinylic) halide, then NaNH2 removes the second HX and
 * gives the alkyne. Each step is an elimination that removes a halogen from one carbon and a
 * hydrogen from a neighbouring carbon, and the bond between them rises by one order.
 *
 * Step 1 takes the hydrogen from the carbon that carries the second halogen, so the halogen stays
 * on the alkene carbon (a vinylic halide). Step 2 takes the hydrogen from the carbon that is
 * double-bonded to the vinylic carbon, which gives the triple bond. Both rules leave one product,
 * so the intermediate is fixed by the substrate. Names come from iupacName, equations from
 * balancedEquation.
 */

import type { MolGraph } from './molecule-graph'
import { iupacName } from './iupac-organic'
import { parseSmiles } from './molecule-parse'
import { conditionFor } from './ncert-unit9-tables'
import { balancedEquation, inorganic, speciesOf, WATER, type Term } from './hydrocarbon-species'

/** One elimination step: its reactant and product names, the balanced equation and the condition. */
export interface PreparationStep {
  reactant: string
  product: string
  productGraph: MolGraph
  equation: string
  conditions: string
}

/** The two steps and the alkyne they give. */
export interface AlkynePreparation {
  steps: [PreparationStep, PreparationStep]
  alkyne: string
  alkyneGraph: MolGraph
}

/** Carbon bonded to a halogen atom, or a RangeError if the atom is not a halogen on carbon. */
function carbonOf(g: MolGraph, halogen: number): number {
  const element = g.atoms[halogen]?.element
  if (element !== 'Cl' && element !== 'Br' && element !== 'I') throw new RangeError('Elimination needs a halogen atom')
  const bond = g.bonds.find((b) => (b.a === halogen || b.b === halogen))
  if (!bond) throw new RangeError('The halogen is not bonded to carbon')
  const other = bond.a === halogen ? bond.b : bond.a
  if (g.atoms[other].element !== 'C') throw new RangeError('The halogen must sit on carbon')
  return other
}

/**
 * Removes the halogen atom `halogen` and one hydrogen of carbon `hydrogenCarbon`, which must be bonded to the
 * halogen's carbon. The bond between the two carbons rises by one order.
 *
 * @throws {RangeError} If the atoms are not bonded as needed, or the bond would exceed a triple bond
 */
export function eliminateHX(g: MolGraph, halogen: number, hydrogenCarbon: number): MolGraph {
  const cp = carbonOf(g, halogen)
  const h = g.atoms[hydrogenCarbon]
  if (!h || h.element !== 'C') throw new RangeError('The hydrogen must come from carbon')
  if ((h.hCount ?? 0) < 1) throw new RangeError('The carbon gives up a hydrogen, so it must carry one')
  const bond = g.bonds.find((b) => (b.a === cp && b.b === hydrogenCarbon) || (b.a === hydrogenCarbon && b.b === cp))
  if (!bond) throw new RangeError('The two carbons must be bonded')
  if (bond.order >= 3) throw new RangeError('The bond is already a triple bond')
  const map = (i: number) => (i > halogen ? i - 1 : i)
  const atoms = g.atoms
    .filter((_, i) => i !== halogen)
    .map((a, j) => {
      const old = j >= halogen ? j + 1 : j
      return old === hydrogenCarbon ? { ...a, hCount: (a.hCount ?? 0) - 1 } : { ...a }
    })
  const bonds = g.bonds
    .filter((b) => b.a !== halogen && b.b !== halogen)
    .map((b) => {
      const pair = (b.a === cp && b.b === hydrogenCarbon) || (b.a === hydrogenCarbon && b.b === cp)
      return { ...b, a: map(b.a), b: map(b.b), order: (pair ? b.order + 1 : b.order) as 1 | 2 | 3 }
    })
  return { atoms, bonds }
}

/** The index of the other halogen atom in a vicinal dihalide. */
function secondHalogen(g: MolGraph, first: number): number {
  const others = g.atoms
    .map((a, i) => ({ a, i }))
    .filter(({ a, i }) => (a.element === 'Br' || a.element === 'Cl' || a.element === 'I') && i !== first)
  if (others.length !== 1) throw new RangeError('A vicinal dihalide has exactly two halogens')
  return others[0].i
}

/** A reagent or by-product as a species, with its NCERT name. */
const KOH = () => inorganic('KOH', { K: 1, O: 1, H: 1 }, 'potassium hydroxide')
const NANH2 = () => inorganic('NaNH2', { Na: 1, N: 1, H: 2 }, 'sodamide')
const KBR = () => inorganic('KBr', { K: 1, Br: 1 }, 'potassium bromide')
const NABR = () => inorganic('NaBr', { Na: 1, Br: 1 }, 'sodium bromide')
const NH3 = () => inorganic('NH3', { N: 1, H: 3 }, 'ammonia')

/**
 * The two-step preparation of an alkyne from a vicinal dihalide (NCERT 9.4.3, item 2). Step 1: alcoholic KOH gives
 * the alkenyl bromide. Step 2: NaNH2 gives the alkyne. Use 2,3-dibromobutane: the intermediate is 2-bromobut-2-ene
 * and the alkyne is but-2-yne.
 *
 * @throws {RangeError} If the molecule is not a vicinal dihalide of a saturated carbon chain
 */
export function alkyneFromVicinalDihalide(dihalide: MolGraph): AlkynePreparation {
  const first = dihalide.atoms.findIndex((a) => a.element === 'Br' || a.element === 'Cl' || a.element === 'I')
  if (first < 0) throw new RangeError('A vicinal dihalide needs a halogen')
  const second = secondHalogen(dihalide, first)
  const cp = carbonOf(dihalide, first)
  const cq = carbonOf(dihalide, second)
  const adjacent = dihalide.bonds.some((b) => (b.a === cp && b.b === cq) || (b.a === cq && b.b === cp))
  if (!adjacent) throw new RangeError('The halogens must be on adjacent carbons (vicinal)')

  // Step 1: the hydrogen comes from the carbon that carries the second halogen.
  const vinylic = eliminateHX(dihalide, first, cq)
  // Atom indices after the first halogen is removed.
  const shift = (i: number) => (i > first ? i - 1 : i)
  const vinylicHalogen = shift(second)
  const vinylicCarbon = shift(cq)
  // Step 2: the hydrogen comes from the carbon double-bonded to the vinylic carbon that carries the halogen.
  const partner = vinylic.bonds.find((b) => b.order === 2 && (b.a === vinylicCarbon || b.b === vinylicCarbon))
  if (!partner) throw new RangeError('The alkenyl halide has no double bond to eliminate from')
  const partnerCarbon = partner.a === vinylicCarbon ? partner.b : partner.a
  const alkyne = eliminateHX(vinylic, vinylicHalogen, partnerCarbon)

  const substrate = speciesOf(dihalide)
  const intermediate = speciesOf(vinylic)
  const product = speciesOf(alkyne)
  const step1Terms: Term[] = [
    { coef: 1, species: substrate },
    { coef: 1, species: KOH() },
  ]
  const step1Products: Term[] = [
    { coef: 1, species: intermediate },
    { coef: 1, species: KBR() },
    { coef: 1, species: WATER },
  ]
  const step2Terms: Term[] = [
    { coef: 1, species: intermediate },
    { coef: 1, species: NANH2() },
  ]
  const step2Products: Term[] = [
    { coef: 1, species: product },
    { coef: 1, species: NABR() },
    { coef: 1, species: NH3() },
  ]
  return {
    steps: [
      {
        reactant: iupacName(dihalide),
        product: iupacName(vinylic),
        productGraph: vinylic,
        equation: balancedEquation(step1Terms, step1Products),
        conditions: conditionFor('dehydrohalogenation').text,
      },
      {
        reactant: iupacName(vinylic),
        product: iupacName(alkyne),
        productGraph: alkyne,
        equation: balancedEquation(step2Terms, step2Products),
        conditions: 'NaNH₂ (sodamide)',
      },
    ],
    alkyne: iupacName(alkyne),
    alkyneGraph: alkyne,
  }
}

/** The example of the Section: 2,3-dibromobutane. */
export function dibromobutaneExample(): AlkynePreparation {
  return alkyneFromVicinalDihalide(parseSmiles('CC(Br)C(Br)C'))
}
