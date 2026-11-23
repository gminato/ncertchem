/**
 * Data for the Class 12 Unit 6 Section 6.8 Scrolly (polyhalo-gallery). Every molecule is a Kekule
 * SMILES drawn by the organic components; the formula and name tests check them against the lib.
 */

export const POLYHALO_STEP_COUNT = 6

export const POLYHALO_MOLECULES = {
  dichloromethane: 'ClCCl',
  chloroform: 'ClC(Cl)Cl',
  iodoform: 'IC(I)I',
  carbonTetrachloride: 'ClC(Cl)(Cl)Cl',
  freon12: 'FC(F)(Cl)Cl',
  phosgene: 'O=C(Cl)Cl',
  ddt: 'ClC(Cl)(Cl)C(C1=CC=C(Cl)C=C1)C1=CC=C(Cl)C=C1',
} as const

/** Use tags shown beside the drawing, per Step (Step 1 lights four, Step 2 three). */
export const POLYHALO_TAGS: readonly (readonly string[])[] = [
  ['Solvent', 'Paint remover', 'Aerosol propellant', 'Solvent for making drugs'],
  ['Solvent for fats and iodine', 'Raw material for R-22', 'Former anaesthetic'],
  ['Extremely poisonous gas'],
  [],
  [],
  [],
]

/** Short label per Step, used as the panel's accessible name. */
export const POLYHALO_STEP_LABELS: readonly string[] = [
  'Dichloromethane: two chlorines on one carbon, with its uses and effects',
  'Chloroform in a brown, closed, full bottle',
  'Chloroform in a clear, half-empty bottle with light: phosgene forms',
  'Iodoform releases free iodine, which kills microbes',
  'Carbon tetrachloride and Freon 12 rise into the stratosphere',
  'DDT is stored in fatty tissue',
]

/** Dichloromethane effects, from NCERT 6.8.1 (wording kept to the source). */
export const DCM_EFFECTS = [
  { heading: 'Low levels in air', lines: ['Hearing and vision slightly', 'impaired'] },
  { heading: 'Higher levels', lines: ['Dizziness, nausea and', 'numbness'] },
] as const
