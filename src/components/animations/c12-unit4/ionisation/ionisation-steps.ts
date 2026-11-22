import { NCERT_FIRST_SERIES_PROPERTIES } from '@/lib/chem/ncert-c12-unit4-tables'
import { dElectronCount, exchangePairs, ionConfig, ionSymbol } from '@/lib/chem/dblock'

/** Ionisation level n: IEₙ removes the n-th electron (from M^(n−1)+ to Mⁿ+). */
export type IeLevel = 1 | 2 | 3

/** The 3d row, Sc to Zn, in x-axis order (x = index). */
export const SYMBOLS = ['Sc', 'Ti', 'V', 'Cr', 'Mn', 'Fe', 'Co', 'Ni', 'Cu', 'Zn'] as const

export interface SubshellSpec {
  subshell: string
  electrons: number
  /** Electrons that left from this subshell in the step (drawn as faded arrows). */
  removed?: number
}

export interface RowSpec {
  element: string
  level: IeLevel
  /** Table 4.2 value for this level, kJ mol⁻¹. */
  value: number
  captionLeft: string
  captionRight: string
  left: SubshellSpec[]
  right: SubshellSpec[]
  /** Parallel-spin pairs in the d set before and after the removal. */
  pairsLeft: number
  pairsRight: number
}

export interface MarkSpec {
  element: string
  level: IeLevel
  /** 'value' labels the point with its kJ mol⁻¹ value; 'symbol' adds the element, e.g. "Mn 717". */
  label: 'value' | 'symbol'
  /** Where the label sits, off the stroke. Default 'above'. */
  side?: 'above' | 'below' | 'left' | 'right'
}

export type IonisationLayout = 'full' | 'split'

export interface IonisationStepState {
  step: number
  /** 'full': the plot fills the panel. 'split': a short plot above the configuration rows. */
  layout: IonisationLayout
  /** Levels drawn at full strength; the others are dimmed. */
  lit: readonly IeLevel[]
  marks: readonly MarkSpec[]
  /** Bracket between the level-3 points of two elements (step 3 only). */
  bracket: readonly [string, string] | null
  rows: readonly RowSpec[]
}

export interface IeValues {
  symbol: string
  1: number
  2: number
  3: number
}

export function ieValues(symbol: string): IeValues {
  const row = NCERT_FIRST_SERIES_PROPERTIES.find((r) => r.symbol === symbol)
  if (!row) throw new RangeError(`No Table 4.2 row for ${symbol}`)
  return { symbol, 1: row.ie1KJ, 2: row.ie2KJ, 3: row.ie3KJ }
}

/** Values for every element in the row, in x-axis order. */
export const SERIES_VALUES: readonly IeValues[] = SYMBOLS.map(ieValues)

/** Exchange pairs in a d set with n electrons: same-spin pairs in the up and down spin groups (Hund filling). */
export function pairsFor(element: string, charge: number): number {
  const n = dElectronCount(element, charge)
  return exchangePairs(Math.min(n, 5)) + exchangePairs(Math.max(n - 5, 0))
}

/** Subshells before and after removing one electron; the electron that left is shown as `removed`. */
export function removalSubshells(element: string, charge: number): { left: SubshellSpec[]; right: SubshellSpec[] } {
  const before = ionConfig(element, charge).terms
  const after = ionConfig(element, charge + 1).terms
  const left = before.map((t) => ({ subshell: t.subshell, electrons: t.electrons }))
  const right = before.map((t) => {
    const remaining = after.find((u) => u.subshell === t.subshell)?.electrons ?? 0
    const removed = t.electrons - remaining
    return removed > 0 ? { subshell: t.subshell, electrons: remaining, removed } : { subshell: t.subshell, electrons: remaining }
  })
  return { left, right }
}

export function rowFor(element: string, level: IeLevel): RowSpec {
  const charge = level - 1
  const { left, right } = removalSubshells(element, charge)
  return {
    element,
    level,
    value: ieValues(element)[level],
    captionLeft: ionSymbol(element, charge),
    captionRight: ionSymbol(element, level),
    left,
    right,
    pairsLeft: pairsFor(element, charge),
    pairsRight: pairsFor(element, level),
  }
}

/** The gap in kJ mol⁻¹ between two level-3 values (first minus second). */
export function gapOf(a: string, b: string, level: IeLevel): number {
  return ieValues(a)[level] - ieValues(b)[level]
}

const STEP_COUNT = 5

const STATES: readonly IonisationStepState[] = [
  {
    step: 0,
    layout: 'full',
    lit: [1, 2, 3],
    marks: [
      { element: 'Sc', level: 1, label: 'value' },
      { element: 'Zn', level: 1, label: 'value' },
      { element: 'Sc', level: 2, label: 'value' },
      { element: 'Zn', level: 2, label: 'value' },
      { element: 'Sc', level: 3, label: 'value' },
      { element: 'Zn', level: 3, label: 'value', side: 'left' },
    ],
    bracket: null,
    rows: [],
  },
  {
    step: 1,
    layout: 'full',
    lit: [1],
    marks: [
      { element: 'Cr', level: 1, label: 'symbol', side: 'below' },
      { element: 'Mn', level: 1, label: 'symbol' },
      { element: 'Cu', level: 1, label: 'symbol' },
      { element: 'Zn', level: 1, label: 'symbol' },
    ],
    bracket: null,
    rows: [],
  },
  {
    step: 2,
    layout: 'split',
    lit: [3],
    marks: [
      { element: 'Mn', level: 3, label: 'value', side: 'left' },
      { element: 'Fe', level: 3, label: 'value', side: 'below' },
    ],
    bracket: ['Mn', 'Fe'],
    rows: [rowFor('Mn', 3), rowFor('Fe', 3)],
  },
  {
    step: 3,
    layout: 'split',
    lit: [2],
    marks: [
      { element: 'V', level: 2, label: 'value' },
      { element: 'Cr', level: 2, label: 'value' },
      { element: 'Mn', level: 2, label: 'value' },
    ],
    bracket: null,
    rows: [rowFor('V', 2), rowFor('Cr', 2), rowFor('Mn', 2)],
  },
  {
    step: 4,
    layout: 'split',
    lit: [2, 3],
    marks: [
      { element: 'Cu', level: 2, label: 'value' },
      { element: 'Zn', level: 2, label: 'value' },
      { element: 'Zn', level: 3, label: 'value' },
    ],
    bracket: null,
    rows: [rowFor('Cu', 2), rowFor('Zn', 2), rowFor('Zn', 3)],
  },
]

/** Clamps a 0-based Step index to the five Steps and returns what the panel draws. */
export function getIonisationStepState(step: number): IonisationStepState {
  const index = Math.min(Math.max(Math.round(step), 0), STEP_COUNT - 1)
  return STATES[index]
}

export const IONISATION_STEP_COUNT = STEP_COUNT
