import { formationEnthalpyKJ } from '@/lib/chem/hess'

/** Number of Steps in the Hess-route Scrolly. */
export const HESS_STEP_COUNT = 4

/** Enthalpy of each level relative to C(s) + O₂(g), from Table 5.2 (kJ mol⁻¹). */
export const HESS_LEVEL_CO2_KJ = formationEnthalpyKJ('CO2(g)')
export const HESS_LEVEL_CO_KJ = formationEnthalpyKJ('CO(g)')

/** ΔH for CO(g) + ½O₂(g) → CO₂(g), the difference of the two levels (about −283.0 kJ mol⁻¹). */
export const HESS_CO_OXIDATION_KJ = HESS_LEVEL_CO2_KJ - HESS_LEVEL_CO_KJ

/** The two routes between C(s) + O₂(g) and CO₂(g). */
export type HessRoute = 'direct' | 'two-step'

/**
 * Which route is in full strength at each Step. The direct route is shown first, then the two-step
 * route, then both are compared, and at the last Step nothing is faded.
 */
export function highlightForStep(step: number): HessRoute | undefined {
  switch (clampHessStep(step)) {
    case 0:
      return 'direct'
    case 1:
    case 2:
      return 'two-step'
    default:
      return undefined
  }
}

/** Clamps a Step index to the range of the Scrolly. */
export function clampHessStep(step: number): number {
  if (!Number.isFinite(step)) return 0
  return Math.min(HESS_STEP_COUNT - 1, Math.max(0, Math.floor(step)))
}
