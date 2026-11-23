/**
 * Target state of the carbonyl Scrolly (Section 8.1), one entry per Step. Each molecule is drawn from its SMILES;
 * the tests assert the molecular formula, the carbonyl atom index and (where the namer gives one) the name.
 */

export const CARBONYL_BEATS = ['planar', 'pi-overlap', 'polarised', 'aldehyde-ketone', 'chain-name', 'rings'] as const
export type CarbonylBeat = (typeof CARBONYL_BEATS)[number]

export interface CarbonylMolecule {
  smiles: string
  /** Molecular formula, plain digits; the drawing subscripts them. */
  formula: string
  /** Index of the carbonyl carbon in the SMILES atom order; the atom it is double-bonded to is oxygen. */
  carbonyl: number
  /** The namer's name, or null for a charged species the namer does not name. */
  name: string | null
}

export const FORMALDEHYDE: CarbonylMolecule = { smiles: 'C=O', formula: 'CH2O', carbonyl: 0, name: 'methanal' }
export const DIPOLAR_FORM: CarbonylMolecule = { smiles: '[CH2+][O-]', formula: 'CH2O', carbonyl: 0, name: null }
export const ACETALDEHYDE: CarbonylMolecule = { smiles: 'CC=O', formula: 'C2H4O', carbonyl: 1, name: 'ethanal' }
export const ACETONE: CarbonylMolecule = { smiles: 'CC(C)=O', formula: 'C3H6O', carbonyl: 1, name: 'propan-2-one' }
export const CHLOROBUTANAL: CarbonylMolecule = { smiles: 'CC(Cl)CC=O', formula: 'C4H7ClO', carbonyl: 4, name: '3-chlorobutanal' }
export const BENZALDEHYDE: CarbonylMolecule = { smiles: 'O=CC1=CC=CC=C1', formula: 'C7H6O', carbonyl: 1, name: 'benzaldehyde' }
export const METHYLCYCLOHEXANECARBALDEHYDE: CarbonylMolecule = {
  smiles: 'CC1CCCC(C1)C=O',
  formula: 'C8H14O',
  carbonyl: 7,
  name: '3-methylcyclohexanecarbaldehyde',
}
export const ACETOPHENONE: CarbonylMolecule = { smiles: 'CC(=O)C1=CC=CC=C1', formula: 'C8H8O', carbonyl: 1, name: '1-phenylethan-1-one' }

/** The molecules each Step draws, in drawing order. */
export const CARBONYL_STATE: Record<CarbonylBeat, readonly CarbonylMolecule[]> = {
  planar: [FORMALDEHYDE],
  'pi-overlap': [FORMALDEHYDE],
  polarised: [FORMALDEHYDE, DIPOLAR_FORM],
  'aldehyde-ketone': [ACETALDEHYDE, ACETONE],
  'chain-name': [CHLOROBUTANAL],
  rings: [BENZALDEHYDE, METHYLCYCLOHEXANECARBALDEHYDE, ACETOPHENONE],
}

/** The Step (0-based) to beat, clamped to the range of Steps. */
export function beatAt(step: number): CarbonylBeat {
  const index = Math.min(CARBONYL_BEATS.length - 1, Math.max(0, Math.round(step)))
  return CARBONYL_BEATS[index]
}
