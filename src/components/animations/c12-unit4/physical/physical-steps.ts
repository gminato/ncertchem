import { dElectronCount, unpairedElectrons } from '@/lib/chem/dblock'
import {
  FIG_4_2_ATOMISATION_APPROX_KJ,
  HEAVY_SERIES_METALLIC_RADII_PM,
  SERIES_MEMBERS,
  SERIES_MELTING_POINTS_K,
  kelvinToCelsius,
} from '@/lib/chem/dblock-series-data'
import { NCERT_FIRST_SERIES_PROPERTIES } from '@/lib/chem/ncert-c12-unit4-tables'

/** A point on a trend plot: x is the position in the row (1 = group 3 … 10 = group 12). */
export interface TrendPoint {
  symbol: string
  x: number
  y: number
}

export type HeavySeries = '4d' | '5d'

/** The six views the Scrolly moves through, one per Step (Step 0 is the first). */
export type PhysicalView = 'melting' | 'configs' | 'enthalpy' | 'radii3d' | 'sizes' | 'density'

const VIEWS: readonly PhysicalView[] = ['melting', 'configs', 'enthalpy', 'radii3d', 'sizes', 'density']

/** Target view for a 0-based Step index. */
export function physicalViewForStep(step: number): PhysicalView {
  return VIEWS[Math.min(Math.max(step, 0), VIEWS.length - 1)]
}

function row(symbol: string) {
  const found = NCERT_FIRST_SERIES_PROPERTIES.find((r) => r.symbol === symbol)
  if (!found) throw new Error(`No Table 4.2 row for ${symbol}`)
  return found
}

/** Melting points in °C for one series (PubChem K, converted and rounded to the nearest degree). */
export function meltingPointsC(series: '3d' | '4d' | '5d'): TrendPoint[] {
  return SERIES_MELTING_POINTS_K[series].map((k, i) => ({
    symbol: SERIES_MEMBERS[series][i],
    x: i + 1,
    y: Math.round(kelvinToCelsius(k)),
  }))
}

/** Enthalpies of atomisation, kJ mol⁻¹, for 3d from Table 4.2 (exact as printed). */
export function atomisation3d(): TrendPoint[] {
  return SERIES_MEMBERS['3d'].map((symbol, i) => ({ symbol, x: i + 1, y: row(symbol).atomisationKJ }))
}

/** 4d and 5d enthalpies of atomisation, read off NCERT Fig. 4.2: APPROXIMATE (ruling R9). */
export function atomisationApprox(series: HeavySeries): TrendPoint[] {
  return SERIES_MEMBERS[series].map((symbol, i) => ({ symbol, x: i + 1, y: FIG_4_2_ATOMISATION_APPROX_KJ[series][i] }))
}

/** Unpaired 3d electrons in each neutral 3d atom (high spin, from the d count of Table 4.1). */
export function unpaired3d(): { symbol: string; dCount: number; unpaired: number }[] {
  return SERIES_MEMBERS['3d'].map((symbol) => {
    const dCount = dElectronCount(symbol)
    return { symbol, dCount, unpaired: unpairedElectrons(dCount) }
  })
}

/** Metallic radii, pm, from Table 4.2 (3d). */
export function metallicRadius3d(): TrendPoint[] {
  return SERIES_MEMBERS['3d'].map((symbol, i) => ({ symbol, x: i + 1, y: row(symbol).radiusMetalPm }))
}

/** M³⁺ radii, pm, from Table 4.2 (3d; Cu and Zn have no M³⁺ entry, so they are left out). */
export function m3PlusRadius3d(): TrendPoint[] {
  const points: TrendPoint[] = []
  SERIES_MEMBERS['3d'].forEach((symbol, i) => {
    const pm = row(symbol).radiusM3PlusPm
    if (pm !== null) points.push({ symbol, x: i + 1, y: pm })
  })
  return points
}

/** Metallic radius of a 4d or 5d member, pm (12-coordinate, from the lead's data file). */
export function heavyRadiusPm(series: HeavySeries, symbol: string): number {
  const members: readonly string[] = SERIES_MEMBERS[series]
  return HEAVY_SERIES_METALLIC_RADII_PM[series][members.indexOf(symbol)]
}

/** Densities, g cm⁻³, from Table 4.2 for V to Zn only (Sc and Ti are not quoted, ruling R9). */
export function density3dVtoZn(): TrendPoint[] {
  return SERIES_MEMBERS['3d'].slice(2).map((symbol, i) => ({
    symbol,
    x: i + 1,
    y: row(symbol).densityGPerCm3 ?? 0,
  }))
}

/** Ti 147 pm (Table 4.2), Zr 160 pm and Hf 159 pm (4d and 5d metallic radii). */
export const TI_RADIUS_PM = row('Ti').radiusMetalPm
export const ZR_RADIUS_PM = heavyRadiusPm('4d', 'Zr')
export const HF_RADIUS_PM = heavyRadiusPm('5d', 'Hf')
