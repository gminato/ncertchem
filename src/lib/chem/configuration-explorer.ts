import { dBlockSeries, dElectronCount, ionConfig, ionSymbol, isTransitionElement, outerConfig, type TransitionVerdict } from './dblock'
import type { TransitionSeries } from './ncert-c12-unit4-tables'
import { elementBySymbol, groupOf } from './periodic-data'

const SUPERSCRIPT: Record<string, string> = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' }

function superscript(digits: string): string {
  return digits
    .split('')
    .map((d) => SUPERSCRIPT[d])
    .join('')
}

/**
 * The noble-gas core as written for each series. dblock's ionConfig stops at [Xe] or [Rn]; the
 * 4f¹⁴ of the 5d metals (Hf–Hg) and the 5f¹⁴ of the 6d metals (Rf–Cn) belong to the core too, so
 * they are added here (La and Ac have no f electrons yet).
 */
function coreWithF(symbol: string, series: TransitionSeries): string {
  if (series === '5d') return symbol === 'La' ? '[Xe]' : '[Xe] 4f¹⁴'
  if (series === '6d') return symbol === 'Ac' ? '[Rn]' : '[Rn] 5f¹⁴'
  return ionConfig(symbol, 0).display.split(' ')[0]
}

/** Ion charges the Configuration Explorer offers (0 is the atom). */
export const EXPLORER_CHARGES = [0, 1, 2, 3] as const

/** Series tabs the Configuration Explorer offers, in Table 4.1 order. */
export const EXPLORER_SERIES: readonly TransitionSeries[] = ['3d', '4d', '5d', '6d']

/** The series a d-block symbol belongs to (Table 4.1), or null for any other symbol. */
export function seriesOfSymbol(symbol: string): TransitionSeries | null {
  for (const series of EXPLORER_SERIES) {
    if (dBlockSeries(series).includes(symbol)) return series
  }
  return null
}

/** One subshell as the boxes draw it: electrons left, and electrons lost from the atom. */
export interface ExplorerSubshell {
  readonly subshell: string
  readonly electrons: number
  readonly removed: number
}

export interface ExplorerState {
  readonly symbol: string
  readonly charge: number
  /** Symbol with the charge, e.g. "Fe²⁺" (the plain symbol for the atom). */
  readonly label: string
  /** Outer configuration as Table 4.1 writes it, e.g. "3d⁵4s¹" or "5d⁹6s¹" (the main line). */
  readonly outer: string
  /** Configuration with the noble-gas core, e.g. "[Ar] 3d⁶" (the secondary line). */
  readonly display: string
  /** Subshells in Table 4.1 order: (n−1)d, then ns (a zero-electron ns, as in Pd, is kept). */
  readonly subshells: readonly ExplorerSubshell[]
  /** d electrons left in the atom or ion. */
  readonly dCount: number
  /** Verdict on the atom alone (the IUPAC test). */
  readonly atom: TransitionVerdict
  /** Verdict on the species shown: the atom for charge 0, otherwise the ion's own d subshell. */
  readonly verdict: boolean
  readonly verdictText: string
  /** Atom only: d electrons + s electrons, and the group number from the periodic table. */
  readonly groupSum: { readonly d: number; readonly s: number; readonly group: number | null }
  /** The text of the live region: changes only when the symbol, charge or verdict changes. */
  readonly summary: string
}

/**
 * Everything the Configuration Explorer shows for one element and charge. ns electrons leave
 * before (n−1)d electrons (ruling R10); the same rule holds for 3d, 4d, 5d and 6d.
 */
export function explorerState(symbol: string, charge: number): ExplorerState {
  const row = outerConfig(symbol)
  const ion = ionConfig(symbol, charge)
  const atomTerms = row.config.terms
  const speciesTerms = ion.terms

  const subshells: ExplorerSubshell[] = atomTerms.map((term) => {
    const left = speciesTerms.find((t) => t.subshell === term.subshell)?.electrons ?? 0
    return { subshell: term.subshell, electrons: left, removed: term.electrons - left }
  })

  const body = speciesTerms.map((t) => `${t.subshell}${superscript(String(t.electrons))}`).join('')
  const outer = body === '' ? coreWithF(symbol, row.series) : body
  const display = body === '' ? coreWithF(symbol, row.series) : `${coreWithF(symbol, row.series)} ${body}`

  const atom = isTransitionElement(symbol)
  const dCount = dElectronCount(symbol, charge)
  const label = ionSymbol(symbol, charge)

  let verdict: boolean
  let verdictText: string
  if (charge === 0) {
    verdict = atom.verdict
    verdictText = `${symbol} ${atom.verdict ? 'is' : 'is not'} a transition element: ${atom.reason}.`
  } else {
    const incomplete = dCount >= 1 && dCount <= 9
    verdict = incomplete
    const dText = `${dCount} d electron${dCount === 1 ? '' : 's'}`
    verdictText = incomplete
      ? `${label} is a transition ion: its d subshell holds ${dText}, so it is incomplete.`
      : `${label} is not a transition ion: its d subshell is ${dCount === 0 ? 'empty' : 'full'} (${dText}).`
  }

  const sElectrons = atomTerms.filter((t) => t.subshell.endsWith('s')).reduce((sum, t) => sum + t.electrons, 0)
  const groupSum = {
    d: dElectronCount(symbol, 0),
    s: sElectrons,
    group: groupOf(elementBySymbol(symbol)!.Z),
  }

  return {
    symbol,
    charge,
    label,
    outer,
    display,
    subshells,
    dCount,
    atom,
    verdict,
    verdictText,
    groupSum,
    summary: `${label}: ${display}. ${verdictText}`,
  }
}
