/**
 * The steps of the Markovnikov Scrolly: HBr added to propene, first by the ionic route (the 2° and
 * 1° carbocations, then the major product), and last by the peroxide (free-radical) route. Each step
 * is a fixed target for the AdditionMechanism drawing. Only the progress is tweened; the mode and the
 * branch switch at once. The chemistry (the products) is drawn by the component from the lib's names
 * and does not live here.
 */

import type { AdditionBranch, AdditionMode, RadicalStep } from '@/components/organic'

export interface MarkovnikovTarget {
  mode: AdditionMode
  branch: AdditionBranch
  step: RadicalStep
  /** 0 to 1: how far the ionic stages have been drawn (stages 1, 2 and 3 are reached at 1/3, 2/3 and 1). */
  progress: number
}

export const MARKOVNIKOV_STEP_COUNT = 5

const TARGETS: readonly MarkovnikovTarget[] = [
  { mode: 'ionic', branch: 'major', step: 'peroxide', progress: 0.2 },
  { mode: 'ionic', branch: 'major', step: 'peroxide', progress: 0.55 },
  { mode: 'ionic', branch: 'minor', step: 'peroxide', progress: 0.55 },
  { mode: 'ionic', branch: 'major', step: 'peroxide', progress: 1 },
  { mode: 'radical', branch: 'major', step: 'peroxide', progress: 1 },
]

/** The target state of one Scrolly Step (0 to MARKOVNIKOV_STEP_COUNT - 1), clamped to the range. */
export function markovnikovStep(step: number): MarkovnikovTarget {
  const index = Math.min(MARKOVNIKOV_STEP_COUNT - 1, Math.max(0, Math.round(step)))
  return TARGETS[index]
}
