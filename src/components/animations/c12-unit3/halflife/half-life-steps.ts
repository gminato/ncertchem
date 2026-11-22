import { firstOrderConc, firstOrderHalfLife, fractionRemainingAfterHalfLives, formatSig, rateConstantUnits, zeroOrderConc, zeroOrderHalfLife, zeroOrderTimeToZero } from '@/lib/chem/kinetics'

/**
 * Deterministic target state for each Scrolly Step of Section 3.3.3 (Half-life of a reaction).
 * One shared rate constant k = 0.0500 (mol L⁻¹ s⁻¹ for zero order, s⁻¹ for first order) and
 * [R]₀ = 1.00 mol L⁻¹ (2.00 for the doubled runs). Every number comes from the kinetics lib.
 */

export const HL_K = 0.05
export const HL_R0 = 1
export const HL_R0_DOUBLE = 2
/** Right edge of the time axis (s); the longest curve, the zero-order run from 2.00, ends at 40 s. */
export const HL_T_MAX = 45

/** First-order t½ = ln 2 / k (independent of [R]₀). */
export const T_HALF_FIRST = firstOrderHalfLife(HL_K)
/** Zero-order t½ = [R]₀ / 2k. */
export const T_HALF_ZERO = zeroOrderHalfLife(HL_R0, HL_K)
export const T_HALF_ZERO_DOUBLE = zeroOrderHalfLife(HL_R0_DOUBLE, HL_K)
/** Zero-order time for [R] to reach zero, [R]₀ / k. */
export const T_ZERO_END = zeroOrderTimeToZero(HL_R0, HL_K)
export const T_ZERO_END_DOUBLE = zeroOrderTimeToZero(HL_R0_DOUBLE, HL_K)

/** First-order [R] for a start value (mol L⁻¹) at time t (s). */
export function firstCurve(R0: number): (t: number) => number {
  return (t) => firstOrderConc(R0, HL_K, t)
}

/** Zero-order [R] for a start value at time t, clamped at zero. */
export function zeroCurve(R0: number): (t: number) => number {
  return (t) => zeroOrderConc(R0, HL_K, t)
}

/** Time of the n-th first-order half-life (n ≥ 1). */
export function firstMarkerTime(n: number): number {
  return n * T_HALF_FIRST
}

/** Remaining fraction after n first-order half-lives (1/2, 1/4, 1/8). */
export function remainingFraction(n: number): number {
  return fractionRemainingAfterHalfLives(n)
}

/** Three significant figures, half-up, U+2212 minus (site formatter). */
export function fmtSig(x: number): string {
  return formatSig(x, 3)
}

export const UNITS_ZERO = rateConstantUnits(0).text
export const UNITS_FIRST = rateConstantUnits(1).text

export type HalfLifeStepId = 'one-half-life' | 'each-interval' | 'double-start' | 'zero-line' | 'zero-double' | 'orders-card'

export interface HalfLifeStepState {
  readonly index: number
  readonly id: HalfLifeStepId
  readonly ariaLabel: string
  /** Opacity of the first-order curve from [R]₀ = 1.00 (with its guides and markers). */
  readonly first1: number
  /** Opacity of the first-order curve from [R]₀ = 2.00. */
  readonly first2: number
  /** How many first-order half-life markers are shown (0 to 3). */
  readonly markers: number
  /** Opacity of the shaded consumed-amount bands between markers. */
  readonly bands: number
  /** Opacity of the zero-order run from [R]₀ = 1.00 (with its guide). */
  readonly zero1: number
  /** Opacity of the slope triangle on the zero-order line. */
  readonly slope: number
  /** Opacity of the zero-order run from [R]₀ = 2.00 (with its guide). */
  readonly zero2: number
  /** Opacity of the two-order plot group (0 on the summary card). */
  readonly plot: number
  /** Opacity of the Table 3.4 summary card. */
  readonly card: number
  /** Top of the y-axis for the plot (mol L⁻¹). */
  readonly yMax: number
}

const BASE: Omit<HalfLifeStepState, 'index' | 'id' | 'ariaLabel'> = {
  first1: 0,
  first2: 0,
  markers: 0,
  bands: 0,
  zero1: 0,
  slope: 0,
  zero2: 0,
  plot: 1,
  card: 0,
  yMax: 1.1,
}

export const HALF_LIFE_STEPS: readonly HalfLifeStepState[] = [
  { ...BASE, index: 0, id: 'one-half-life', ariaLabel: 'First order: [R] falls to half in one half-life', first1: 1, markers: 1 },
  { ...BASE, index: 1, id: 'each-interval', ariaLabel: 'Each half-life halves what is left: markers and shaded bands', first1: 1, markers: 3, bands: 1 },
  { ...BASE, index: 2, id: 'double-start', ariaLabel: 'Doubling the start leaves the first-order half-life unchanged', first1: 1, first2: 1, markers: 3, yMax: 2.1 },
  { ...BASE, index: 3, id: 'zero-line', ariaLabel: 'Zero order: a straight line with slope minus k', zero1: 1, slope: 1 },
  { ...BASE, index: 4, id: 'zero-double', ariaLabel: 'Doubling the start doubles the zero-order half-life', zero1: 0.35, zero2: 1, yMax: 2.1 },
  { ...BASE, index: 5, id: 'orders-card', ariaLabel: 'Zero and first order side by side', plot: 0, card: 1 },
]

export const HALF_LIFE_STEP_COUNT = HALF_LIFE_STEPS.length

/** Clamps a Scrolly step index (0-based) into the Step table. */
export function clampHalfLifeStep(step: number): number {
  if (!Number.isFinite(step)) return 0
  return Math.min(HALF_LIFE_STEP_COUNT - 1, Math.max(0, Math.floor(step)))
}

export function getHalfLifeStepState(step: number): HalfLifeStepState {
  return HALF_LIFE_STEPS[clampHalfLifeStep(step)]
}
