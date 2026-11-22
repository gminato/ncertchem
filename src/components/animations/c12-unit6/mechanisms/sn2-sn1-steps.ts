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
/**
 * Resonance forms of the cations in Step 6. `cation` is the atom index that carries the +.
 * Allyl: the two contributors put the + on the other terminal carbon.
 * Benzyl: the + on CH2, then on the ring carbons ortho and para to the CH2 (Kekulé forms).
 */
export interface ChargedForm {
  smiles: string
  cation: number
}
export const ALLYL_CATION_FORMS: readonly ChargedForm[] = [
  { smiles: 'C=C[CH2+]', cation: 2 },
  { smiles: '[CH2+]C=C', cation: 0 },
]
export const BENZYL_CATION_FORMS: readonly ChargedForm[] = [
  { smiles: '[CH2+]C1=CC=CC=C1', cation: 0 },
  { smiles: 'C=C1[CH+]C=CC=C1', cation: 2 },
  { smiles: 'C=C1C=C[CH+]C=C1', cation: 4 },
]

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
