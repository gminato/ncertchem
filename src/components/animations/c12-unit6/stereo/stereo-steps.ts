import { parseSmiles, molecularFormula } from '@/lib/chem/molecule-parse'
import { iupacNameFromSmiles } from '@/lib/chem/iupac-organic'

/**
 * Molecules and names for the Stereochemistry of Substitution Scrolly. Every
 * number and name shown on screen comes from these SMILES through the libs.
 */

/** Step 2: a chiral halide with four different arms on C2. */
export const CHLOROPENTANE = 'CCCC(C)Cl'
/** Step 4: retention substrate; the CH2 next to the stereocentre carries OH. */
export const METHYLBUTANOL = 'CCC(C)CO'
export const METHYLBUTYL_CHLORIDE = 'CCC(C)CCl'
/** Step 5: SN2 substrate and product. */
export const BROMOOCTANE = 'CCCCCCC(C)Br'
export const OCTANOL = 'CCCCCCC(C)O'
/** Step 6: benzylic halide that ionises to a flat carbocation (SN1). */
export const PHENYLETHYL_BROMIDE = 'CC(Br)C1=CC=CC=C1'
export const PHENYLETHANOL = 'CC(O)C1=CC=CC=C1'

export const STEP_COUNT = 6

/** Name as the namer prints it (lower case, as the Prose uses it). */
export function stereoName(smiles: string): string {
  return iupacNameFromSmiles(smiles)
}

/** Formula, plain, for tests and labels. */
export function stereoFormula(smiles: string): string {
  return molecularFormula(parseSmiles(smiles))
}

/** Clamp a Scrolly step index into the valid range. */
export function clampStep(step: number): number {
  if (!Number.isFinite(step)) return 0
  return Math.min(STEP_COUNT - 1, Math.max(0, Math.floor(step)))
}
