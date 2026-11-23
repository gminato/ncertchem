import { molecularFormula, parseSmiles } from '@/lib/chem/molecule-parse'

/** The six Steps of the Cannizzaro, ring-substitution and uses Scrolly, in Prose order. */
export const CANNIZZARO_BEATS = [
  'benzaldehyde-alkali',
  'two-benzaldehyde-reduced-oxidised',
  'methanal-equation',
  'products-side-by-side',
  'meta-nitration',
  'uses-board',
] as const

export type CannizzaroBeat = (typeof CANNIZZARO_BEATS)[number]

/** Kekulé SMILES only (molecule-parse). Atom 1 of each carbonyl-bearing SMILES is the CHO or CO₂⁻ carbon. */
export const BENZALDEHYDE_SMILES = 'O=CC1=CC=CC=C1'
export const PHENYLMETHANOL_SMILES = 'OCC1=CC=CC=C1'
export const BENZOATE_SMILES = 'O=C([O-])C1=CC=CC=C1'
export const NITRO_BENZALDEHYDE_SMILES = 'O=CC1=CC=CC(=C1)[N+]([O-])=O'
export const METHANOL_SMILES = 'CO'
export const FORMATE_SMILES = 'O=C[O-]'
export const METHANAL_SMILES = 'C=O'
export const ETHANAL_SMILES = 'CC=O'
export const PROPANONE_SMILES = 'CC(C)=O'
export const BUTANONE_SMILES = 'CCC(C)=O'

/** The CHO carbon (or the CO₂⁻ carbon) in the benzene-ring SMILES above. */
export const CARBONYL_CARBON_INDEX = 1

/** Uses board, Step 6: molecule, the name shown under it, and its tag. */
export const USES_BOARD = [
  { key: 'methanal', smiles: METHANAL_SMILES, tag: 'preserves specimens' },
  { key: 'ethanal', smiles: ETHANAL_SMILES, tag: 'raw material' },
  { key: 'benzaldehyde', smiles: BENZALDEHYDE_SMILES, tag: 'perfumery and dyes' },
  { key: 'propan-2-one', smiles: PROPANONE_SMILES, tag: 'industrial solvent' },
  { key: 'butan-2-one', smiles: BUTANONE_SMILES, tag: 'industrial solvent' },
] as const

/** Step 3 equation, balanced in every atom (2 C, 5 H, 3 O, 1 Na on each side) and in charge. */
export const METHANAL_EQUATION = '2HCHO + NaOH → HCOO⁻Na⁺ + CH₃OH'

const SUBSCRIPT_DIGITS: Record<string, string> = {
  '0': '₀',
  '1': '₁',
  '2': '₂',
  '3': '₃',
  '4': '₄',
  '5': '₅',
  '6': '₆',
  '7': '₇',
  '8': '₈',
  '9': '₉',
}

/** Turns the digits of a plain formula into subscripts, e.g. C7H6O becomes C₇H₆O. */
export function subscriptDigits(formula: string): string {
  return formula.replace(/[0-9]/g, (d) => SUBSCRIPT_DIGITS[d])
}

/** The molecular formula of a SMILES, with subscripts, for captions. Taken from the lib, never typed. */
export function formulaOf(smiles: string): string {
  return subscriptDigits(molecularFormula(parseSmiles(smiles)))
}
