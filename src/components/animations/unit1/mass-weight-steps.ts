import { roundToSigFigs } from '@/lib/chem/sigfigs'
import { G_EARTH, G_MOON, weightNewton } from '@/lib/chem/units'

/**
 * MassWeightScrolly: one object (mass fixed) measured on Earth with a balance,
 * then on the Moon with a spring scale, then both weights side by side.
 */

/** Mass of the object, in kg. It never changes between Steps. */
export const MASS_KG = 60

export const WEIGHT_EARTH_N = weightNewton(MASS_KG, G_EARTH)
export const WEIGHT_MOON_N = weightNewton(MASS_KG, G_MOON)

/** Weights to three significant figures, as displayed: "588" and "97.2". */
export const WEIGHT_EARTH_TEXT = roundToSigFigs(WEIGHT_EARTH_N, 3)
export const WEIGHT_MOON_TEXT = roundToSigFigs(WEIGHT_MOON_N, 3)

/** Spring length beyond its rest length, in SVG units per newton. */
export const PX_PER_NEWTON = 0.25
/** Rest length of the spring, in SVG units. */
export const SPRING_REST = 60

export function springStretch(weightNewtons: number): number {
  return weightNewtons * PX_PER_NEWTON
}

/** Which of the three views is on screen, as opacities that tween between Steps. */
export interface MassWeightSnapshot {
  balance: number
  moon: number
  compare: number
}

export interface MassWeightStep {
  name: string
  snapshot: MassWeightSnapshot
}

export const MASS_WEIGHT_STEPS: readonly MassWeightStep[] = [
  {
    name: 'On Earth, a balance',
    snapshot: { balance: 1, moon: 0, compare: 0 },
  },
  {
    name: 'On the Moon, a spring scale',
    snapshot: { balance: 0, moon: 1, compare: 0 },
  },
  {
    name: 'Same mass, two weights',
    snapshot: { balance: 0, moon: 0, compare: 1 },
  },
]

export const MASS_WEIGHT_STEP_COUNT = MASS_WEIGHT_STEPS.length

export function clampStep(step: number): number {
  if (!Number.isFinite(step)) return 0
  return Math.min(MASS_WEIGHT_STEP_COUNT - 1, Math.max(0, Math.round(step)))
}

export function snapshotForStep(step: number): MassWeightSnapshot {
  return { ...MASS_WEIGHT_STEPS[clampStep(step)].snapshot }
}
