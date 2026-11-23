/**
 * Target state of each Step in the Section 13 Scrolly (acid-derivatives).
 * Every drawn molecule is listed with its Kekulé SMILES and its formula; the unit test
 * checks each formula with molecularFormula(parseSmiles(...)).
 * Ions, salts and the protonated stages of the Step 3 mechanism are written as text and are
 * not parsed; only neutral molecules appear in SMILES form below.
 */

export const SMILES = {
  acetic: 'CC(=O)O',
  methanol: 'CO',
  tetrahedral: 'CC(O)(O)OC',
  anhydride: 'CC(=O)OC(C)=O',
  methylEthanoate: 'CC(=O)OC',
  butanoicAcid: 'CCCC(O)=O',
  butanoylChloride: 'CCCC(=O)Cl',
  propanoicAcid: 'CCC(O)=O',
  propanamide: 'CCC(N)=O',
  pentanoicAcid: 'CCCCC(O)=O',
  pentanol: 'CCCCCO',
  pentane: 'CCCCC',
} as const

export type MoleculeKey = keyof typeof SMILES

export const FORMULA: Readonly<Record<MoleculeKey, string>> = {
  acetic: 'C2H4O2',
  methanol: 'CH4O',
  tetrahedral: 'C3H8O3',
  anhydride: 'C4H6O3',
  methylEthanoate: 'C3H6O2',
  butanoicAcid: 'C4H8O2',
  butanoylChloride: 'C4H7ClO',
  propanoicAcid: 'C3H6O2',
  propanamide: 'C3H7NO',
  pentanoicAcid: 'C5H10O2',
  pentanol: 'C5H12O',
  pentane: 'C5H12',
}

/** The molecules each Step shows (skeletal or condensed text), in drawing order. */
export const STEP_MOLECULES: Readonly<Record<1 | 2 | 3 | 4 | 5 | 6, readonly MoleculeKey[]>> = {
  1: ['acetic', 'anhydride'],
  2: ['acetic', 'methanol', 'methylEthanoate'],
  3: ['tetrahedral', 'methylEthanoate'],
  4: ['butanoicAcid', 'butanoylChloride'],
  5: ['propanoicAcid', 'propanamide'],
  6: ['pentanoicAcid', 'pentanol', 'pentane'],
}
