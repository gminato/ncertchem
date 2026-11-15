import { adiabaticDeltaU } from '@/lib/chem/thermo-first-law'
import { clampIndex } from './useTweenedSnapshot'

/** Number of Steps in the Joule Scrolly. */
export const JOULE_STEP_COUNT = 5

/** Work done in each experiment, J. A worked number of this Section's own, not NCERT's 1 kJ. */
export const JOULE_WORK_J = 750

/** Thermometer levels (fraction of the stem) for the start state A and the end state B. */
export const JOULE_LEVEL_A = 0.3
export const JOULE_LEVEL_B = 0.56

/** Paddle angle, radians. Three and a half turns, reached at Step 1 and held after that. */
const SPIN_FORWARD = 3 * Math.PI

/** Piston position of the insulated gas: small volume before Step 4, large volume at Step 4. */
const PISTON_BEFORE = 0.35
const PISTON_AFTER = 0.8

/**
 * The state of the Joule Scrolly at one Step. The left vessel is churned by a paddle wheel
 * (mechanical work on the water). The right vessel is heated by an immersion rod (electrical work).
 * Each takes in the same work, 750 J, and reaches the same thermometer reading. At Step 4 the left
 * side becomes an insulated gas in a piston, which expands and does 750 J of work on its
 * surroundings, so its energy falls by the same amount.
 */
export type JouleSnapshot = {
  /** Left thermometer level (state A at JOULE_LEVEL_A, state B at JOULE_LEVEL_B). */
  leftLevel: number
  /** Paddle angle, radians. Only the rotation matters, so it grows monotonically going forwards. */
  spin: number
  /** Work arrow on the left: +1 work done on the system, −1 work done by it, 0 none. */
  leftArrow: number
  /** Right thermometer level. */
  rightLevel: number
  /** How far the rod is in the water, 0 (out) to 1 (in). */
  rodDepth: number
  /** Work arrow on the rod: +1 when electrical work is supplied, 0 otherwise. */
  rightArrow: number
  /** Gas piston position on the left at Step 4, 0 (fully in) to 1 (fully out). */
  pistonPos: number
}

/** Target state for each Step. */
export function jouleSnapshotForStep(step: number): JouleSnapshot {
  switch (clampIndex(step, JOULE_STEP_COUNT)) {
    case 0:
      return {
        leftLevel: JOULE_LEVEL_A,
        spin: 0,
        leftArrow: 0,
        rightLevel: JOULE_LEVEL_A,
        rodDepth: 0,
        rightArrow: 0,
        pistonPos: PISTON_BEFORE,
      }
    case 1:
      return {
        leftLevel: JOULE_LEVEL_B,
        spin: SPIN_FORWARD,
        leftArrow: 1,
        rightLevel: JOULE_LEVEL_A,
        rodDepth: 0,
        rightArrow: 0,
        pistonPos: PISTON_BEFORE,
      }
    case 2:
      return {
        leftLevel: JOULE_LEVEL_B,
        spin: SPIN_FORWARD,
        leftArrow: 0,
        rightLevel: JOULE_LEVEL_B,
        rodDepth: 1,
        rightArrow: 1,
        pistonPos: PISTON_BEFORE,
      }
    case 3:
      return {
        leftLevel: JOULE_LEVEL_B,
        spin: SPIN_FORWARD,
        leftArrow: 0,
        rightLevel: JOULE_LEVEL_B,
        rodDepth: 1,
        rightArrow: 0,
        pistonPos: PISTON_BEFORE,
      }
    default:
      // The insulated gas expands: the piston moves out, the work is done by the gas (w < 0), and
      // the gas cools back to state A.
      return {
        leftLevel: JOULE_LEVEL_A,
        spin: SPIN_FORWARD,
        leftArrow: -1,
        rightLevel: JOULE_LEVEL_B,
        rodDepth: 1,
        rightArrow: 0,
        pistonPos: PISTON_AFTER,
      }
  }
}

/** Work and ΔU on each side at one Step, in J, with the IUPAC signs. */
export interface JouleLedger {
  leftWJ: number
  leftDeltaUJ: number
  rightWJ: number
  rightDeltaUJ: number
}

/**
 * The ledger for each side. With the walls adiabatic, q = 0 and ΔU = w_ad (Section 5.1.4(a)). At
 * Step 4 the gas does 750 J of work on its surroundings, so w_ad = −750 J and ΔU = −750 J.
 */
export function jouleLedgerForStep(step: number): JouleLedger {
  const s = clampIndex(step, JOULE_STEP_COUNT)
  const leftW = s === 0 ? 0 : s === 4 ? -JOULE_WORK_J : JOULE_WORK_J
  const rightW = s >= 2 ? JOULE_WORK_J : 0
  return {
    leftWJ: leftW,
    leftDeltaUJ: adiabaticDeltaU(leftW),
    rightWJ: rightW,
    rightDeltaUJ: adiabaticDeltaU(rightW),
  }
}

/** A signed value in J with the U+2212 minus sign, e.g. "+750 J" or "−750 J". */
export function formatSignedJoule(value: number): string {
  if (value === 0) return '0 J'
  const sign = value > 0 ? '+' : '−'
  return `${sign}${Math.abs(value).toFixed(0)} J`
}
