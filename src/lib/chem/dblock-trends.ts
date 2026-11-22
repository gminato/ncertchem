/**
 * Trend points for the d-block Trends Lab (Section 4.3.1). Every number comes from the Unit 4 libs:
 * 3d values from Table 4.2 (NCERT_FIRST_SERIES_PROPERTIES), 4d/5d radii and enthalpies from
 * dblock-series-data.ts (the enthalpies are approximate, read off Fig. 4.2), melting points from PubChem.
 */

import { NCERT_FIRST_SERIES_PROPERTIES } from './ncert-c12-unit4-tables'
import {
  FIG_4_2_ATOMISATION_APPROX_KJ,
  HEAVY_SERIES_METALLIC_RADII_PM,
  SERIES_MELTING_POINTS_K,
  SERIES_MEMBERS,
  kelvinToCelsius,
} from './dblock-series-data'

export type TrendProperty = 'melting' | 'atomisation' | 'radius' | 'density'
export type TrendSeries = '3d' | '4d' | '5d'

export interface TrendPoint {
  series: TrendSeries
  symbol: string
  /** Position in the row, 1 (group 3) to 10 (group 12). */
  position: number
  value: number
  /** True for the 4d and 5d enthalpies read off NCERT Fig. 4.2. */
  approx: boolean
}

export const TREND_PROPERTIES: readonly TrendProperty[] = ['melting', 'atomisation', 'radius', 'density']

export const TREND_LABEL: Record<TrendProperty, string> = {
  melting: 'Melting point',
  atomisation: 'Enthalpy of atomisation',
  radius: 'Metallic radius',
  density: 'Density',
}

export const TREND_UNIT: Record<TrendProperty, string> = {
  melting: '°C',
  atomisation: 'kJ mol⁻¹',
  radius: 'pm',
  density: 'g cm⁻³',
}

/** Series that can be plotted for a property. Density is the 3d series only (V to Zn). */
export function seriesFor(property: TrendProperty): readonly TrendSeries[] {
  return property === 'density' ? ['3d'] : ['3d', '4d', '5d']
}

function row3d(symbol: string) {
  const row = NCERT_FIRST_SERIES_PROPERTIES.find((r) => r.symbol === symbol)
  if (!row) throw new Error(`No Table 4.2 row for ${symbol}`)
  return row
}

/** Points for one property and one series, in row order. Empty when the property has no data for that series. */
export function trendPoints(property: TrendProperty, series: TrendSeries): TrendPoint[] {
  const members = SERIES_MEMBERS[series]
  const points: TrendPoint[] = []
  members.forEach((symbol, i) => {
    const position = i + 1
    const base = { series, symbol, position }
    if (property === 'melting') {
      points.push({ ...base, value: Math.round(kelvinToCelsius(SERIES_MELTING_POINTS_K[series][i])), approx: false })
    } else if (property === 'atomisation') {
      if (series === '3d') {
        points.push({ ...base, value: row3d(symbol).atomisationKJ, approx: false })
      } else {
        points.push({ ...base, value: FIG_4_2_ATOMISATION_APPROX_KJ[series][i], approx: true })
      }
    } else if (property === 'radius') {
      if (series === '3d') {
        const r = row3d(symbol).radiusMetalPm
        if (r !== null) points.push({ ...base, value: r, approx: false })
      } else {
        points.push({ ...base, value: HEAVY_SERIES_METALLIC_RADII_PM[series][i], approx: false })
      }
    } else if (series === '3d') {
      // Density: Table 4.2 only, and only from V to Zn (NCERT's Sc and Ti densities are doubtful).
      const d = row3d(symbol).densityGPerCm3
      if (d !== null && symbol !== 'Sc' && symbol !== 'Ti') points.push({ ...base, value: d, approx: false })
    }
  })
  return points
}

/** The point(s) holding the largest or smallest value; ties return every symbol that shares it. */
export function extremes(points: readonly TrendPoint[], pick: 'max' | 'min'): { value: number; symbols: string[] } | null {
  if (points.length === 0) return null
  const best = points.reduce((acc, p) => (pick === 'max' ? (p.value > acc ? p.value : acc) : p.value < acc ? p.value : acc), points[0].value)
  return { value: best, symbols: points.filter((p) => p.value === best).map((p) => p.symbol) }
}

/** The lowest value strictly inside a row (not the first or last member). */
export function interiorMinimum(points: readonly TrendPoint[]): TrendPoint | null {
  const inner = points.slice(1, -1)
  if (inner.length === 0) return null
  return inner.reduce((acc, p) => (p.value < acc.value ? p : acc))
}

/** A value with its unit, rounded for display; approximate values carry ≈. */
export function formatTrendValue(property: TrendProperty, value: number, approx = false): string {
  const digits = property === 'density' ? value.toFixed(2) : String(Math.round(value))
  const signed = digits.replace('-', '−')
  const prefix = approx ? '≈ ' : ''
  return `${prefix}${signed} ${TREND_UNIT[property]}`
}

/** One line that names a point: symbol, series and value. */
export function pointReading(property: TrendProperty, point: TrendPoint): string {
  const source =
    property === 'melting'
      ? 'PubChem'
      : property === 'atomisation'
        ? point.approx
          ? 'read from NCERT Fig. 4.2'
          : 'NCERT Table 4.2'
        : property === 'radius'
          ? point.series === '3d'
            ? 'NCERT Table 4.2'
            : '12-coordinate metallic radius'
          : 'NCERT Table 4.2'
  return `${point.symbol} (${point.series}): ${TREND_LABEL[property].toLowerCase()} ${formatTrendValue(property, point.value, point.approx)}, ${source}.`
}

const names = (symbols: string[]) => (symbols.length <= 2 ? symbols.join(' and ') : `${symbols.slice(0, -1).join(', ')} and ${symbols[symbols.length - 1]}`)

/** The shape sentence for the visible series. Names and numbers come from the data, so ties and maxima stay true. */
export function shapeNote(property: TrendProperty, visible: readonly TrendSeries[]): string {
  if (visible.length === 0) return 'Choose at least one series to plot.'
  const unit = TREND_UNIT[property]
  if (property === 'density') {
    const pts = trendPoints('density', '3d')
    const top = extremes(pts, 'max')!
    const low = pts.find((p) => p.symbol === 'Zn')!
    return `Density rises from V (${formatTrendValue('density', pts[0].value)}) to a maximum of ${formatTrendValue('density', top.value)} at ${names(top.symbols)}, then falls to Zn (${formatTrendValue('density', low.value)}). Sc and Ti are not shown.`
  }
  if (property === 'radius') {
    const parts: string[] = []
    if (visible.includes('3d')) {
      const pts = trendPoints('radius', '3d')
      const floor = extremes(pts, 'min')!
      const sc = pts[0]
      const zn = pts[pts.length - 1]
      parts.push(`Across the 3d row the radius falls from Sc (${sc.value} ${unit}) to a floor at ${names(floor.symbols)} (${floor.value} ${unit}), then rises to Zn (${zn.value} ${unit}).`)
    }
    if (visible.includes('4d') && visible.includes('5d')) {
      parts.push(`5d ≈ 4d: Hf (${HEAVY_SERIES_METALLIC_RADII_PM['5d'][1]} pm) and Zr (${HEAVY_SERIES_METALLIC_RADII_PM['4d'][1]} pm) nearly match, because of the lanthanoid contraction.`)
    }
    return parts.join(' ')
  }
  const peaks = visible.map((s) => {
    const top = extremes(trendPoints(property, s), 'max')!
    return `${names(top.symbols)} (${s}, ${formatTrendValue(property, top.value, property === 'atomisation' && s !== '3d')})`
  })
  const peakText = `Each row peaks near its middle: ${peaks.join(', ')}.`
  if (property === 'melting') {
    const ends = visible.map((s) => {
      const z = trendPoints(property, s)
      return z[z.length - 1]
    })
    return `${peakText} The group 12 ends drop to ${ends.map((p) => `${p.symbol} ${formatTrendValue(property, p.value)}`).join(', ')}.`
  }
  const dip = visible.includes('3d') ? interiorMinimum(trendPoints(property, '3d')) : null
  const dipText = dip ? ` The 3d curve dips at ${dip.symbol} (${formatTrendValue(property, dip.value)}).` : ''
  return `${peakText}${dipText} The 4d and 5d enthalpies are approximate (≈).`
}
