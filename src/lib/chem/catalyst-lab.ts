// Model for the Catalyst Lab (Class 12 Unit 3, Section 3.4.1).
// Every number comes from kinetics.ts. The equilibrium constant K = k_f / k_b is not a lib function,
// so K is computed here from the same Arrhenius form for both directions (one shared pre-exponential factor).

import {
  arrheniusK,
  backwardBarrier,
  catalystRateEnhancement,
  jPerMolToKJPerMol,
  kJPerMolToJPerMol,
} from './kinetics'

/** Pre-exponential factor used for BOTH directions (s⁻¹). Its value cancels in K; it only sets the scale of k. */
export const LAB_PRE_EXPONENTIAL = 1.0e13

export interface CatalystLabInput {
  /** Forward Eₐ without a catalyst, kJ mol⁻¹. */
  eaUncatKJ: number
  /** How far the catalyst lowers the forward and the backward barrier, kJ mol⁻¹ (the same amount in both). */
  loweringKJ: number
  /** ΔrH of the reaction, kJ mol⁻¹. */
  dHKJ: number
  tempK: number
}

export interface CatalystLabResult {
  eaFwdUncatKJ: number
  eaFwdCatKJ: number
  eaBackUncatKJ: number
  eaBackCatKJ: number
  /** k_catalysed / k_uncatalysed, forward and backward (equal). */
  enhancementForward: number
  enhancementBackward: number
  kFwdUncat: number
  kBackUncat: number
  kFwdCat: number
  kBackCat: number
  /** K = k_f / k_b without and with the catalyst. */
  kEqUncat: number
  kEqCat: number
}

/** Forward and backward rate constants from Arrhenius, with one shared A. Ea values in J mol⁻¹. */
function pairOfRateConstants(eaFwdJ: number, eaBackJ: number, tempK: number): { kf: number; kb: number } {
  return {
    kf: arrheniusK(LAB_PRE_EXPONENTIAL, eaFwdJ, tempK),
    kb: arrheniusK(LAB_PRE_EXPONENTIAL, eaBackJ, tempK),
  }
}

export function catalystLab(input: CatalystLabInput): CatalystLabResult {
  const { eaUncatKJ, loweringKJ, dHKJ, tempK } = input
  const dH = kJPerMolToJPerMol(dHKJ)
  const eaFwdUncat = kJPerMolToJPerMol(eaUncatKJ)
  const eaFwdCat = eaFwdUncat - kJPerMolToJPerMol(loweringKJ)
  const eaBackUncat = backwardBarrier(eaFwdUncat, dH)
  const eaBackCat = backwardBarrier(eaFwdCat, dH)

  const uncat = pairOfRateConstants(eaFwdUncat, eaBackUncat, tempK)
  const cat = pairOfRateConstants(eaFwdCat, eaBackCat, tempK)

  return {
    eaFwdUncatKJ: eaUncatKJ,
    eaFwdCatKJ: jPerMolToKJPerMol(eaFwdCat),
    eaBackUncatKJ: jPerMolToKJPerMol(eaBackUncat),
    eaBackCatKJ: jPerMolToKJPerMol(eaBackCat),
    enhancementForward: catalystRateEnhancement(eaFwdUncat, eaFwdCat, tempK),
    enhancementBackward: catalystRateEnhancement(eaBackUncat, eaBackCat, tempK),
    kFwdUncat: uncat.kf,
    kBackUncat: uncat.kb,
    kFwdCat: cat.kf,
    kBackCat: cat.kb,
    kEqUncat: uncat.kf / uncat.kb,
    kEqCat: cat.kf / cat.kb,
  }
}

/** True when the catalyst leaves K unchanged, to a relative tolerance far below any displayed digit. */
export function equilibriumUnchanged(r: CatalystLabResult, relTol = 1e-9): boolean {
  return Math.abs(r.kEqCat / r.kEqUncat - 1) < relTol
}

/**
 * A smooth path through the knots (x in [0, 1], energy in kJ mol⁻¹). Each stretch between two knots is a
 * half-cosine, so the path is flat at every knot: peaks and valleys sit exactly on the knot energies.
 */
export function cosinePath(knots: ReadonlyArray<readonly [number, number]>, perSegment = 32): Array<[number, number]> {
  const out: Array<[number, number]> = []
  for (let s = 0; s < knots.length - 1; s++) {
    const [x0, e0] = knots[s]
    const [x1, e1] = knots[s + 1]
    for (let i = 0; i < perSegment; i++) {
      const u = i / perSegment
      const ease = (1 - Math.cos(Math.PI * u)) / 2
      out.push([x0 + (x1 - x0) * u, e0 + (e1 - e0) * ease])
    }
  }
  const [xLast, eLast] = knots[knots.length - 1]
  out.push([xLast, eLast])
  return out
}

/** Knots of the uncatalysed route: reactants, one activated complex, products. */
export function uncatalysedKnots(input: CatalystLabInput): Array<[number, number]> {
  return [
    [0, 0],
    [0.5, input.eaUncatKJ],
    [1, input.dHKJ],
  ]
}

/** Gap (kJ mol⁻¹) kept between neighbouring knots of the catalysed route (drawing only). */
export const CAT_KNOT_GAP_KJ = 2

/** Scrolly proportions of the catalysed route: first hump 30 and valley 15 for a 50 kJ mol⁻¹ barrier. */
export const CAT_FIRST_HUMP_FRACTION = 0.6
export const CAT_VALLEY_FRACTION = 0.3

function clamp(x: number, lo: number, hi: number): number {
  return Math.min(Math.max(x, lo), hi)
}

/**
 * Knots of the catalysed route: a first, lower hump, a valley (the intermediate complex), then the second
 * hump, which is the labelled catalysed barrier Eₐ − lowering. The valley stays above both end levels
 * (reactant 0 and products ΔrH) and the first hump stays below the second, at every slider setting.
 */
export function catalysedKnots(input: CatalystLabInput): Array<[number, number]> {
  const barrier = input.eaUncatKJ - input.loweringKJ
  const floor = Math.max(0, input.dHKJ)
  const valley = clamp(CAT_VALLEY_FRACTION * barrier, floor + CAT_KNOT_GAP_KJ, barrier - 2 * CAT_KNOT_GAP_KJ)
  const firstHump = clamp(CAT_FIRST_HUMP_FRACTION * barrier, valley + CAT_KNOT_GAP_KJ, barrier - CAT_KNOT_GAP_KJ)
  return [
    [0, 0],
    [0.25, firstHump],
    [0.5, valley],
    [0.75, barrier],
    [1, input.dHKJ],
  ]
}
