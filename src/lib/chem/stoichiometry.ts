import { parseFormula, type FormulaCounts } from './formula'

/** One species in a balanced equation: its formula and stoichiometric coefficient. */
export interface ReactionSpecies {
  formula: string
  coeff: number
}

/** A chemical equation as reactant and product lists, e.g. N2 + 3H2 -> 2NH3. */
export interface Reaction {
  reactants: ReactionSpecies[]
  products: ReactionSpecies[]
}

/** Result of a limiting-reagent analysis. All amounts are in mol. */
export interface LimitingReagentResult {
  /** Formula of the reactant that runs out first. */
  limiting: string
  /** Extent of reaction (mol of reaction units). */
  extentMol: number
  /** Moles of each reactant consumed. */
  consumed: Record<string, number>
  /** Moles of each reactant left over. */
  remaining: Record<string, number>
  /** Moles of each product formed. */
  produced: Record<string, number>
}

function assertValidSide(species: ReactionSpecies[], side: string): void {
  for (const { formula, coeff } of species) {
    if (!Number.isInteger(coeff) || coeff < 1) {
      throw new RangeError(
        `Coefficient of ${formula} in ${side} must be a positive integer (received ${coeff})`
      )
    }
  }
}

function atomTotals(species: ReactionSpecies[]): FormulaCounts {
  const totals: FormulaCounts = {}
  for (const { formula, coeff } of species) {
    const counts = parseFormula(formula)
    for (const symbol of Object.keys(counts)) {
      totals[symbol] = (totals[symbol] ?? 0) + counts[symbol] * coeff
    }
  }
  return totals
}

/**
 * Checks that a reaction conserves every element: the total atoms of each element
 * (coefficients included) are equal on both sides.
 *
 * @throws {RangeError} On invalid coefficients or formulas
 */
export function isBalanced(reaction: Reaction): boolean {
  assertValidSide(reaction.reactants, 'reactants')
  assertValidSide(reaction.products, 'products')

  const left = atomTotals(reaction.reactants)
  const right = atomTotals(reaction.products)
  const symbols = new Set([...Object.keys(left), ...Object.keys(right)])
  for (const symbol of symbols) {
    if ((left[symbol] ?? 0) !== (right[symbol] ?? 0)) {
      return false
    }
  }
  return true
}

/**
 * Finds the limiting reagent for a balanced reaction and the amounts it produces.
 *
 * The extent of reaction for each reactant is available / coefficient; the smallest
 * extent limits the reaction (ties go to the reactant listed first). A reactant not
 * present in `molesAvailable` is treated as having zero moles.
 *
 * @param reaction Balanced reaction (coefficients as given; not checked for balance here)
 * @param molesAvailable Moles of each reactant available, keyed by formula
 * @throws {RangeError} On invalid coefficients, an empty reactant list, or negative amounts
 */
export function limitingReagent(
  reaction: Reaction,
  molesAvailable: Record<string, number>
): LimitingReagentResult {
  assertValidSide(reaction.reactants, 'reactants')
  assertValidSide(reaction.products, 'products')
  if (reaction.reactants.length === 0) {
    throw new RangeError('A reaction needs at least one reactant')
  }
  for (const formula of Object.keys(molesAvailable)) {
    const amount = molesAvailable[formula]
    if (!Number.isFinite(amount) || amount < 0) {
      throw new RangeError(`Moles of ${formula} must be a non-negative number (received ${amount})`)
    }
  }

  const available = (formula: string): number => molesAvailable[formula] ?? 0

  let limitingSpecies = reaction.reactants[0]
  let extentMol = available(limitingSpecies.formula) / limitingSpecies.coeff
  for (const species of reaction.reactants.slice(1)) {
    const extent = available(species.formula) / species.coeff
    if (extent < extentMol) {
      extentMol = extent
      limitingSpecies = species
    }
  }

  const consumed: Record<string, number> = {}
  const remaining: Record<string, number> = {}
  for (const { formula, coeff } of reaction.reactants) {
    consumed[formula] = coeff * extentMol
    remaining[formula] = Math.max(0, available(formula) - consumed[formula])
  }

  const produced: Record<string, number> = {}
  for (const { formula, coeff } of reaction.products) {
    produced[formula] = coeff * extentMol
  }

  return {
    limiting: limitingSpecies.formula,
    extentMol,
    consumed,
    remaining,
    produced,
  }
}
