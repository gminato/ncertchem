/**
 * Target state of each Step in the Section 14 Scrolly (hvz-and-ring). Every drawn molecule is
 * listed here with its formula and name, so the unit test checks what the drawing shows.
 * Reduced motion is a cut: each Step is a still picture, with no tween.
 */

export interface HvzMolecule {
  readonly smiles: string
  /** molecularFormula of the parsed SMILES. */
  readonly formula: string
  /** unit8Name of the SMILES (the name the Step text uses). */
  readonly name: string
}

export const HVZ_MOLECULES = {
  butanoic: { smiles: 'CCCC(O)=O', formula: 'C4H8O2', name: 'butanoic acid' },
  bromobutanoic: { smiles: 'CCC(Br)C(O)=O', formula: 'C4H7BrO2', name: '2-bromobutanoic acid' },
  dimethylpropanoic: { smiles: 'CC(C)(C)C(O)=O', formula: 'C5H10O2', name: '2,2-dimethylpropanoic acid' },
  benzoic: { smiles: 'OC(=O)C1=CC=CC=C1', formula: 'C7H6O2', name: 'benzoic acid' },
  nitrobenzoic: { smiles: 'OC(=O)C1=CC=CC(=C1)[N+]([O-])=O', formula: 'C7H5NO4', name: '3-nitrobenzoic acid' },
  methanoic: { smiles: 'OC=O', formula: 'CH2O2', name: 'methanoic acid' },
  ethanoic: { smiles: 'CC(O)=O', formula: 'C2H4O2', name: 'ethanoic acid' },
  hexanedioic: { smiles: 'OC(=O)CCCCC(O)=O', formula: 'C6H10O4', name: 'hexanedioic acid' },
  octadecanoic: { smiles: 'CCCCCCCCCCCCCCCCCC(O)=O', formula: 'C18H36O2', name: 'octadecanoic acid' },
} as const satisfies Record<string, HvzMolecule>

export type HvzMoleculeKey = keyof typeof HVZ_MOLECULES

/** Index of the α-carbon in each SMILES above (SMILES atom order, from 0). */
export const ALPHA_CARBON = {
  butanoic: 2,
  bromobutanoic: 2,
  dimethylpropanoic: 1,
} as const

export interface HvzStepState {
  readonly step: number
  /** Molecules drawn in this Step, by key. */
  readonly drawn: readonly HvzMoleculeKey[]
  /** Product drawn after an arrow, if any (by key). */
  readonly product?: HvzMoleculeKey
  /** True when the Step shows a cross: the reaction does not happen. */
  readonly noReaction?: boolean
}

export const HVZ_STEP_STATES: readonly HvzStepState[] = [
  { step: 1, drawn: ['butanoic'] },
  { step: 2, drawn: ['butanoic'], product: 'bromobutanoic' },
  { step: 3, drawn: ['dimethylpropanoic'], noReaction: true },
  { step: 4, drawn: ['benzoic'], product: 'nitrobenzoic' },
  { step: 5, drawn: ['benzoic'], noReaction: true },
  { step: 6, drawn: ['methanoic', 'ethanoic', 'hexanedioic', 'octadecanoic'] },
]
