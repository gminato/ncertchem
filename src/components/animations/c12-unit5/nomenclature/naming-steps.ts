import { NCERT_LIGANDS, NCERT_METAL_NAMES, metalOxidationState, romanNumeral } from '@/lib/chem/ncert-c12-unit5-s3-tables'

export type NamingStepId =
  | 'formula'
  | 'name'
  | 'sorting'
  | 'charge-names'
  | 'charge-balance'
  | 'metal-ending'

export const NAMING_STEPS: readonly NamingStepId[] = [
  'formula',
  'name',
  'sorting',
  'charge-names',
  'charge-balance',
  'metal-ending',
]

export function namingStepId(step: number): NamingStepId {
  const clamped = Math.max(0, Math.min(NAMING_STEPS.length - 1, Math.floor(step)))
  return NAMING_STEPS[clamped]
}

export interface LigandChargeRow {
  readonly formulaDisplay: string
  readonly stem: string
  readonly ending: string
  readonly fullName: string
}

const byFormula = (f: string) => {
  const found = NCERT_LIGANDS.find((l) => l.formula === f)
  if (!found) throw new Error(`Missing ligand ${f}`)
  return found
}

export const ANION_LIGAND_ROWS: readonly LigandChargeRow[] = [
  { formulaDisplay: 'Cl⁻', stem: 'chlorid', ending: 'o', fullName: byFormula('Cl').name },
  { formulaDisplay: 'CN⁻', stem: 'cyanid', ending: 'o', fullName: byFormula('CN').name },
  { formulaDisplay: 'OH⁻', stem: 'hydroxid', ending: 'o', fullName: byFormula('OH').name },
  { formulaDisplay: 'C₂O₄²⁻', stem: 'oxalat', ending: 'o', fullName: byFormula('C2O4').name },
]

export const NEUTRAL_SPECIAL_ROWS: readonly { formulaDisplay: string; name: string }[] = [
  { formulaDisplay: 'H₂O', name: byFormula('H2O').name },
  { formulaDisplay: 'NH₃', name: byFormula('NH3').name },
  { formulaDisplay: 'CO', name: byFormula('CO').name },
  { formulaDisplay: 'NO', name: byFormula('NO').name },
]

export const CHARGE_BALANCE_EXAMPLE = {
  formula: 'K₄[Fe(CN)₆]',
  counterCount: 4,
  counterLabel: 'K⁺',
  counterTotal: 4,
  entityCharge: -4,
  ligandCount: 6,
  ligandLabel: 'CN⁻',
  ligandTotal: -6,
  metalSymbol: 'Fe',
  metalState: metalOxidationState(-4, [{ ligand: byFormula('CN'), count: 6 }]),
} as const

export interface MetalEndingPair {
  readonly metal: 'Fe' | 'Ag'
  readonly cationFormula: string
  readonly cationLabel: string
  readonly anionFormula: string
  readonly anionLabel: string
  readonly roman: string
}

export const METAL_ENDING_PAIRS: readonly MetalEndingPair[] = [
  {
    metal: 'Fe',
    cationFormula: '[Fe(H₂O)₆]²⁺',
    cationLabel: `${NCERT_METAL_NAMES.Fe.cation}(${romanNumeral(2)})`,
    anionFormula: '[Fe(CN)₆]⁴⁻',
    anionLabel: `${NCERT_METAL_NAMES.Fe.anion}(${romanNumeral(2)})`,
    roman: romanNumeral(2),
  },
  {
    metal: 'Ag',
    cationFormula: '[Ag(NH₃)₂]⁺',
    cationLabel: `${NCERT_METAL_NAMES.Ag.cation}(${romanNumeral(1)})`,
    anionFormula: '[Ag(CN)₂]⁻',
    anionLabel: `${NCERT_METAL_NAMES.Ag.anion}(${romanNumeral(1)})`,
    roman: romanNumeral(1),
  },
]
