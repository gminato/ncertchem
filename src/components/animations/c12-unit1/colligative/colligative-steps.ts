export interface ColligativeStepSpec {
  readonly index: number
  readonly badge: string
  readonly title: string
  readonly formula: string
  readonly ariaLabel: string
  /** Dimensionless visual vapour-pressure lowering fraction alpha in [0, 0.28]. */
  readonly loweringAlpha: number
  readonly showDeltaP: boolean
  readonly highlightBoiling: boolean
  readonly highlightFreezing: boolean
  readonly showRangeComparison: boolean
}

/** Pure solvent freezing anchor in normalised plot coordinates (u in [0, 1], v in [0, 1.2]). */
export const PURE_FREEZING_U = 0.34
export const PURE_FREEZING_V = 0.34

/** Pure solvent normal boiling anchor (v = 1.0 corresponds to 1.013 bar / 1 atm). */
export const PURE_BOILING_U = 0.76
export const ATM_PRESSURE_V = 1.0

/** Clausius-Clapeyron-like visual slope for the liquid vapour-pressure curve. */
export const LIQUID_CURVE_K =
  Math.log(ATM_PRESSURE_V / PURE_FREEZING_V) / (PURE_BOILING_U - PURE_FREEZING_U)

/** Steeper sublimation slope for the solid solvent vapour-pressure curve (Δ_sub H > Δ_vap H). */
export const SOLID_CURVE_K = 5.4

/** Maximum visual fractional lowering applied to the solution vapour-pressure curve. */
export const MAX_LOWERING_ALPHA = 0.28

/** Pure solvent liquid vapour pressure v(u), passing through (U_f0, V_f0) and (U_b0, 1.0). */
export function pureVapourPressure(u: number): number {
  return ATM_PRESSURE_V * Math.exp(LIQUID_CURVE_K * (u - PURE_BOILING_U))
}

/** Lowered solution vapour pressure v_sol(u) = (1 − α) · v_pure(u). */
export function solutionVapourPressure(u: number, alpha: number): number {
  return (1 - alpha) * pureVapourPressure(u)
}

/** Pure solid solvent vapour pressure v_solid(u), meeting the pure liquid curve at (U_f0, V_f0). */
export function solidVapourPressure(u: number): number {
  return PURE_FREEZING_V * Math.exp(SOLID_CURVE_K * (u - PURE_FREEZING_U))
}

/** Exact temperature coordinate u_b where the solution curve reaches 1.013 bar (v = 1.0). */
export function solveBoilingU(alpha: number): number {
  if (alpha <= 0) return PURE_BOILING_U
  return PURE_BOILING_U - Math.log(1 - alpha) / LIQUID_CURVE_K
}

/** Exact temperature coordinate u_f where the solution curve meets the solid solvent curve. */
export function solveFreezingU(alpha: number): number {
  if (alpha <= 0) return PURE_FREEZING_U
  return PURE_FREEZING_U + Math.log(1 - alpha) / (SOLID_CURVE_K - LIQUID_CURVE_K)
}

export const COLLIGATIVE_STEPS: readonly ColligativeStepSpec[] = [
  {
    index: 0,
    badge: 'Step 1 of 5',
    title: 'Pure solvent vapour-pressure curve',
    formula: 'Pure solvent boils at T_b⁰ (1.013 bar) and freezes at T_f⁰ (liquid = solid)',
    ariaLabel:
      'Step 1: Vapour pressure versus temperature diagram for a pure solvent, meeting the solid curve at freezing point T f naught and reaching 1.013 bar at boiling point T b naught.',
    loweringAlpha: 0,
    showDeltaP: false,
    highlightBoiling: false,
    highlightFreezing: false,
    showRangeComparison: false,
  },
  {
    index: 1,
    badge: 'Step 2 of 5',
    title: 'Non-volatile solute lowers the entire curve',
    formula: 'Δp₁ / p₁⁰ = (p₁⁰ − p₁) / p₁⁰ = x₂  (independent of solute identity)',
    ariaLabel:
      'Step 2: Dissolving a non-volatile solute shifts the entire liquid vapour-pressure curve downward by a relative lowering equal to the solute mole fraction x 2.',
    loweringAlpha: MAX_LOWERING_ALPHA,
    showDeltaP: true,
    highlightBoiling: false,
    highlightFreezing: false,
    showRangeComparison: false,
  },
  {
    index: 2,
    badge: 'Step 3 of 5',
    title: 'Boiling point rises to reach 1.013 bar',
    formula: 'ΔT_b = T_b − T_b⁰ = K_b · m  (boiling-point elevation)',
    ariaLabel:
      'Step 3: Because the solution vapour-pressure curve sits lower, it reaches 1.013 bar only at a higher boiling temperature T b, giving a boiling-point elevation delta T b equal to K b times m.',
    loweringAlpha: MAX_LOWERING_ALPHA,
    showDeltaP: false,
    highlightBoiling: true,
    highlightFreezing: false,
    showRangeComparison: false,
  },
  {
    index: 3,
    badge: 'Step 4 of 5',
    title: 'Freezing point drops where curves meet',
    formula: 'ΔT_f = T_f⁰ − T_f = K_f · m  (freezing-point depression)',
    ariaLabel:
      'Step 4: At low temperatures, the lowered solution vapour-pressure curve meets the steeper solid solvent curve further left at a lower freezing temperature T f, giving delta T f equal to K f times m.',
    loweringAlpha: MAX_LOWERING_ALPHA,
    showDeltaP: false,
    highlightBoiling: false,
    highlightFreezing: true,
    showRangeComparison: false,
  },
  {
    index: 4,
    badge: 'Step 5 of 5',
    title: 'One curve drop widens the liquid range on both ends',
    formula: 'Widened [T_f, T_b] explains antifreeze & de-icing; ΔT_b or ΔT_f yields M₂',
    ariaLabel:
      'Step 5: Comparing the pure solvent and solution liquid temperature ranges shows that lowering vapour pressure widens the liquid phase on both the cold and hot ends, explaining antifreeze, road de-icing, and molar mass determination.',
    loweringAlpha: MAX_LOWERING_ALPHA,
    showDeltaP: false,
    highlightBoiling: true,
    highlightFreezing: true,
    showRangeComparison: true,
  },
] as const

export function clampColligativeStep(step: number): number {
  if (!Number.isFinite(step)) return 0
  return Math.max(0, Math.min(COLLIGATIVE_STEPS.length - 1, Math.round(step)))
}
