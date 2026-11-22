import {
  electrodeCycle,
  eStandardM2,
  eStandardM3M2,
  halideKeyText,
  liberatesH2FromDiluteAcid,
  subscriptFormula,
} from '@/lib/chem/dblock'
import { NCERT_HALIDES, type HalideRow } from '@/lib/chem/ncert-c12-unit4-tables'

/** Scrolly Steps (P5 Prose). Index 0 is the first Step. */
export const STEP_COUNT = 5

/** The 3d series, Sc to Zn. Plot x = position in this list + 1. */
export const THREE_D = ['Sc', 'Ti', 'V', 'Cr', 'Mn', 'Fe', 'Co', 'Ni', 'Cu', 'Zn'] as const

/** Metals with a Table 4.4 energy cycle (Sc is not tabulated there). */
export const CYCLE_METALS = ['Ti', 'V', 'Cr', 'Mn', 'Fe', 'Co', 'Ni', 'Cu', 'Zn'] as const

/** Metals that the Prose calls out below the potential trend (Mn, Ni, Zn). */
export const BELOW_TREND = ['Mn', 'Ni', 'Zn'] as const

/** Plot x of a 3d metal (Sc = 1, Zn = 10). */
export function plotX(symbol: string): number {
  const i = THREE_D.indexOf(symbol as (typeof THREE_D)[number])
  if (i < 0) throw new RangeError(`${symbol} is not a 3d metal`)
  return i + 1
}

/** Table 4.4 cycle bars for M²⁺/M, kJ mol⁻¹: [ΔaH, ΔiH₁ + ΔiH₂, ΔhydH]. */
export function cycleBars(symbol: string): number[] {
  const c = electrodeCycle(symbol)
  return [c.atomisation, c.ie1PlusIe2, c.hydration]
}

/** Net cycle total, kJ mol⁻¹ (sum of the three bars). */
export function cycleTotal(symbol: string): number {
  return electrodeCycle(symbol).sum
}

/** E°(M²⁺/M) from Table 4.2 (null for Sc, which has no entry). */
export function potentialM2(symbol: string): number | null {
  return eStandardM2(symbol)
}

/** E°(M³⁺/M²⁺) from Table 4.2 (null where NCERT prints a dash). */
export function potentialM3M2(symbol: string): number | null {
  return eStandardM3M2(symbol)
}

/** Whether a metal liberates H₂ from dilute non-oxidising acid (E° < 0). */
export function bubblesH2(symbol: string): boolean | null {
  return liberatesH2FromDiluteAcid(symbol)
}

export interface HighestHalide {
  metal: string
  state: number
  /** Formula with real subscripts, e.g. "CrF₆". */
  formula: string
  /** Halogens the formula stands for, e.g. "F, Cl, Br, I" for TiX₄. */
  halogens: string
}

/** Highest oxidation state in Table 4.5 for each metal, read from the lib. */
export function highestHalides(metals: readonly string[]): HighestHalide[] {
  return metals.map((metal) => {
    const rows = NCERT_HALIDES.filter((r: HalideRow) => r.metal === metal)
    const top = rows.reduce((a, b) => (b.oxidationState > a.oxidationState ? b : a))
    return {
      metal,
      state: top.oxidationState,
      formula: subscriptFormula(top.formula),
      halogens: halideKeyText(top.key),
    }
  })
}

/** Minus sign as U+2212; plus sign on positive values. Integers only (kJ mol⁻¹). */
export function signedKj(v: number): string {
  const body = String(Math.abs(v))
  return `${v < 0 ? '−' : v > 0 ? '+' : ''}${body}`
}

/** Potential to 2 dp with its sign: "−0.76", "+0.34" (no unit). */
export function signedVolt(v: number): string {
  const body = Math.abs(v).toFixed(2)
  return `${v < 0 ? '−' : '+'}${body}`
}
