import { FARADAY } from '@/lib/chem/ncert-c12-unit2-tables'
import { chargeFromCurrent, massDeposited, molesOfElectrons } from '@/lib/chem/electrolysis'
import { ELEMENTS } from '@/lib/chem/elements'

/**
 * Deterministic per-Step targets for the Faraday electrolysis Scrolly Animation (Section 2.5).
 * Every number shown to the learner comes from the chemistry libs; the plating and erosion
 * fractions are schematic, scaled so the silver deposit is drawn at DEPOSIT_SCALE.
 */

export type FaradayStepId =
  | 'electrolytic-cell'
  | 'ions-carry-current'
  | 'first-law'
  | 'second-law'
  | 'counting'

export type FaradaySceneMode = 'single' | 'series' | 'count'

/** Cathode deposit and anode erosion for one cell, each 0 to 1 (schematic thickness). */
export interface FaradayCellState {
  readonly deposit: number
  readonly erosion: number
}

export interface FaradayStepState {
  readonly index: number
  readonly id: FaradayStepId
  readonly scene: FaradaySceneMode
  readonly ionsOn: boolean
  readonly electronsOn: boolean
  /** Index 0 is the single cell or the silver cell; index 1 is the copper cell in series. */
  readonly cells: readonly [FaradayCellState, FaradayCellState]
  readonly barsOn: boolean
  readonly ariaLabel: string
}

/** Thickness of the largest series deposit (silver) on the schematic scale. */
export const DEPOSIT_SCALE = 0.5

export const CU_MOLAR_MASS = ELEMENTS.Cu.atomicMass
export const AG_MOLAR_MASS = ELEMENTS.Ag.atomicMass

/** First-law example: 1.00 A for 1000 s and for 2000 s on copper. */
export const FIRST_LAW_CURRENT_A = 1.0
export const FIRST_LAW_TIMES_S = [1000, 2000] as const

export function firstLawMass(timeS: number): number {
  return massDeposited({
    charge: chargeFromCurrent(FIRST_LAW_CURRENT_A, timeS),
    molarMass: CU_MOLAR_MASS,
    electrons: 2,
  })
}

/** Second-law example: one charge through an Ag⁺ cell and a Cu²⁺ cell in series. */
export const SERIES_CURRENT_A = 2.0
export const SERIES_TIME_S = 1800
export const SERIES_CHARGE_C = chargeFromCurrent(SERIES_CURRENT_A, SERIES_TIME_S)

export function seriesMasses(): { silver: number; copper: number } {
  return {
    silver: massDeposited({ charge: SERIES_CHARGE_C, molarMass: AG_MOLAR_MASS, electrons: 1 }),
    copper: massDeposited({ charge: SERIES_CHARGE_C, molarMass: CU_MOLAR_MASS, electrons: 2 }),
  }
}

/** Counting example: Q, moles of electrons, and moles of each ion. */
export function countingNumbers() {
  const moles = molesOfElectrons(SERIES_CHARGE_C)
  return {
    charge: SERIES_CHARGE_C,
    moles,
    molesAg: moles,
    molesCu: moles / 2,
    faraday: FARADAY,
  }
}

/** Round half up to `dp` decimals, avoiding binary artefacts such as 31.775 → 31.77. */
export function roundTo(x: number, dp: number): number {
  return Number(`${Math.round(Number(`${x}e${dp}`))}e-${dp}`)
}

const series = seriesMasses()
const copperRelative = series.copper / series.silver

export const FARADAY_STEPS: readonly FaradayStepState[] = [
  {
    index: 0,
    id: 'electrolytic-cell',
    scene: 'single',
    ionsOn: false,
    electronsOn: false,
    cells: [
      { deposit: 0, erosion: 0 },
      { deposit: 0, erosion: 0 },
    ],
    barsOn: false,
    ariaLabel:
      'Electrolytic cell: two copper electrodes in blue copper sulphate solution. A DC source has its positive terminal on the anode and its negative terminal on the cathode. A conventional current arrow runs opposite to the electron flow in the external wire.',
  },
  {
    index: 1,
    id: 'ions-carry-current',
    scene: 'single',
    ionsOn: true,
    electronsOn: true,
    cells: [
      { deposit: 0.2, erosion: 0.2 },
      { deposit: 0, erosion: 0 },
    ],
    barsOn: false,
    ariaLabel:
      'Copper ions drift toward the cathode and sulphate ions toward the anode. Copper plates onto the cathode, which thickens, while the anode thins as copper dissolves.',
  },
  {
    index: 2,
    id: 'first-law',
    scene: 'single',
    ionsOn: true,
    electronsOn: true,
    cells: [
      { deposit: 0.4, erosion: 0.4 },
      { deposit: 0, erosion: 0 },
    ],
    barsOn: true,
    ariaLabel:
      'The cathode deposit is doubled. Bars compare copper deposited at 1000 s (0.329 g) and at 2000 s (0.659 g) at 1.00 A: twice the charge gives twice the mass.',
  },
  {
    index: 3,
    id: 'second-law',
    scene: 'series',
    ionsOn: true,
    electronsOn: true,
    cells: [
      { deposit: DEPOSIT_SCALE, erosion: DEPOSIT_SCALE },
      { deposit: DEPOSIT_SCALE * copperRelative, erosion: DEPOSIT_SCALE * copperRelative },
    ],
    barsOn: false,
    ariaLabel:
      'Two cells in series on one wire. The left cell holds silver nitrate and the right holds copper sulphate. The same charge deposits 4.02 g of silver and 1.19 g of copper.',
  },
  {
    index: 4,
    id: 'counting',
    scene: 'count',
    ionsOn: false,
    electronsOn: false,
    cells: [
      { deposit: 0, erosion: 0 },
      { deposit: 0, erosion: 0 },
    ],
    barsOn: false,
    ariaLabel:
      'Counting electrons: Q = I × t gives the charge; dividing by the faraday gives moles of electrons; each silver ion takes one electron and each copper ion takes two.',
  },
]

export function clampFaradayStep(step: number): number {
  if (!Number.isFinite(step)) return 0
  return Math.min(FARADAY_STEPS.length - 1, Math.max(0, Math.round(step)))
}

export function getFaradayStepState(step: number): FaradayStepState {
  return FARADAY_STEPS[clampFaradayStep(step)]
}
