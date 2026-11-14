import { limitingReagent, type Reaction } from './stoichiometry'

/**
 * Whole-molecule outcome of mixing discrete molecules in a reactor. Counts are
 * numbers of molecules, so every reported amount is a whole number.
 */
export interface ReactorOutcome {
  /** Formula of the reactant that runs out first. */
  limiting: string
  /** Whole reaction events (each event uses every coefficient once). */
  events: number
  /** Molecules of each reactant used up. */
  consumed: Record<string, number>
  /** Molecules of each reactant left over. */
  remaining: Record<string, number>
  /** Molecules of each product formed. */
  produced: Record<string, number>
}

const EPSILON = 1e-9

function assertCount(value: number, formula: string): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new RangeError(
      `Molecule count of ${formula} must be a non-negative integer (received ${value})`
    )
  }
}

/**
 * Outcome of a reaction run on whole molecules. The limiting reagent comes from
 * limitingReagent(); because the reaction can only run in whole events, the
 * extent is rounded down, so no molecule is ever split.
 *
 * @throws {RangeError} On a non-integer or negative count, or an invalid reaction
 */
export function reactorOutcome(
  reaction: Reaction,
  counts: Record<string, number>
): ReactorOutcome {
  for (const { formula } of reaction.reactants) {
    assertCount(counts[formula] ?? 0, formula)
  }

  const analysis = limitingReagent(reaction, counts)
  const events = Math.floor(analysis.extentMol + EPSILON)

  const consumed: Record<string, number> = {}
  const remaining: Record<string, number> = {}
  for (const { formula, coeff } of reaction.reactants) {
    consumed[formula] = coeff * events
    remaining[formula] = (counts[formula] ?? 0) - consumed[formula]
  }

  const produced: Record<string, number> = {}
  for (const { formula, coeff } of reaction.products) {
    produced[formula] = coeff * events
  }

  return { limiting: analysis.limiting, events, consumed, remaining, produced }
}
