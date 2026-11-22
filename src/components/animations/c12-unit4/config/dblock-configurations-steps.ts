import { dBlockSeries, outerConfig } from '@/lib/chem/dblock'
import type { SubshellConfig } from '@/components/vocab/dblock'

/** What the drawing shows for each Step (0-based, as Scrolly passes it). */
export type ConfigView = 'table' | 'series' | 'fill' | 'verdict' | 'closed'

const VIEWS: readonly ConfigView[] = ['table', 'series', 'fill', 'verdict', 'closed']

/** Target view for each Step. Steps past the last one stay on the last view. */
export function getConfigStep(step: number): ConfigView {
  const k = Math.min(Math.max(Math.floor(step), 0), VIEWS.length - 1)
  return VIEWS[k]
}

/** The 3d row in two lines of five, read left to right: Sc to Mn, then Fe to Zn. */
export const FILL_ROWS: readonly (readonly string[])[] = [
  dBlockSeries('3d').slice(0, 5),
  dBlockSeries('3d').slice(5),
]

/** Elements whose configuration is an exception to the plain filling order. */
export const EXCEPTIONS: readonly string[] = ['Cr', 'Cu']

/** The three zinc-group atoms that close the Section. */
export const CLOSING_SYMBOLS: readonly string[] = ['Zn', 'Cd', 'Hg']

/** Ion tests on the verdict Step: Ti³⁺, Cu²⁺ and Zn²⁺. */
export const ION_TESTS: readonly { symbol: string; charge: number }[] = [
  { symbol: 'Ti', charge: 3 },
  { symbol: 'Cu', charge: 2 },
  { symbol: 'Zn', charge: 2 },
]

/** Subshells in NCERT order, (n−1)d first, as the configuration boxes draw them. */
export function boxesFor(symbol: string): SubshellConfig[] {
  return outerConfig(symbol).config.terms.map((t) => ({ subshell: t.subshell, electrons: t.electrons }))
}

/** Total electrons in the outer subshells: d + s, which equals the group number. */
export function outerElectrons(terms: readonly SubshellConfig[]): number {
  return terms.reduce((sum, t) => sum + t.electrons, 0)
}

/**
 * The plain filling order that the exceptions break: one 4s electron moves to the (n−1)d set.
 * Cr 3d⁵4s¹ gives 3d⁴4s², Cu 3d¹⁰4s¹ gives 3d⁹4s².
 */
export function plainOrder(terms: readonly SubshellConfig[]): SubshellConfig[] {
  return terms.map((t) => {
    if (t.subshell.endsWith('d')) return { subshell: t.subshell, electrons: t.electrons - 1 }
    return { subshell: t.subshell, electrons: t.electrons + 1 }
  })
}

/** Series legend on the series-tone Step: which elements make up each row. */
export const SERIES_LEGEND: readonly { series: '3d' | '4d' | '5d' | '6d'; text: string }[] = [
  { series: '3d', text: '3d: Sc to Zn' },
  { series: '4d', text: '4d: Y to Cd' },
  { series: '5d', text: '5d: La, then Hf to Hg' },
  { series: '6d', text: '6d: Ac, then Rf to Cn' },
]
