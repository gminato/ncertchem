import { parseFormula } from '@/lib/chem/formula'
import { clampStepIndex } from './useStepState'

/** Number of Steps in the DaltonPostulates Animation: one Step per postulate. */
export const DALTON_STEP_COUNT = 4

/** The reaction shown for postulate 4: 2H2 + O2 -> 2H2O. */
export const DALTON_REACTION_TEXT = '2 H₂ + O₂ → 2 H₂O'

/**
 * Only the reaction morph (postulate 4) is animated. morph is 0 while the reactant
 * molecules are shown and 1 once the atoms have regrouped into water.
 */
export interface DaltonSnapshot {
  morph: number
}

export function snapshotForStep(step: number): DaltonSnapshot {
  return { morph: clampStepIndex(step, DALTON_STEP_COUNT) === 3 ? 1 : 0 }
}

/**
 * The ratio of atoms of two elements in a formula, as the raw counts "a : b" (not
 * reduced). For example, ratioOfAtoms('H2O', 'H', 'O') is "2 : 1" and
 * ratioOfAtoms('CO2', 'C', 'O') is "1 : 2".
 *
 * @throws {RangeError} If either element is missing from the formula
 */
export function ratioOfAtoms(formula: string, a: string, b: string): string {
  const counts = parseFormula(formula)
  const countA = counts[a]
  const countB = counts[b]
  if (countA === undefined || countB === undefined) {
    throw new RangeError(`${a} and ${b} must both appear in ${formula}`)
  }
  return `${countA} : ${countB}`
}

/** Visually-hidden description of each Step, read by screen readers. */
export function stepDescription(step: number): string {
  switch (clampStepIndex(step, DALTON_STEP_COUNT)) {
    case 0:
      return 'Matter is made of atoms: small, separate particles. Dalton took them to be indivisible, the smallest unit of an element.'
    case 1:
      return 'All atoms of one element look alike and share a mass. Atoms of different elements differ, shown here by colour and size.'
    case 2:
      return `Compounds form from atoms in a fixed whole-number ratio. Water has ${ratioOfAtoms('H2O', 'H', 'O')} for H and O; carbon dioxide has ${ratioOfAtoms('CO2', 'C', 'O')}.`
    default:
      return 'A reaction regroups atoms. The 4 H and 2 O on the left are the same 4 H and 2 O on the right, just arranged differently.'
  }
}
