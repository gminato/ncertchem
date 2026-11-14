/**
 * Step targets for the Unit 3 Section 3.3 Scrolly Animations. Each step names the state the
 * Animation should show. The components tween from the current state to the target, and
 * reduced motion cuts straight to it. Lengths come from PERIODIC_TABLE, never typed in.
 */

import { PERIODIC_TABLE } from '@/lib/chem/periodic-data'
import { moseleyLine } from '@/lib/chem/moseley'

// ---------------------------------------------------------------------------
// Moseley's plot (3.3)
// ---------------------------------------------------------------------------

export const MOSELEY_STEP_COUNT = 4
/** The K-alpha points shown, from Al (Z = 13) to Zn (Z = 30). */
export const MOSELEY_Z_RANGE = { min: 13, max: 30 } as const

export interface MoseleyTarget {
  /** How many of the points are visible, counted from Z = 13. */
  points: number
  /** Fraction of the line drawn, from 0 to 1. */
  lineProgress: number
  /** Whether the Z = 1 intercept is marked. */
  intercept: boolean
}

export function clampStep(step: number, count: number): number {
  if (!Number.isFinite(step)) return 0
  return Math.max(0, Math.min(count - 1, Math.floor(step)))
}

const MOSELEY_COUNT = moseleyLine(MOSELEY_Z_RANGE.min, MOSELEY_Z_RANGE.max).length

export function moseleyTarget(step: number): MoseleyTarget {
  const s = clampStep(step, MOSELEY_STEP_COUNT)
  switch (s) {
    case 0:
      return { points: 0, lineProgress: 0, intercept: false }
    case 1:
      return { points: MOSELEY_COUNT, lineProgress: 0, intercept: false }
    case 2:
      return { points: MOSELEY_COUNT, lineProgress: 1, intercept: false }
    default:
      return { points: MOSELEY_COUNT, lineProgress: 1, intercept: true }
  }
}

// ---------------------------------------------------------------------------
// Long form, periods then groups (3.3)
// ---------------------------------------------------------------------------

export const LONG_FORM_STEP_COUNT = 6
export const PERIOD_COUNT = 7

export interface LongFormTarget {
  /** Periods 1 to periodsLit are lit. Zero lights nothing. */
  periodsLit: number
  /** Groups 1 to groupsLit are lit as columns. Zero lights no columns. */
  groupsLit: number
}

export function longFormTarget(step: number): LongFormTarget {
  const s = clampStep(step, LONG_FORM_STEP_COUNT)
  const periodsByStep = [0, 2, 4, 6, 7, 7]
  return {
    periodsLit: periodsByStep[s],
    groupsLit: s === LONG_FORM_STEP_COUNT - 1 ? 18 : 0,
  }
}

/** Number of elements in period p, counting lanthanoids and actinoids in their own period. */
export function periodLength(period: number): number {
  return PERIODIC_TABLE.filter((e) => e.period === period).length
}

/** Running total of elements in periods 1 to p: the counter the Animation shows. */
export function elementsThroughPeriod(period: number): number {
  let total = 0
  for (let p = 1; p <= period; p++) total += periodLength(p)
  return total
}
