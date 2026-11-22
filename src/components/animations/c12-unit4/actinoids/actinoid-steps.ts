import {
  NCERT_ACTINOIDS,
  NCERT_ACTINOID_OXIDATION_STATES,
  NCERT_LANTHANOIDS,
  type ConfigTerm,
} from '@/lib/chem/ncert-c12-unit4-tables'

/** Scrolly Steps in the Section 10 MDX (0-based index from Scrolly). */
export const STEP_COUNT = 5

/** f-series position: La (Z 57) or Ac (Z 89) is 0, Ce or Th is 1, Lu or Lr is 14. */
export const LN_BASE_Z = 57
export const AN_BASE_Z = 89

/** Actinoids drawn as M³⁺ radii: Ac to Cf (the printed range of Table 4.10 radii). */
const AN_RADIUS_LAST_Z = 98

export interface RadiusPoint {
  symbol: string
  /** f-series position (see LN_BASE_Z and AN_BASE_Z). */
  pos: number
  /** Printed radius in pm, or null where the table prints "–". */
  pm: number | null
}

export interface LadderCell {
  symbol: string
  /** f-series position, 0 for La or Ac. */
  pos: number
  state: number
  /** Hollow cells are Ln²⁺ configurations printed in Table 4.9 (La excluded, as NCERT's La(II) is a slip). */
  hollow: boolean
}

/** Table 4.9 Ln³⁺ radii, La to Lu (Lu printed "–", so null). */
export function lanthanoidRadiusPoints(): RadiusPoint[] {
  return NCERT_LANTHANOIDS.map((r) => ({
    symbol: r.symbol,
    pos: r.Z - LN_BASE_Z,
    pm: r.radiusLn3PlusPm,
  }))
}

/** Table 4.10 M³⁺ radii, Ac to Cf (Th and Pa printed "–", so null). */
export function actinoidRadiusPoints(): RadiusPoint[] {
  return NCERT_ACTINOIDS.filter((r) => r.Z <= AN_RADIUS_LAST_Z).map((r) => ({
    symbol: r.symbol,
    pos: r.Z - AN_BASE_Z,
    pm: r.radiusM3PlusPm,
  }))
}

/** Ln and An oxidation-state dots: Table 4.9 (Ln) and Table 4.11 (An). */
export function lanthanoidLadder(): LadderCell[] {
  const cells: LadderCell[] = []
  for (const r of NCERT_LANTHANOIDS) {
    const pos = r.Z - LN_BASE_Z
    if (r.ln3Plus) cells.push({ symbol: r.symbol, pos, state: 3, hollow: false })
    if (r.ln4Plus) cells.push({ symbol: r.symbol, pos, state: 4, hollow: false })
    if (r.ln2Plus && r.symbol !== 'La') cells.push({ symbol: r.symbol, pos, state: 2, hollow: true })
  }
  return cells
}

export function actinoidLadder(): LadderCell[] {
  const cells: LadderCell[] = []
  for (const r of NCERT_ACTINOIDS) {
    if (r.Z < 90) continue // Th to Lr, as the Section's text covers
    const states = NCERT_ACTINOID_OXIDATION_STATES[r.symbol] ?? []
    for (const state of states) {
      cells.push({ symbol: r.symbol, pos: r.Z - AN_BASE_Z, state, hollow: false })
    }
  }
  return cells
}

/** Subshells of one actinoid as ConfigurationBoxes wants them: electrons > 0, in printed order. */
export function actinoidSubshells(symbol: string): Array<{ subshell: string; electrons: number }> {
  const row = NCERT_ACTINOIDS.find((r) => r.symbol === symbol)
  if (!row) throw new Error(`No actinoid ${symbol}`)
  return row.m.terms
    .filter((t: ConfigTerm) => t.electrons > 0)
    .map((t) => ({ subshell: t.subshell, electrons: t.electrons }))
}

/** Rows drawn in Step 2 (configurations). Thorium has no 5f electron. */
export const CONFIG_ROW_SYMBOLS = ['Th', 'Pa', 'U', 'Am', 'Cm', 'Lr'] as const

/** Maximum M³⁺ / M⁴⁺ oxidation state the Section draws for each actinoid, from Table 4.11. */
export function maxActinoidState(symbol: string): number {
  const states = NCERT_ACTINOID_OXIDATION_STATES[symbol]
  if (!states || states.length === 0) throw new Error(`No Table 4.11 states for ${symbol}`)
  return Math.max(...states)
}
