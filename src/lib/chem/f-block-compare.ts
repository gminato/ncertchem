// Position-by-position comparison of the lanthanoids (Ce–Lu) and actinoids (Th–Lr) for the f-block compare Simulation.
// Every value comes from the NCERT Table 4.9 / 4.10 / 4.11 arrays; a missing printed value is reported as null.

import { actinoidOxidationStates, fCount, ionSymbol } from './dblock'
import { configDisplay, NCERT_ACTINOIDS, NCERT_LANTHANOIDS } from './ncert-c12-unit4-tables'

/** Positions 1–14 along the f-series: position p is Ce (Z 57 + p) beside Th (Z 89 + p). */
export const F_SERIES_POSITIONS = 14

export interface FSeriesMember {
  readonly symbol: string
  readonly name: string
  readonly Z: number
  /** Atom configuration as printed (Table 4.9 / 4.10). */
  readonly atomConfig: string
  /** Number of f electrons in the M³⁺ ion. */
  readonly f3Count: number
  /** M³⁺ configuration as printed, e.g. "4f³". */
  readonly ion3Config: string
  /** M³⁺ ion label with superscript charge, e.g. "Nd³⁺". */
  readonly ion3Label: string
  /** M³⁺ radius in pm, or null where NCERT prints none. */
  readonly radiusM3PlusPm: number | null
  /** Oxidation states printed for this element, ascending. */
  readonly states: readonly number[]
  readonly maxState: number
}

export interface FBlockPosition {
  readonly position: number
  readonly lanthanoid: FSeriesMember
  readonly actinoid: FSeriesMember
  /** True when the actinoid's highest printed state is above the lanthanoid's. */
  readonly actinoidAhead: boolean
  /** Summary of the main differences at this position (for the aria-live line). */
  readonly summary: string
}

/**
 * Lanthanoid oxidation states NCERT names (4.5.3): +3 for every lanthanoid, +4 for Ce, Pr, Nd, Tb, Dy,
 * and +2 for Sm, Eu, Yb. Other Table 4.9 Ln²⁺ and Ln⁴⁺ configurations are printed but are not drawn as states.
 */
const NAMED_LANTHANOID_EXTRA_STATES: Readonly<Record<string, readonly number[]>> = {
  Ce: [4],
  Pr: [4],
  Nd: [4],
  Tb: [4],
  Dy: [4],
  Sm: [2],
  Eu: [2],
  Yb: [2],
}

/** The lanthanoid oxidation states NCERT names, ascending (La to Lu). */
export function namedLanthanoidStates(symbol: string): readonly number[] {
  if (!NCERT_LANTHANOIDS.some((r) => r.symbol === symbol)) throw new RangeError(`${symbol} is not a lanthanoid`)
  return [...(NAMED_LANTHANOID_EXTRA_STATES[symbol] ?? []), 3].sort((a, b) => a - b)
}

/** True when NCERT names the lanthanoid ion M^(state)+ as an oxidation state (Ce²⁺ and Lu²⁺ are not named). */
export function isNamedLanthanoidState(symbol: string, state: number): boolean {
  return namedLanthanoidStates(symbol).includes(state)
}

function lanthanoidMember(symbol: string): FSeriesMember {
  const row = NCERT_LANTHANOIDS.find((r) => r.symbol === symbol)
  if (row === undefined || row.ln3Plus === null) throw new RangeError(`${symbol} has no Table 4.9 row`)
  const states = [...namedLanthanoidStates(symbol)]
  return {
    symbol,
    name: row.name,
    Z: row.Z,
    atomConfig: configDisplay(row.ln),
    f3Count: fCount(symbol, 3),
    ion3Config: configDisplay(row.ln3Plus),
    ion3Label: ionSymbol(symbol, 3),
    radiusM3PlusPm: row.radiusLn3PlusPm,
    states,
    maxState: Math.max(...states),
  }
}

function actinoidMember(symbol: string): FSeriesMember {
  const row = NCERT_ACTINOIDS.find((r) => r.symbol === symbol)
  if (row === undefined || row.m3Plus === null) throw new RangeError(`${symbol} has no Table 4.10 row`)
  const states = [...actinoidOxidationStates(symbol)]
  return {
    symbol,
    name: row.name,
    Z: row.Z,
    atomConfig: configDisplay(row.m),
    f3Count: fCount(symbol, 3),
    ion3Config: configDisplay(row.m3Plus),
    ion3Label: ionSymbol(symbol, 3),
    radiusM3PlusPm: row.radiusM3PlusPm,
    states,
    maxState: Math.max(...states),
  }
}

/** Lanthanoid symbols at positions 1–14 (Ce to Lu), taken from Table 4.9. */
export function lanthanoidSymbols(): readonly string[] {
  return NCERT_LANTHANOIDS.filter((r) => r.Z >= 58 && r.Z <= 71).map((r) => r.symbol)
}

/** Actinoid symbols at positions 1–14 (Th to Lr), taken from Table 4.10. */
export function actinoidSymbols(): readonly string[] {
  return NCERT_ACTINOIDS.filter((r) => r.Z >= 90 && r.Z <= 103).map((r) => r.symbol)
}

/** The lanthanoid and actinoid at position p (1 to 14). */
export function fBlockPosition(p: number): FBlockPosition {
  if (!Number.isInteger(p) || p < 1 || p > F_SERIES_POSITIONS) throw new RangeError(`position ${p} is outside 1–${F_SERIES_POSITIONS}`)
  const lanthanoid = lanthanoidMember(lanthanoidSymbols()[p - 1])
  const actinoid = actinoidMember(actinoidSymbols()[p - 1])
  const actinoidAhead = actinoid.maxState > lanthanoid.maxState
  const radius = (m: FSeriesMember): string => (m.radiusM3PlusPm === null ? 'not printed' : `${m.radiusM3PlusPm} pm`)
  const relation = actinoidAhead
    ? `The actinoid reaches the higher top state, +${actinoid.maxState} against +${lanthanoid.maxState}.`
    : actinoid.maxState === lanthanoid.maxState
      ? `Both reach +${actinoid.maxState} here.`
      : `The lanthanoid reaches the higher top state, +${lanthanoid.maxState} against +${actinoid.maxState}.`
  const summary =
    `Position ${p} of ${F_SERIES_POSITIONS}: ${lanthanoid.symbol} and ${actinoid.symbol}. ` +
    `${lanthanoid.ion3Label} has ${lanthanoid.ion3Config}, radius ${radius(lanthanoid)}; ` +
    `${actinoid.ion3Label} has ${actinoid.ion3Config}, radius ${radius(actinoid)}. ${relation}`
  return { position: p, lanthanoid, actinoid, actinoidAhead, summary }
}

/** The first position at which the actinoid's top state is above the lanthanoid's, or null if never. */
export function firstActinoidAhead(): number | null {
  for (let p = 1; p <= F_SERIES_POSITIONS; p++) {
    if (fBlockPosition(p).actinoidAhead) return p
  }
  return null
}
