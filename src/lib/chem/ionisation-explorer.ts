import { D_BLOCK_SERIES, dElectronCount, exchangePairs, ionConfig, ionSymbol } from './dblock'
import { NCERT_FIRST_SERIES_PROPERTIES } from './ncert-c12-unit4-tables'

/** The 3d elements Sc to Zn in table order (Table 4.1). */
export const FIRST_SERIES_SYMBOLS: readonly string[] = D_BLOCK_SERIES['3d']

/** Successive ionisation enthalpies IE₁, IE₂, IE₃ in kJ mol⁻¹, from Table 4.2. */
export function firstSeriesIe(symbol: string): readonly [number, number, number] {
  const row = NCERT_FIRST_SERIES_PROPERTIES.find((r) => r.symbol === symbol)
  if (row === undefined) throw new RangeError(`${symbol} is not in Table 4.2 (Sc to Zn only)`)
  return [row.ie1KJ, row.ie2KJ, row.ie3KJ]
}

/**
 * Parallel-spin pairs in the d set: the pairs of same-spin electrons that exchange energy
 * stabilises. Up-spin electrons fill first (up = min(n, 5)), the rest are down-spin.
 */
export function parallelSpinPairs(dCount: number): number {
  if (!Number.isInteger(dCount) || dCount < 0 || dCount > 10) throw new RangeError('d count must be 0 to 10')
  return exchangePairs(Math.min(dCount, 5)) + exchangePairs(Math.max(dCount - 5, 0))
}

export interface IonisationSubshell {
  /** Subshell name, e.g. "3d" or "4s", in NCERT order. */
  readonly subshell: string
  /** Electrons still in the subshell after `charge` electrons have left. */
  readonly electrons: number
  /** Electrons that have left this subshell (for drawing the removed electrons). */
  readonly removed: number
}

export interface IonisationState {
  readonly symbol: string
  readonly charge: number
  /** Ion name with real superscripts, e.g. "Mn²⁺"; the atom is the bare symbol. */
  readonly label: string
  /** Configuration with the noble-gas core, e.g. "[Ar] 3d⁵". */
  readonly display: string
  readonly dCount: number
  readonly pairs: number
  readonly subshells: readonly IonisationSubshell[]
}

/**
 * The state after `charge` electrons have been removed from a 3d atom. ns electrons leave before
 * (n−1)d (R10). The subshell list covers every subshell of the atom, so the boxes can show the
 * removed electrons in their original places.
 */
export function ionisationState(symbol: string, charge: number): IonisationState {
  const atom = ionConfig(symbol, 0)
  const ion = ionConfig(symbol, charge)
  const remainingOf = (subshell: string): number => ion.terms.find((t) => t.subshell === subshell)?.electrons ?? 0
  const subshells = atom.terms.map((t) => {
    const electrons = remainingOf(t.subshell)
    return { subshell: t.subshell, electrons, removed: t.electrons - electrons }
  })
  const dCount = dElectronCount(symbol, charge)
  return {
    symbol,
    charge,
    label: ionSymbol(symbol, charge),
    display: ion.display,
    dCount,
    pairs: parallelSpinPairs(dCount),
    subshells,
  }
}

/** The subshell that lost the `charge`-th electron (null for the atom, charge 0). */
export function subshellLosingElectron(symbol: string, charge: number): string | null {
  if (charge === 0) return null
  const before = ionisationState(symbol, charge - 1).subshells
  const after = ionisationState(symbol, charge).subshells
  const lost = after.find((s) => s.removed > (before.find((b) => b.subshell === s.subshell)?.removed ?? 0))
  return lost?.subshell ?? null
}
