import { NCERT_HENRY_CONSTANTS } from './ncert-c12-unit1-tables'

/** Supported gases in the Henry's law calculations and interactive lab. */
export type HenryGas = 'O2' | 'N2' | 'CO2' | 'He'

/** Moles of water in 1 L (1000 g / 18.015 g mol⁻¹ ≈ 55.5 mol), matching NCERT Class 12 Unit 1. */
export const WATER_MOLES_PER_LITRE = 55.5

/** Standard dry air composition (mole fractions) for diving comparisons. */
export const SCUBA_AIR_COMPOSITION = {
  N2: 0.78,
  O2: 0.21,
  He: 0,
} as const

/** Helium-diluted breathing mix cited in NCERT Class 12 Unit 1, Section 1.3.2. */
export const SCUBA_HELIOX_COMPOSITION = {
  He: 0.117,
  N2: 0.562,
  O2: 0.321,
} as const

export interface HenryGasMetadata {
  readonly id: HenryGas
  readonly name: string
  readonly formula: string
  readonly referenceTempK: number
  readonly referenceKhKbar: number
  /** Suggested upper mole-fraction bound for plotting p (0–5 bar) vs x cleanly. */
  readonly plotMaxX: number
}

function getTableKh(id: string): number {
  const entry = NCERT_HENRY_CONSTANTS.find((item) => item.id === id)
  if (!entry) {
    throw new Error(`Missing NCERT_HENRY_CONSTANTS entry for "${id}"`)
  }
  return entry.khKbar
}

const KH_O2_293 = getTableKh('o2-293')
const KH_O2_303 = getTableKh('o2-303')
const KH_N2_293 = getTableKh('n2-293')
const KH_N2_303 = getTableKh('n2-303')
const KH_CO2_298 = getTableKh('co2-298')
const KH_HE_293 = getTableKh('he-293')

/**
 * van 't Hoff slope B (in K) for ln(K_H(T) / K_H(T_ref)) = B * (1/T_ref - 1/T).
 * Positive B means K_H rises with temperature (exothermic gas dissolution).
 * O2 and N2 slopes are derived exactly from NCERT Table 1.2 pairs (293 K & 303 K).
 */
const VAN_T_HOFF_SLOPE_K: Record<HenryGas, { refTempK: number; refKhKbar: number; slopeK: number }> = {
  O2: {
    refTempK: 293,
    refKhKbar: KH_O2_293,
    slopeK: Math.log(KH_O2_303 / KH_O2_293) / (1 / 293 - 1 / 303),
  },
  N2: {
    refTempK: 293,
    refKhKbar: KH_N2_293,
    slopeK: Math.log(KH_N2_303 / KH_N2_293) / (1 / 293 - 1 / 303),
  },
  CO2: {
    refTempK: 298,
    refKhKbar: KH_CO2_298,
    // Standard enthalpy of dissolution for CO2 in water (~ -20 kJ mol⁻¹ => B ≈ 2400 K)
    slopeK: 2400,
  },
  He: {
    refTempK: 293,
    refKhKbar: KH_HE_293,
    // Mildly positive temperature sensitivity in the 283–313 K range
    slopeK: 450,
  },
}

export const HENRY_GAS_METADATA: Record<HenryGas, HenryGasMetadata> = {
  O2: {
    id: 'O2',
    name: 'Oxygen',
    formula: 'O₂',
    referenceTempK: 293,
    referenceKhKbar: KH_O2_293,
    plotMaxX: 2.2e-4,
  },
  N2: {
    id: 'N2',
    name: 'Nitrogen',
    formula: 'N₂',
    referenceTempK: 293,
    referenceKhKbar: KH_N2_293,
    plotMaxX: 9.0e-5,
  },
  CO2: {
    id: 'CO2',
    name: 'Carbon dioxide',
    formula: 'CO₂',
    referenceTempK: 298,
    referenceKhKbar: KH_CO2_298,
    plotMaxX: 5.0e-3,
  },
  He: {
    id: 'He',
    name: 'Helium',
    formula: 'He',
    referenceTempK: 293,
    referenceKhKbar: KH_HE_293,
    plotMaxX: 4.5e-5,
  },
}

/**
 * Computes the equilibrium dissolved mole fraction x of a gas from Henry's law:
 *   x = p / (K_H * 1000)
 * where p is partial pressure in bar and K_H is in kbar.
 */
export function henryMoleFraction(partialPressureBar: number, khKbar: number): number {
  if (!Number.isFinite(partialPressureBar) || partialPressureBar < 0) {
    throw new RangeError('partialPressureBar must be a non-negative finite number')
  }
  if (!Number.isFinite(khKbar) || khKbar <= 0) {
    throw new RangeError('khKbar must be a positive finite number')
  }
  return partialPressureBar / (khKbar * 1000)
}

/**
 * Computes the equilibrium partial pressure p (in bar) above a solution from Henry's law:
 *   p = (K_H * 1000) * x
 */
export function henryPartialPressureBar(moleFraction: number, khKbar: number): number {
  if (!Number.isFinite(moleFraction) || moleFraction < 0 || moleFraction > 1) {
    throw new RangeError('moleFraction must be between 0 and 1 inclusive')
  }
  if (!Number.isFinite(khKbar) || khKbar <= 0) {
    throw new RangeError('khKbar must be a positive finite number')
  }
  return khKbar * 1000 * moleFraction
}

/**
 * Converts a dissolved gas mole fraction x in water into millimoles dissolved per litre of water.
 * Uses the exact relation n = (55.5 * x / (1 - x)) * 1000 mmol, which reduces to
 * 55.5 * x * 1000 mmol in the dilute limit (x << 1).
 */
export function dissolvedMillimolesPerLitreWater(moleFraction: number): number {
  if (!Number.isFinite(moleFraction) || moleFraction < 0 || moleFraction >= 1) {
    throw new RangeError('moleFraction must be in [0, 1)')
  }
  return ((WATER_MOLES_PER_LITRE * moleFraction) / (1 - moleFraction)) * 1000
}

/**
 * Returns Henry's law constant K_H (in kbar) for the selected gas in water at temperature tempK.
 * Anchored exactly to NCERT Table 1.2 values:
 * - O₂: 34.86 kbar (293 K), 46.82 kbar (303 K)
 * - N₂: 76.48 kbar (293 K), 88.84 kbar (303 K)
 * - CO₂: 1.67 kbar (298 K)
 * - He: 144.97 kbar (293 K)
 * K_H increases monotonically with temperature because gas dissolution is exothermic.
 */
export function interpolatedKhKbar(gas: HenryGas, tempK: number): number {
  if (!Number.isFinite(tempK) || tempK <= 0) {
    throw new RangeError('tempK must be a positive finite temperature in kelvin')
  }
  const { refTempK, refKhKbar, slopeK } = VAN_T_HOFF_SLOPE_K[gas]
  if (tempK === refTempK) {
    return refKhKbar
  }
  return refKhKbar * Math.exp(slopeK * (1 / refTempK - 1 / tempK))
}

/**
 * Hydrostatic plus atmospheric pressure experienced by a diver at a given underwater depth:
 *   P = 1 + depthMeters / 10  (bar)
 */
export function diverPressureBar(depthMeters: number): number {
  if (!Number.isFinite(depthMeters) || depthMeters < 0) {
    throw new RangeError('depthMeters must be a non-negative finite number')
  }
  return 1 + depthMeters / 10
}
