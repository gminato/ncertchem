/**
 * Pure chemistry helpers for Class 12 Unit 1, Sections 1.6.4–1.6.5:
 * Osmosis, osmotic pressure (Π = C R T), macromolecule molar mass,
 * cell tonicity relative to 0.9% (w/v) normal saline, and reverse osmosis.
 */

import { GAS_CONSTANT_L_BAR, NCERT_SOLVENT_CONSTANTS } from './ncert-c12-unit1-tables'

/** Normal saline concentration isotonic with human blood-cell fluid (% w/v NaCl). */
export const ISOTONIC_SALINE_MASS_PERCENT = 0.9

/** Conversion factor from bar to pascals (1 bar = 10⁵ Pa). */
export const PASCALS_PER_BAR = 1e5

/** Standard water density (kg m⁻³) and gravitational acceleration (m s⁻²) for hydrostatic head estimates. */
const WATER_DENSITY_KG_PER_M3 = 1000
const STANDARD_GRAVITY_M_PER_S2 = 9.81

const WATER_CONSTANTS = NCERT_SOLVENT_CONSTANTS.find((s) => s.id === 'water')!

export interface OsmoticPressureInput {
  /** Solution molarity C in mol L⁻¹. */
  readonly molarity: number
  /** Absolute temperature T in K. */
  readonly tempK: number
}

/**
 * Computes osmotic pressure Π = C R T in bar for a dilute non-electrolyte solution,
 * using R = 0.08314 L bar K⁻¹ mol⁻¹.
 */
export function osmoticPressureBar({ molarity, tempK }: OsmoticPressureInput): number {
  if (!Number.isFinite(molarity) || molarity < 0) {
    throw new RangeError('Molarity must be a non-negative finite number.')
  }
  if (!Number.isFinite(tempK) || tempK <= 0) {
    throw new RangeError('Temperature must be a positive finite number in kelvin.')
  }
  return molarity * GAS_CONSTANT_L_BAR * tempK
}

/** Converts pressure from bar to pascals (1 bar = 10⁵ Pa). */
export function barToPascals(bar: number): number {
  if (!Number.isFinite(bar)) {
    throw new RangeError('Pressure in bar must be finite.')
  }
  return bar * PASCALS_PER_BAR
}

/** Converts pressure from bar to kilopascals (1 bar = 100 kPa). */
export function barToKiloPascals(bar: number): number {
  if (!Number.isFinite(bar)) {
    throw new RangeError('Pressure in bar must be finite.')
  }
  return bar * 100
}

export interface MolarMassFromOsmosisInput {
  /** Mass of solute w₂ in grams. */
  readonly w2G: number
  /** Total solution volume V in litres. */
  readonly volumeL: number
  /** Measured osmotic pressure Π in bar. */
  readonly piBar: number
  /** Absolute temperature T in K. */
  readonly tempK: number
}

/**
 * Computes solute molar mass M₂ = (w₂ R T) / (Π V) in g mol⁻¹ from osmotic pressure data.
 */
export function molarMassFromOsmosis({
  w2G,
  volumeL,
  piBar,
  tempK,
}: MolarMassFromOsmosisInput): number {
  if (!Number.isFinite(w2G) || w2G <= 0) {
    throw new RangeError('Solute mass w2G must be positive.')
  }
  if (!Number.isFinite(volumeL) || volumeL <= 0) {
    throw new RangeError('Solution volume volumeL must be positive.')
  }
  if (!Number.isFinite(piBar) || piBar <= 0) {
    throw new RangeError('Osmotic pressure piBar must be positive.')
  }
  if (!Number.isFinite(tempK) || tempK <= 0) {
    throw new RangeError('Temperature tempK must be positive.')
  }
  return (w2G * GAS_CONSTANT_L_BAR * tempK) / (piBar * volumeL)
}

export type Tonicity = 'hypotonic' | 'isotonic' | 'hypertonic'
export type CellResponse = 'swells' | 'steady' | 'shrinks'

export interface TonicityResult {
  readonly externalSalineMassPercent: number
  readonly referenceMassPercent: number
  readonly tonicity: Tonicity
  readonly cellResponse: CellResponse
  readonly waterFlux: 'into-cell' | 'balanced' | 'out-of-cell'
}

/**
 * Compares an external aqueous NaCl concentration (% w/v) against human blood-cell
 * isotonic normal saline (0.9% w/v).
 */
export function compareTonicity(
  externalSalineMassPercent: number,
  tolerancePercent = 0.02,
): TonicityResult {
  if (!Number.isFinite(externalSalineMassPercent) || externalSalineMassPercent < 0) {
    throw new RangeError('External NaCl % (w/v) must be a non-negative finite number.')
  }
  if (!Number.isFinite(tolerancePercent) || tolerancePercent < 0) {
    throw new RangeError('Tolerance must be non-negative.')
  }

  const diff = externalSalineMassPercent - ISOTONIC_SALINE_MASS_PERCENT
  if (Math.abs(diff) <= tolerancePercent) {
    return {
      externalSalineMassPercent,
      referenceMassPercent: ISOTONIC_SALINE_MASS_PERCENT,
      tonicity: 'isotonic',
      cellResponse: 'steady',
      waterFlux: 'balanced',
    }
  }
  if (diff < 0) {
    return {
      externalSalineMassPercent,
      referenceMassPercent: ISOTONIC_SALINE_MASS_PERCENT,
      tonicity: 'hypotonic',
      cellResponse: 'swells',
      waterFlux: 'into-cell',
    }
  }
  return {
    externalSalineMassPercent,
    referenceMassPercent: ISOTONIC_SALINE_MASS_PERCENT,
    tonicity: 'hypertonic',
    cellResponse: 'shrinks',
    waterFlux: 'out-of-cell',
  }
}

export type OsmosisFlowDirection = 'forward-osmosis' | 'equilibrium' | 'reverse-osmosis'

export interface FlowDirectionInput {
  /** Excess pressure applied on the solution side, in bar. */
  readonly appliedPressureBar: number
  /** Solution osmotic pressure Π, in bar. */
  readonly osmoticPressureBar: number
  /** Equilibrium deadband in bar (default 1e-6 for exact comparisons). */
  readonly toleranceBar?: number
}

/**
 * Determines solvent flow regime across a semipermeable membrane:
 * - P_ext < Π  -> 'forward-osmosis' (solvent moves into solution)
 * - P_ext = Π  -> 'equilibrium'     (net solvent flow halts)
 * - P_ext > Π  -> 'reverse-osmosis' (pure solvent squeezed out of solution)
 */
export function flowDirection({
  appliedPressureBar,
  osmoticPressureBar: piBar,
  toleranceBar = 1e-6,
}: FlowDirectionInput): OsmosisFlowDirection {
  if (!Number.isFinite(appliedPressureBar) || appliedPressureBar < 0) {
    throw new RangeError('Applied pressure must be a non-negative finite number.')
  }
  if (!Number.isFinite(piBar) || piBar < 0) {
    throw new RangeError('Osmotic pressure must be a non-negative finite number.')
  }
  if (!Number.isFinite(toleranceBar) || toleranceBar < 0) {
    throw new RangeError('Tolerance must be non-negative.')
  }

  const net = appliedPressureBar - piBar
  if (Math.abs(net) <= toleranceBar) {
    return 'equilibrium'
  }
  return net < 0 ? 'forward-osmosis' : 'reverse-osmosis'
}

export interface MacromoleculeComparisonInput {
  /** Mass of dissolved protein/polymer in grams. */
  readonly w2G: number
  /** Molar mass of the macromolecule in g mol⁻¹. */
  readonly molarMassGPerMol: number
  /** Aqueous solution volume in litres (dilute approximation: 1 L water ≈ 1 kg water). */
  readonly volumeL: number
  /** Measurement temperature in kelvin (typically room temperature ~298 K). */
  readonly tempK?: number
}

export interface MacromoleculeColligativeComparison {
  readonly molarity: number
  readonly osmoticPressureBar: number
  readonly osmoticPressurePa: number
  /** Equivalent water column height h = Π / (ρ g) in centimetres. */
  readonly waterColumnHeightCm: number
  /** Estimated boiling-point elevation ΔT_b in kelvin (using aqueous K_b = 0.52 K kg mol⁻¹). */
  readonly deltaTbK: number
  /** Estimated freezing-point depression ΔT_f in kelvin (using aqueous K_f = 1.86 K kg mol⁻¹). */
  readonly deltaTfK: number
  /** True when ΔT_b is below 1 mK (0.001 K), making ebullioscopy impractical. */
  readonly deltaTbSubMillikelvin: boolean
  /** True when ΔT_f is below 1 mK (0.001 K), making cryoscopy impractical. */
  readonly deltaTfSubMillikelvin: boolean
  /** True when Π produces at least a 0.5 cm water column (≈ 50 Pa) at room temperature. */
  readonly measurableByOsmosis: boolean
}

/**
 * Compares osmotic pressure against boiling-point elevation and freezing-point depression
 * for a dilute aqueous macromolecule (protein or polymer) solution.
 * Illustrates why osmometry excels at room temperature while ΔT_b and ΔT_f fall below 10⁻³ K.
 */
export function compareMacromoleculeColligative({
  w2G,
  molarMassGPerMol,
  volumeL,
  tempK = 298,
}: MacromoleculeComparisonInput): MacromoleculeColligativeComparison {
  if (!Number.isFinite(w2G) || w2G <= 0) {
    throw new RangeError('Solute mass w2G must be positive.')
  }
  if (!Number.isFinite(molarMassGPerMol) || molarMassGPerMol <= 0) {
    throw new RangeError('Molar mass must be positive.')
  }
  if (!Number.isFinite(volumeL) || volumeL <= 0) {
    throw new RangeError('Volume must be positive.')
  }
  if (!Number.isFinite(tempK) || tempK <= 0) {
    throw new RangeError('Temperature must be positive.')
  }

  const moles = w2G / molarMassGPerMol
  const molarity = moles / volumeL
  // For dilute aqueous solutions, molality (mol kg⁻¹) ≈ molarity (mol L⁻¹).
  const piBar = osmoticPressureBar({ molarity, tempK })
  const piPa = barToPascals(piBar)
  const waterColumnHeightCm = (piPa / (WATER_DENSITY_KG_PER_M3 * STANDARD_GRAVITY_M_PER_S2)) * 100
  const deltaTbK = WATER_CONSTANTS.kb * molarity
  const deltaTfK = WATER_CONSTANTS.kf * molarity

  return {
    molarity,
    osmoticPressureBar: piBar,
    osmoticPressurePa: piPa,
    waterColumnHeightCm,
    deltaTbK,
    deltaTfK,
    deltaTbSubMillikelvin: deltaTbK < 1e-3,
    deltaTfSubMillikelvin: deltaTfK < 1e-3,
    measurableByOsmosis: piPa >= 50,
  }
}
