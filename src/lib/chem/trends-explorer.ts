/**
 * Values shown by the Trends Explorer and the Unit 3 energetics Scrollies. Each cell
 * shows NCERT's printed value where NCERT prints one (Tables 3.6, 3.7 and 3.8, and the
 * ionization enthalpies of Problem 3.6). Otherwise it shows PubChem's value, which the UI
 * marks with a dagger. Atomic radii come from NCERT only, so the two radius scales never
 * share a chart.
 */

import { PERIODIC_TABLE, type ElementRecord } from './periodic-data'
import {
  NCERT_PROBLEM_3_6_IONIZATION_ENTHALPIES,
  NCERT_TABLE_3_6A_RADII_ACROSS_PERIODS,
  NCERT_TABLE_3_6B_RADII_DOWN_A_FAMILY,
  NCERT_TABLE_3_7_ELECTRON_GAIN_ENTHALPY,
  NCERT_TABLE_3_8A_ELECTRONEGATIVITY_ACROSS_PERIODS,
  NCERT_TABLE_3_8B_ELECTRONEGATIVITY_DOWN_A_FAMILY,
} from './ncert-unit3-tables'

/** kJ mol⁻¹ per eV: one electron volt per atom, times Avogadro's number, to five figures. */
export const KJ_PER_MOL_PER_EV = 96.485

/** Marks a value taken from the PubChem snapshot rather than printed by NCERT. */
export const PUBCHEM_MARK = '†'

/**
 * Converts an energy in eV per atom to kJ mol⁻¹.
 *
 * @throws {RangeError} If the energy is not finite
 */
export function evToKjPerMol(ev: number): number {
  if (!Number.isFinite(ev)) throw new RangeError(`Energy must be a finite number (received ${ev})`)
  return ev * KJ_PER_MOL_PER_EV
}

/**
 * NCERT's electron gain enthalpy from PubChem's electron affinity. PubChem's electron
 * affinity is positive when energy is released, while NCERT's Δ_eg H is negative in that
 * case, so Δ_eg H = −EA.
 */
export function gainEnthalpyFromAffinityKj(electronAffinityEv: number): number {
  return -evToKjPerMol(electronAffinityEv)
}

/** The four properties the explorer can colour the table by. */
export type ExplorerProperty = 'radius' | 'ionization' | 'gainEnthalpy' | 'electronegativity'

export type ValueSource = 'ncert' | 'pubchem'

export interface SourcedValue {
  value: number
  source: ValueSource
}

/**
 * The value shown for one element and property, with where it came from. Returns null
 * when neither NCERT nor PubChem gives one. Radii have no PubChem fallback.
 */
export function explorerValue(el: ElementRecord, property: ExplorerProperty): SourcedValue | null {
  switch (property) {
    case 'radius': {
      const row = [...NCERT_TABLE_3_6A_RADII_ACROSS_PERIODS.rows, ...NCERT_TABLE_3_6B_RADII_DOWN_A_FAMILY.rows]
        .find((r) => r.symbol === el.symbol)
      return row ? { value: row.value, source: 'ncert' } : null
    }
    case 'ionization': {
      const printed = NCERT_PROBLEM_3_6_IONIZATION_ENTHALPIES.rows.find((r) => r.symbol === el.symbol)
      if (printed) return { value: printed.value, source: 'ncert' }
      if (el.firstIonizationEnergyEv === null) return null
      return { value: evToKjPerMol(el.firstIonizationEnergyEv), source: 'pubchem' }
    }
    case 'gainEnthalpy': {
      const printed = NCERT_TABLE_3_7_ELECTRON_GAIN_ENTHALPY.rows.find((r) => r.symbol === el.symbol)
      if (printed) return { value: printed.value, source: 'ncert' }
      if (el.electronAffinityEv === null) return null
      return { value: gainEnthalpyFromAffinityKj(el.electronAffinityEv), source: 'pubchem' }
    }
    case 'electronegativity': {
      const printed = [
        ...NCERT_TABLE_3_8A_ELECTRONEGATIVITY_ACROSS_PERIODS.rows,
        ...NCERT_TABLE_3_8B_ELECTRONEGATIVITY_DOWN_A_FAMILY.rows,
      ].find((r) => r.symbol === el.symbol)
      if (printed) return { value: printed.value, source: 'ncert' }
      if (el.electronegativity === null) return null
      return { value: el.electronegativity, source: 'pubchem' }
    }
  }
}

/** Display range of each property, used for the colour scale and the trend axes. */
export const EXPLORER_DOMAIN: Record<ExplorerProperty, readonly [number, number]> = {
  radius: [60, 270],
  ionization: [370, 2400],
  gainEnthalpy: [-360, 120],
  electronegativity: [0.7, 4],
}

/** Unit label for each property. */
export const EXPLORER_UNIT: Record<ExplorerProperty, string> = {
  radius: 'pm',
  ionization: 'kJ mol⁻¹',
  gainEnthalpy: 'kJ mol⁻¹',
  electronegativity: 'Pauling',
}

/**
 * The general direction of each property, across a period (left to right) and down a
 * group (top to bottom). These are the NCERT rules, which have exceptions.
 */
export const EXPLORER_DIRECTION: Record<ExplorerProperty, { across: string; down: string }> = {
  radius: { across: 'decreases', down: 'increases' },
  ionization: { across: 'increases', down: 'decreases' },
  gainEnthalpy: { across: 'becomes more negative', down: 'becomes less negative' },
  electronegativity: { across: 'increases', down: 'decreases' },
}

/**
 * Formats a value for a heatmap cell or a readout. NCERT electronegativities keep one
 * decimal place, as printed. PubChem values are rounded (electronegativity keeps two) and
 * carry the dagger. Negative values use U+2212 minus.
 */
export function formatExplorerValue(v: SourcedValue, property: ExplorerProperty): string {
  const mark = v.source === 'pubchem' ? PUBCHEM_MARK : ''
  switch (property) {
    case 'radius':
      return `${Math.round(v.value)}`
    case 'ionization':
      return `${Math.round(v.value)}${mark}`
    case 'gainEnthalpy': {
      const n = Math.round(v.value)
      const sign = n < 0 ? '−' : n > 0 ? '+' : ''
      return `${sign}${Math.abs(n)}${mark}`
    }
    case 'electronegativity':
      return v.source === 'ncert' ? v.value.toFixed(1) : `${v.value.toFixed(2)}${mark}`
  }
}

/** One point of a row or column series. `index` is the position along the series. */
export interface ExplorerPoint {
  index: number
  Z: number
  symbol: string
  value: SourcedValue | null
}

/** A row (one period) or a column (one group) of the table. */
export type ExplorerScope = { period: number } | { group: number }

/**
 * The values along one period (in group order) or one group (in period order). Elements
 * without a value keep their place with value null, so a line breaks there.
 *
 * @throws {RangeError} If the scope is not exactly one of period 1 to 7 or group 1 to 18
 */
export function explorerSeries(property: ExplorerProperty, scope: ExplorerScope): ExplorerPoint[] {
  const keys = Object.keys(scope)
  if (keys.length !== 1 || (keys[0] !== 'period' && keys[0] !== 'group')) {
    throw new RangeError('Scope must be exactly one of { period } or { group }')
  }
  const byPeriod = 'period' in scope
  const n = byPeriod ? scope.period : (scope as { group: number }).group
  const max = byPeriod ? 7 : 18
  if (!Number.isInteger(n) || n < 1 || n > max) {
    throw new RangeError(`${byPeriod ? 'Period' : 'Group'} must be an integer from 1 to ${max} (received ${n})`)
  }

  const members = PERIODIC_TABLE.filter((e) =>
    e.group !== null && (byPeriod ? e.period === n : e.group === n),
  )
  const sorted = [...members].sort((a, b) =>
    byPeriod ? (a.group as number) - (b.group as number) : a.period - b.period,
  )
  return sorted.map((e, index) => ({
    index,
    Z: e.Z,
    symbol: e.symbol,
    value: explorerValue(e, property),
  }))
}
