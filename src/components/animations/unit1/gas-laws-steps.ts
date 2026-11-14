import { isBalanced, type Reaction } from '@/lib/chem/stoichiometry'
import { clampStepIndex } from './useStepState'

/** Number of Steps in the GasLaws Animation. */
export const GAS_LAWS_STEP_COUNT = 5

/**
 * 2 volumes of H2 react with 1 volume of O2 to give 2 volumes of H2O(g), at the same
 * temperature and pressure (Gay-Lussac's observation).
 */
export const GAS_REACTION: Reaction = {
  reactants: [
    { formula: 'H2', coeff: 2 },
    { formula: 'O2', coeff: 1 },
  ],
  products: [{ formula: 'H2O', coeff: 2 }],
}

/** Molecules drawn in each unit volume of every gas. Avogadro's law says the count is the same for all gases. */
export const MOLECULES_PER_UNIT = 2

/**
 * Target state of the animation for one Step.
 * - ratio: strength of the volume labels and the 2 : 1 : 2 banner (0 to 1).
 * - zoom: 0 shows the three gas cylinders; 1 shows the close-up of one unit volume each.
 * - split: 0 keeps every H2 and O2 whole; 1 pulls each diatomic molecule into two atoms.
 * - join: 0 keeps the atoms as they are; 1 regroups them as H2O.
 */
export interface GasLawsSnapshot {
  ratio: number
  zoom: number
  split: number
  join: number
}

export function snapshotForStep(step: number): GasLawsSnapshot {
  switch (clampStepIndex(step, GAS_LAWS_STEP_COUNT)) {
    case 0:
      return { ratio: 0, zoom: 0, split: 0, join: 0 }
    case 1:
      return { ratio: 1, zoom: 0, split: 0, join: 0 }
    case 2:
      return { ratio: 1, zoom: 1, split: 0, join: 0 }
    case 3:
      return { ratio: 1, zoom: 1, split: 1, join: 0 }
    default:
      return { ratio: 1, zoom: 1, split: 1, join: 1 }
  }
}

/** The coefficient ratio of the balanced equation, e.g. "2 : 1 : 2", which is also the volume ratio. */
export function volumeRatioText(): string {
  const coeffs = [
    ...GAS_REACTION.reactants.map((s) => s.coeff),
    ...GAS_REACTION.products.map((s) => s.coeff),
  ]
  return coeffs.join(' : ')
}

/** True when the equation is balanced, so that the volume ratio can be read off its coefficients. */
export function equationIsBalanced(): boolean {
  return isBalanced(GAS_REACTION)
}

/** Visually-hidden description of each Step, read by screen readers. */
export function stepDescription(step: number): string {
  switch (clampStepIndex(step, GAS_LAWS_STEP_COUNT)) {
    case 0:
      return 'Three gases at the same temperature and pressure: two volumes of hydrogen, one of oxygen and, once they react, two of water vapour.'
    case 1:
      return `The volumes are in the ratio ${volumeRatioText()}, the same as the coefficients of the equation.`
    case 2:
      return 'Zoomed in, each unit volume of every gas holds the same number of molecules: two.'
    case 3:
      return 'Each diatomic molecule of H2 and O2 splits into atoms, so there are twice as many hydrogen atoms as molecules.'
    default:
      return 'The atoms regroup into water. Four H2 and two O2 give four H2O: the same ratio, with no molecules left over.'
  }
}
