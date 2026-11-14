import { ELEMENTS } from './elements'
import { molarMass, parseFormula } from './formula'

/** One species in a balanced equation, with its coefficient. */
export interface EquationSpecies {
  formula: string
  coeff: number
}

/**
 * Mass of one side of an equation, in g: the sum of coeff × molar mass. By the law of
 * conservation of mass, both sides of a balanced equation give the same value.
 *
 * @throws {RangeError} On an invalid formula or a coefficient below 1
 */
export function sideMass(species: readonly EquationSpecies[]): number {
  let total = 0
  for (const { formula, coeff } of species) {
    if (!Number.isInteger(coeff) || coeff < 1) {
      throw new RangeError(`Coefficient of ${formula} must be a positive integer (received ${coeff})`)
    }
    total += coeff * molarMass(formula)
  }
  return total
}

/**
 * Mass of element `numerator` divided by the mass of element `denominator` in one
 * formula unit. With a fixed mass of `denominator`, this gives the mass of
 * `numerator` that combines with it.
 *
 * @example elementMassRatio('H2O', 'O', 'H') // 7.94 (16.00 g O per 2.016 g H)
 * @throws {RangeError} If either element is absent from the formula or is unknown
 */
export function elementMassRatio(formula: string, numerator: string, denominator: string): number {
  const counts = parseFormula(formula)
  const massOf = (symbol: string): number => {
    const count = counts[symbol]
    const element = ELEMENTS[symbol]
    if (count === undefined || !element) {
      throw new RangeError(`${symbol} is not an element of ${formula}`)
    }
    return element.atomicMass * count
  }
  return massOf(numerator) / massOf(denominator)
}
