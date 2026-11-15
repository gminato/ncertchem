import { BOMB_EXAMPLE } from '@/lib/chem/calorimetry-examples'

/** Number of Steps in the bomb calorimeter Scrolly. */
export const BOMB_STEP_COUNT = 5

/** Temperature rise that fills the thermometer scale, K. Chosen so the example reads at about 70%. */
export const BOMB_SCALE_MAX_K = 3

/**
 * Target state for one Step. The Scrolly tweens `tempRise` from its live value to the target, and
 * the glow switches on or off at once.
 */
export interface BombSnapshot {
  /** Whether the reaction glows inside the bomb. */
  glow: boolean
  /** Temperature rise shown on the thermometer, K. */
  tempRise: number
}

/** Clamps a Step index to the range of the Scrolly. */
export function clampBombStep(step: number): number {
  if (!Number.isFinite(step)) return 0
  return Math.min(BOMB_STEP_COUNT - 1, Math.max(0, Math.floor(step)))
}

/** Target state for each Step: sealed and cold, ignited, warmed, then the heat balance and per-mole readings. */
export function bombSnapshotForStep(step: number): BombSnapshot {
  switch (clampBombStep(step)) {
    case 0:
      return { glow: false, tempRise: 0 }
    case 1:
      return { glow: true, tempRise: 0 }
    default:
      return { glow: true, tempRise: BOMB_EXAMPLE.deltaTK }
  }
}
