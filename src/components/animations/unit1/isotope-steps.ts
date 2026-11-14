import { CHLORINE_ISOTOPES, averageAtomicMass, fractionAcrossIsotopes } from '@/lib/chem/atomic-mass'
import { clampStepIndex } from './useStepState'

/** Number of Steps in the IsotopeSeesaw Animation. */
export const ISOTOPE_STEP_COUNT = 4

/** Atoms drawn in the abundance grid: 100, so that one dot stands for one per cent of atoms. */
export const ABUNDANCE_DOTS = 100

/** Number of dots that are 35Cl (75.77 % of atoms, shown rounded to the nearest whole dot). */
export const LIGHT_DOTS = Math.round(CHLORINE_ISOTOPES[0].abundancePercent)

/**
 * The seesaw pivot, as a fraction of the way from 35Cl to 37Cl. Step 0 leaves it at
 * the midpoint, where the plank tips towards the heavier-abundance end. Steps 1 to 3
 * place it at the abundance-weighted average, where the plank is level.
 */
export interface IsotopeSnapshot {
  pivot: number
}

const MIDPOINT_PIVOT = 0.5
const AVERAGE_PIVOT = fractionAcrossIsotopes(CHLORINE_ISOTOPES, averageAtomicMass(CHLORINE_ISOTOPES))

export function snapshotForStep(step: number): IsotopeSnapshot {
  return { pivot: clampStepIndex(step, ISOTOPE_STEP_COUNT) === 0 ? MIDPOINT_PIVOT : AVERAGE_PIVOT }
}

/** Average atomic mass of chlorine in u, to two decimals (35.45). */
export function averageText(): string {
  return averageAtomicMass(CHLORINE_ISOTOPES).toFixed(2)
}

/**
 * The three terms of the weighted sum, each as abundance × mass to three decimals,
 * plus their sum. The terms are rounded before adding, so the sum shown is their sum.
 */
export function weightedTerms(): { label: string; term: string }[] {
  return CHLORINE_ISOTOPES.map((isotope) => {
    const product = (isotope.abundancePercent / 100) * isotope.massU
    return {
      label: `${(isotope.abundancePercent / 100).toFixed(4)} × ${isotope.massU} u`,
      term: product.toFixed(3),
    }
  })
}

/** The sum of the rounded terms, to three decimals (35.453). */
export function weightedSumText(): string {
  const sum = CHLORINE_ISOTOPES.reduce((total, isotope) => {
    return total + Number(((isotope.abundancePercent / 100) * isotope.massU).toFixed(3))
  }, 0)
  return sum.toFixed(3)
}

/** Position of the average on the mass axis, 0 at 35Cl and 1 at 37Cl. */
export function averagePivot(): number {
  return AVERAGE_PIVOT
}

/** Visually-hidden description of each Step, read by screen readers. */
export function stepDescription(step: number): string {
  switch (clampStepIndex(step, ISOTOPE_STEP_COUNT)) {
    case 0:
      return `Chlorine has two isotopes. Of every 100 atoms, about ${LIGHT_DOTS} are ³⁵Cl, and the rest are the heavier ³⁷Cl.`
    case 1:
      return `Think of the two isotopes as weights on a seesaw. The pivot slides to the point where the plank balances, at ${averageText()} u.`
    case 2:
      return `The average is the abundance-weighted sum: ${weightedTerms()[0].term} u from ³⁵Cl plus ${weightedTerms()[1].term} u from ³⁷Cl, which is ${weightedSumText()} u.`
    default:
      return `The average atomic mass of chlorine is ${averageText()} u. Textbooks round it to 35.5 u.`
  }
}
