/**
 * Target states for the ChemicalProperties Scrolly (NCERT Section 3.7.2 and 3.7.3).
 * Each Step names one view. The view is a pure function of the Step index, so
 * scrolling in either direction lands on the same picture.
 */

/** Number of Steps in the ChemicalProperties animation. */
export const CHEMICAL_STEP_COUNT = 3

export type ChemicalView = 'oxides' | 'diagonal' | 'extremes'

const VIEWS: readonly ChemicalView[] = ['oxides', 'diagonal', 'extremes']

export function clampChemicalStep(step: number): number {
  if (!Number.isFinite(step)) return 0
  return Math.min(CHEMICAL_STEP_COUNT - 1, Math.max(0, Math.round(step)))
}

/** The view shown at a Step: oxides of period 3, diagonal pairs, or the two extremes. */
export function chemicalView(step: number): ChemicalView {
  return VIEWS[clampChemicalStep(step)]
}

/**
 * Diagonal pairs as [Z, Z] (NCERT 3.7.2(b)): Li with Mg, Be with Al, B with Si. Each
 * pair sits one period lower and one column to the right in the short (8-column) form.
 */
export const DIAGONAL_PAIRS: readonly (readonly [number, number])[] = [
  [3, 12],
  [4, 13],
  [5, 14],
]

/** Groups at the two extremes of period 3 and of the table: alkali metals and halogens. */
export const EXTREME_GROUPS: readonly number[] = [1, 17]

/**
 * Column in the short (8-group) form. Groups 13 to 18 are columns 3 to 8, so Be (group 2)
 * and Al (group 13) differ by one column, as do B and Si.
 */
export function shortGroup(group: number): number {
  return group > 12 ? group - 10 : group
}
