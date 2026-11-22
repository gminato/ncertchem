import { NCERT_LANTHANOIDS, NCERT_SENTENCE_FACTS } from '@/lib/chem/ncert-c12-unit4-tables'
import { fCount, ionSymbol, specialLanthanoidStates } from '@/lib/chem/dblock'

export const STEP_COUNT = 5

/** One column per atom from La (Z 57) to Lu (Z 71), taken from Table 4.9 via the lib. */
export interface LnColumn {
  symbol: string
  Z: number
  /** The Ln³⁺ ion with real superscript, e.g. "Ce³⁺". */
  ion: string
  /** f electrons in Ln³⁺ (fCount). */
  f: number
  /** The ATOM configuration carries one 5d electron (La, Ce, Gd, Lu in NCERT's Table 4.9). Ln³⁺ ions never do. */
  atomHas5d: boolean
  /** Ln³⁺ radius in pm; null where NCERT prints "–" (Lu). */
  radiusPm: number | null
}

export const LN_COLUMNS: readonly LnColumn[] = NCERT_LANTHANOIDS.map((row) => ({
  symbol: row.symbol,
  Z: row.Z,
  ion: ionSymbol(row.symbol, 3),
  f: fCount(row.symbol, 3),
  atomHas5d: (row.ln.terms.find((t) => t.subshell === '5d')?.electrons ?? 0) > 0,
  radiusPm: row.radiusLn3PlusPm,
}))

/** The atoms that carry a drawn 5d¹ tag, in Z order. */
export const ATOMS_WITH_5D: readonly string[] = LN_COLUMNS.filter((c) => c.atomHas5d).map((c) => c.symbol)

/** Ln³⁺ radii as (Z, pm) pairs for the plot. Lu is not printed, so it is absent. */
export const RADIUS_POINTS: ReadonlyArray<readonly [number, number]> = LN_COLUMNS.flatMap((c) =>
  c.radiusPm === null ? [] : [[c.Z, c.radiusPm] as const]
)

function radiusOf(symbol: string): number {
  const col = LN_COLUMNS.find((c) => c.symbol === symbol)
  if (col?.radiusPm === undefined || col.radiusPm === null) throw new RangeError(`no Ln³⁺ radius for ${symbol}`)
  return col.radiusPm
}

/** Ends of the Ln³⁺ radius fall drawn in Step 2 (pm), read from the lib: La 106, Yb 86. */
export const FALL_TOP_PM = radiusOf('La')
export const FALL_BOTTOM_PM = radiusOf('Yb')

/** Fall in Ln³⁺ radius from La to Yb (pm): 106 − 86 = 20. */
export function radiusFallPm(): number {
  return FALL_TOP_PM - FALL_BOTTOM_PM
}

/** Average fall per element between La and Yb (13 steps). */
export function radiusFallPerStepPm(): number {
  const steps = LN_COLUMNS.findIndex((c) => c.symbol === 'Yb') - LN_COLUMNS.findIndex((c) => c.symbol === 'La')
  return radiusFallPm() / steps
}

export const ZR_RADIUS_PM = NCERT_SENTENCE_FACTS.zrRadiusPm
export const HF_RADIUS_PM = NCERT_SENTENCE_FACTS.hfRadiusPm
export const CE_IV_E_VOLT = NCERT_SENTENCE_FACTS.ceIVIIIEVolt

/** The four special ions (Ce⁴⁺ f⁰, Eu²⁺ f⁷, Tb⁴⁺ f⁷, Yb²⁺ f¹⁴) with their f counts and reasons. */
export const SPECIAL_STATES = specialLanthanoidStates()

/**
 * Hund filling of one subshell: up arrows first, one per orbital, then the
 * second electron of each orbital (down), so no orbital is paired early.
 */
export function hundSpins(electrons: number, orbitals = 7): Array<{ up: boolean; down: boolean }> {
  if (!Number.isInteger(electrons) || electrons < 0 || electrons > 2 * orbitals) {
    throw new RangeError(`electrons must be 0 to ${2 * orbitals}, got ${electrons}`)
  }
  return Array.from({ length: orbitals }, (_, i) => ({
    up: i < Math.min(electrons, orbitals),
    down: i < electrons - orbitals,
  }))
}

export type LanthanoidVisual = 'fill' | 'radius' | 'shield' | 'twins' | 'special'

export const STEP_VISUALS: readonly LanthanoidVisual[] = ['fill', 'radius', 'shield', 'twins', 'special']

/** The drawing for a 0-based Scrolly step; out-of-range steps clamp to the ends. */
export function lanthanoidStepVisual(step: number): LanthanoidVisual {
  const clamped = Math.min(Math.max(Math.trunc(step), 0), STEP_COUNT - 1)
  return STEP_VISUALS[clamped] ?? 'fill'
}
