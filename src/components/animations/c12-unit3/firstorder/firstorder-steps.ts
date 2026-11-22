import {
  firstOrderConc,
  firstOrderRate,
  lnConc,
  log10Ratio,
  partialPressureA,
} from '@/lib/chem/kinetics'

/** The concentration example (P6 Prose): [R]₀ = 0.200 mol L⁻¹, k = 0.0250 s⁻¹. */
export const R0 = 0.2
export const K = 0.025
/** The gas example: pᵢ = 0.400 atm for A(g) → B(g) + C(g), same k. */
export const P_I = 0.4
/** Time at which the flask Step reads its gauge (s). */
export const FLASK_TIME = 60
/** Particle slots per atm in the flask drawing (an atm of pressure is 45 molecules). */
export const PARTICLES_PER_ATM = 45
/** Slots drawn at the fully reacted end: 2pᵢ × 45 = 36. */
export const MAX_SLOTS = Math.round(2 * P_I * PARTICLES_PER_ATM)
/** Time points marked on the curve and the plots (s). */
export const MARK_TIMES = [0, 20, 40, 60] as const

export type FirstOrderMode = 'conc' | 'ln' | 'log' | 'flask'

export interface FirstOrderStepState {
  mode: FirstOrderMode
  /** Show the tangents at t = 0 and t = 60 s. */
  tangents: boolean
  /** Show the drop lines and the strip of bars. */
  guides: boolean
  /** Show the slope triangle on the straight-line plots. */
  triangle: boolean
  /** Time the flask has reached (s); the Step tweens the reading to this value. */
  flaskTime: number
}

/** Target state for each Step (0-based, as Scrolly passes it). */
export function getFirstOrderStepState(step: number): FirstOrderStepState {
  const base = { tangents: false, guides: false, triangle: false, flaskTime: 0 }
  switch (step) {
    case 0:
      return { ...base, mode: 'conc', tangents: true }
    case 1:
      return { ...base, mode: 'conc', guides: true }
    case 2:
      return { ...base, mode: 'ln', triangle: true }
    case 3:
      return { ...base, mode: 'log', triangle: true }
    default:
      return { ...base, mode: 'flask', flaskTime: FLASK_TIME }
  }
}

/** [R] at time t (s) for the concentration example. */
export function concAt(t: number): number {
  return firstOrderConc(R0, K, t)
}

/** Rate k[R] at time t (s), positive, mol L⁻¹ s⁻¹. */
export function rateAt(t: number): number {
  return firstOrderRate(R0, K, t)
}

/** ln[R] at time t. */
export function lnAt(t: number): number {
  return lnConc(concAt(t))
}

/** log₁₀([R]₀/[R]) at time t. */
export function log10At(t: number): number {
  return log10Ratio(R0, concAt(t))
}

/** Partial pressure of A at time t in the gas example. */
export function pressureAAt(t: number): number {
  return P_I * Math.exp(-K * t)
}

/** Total pressure at time t, from pₜ = 2pᵢ − p_A (lib partialPressureA is its inverse). */
export function totalPressureAt(t: number): number {
  return 2 * P_I - pressureAAt(t)
}

export interface FlaskCounts {
  nA: number
  nB: number
  nC: number
  /** Molecules drawn: nA + nB + nC. */
  total: number
  pA: number
  pT: number
}

/**
 * Molecule counts in the sealed flask at time t. A(g) → B(g) + C(g) gives one B and one C per
 * A lost, so the molecules drawn always track the total pressure (45 per atm).
 */
export function flaskCounts(t: number): FlaskCounts {
  const pA = pressureAAt(t)
  const pT = totalPressureAt(t)
  const nA = Math.round(pA * PARTICLES_PER_ATM)
  const products = Math.round(2 * (P_I - pA) * PARTICLES_PER_ATM)
  const nB = Math.ceil(products / 2)
  const nC = products - nB
  return { nA, nB, nC, total: nA + products, pA, pT }
}

/** p_A recovered from a gauge reading with the lib's relation p_A = 2pᵢ − pₜ. */
export function pressureAFromGauge(pT: number): number {
  return partialPressureA(P_I, pT)
}
