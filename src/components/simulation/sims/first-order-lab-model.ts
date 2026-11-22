import { firstOrderConc, firstOrderK, firstOrderKFromPressure, firstOrderRate } from '@/lib/chem/kinetics'

/** Values shared by the Prose and the Simulation (see SCRATCH/u3/reports/P6.md). */
export const DEFAULT_R0 = 0.2
export const DEFAULT_K = 0.025
export const DEFAULT_T = 60
export const T_MIN = 2
export const T_MAX = 120
/** Initial pressure of the gas-phase example A(g) → B(g) + C(g), in atm. */
export const P_INITIAL = 0.4
/** Molecules of A in the drawn vessel at t = 0. Every count is a rounded share of this. */
export const VESSEL_A0 = 12

export type PlotMode = 'conc' | 'ln' | 'log'

export interface ConcentrationReading {
  /** [R] at time t, mol L⁻¹. */
  R: number
  /** Rate = k[R], mol L⁻¹ s⁻¹ (positive). */
  rate: number
  /** k recovered from the reading, s⁻¹. */
  kFromReading: number
  /** Fraction of R₀ left. */
  fraction: number
}

export function readConcentration(R0: number, k: number, t: number): ConcentrationReading {
  const R = firstOrderConc(R0, k, t)
  return {
    R,
    rate: firstOrderRate(R0, k, t),
    kFromReading: firstOrderK(R0, R, t),
    fraction: R / R0,
  }
}

export interface PressureReading {
  /** Partial pressure of A, atm. */
  pA: number
  /** Total pressure, atm: p_t = 2pᵢ − p_A. */
  pT: number
  /** The pressure ceiling, 2pᵢ, atm. */
  pCeiling: number
  /** k recovered from the total pressure, s⁻¹. */
  kFromReading: number
}

export function readPressure(k: number, t: number): PressureReading {
  const pA = firstOrderConc(P_INITIAL, k, t)
  const pT = 2 * P_INITIAL - pA
  return {
    pA,
    pT,
    pCeiling: 2 * P_INITIAL,
    kFromReading: firstOrderKFromPressure(P_INITIAL, pT, t),
  }
}

export interface VesselCounts {
  /** Molecules of A still in the vessel. */
  reactant: number
  /** Molecules of B, and of C: one of each per decomposed A. */
  productEach: number
}

/**
 * Drawn molecule counts. Each A that decomposes gives one B and one C, so the
 * gas total is A + 2·(decomposed), which tracks pₜ/pᵢ = 2 − e^(−kt) to within rounding.
 */
export function vesselCounts(k: number, t: number): VesselCounts {
  const reactant = Math.round(VESSEL_A0 * Math.exp(-k * t))
  return { reactant, productEach: VESSEL_A0 - reactant }
}

/** The y window for one plot mode, so the curve always fills the frame. */
export function plotDomain(mode: PlotMode, R0: number, k: number): { yMin: number; yMax: number } {
  if (mode === 'conc') return { yMin: 0, yMax: R0 * 1.1 }
  if (mode === 'ln') return { yMin: Math.log(R0) - k * T_MAX - 0.25, yMax: Math.log(R0) + 0.25 }
  return { yMin: 0, yMax: Math.max(0.2, (k * T_MAX) / 2.303 + 0.1) }
}
