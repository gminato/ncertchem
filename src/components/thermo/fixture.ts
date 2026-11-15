/**
 * Demo data for the thermodynamics components. The values are standard textbook
 * numbers chosen to show each case clearly. The lead wires real data from the
 * chemistry libraries when the Unit 5 content lands, so keep these local to demos.
 *
 * Units: L atm for work and nRT, kJ mol⁻¹ for ΔH and ΔG, J K⁻¹ mol⁻¹ for ΔS, K for T.
 */

import { isothermPoints, manyStepPoints, oneStepPoints, type PVPoint } from './geometry'

/** One mole of an ideal gas at 300 K, in L atm. */
export const NRT_300 = 24.6

/** Expansion from 2 L to 10 L at 300 K. */
export const PV_EXPANSION = (() => {
  const v1 = 2
  const v2 = 10
  const p1 = NRT_300 / v1
  const p2 = NRT_300 / v2
  return {
    v1,
    v2,
    p1,
    p2,
    /** One step against the final pressure. */
    oneStep: oneStepPoints(p1, v1, v2, p2) as PVPoint[],
    /** Four equal steps, each against the pressure at its end. */
    manyStep: manyStepPoints(NRT_300, v1, v2, 4) as PVPoint[],
    /** The reversible isotherm. */
    reversible: isothermPoints(NRT_300, v1, v2, 96) as PVPoint[],
  }
})()

/** Hess cycle for carbon burning to CO₂, in kJ mol⁻¹. */
export const HESS_CARBON = {
  direct: -393.5,
  carbonMonoxide: -110.5,
  monoxideToDioxide: -283.0,
} as const

/** The four Gibbs cases, each with ΔH in kJ mol⁻¹ and ΔS in J K⁻¹ mol⁻¹. */
export const GIBBS_CASES = {
  /** 2 H₂O₂(l) → 2 H₂O(l) + O₂(g): spontaneous at every temperature. */
  always: { dH: -196.1, dS: 125.7, label: '2 H₂O₂ → 2 H₂O + O₂' },
  /** The reverse reaction: never spontaneous. */
  never: { dH: 196.1, dS: -125.7, label: '2 H₂O + O₂ → 2 H₂O₂' },
  /** N₂ + 3 H₂ → 2 NH₃: spontaneous only below about 460 K. */
  lowT: { dH: -92.2, dS: -198.8, label: 'N₂ + 3 H₂ → 2 NH₃' },
  /** CaCO₃ → CaO + CO₂: spontaneous only above about 1100 K. */
  highT: { dH: 178.3, dS: 160.6, label: 'CaCO₃ → CaO + CO₂' },
} as const

/** Piston demo: a small volume under a heavy load, and a large volume under a light one. */
export const PISTON_DEMO = {
  compressed: { volume: 0.1, externalPressure: 4 },
  expanded: { volume: 0.9, externalPressure: 1 },
} as const
