import {
  averageRate,
  firstOrderConc,
  firstOrderRate,
  firstOrderTangentSlope,
  formatSci,
  formatSig,
  reactionRateToSpeciesRate,
} from '@/lib/chem/kinetics'

/**
 * Deterministic target state for each Scrolly step of Section 3.1 (Rate of a chemical reaction).
 * The component tweens the chord ends (t1, t2) from their current values, so the chord slides to
 * its new window. Every number comes from the kinetics lib, and it matches the MDX Prose.
 */

export type RateStepId = 'average' | 'shrink' | 'tangent' | 'stoichiometry' | 'units'

/** The example reaction for the curves: A → B, first order, [A]₀ = 0.100 mol L⁻¹, k = 2.00 × 10⁻³ s⁻¹. */
export const EXAMPLE_R0 = 0.1
export const EXAMPLE_K = 2.0e-3
export const EXAMPLE_T_MAX = 600

/** The stoichiometry card: 3A → 2B at a reaction rate of 2.00 × 10⁻⁴ mol L⁻¹ s⁻¹. */
export const STOICH_A = 3
export const STOICH_B = 2
export const STOICH_RATE = 2.0e-4

export interface RateStepState {
  readonly index: number
  readonly id: RateStepId
  readonly ariaLabel: string
  /** Chord ends (s), tweened by the component. Equal ends mean the chord has collapsed to the tangent point. */
  readonly t1: number
  readonly t2: number
  /** Shows the faint 200–300 s chord of Step 2. */
  readonly ghostChord: boolean
  /** Shows the tangent at 250 s instead of the chord. */
  readonly tangent: boolean
}

export const RATE_STEPS: readonly RateStepState[] = [
  {
    index: 0,
    id: 'average',
    ariaLabel: 'A falling curve of reactant A against time, a product B rising, and a chord from 0 s to 500 s whose slope is the average rate.',
    t1: 0,
    t2: 500,
    ghostChord: false,
    tangent: false,
  },
  {
    index: 1,
    id: 'shrink',
    ariaLabel: 'The same curves with two chords: a faint chord from 200 s to 300 s and a bold chord from 240 s to 260 s, which is narrower and closer to the tangent.',
    t1: 240,
    t2: 260,
    ghostChord: true,
    tangent: false,
  },
  {
    index: 2,
    id: 'tangent',
    ariaLabel: 'The tangent to the concentration curve at 250 s, whose slope is the instantaneous rate.',
    t1: 250,
    t2: 250,
    ghostChord: false,
    tangent: true,
  },
  {
    index: 3,
    id: 'stoichiometry',
    ariaLabel: 'The reaction 3A → 2B at a reaction rate of 2.00 × 10⁻⁴ mol L⁻¹ s⁻¹, with the rate of disappearance of A and the rate of appearance of B shown as multiples of it.',
    t1: 250,
    t2: 250,
    ghostChord: false,
    tangent: false,
  },
  {
    index: 4,
    id: 'units',
    ariaLabel: 'The same reaction rates with their units: mol L⁻¹ s⁻¹ for molar concentrations and atm s⁻¹ for gases.',
    t1: 250,
    t2: 250,
    ghostChord: false,
    tangent: false,
  },
]

export function getRateStepState(step: number): RateStepState {
  const i = Math.min(RATE_STEPS.length - 1, Math.max(0, Math.round(step)))
  return RATE_STEPS[i]
}

/** [A] at time t (s), first order. */
export function concA(t: number): number {
  return firstOrderConc(EXAMPLE_R0, EXAMPLE_K, t)
}

/** [B] at time t (s): the amount of A that has gone. */
export function concB(t: number): number {
  return EXAMPLE_R0 - firstOrderConc(EXAMPLE_R0, EXAMPLE_K, t)
}

/** Average rate over a window (mol L⁻¹ s⁻¹, positive). */
export function windowAverage(t1: number, t2: number): number {
  return averageRate(concA(t1), concA(t2), t1, t2)
}

/** Instantaneous rate at time t (mol L⁻¹ s⁻¹, positive). */
export function instantRate(t: number): number {
  return firstOrderRate(EXAMPLE_R0, EXAMPLE_K, t)
}

/** Slope of the tangent at time t (mol L⁻¹ s⁻¹, negative for a falling reactant). */
export function tangentSlopeAt(t: number): number {
  return firstOrderTangentSlope(EXAMPLE_R0, EXAMPLE_K, t)
}

/** Stoichiometry readouts for 3A → 2B (signed rates of change, mol L⁻¹ s⁻¹). */
export function stoichiometryRates(): { reaction: number; dA: number; dB: number } {
  return {
    reaction: STOICH_RATE,
    dA: reactionRateToSpeciesRate(STOICH_RATE, STOICH_A, 'reactant'),
    dB: reactionRateToSpeciesRate(STOICH_RATE, STOICH_B, 'product'),
  }
}

/** Readouts as display strings: 3 significant figures, U+2212 minus, superscript exponent. */
export const READOUTS = {
  avgFull: formatSci(windowAverage(0, 500), 3),
  avgShort: formatSci(windowAverage(200, 300), 3),
  avgNarrow: formatSci(windowAverage(240, 260), 3),
  instant: formatSci(instantRate(250), 3),
  tangentSlope: formatSci(tangentSlopeAt(250), 3),
  concAt500: formatSig(concA(500), 3),
  concAt250: formatSig(concA(250), 3),
  concAt0: formatSig(concA(0), 3),
  productAt500: formatSig(concB(500), 3),
  reaction: formatSci(STOICH_RATE, 3),
  dA: formatSci(-stoichiometryRates().dA, 3),
  dB: formatSci(stoichiometryRates().dB, 3),
}
