/**
 * Target states for the EnergeticsTable Scrolly, which animates on the full periodic table.
 * A Step sets which property colours the table, whether the halogens are picked out, and
 * how far the colour has swept across the table (0 to 1, by group).
 */

/** Number of Steps in the EnergeticsTable Scrolly. */
export const TABLE_STEP_COUNT = 4

/** What the table is coloured by. */
export type TableView = 'gainEnthalpy' | 'electronegativity' | 'category'

export interface TableSnapshot {
  view: TableView
  /** Fraction of the table revealed, from 0 (none) to 1 (all), in group order. */
  reveal: number
  /** Dims every cell except the halogens. */
  halogensOnly: boolean
}

/** Clamps a Step index into range. */
export function clampTableStep(step: number): number {
  if (!Number.isFinite(step)) return 0
  return Math.min(TABLE_STEP_COUNT - 1, Math.max(0, Math.round(step)))
}

/** The state before the first Step: nothing revealed. */
export const TABLE_START: TableSnapshot = {
  view: 'gainEnthalpy',
  reveal: 0,
  halogensOnly: false,
}

/** Target state for each Step. The reveal always ends at 1, so every Step shows the whole view. */
export function tableTargetForStep(step: number): TableSnapshot {
  switch (clampTableStep(step)) {
    case 0:
      return { view: 'gainEnthalpy', reveal: 1, halogensOnly: false }
    case 1:
      return { view: 'gainEnthalpy', reveal: 1, halogensOnly: true }
    case 2:
      return { view: 'electronegativity', reveal: 1, halogensOnly: false }
    default:
      return { view: 'category', reveal: 1, halogensOnly: false }
  }
}

/** Halogens, by atomic number. Used to pick out F, Cl, Br and I. */
export const HALOGEN_Z = [9, 17, 35, 53] as const

/** A short description of the Step, for the screen-reader live region. */
export function tableStepDescription(step: number): string {
  switch (clampTableStep(step)) {
    case 0:
      return 'Electron gain enthalpy across the table, in NCERT Table 3.7 values where NCERT prints them. Teal cells release energy when an electron is added.'
    case 1:
      return 'The halogens: fluorine, chlorine, bromine and iodine. Chlorine has the most negative electron gain enthalpy.'
    case 2:
      return 'Pauling electronegativity across the table. Values rise towards the upper right, where fluorine has the highest value.'
    default:
      return 'Metals, metalloids and non-metals. Non-metals sit at the upper right, where electronegativity is highest.'
  }
}
