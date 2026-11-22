import { iupacNameFromSmiles } from '@/lib/chem/iupac-organic'
import { molecularFormula, parseSmiles } from '@/lib/chem/molecule-parse'
import { NCERT_FIG_6_3_SN2_RELATIVE_RATE } from '@/lib/chem/ncert-c12-unit6-data'

/** The six Scrolly Steps (0-based), in the order the Prose describes them. */
export type Sn2Sn1Beat =
  | 'backside-approach'
  | 'transition-state'
  | 'inverted-product'
  | 'crowding-strip'
  | 'sn1-ionisation'
  | 'sn1-attack-and-resonance'

export const SN2_SN1_BEATS: readonly Sn2Sn1Beat[] = [
  'backside-approach',
  'transition-state',
  'inverted-product',
  'crowding-strip',
  'sn1-ionisation',
  'sn1-attack-and-resonance',
]

/** Substrates of Fig. 6.3, in NCERT's order (methyl, ethyl, isopropyl, tert-butyl). */
export const SN2_STRIP_SMILES = ['CBr', 'CCBr', 'CC(C)Br', 'CC(C)(C)Br'] as const

export const SN1_SUBSTRATE_SMILES = 'CC(C)(C)Br'
export const SN2_PRODUCT_SMILES = 'CO'
export const SN1_PRODUCT_SMILES = 'CC(C)(C)O'
export const ALLYL_BROMIDE_SMILES = 'C=CCBr'
export const BENZYL_CHLORIDE_SMILES = 'ClCC1=CC=CC=C1'
/** Allyl cation: the two contributors put the + on the other terminal carbon. */
export const ALLYL_CATION_CONTRIBUTORS = ['C=C[CH2+]', '[CH2+]C=C'] as const
export const BENZYL_CATION_SMILES = 'C1=CC=CC=C1[CH2+]'

/** Fig. 6.3 rows with their SMILES, in NCERT's order. */
export const SN2_STRIP = SN2_STRIP_SMILES.map((smiles, i) => ({ smiles, ...NCERT_FIG_6_3_SN2_RELATIVE_RATE[i] }))

const MAX_RATE = Math.max(...NCERT_FIG_6_3_SN2_RELATIVE_RATE.map((r) => r.relativeRate))

/** Bar height for a Fig. 6.3 rate, scaled so the methyl bar is `maxHeight`. */
export function sn2BarHeight(relativeRate: number, maxHeight: number): number {
  return (relativeRate / MAX_RATE) * maxHeight
}

/** IUPAC names used in the drawing, from the namer (never typed by hand). */
export const NAMES = {
  methylBromide: iupacNameFromSmiles('CBr'),
  tertButylBromide: iupacNameFromSmiles(SN1_SUBSTRATE_SMILES),
  methanol: iupacNameFromSmiles(SN2_PRODUCT_SMILES),
  tertButanol: iupacNameFromSmiles(SN1_PRODUCT_SMILES),
  allylBromide: iupacNameFromSmiles(ALLYL_BROMIDE_SMILES),
} as const

/** Formulas used in the drawing, from the parser. */
export const FORMULAS = {
  methylBromide: molecularFormula(parseSmiles('CBr')),
  tertButylBromide: molecularFormula(parseSmiles(SN1_SUBSTRATE_SMILES)),
  allylBromide: molecularFormula(parseSmiles(ALLYL_BROMIDE_SMILES)),
  benzylChloride: molecularFormula(parseSmiles(BENZYL_CHLORIDE_SMILES)),
} as const
