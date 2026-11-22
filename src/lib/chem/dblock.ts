/**
 * Pure helpers for Class 12 Unit 4 (The d- and f-Block Elements), built on the transcribed NCERT
 * tables in ncert-c12-unit4-tables.ts. Every NCERT number comes from those tables; the functions
 * here only derive, check or format. Where NCERT gives only a figure for a property, the value
 * comes from the PubChem snapshot in data/pubchem-periodic-table.json and is labelled "PubChem".
 *
 * Data choices (lead rulings R7 and R8):
 * - The E° energy cycle (electrodeCycle) uses Table 4.4 (NCERT_THERMOCHEMISTRY) throughout.
 * - Every other number uses Table 4.2 (NCERT_FIRST_SERIES_PROPERTIES).
 * - Spin-only moments are computed: √(n(n+2)), so n = 2 gives 2.83 BM, never 2.84.
 * - Co³⁺ is blue and Co²⁺ is pink (Table 4.8 prints "bluepink" for both).
 */
import snapshot from './data/pubchem-periodic-table.json'
import { formatSig } from './kinetics'
import { blockOf, elementBySymbol } from './periodic-data'
import * as T from './ncert-c12-unit4-tables'

// ---------------------------------------------------------------------------
// Shared small helpers
// ---------------------------------------------------------------------------

const SUB_DIGITS: Record<string, string> = {
  '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
}
const SUP_DIGITS: Record<string, string> = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
  '+': '⁺', '-': '⁻',
}
const SUP_TO_ASCII: Record<string, string> = Object.fromEntries(
  Object.entries(SUP_DIGITS).map(([ascii, sup]) => [sup, ascii]),
)
const SUB_TO_ASCII: Record<string, string> = Object.fromEntries(
  Object.entries(SUB_DIGITS).map(([ascii, sub]) => [sub, ascii]),
)

function sup(text: string): string {
  return [...text].map((ch) => SUP_DIGITS[ch] ?? ch).join('')
}

function sub(text: string): string {
  return [...text].map((ch) => SUB_DIGITS[ch] ?? ch).join('')
}

/** Ion label with real superscripts, e.g. ionSymbol('Ti', 3) is "Ti³⁺". */
export function ionSymbol(symbol: string, charge: number): string {
  if (charge === 0) return symbol
  const magnitude = Math.abs(charge)
  return `${symbol}${magnitude === 1 ? '' : sup(String(magnitude))}${charge > 0 ? '⁺' : '⁻'}`
}

/** Replace ASCII digits in a formula with subscript digits (TiX4 → TiX₄). */
export function subscriptFormula(formula: string): string {
  return sub(formula)
}

/** Minus sign U+2212 for display. */
function minus(text: string): string {
  return text.replace(/-/g, '−')
}

function requireElement(symbol: string): void {
  if (elementBySymbol(symbol) === undefined) throw new RangeError(`unknown element ${symbol}`)
}

// ---------------------------------------------------------------------------
// Formatting (thin wrappers over kinetics formatSig; display only)
// ---------------------------------------------------------------------------

/** Atomic or ionic radius in pm, e.g. "160 pm". */
export function formatPm(pm: number): string {
  return `${pm} pm`
}

/** Enthalpy in kJ mol⁻¹ with a true minus sign, e.g. "−1866 kJ mol⁻¹". */
export function formatKj(kj: number): string {
  return `${minus(String(kj))} kJ mol⁻¹`
}

/** Electrode potential to 2 dp with a sign, e.g. "−0.44 V" or "+0.34 V". */
export function formatVolt(volt: number): string {
  const body = Math.abs(volt).toFixed(2)
  const sign = volt < 0 ? '−' : '+'
  return `${sign}${body} V`
}

/** Magnetic moment in Bohr magnetons to 3 significant figures (2 dp for 1 to 9.99): 2.83 for n = 2. */
export function formatMoment(mu: number): string {
  return formatSig(mu, 3)
}

// ---------------------------------------------------------------------------
// Series and outer configurations (Table 4.1)
// ---------------------------------------------------------------------------

/** Noble-gas core of each d-block series. */
export type GasCore = 'Ar' | 'Kr' | 'Xe' | 'Rn'

const SERIES_CORE: Record<T.TransitionSeries, GasCore> = { '3d': 'Ar', '4d': 'Kr', '5d': 'Xe', '6d': 'Rn' }

/** A configuration with an explicit noble-gas core (the core is not in `terms`). */
export interface CoreConfig {
  readonly core: GasCore
  /** Subshells with electrons left after the core, in NCERT order ((n−1)d before ns). Zero entries dropped. */
  readonly terms: readonly T.ConfigTerm[]
}

/** Member symbols of each d-block series, in table order (Table 4.1). */
export const D_BLOCK_SERIES: Readonly<Record<T.TransitionSeries, readonly string[]>> = {
  '3d': T.NCERT_OUTER_CONFIGURATIONS.filter((r) => r.series === '3d').map((r) => r.symbol),
  '4d': T.NCERT_OUTER_CONFIGURATIONS.filter((r) => r.series === '4d').map((r) => r.symbol),
  '5d': T.NCERT_OUTER_CONFIGURATIONS.filter((r) => r.series === '5d').map((r) => r.symbol),
  '6d': T.NCERT_OUTER_CONFIGURATIONS.filter((r) => r.series === '6d').map((r) => r.symbol),
}

/** Member symbols of a d-block series (Table 4.1). */
export function dBlockSeries(series: T.TransitionSeries): readonly string[] {
  return D_BLOCK_SERIES[series]
}

function outerRow(symbol: string): T.OuterConfigRow | undefined {
  return T.NCERT_OUTER_CONFIGURATIONS.find((r) => r.symbol === symbol)
}

/** Table 4.1 outer configuration row for a d-block element (throws for any other symbol). */
export function outerConfig(symbol: string): T.OuterConfigRow {
  const row = outerRow(symbol)
  if (row === undefined) throw new RangeError(`${symbol} is not in Table 4.1 (d-block rows only)`)
  return row
}

function isS(t: T.ConfigTerm): boolean {
  return t.subshell.endsWith('s')
}

function isD(t: T.ConfigTerm): boolean {
  return t.subshell.endsWith('d')
}

/**
 * Remove `count` electrons: ns electrons first (NCERT's rule for ions), then (n−1)d.
 * Returns the remaining non-zero terms. Throws when there are fewer electrons than `count`.
 */
function removeElectrons(terms: readonly T.ConfigTerm[], count: number): T.ConfigTerm[] {
  const left = terms.map((t) => ({ ...t }))
  let remaining = count
  for (const pass of [isS, isD]) {
    for (const t of left) {
      if (!pass(t) || remaining === 0) continue
      const take = Math.min(remaining, t.electrons)
      t.electrons -= take
      remaining -= take
    }
  }
  if (remaining > 0) throw new RangeError(`cannot remove ${count} electrons from this configuration`)
  return left.filter((t) => t.electrons > 0)
}

function displayOf(config: CoreConfig): string {
  const body = config.terms.map((t) => `${t.subshell}${sup(String(t.electrons))}`).join('')
  return body === '' ? `[${config.core}]` : `[${config.core}] ${body}`
}

export interface IonConfig extends CoreConfig {
  readonly symbol: string
  readonly charge: number
  /** Display string with real superscripts, e.g. "[Ar] 3d⁶" for Fe²⁺. */
  readonly display: string
}

/**
 * Configuration of the ion M^(charge)+ built from Table 4.1: ns electrons are removed before
 * (n−1)d. Charge 0 gives the atom. Throws for non-d-block symbols or when charge exceeds the
 * electrons available.
 */
export function ionConfig(symbol: string, charge: number): IonConfig {
  const row = outerConfig(symbol)
  if (!Number.isInteger(charge) || charge < 0) throw new RangeError(`charge must be a non-negative integer`)
  const core = SERIES_CORE[row.series]
  const terms = removeElectrons(row.config.terms, charge)
  const config: CoreConfig = { core, terms }
  return { symbol, charge, core, terms, display: displayOf(config) }
}

/** Number of d electrons in the atom or in an ion (ionConfig's d subshell, 0 if none). */
export function dElectronCount(symbol: string, charge = 0): number {
  const config = ionConfig(symbol, charge)
  return config.terms.find(isD)?.electrons ?? 0
}

export interface TransitionVerdict {
  readonly verdict: boolean
  readonly reason: string
}

/** Common ion charges to test: Table 4.3 states for Sc to Zn, otherwise +1 and +2. */
function commonCharges(symbol: string): number[] {
  const states = T.NCERT_OXIDATION_STATES[symbol]
  return states === undefined ? [1, 2] : states.map((s) => s.state)
}

/** Digits as Unicode superscripts, for UI text such as d¹⁰. */
function supDigits(n: number): string {
  return String(n)
    .split('')
    .map((c) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[Number(c)])
    .join('')
}

/**
 * IUPAC definition: a transition element has an incomplete d subshell in the atom or in a
 * common ion. Checked here against the atom and every ion of charge 1 up to the electrons
 * outside the core. f-block symbols get verdict false with the f-block reason.
 */
export function isTransitionElement(symbol: string): TransitionVerdict {
  requireElement(symbol)
  const row = outerRow(symbol)
  if (row === undefined) {
    const block = blockOf(elementBySymbol(symbol)!.Z)
    return {
      verdict: false,
      reason: `${symbol} is in the ${block}-block, not a d-block element in Table 4.1, so it is not counted as a transition element here`,
    }
  }
  const atomD = dElectronCount(symbol, 0)
  if (atomD >= 1 && atomD <= 9) {
    return { verdict: true, reason: `the atom has an incomplete d subshell (${atomD} d electron${atomD === 1 ? '' : 's'})` }
  }
  const outerTotal = row.config.terms.reduce((sum, t) => sum + t.electrons, 0)
  for (const charge of commonCharges(symbol).filter((c) => c <= outerTotal)) {
    const d = dElectronCount(symbol, charge)
    if (d >= 1 && d <= 9) {
      return {
        verdict: true,
        reason: `the ion ${ionSymbol(symbol, charge)} has an incomplete d subshell (${d} d electron${d === 1 ? '' : 's'})`,
      }
    }
  }
  return {
    verdict: false,
    reason: `the atom and its common ions have a full or empty d subshell (d${supDigits(atomD)} in the atom), as for Zn, Cd and Hg`,
  }
}

// ---------------------------------------------------------------------------
// Unpaired electrons, spin-only moment, exchange pairs
// ---------------------------------------------------------------------------

/**
 * Unpaired electrons for a d^n ion. 'high' (default, the octahedral high-spin count that NCERT
 * Table 4.7 uses): n for n ≤ 5, else 10 − n. 'low': octahedral low-spin count.
 */
export function unpairedElectrons(dCount: number, spin: 'high' | 'low' = 'high'): number {
  if (!Number.isInteger(dCount) || dCount < 0 || dCount > 10) throw new RangeError(`d count must be 0 to 10`)
  if (spin === 'high') return dCount <= 5 ? dCount : 10 - dCount
  const lowSpin = [0, 1, 2, 3, 2, 1, 0, 1, 2, 1, 0]
  return lowSpin[dCount]!
}

/** Spin-only magnetic moment √(n(n+2)) in Bohr magnetons (unrounded). */
export function spinOnlyMoment(n: number): number {
  if (!Number.isInteger(n) || n < 0) throw new RangeError(`unpaired count must be a non-negative integer`)
  return Math.sqrt(n * (n + 2))
}

/** Number of pairwise exchanges between n same-spin electrons: n(n−1)/2 (exchange energy story). */
export function exchangePairs(sameSpinCount: number): number {
  if (!Number.isInteger(sameSpinCount) || sameSpinCount < 0) throw new RangeError('count must be a non-negative integer')
  return sameSpinCount <= 1 ? 0 : (sameSpinCount * (sameSpinCount - 1)) / 2
}

// ---------------------------------------------------------------------------
// Oxidation states (Table 4.3) and example species (Tables 4.5, 4.6)
// ---------------------------------------------------------------------------

export type OxidationStateEntry = T.OxidationStateEntry

/** Oxidation states of Sc to Zn from Table 4.3, with `common` set where NCERT marks them. */
export function oxidationStates(symbol: string): readonly OxidationStateEntry[] {
  const entries = T.NCERT_OXIDATION_STATES[symbol]
  if (entries === undefined) throw new RangeError(`${symbol} is not in Table 4.3 (Sc to Zn only)`)
  return entries
}

export function oxidationStateCount(symbol: string): number {
  return oxidationStates(symbol).length
}

export interface ExampleHalide {
  /** Formula with X for the halogen, subscripts applied (TiX₄). */
  readonly formula: string
  readonly key: T.HalideKey
}

export interface ExampleOxide {
  /** Formula with subscripts (Mn₂O₇). */
  readonly formula: string
  readonly mixed: boolean
  readonly bracketed: boolean
}

/**
 * Species NCERT prints for a metal in a given oxidation state: oxides from Table 4.6 and halides
 * from Table 4.5. Only the formulas NCERT prints are returned.
 */
export function exampleSpecies(symbol: string, state: number): { oxides: ExampleOxide[]; halides: ExampleHalide[] } {
  return {
    oxides: T.NCERT_OXIDES.filter((o) => o.metal === symbol && o.oxidationState === state).map((o) => ({
      formula: subscriptFormula(o.formula),
      mixed: o.mixed,
      bracketed: o.bracketed,
    })),
    halides: T.NCERT_HALIDES.filter((h) => h.metal === symbol && h.oxidationState === state).map((h) => ({
      formula: subscriptFormula(h.formula),
      key: h.key,
    })),
  }
}

/** Table 4.5 key text: which halogens the X in a formula stands for. */
export function halideKeyText(key: T.HalideKey): string {
  switch (key) {
    case 'F': return 'F'
    case 'X': return 'F, Cl, Br, I'
    case 'XI': return 'F, Br'
    case 'XII': return 'F, Cl'
    case 'XIII': return 'Cl, I'
  }
}

// ---------------------------------------------------------------------------
// E° energy cycle (Table 4.4, lead ruling R7) and Table 4.2 potentials
// ---------------------------------------------------------------------------

export interface ElectrodeCycle {
  readonly symbol: string
  /** ΔaH°(M), kJ mol⁻¹. */
  readonly atomisation: number
  /** ΔiH₁° + ΔiH₂°, kJ mol⁻¹. */
  readonly ie1PlusIe2: number
  /** ΔhydH°(M²⁺), kJ mol⁻¹. */
  readonly hydration: number
  /** Sum of the four terms, kJ mol⁻¹ (atomisation + IE1 + IE2 + hydration). */
  readonly sum: number
  /** E°(M²⁺/M), V, from Table 4.4. */
  readonly eStandard: number
}

/** Table 4.4 energy cycle for M²⁺/M (Ti to Zn; Sc is not tabulated). Uses Table 4.4 throughout (R7). */
export function electrodeCycle(symbol: string): ElectrodeCycle {
  const row = T.NCERT_THERMOCHEMISTRY.find((r) => r.symbol === symbol)
  if (row === undefined) throw new RangeError(`${symbol} is not in Table 4.4 (Ti to Zn only)`)
  const ie1PlusIe2 = row.ie1KJ + row.ie2KJ
  return {
    symbol,
    atomisation: row.atomisationKJ,
    ie1PlusIe2,
    hydration: row.hydrationKJ,
    sum: row.atomisationKJ + ie1PlusIe2 + row.hydrationKJ,
    eStandard: row.eVolt,
  }
}

function firstSeriesRow(symbol: string): T.FirstSeriesRow {
  const row = T.NCERT_FIRST_SERIES_PROPERTIES.find((r) => r.symbol === symbol)
  if (row === undefined) throw new RangeError(`${symbol} is not in Table 4.2 (Sc to Zn only)`)
  return row
}

/** E°(M²⁺/M) in V from Table 4.2, or null where NCERT prints "–" (Sc). */
export function eStandardM2(symbol: string): number | null {
  return firstSeriesRow(symbol).eM2PlusVolt
}

/** E°(M³⁺/M²⁺) in V from Table 4.2, or null where NCERT prints "–". */
export function eStandardM3M2(symbol: string): number | null {
  return firstSeriesRow(symbol).eM3PlusM2PlusVolt
}

/** True when E°(M²⁺/M) < 0 (the metal liberates H₂ from dilute acid); null where Table 4.2 has no value. */
export function liberatesH2FromDiluteAcid(symbol: string): boolean | null {
  const e = eStandardM2(symbol)
  return e === null ? null : e < 0
}

// ---------------------------------------------------------------------------
// Aqua-ion colours (Table 4.8) and the spectral colour wheel
// ---------------------------------------------------------------------------

/** Spectral colour wheel, six sectors in order. Complementary = index + 3 (mod 6). */
export const COLOUR_WHEEL = ['red', 'orange', 'yellow', 'green', 'blue', 'violet'] as const
export type SpectralKey = (typeof COLOUR_WHEEL)[number]

/** Complementary colour on the six-sector wheel: red↔green, orange↔blue, yellow↔violet. */
export function complementaryColour(colour: SpectralKey): SpectralKey {
  const index = COLOUR_WHEEL.indexOf(colour)
  if (index < 0) throw new RangeError(`${colour} is not on the colour wheel`)
  return COLOUR_WHEEL[(index + 3) % 6]!
}

/**
 * Keys the vocab's ION_COLOUR_TOKEN uses (components/vocab/dblock/tones.ts, ION_COLOUR_KEYS).
 * Mirrored here, not imported, because the vocab lives in another module; the test pins this list.
 */
export const ION_COLOUR_KEYS = [
  'ti3', 'v4', 'v3', 'v2', 'cr3', 'cr2', 'mn3', 'mn2', 'fe3', 'fe2', 'co3', 'co2', 'ni2', 'cu2',
  'colourless', 'cro4', 'cr2o7', 'mno4', 'mno4-2', 'mno2',
] as const
export type IonColourKey = (typeof ION_COLOUR_KEYS)[number]

/** Aqua-ion key for each Table 4.8 ion that the vocab colours. */
const AQUA_KEY: Readonly<Record<string, IonColourKey>> = {
  'Ti³⁺': 'ti3', 'V⁴⁺': 'v4', 'V³⁺': 'v3', 'V²⁺': 'v2', 'Cr³⁺': 'cr3', 'Cr²⁺': 'cr2',
  'Mn³⁺': 'mn3', 'Mn²⁺': 'mn2', 'Fe³⁺': 'fe3', 'Fe²⁺': 'fe2', 'Co³⁺': 'co3', 'Co²⁺': 'co2',
  'Ni²⁺': 'ni2', 'Cu²⁺': 'cu2', 'Sc³⁺': 'colourless', 'Ti⁴⁺': 'colourless', 'Zn²⁺': 'colourless',
}

export interface AquaIonColour {
  readonly ion: string
  /** Colour name; Co³⁺ and Co²⁺ are blue and pink (R8/R7), not the printed "bluepink". */
  readonly colour: string
  /** Colour exactly as Table 4.8 prints it. */
  readonly printed: string
  readonly key: IonColourKey
}

/** Accepts ASCII ("Ti3+", "Co2+") or superscript ("Co²⁺") ion names. */
function normaliseIon(ion: string): string {
  const withSup = ion.replace(/(\d*)([+-])$/, (_, digits: string, sign: string) => {
    const magnitude = digits === '' ? '' : sup(digits)
    return `${magnitude}${sign === '+' ? '⁺' : '⁻'}`
  })
  return withSup
}

/** Table 4.8 colour and vocab key for an aqua ion; null for ions not in Table 4.8. */
export function aquaIonColour(ion: string): AquaIonColour | null {
  const name = normaliseIon(ion)
  const row = T.NCERT_AQUA_COLOURS.find((r) => r.ion === name)
  const key = AQUA_KEY[name]
  if (row === undefined || key === undefined) return null
  const colour = name === 'Co³⁺' ? 'blue' : name === 'Co²⁺' ? 'pink' : row.colour
  return { ion: name, colour, printed: row.colour, key }
}

/** True for d⁰ and d¹⁰ ions, which are colourless (Table 4.8 pattern). */
export function isColourlessByConfig(dCount: number): boolean {
  return dCount === 0 || dCount === 10
}

// ---------------------------------------------------------------------------
// Redox: structured equations, balance check, titration
// ---------------------------------------------------------------------------

/** One species in an equation. `formula` is ASCII (e.g. "Cr2O7"); the electron is "e" with charge −1. */
export interface EquationTerm {
  readonly coefficient: number
  readonly formula: string
  readonly charge: number
}

export interface StructuredEquation {
  readonly reactants: readonly EquationTerm[]
  readonly products: readonly EquationTerm[]
}

function parseCharge(text: string): number {
  const sign = text.includes('-') ? -1 : 1
  const digits = text.replace(/[+-]/g, '')
  return sign * (digits === '' ? 1 : Number(digits))
}

function parseTerm(raw: string): EquationTerm {
  let text = raw.trim().replace(/\([a-z]+\)$/, '')
  let charge = 0
  const superRun = /[⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻]+$/.exec(text)
  if (superRun) {
    charge = parseCharge([...superRun[0]].map((ch) => SUP_TO_ASCII[ch] ?? '').join(''))
    text = text.slice(0, superRun.index)
  }
  const lead = /^\d+/.exec(text)
  const coefficient = lead ? Number(lead[0]) : 1
  const formula = [...text.slice(lead ? lead[0].length : 0)].map((ch) => SUB_TO_ASCII[ch] ?? ch).join('')
  return { coefficient, formula, charge }
}

/**
 * Parse a printed equation (Unicode, as NCERT writes it), e.g.
 * "Cr₂O₇²⁻ + 14H⁺ + 6e⁻ → 2Cr³⁺ + 7H₂O". Terms split on " + " and " → ".
 */
export function parseEquation(text: string): StructuredEquation {
  const sides = text.split(' → ')
  if (sides.length !== 2) throw new RangeError(`equation needs one arrow: ${text}`)
  return {
    reactants: sides[0]!.split(' + ').map(parseTerm),
    products: sides[1]!.split(' + ').map(parseTerm),
  }
}

function atomsOf(formula: string): Record<string, number> {
  const counts: Record<string, number> = {}
  if (formula === 'e') return counts
  for (const match of formula.matchAll(/([A-Z][a-z]?)(\d*)/g)) {
    const element = match[1]!
    counts[element] = (counts[element] ?? 0) + (match[2] === '' ? 1 : Number(match[2]))
  }
  return counts
}

function totals(terms: readonly EquationTerm[]): { atoms: Record<string, number>; charge: number } {
  const atoms: Record<string, number> = {}
  let charge = 0
  for (const term of terms) {
    for (const [element, count] of Object.entries(atomsOf(term.formula))) {
      atoms[element] = (atoms[element] ?? 0) + count * term.coefficient
    }
    charge += term.charge * term.coefficient
  }
  return { atoms, charge }
}

export interface BalanceReport {
  readonly balanced: boolean
  readonly atomsBalanced: boolean
  readonly chargeBalanced: boolean
  readonly leftAtoms: Readonly<Record<string, number>>
  readonly rightAtoms: Readonly<Record<string, number>>
  readonly leftCharge: number
  readonly rightCharge: number
}

/** Check atoms and charge of an equation (printed string or structured). Electrons count as charge −1. */
export function balanceCheck(equation: string | StructuredEquation): BalanceReport {
  const eq = typeof equation === 'string' ? parseEquation(equation) : equation
  const left = totals(eq.reactants)
  const right = totals(eq.products)
  const elements = new Set([...Object.keys(left.atoms), ...Object.keys(right.atoms)])
  const atomsBalanced = [...elements].every((el) => (left.atoms[el] ?? 0) === (right.atoms[el] ?? 0))
  const chargeBalanced = left.charge === right.charge
  return {
    balanced: atomsBalanced && chargeBalanced,
    atomsBalanced,
    chargeBalanced,
    leftAtoms: left.atoms,
    rightAtoms: right.atoms,
    leftCharge: left.charge,
    rightCharge: right.charge,
  }
}

/** Electrons transferred in a half-equation (the coefficient of e⁻, on whichever side it sits). */
export function electronsTransferred(equation: string | StructuredEquation): number {
  const eq = typeof equation === 'string' ? parseEquation(equation) : equation
  const electrons = [...eq.reactants, ...eq.products].filter((t) => t.formula === 'e')
  return electrons.reduce((sum, t) => sum + t.coefficient, 0)
}

function printedEquation(id: string): { text: string; eVolt: number | undefined } {
  const found = T.NCERT_OXIDANT_EQUATIONS.find((e) => e.id === id)
  if (found === undefined) throw new RangeError(`no printed equation ${id}`)
  return { text: found.equation, eVolt: found.eVolt }
}

export interface HalfEquation {
  readonly id: string
  /** Printed equation (Unicode). */
  readonly text: string
  readonly structured: StructuredEquation
  /** Electrons transferred, from the equation itself. */
  readonly electrons: number
  /** E° in V as NCERT states it, when it does. */
  readonly eVolt: number | undefined
}

function halfEquation(id: string): HalfEquation {
  const { text, eVolt } = printedEquation(id)
  const structured = parseEquation(text)
  return { id, text, structured, electrons: electronsTransferred(structured), eVolt }
}

/** Dichromate (acid) and permanganate (acid, to Mn²⁺) half-equations as printed (p. 106-107). */
export const OXIDANT_HALF_EQUATIONS = {
  dichromateAcid: halfEquation('dichromate-acid-half'),
  permanganateAcid: halfEquation('permanganate-to-mn2plus-half'),
} as const

export type OxidantKey = 'MnO4-' | 'Cr2O7 2-'

const TITRATION_EQUATION: Readonly<Record<OxidantKey, string>> = {
  'MnO4-': 'permanganate-iron-acid',
  'Cr2O7 2-': 'dichromate-iron-full',
}

export interface TitrationRatio {
  readonly oxidant: OxidantKey
  /** Moles of Fe²⁺ per mole of oxidant, read off the printed redox equation (5 and 6). */
  readonly fe2PerOxidant: number
  /** Printed equation id the ratio is read from. */
  readonly equationId: string
}

/** Fe²⁺ : oxidant ratio for a titration, read from the printed equation (p. 106-107). */
export function titrationRatio(oxidant: OxidantKey): TitrationRatio {
  const equationId = TITRATION_EQUATION[oxidant]
  const eq = parseEquation(printedEquation(equationId).text)
  const fe = eq.reactants.find((t) => t.formula === 'Fe' && t.charge === 2)
  const ox = eq.reactants.find((t) => t.formula === (oxidant === 'MnO4-' ? 'MnO4' : 'Cr2O7') && t.charge < 0)
  if (fe === undefined || ox === undefined) throw new RangeError(`no Fe²⁺ and oxidant in ${equationId}`)
  return { oxidant, fe2PerOxidant: fe.coefficient / ox.coefficient, equationId }
}

/** Moles of oxidant and of Fe²⁺ reacted, from molarity (mol dm⁻³) and volume (cm³). */
export function titrationMoles(args: {
  readonly oxidant: OxidantKey
  readonly oxidantMolarity: number
  readonly oxidantVolumeMl: number
}): { readonly oxidantMol: number; readonly fe2Mol: number; readonly fe2PerOxidant: number } {
  const ratio = titrationRatio(args.oxidant)
  const oxidantMol = args.oxidantMolarity * (args.oxidantVolumeMl / 1000)
  return { oxidantMol, fe2Mol: ratio.fe2PerOxidant * oxidantMol, fe2PerOxidant: ratio.fe2PerOxidant }
}

/** Unknown Fe²⁺ molarity (mol dm⁻³) from a titration with a standard oxidant. */
export function unknownFe2Molarity(args: {
  readonly oxidant: OxidantKey
  readonly oxidantMolarity: number
  readonly oxidantVolumeMl: number
  readonly fe2VolumeMl: number
}): number {
  if (args.fe2VolumeMl <= 0) throw new RangeError('Fe²⁺ volume must be positive')
  const { fe2Mol } = titrationMoles(args)
  return fe2Mol / (args.fe2VolumeMl / 1000)
}

// ---------------------------------------------------------------------------
// Lanthanoids and actinoids (Tables 4.9, 4.10, 4.11)
// ---------------------------------------------------------------------------

/** Ln³⁺ radii from Table 4.9 (La to Yb; Lu has no printed value). */
export function lanthanoidRadii(): readonly { symbol: string; Z: number; radiusPm: number }[] {
  return T.NCERT_LANTHANOIDS.filter((r) => r.radiusLn3PlusPm !== null).map((r) => ({
    symbol: r.symbol, Z: r.Z, radiusPm: r.radiusLn3PlusPm!,
  }))
}

/** Actinoid radii from Table 4.10 where NCERT prints them (M³⁺ and M⁴⁺). */
export function actinoidRadii(): readonly { symbol: string; Z: number; radiusM3PlusPm: number | null; radiusM4PlusPm: number | null }[] {
  return T.NCERT_ACTINOIDS.filter((r) => r.radiusM3PlusPm !== null || r.radiusM4PlusPm !== null).map((r) => ({
    symbol: r.symbol, Z: r.Z, radiusM3PlusPm: r.radiusM3PlusPm, radiusM4PlusPm: r.radiusM4PlusPm,
  }))
}

/** Number of f electrons in M^(charge)+ of a lanthanoid (Table 4.9) or actinoid (Table 4.10). */
export function fCount(symbol: string, charge: number): number {
  const ln = T.NCERT_LANTHANOIDS.find((r) => r.symbol === symbol)
  const an = T.NCERT_ACTINOIDS.find((r) => r.symbol === symbol)
  if (ln === undefined && an === undefined) throw new RangeError(`${symbol} is not a lanthanoid or actinoid in the tables`)
  const config = ln !== undefined
    ? { 0: ln.ln, 2: ln.ln2Plus, 3: ln.ln3Plus, 4: ln.ln4Plus }[charge]
    : { 0: an!.m, 3: an!.m3Plus, 4: an!.m4Plus }[charge]
  if (config === undefined || config === null) throw new RangeError(`no printed configuration for ${symbol}${charge}+`)
  return config.terms.find((t) => t.subshell.endsWith('f'))?.electrons ?? 0
}

export interface SpecialLanthanoidState {
  readonly ion: string
  readonly symbol: string
  readonly charge: number
  readonly fCount: number
  readonly reason: string
}

/** The four Ln ions NCERT singles out for their f count (Ce⁴⁺, Eu²⁺, Yb²⁺, Tb⁴⁺). */
export function specialLanthanoidStates(): readonly SpecialLanthanoidState[] {
  const specials: Array<[string, number, string]> = [
    ['Ce', 4, 'f⁰: empty 4f, like the xenon core'],
    ['Eu', 2, 'f⁷: half-filled 4f'],
    ['Yb', 2, 'f¹⁴: full 4f'],
    ['Tb', 4, 'f⁷: half-filled 4f'],
  ]
  return specials.map(([symbol, charge, reason]) => ({
    ion: ionSymbol(symbol, charge), symbol, charge, fCount: fCount(symbol, charge), reason,
  }))
}

/** Oxidation states of an actinoid from Table 4.11. */
export function actinoidOxidationStates(symbol: string): readonly number[] {
  const states = T.NCERT_ACTINOID_OXIDATION_STATES[symbol]
  if (states === undefined) throw new RangeError(`${symbol} is not in Table 4.11`)
  return states
}

// ---------------------------------------------------------------------------
// Industrial catalysts (Section 11; NCERT pp. 113-114)
// ---------------------------------------------------------------------------

export interface IndustrialCatalyst {
  readonly process: string
  readonly catalyst: string
  /** Overall balanced equation, or null where the product has no fixed stoichiometry (polymers, fats). */
  readonly overall: StructuredEquation | null
  /** Printed form of `overall`, Unicode (null when `overall` is null). */
  readonly overallText: string | null
  /** The d-block property that makes the catalyst work. */
  readonly propertyUsed: string
  readonly page: number
}

function catalystEntry(
  process: string, catalyst: string, overallText: string | null, propertyUsed: string, page: number,
): IndustrialCatalyst {
  return {
    process,
    catalyst,
    overall: overallText === null ? null : parseEquation(overallText),
    overallText,
    propertyUsed,
    page,
  }
}

export const INDUSTRIAL_CATALYSTS: readonly IndustrialCatalyst[] = [
  catalystEntry('Contact process', 'V₂O₅', '2SO₂ + O₂ → 2SO₃',
    'variable oxidation state of V (V(V) and V(IV)) passes oxygen between the SO₂ and the solid', 113),
  catalystEntry('Haber process', 'finely divided Fe', 'N₂ + 3H₂ → 2NH₃',
    'the metal surface adsorbs and weakens the N≡N and H–H bonds', 113),
  catalystEntry('Ziegler catalysts (polyethylene)', 'TiCl₄ with Al(CH₃)₃', null,
    'Ti in the catalyst forms bonds to ethene and inserts it (polymer, no fixed stoichiometry)', 113),
  catalystEntry('Hydrogenation of fats', 'Ni', null,
    'Ni surface adsorbs H₂ and the unsaturated fat (no fixed stoichiometry)', 113),
  catalystEntry('Wacker process', 'PdCl₂', '2C₂H₄ + O₂ → 2CH₃CHO',
    'Pd(II) oxidises ethene to ethanal and is reduced to Pd(0) (ERRATA: ethene, not ethyne)', 114),
]

// ---------------------------------------------------------------------------
// Physical data: NCERT Table 4.2 where printed, otherwise PubChem
// ---------------------------------------------------------------------------

export interface SourcedValue<V> {
  readonly value: V
  /** 'NCERT Table 4.2' where NCERT prints the value; 'PubChem' from the snapshot. */
  readonly source: 'NCERT Table 4.2' | 'PubChem'
}

export interface DBlockPhysical {
  readonly symbol: string
  /** Density, g cm⁻³. */
  readonly density: SourcedValue<number | null>
  /** Melting point, K (PubChem). */
  readonly meltingPointK: SourcedValue<number | null>
  /** Boiling point, K (PubChem). */
  readonly boilingPointK: SourcedValue<number | null>
}

type SnapshotTable = { Table: { Columns: { Column: string[] }; Row: Array<{ Cell: string[] }> } }
const pubchemRows: ReadonlyMap<string, Record<string, string>> = (() => {
  const table = (snapshot as unknown as SnapshotTable).Table
  const map = new Map<string, Record<string, string>>()
  for (const row of table.Row) {
    const record: Record<string, string> = {}
    table.Columns.Column.forEach((name, i) => { record[name] = row.Cell[i] ?? '' })
    map.set(record.Symbol!, record)
  }
  return map
})()

function pubchemNumber(symbol: string, column: string): number | null {
  const raw = pubchemRows.get(symbol)?.[column] ?? ''
  const value = Number(raw)
  return raw.trim() === '' || !Number.isFinite(value) ? null : value
}

/** Density, melting point and boiling point for a d-block element, each with its source. */
export function dBlockPhysical(symbol: string): DBlockPhysical {
  requireElement(symbol)
  const printed = T.NCERT_FIRST_SERIES_PROPERTIES.find((r) => r.symbol === symbol)?.densityGPerCm3 ?? null
  const density: SourcedValue<number | null> = printed !== null
    ? { value: printed, source: 'NCERT Table 4.2' }
    : { value: pubchemNumber(symbol, 'Density'), source: 'PubChem' }
  return {
    symbol,
    density,
    // PubChem: NCERT gives no melting or boiling point for these elements in the tables.
    meltingPointK: { value: pubchemNumber(symbol, 'MeltingPoint'), source: 'PubChem' },
    boilingPointK: { value: pubchemNumber(symbol, 'BoilingPoint'), source: 'PubChem' },
  }
}
