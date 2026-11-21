import {
  cellConstantFromReference,
  conductivityFromCell,
  conductanceFromResistance,
  sPerMToSPerCm,
  molarConductivityScm2,
  resistanceFromResistivity,
  unknownResistanceFromBridge,
} from '@/lib/chem/conductance'

export type ConductivityStepId = 'wire-resistance' | 'solution-cell' | 'ac-drive' | 'bridge-null' | 'r-to-lambda'

export type ConductivityScene = 'wire' | 'cell' | 'ac' | 'bridge' | 'chain'

export interface ConductivityStepState {
  readonly index: number
  readonly id: ConductivityStepId
  readonly scene: ConductivityScene
  readonly ariaLabel: string
  readonly caption: string
}

export const CONDUCTIVITY_STEP_COUNT = 5

/** Worked numbers, all from the conductance lib so the caption and drawing agree. */
export const RHO_WIRE_OHM_M = 5.0e-7
export const WIRE_AREA_M2 = 1.0e-6
export const WIRE_LENGTH_M = 1.0
export const KCL_KAPPA_REF = 0.141 // S m⁻¹ at 0.010 mol L⁻¹, 298.15 K
export const KCL_RESISTANCE_OHM = 1000
export const BRIDGE_R3 = 1000
export const BRIDGE_R4 = 1000
export const BRIDGE_R1 = 2400
export const UNKNOWN_CONCENTRATION = 0.005 // mol L⁻¹

export const WIRE_R_BASE = resistanceFromResistivity(RHO_WIRE_OHM_M, WIRE_LENGTH_M, WIRE_AREA_M2) // 0.50 Ω
export const WIRE_R_LONG = resistanceFromResistivity(RHO_WIRE_OHM_M, 2 * WIRE_LENGTH_M, WIRE_AREA_M2) // 1.00 Ω
export const WIRE_R_THICK = resistanceFromResistivity(RHO_WIRE_OHM_M, WIRE_LENGTH_M, 2 * WIRE_AREA_M2) // 0.25 Ω
export const CELL_CONSTANT = cellConstantFromReference(KCL_RESISTANCE_OHM, KCL_KAPPA_REF) // 141 m⁻¹
export const UNKNOWN_R = unknownResistanceFromBridge(BRIDGE_R1, BRIDGE_R3, BRIDGE_R4) // 2400 Ω
export const UNKNOWN_KAPPA_SM = conductivityFromCell(CELL_CONSTANT, UNKNOWN_R) // 0.05875 S m⁻¹
export const UNKNOWN_KAPPA_SCM = sPerMToSPerCm(UNKNOWN_KAPPA_SM) // 5.875e-4 S cm⁻¹
export const UNKNOWN_LAMBDA_SCM2 = molarConductivityScm2(UNKNOWN_KAPPA_SCM, UNKNOWN_CONCENTRATION) // 117.5
export const CELL_CONSTANT_CM = CELL_CONSTANT / 100 // 1.41 cm⁻¹
export const WIRE_G_BASE = conductanceFromResistance(WIRE_R_BASE)

const fmtOhm = (r: number): string => r.toFixed(2)

export const CONDUCTIVITY_STEPS: readonly ConductivityStepState[] = [
  {
    index: 0,
    id: 'wire-resistance',
    scene: 'wire',
    caption: 'Length pushes resistance up; area pulls it down.',
    ariaLabel: `Three metal wires, each compared with the base wire. The base wire, 1.0 m long with a 1.0 mm² cross-section, has resistance ${fmtOhm(WIRE_R_BASE)} ohm. Stretched to 2.0 m, it has resistance ${fmtOhm(WIRE_R_LONG)} ohm. With twice the cross-section, it has resistance ${fmtOhm(WIRE_R_THICK)} ohm.`,
  },
  {
    index: 1,
    id: 'solution-cell',
    scene: 'cell',
    caption: 'G* = l/A is the one number that describes the cell.',
    ariaLabel:
      'A conductivity cell: two plates a distance l apart with area A, filled with a colourless solution. Ions drift through the liquid between the plates.',
  },
  {
    index: 2,
    id: 'ac-drive',
    scene: 'ac',
    caption: 'Direct current changes the composition. Alternating current does not.',
    ariaLabel:
      'Two cells side by side. With direct current, ions travel to the plates and gas bubbles form, so the composition changes. With alternating current, the ions oscillate in place and the composition is unchanged.',
  },
  {
    index: 3,
    id: 'bridge-null',
    scene: 'bridge',
    caption: 'When the detector is silent, R₂ = R₁R₄/R₃.',
    ariaLabel: `Wheatstone bridge drawn as a diamond. An oscillator feeds one diagonal and a detector sits across the other. The arms are R1 variable, R2 the cell, R3 and R4 fixed. The detector needle reads zero, so R2 equals ${UNKNOWN_R} ohm.`,
  },
  {
    index: 4,
    id: 'r-to-lambda',
    scene: 'chain',
    caption: 'Calibrate once, measure many: R → κ → Λm.',
    ariaLabel: `Calibration chain. A KCl cell with κ ${KCL_KAPPA_REF} S per metre and R ${KCL_RESISTANCE_OHM} ohm gives a cell constant of ${CELL_CONSTANT.toFixed(0)} per metre. The unknown cell reads ${UNKNOWN_R} ohm, so κ is ${UNKNOWN_KAPPA_SM.toPrecision(4)} S per metre, or ${(UNKNOWN_KAPPA_SCM * 1e4).toPrecision(4)} times ten to the minus four S per cm. At ${UNKNOWN_CONCENTRATION.toFixed(4)} mol per litre the molar conductivity is ${UNKNOWN_LAMBDA_SCM2.toFixed(1)} S cm² per mol.`,
  },
]

export function clampConductivityStep(index: number): number {
  if (!Number.isFinite(index)) return 0
  return Math.min(CONDUCTIVITY_STEP_COUNT - 1, Math.max(0, Math.floor(index)))
}

export function getConductivityStepState(index: number): ConductivityStepState {
  return CONDUCTIVITY_STEPS[clampConductivityStep(index)]
}

