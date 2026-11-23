import { molecularFormula, parseSmiles } from './molecule-parse'
import type { MolGraph } from './molecule-graph'
import { TABLE_8_2_DERIVATIVES, unit8Name } from './ncert-c12-unit8-data'

/**
 * Model for the Section 6 Simulation: a carbonyl compound and a reagent, the product, its class and
 * whether water is released. Formulas come from molecularFormula; names come from unit8Name, and
 * only for the molecules the namer handles (the rest show their class and formula).
 */

export type CarbonylId = 'propanal' | 'butanone'

export type ReagentId =
  | 'methanol1'
  | 'methanol2'
  | 'glycol'
  | 'ammonia'
  | 'methylamine'
  | 'hydroxylamine'
  | 'hydrazine'
  | 'phenylhydrazine'
  | 'dnph'
  | 'semicarbazide'

export const CARBONYL_SMILES: Readonly<Record<CarbonylId, string>> = {
  propanal: 'CCC=O',
  butanone: 'CCC(C)=O',
}

export const REAGENT_SMILES: Readonly<Record<ReagentId, string>> = {
  methanol1: 'CO',
  methanol2: 'CO',
  glycol: 'OCCO',
  ammonia: 'N',
  methylamine: 'CN',
  hydroxylamine: 'NO',
  hydrazine: 'NN',
  phenylhydrazine: 'NNC1=CC=CC=C1',
  dnph: 'NNC1=CC=C(C=C1[N+](=O)[O-])[N+](=O)[O-]',
  semicarbazide: 'NNC(N)=O',
}

export const REAGENT_LABEL: Readonly<Record<ReagentId, string>> = {
  methanol1: 'Methanol, 1 equivalent',
  methanol2: 'Methanol, 2 equivalents',
  glycol: 'Ethylene glycol',
  ammonia: 'Ammonia',
  methylamine: 'Methylamine',
  hydroxylamine: 'Hydroxylamine',
  hydrazine: 'Hydrazine',
  phenylhydrazine: 'Phenylhydrazine',
  dnph: '2,4-Dinitrophenylhydrazine',
  semicarbazide: 'Semicarbazide',
}

/** Alcohol equivalents taken up by the reagent. */
const EQUIVALENTS: Partial<Record<ReagentId, number>> = { methanol2: 2 }

const DERIVATIVE_REAGENTS: readonly ReagentId[] = [
  'ammonia',
  'methylamine',
  'hydroxylamine',
  'hydrazine',
  'phenylhydrazine',
  'dnph',
  'semicarbazide',
]

/** Row of Table 8.2 that names each derivative reagent's class. */
const TABLE_ROW: Partial<Record<ReagentId, number>> = {
  ammonia: 0,
  methylamine: 1,
  hydroxylamine: 2,
  hydrazine: 3,
  phenylhydrazine: 4,
  dnph: 5,
  semicarbazide: 6,
}

export const CARBONYL_LABEL: Readonly<Record<CarbonylId, string>> = {
  propanal: 'Propanal',
  butanone: 'Butan-2-one',
}

/** The reagents this Section draws for each carbonyl compound (NCERT's scope). */
export function reagentsFor(carbonyl: CarbonylId): ReagentId[] {
  return carbonyl === 'propanal' ? ['methanol1', 'methanol2', ...DERIVATIVE_REAGENTS] : ['glycol', ...DERIVATIVE_REAGENTS]
}

interface ProductSpec {
  smiles: string
  /** Atom-index pairs of the bonds that the reaction forms (indices into the product's SMILES order). */
  newBonds: readonly (readonly [number, number])[]
  /** Whether unit8Name names this product (the namer refuses the rest). */
  named: boolean
}

const PRODUCTS: Readonly<Record<CarbonylId, Partial<Record<ReagentId, ProductSpec>>>> = {
  propanal: {
    methanol1: { smiles: 'CCC(O)OC', newBonds: [[2, 4]], named: true },
    methanol2: { smiles: 'CCC(OC)OC', newBonds: [[2, 3], [2, 5]], named: true },
    ammonia: { smiles: 'CCC=N', newBonds: [[2, 3]], named: false },
    methylamine: { smiles: 'CCC=NC', newBonds: [[2, 3]], named: false },
    hydroxylamine: { smiles: 'CCC=NO', newBonds: [[2, 3]], named: false },
    hydrazine: { smiles: 'CCC=NN', newBonds: [[2, 3]], named: false },
    phenylhydrazine: { smiles: 'CCC=NNC1=CC=CC=C1', newBonds: [[2, 3]], named: false },
    dnph: { smiles: 'CCC=NNC1=CC=C(C=C1[N+](=O)[O-])[N+](=O)[O-]', newBonds: [[2, 3]], named: false },
    semicarbazide: { smiles: 'CCC=NNC(N)=O', newBonds: [[2, 3]], named: false },
  },
  butanone: {
    glycol: { smiles: 'CCC1(C)OCCO1', newBonds: [[2, 4], [2, 7]], named: false },
    ammonia: { smiles: 'CCC(C)=N', newBonds: [[2, 4]], named: false },
    methylamine: { smiles: 'CCC(C)=NC', newBonds: [[2, 4]], named: false },
    hydroxylamine: { smiles: 'CCC(C)=NO', newBonds: [[2, 4]], named: false },
    hydrazine: { smiles: 'CCC(C)=NN', newBonds: [[2, 4]], named: false },
    phenylhydrazine: { smiles: 'CCC(C)=NNC1=CC=CC=C1', newBonds: [[2, 4]], named: false },
    dnph: { smiles: 'CCC(C)=NNC1=CC=C(C=C1[N+](=O)[O-])[N+](=O)[O-]', newBonds: [[2, 4]], named: false },
    semicarbazide: { smiles: 'CCC(C)=NNC(N)=O', newBonds: [[2, 4]], named: false },
  },
}

const SUBSCRIPT: Readonly<Record<string, string>> = {
  '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
}

/** Subscripts the digits of a formula, e.g. C6H12O2 becomes C₆H₁₂O₂. */
export function unicodeFormula(formula: string): string {
  return formula.replace(/[0-9]/g, (d) => SUBSCRIPT[d])
}

function formulaOf(smiles: string): string {
  return unicodeFormula(molecularFormula(parseSmiles(smiles)))
}

/** Index of the bond joining two atoms; throws if the molecule has no such bond. */
export function bondIndex(g: MolGraph, a: number, b: number): number {
  const i = g.bonds.findIndex((bond) => (bond.a === a && bond.b === b) || (bond.a === b && bond.b === a))
  if (i < 0) throw new RangeError(`no bond between atoms ${a} and ${b}`)
  return i
}

export interface Outcome {
  carbonyl: CarbonylId
  reagent: ReagentId
  /** The compound drawn: the product, or (after hydrolysis) the carbonyl compound regained. */
  drawnSmiles: string
  drawnName: string | null
  /** Bond indices into the drawn molecule that the reaction forms or re-forms. */
  highlightBonds: number[]
  classLabel: string
  /** Sentence for water: released, not released, or used up. */
  waterSentence: string
  productFormula: string
  equation: string
  /** True when the product is an acetal or ketal that aqueous mineral acid can hydrolyse. */
  hydrolysable: boolean
  summary: string
}

function nameOrNull(smiles: string, named: boolean): string | null {
  return named ? unit8Name(smiles) : null
}

/** The product of a carbonyl compound with a reagent, drawn with its new bonds. */
export function outcome(carbonyl: CarbonylId, reagent: ReagentId): Outcome {
  const spec = PRODUCTS[carbonyl][reagent]
  if (!spec) throw new RangeError(`${reagent} is not drawn with ${carbonyl}`)
  const g = parseSmiles(spec.smiles)
  const equiv = EQUIVALENTS[reagent] ?? 1
  const hydrolysable = reagent === 'methanol2' || reagent === 'glycol'
  const water = reagent !== 'methanol1'
  const classLabel =
    reagent === 'methanol1'
      ? 'Hemiacetal'
      : reagent === 'methanol2'
        ? 'Acetal'
        : reagent === 'glycol'
          ? 'Cyclic ketal (ethylene glycol ketal)'
          : TABLE_8_2_DERIVATIVES[TABLE_ROW[reagent] ?? 0].product
  const productFormula = formulaOf(spec.smiles)
  const carbonylFormula = formulaOf(CARBONYL_SMILES[carbonyl])
  const reagentFormula = `${equiv > 1 ? `${equiv} ` : ''}${formulaOf(REAGENT_SMILES[reagent])}`
  const equation = `${carbonylFormula} + ${reagentFormula} → ${productFormula}${water ? ' + H₂O' : ''}`
  const productName = nameOrNull(spec.smiles, spec.named)
  const summary = `${CARBONYL_LABEL[carbonyl]} with ${REAGENT_LABEL[reagent].toLowerCase()} gives ${productName ?? productFormula} (${classLabel.toLowerCase()}). ${water ? 'Water is released.' : 'No water is released.'}`
  return {
    carbonyl,
    reagent,
    drawnSmiles: spec.smiles,
    drawnName: productName,
    highlightBonds: spec.newBonds.map(([a, b]) => bondIndex(g, a, b)),
    classLabel,
    waterSentence: water ? 'Water is released.' : 'No water is released.',
    productFormula,
    equation,
    hydrolysable,
    summary,
  }
}

/** Aqueous mineral acid takes an acetal or ketal back to the carbonyl compound and the alcohol. */
export function hydrolysis(o: Outcome): Outcome {
  if (!o.hydrolysable) throw new RangeError('only acetals and ketals hydrolyse back')
  const carbonylSmiles = CARBONYL_SMILES[o.carbonyl]
  const g = parseSmiles(carbonylSmiles)
  const carbonylO = g.atoms.findIndex((a) => a.element === 'O')
  const equiv = EQUIVALENTS[o.reagent] ?? 1
  const carbonylName = unit8Name(carbonylSmiles)
  const reagentFormula = `${equiv > 1 ? `${equiv} ` : ''}${formulaOf(REAGENT_SMILES[o.reagent])}`
  const productSmiles = PRODUCTS[o.carbonyl][o.reagent]?.smiles
  if (!productSmiles) throw new RangeError(`no product for ${o.reagent} with ${o.carbonyl}`)
  const equation = `${formulaOf(productSmiles)} + H₂O → ${formulaOf(carbonylSmiles)} + ${reagentFormula}`
  const summary = `${o.classLabel} hydrolysed with aqueous mineral acid gives ${carbonylName} back, and the alcohol is set free. Water is used up.`
  return {
    ...o,
    drawnSmiles: carbonylSmiles,
    drawnName: carbonylName,
    highlightBonds: [bondIndex(g, 2, carbonylO)],
    classLabel: 'Carbonyl compound regained',
    waterSentence: 'Water is used up.',
    productFormula: formulaOf(carbonylSmiles),
    equation,
    hydrolysable: false,
    summary,
  }
}
