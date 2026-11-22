// Model for the lanthanoid-explorer Simulation (Section 4.5). Every number comes from the Unit 4
// libs: Table 4.9 configurations and radii (ncert-c12-unit4-tables), f counts and special states
// (dblock.ts), and the generic reaction list (dblock-series-data.ts, NCERT Fig. 4.7).

import { fCount, ionSymbol, lanthanoidRadii, specialLanthanoidStates } from './dblock'
import { LANTHANOID_REACTIONS } from './dblock-series-data'
import { NCERT_LANTHANOIDS, configDisplay, type LanthanoidRow } from './ncert-c12-unit4-tables'

const SUPERSCRIPT: Readonly<Record<string, string>> = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
}

function sup(n: number): string {
  return String(n).split('').map((d) => SUPERSCRIPT[d]).join('')
}

export interface LanthanoidTerm {
  readonly subshell: string
  readonly electrons: number
}

/** One oxidation state the explorer lists for an element, with its f count and the reason. */
export interface LanthanoidState {
  readonly ion: string
  readonly charge: number
  /** Number of f electrons in the ion (Table 4.9). */
  readonly fCount: number
  /** f count as a superscript string, e.g. "f⁷". */
  readonly fLabel: string
  /** True for the +3 state every lanthanoid shows. */
  readonly characteristic: boolean
  readonly reason: string
}

export interface LanthanoidEntry {
  readonly symbol: string
  readonly name: string
  readonly Z: number
  /** Atom configuration with the [Xe] core, e.g. "[Xe] 4f¹5d¹6s²". */
  readonly atomDisplay: string
  /** Ln³⁺ configuration with the [Xe] core, e.g. "[Xe] 4f¹". */
  readonly ion3Display: string
  /** Atom subshells as printed in Table 4.9 (no core), in NCERT's order. */
  readonly atomTerms: readonly LanthanoidTerm[]
  /** Ln³⁺ subshells as printed in Table 4.9 (no core). */
  readonly ion3Terms: readonly LanthanoidTerm[]
  /** Ln³⁺ radius in pm, or null where Table 4.9 prints a dash (Lu). */
  readonly radiusPm: number | null
  /** Ln³⁺ symbol with superscript charge, e.g. "Ce³⁺". */
  readonly ion3: string
  /** The explorer's oxidation states: +3 first, then any special +2 or +4 state. */
  readonly states: readonly LanthanoidState[]
}

export interface ReactionOption {
  readonly id: string
  readonly reagent: string
  readonly condition: string
  readonly products: readonly string[]
}

function rowFor(symbol: string): LanthanoidRow {
  const row = NCERT_LANTHANOIDS.find((r) => r.symbol === symbol)
  if (row === undefined) throw new RangeError(`${symbol} is not a lanthanoid in Table 4.9`)
  return row
}

function buildStates(symbol: string): LanthanoidState[] {
  const f3 = fCount(symbol, 3)
  const characteristic: LanthanoidState = {
    ion: ionSymbol(symbol, 3),
    charge: 3,
    fCount: f3,
    fLabel: `f${sup(f3)}`,
    characteristic: true,
    reason: 'the characteristic state of every lanthanoid',
  }
  const specials = specialLanthanoidStates()
    .filter((s) => s.symbol === symbol)
    .map((s): LanthanoidState => ({
      ion: s.ion,
      charge: s.charge,
      fCount: s.fCount,
      fLabel: `f${sup(s.fCount)}`,
      characteristic: false,
      reason: s.reason,
    }))
  return [characteristic, ...specials]
}

/** The entry for one lanthanoid symbol, from Table 4.9 and the dblock helpers. */
export function lanthanoidEntry(symbol: string): LanthanoidEntry {
  const row = rowFor(symbol)
  const ion3 = row.ln3Plus
  if (ion3 === null) throw new RangeError(`no printed Ln³⁺ configuration for ${symbol}`)
  const radius = lanthanoidRadii().find((r) => r.symbol === symbol)
  return {
    symbol,
    name: row.name,
    Z: row.Z,
    atomDisplay: `[Xe] ${configDisplay(row.ln, false)}`,
    ion3Display: `[Xe] ${configDisplay(ion3, true)}`,
    atomTerms: row.ln.terms.map((t) => ({ subshell: t.subshell, electrons: t.electrons })),
    ion3Terms: ion3.terms.map((t) => ({ subshell: t.subshell, electrons: t.electrons })),
    radiusPm: radius?.radiusPm ?? null,
    ion3: ionSymbol(symbol, 3),
    states: buildStates(symbol),
  }
}

/** La to Lu in the order of Table 4.9 (fifteen rows; the picker lists them all). */
export function lanthanoidEntries(): LanthanoidEntry[] {
  return NCERT_LANTHANOIDS.map((r) => lanthanoidEntry(r.symbol))
}

/** The reaction chooser's options: the generic Ln reactions of NCERT Fig. 4.7, with an id for each. */
export function reactionOptions(): ReactionOption[] {
  return LANTHANOID_REACTIONS.map((r, i) => ({
    id: `reaction-${i}`,
    reagent: r.reagent,
    condition: r.condition,
    products: [...r.products],
  }))
}

/** Radius series for the contraction plot: Ln³⁺ radius by Z, Lu excluded (no printed value). */
export function contractionSeries(): { symbol: string; Z: number; radiusPm: number }[] {
  return lanthanoidRadii().map((r) => ({ ...r }))
}

/** Default selections, matching the MDX prose: cerium and europium, so the f⁰ and f⁷ reasons compare at once. */
export const DEFAULT_PICKS = ['Ce', 'Eu'] as const
