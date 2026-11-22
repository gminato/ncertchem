import { twoStepSeries } from './kinetics'

/**
 * Helpers for the two-step mechanism A → I → P (rate-determining step lab).
 * The concentrations themselves come from twoStepSeries in kinetics.ts.
 */

export type SlowerStep = 'step1' | 'step2' | 'equal'

function requirePositiveRate(name: string, k: number): void {
  if (!Number.isFinite(k) || k <= 0) throw new RangeError(`${name} must be a positive finite rate constant`)
}

/** Which elementary step is slower. Equal rate constants (within a tiny tolerance) give 'equal'. */
export function slowerStep(k1: number, k2: number): SlowerStep {
  requirePositiveRate('k1', k1)
  requirePositiveRate('k2', k2)
  const scale = Math.max(k1, k2)
  if (Math.abs(k1 - k2) <= 1e-9 * scale) return 'equal'
  return k1 < k2 ? 'step1' : 'step2'
}

/**
 * Time at which [I] is largest: t_peak = ln(k2/k1)/(k2 − k1), and 1/k when k1 = k2.
 */
export function intermediatePeakTime(k1: number, k2: number): number {
  requirePositiveRate('k1', k1)
  requirePositiveRate('k2', k2)
  if (slowerStep(k1, k2) === 'equal') return 1 / k1
  return Math.log(k2 / k1) / (k2 - k1)
}

/** The largest [I] reached and the time it happens, for a start of A0 mol L⁻¹ of A. */
export function intermediatePeak(A0: number, k1: number, k2: number): { t: number; I: number } {
  const t = intermediatePeakTime(k1, k2)
  return { t, I: twoStepSeries(A0, k1, k2, t).I }
}
