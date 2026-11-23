import { iupacNameFromSmiles } from '@/lib/chem/iupac-organic'
import { molecularFormula, parseSmiles } from '@/lib/chem/molecule-parse'
import { NCERT_TABLE_6_4 } from '@/lib/chem/ncert-c12-unit6-data'

/** One Step per Scrolly Step in content/class-12/unit-6/12-6-7-1-nucleophilic-substitution.mdx. */
export const NUSUB_STEP_COUNT = 6

/** Bromoethane: the substrate in every Step. Atom 0 is CH3, atom 1 the CH2 carbon, atom 2 Br. */
export const SUBSTRATE_SMILES = 'CCBr'
export const CARBON_ATOM = 1
export const HALOGEN_ATOM = 2

export interface Product {
  smiles: string
  formula: string
  /** IUPAC name from the namer, or null where the namer cannot name the group. */
  name: string | null
}

export function productOf(smiles: string): Product {
  const formula = molecularFormula(parseSmiles(smiles))
  let name: string | null = null
  try {
    name = iupacNameFromSmiles(smiles) || null
  } catch {
    // The namer throws for charged species other than nitro groups (isocyanide, nitrite ion).
    name = null
  }
  return { smiles, formula, name }
}

export interface CarouselItem {
  /** Reagent as Table 6.4 prints it (R′ shown as CH₃ where the Step uses methoxide). */
  reagent: string
  /** Product class as Table 6.4 names it. */
  productClass: string
  product: Product
}

/** Table 6.4 rows (by index) shown in the Step 3 carousel, with the product drawn for each. */
const CAROUSEL_SOURCES: readonly { row: number; productSmiles: string; reagent?: string }[] = [
  { row: 0, productSmiles: 'CCO' },
  { row: 2, productSmiles: 'CCOC', reagent: 'NaOCH₃' },
  { row: 3, productSmiles: 'CCI' },
  { row: 4, productSmiles: 'CCN' },
]

export const CAROUSEL: readonly CarouselItem[] = CAROUSEL_SOURCES.map((s) => {
  const row = NCERT_TABLE_6_4[s.row]
  return {
    reagent: s.reagent ?? row.reagent,
    productClass: row.productClass,
    product: productOf(s.productSmiles),
  }
})

/** Step 4: cyanide's two contributing structures (lone pair on C, then on N). */
export const CYANIDE_FORMS = ['[C-]#N', '[C]=[N-]'] as const

export const KCN_ROW = NCERT_TABLE_6_4[7]
export const AGCN_ROW = NCERT_TABLE_6_4[8]
export const KNO2_ROW = NCERT_TABLE_6_4[9]
export const AGNO2_ROW = NCERT_TABLE_6_4[10]

/** Propanenitrile (C attack, from KCN) and the isocyanide (N attack, from AgCN): same formula. */
export const NITRILE = productOf('CCC#N')
export const ISOCYANIDE = productOf('CC[N+]#[C-]')

/** Step 6: nitrite O=N–O⁻ attacks through O (alkyl nitrite) or N (nitroalkane). */
export const NITRITE_SMILES = '[O-]N=O'
export const ETHYL_NITRITE = productOf('CCON=O')
export const NITROETHANE = productOf('CC[N+](=O)[O-]')

/** Step 2: the generic reagent's lone pair points at the carbon. Bromine stays on the substrate. */
export const SUBSTRATE = productOf(SUBSTRATE_SMILES)
