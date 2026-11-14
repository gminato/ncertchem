import { applyUnitFactors } from '@/lib/chem/units'

/**
 * UnitFactors: converting 2.5 hours to seconds, one unit factor at a time.
 * A unit factor such as 60 min / 1 h equals 1, so multiplying by it changes
 * the unit but not the quantity. Each Step adds one factor or cancels units.
 */

export const START_VALUE = 2.5
export const START_UNIT = 'h'
export const FACTORS = [60, 60] as const
export const UNIT_NAMES = ['min', 's'] as const

/** Running values: [2.5, 150, 9000]. Each one is the previous value times a factor. */
export const RUNNING_VALUES = applyUnitFactors(START_VALUE, FACTORS)

export interface FactorSnapshot {
  /** First unit factor (60 min / 1 h) and its result, 150 min. */
  f1: number
  /** Hours cancel: strike and fade the h in the start and the denominator. */
  c1: number
  /** Second unit factor (60 s / 1 min) and the chain that carries 150 min. */
  f2: number
  /** Minutes cancel: strike and fade the min in the chain and the denominator. */
  c2: number
  /** Final summary line. */
  fin: number
}

export interface FactorStep {
  name: string
  snapshot: FactorSnapshot
}

const HIDDEN: FactorSnapshot = { f1: 0, c1: 0, f2: 0, c2: 0, fin: 0 }

export const FACTOR_STEPS: readonly FactorStep[] = [
  { name: 'Start with the given value', snapshot: { ...HIDDEN } },
  {
    name: 'First unit factor: hours cancel',
    snapshot: { ...HIDDEN, f1: 1, c1: 1 },
  },
  {
    name: 'Second unit factor: minutes cancel',
    snapshot: { ...HIDDEN, f1: 1, c1: 1, f2: 1, c2: 1 },
  },
  {
    name: 'Only the unit has changed',
    snapshot: { f1: 1, c1: 1, f2: 1, c2: 1, fin: 1 },
  },
]

export const FACTOR_STEP_COUNT = FACTOR_STEPS.length

export function clampStep(step: number): number {
  if (!Number.isFinite(step)) return 0
  return Math.min(FACTOR_STEP_COUNT - 1, Math.max(0, Math.round(step)))
}

export function snapshotForStep(step: number): FactorSnapshot {
  return { ...FACTOR_STEPS[clampStep(step)].snapshot }
}

/** Display text for a quantity: plain digits, no separators (9000 s, not 9,000 s). */
export function quantityText(value: number): string {
  return String(value)
}
