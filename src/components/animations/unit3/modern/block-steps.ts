/**
 * Step targets for the Section 3.5 and 3.6 Scrolly Animations: the blocks and the
 * metals, non-metals and metalloids. Pure functions, so every rule can be tested.
 */

import { clampStep } from './modern-steps'

export const BLOCK_STEP_COUNT = 6

/** What the block Animation highlights at each Step. */
export type BlockFocus = 'periods' | 'group-columns' | 's' | 'p' | 'd' | 'f'

export function blockFocus(step: number): BlockFocus {
  const order: BlockFocus[] = ['periods', 'group-columns', 's', 'p', 'd', 'f']
  return order[clampStep(step, BLOCK_STEP_COUNT)]
}

export const CATEGORY_STEP_COUNT = 3

export type CategoryFocus = 'metals' | 'non-metals' | 'metalloids'

export function categoryFocus(step: number): CategoryFocus {
  const order: CategoryFocus[] = ['metals', 'non-metals', 'metalloids']
  return order[clampStep(step, CATEGORY_STEP_COUNT)]
}
