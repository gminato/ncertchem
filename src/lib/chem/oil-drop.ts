import { ELEMENTARY_CHARGE_C } from './constants'

/**
 * Millikan's oil-drop method (NCERT Class 11, Unit 2, section 2.1.3). A drop
 * of mass m carries charge q = n e, where n is a whole number. It hangs still
 * when the electric force qE balances its weight mg, so E = mg / q.
 */

/** Gravitational acceleration near Earth's surface (m s⁻²). */
export const GRAVITY = 9.8

/** Weight of a drop of mass `massKg` (N). */
export function dropWeight(massKg: number): number {
  requirePositive(massKg, 'Mass')
  return massKg * GRAVITY
}

/** Charge (C) of a drop that carries `n` elementary charges. */
export function dropCharge(n: number): number {
  requireWhole(n)
  return n * ELEMENTARY_CHARGE_C
}

/** Field (V m⁻¹) that holds a drop of mass `massKg` with `n` charges still: E = mg / (n e). */
export function balancingField(massKg: number, n: number): number {
  return dropWeight(massKg) / dropCharge(n)
}

/**
 * Voltage (V) across plates a distance `separationM` apart that holds the drop
 * still: V = E d.
 */
export function balancingVoltage(massKg: number, n: number, separationM: number): number {
  requirePositive(separationM, 'Plate separation')
  return balancingField(massKg, n) * separationM
}

/**
 * A deterministic set of simulated drop measurements, in units of e. Each
 * value is a whole number n, shifted by a small measurement error of at most
 * 0.4 %. The site does not claim these are Millikan's data: they stand in for
 * a classroom run of the experiment. A fixed linear congruential generator keeps
 * the result identical on the server and in the browser.
 */
export function simulatedDropCharges(count = 48): number[] {
  let seed = 20260101
  const next = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    return seed / 4294967296
  }
  const values: number[] = []
  for (let i = 0; i < count; i++) {
    const n = 1 + Math.floor(next() * 5)
    const error = (next() * 2 - 1) * 0.004
    values.push(n * (1 + error))
  }
  return values
}

export interface HistogramBin {
  /** Left edge of the bin, in units of e. */
  start: number
  count: number
}

/**
 * Counts values into bins of width `binWidth` from 0 up to (not including)
 * `max`. Values outside that range are not counted.
 */
export function histogram(values: readonly number[], binWidth: number, max: number): HistogramBin[] {
  requirePositive(binWidth, 'Bin width')
  requirePositive(max, 'Maximum')
  const bins: HistogramBin[] = []
  for (let start = 0; start < max - 1e-9; start += binWidth) {
    bins.push({ start: Number(start.toFixed(6)), count: 0 })
  }
  for (const v of values) {
    if (v < 0 || v >= max) continue
    const index = Math.min(bins.length - 1, Math.floor(v / binWidth + 1e-9))
    bins[index].count += 1
  }
  return bins
}

function requirePositive(value: number, name: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${name} must be a positive finite number (received ${value})`)
  }
}

function requireWhole(n: number): void {
  if (!Number.isInteger(n) || n < 0) {
    throw new RangeError(`The number of charges must be a whole number ≥ 0 (received ${n})`)
  }
}
