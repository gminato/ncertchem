import {
  dBlockSeries,
  dElectronCount,
  exampleSpecies,
  halideKeyText,
  oxidationStates,
  outerConfig,
  type ExampleHalide,
} from './dblock'
import { GROUP_6_HIGHEST_STATE } from './dblock-series-data'

/** The first-row metals (Sc to Zn) in NCERT order. */
export const FIRST_ROW: readonly string[] = dBlockSeries('3d')

/** The number line runs over +1 to +7 (the highest state in Table 4.3 is Mn +7). */
export const STATE_LINE: readonly number[] = [1, 2, 3, 4, 5, 6, 7]

/** The group 6 metals in the order the explorer shows them. */
export const GROUP_6_METALS: readonly string[] = GROUP_6_HIGHEST_STATE.map((row) => row.symbol)

export interface StateRow {
  state: number
  /** Listed in Table 4.3 for this metal. */
  listed: boolean
  /** Bold (most common) in Table 4.3. */
  common: boolean
  /** d electrons left once the ns electrons and then the (n−1)d electrons leave; null if not listed. */
  dLeft: number | null
  /** An oxide (Table 4.6) or, failing that, a halide (Table 4.5) for this state; null if the tables have none. */
  example: string | null
  exampleKind: 'oxide' | 'halide' | null
}

export interface ExplorerReadout {
  /** Listed states, in the form "+2, +3, +4". */
  states: string
  /** The count-rule sentence for the chosen metal. */
  lead: string
  /** Halide key: what X stands for, when a halide example is drawn; null otherwise. */
  halideKey: string | null
}

/** Valence electrons (ns + (n−1)d) from Table 4.1. */
export function valenceTotal(symbol: string): number {
  return outerConfig(symbol).config.terms.reduce((sum, term) => sum + term.electrons, 0)
}

/** The highest state listed in Table 4.3 for this metal. */
export function highestListed(symbol: string): number {
  return Math.max(...oxidationStates(symbol).map((entry) => entry.state))
}

/** True when the highest listed state equals the valence total (the count rule holds up to Mn). */
export function countRuleHolds(symbol: string): boolean {
  return highestListed(symbol) === valenceTotal(symbol)
}

export function stateRows(symbol: string): StateRow[] {
  const listed = new Map(oxidationStates(symbol).map((entry) => [entry.state, entry.common]))
  return STATE_LINE.map((state) => {
    const common = listed.get(state)
    if (common === undefined) {
      return { state, listed: false, common: false, dLeft: null, example: null, exampleKind: null }
    }
    const species = exampleSpecies(symbol, state)
    const oxide = species.oxides.find((entry) => !entry.mixed) ?? species.oxides[0]
    const halide: ExampleHalide | undefined = species.halides[0]
    let example: string | null = null
    let exampleKind: StateRow['exampleKind'] = null
    if (oxide) {
      example = oxide.formula
      exampleKind = 'oxide'
    } else if (halide) {
      example = halide.formula
      exampleKind = 'halide'
    }
    return { state, listed: true, common, dLeft: dElectronCount(symbol, state), example, exampleKind }
  })
}

/** The halide key for the first halide example this metal's states draw, or null. */
export function halideKeyFor(symbol: string): string | null {
  for (const state of STATE_LINE) {
    const species = exampleSpecies(symbol, state)
    if (species.oxides.length === 0 && species.halides[0]) {
      return halideKeyText(species.halides[0].key)
    }
  }
  return null
}

export function listedStatesText(symbol: string): string {
  return oxidationStates(symbol)
    .map((entry) => `+${entry.state}`)
    .join(', ')
}

export function explorerReadout(symbol: string): ExplorerReadout {
  const v = valenceTotal(symbol)
  const h = highestListed(symbol)
  const lead = countRuleHolds(symbol)
    ? `${symbol}: the highest listed state, +${h}, equals the ${v} valence electrons (ns + (n−1)d). The count rule holds up to Mn.`
    : `${symbol}: the valence total is ${v}, but the highest listed state is +${h}. The count rule stops at Mn; after it the highest state falls away.`
  return { states: listedStatesText(symbol), lead, halideKey: halideKeyFor(symbol) }
}

export interface Group6Entry {
  symbol: string
  state: number
  species: string
  strongOxidant: boolean
}

export function group6Entry(symbol: string): Group6Entry {
  const row = GROUP_6_HIGHEST_STATE.find((entry) => entry.symbol === symbol)
  if (row === undefined) throw new RangeError(`${symbol} is not a group 6 metal in the explorer`)
  return { symbol: row.symbol, state: row.state, species: row.species, strongOxidant: row.strongOxidant }
}

/** The group 6 sentence for the selected metal; the group trend line is the same for all three. */
export function group6Summary(symbol: string): string {
  const entry = group6Entry(symbol)
  const verdict = entry.strongOxidant ? 'a strong oxidant in acid' : 'not an oxidant'
  return `${symbol}: +${entry.state} as ${entry.species} is ${verdict}. Going down group 6 the +6 state becomes more stable.`
}
