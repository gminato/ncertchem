import { parseSmiles } from '@/lib/chem/molecule-parse'
import type { MolGraph } from '@/lib/chem/molecule-graph'

/** One Step of the carbonyl-redox Scrolly, in order. Ids match the MDX Steps 1–6. */
export const REDOX_BEATS = [
  'reduction-strip',
  'aldehyde-or-ketone',
  'tollens',
  'fehling',
  'ketone-cleavage',
  'haloform',
] as const

export type RedoxBeat = (typeof REDOX_BEATS)[number]

/** Every molecule the Scrolly draws, with the SMILES it is drawn from. */
export const REDOX_SMILES = {
  butanal: 'CCCC=O',
  butanol: 'CCCCO',
  butane: 'CCCC',
  pentanone: 'CCC(=O)CC',
  butanoicAcid: 'CCCC(O)=O',
  propanoicAcid: 'CCC(O)=O',
  ethanoicAcid: 'CC(O)=O',
  butanone: 'CCC(C)=O',
  triiodomethane: 'IC(I)I',
  propanoate: 'CCC(=O)[O-]',
} as const

export type RedoxSmilesKey = keyof typeof REDOX_SMILES

/** Molecular formula of each drawn molecule (asserted in the unit test). */
export const REDOX_FORMULA: Record<RedoxSmilesKey, string> = {
  butanal: 'C4H8O',
  butanol: 'C4H10O',
  butane: 'C4H10',
  pentanone: 'C5H10O',
  butanoicAcid: 'C4H8O2',
  propanoicAcid: 'C3H6O2',
  ethanoicAcid: 'C2H4O2',
  butanone: 'C4H8O',
  triiodomethane: 'CHI3',
  propanoate: 'C3H5O2-',
}

/**
 * IUPAC name of each molecule as iupacNameFromSmiles prints it (asserted in the unit test).
 * The propanoate ion has no namer name (the namer rejects charged species), so the class name is shown (R24).
 */
export const REDOX_NAME: Record<RedoxSmilesKey, string | null> = {
  butanal: 'butanal',
  butanol: 'butan-1-ol',
  butane: 'butane',
  pentanone: 'pentan-3-one',
  butanoicAcid: 'butanoic acid',
  propanoicAcid: 'propanoic acid',
  ethanoicAcid: 'ethanoic acid',
  butanone: 'butan-2-one',
  triiodomethane: 'triiodomethane',
  propanoate: null,
}

/** Atom indices (into parseSmiles order) that the Scrolly shades as the reacting carbon. */
export const REACTING_ATOM: Partial<Record<RedoxSmilesKey, number>> = {
  butanal: 3,
  butanol: 3,
  butane: 3,
  pentanone: 2,
  butanone: 3,
}

/** Bond cut in pentan-3-one: the C2–C4 bond (carbonyl carbon to the cut-off ethyl). */
export const CUT_BOND: readonly [number, number] = [2, 4]

/** The methyl group oxidised by hypoiodite in butan-2-one, and its bond to the carbonyl carbon. */
export const HALOFORM_METHYL: readonly [number, number] = [2, 3]

/** Molecules drawn in each Step, in drawing order. Used by the component and by the unit test. */
export const REDOX_STATE: Record<RedoxBeat, readonly RedoxSmilesKey[]> = {
  'reduction-strip': ['butanal', 'butanol', 'butane'],
  'aldehyde-or-ketone': ['butanal', 'pentanone', 'butanoicAcid'],
  tollens: ['butanal', 'pentanone'],
  fehling: ['butanal', 'pentanone'],
  'ketone-cleavage': ['pentanone', 'propanoicAcid', 'ethanoicAcid'],
  haloform: ['butanone', 'triiodomethane', 'propanoate'],
}

export function redoxGraph(key: RedoxSmilesKey): MolGraph {
  return parseSmiles(REDOX_SMILES[key])
}
