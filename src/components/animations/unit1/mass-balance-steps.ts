import { parseFormula } from '@/lib/chem/formula'
import { sideMass, type EquationSpecies } from '@/lib/chem/combination'
import { clampStepIndex } from './useStepState'

/** Number of Steps in the MassBalance Animation. */
export const MASS_BALANCE_STEP_COUNT = 4

/** The reaction in the sealed flask: 2H2 + O2 -> 2H2O. */
export const MASS_BALANCE_REACTANTS: EquationSpecies[] = [
  { formula: 'H2', coeff: 2 },
  { formula: 'O2', coeff: 1 },
]
export const MASS_BALANCE_PRODUCTS: EquationSpecies[] = [{ formula: 'H2O', coeff: 2 }]

/**
 * Target state of the animation for one Step.
 * - progress: how far the reaction has run inside the flask, 0 to 1.
 * - readout: how far the "change in mass" line has faded in, 0 to 1.
 * - tally: how far the atom count line has faded in, 0 to 1.
 */
export interface MassBalanceSnapshot {
  progress: number
  readout: number
  tally: number
}

export function snapshotForStep(step: number): MassBalanceSnapshot {
  switch (clampStepIndex(step, MASS_BALANCE_STEP_COUNT)) {
    case 0:
      return { progress: 0, readout: 0, tally: 0 }
    case 1:
      return { progress: 1, readout: 0, tally: 0 }
    case 2:
      return { progress: 1, readout: 1, tally: 0 }
    default:
      return { progress: 1, readout: 1, tally: 1 }
  }
}

/** Mass of the reactants, in g, as a two-decimal string (36.03). */
export function massReadout(): string {
  return sideMass(MASS_BALANCE_REACTANTS).toFixed(2)
}

/** Absolute change in mass across the reaction, in g, as a two-decimal string. */
export function massChangeReadout(): string {
  const change = sideMass(MASS_BALANCE_PRODUCTS) - sideMass(MASS_BALANCE_REACTANTS)
  return Math.abs(change).toFixed(2)
}

/** Atoms of each element on one side of the equation, e.g. { H: 4, O: 2 }. */
export function atomTotals(species: readonly EquationSpecies[]): Record<string, number> {
  const totals: Record<string, number> = {}
  for (const { formula, coeff } of species) {
    const counts = parseFormula(formula)
    for (const symbol of Object.keys(counts)) {
      totals[symbol] = (totals[symbol] ?? 0) + counts[symbol] * coeff
    }
  }
  return totals
}

/** Visually-hidden description of each Step, read by screen readers. */
export function stepDescription(step: number): string {
  switch (clampStepIndex(step, MASS_BALANCE_STEP_COUNT)) {
    case 0:
      return `A sealed flask holds 2 H₂ and 1 O₂, and the weights on the other pan balance it at ${massReadout()} g.`
    case 1:
      return 'The reaction runs inside the sealed flask. Hydrogen and oxygen atoms regroup into water, and nothing leaves the flask.'
    case 2:
      return `The flask now holds 2 H₂O. The pan is still level: the change in mass is ${massChangeReadout()} g.`
    default:
      return 'Counting atoms: 4 H and 2 O before, 4 H and 2 O after. Matter is neither created nor destroyed.'
  }
}
