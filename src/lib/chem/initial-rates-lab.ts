import { orderFromTwoRuns, rateConstantFromRun, rateFromLaw } from './kinetics'
import { NCERT_NO_O2_INITIAL_RATES } from './ncert-c12-unit3-tables'

/** One starting-concentration slider for a reaction. */
export interface LabSpecies {
  readonly key: string
  /** mhchem source, e.g. 'NO' or 'O2'. Hypothetical species are single letters. */
  readonly ce: string
  readonly min: number
  readonly max: number
  readonly step: number
  readonly defaultValue: number
}

export type LabReactionId = 'no-o2' | 'hypothetical-b' | 'hypothetical-c'

export interface LabReaction {
  readonly id: LabReactionId
  readonly label: string
  /** mhchem source of the equation shown to the learner. */
  readonly equation: string
  readonly origin: 'table' | 'hypothetical'
  readonly species: readonly [LabSpecies, LabSpecies]
  /** Hidden orders in the rate law; revealed only at the end of the lab. */
  readonly orders: Readonly<Record<string, number>>
  /** Rate constant k; its units follow from the orders (rateConstantUnits). */
  readonly k: number
  /** What the initial-rate column measures. */
  readonly rateName: string
}

const NO_O2_ROW = NCERT_NO_O2_INITIAL_RATES[0]
const NO_O2_ORDERS: Readonly<Record<string, number>> = { NO: 2, O2: 1 }

/**
 * Reaction 1 is NCERT's Table 3.2 data (rate of NO₂ formation, lead ruling R1).
 * k is derived from the first table row, so it matches the Prose (3.56 mol⁻² L² s⁻¹).
 * Reactions 2 and 3 are invented for this lab; their orders are hidden until the reveal.
 */
export const LAB_REACTIONS: readonly LabReaction[] = [
  {
    id: 'no-o2',
    label: 'NO + O₂ (Table 3.2)',
    equation: '2NO + O2 -> 2NO2',
    origin: 'table',
    species: [
      { key: 'NO', ce: 'NO', min: 0.1, max: 1, step: 0.05, defaultValue: 0.3 },
      { key: 'O2', ce: 'O2', min: 0.1, max: 1, step: 0.05, defaultValue: 0.3 },
    ],
    orders: NO_O2_ORDERS,
    k: rateConstantFromRun(NO_O2_ROW.initialRate, { NO: NO_O2_ROW.noMolPerL, O2: NO_O2_ROW.o2MolPerL }, NO_O2_ORDERS),
    rateName: 'initial rate of NO₂ formation',
  },
  {
    id: 'hypothetical-b',
    label: 'Reaction B (hypothetical)',
    equation: 'X + Y -> Z',
    origin: 'hypothetical',
    species: [
      { key: 'X', ce: 'X', min: 0.1, max: 1, step: 0.05, defaultValue: 0.5 },
      { key: 'Y', ce: 'Y', min: 0.1, max: 1, step: 0.05, defaultValue: 0.5 },
    ],
    orders: { X: 1, Y: 0.5 },
    k: 0.4,
    rateName: 'initial rate',
  },
  {
    id: 'hypothetical-c',
    label: 'Reaction C (hypothetical)',
    equation: 'P + Q -> R',
    origin: 'hypothetical',
    species: [
      { key: 'P', ce: 'P', min: 0.1, max: 1, step: 0.05, defaultValue: 0.4 },
      { key: 'Q', ce: 'Q', min: 0.1, max: 1, step: 0.05, defaultValue: 0.4 },
    ],
    orders: { P: 2, Q: 0 },
    k: 0.5,
    rateName: 'initial rate',
  },
]

export function reactionById(id: LabReactionId): LabReaction {
  const found = LAB_REACTIONS.find((r) => r.id === id)
  if (!found) throw new Error(`Unknown reaction ${id}`)
  return found
}

/** Rounds a concentration to the slider's 0.01 grid so equal settings compare equal. */
export function roundConc(x: number): number {
  return Math.round(x * 100) / 100
}

/** Initial rate for starting concentrations, from the lab's rate law. */
export function initialRate(reaction: LabReaction, concs: Readonly<Record<string, number>>): number {
  return rateFromLaw(reaction.k, concs, reaction.orders)
}

export interface LabRun {
  readonly concs: Readonly<Record<string, number>>
  readonly rate: number
}

export type RunComparison =
  | { readonly kind: 'same' }
  | { readonly kind: 'several' }
  | {
      readonly kind: 'order'
      readonly species: string
      readonly order: number
      readonly rateRatio: number
      readonly concRatio: number
    }

/**
 * Compares two runs. Only a pair that differs in ONE concentration gives an order:
 * order = log(rate ratio) / log(concentration ratio).
 */
export function compareRuns(reaction: LabReaction, a: LabRun, b: LabRun): RunComparison {
  const changed = reaction.species.map((s) => s.key).filter((key) => a.concs[key] !== b.concs[key])
  if (changed.length === 0) return { kind: 'same' }
  if (changed.length > 1) return { kind: 'several' }
  const species = changed[0]
  return {
    kind: 'order',
    species,
    order: orderFromTwoRuns(a.concs[species], a.rate, b.concs[species], b.rate),
    rateRatio: b.rate / a.rate,
    concRatio: b.concs[species] / a.concs[species],
  }
}
