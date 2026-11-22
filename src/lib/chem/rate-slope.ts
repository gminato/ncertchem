/**
 * Model for the Rate Slope Explorer (Class 12 Unit 3, Section 3.1). One first-order
 * reaction A → B (or a stoichiometric variant) is followed on a concentration–time curve.
 * Every number the Simulation shows comes from here or from kinetics.ts.
 */
import {
  averageRate,
  firstOrderConc,
  firstOrderRate,
  firstOrderTangentSlope,
  reactionRateToSpeciesRate,
  speciesRateToReactionRate,
} from './kinetics'

/** [A] at t = 0, in mol L⁻¹. */
export const RATE_SLOPE_R0 = 0.1
/** First-order rate constant, in s⁻¹. */
export const RATE_SLOPE_K = 2.0e-3
/** Longest time the curve shows, in s. */
export const RATE_SLOPE_T_MAX = 600
/** Shortest chord the readers can draw, in s. */
export const RATE_SLOPE_MIN_SPAN = 10

export interface RateSlopeStoichiometry {
  id: 'A-B' | '2A-B' | '3A-2B'
  /** Coefficient of A. */
  a: number
  /** Coefficient of B. */
  b: number
  /** Plain-text label for the choice control. */
  label: string
  /** mhchem source for the equation. */
  ce: string
}

export const RATE_SLOPE_STOICH: readonly RateSlopeStoichiometry[] = [
  { id: 'A-B', a: 1, b: 1, label: 'A → B', ce: 'A -> B' },
  { id: '2A-B', a: 2, b: 1, label: '2A → B', ce: '2A -> B' },
  { id: '3A-2B', a: 3, b: 2, label: '3A → 2B', ce: '3A -> 2B' },
]

export function stoichiometryById(id: RateSlopeStoichiometry['id']): RateSlopeStoichiometry {
  const found = RATE_SLOPE_STOICH.find((s) => s.id === id)
  if (found === undefined) throw new RangeError(`unknown stoichiometry ${id}`)
  return found
}

/** [A] at time t, from the first-order law. */
export function concA(t: number): number {
  return firstOrderConc(RATE_SLOPE_R0, RATE_SLOPE_K, t)
}

/** [B] at time t, from mass balance: Δ[B] = (b/a) × (−Δ[A]). */
export function concB(s: RateSlopeStoichiometry, t: number): number {
  return (s.b / s.a) * (RATE_SLOPE_R0 - concA(t))
}

export interface ChordReadout {
  /** Rate of disappearance of A over the chord (positive). */
  disappearanceA: number
  /** Rate of reaction, Rate = −(1/a) d[A]/dt (positive). */
  rate: number
  /** Rate of appearance of B, (1/b) d[B]/dt, with b the coefficient of B. */
  appearanceB: number
}

/** Average rates over the chord from t1 to t2 (t2 later than t1). */
export function chordReadout(s: RateSlopeStoichiometry, t1: number, t2: number): ChordReadout {
  const disappearanceA = averageRate(concA(t1), concA(t2), t1, t2, 'reactant')
  const rate = speciesRateToReactionRate(-disappearanceA, s.a, 'reactant')
  const appearanceB = reactionRateToSpeciesRate(rate, s.b, 'product')
  return { disappearanceA, rate, appearanceB }
}

export interface TangentReadout {
  /** [A] at the tangent point, mol L⁻¹. */
  cA: number
  /** Signed slope of the [A] tangent, mol L⁻¹ s⁻¹ (negative). */
  slopeA: number
  /** Instantaneous rate of reaction (positive). */
  rate: number
  /** Instantaneous rate of appearance of B (positive). */
  appearanceB: number
}

/** Instantaneous rates at time t: the tangent slope of the [A] curve. */
export function tangentReadout(s: RateSlopeStoichiometry, t: number): TangentReadout {
  const slopeA = firstOrderTangentSlope(RATE_SLOPE_R0, RATE_SLOPE_K, t)
  const rate = speciesRateToReactionRate(slopeA, s.a, 'reactant')
  const appearanceB = reactionRateToSpeciesRate(rate, s.b, 'product')
  return { cA: concA(t), slopeA, rate, appearanceB }
}

/** Rate of disappearance of A at time t, straight from the rate law (a check on the tangent slope). */
export function instantaneousDisappearanceA(t: number): number {
  return firstOrderRate(RATE_SLOPE_R0, RATE_SLOPE_K, t)
}

/** Keep the chord ends ordered, at least RATE_SLOPE_MIN_SPAN apart, and inside the curve. */
export function clampChord(t1: number, t2: number): [number, number] {
  const start = Math.min(Math.max(t1, 0), RATE_SLOPE_T_MAX - RATE_SLOPE_MIN_SPAN)
  const end = Math.min(Math.max(t2, start + RATE_SLOPE_MIN_SPAN), RATE_SLOPE_T_MAX)
  return [start, end]
}
