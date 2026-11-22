import { formatSig, zeroOrderConc, zeroOrderK, zeroOrderTimeToZero } from '@/lib/chem/kinetics'

/**
 * Deterministic target state for each Scrolly step of Section 3.3.1 (zero-order integrated rate
 * equation). The component tweens the numeric targets from their current values; the discrete
 * targets (gas molecules, occupied sites) switch at once. Every number comes from the kinetics lib
 * and matches the Prose: [R]₀ = 0.80 mol L⁻¹, k = 0.025 mol L⁻¹ s⁻¹.
 */

export const R0 = 0.8
export const K = 0.025
/** Time at which the ideal straight line reaches zero (lib: [R]₀ / k). */
export const T_ZERO = zeroOrderTimeToZero(R0, K)
/** Time after which the real curve leaves the ideal line (schematic; the drawing only). */
export const T_BEND = 20
/** Sites on the platinum strip. */
export const SITE_COUNT = 9

export type ZeroOrderStepId = 'crowded-surface' | 'gas-thins' | 'straight-line' | 'two-points' | 'sites-empty'

export interface ZeroOrderStepState {
  readonly index: number
  readonly id: ZeroOrderStepId
  /** Molecules of NH₃ drawn in the gas above the surface (discrete). */
  readonly gas: number
  /** One entry per site, left to right: true when an NH₃ molecule is bound (discrete). */
  readonly occupied: readonly boolean[]
  /** Fraction of the ideal line drawn, 0 to 1 (tweened). */
  readonly lineReveal: number
  /** Fraction of the real (bending) curve drawn, 0 to 1 (tweened). */
  readonly curveReveal: number
  /** Length of the rate arrow as a fraction of its full length (tweened). */
  readonly rateLength: number
  /** Points at t = 0 and t = 12 s are shown. */
  readonly firstPoints: boolean
  /** Slope triangle on the ideal line. */
  readonly slopeTriangle: boolean
  /** Drop-lines from the two points that give k. */
  readonly guides: boolean
  /** Readout line under the surface. */
  readonly readout: string
  readonly title: string
  readonly ariaLabel: string
}

const ALL_FULL = Array.from({ length: SITE_COUNT }, () => true)
const HALF_BARE = [true, false, true, true, false, false, true, false, true]

export const ZERO_ORDER_STEP_COUNT = 5

/** The ideal straight line, ([R]₀ − kt), as the lib computes it. */
export function idealConc(t: number): number {
  return zeroOrderConc(R0, K, t)
}

/**
 * The real curve, schematic: it follows the ideal line to T_BEND, then bends towards zero with
 * the same initial slope, so it leaves the line smoothly. Used only for the drawing.
 */
export function realConc(t: number): number {
  if (t <= T_BEND) return idealConc(t)
  const rb = idealConc(T_BEND)
  const kPrime = K / rb
  return rb * Math.exp(-kPrime * (t - T_BEND))
}

const T_TWO = 12
const R_TWO = zeroOrderConc(R0, K, T_TWO)
const DROP = R0 - R_TWO
const K_FROM_TWO = zeroOrderK(R0, R_TWO, T_TWO)

const STEP_TEXT: readonly { id: ZeroOrderStepId; title: string; readout: string; aria: string; gas: number; occupied: readonly boolean[]; lineReveal: number; curveReveal: number; rateLength: number; firstPoints: boolean; slopeTriangle: boolean; guides: boolean }[] = [
  {
    id: 'crowded-surface',
    title: 'A crowded surface',
    readout: `Rate = ${formatSig(K, 2)} mol L⁻¹ s⁻¹, set by the busy sites`,
    aria: 'Platinum surface with every site holding an ammonia molecule and a dense gas above it. The rate arrow is full length.',
    gas: 14,
    occupied: ALL_FULL,
    lineReveal: 0,
    curveReveal: 0,
    rateLength: 1,
    firstPoints: false,
    slopeTriangle: false,
    guides: false,
  },
  {
    id: 'gas-thins',
    title: 'The gas thins, the rate does not',
    readout: `Rate = ${formatSig(K, 2)} mol L⁻¹ s⁻¹, still the same`,
    aria: 'Fewer ammonia molecules hover above a surface whose sites are still all full. The rate arrow keeps its length. Two points of the plot are shown at t = 0 and 12 s.',
    gas: 6,
    occupied: ALL_FULL,
    lineReveal: 0,
    curveReveal: 0,
    rateLength: 1,
    firstPoints: true,
    slopeTriangle: false,
    guides: false,
  },
  {
    id: 'straight-line',
    title: 'The straight-line plot',
    readout: `Slope = −k = −${formatSig(K, 2)} mol L⁻¹ s⁻¹`,
    aria: 'Concentration against time falls along one straight dashed line from 0.80 mol per litre, with a slope triangle showing the fall per second.',
    gas: 6,
    occupied: ALL_FULL,
    lineReveal: 1,
    curveReveal: 0,
    rateLength: 1,
    firstPoints: true,
    slopeTriangle: true,
    guides: false,
  },
  {
    id: 'two-points',
    title: 'Two points give k',
    readout: `k = (${formatSig(R0, 2)} − ${formatSig(R_TWO, 2)}) ÷ ${T_TWO} s = ${formatSig(K_FROM_TWO, 2)} mol L⁻¹ s⁻¹`,
    aria: `Drop-lines from t = 0 and t = 12 seconds. The fall of ${formatSig(DROP, 2)} mol per litre over 12 seconds gives k.`,
    gas: 6,
    occupied: ALL_FULL,
    lineReveal: 1,
    curveReveal: 0,
    rateLength: 1,
    firstPoints: true,
    slopeTriangle: true,
    guides: true,
  },
  {
    id: 'sites-empty',
    title: 'When the sites empty',
    readout: `Ideal line ends at ${T_ZERO} s; the real curve bends before it`,
    aria: 'Few gas molecules remain and about half the sites are bare. The real curve leaves the dashed ideal line and bends towards zero. The rate arrow is shorter.',
    gas: 3,
    occupied: HALF_BARE,
    lineReveal: 1,
    curveReveal: 1,
    rateLength: 0.55,
    firstPoints: true,
    slopeTriangle: false,
    guides: false,
  },
]

export function getZeroOrderStepState(step: number): ZeroOrderStepState {
  const index = Math.min(ZERO_ORDER_STEP_COUNT - 1, Math.max(0, Math.round(Number.isFinite(step) ? step : 0)))
  const s = STEP_TEXT[index]
  return {
    index,
    id: s.id,
    gas: s.gas,
    occupied: s.occupied,
    lineReveal: s.lineReveal,
    curveReveal: s.curveReveal,
    rateLength: s.rateLength,
    firstPoints: s.firstPoints,
    slopeTriangle: s.slopeTriangle,
    guides: s.guides,
    readout: s.readout,
    title: s.title,
    ariaLabel: s.aria,
  }
}
