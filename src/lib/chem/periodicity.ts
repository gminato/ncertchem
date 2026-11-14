/**
 * Periodicity model for NCERT Class 11 Unit 3: IUPAC names for Z above 100, element
 * location, isoelectronic series, trend series, oxide character, and the NCERT-printed
 * trend data. Element records come from periodic-data.ts; printed values come from
 * ncert-unit3-tables.ts.
 */

import { NCERT_TABLE_3_4_ROOTS, NCERT_TABLE_3_6A_RADII_ACROSS_PERIODS, NCERT_TABLE_3_6B_RADII_DOWN_A_FAMILY, NCERT_TABLE_3_8A_ELECTRONEGATIVITY_ACROSS_PERIODS, NCERT_TABLE_3_8B_ELECTRONEGATIVITY_DOWN_A_FAMILY } from './ncert-unit3-tables'
import { PERIODIC_TABLE, elementByZ, type ElementRecord } from './periodic-data'

const SUPERSCRIPT_DIGITS = ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹']

function superscript(n: number): string {
  return String(n)
    .split('')
    .map((d) => SUPERSCRIPT_DIGITS[Number(d)])
    .join('')
}

function requireInteger(value: number, name: string, min: number, max: number): void {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new RangeError(`${name} must be an integer from ${min} to ${max} (received ${value})`)
  }
}

function rootOf(digit: number): { root: string; abbreviation: string } {
  const row = NCERT_TABLE_3_4_ROOTS.rows.find((r) => r.digit === digit)
  if (!row) throw new RangeError(`No IUPAC root for digit ${digit}`)
  return { root: row.root, abbreviation: row.abbreviation }
}

/** Shared builder for systematic element names and symbols (NCERT Table 3.4 rules). */
function systematic(Z: number): { name: string; symbol: string } {
  requireInteger(Z, 'Atomic number Z', 100, 999)
  const digits = String(Z).split('').map(Number)
  const roots = digits.map(rootOf)
  let name = ''
  roots.forEach((r, i) => {
    const next = roots[i + 1]
    if (r.root === 'enn' && next && next.root === 'nil') {
      name += 'enn'
      return
    }
    name += r.root
  })
  const last = roots[roots.length - 1].root
  name += last.endsWith('i') ? 'um' : 'ium'
  const symbol = roots.map((r) => r.abbreviation).join('')
  return { name, symbol: symbol.charAt(0).toUpperCase() + symbol.slice(1) }
}

/**
 * Systematic (temporary) IUPAC name for element Z, e.g. "unnilunium" for 101 and
 * "unbinilium" for 120 (NCERT Problem 3.1). The root for each digit is taken from
 * Table 3.4 and "ium" is added at the end. A last root ending in "i" (bi, tri) takes "um".
 *
 * @throws {RangeError} If Z is not an integer from 100 to 999
 */
export function iupacName(Z: number): string {
  return systematic(Z).name
}

/**
 * Systematic IUPAC symbol for element Z: the initial letters of its roots, first letter
 * capitalised, e.g. "Unu" for 101 and "Ubn" for 120.
 *
 * @throws {RangeError} If Z is not an integer from 100 to 999
 */
export function iupacSymbol(Z: number): string {
  return systematic(Z).symbol
}

/** Location of an element in the periodic table. */
export interface ElementLocation {
  period: number
  group: number | null
  block: 's' | 'p' | 'd' | 'f'
  /** True for Z = 119 and 120, which NCERT does not tabulate and which are predicted here. */
  predicted: boolean
}

/**
 * Period, group and block of element Z (NCERT Problems 3.1 and 3.3). Z = 119 and 120 are
 * predicted to start period 8 in groups 1 and 2.
 *
 * @throws {RangeError} If Z is not an integer from 1 to 120
 */
export function locateElement(Z: number): ElementLocation {
  requireInteger(Z, 'Atomic number Z', 1, 120)
  if (Z === 119) return { period: 8, group: 1, block: 's', predicted: true }
  if (Z === 120) return { period: 8, group: 2, block: 's', predicted: true }
  const e = elementByZ(Z)
  return { period: e.period, group: e.group, block: e.block, predicted: false }
}

/** A species with a given number of electrons, from one element and an integer charge. */
export interface IsoelectronicSpecies {
  Z: number
  symbol: string
  charge: number
  label: string
}

/**
 * Electron count of the species with atomic number Z and charge: Z − charge.
 *
 * @throws {RangeError} If Z is not an integer from 1 to 118, charge is not an integer, or the
 *   result would be negative
 */
export function electronCountOf(Z: number, charge: number): number {
  requireInteger(Z, 'Atomic number Z', 1, 118)
  if (!Number.isInteger(charge)) {
    throw new RangeError(`Charge must be an integer (received ${charge})`)
  }
  const electrons = Z - charge
  if (electrons < 0) {
    throw new RangeError(`Z=${Z} with charge ${charge} would have ${electrons} electrons`)
  }
  return electrons
}

/**
 * All species with the given number of electrons and charges from −maxCharge to +maxCharge
 * (NCERT section 3.7.1(b): isoelectronic species). Sorted by Z. For 10 electrons this gives
 * N³⁻, O²⁻, F⁻, Ne, Na⁺, Mg²⁺, Al³⁺.
 *
 * @throws {RangeError} If electronCount or maxCharge is not a non-negative integer
 */
export function isoelectronicSeries(electronCount: number, maxCharge = 3): IsoelectronicSpecies[] {
  requireInteger(electronCount, 'Electron count', 0, 10000)
  requireInteger(maxCharge, 'Maximum charge', 0, 10)
  const result: IsoelectronicSpecies[] = []
  for (let charge = -maxCharge; charge <= maxCharge; charge++) {
    const Z = electronCount + charge
    if (Z < 1 || Z > 118) continue
    const { symbol } = elementByZ(Z)
    const label = charge === 0
      ? symbol
      : `${symbol}${charge > 1 || charge < -1 ? superscript(Math.abs(charge)) : ''}${charge > 0 ? '⁺' : '⁻'}`
    result.push({ Z, symbol, charge, label })
  }
  return result.sort((a, b) => a.Z - b.Z)
}

/** Properties that trendSeries can report. */
export type TrendProperty =
  | 'atomicMass'
  | 'electronegativity'
  | 'atomicRadiusPm'
  | 'firstIonizationEnergyKjPerMol'
  | 'electronAffinityEv'

/** One point of a trend: element Z and its value, or null when no value is available. */
export interface TrendPoint {
  Z: number
  symbol: string
  value: number | null
}

/**
 * Values of one property along a period or a group, in Z order. With source 'pubchem' the
 * values come from the PubChem snapshot. With source 'ncert' they are the values NCERT prints
 * (atomic radii in Tables 3.6(a) and 3.6(b), electronegativity in Tables 3.8(a) and 3.8(b)),
 * and elements NCERT does not print get null.
 *
 * @throws {RangeError} If the scope is invalid, or NCERT does not print that property
 */
export function trendSeries(
  property: TrendProperty,
  scope: { period: number } | { group: number },
  source: 'pubchem' | 'ncert' = 'pubchem',
): TrendPoint[] {
  const keys = Object.keys(scope)
  if (keys.length !== 1 || (keys[0] !== 'period' && keys[0] !== 'group')) {
    throw new RangeError('Scope must be exactly one of { period } or { group }')
  }
  const byPeriod = 'period' in scope
  if (byPeriod) requireInteger(scope.period, 'Period', 1, 7)
  else requireInteger(scope.group, 'Group', 1, 18)

  const members: ElementRecord[] = PERIODIC_TABLE.filter((e) =>
    e.group !== null && (byPeriod ? e.period === scope.period : e.group === scope.group),
  )

  if (source === 'pubchem') {
    return members.map((e) => ({ Z: e.Z, symbol: e.symbol, value: pubchemValue(e, property) }))
  }

  const table = ncertTableFor(property, byPeriod)
  return members.map((e) => {
    const row = table.find((r) => r.symbol === e.symbol)
    return { Z: e.Z, symbol: e.symbol, value: row ? row.value : null }
  })
}

function pubchemValue(e: ElementRecord, property: TrendProperty): number | null {
  switch (property) {
    case 'atomicMass':
      return e.atomicMass
    case 'electronegativity':
      return e.electronegativity
    case 'atomicRadiusPm':
      return e.atomicRadiusPm
    case 'firstIonizationEnergyKjPerMol':
      return e.firstIonizationEnergyKjPerMol
    case 'electronAffinityEv':
      return e.electronAffinityEv
  }
}

function ncertTableFor(
  property: TrendProperty,
  byPeriod: boolean,
): readonly { symbol: string; value: number }[] {
  if (property === 'atomicRadiusPm') {
    return byPeriod ? NCERT_TABLE_3_6A_RADII_ACROSS_PERIODS.rows : NCERT_TABLE_3_6B_RADII_DOWN_A_FAMILY.rows
  }
  if (property === 'electronegativity') {
    return byPeriod
      ? NCERT_TABLE_3_8A_ELECTRONEGATIVITY_ACROSS_PERIODS.rows
      : NCERT_TABLE_3_8B_ELECTRONEGATIVITY_DOWN_A_FAMILY.rows
  }
  throw new RangeError(`NCERT does not print a trend table for ${property}`)
}

/** Character of an oxide: acid-like, base-like, both, or neither. */
export type OxideNature = 'basic' | 'amphoteric' | 'acidic' | 'neutral'

/**
 * Lookup for periods 2 and 3 oxides. Na2O, Al2O3, Cl2O7, CO, NO and N2O are named in NCERT
 * section 3.7.3. The others (Li2O, MgO, CO2, SiO2, P4O10, SO3) are textbook classifications
 * that NCERT does not name, so they are flagged as such here.
 */
const OXIDE_NATURE: Readonly<Record<string, OxideNature>> = {
  Li2O: 'basic', // textbook, not named in NCERT
  MgO: 'basic', // textbook, not named in NCERT
  Na2O: 'basic', // NCERT 3.7.3
  Al2O3: 'amphoteric', // NCERT 3.7.3
  SiO2: 'acidic', // textbook, not named in NCERT
  CO2: 'acidic', // textbook, not named in NCERT
  P4O10: 'acidic', // textbook, not named in NCERT
  SO3: 'acidic', // textbook, not named in NCERT
  Cl2O7: 'acidic', // NCERT 3.7.3
  CO: 'neutral', // NCERT 3.7.3
  NO: 'neutral', // NCERT 3.7.3
  N2O: 'neutral', // NCERT 3.7.3
}

/**
 * Nature of the oxide with the given formula (periods 2 and 3 only).
 *
 * @throws {RangeError} If the formula is not in the lookup
 */
export function oxideNature(formula: string): OxideNature {
  const nature = OXIDE_NATURE[formula]
  if (!nature) throw new RangeError(`No oxide nature recorded for "${formula}"`)
  return nature
}
