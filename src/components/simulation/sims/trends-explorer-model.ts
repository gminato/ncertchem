/**
 * Pure helpers for the Trends Explorer: which row or column is selected, the points and
 * callouts for its chart, and the sentence that the screen-reader summary reads out.
 */

import type { TrendPoint } from '@/components/periodic/trend'
import type { TrendHighlight } from '@/components/periodic/TrendChart'
import { elementByZ, ionizationAnomalies } from '@/lib/chem/periodic-data'
import {
  EXPLORER_DIRECTION,
  formatExplorerValue,
  type ExplorerPoint,
  type ExplorerProperty,
  type ExplorerScope,
} from '@/lib/chem/trends-explorer'

/** A period (row) or a group (column) picked from the table. */
export interface Selection {
  kind: 'period' | 'group'
  n: number
}

export const PROPERTY_NAME: Record<ExplorerProperty, string> = {
  radius: 'Atomic radius',
  ionization: 'First ionization enthalpy',
  gainEnthalpy: 'Electron gain enthalpy',
  electronegativity: 'Electronegativity',
}

/** The lib scope for a selection, or null when nothing is selected. */
export function scopeOf(selection: Selection | null): ExplorerScope | null {
  if (!selection) return null
  return selection.kind === 'period' ? { period: selection.n } : { group: selection.n }
}

/** "period 3" or "group 17". */
export function selectionName(selection: Selection): string {
  return `${selection.kind} ${selection.n}`
}

/**
 * Chart points for a series. Along a period x is the position in the row. Down a group
 * x is the period number, so the spacing follows the rows of the table.
 */
export function chartPoints(series: readonly ExplorerPoint[], selection: Selection): TrendPoint[] {
  return series.map((p) => ({
    x: selection.kind === 'group' ? elementByZ(p.Z).period : p.index,
    y: p.value ? p.value.value : null,
    label: p.symbol,
  }))
}

/**
 * Callouts for the first ionization enthalpy dips along a period, from the periodicity
 * model (NCERT Section 3.7.1(c)). Returns no callouts for any other property or selection.
 */
export function dipCallouts(
  property: ExplorerProperty,
  selection: Selection,
  series: readonly ExplorerPoint[],
): TrendHighlight[] {
  if (property !== 'ionization' || selection.kind !== 'period') return []
  const period = selection.n
  return ionizationAnomalies(period).flatMap((a) => {
    const index = series.findIndex((p) => p.Z === a.to)
    if (index < 0) return []
    const symbol = series[index].symbol
    const text = a.reason === 'p-electron-shielded'
      ? `${symbol}: ${period}p shielded`
      : `${symbol}: paired ${period}p`
    return [{ index, text }]
  })
}

/** How many points in a series have a value to plot. */
export function plottedCount(series: readonly ExplorerPoint[]): number {
  return series.filter((p) => p.value !== null).length
}

/**
 * Whether NCERT prints a radius trend for this row or column. NCERT Table 3.6(a) covers
 * periods 2 and 3, and Table 3.6(b) covers groups 1 and 17. Other rows would join values
 * from two different tables, so they are not plotted.
 */
export function radiusTrendPrinted(selection: Selection): boolean {
  if (selection.kind === 'period') return selection.n === 2 || selection.n === 3
  return selection.n === 1 || selection.n === 17
}

/**
 * Why a chart cannot be drawn, or null when it can.
 */
export function emptyMessage(
  property: ExplorerProperty,
  selection: Selection,
  series: readonly ExplorerPoint[],
): string | null {
  if (property === 'radius' && !radiusTrendPrinted(selection)) {
    return 'NCERT prints atomic radii only for periods 2 and 3 and for groups 1 and 17. Pick one of those rows or columns.'
  }
  if (plottedCount(series) < 2) return 'Fewer than two values to plot for this row or column.'
  return null
}

/**
 * The sentence the screen-reader summary reads out and the visible summary shows. It
 * gives the chosen property, the row or column, the NCERT trend, and the first and last
 * readings with their values.
 */
export function readoutFor(
  property: ExplorerProperty,
  selection: Selection | null,
  series: readonly ExplorerPoint[],
): string {
  if (!selection) {
    return `${PROPERTY_NAME[property]}: click a period number or a group number on the table to see its trend.`
  }
  if (property === 'radius' && !radiusTrendPrinted(selection)) {
    return `Atomic radius along ${selectionName(selection)}: NCERT prints no radius trend for this row or column.`
  }
  const direction = EXPLORER_DIRECTION[property]
  const plotted = series.filter((p) => p.value !== null)
  const trend = selection.kind === 'period'
    ? `Across a period it ${direction.across}.`
    : `Down a group it ${direction.down}.`
  if (plotted.length === 0) {
    return `${PROPERTY_NAME[property]} along ${selectionName(selection)}: no values. ${trend}`
  }
  const first = plotted[0]
  const last = plotted[plotted.length - 1]
  const reading = (p: ExplorerPoint) =>
    `${p.symbol} ${formatExplorerValue(p.value as NonNullable<ExplorerPoint['value']>, property)}`
  return `${PROPERTY_NAME[property]} along ${selectionName(selection)}, from ${reading(first)} to ${reading(last)}. ${trend}`
}
