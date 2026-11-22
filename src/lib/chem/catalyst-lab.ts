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

/** Second hump of the catalysed route sits this far below the first (drawing only; not a quoted number). */
export const SECOND_HUMP_DIP_KJ = 4

/** Knots of the uncatalysed route: reactants, one activated complex, products. */
export function uncatalysedKnots(input: CatalystLabInput): Array<[number, number]> {
  return [
    [0, 0],
    [0.5, input.eaUncatKJ],
    [1, input.dHKJ],
  ]
}

/** Knots of the catalysed route: two humps (the first is the catalysed Eₐ) with an intermediate valley. */
export function catalysedKnots(input: CatalystLabInput): Array<[number, number]> {
  const peak = input.eaUncatKJ - input.loweringKJ
  return [
    [0, 0],
    [0.25, peak],
    [0.5, input.dHKJ / 2],
    [0.75, peak - SECOND_HUMP_DIP_KJ],
    [1, input.dHKJ],
  ]
}
