import { TABLE_8_3_ACIDS, unit8Name } from '@/lib/chem/ncert-c12-unit8-data'

// Deterministic target state for each Step of the carboxyl-group Scrolly. The Prose Steps are the spec;
// every molecule here is a Kekulé SMILES that the drawing and the tests both read.

/** Step 1: acetic acid, carboxyl group in full. */
export const ACETIC_ACID = 'CC(O)=O'
/** Step 2: the two resonance contributors of the carboxyl group. */
export const RESONANCE_NEUTRAL = ACETIC_ACID
export const RESONANCE_ZWITTERION = 'CC([O-])=[OH+]'
/** Step 3: the three acids that show where the common names came from. */
export const FORMIC_ACID = 'OC=O'
export const BUTYRIC_ACID = 'CCCC(O)=O'
/** Step 4: the IUPAC chain example. */
export const METHYLPENTANOIC_ACID = 'CCC(C)CC(O)=O'
/** Step 5: a dicarboxylic acid, a ring acid and the ring diacid. */
export const HEPTANEDIOIC_ACID = 'OC(=O)CCCCCC(O)=O'
export const BENZOIC_ACID = 'OC(=O)C1=CC=CC=C1'
export const PHTHALIC_ACID = 'OC(=O)C1=CC=CC=C1C(O)=O'
/** Step 6: the derivative family around one acyl group. */
export const ACYL_CHLORIDE = 'CC(=O)Cl'
export const ACID_ANHYDRIDE = 'CC(=O)OC(C)=O'
export const ESTER = 'CCOC(C)=O'
export const AMIDE = 'CC(N)=O'

/** Every molecule each Step draws, in drawing order. */
export const CARBOXYL_STEP_MOLECULES: readonly (readonly string[])[] = [
  [ACETIC_ACID],
  [RESONANCE_NEUTRAL, RESONANCE_ZWITTERION],
  [FORMIC_ACID, ACETIC_ACID, BUTYRIC_ACID],
  [METHYLPENTANOIC_ACID],
  [HEPTANEDIOIC_ACID, BENZOIC_ACID, PHTHALIC_ACID],
  [ACYL_CHLORIDE, ACID_ANHYDRIDE, ESTER, AMIDE],
]

/** Molecular formula of every drawn molecule (asserted in the unit test). */
export const CARBOXYL_FORMULAS: Readonly<Record<string, string>> = {
  [ACETIC_ACID]: 'C2H4O2',
  [RESONANCE_ZWITTERION]: 'C2H4O2',
  [FORMIC_ACID]: 'CH2O2',
  [BUTYRIC_ACID]: 'C4H8O2',
  [METHYLPENTANOIC_ACID]: 'C6H12O2',
  [HEPTANEDIOIC_ACID]: 'C7H12O4',
  [BENZOIC_ACID]: 'C7H6O2',
  [PHTHALIC_ACID]: 'C8H6O4',
  [ACYL_CHLORIDE]: 'C2H3ClO',
  [ACID_ANHYDRIDE]: 'C4H6O3',
  [ESTER]: 'C4H8O2',
  [AMIDE]: 'C2H5NO',
}

/** IUPAC names the Steps print for the namer's output (unit8Name must return these). */
export const CARBOXYL_NAMES: Readonly<Record<string, string>> = {
  [METHYLPENTANOIC_ACID]: '3-methylpentanoic acid',
  [HEPTANEDIOIC_ACID]: 'heptanedioic acid',
  [BENZOIC_ACID]: 'benzoic acid',
  [PHTHALIC_ACID]: 'benzene-1,2-dicarboxylic acid',
}

/** Step 3: the common names and their sources, as NCERT gives them. Common names come from Table 8.3. */
export const SOURCE_NOTES: readonly { smiles: string; source: string; latin: string }[] = [
  { smiles: FORMIC_ACID, source: 'red ants', latin: 'formica' },
  { smiles: ACETIC_ACID, source: 'vinegar', latin: 'acetum' },
  { smiles: BUTYRIC_ACID, source: 'rancid butter', latin: 'butyrum' },
]

/** The Table 8.3 common name for a SMILES, or undefined when the table has none. */
export function commonNameOf(smiles: string): string | undefined {
  return TABLE_8_3_ACIDS.find((c) => c.smiles === smiles)?.common
}

/** The IUPAC name the namer gives for a SMILES (the Step text uses this output). */
export function iupacOf(smiles: string): string {
  return unit8Name(smiles)
}
