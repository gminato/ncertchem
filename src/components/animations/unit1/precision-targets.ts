import { mean, spread } from '@/lib/chem/measurement'
import { roundToSigFigs } from '@/lib/chem/sigfigs'

/**
 * PrecisionAccuracy: four targets, one per Step. Each target shows four
 * readings of the same 5.00 g piece. Precision is how close the readings are
 * to each other (their spread). Accuracy is how close their mean is to the true
 * value. The dart positions are drawn by hand, in units of the target radius:
 * they show the pattern, and the numbers under each target come from the readings.
 */

/** The true mass of the piece, in grams. */
export const TRUE_MASS_G = 5.0

export interface Dart {
  /** Horizontal offset from the bullseye, in target radii. */
  x: number
  /** Vertical offset from the bullseye, in target radii (down is positive). */
  y: number
}

export interface TargetStep {
  name: string
  /** Four readings, in grams, in the order they were taken. */
  readings: readonly number[]
  /** One dart per reading, each within the unit circle. */
  darts: readonly Dart[]
}

export const TARGET_STEPS: readonly TargetStep[] = [
  {
    name: 'Precise and accurate',
    readings: [4.99, 5.01, 5.0, 5.0],
    darts: [
      { x: 0.04, y: -0.03 },
      { x: -0.05, y: 0.02 },
      { x: 0.02, y: 0.05 },
      { x: -0.02, y: -0.06 },
    ],
  },
  {
    name: 'Precise, not accurate',
    readings: [5.42, 5.44, 5.43, 5.43],
    darts: [
      { x: 0.52, y: -0.42 },
      { x: 0.58, y: -0.47 },
      { x: 0.55, y: -0.4 },
      { x: 0.6, y: -0.46 },
    ],
  },
  {
    name: 'Accurate, not precise',
    readings: [4.82, 5.2, 4.96, 5.02],
    darts: [
      { x: -0.7, y: -0.1 },
      { x: 0.6, y: 0.5 },
      { x: 0.3, y: -0.7 },
      { x: -0.2, y: 0.6 },
    ],
  },
  {
    name: 'Neither precise nor accurate',
    readings: [5.7, 4.55, 5.3, 4.85],
    darts: [
      { x: 0.8, y: -0.2 },
      { x: -0.1, y: 0.9 },
      { x: 0.5, y: 0.6 },
      { x: -0.6, y: -0.5 },
    ],
  },
]

export const TARGET_STEP_COUNT = TARGET_STEPS.length

export function clampStep(step: number): number {
  if (!Number.isFinite(step)) return 0
  return Math.min(TARGET_STEP_COUNT - 1, Math.max(0, Math.round(step)))
}

/** Mean of the readings to three significant figures, e.g. "5.00". */
export function meanText(step: TargetStep): string {
  return roundToSigFigs(mean(step.readings), 3)
}

/** Range of the readings in grams, to two decimal places (the readings have two). */
export function spreadText(step: TargetStep): string {
  return spread(step.readings).toFixed(2)
}

/** Mean dart position, in target radii. Drawn as the cross on each target. */
export function meanDart(step: TargetStep): Dart {
  return {
    x: mean(step.darts.map((d) => d.x)),
    y: mean(step.darts.map((d) => d.y)),
  }
}

/**
 * Numeric snapshot of one target for tweening: the four darts and the mean
 * cross, as x/y pairs.
 */
export function snapshotForStep(step: number): Record<string, number> {
  const target = TARGET_STEPS[clampStep(step)]
  const snapshot: Record<string, number> = {}
  target.darts.forEach((dart, i) => {
    snapshot[`d${i}x`] = dart.x
    snapshot[`d${i}y`] = dart.y
  })
  const centre = meanDart(target)
  snapshot.mx = centre.x
  snapshot.my = centre.y
  return snapshot
}
