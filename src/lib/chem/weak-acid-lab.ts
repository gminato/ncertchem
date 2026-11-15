/**
 * Weak acid and weak base reports for the Unit 6 weak-acid lab and Scrolly (NCERT Sections 6.11.3,
 * 6.11.4 and 6.11.6). Every number comes from acid-base.ts: the exact quadratic is taken from there,
 * and the approximation x = √(Ka·c) is computed here so the lab can show where it fails.
 */

import { kw, polyprotic, weakAcid, weakBase } from './acid-base'

/** The approximation x ≪ c is accepted while the approximate ionised fraction is below 5 %. */
export const APPROXIMATION_LIMIT = 0.05

/** Equilibrium amounts for HA ⇌ H₃O⁺ + A⁻ (ICE table of Section 6.11.3), in mol L⁻¹. */
export interface WeakAcidIce {
  initial: { HA: number; H3O: number; A: number }
  change: { HA: number; H3O: number; A: number }
  equilibrium: { HA: number; H3O: number; A: number }
}

/** A weak acid at one concentration, solved exactly and approximately. */
export interface WeakAcidReport {
  c: number
  ka: number
  pKa: number
  /** Exact ionised fraction α from the quadratic (acid-base.ts weakAcid). */
  alpha: number
  /** Exact [H₃O⁺] in mol L⁻¹. */
  hConc: number
  /** Exact pH. */
  pH: number
  /** Approximate [H₃O⁺] = √(Ka·c), valid when x ≪ c. */
  hApprox: number
  /** Approximate pH = −log₁₀ √(Ka·c). */
  pHApprox: number
  /** Approximate ionised fraction √(Ka/c). The approximation holds while this is below 5 %. */
  alphaApprox: number
  /** True while the approximation is within its 5 % limit. */
  approximationHolds: boolean
  /** Exact pH minus approximate pH. */
  pHError: number
  ice: WeakAcidIce
}

/**
 * Solves a weak acid of concentration c and Ka with the library's exact quadratic and gives the
 * approximate √(Ka·c) result beside it.
 *
 * @throws {RangeError} If c or Ka is not positive
 */
export function weakAcidReport(c: number, ka: number): WeakAcidReport {
  const exact = weakAcid(c, ka)
  const hApprox = Math.sqrt(ka * c)
  const alphaApprox = Math.sqrt(ka / c)
  const x = exact.hConc
  return {
    c,
    ka,
    pKa: -Math.log10(ka),
    alpha: exact.alpha,
    hConc: x,
    pH: exact.pH,
    hApprox,
    pHApprox: -Math.log10(hApprox),
    alphaApprox,
    approximationHolds: alphaApprox < APPROXIMATION_LIMIT,
    pHError: exact.pH + Math.log10(hApprox),
    ice: {
      initial: { HA: c, H3O: 0, A: 0 },
      change: { HA: -x, H3O: x, A: x },
      equilibrium: { HA: c - x, H3O: x, A: x },
    },
  }
}

/** A weak base at one concentration: the same comparison, with [OH⁻] and pH. */
export interface WeakBaseReport {
  c: number
  kb: number
  pKb: number
  alpha: number
  ohConc: number
  pH: number
  ohApprox: number
  pHApprox: number
  alphaApprox: number
  approximationHolds: boolean
  pHError: number
}

/**
 * Solves a weak base B of concentration c and Kb with the library's quadratic, and gives the
 * approximate √(Kb·c) result beside it.
 *
 * @throws {RangeError} If c or Kb is not positive
 */
export function weakBaseReport(c: number, kb: number): WeakBaseReport {
  const exact = weakBase(c, kb)
  const ohApprox = Math.sqrt(kb * c)
  const alphaApprox = Math.sqrt(kb / c)
  const pHApprox = -Math.log10(kw() / ohApprox)
  return {
    c,
    kb,
    pKb: -Math.log10(kb),
    alpha: exact.alpha,
    ohConc: exact.ohConc,
    pH: exact.pH,
    ohApprox,
    pHApprox,
    alphaApprox,
    approximationHolds: alphaApprox < APPROXIMATION_LIMIT,
    pHError: exact.pH - pHApprox,
  }
}

/** Species fractions of a polyprotic acid at one pH: index i is the number of protons removed. */
export interface PolyproticPoint {
  pH: number
  fractions: number[]
}

/**
 * Samples the species fractions of a polyprotic acid from pHMin to pHMax (inclusive) in equal steps.
 * Each point holds one fraction per species, H_nA first and Aⁿ⁻ last.
 *
 * @throws {RangeError} If the list is empty, a constant is not positive, or the range or step count is invalid
 */
export function polyproticCurve(kas: readonly number[], pHMin: number, pHMax: number, samples: number): PolyproticPoint[] {
  if (!(samples >= 2) || !(pHMax > pHMin)) throw new RangeError('The pH range needs a maximum above the minimum and at least two samples')
  const points: PolyproticPoint[] = []
  for (let i = 0; i < samples; i++) {
    const pHValue = pHMin + ((pHMax - pHMin) * i) / (samples - 1)
    points.push({ pH: pHValue, fractions: polyprotic(pHValue, kas) })
  }
  return points
}


/** One point of the pH against log₁₀ c curve: exact pH and the √(K·c) approximation beside it. */
export interface WeakPHCurvePoint {
  logC: number
  pH: number
  pHApprox: number
}

/**
 * pH of a weak acid (Ka) or weak base (Kb) across a range of log₁₀ c, for the lab's curve. The exact
 * pH comes from the quadratic; the approximate pH uses √(K·c). Both are evaluated at equal steps of log c.
 *
 * @throws {RangeError} If K is not positive, the range is empty, or fewer than two samples are asked for
 */
export function weakPHCurve(kind: 'acid' | 'base', k: number, logCMin: number, logCMax: number, samples: number): WeakPHCurvePoint[] {
  if (!(k > 0)) throw new RangeError('The constant must be positive')
  if (!(samples >= 2) || !(logCMax > logCMin)) throw new RangeError('The log c range needs a maximum above the minimum and at least two samples')
  const points: WeakPHCurvePoint[] = []
  for (let i = 0; i < samples; i++) {
    const logC = logCMin + ((logCMax - logCMin) * i) / (samples - 1)
    const c = 10 ** logC
    if (kind === 'acid') {
      const r = weakAcidReport(c, k)
      points.push({ logC, pH: r.pH, pHApprox: r.pHApprox })
    } else {
      const r = weakBaseReport(c, k)
      points.push({ logC, pH: r.pH, pHApprox: r.pHApprox })
    }
  }
  return points
}
