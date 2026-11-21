/**
 * The AC Wheatstone bridge that measures a conductivity cell's resistance (NCERT Class 12 Unit 2,
 * Sec. 2.4, Fig. 2.5 and Eq. 2.19). The four arms are the conductivity cell Rₓ, the variable resistor
 * Rᵥ and two ratio arms R₄ and R₃. An AC source sits across one diagonal and a null detector across
 * the other. At balance Rₓ / Rᵥ = R₄ / R₃, so Rₓ = Rᵥ · (R₄ / R₃). Every number here comes from the libs; the source
 * amplitude, fixed arm and tolerances are teaching choices and are exported as named constants.
 */

import {
  cellConstant,
  conductivityFromCell,
  molarConductivityScm2,
  molarScm2ToSm2,
  sPerCmToSPerM,
  unknownResistanceFromBridge,
} from './conductance'
import { NCERT_KCL_CONDUCTIVITY } from './ncert-c12-unit2-tables'

/** Source amplitude across the source diagonal, volts. */
export const BRIDGE_SOURCE_VOLTS = 1

/** The fixed ratio arm R₃, ohms. R₄ = ratio × R₃. */
export const FIXED_ARM_OHM = 1000

/** Detector reads null when |V_detector| is at or below this, volts (0.05 mV). */
export const NULL_LIMIT_VOLTS = 5e-5

/** Variable resistor coarse range, ohms (log scale). */
export const RESISTOR_MIN_OHM = 0.1
export const RESISTOR_MAX_OHM = 1e5

/** Coarse positions on the log scale. */
export const COARSE_STEPS = 1000

/** One fine trim step changes Rᵥ by 0.01 %. The trim runs to ±500 steps (±5 %). */
export const FINE_STEP_FRACTION = 1e-4
export const FINE_LIMIT_STEPS = 500

/** Ratio arms: R₄ / R₃. */
export type RatioId = 'tenth' | 'unity' | 'ten'

export const RATIO_FACTOR: Readonly<Record<RatioId, number>> = {
  tenth: 0.1,
  unity: 1,
  ten: 10,
}

export interface ConductivitySolution {
  readonly id: string
  readonly molPerL: number
  /** Table 2.3 conductivity κ, S cm⁻¹, at 298.15 K. */
  readonly kappaScmInv: number
}

/** The KCl solutions of Table 2.3, the only solutions in the libs with measured conductivity. */
export const CONDUCTIVITY_SOLUTIONS: readonly ConductivitySolution[] = NCERT_KCL_CONDUCTIVITY.map(
  (row) => ({ id: `kcl-${row.molPerL}`, molPerL: row.molPerL, kappaScmInv: row.kappaScmInv }),
)

export function solutionById(id: string): ConductivitySolution {
  const found = CONDUCTIVITY_SOLUTIONS.find((s) => s.id === id)
  if (!found) throw new RangeError(`Unknown solution ${id}`)
  return found
}

/** The coarse setting of the variable resistor, ohms. Index 0 to COARSE_STEPS on a log scale. */
export function coarseResistance(index: number): number {
  const clamped = Math.min(COARSE_STEPS, Math.max(0, Math.round(index)))
  const decades = Math.log10(RESISTOR_MAX_OHM / RESISTOR_MIN_OHM)
  return RESISTOR_MIN_OHM * 10 ** ((clamped / COARSE_STEPS) * decades)
}

/** The variable resistor Rᵥ: the coarse value times (1 + trim × 0.01 %). */
export function variableResistance(index: number, trimSteps: number): number {
  const trim = Math.min(FINE_LIMIT_STEPS, Math.max(-FINE_LIMIT_STEPS, Math.round(trimSteps)))
  return coarseResistance(index) * (1 + trim * FINE_STEP_FRACTION)
}

/** The cell's true resistance R, ohms: the cell constant G* (l/A, cm⁻¹) divided by κ (S cm⁻¹). */
export function cellResistanceOhm(gapCm: number, areaCm2: number, kappaScmInv: number): number {
  return cellConstant(gapCm, areaCm2) / kappaScmInv
}

/**
 * Voltage between the two detector nodes, volts. The source runs from corner A to corner C of the
 * square; Rₓ (A–B), R₄ (B–C), R₃ (C–D) and Rᵥ (D–A) are the arms. Node B divides the source between
 * Rₓ and R₄; node D divides it between Rᵥ and R₃. Zero when Rₓ / Rᵥ = R₄ / R₃.
 */
export function detectorVolts(rv: number, rx: number, ratio: number): number {
  const r4 = ratio * FIXED_ARM_OHM
  return BRIDGE_SOURCE_VOLTS * (r4 / (rx + r4) - FIXED_ARM_OHM / (rv + FIXED_ARM_OHM))
}

export function isNull(volts: number): boolean {
  return Math.abs(volts) <= NULL_LIMIT_VOLTS
}

export interface BridgeSetting {
  readonly index: number
  readonly trim: number
}

/** The coarse index and fine trim that bring Rᵥ closest to the balance value Rₓ / ratio. */
export function balanceSetting(rx: number, ratio: number): BridgeSetting {
  const target = rx / ratio
  const decades = Math.log10(RESISTOR_MAX_OHM / RESISTOR_MIN_OHM)
  const index = Math.min(
    COARSE_STEPS,
    Math.max(0, Math.round((Math.log10(target / RESISTOR_MIN_OHM) / decades) * COARSE_STEPS)),
  )
  const base = coarseResistance(index)
  const trim = Math.min(
    FINE_LIMIT_STEPS,
    Math.max(-FINE_LIMIT_STEPS, Math.round((target / base - 1) / FINE_STEP_FRACTION)),
  )
  return { index, trim }
}

export interface CellMeasurement {
  /** Variable resistor Rᵥ, ohms. */
  readonly rv: number
  /** Detector voltage, volts. */
  readonly detectorVolts: number
  readonly isNull: boolean
  /** Bridge readout R = Rᵥ × R₄ / R₃, ohms. Valid as the cell resistance only when the detector is null. */
  readonly resistanceOhm: number
  /** Cell constant G* = l / A, cm⁻¹. */
  readonly cellConstantPerCm: number
  readonly kappaScmInv: number
  readonly kappaSmInv: number
  readonly lambdaScm2: number
  readonly lambdaSm2: number
}

export interface CellMeasurementInput {
  readonly solutionId: string
  readonly gapCm: number
  readonly areaCm2: number
  readonly ratio: RatioId
  readonly index: number
  readonly trim: number
}

/** Everything the simulation shows for one setting of the bridge and the cell. */
export function measureCell(input: CellMeasurementInput): CellMeasurement {
  const solution = solutionById(input.solutionId)
  const ratio = RATIO_FACTOR[input.ratio]
  const rv = variableResistance(input.index, input.trim)
  const rx = cellResistanceOhm(input.gapCm, input.areaCm2, solution.kappaScmInv)
  const volts = detectorVolts(rv, rx, ratio)
  const resistanceOhm = unknownResistanceFromBridge(rv, FIXED_ARM_OHM, ratio * FIXED_ARM_OHM)
  const gStar = cellConstant(input.gapCm, input.areaCm2)
  const kappaScmInv = conductivityFromCell(gStar, resistanceOhm)
  const lambdaScm2 = molarConductivityScm2(kappaScmInv, solution.molPerL)
  return {
    rv,
    detectorVolts: volts,
    isNull: isNull(volts),
    resistanceOhm,
    cellConstantPerCm: gStar,
    kappaScmInv,
    kappaSmInv: sPerCmToSPerM(kappaScmInv),
    lambdaScm2,
    lambdaSm2: molarScm2ToSm2(lambdaScm2),
  }
}
