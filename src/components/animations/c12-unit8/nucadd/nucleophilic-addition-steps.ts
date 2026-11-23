import { molecularFormula, parseSmiles } from '@/lib/chem/molecule-parse'
import type { MolGraph } from '@/lib/chem/molecule-graph'

/** The six Scrolly Steps (0-based), in the order the Prose describes them. */
export type NucAddBeat =
  | 'approach'
  | 'curved-arrows'
  | 'alkoxide'
  | 'protonation'
  | 'aldehyde-vs-ketone'
  | 'named-additions'

export const NUC_ADD_BEATS: readonly NucAddBeat[] = [
  'approach',
  'curved-arrows',
  'alkoxide',
  'protonation',
  'aldehyde-vs-ketone',
  'named-additions',
]

/** Kekulé SMILES of every molecule the Scrolly draws. */
export const ETHANAL_SMILES = 'CC=O'
export const PROPANONE_SMILES = 'CC(C)=O'
export const TETRAHEDRAL_ALKOXIDE_SMILES = 'CC([O-])C#N'
export const CYANOHYDRIN_SMILES = 'CC(O)C#N'

/** Atom indices used by the drawing (the order of parseSmiles). */
export const ETHANAL_CARBONYL_C = 1
export const ETHANAL_O = 2
export const ALKOXIDE_SP3_C = 1
export const ALKOXIDE_O = 2
export const PROPANONE_CARBONYL_C = 1
export const PROPANONE_METHYLS = [0, 2] as const

/** Text-only ion and adduct: the cyanide ion is drawn as ⁻:C≡N:, the adduct as its class formula. */
export const CYANIDE_TEXT = '⁻:C≡N:'
export const ADDUCT_TEXT = 'CH₃CH(OH)SO₃Na'

export function molGraph(smiles: string): MolGraph {
  return parseSmiles(smiles)
}

/** Formula of a drawn molecule, as molecularFormula prints it. */
export function drawnFormula(smiles: string): string {
  return molecularFormula(parseSmiles(smiles))
}

/** Expected state of each Step, so the test pins what the drawing must show. */
export interface NucAddState {
  /** Number of curved arrows drawn in this Step. */
  arrows: number
  /** Molecules drawn as skeletal formulas (SMILES). */
  molecules: readonly string[]
  /** Text-only species (cyanide ion, adduct). */
  texts: readonly string[]
}

export const NUC_ADD_STATES: Readonly<Record<NucAddBeat, NucAddState>> = {
  approach: { arrows: 0, molecules: [ETHANAL_SMILES], texts: [CYANIDE_TEXT] },
  'curved-arrows': { arrows: 2, molecules: [ETHANAL_SMILES], texts: [CYANIDE_TEXT] },
  alkoxide: { arrows: 0, molecules: [TETRAHEDRAL_ALKOXIDE_SMILES], texts: ['sp³'] },
  protonation: { arrows: 2, molecules: [TETRAHEDRAL_ALKOXIDE_SMILES, CYANOHYDRIN_SMILES], texts: ['H–A', 'A⁻'] },
  'aldehyde-vs-ketone': { arrows: 0, molecules: [ETHANAL_SMILES, PROPANONE_SMILES], texts: [CYANIDE_TEXT, 'crowded'] },
  'named-additions': { arrows: 0, molecules: [ETHANAL_SMILES, CYANOHYDRIN_SMILES], texts: ['HCN, base', 'NaHSO₃', ADDUCT_TEXT] },
}
