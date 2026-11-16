/**
 * The steps of the alkene-cleavage Scrolly (NCERT 9.3.5, items 6 to 8). Six Steps: Baeyer's test and the
 * diol it gives, the C=C cut by ozonolysis, the carbonyl products with an O on each carbon, the reverse
 * puzzle that joins them back, and the polymer. Every molecule, name, formula and equation comes from the
 * lib (hydrocarbon-reactions.ts through ozonolysis-model.ts); this file only chooses which layers show.
 */

import { parseSmiles } from '@/lib/chem/molecule-parse'
import type { MolGraph } from '@/lib/chem/molecule-graph'
import { nameOf, formulaOf } from '@/lib/chem/hydrocarbon-species'
import { baeyer, ozonolysis, ozonolysisReverse } from '@/lib/chem/hydrocarbon-reactions'
import { carbonylCarbons, puzzleProducts, polymerEquation } from '@/lib/chem/ozonolysis-model'
import { conditionFor } from '@/lib/chem/ncert-unit9-tables'

export const CLEAVAGE_STEP_COUNT = 6

/** The alkene of Steps 0 and 1: cyclohexene, which Baeyer's reagent turns into a diol. */
export const CYCLOHEXENE: MolGraph = parseSmiles('C1=CCCCC1')
export const DIOL: MolGraph = baeyer(CYCLOHEXENE).products[0].graph

/** The alkene of Steps 2 to 4: 1-methylcyclohexene, cut by ozone at its one C=C. */
export const METHYLCYCLOHEXENE: MolGraph = parseSmiles('CC1=CCCCC1')
export const CUT_PRODUCT: MolGraph = ozonolysis(METHYLCYCLOHEXENE).products[0].graph
export const CUT_CARBONYLS = carbonylCarbons([CUT_PRODUCT])

/** The reverse puzzle of Step 4: the same product, joined back into the alkene it came from. */
export const REVERSE_IN: MolGraph[] = puzzleProducts('one-molecule')
export const REVERSE_OUT = ozonolysisReverse(REVERSE_IN).products[0]

/** Atom indices of the oxygens of a graph. */
export function oxygens(g: MolGraph): number[] {
  return g.atoms.map((a, i) => (a.element === 'O' ? i : -1)).filter((i) => i >= 0)
}

/** Atoms of the carbonyl groups: each carbonyl carbon and its oxygen. */
export function carbonylAtoms(g: MolGraph): number[] {
  const found = carbonylCarbons([g])
  return found.flatMap((f) => [f.atom, f.oxygen])
}

/** Index of the C=C bond of a graph (the first double bond between two carbons), or -1. */
export function carbonDoubleBond(g: MolGraph): number {
  return g.bonds.findIndex((b) => b.order === 2 && g.atoms[b.a].element === 'C' && g.atoms[b.b].element === 'C')
}

/** The opacities and progress values the Scrolly tweens between Steps. */
export interface CleavageTarget {
  /** The test tube (Baeyer's reagent). */
  tube: number
  /** 0 purple (reagent intact), 1 decolourised with brown MnO₂. */
  reagent: number
  alkeneA: number
  diolA: number
  arrowA: number
  alkeneB: number
  cut: number
  arrowB: number
  productB: number
  revIn: number
  arrowR: number
  revOut: number
  polymer: number
  polymerProgress: number
  [key: string]: number
}

export interface CleavageStep {
  target: CleavageTarget
  /** Atoms and bonds washed in the highlight colour, per layer. */
  diolAtoms: number[]
  alkeneBonds: number[]
  productAtoms: number[]
  revInAtoms: number[]
  revOutBonds: number[]
  caption: string
}

const HIDDEN: CleavageTarget = {
  tube: 0,
  reagent: 0,
  alkeneA: 0,
  diolA: 0,
  arrowA: 0,
  alkeneB: 0,
  cut: 0,
  arrowB: 0,
  productB: 0,
  revIn: 0,
  arrowR: 0,
  revOut: 0,
  polymer: 0,
  polymerProgress: 0,
}

/** Subscript digits for a formula string, e.g. C6H12O2 becomes C₆H₁₂O₂. */
export function sub(text: string): string {
  const d = ['₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉']
  return text.replace(/[0-9]/g, (x) => d[Number(x)])
}

const DIOL_NAME = nameOf(DIOL)
const DIOL_FORMULA = sub(formulaOf(DIOL))
const CUT_NAME = nameOf(METHYLCYCLOHEXENE)
const PRODUCT_NAME = ozonolysis(METHYLCYCLOHEXENE).products.map((p) => p.name).join(' and ')
const REVERSE_NAME = REVERSE_OUT.name
const POLY = polymerEquation(parseSmiles('C=C'))

/** The state of one Step (0 to CLEAVAGE_STEP_COUNT - 1). Out-of-range indices are clamped. */
export function cleavageStep(step: number): CleavageStep {
  const index = Math.min(CLEAVAGE_STEP_COUNT - 1, Math.max(0, Math.round(step)))
  const none: number[] = []
  switch (index) {
    case 0:
      return {
        target: { ...HIDDEN, tube: 1, reagent: 0, alkeneA: 1, arrowA: 1 },
        diolAtoms: none,
        alkeneBonds: [carbonDoubleBond(CYCLOHEXENE)],
        productAtoms: none,
        revInAtoms: none,
        revOutBonds: none,
        caption: `${nameOf(CYCLOHEXENE)}: purple KMnO₄ is added in the cold`,
      }
    case 1:
      return {
        target: { ...HIDDEN, tube: 1, reagent: 1, alkeneA: 0.25, diolA: 1, arrowA: 1 },
        diolAtoms: oxygens(DIOL),
        alkeneBonds: none,
        productAtoms: none,
        revInAtoms: none,
        revOutBonds: none,
        caption: `The purple fades and brown MnO₂ settles. Product: ${DIOL_NAME}, ${DIOL_FORMULA}`,
      }
    case 2:
      return {
        target: { ...HIDDEN, alkeneB: 1, cut: 1, arrowB: 1 },
        diolAtoms: none,
        alkeneBonds: [carbonDoubleBond(METHYLCYCLOHEXENE)],
        productAtoms: none,
        revInAtoms: none,
        revOutBonds: none,
        caption: `${CUT_NAME}: ozone adds across the C=C, then Zn and water cut the ozonide`,
      }
    case 3:
      return {
        target: { ...HIDDEN, alkeneB: 0.35, arrowB: 1, productB: 1 },
        diolAtoms: none,
        alkeneBonds: none,
        productAtoms: carbonylAtoms(CUT_PRODUCT),
        revInAtoms: none,
        revOutBonds: none,
        caption: `Each carbon of the old C=C now carries an O: ${PRODUCT_NAME}`,
      }
    case 4:
      return {
        target: { ...HIDDEN, revIn: 1, arrowR: 1, revOut: 1 },
        diolAtoms: none,
        alkeneBonds: none,
        productAtoms: none,
        revInAtoms: carbonylAtoms(REVERSE_IN[0]),
        revOutBonds: [carbonDoubleBond(REVERSE_OUT.graph)],
        caption: `Join the two carbonyl carbons and drop their O atoms: ${REVERSE_NAME}`,
      }
    default:
      return {
        target: { ...HIDDEN, polymer: 1, polymerProgress: 1 },
        diolAtoms: none,
        alkeneBonds: none,
        productAtoms: none,
        revInAtoms: none,
        revOutBonds: none,
        caption: `Ethene (${sub(POLY.monomer)}) units join into the repeat unit (${sub(POLY.unit)})n`,
      }
  }
}

/** The condition NCERT gives for each reagent, from the lib's table. */
export const CONDITIONS = {
  baeyer: conditionFor('baeyer').text,
  ozonolysis: conditionFor('ozonolysis').text,
  acidic: conditionFor('acidic-permanganate').text,
  polymer: conditionFor('polymerisation').text,
}

