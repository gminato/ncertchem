import {
  dElectronCount,
  ionConfig,
  ionSymbol,
  oxidationStateCount,
  oxidationStates,
  outerConfig,
} from '@/lib/chem/dblock'
import { GROUP_6_HIGHEST_STATE, P_BLOCK_STEP_OF_TWO_EXAMPLE } from '@/lib/chem/dblock-series-data'

/** The first row, Sc to Zn, left to right. */
export const METALS = ['Sc', 'Ti', 'V', 'Cr', 'Mn', 'Fe', 'Co', 'Ni', 'Cu', 'Zn'] as const

/** Charges drawn as rows, highest at the top. */
export const STATE_ROWS = [7, 6, 5, 4, 3, 2, 1] as const

/** Mn ladder: rungs +2 to +7 (the +1 and below are not on Mn's ladder). */
export const MN_RUNGS = [2, 3, 4, 5, 6, 7] as const

export const STEP_COUNT = 6

export interface OxStateStep {
  /** Table 4.3 states are filled in (Step 2 onwards). */
  fill: boolean
  /** The count bar under each metal (Step 2 onwards). */
  counts: boolean
  /** Sc and Zn are picked out (Step 3). */
  ends: boolean
  /** Mn tokens and ladder (Step 4). */
  mnLadder: boolean
  /** Sn and Mn ladders side by side (Step 5). */
  tinLadder: boolean
  /** Group 6 with only the +6 rung lit (Step 6). */
  group6: boolean
}

const STEPS: readonly OxStateStep[] = [
  { fill: false, counts: false, ends: false, mnLadder: false, tinLadder: false, group6: false },
  { fill: true, counts: true, ends: false, mnLadder: false, tinLadder: false, group6: false },
  { fill: true, counts: true, ends: true, mnLadder: false, tinLadder: false, group6: false },
  { fill: true, counts: true, ends: false, mnLadder: true, tinLadder: false, group6: false },
  { fill: true, counts: true, ends: false, mnLadder: false, tinLadder: true, group6: false },
  { fill: true, counts: true, ends: false, mnLadder: false, tinLadder: false, group6: true },
]

/** 0-based Step index (clamped to the range). */
export function getOxStateStep(step: number): OxStateStep {
  const i = Math.min(STEPS.length - 1, Math.max(0, Math.floor(step)))
  return STEPS[i]!
}

/** Every metal's states drawn in its column: { symbol, states, common } from Table 4.3. */
export function gridCells(symbol: string): { state: number; common: boolean }[] {
  return oxidationStates(symbol).map((e) => ({ state: e.state, common: e.common }))
}

/** Number of states per metal, in column order (1,3,4,5,6,4,3,3,2,1). */
export function stateCounts(): number[] {
  return METALS.map((m) => oxidationStateCount(m))
}

/** Each Mn rung: the charge, its label and the ion's remaining configuration (lib). */
export function mnRungs(): { state: number; label: string; config: string; dCount: number }[] {
  return MN_RUNGS.map((state) => ({
    state,
    label: ionSymbol('Mn', state),
    config: ionConfig('Mn', state).display,
    dCount: dElectronCount('Mn', state),
  }))
}

/** Token order for Mn: the 4s pair first, then the five 3d electrons (they leave in this order). */
export const MN_TOKEN_SUBSHELLS = ['4s', '4s', '3d', '3d', '3d', '3d', '3d'] as const

/** Tokens removed at a rung of charge k: the first k tokens in this order (the 4s pair, then 3d). */
export function mnRemovedTokens(state: number): number {
  return Math.min(MN_TOKEN_SUBSHELLS.length, state)
}

/** Sc and Zn notes (Step 3): the configuration from Table 4.1 and the one state each metal shows. */
export function endNotes(): { symbol: string; config: string; state: number }[] {
  return ['Sc', 'Zn'].map((symbol) => ({
    symbol,
    config: outerConfig(symbol).display,
    state: oxidationStates(symbol).find((e) => e.common)?.state ?? oxidationStates(symbol)[0]!.state,
  }))
}

/** Tin's rungs (lib) and Mn's rungs for the unit-step comparison. */
export const TIN_RUNGS = P_BLOCK_STEP_OF_TWO_EXAMPLE.states

/** Group 6 rung strength: Cr's +6 is drawn paler than Mo's and W's (more stable going down). */
export const GROUP6_RUNG_STRENGTH: Readonly<Record<string, number>> = { Cr: 0.5, Mo: 1, W: 1 }

export function group6Cells(): readonly { symbol: string; species: string; strongOxidant: boolean; strength: number }[] {
  return GROUP_6_HIGHEST_STATE.map((c) => ({
    symbol: c.symbol,
    species: c.species,
    strongOxidant: c.strongOxidant,
    strength: GROUP6_RUNG_STRENGTH[c.symbol] ?? 1,
  }))
}
