/**
 * Reference data from NCERT Class 12 Chemistry Part I, Unit 4 (The d- and f-Block Elements),
 * book pp. 90-114. Values are as NCERT prints them unless an NCERT_UNIT4_ERRATA entry says
 * otherwise. Page numbers are book page numbers. Nothing here has been "corrected": where NCERT
 * is internally inconsistent or looks wrong, the printed value is kept and the doubt is listed in
 * NCERT_UNIT4_ERRATA.
 *
 * - Table 4.1 outer configurations of the 3d, 4d, 5d and 6d series (p. 90)
 * - Table 4.2 configurations and properties of Sc-Zn (p. 94)
 * - Table 4.3 oxidation states of Sc-Zn, with the most common ones flagged (p. 96)
 * - Table 4.4 thermochemical data and E° for Ti-Zn (p. 99)
 * - Table 4.5 formulas of 3d halides (p. 99); Table 4.6 formulas of 3d oxides (p. 100)
 * - Table 4.7 calculated and observed magnetic moments (p. 102)
 * - Table 4.8 colours of aquated first-row ions (p. 103)
 * - Table 4.9 lanthanoid configurations and radii (p. 110)
 * - Table 4.10 actinoid configurations and radii (p. 111); Table 4.11 actinoid oxidation states (p. 112)
 * - Named facts and equations stated in the running text (p. 94-114)
 *
 * Worked examples, Intext Questions and Exercises are deliberately not transcribed (ADR-0001).
 */

/** Superscript and subscript digits, the site convention (no caret or underscore notation). */
const SUP: Record<string, string> = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
  '+': '⁺', '-': '⁻',
}

function superscript(text: string): string {
  return [...text].map((ch) => SUP[ch] ?? ch).join('')
}

/** One subshell and its electron count, as NCERT prints it (e.g. 3d with 5). */
export interface ConfigTerm {
  readonly subshell: string
  readonly electrons: number
}

/**
 * An electronic configuration as printed. `core` is the noble-gas core in brackets when NCERT
 * writes one (Table 4.2: [Ar] for Sc³⁺). Terms are in the order NCERT writes them.
 */
export interface Config {
  readonly core?: 'Ar'
  readonly terms: readonly ConfigTerm[]
}

/**
 * Display string with real superscripts, e.g. `3d⁵4s¹`. Zero-electron subshells are kept when
 * `keepZero` is true (NCERT prints 4f⁰) and dropped otherwise (Table 4.1 Pd prints 5s⁰ in the
 * table, but the display string omits it).
 */
export function configDisplay(config: Config, keepZero = true): string {
  const core = config.core ? `[${config.core}] ` : ''
  const body = config.terms
    .filter((t) => keepZero || t.electrons > 0)
    .map((t) => `${t.subshell}${superscript(String(t.electrons))}`)
    .join('')
  return `${core}${body}`.trim()
}

const c = (...terms: Array<[string, number]>): Config => ({
  terms: terms.map(([subshell, electrons]) => ({ subshell, electrons })),
})
const cAr = (...terms: Array<[string, number]>): Config => ({
  core: 'Ar',
  terms: terms.map(([subshell, electrons]) => ({ subshell, electrons })),
})

// ---------------------------------------------------------------------------
// Table 4.1 (p. 90): outer orbital configurations, ground state
// ---------------------------------------------------------------------------

export type TransitionSeries = '3d' | '4d' | '5d' | '6d'

export interface OuterConfigRow {
  readonly symbol: string
  readonly Z: number
  readonly series: TransitionSeries
  /** Outer configuration as printed: ns first, then (n−1)d, with the zero entry NCERT prints. */
  readonly config: Config
  /** Display string with superscripts; see configDisplay (zero subshells omitted). */
  readonly display: string
}

/** NCERT writes (n−1)d before ns, so d and f subshells are ordered first. */
function outer(symbol: string, Z: number, series: TransitionSeries, config: Config): OuterConfigRow {
  const terms = [...config.terms].sort((a, b) => Number(a.subshell.endsWith('s')) - Number(b.subshell.endsWith('s')))
  const ordered: Config = { terms }
  return { symbol, Z, series, config: ordered, display: configDisplay(ordered, false) }
}

/** Table 4.1 as printed. The 6d series is printed as Ac and Rf-Cn (Ac is La's congener). */
export const NCERT_OUTER_CONFIGURATIONS: readonly OuterConfigRow[] = [
  outer('Sc', 21, '3d', c(['4s', 2], ['3d', 1])),
  outer('Ti', 22, '3d', c(['4s', 2], ['3d', 2])),
  outer('V', 23, '3d', c(['4s', 2], ['3d', 3])),
  outer('Cr', 24, '3d', c(['4s', 1], ['3d', 5])),
  outer('Mn', 25, '3d', c(['4s', 2], ['3d', 5])),
  outer('Fe', 26, '3d', c(['4s', 2], ['3d', 6])),
  outer('Co', 27, '3d', c(['4s', 2], ['3d', 7])),
  outer('Ni', 28, '3d', c(['4s', 2], ['3d', 8])),
  outer('Cu', 29, '3d', c(['4s', 1], ['3d', 10])),
  outer('Zn', 30, '3d', c(['4s', 2], ['3d', 10])),
  outer('Y', 39, '4d', c(['5s', 2], ['4d', 1])),
  outer('Zr', 40, '4d', c(['5s', 2], ['4d', 2])),
  outer('Nb', 41, '4d', c(['5s', 1], ['4d', 4])),
  outer('Mo', 42, '4d', c(['5s', 1], ['4d', 5])),
  outer('Tc', 43, '4d', c(['5s', 1], ['4d', 6])),
  outer('Ru', 44, '4d', c(['5s', 1], ['4d', 7])),
  outer('Rh', 45, '4d', c(['5s', 1], ['4d', 8])),
  outer('Pd', 46, '4d', c(['5s', 0], ['4d', 10])),
  outer('Ag', 47, '4d', c(['5s', 1], ['4d', 10])),
  outer('Cd', 48, '4d', c(['5s', 2], ['4d', 10])),
  outer('La', 57, '5d', c(['6s', 2], ['5d', 1])),
  outer('Hf', 72, '5d', c(['6s', 2], ['5d', 2])),
  outer('Ta', 73, '5d', c(['6s', 2], ['5d', 3])),
  outer('W', 74, '5d', c(['6s', 2], ['5d', 4])),
  outer('Re', 75, '5d', c(['6s', 2], ['5d', 5])),
  outer('Os', 76, '5d', c(['6s', 2], ['5d', 6])),
  outer('Ir', 77, '5d', c(['6s', 2], ['5d', 7])),
  outer('Pt', 78, '5d', c(['6s', 1], ['5d', 9])),
  outer('Au', 79, '5d', c(['6s', 1], ['5d', 10])),
  outer('Hg', 80, '5d', c(['6s', 2], ['5d', 10])),
  outer('Ac', 89, '6d', c(['7s', 2], ['6d', 1])),
  outer('Rf', 104, '6d', c(['7s', 2], ['6d', 2])),
  outer('Db', 105, '6d', c(['7s', 2], ['6d', 3])),
  outer('Sg', 106, '6d', c(['7s', 2], ['6d', 4])),
  outer('Bh', 107, '6d', c(['7s', 2], ['6d', 5])),
  outer('Hs', 108, '6d', c(['7s', 2], ['6d', 6])),
  outer('Mt', 109, '6d', c(['7s', 2], ['6d', 7])),
  outer('Ds', 110, '6d', c(['7s', 2], ['6d', 8])),
  outer('Rg', 111, '6d', c(['7s', 1], ['6d', 10])),
  outer('Cn', 112, '6d', c(['7s', 2], ['6d', 10])),
]

// ---------------------------------------------------------------------------
// Table 4.2 (p. 94): configurations and properties, Sc-Zn
// ---------------------------------------------------------------------------

export interface FirstSeriesRow {
  readonly symbol: string
  readonly Z: number
  /** Configuration of the atom M. */
  readonly configM: Config
  /** Configuration of M⁺ as printed (NCERT prints the M⁺ row; Cr⁺ and Cu⁺ shown as printed). */
  readonly configMPlus: Config
  /** Configuration of M²⁺ and M³⁺ (null where NCERT prints "–"). */
  readonly configM2Plus: Config | null
  readonly configM3Plus: Config | null
  /** Enthalpy of atomisation ΔaH°, kJ mol⁻¹ (Table 4.2 values; see ERRATA for Table 4.4). */
  readonly atomisationKJ: number
  readonly ie1KJ: number
  readonly ie2KJ: number
  readonly ie3KJ: number
  /** Metallic radius of M, pm. */
  readonly radiusMetalPm: number
  /** Ionic radii, pm (null where NCERT prints "–"). */
  readonly radiusM2PlusPm: number | null
  readonly radiusM3PlusPm: number | null
  /** Standard electrode potentials, V (null where NCERT prints "–"). */
  readonly eM2PlusVolt: number | null
  readonly eM3PlusM2PlusVolt: number | null
  /** Density, g cm⁻³, as printed (see ERRATA for Sc and Ti). */
  readonly densityGPerCm3: number
}

function row42(
  symbol: string,
  Z: number,
  configM: Config,
  configMPlus: Config,
  configM2Plus: Config | null,
  configM3Plus: Config | null,
  vals: [number, number, number, number, number, number | null, number | null, number | null, number | null, number],
): FirstSeriesRow {
  const [atomisationKJ, ie1KJ, ie2KJ, ie3KJ, radiusMetalPm, radiusM2PlusPm, radiusM3PlusPm, eM2PlusVolt, eM3PlusM2PlusVolt, densityGPerCm3] = vals
  return {
    symbol, Z, configM, configMPlus, configM2Plus, configM3Plus,
    atomisationKJ, ie1KJ, ie2KJ, ie3KJ, radiusMetalPm, radiusM2PlusPm, radiusM3PlusPm,
    eM2PlusVolt, eM3PlusM2PlusVolt, densityGPerCm3,
  }
}

/** Table 4.2 as printed (Sc to Zn). Values are read from the page image, not the text layer. */
export const NCERT_FIRST_SERIES_PROPERTIES: readonly FirstSeriesRow[] = [
  row42('Sc', 21, c(['3d', 1], ['4s', 2]), c(['3d', 1], ['4s', 1]), c(['3d', 1]), cAr(),
    [326, 631, 1235, 2393, 164, null, 73, null, null, 3.43]),
  row42('Ti', 22, c(['3d', 2], ['4s', 2]), c(['3d', 2], ['4s', 1]), c(['3d', 2]), c(['3d', 1]),
    [473, 656, 1309, 2657, 147, null, 67, -1.63, -0.37, 4.1]),
  row42('V', 23, c(['3d', 3], ['4s', 2]), c(['3d', 3], ['4s', 1]), c(['3d', 3]), c(['3d', 2]),
    [515, 650, 1414, 2833, 135, 79, 64, -1.18, -0.26, 6.07]),
  row42('Cr', 24, c(['3d', 5], ['4s', 1]), c(['3d', 5]), c(['3d', 4]), c(['3d', 3]),
    [397, 653, 1592, 2990, 129, 82, 62, -0.9, -0.41, 7.19]),
  row42('Mn', 25, c(['3d', 5], ['4s', 2]), c(['3d', 5], ['4s', 1]), c(['3d', 5]), c(['3d', 4]),
    [281, 717, 1509, 3260, 137, 82, 65, -1.18, 1.57, 7.21]),
  row42('Fe', 26, c(['3d', 6], ['4s', 2]), c(['3d', 6], ['4s', 1]), c(['3d', 6]), c(['3d', 5]),
    [416, 762, 1561, 2962, 126, 77, 65, -0.44, 0.77, 7.8]),
  row42('Co', 27, c(['3d', 7], ['4s', 2]), c(['3d', 7], ['4s', 1]), c(['3d', 7]), c(['3d', 6]),
    [425, 758, 1644, 3243, 125, 74, 61, -0.28, 1.97, 8.7]),
  row42('Ni', 28, c(['3d', 8], ['4s', 2]), c(['3d', 8], ['4s', 1]), c(['3d', 8]), c(['3d', 7]),
    [430, 736, 1752, 3402, 125, 70, 60, -0.25, null, 8.9]),
  row42('Cu', 29, c(['3d', 10], ['4s', 1]), c(['3d', 10]), c(['3d', 9]), null,
    [339, 745, 1958, 3556, 128, 73, null, 0.34, null, 8.9]),
  row42('Zn', 30, c(['3d', 10], ['4s', 2]), c(['3d', 10], ['4s', 1]), c(['3d', 10]), null,
    [126, 906, 1734, 3837, 137, 75, null, -0.76, null, 7.1]),
]

// ---------------------------------------------------------------------------
// Table 4.3 (p. 96): oxidation states, Sc-Zn. `common` is true where NCERT prints the state in bold.
// ---------------------------------------------------------------------------

export interface OxidationStateEntry {
  readonly state: number
  readonly common: boolean
}

/** Table 4.3 as printed; the bold (most common) states are flagged `common: true`. */
export const NCERT_OXIDATION_STATES: Readonly<Record<string, readonly OxidationStateEntry[]>> = {
  Sc: [{ state: 3, common: false }],
  Ti: [{ state: 2, common: false }, { state: 3, common: false }, { state: 4, common: true }],
  V: [{ state: 2, common: false }, { state: 3, common: false }, { state: 4, common: false }, { state: 5, common: true }],
  Cr: [{ state: 2, common: false }, { state: 3, common: true }, { state: 4, common: false }, { state: 5, common: false }, { state: 6, common: true }],
  Mn: [
    { state: 2, common: true }, { state: 3, common: false }, { state: 4, common: false },
    { state: 5, common: false }, { state: 6, common: false }, { state: 7, common: true },
  ],
  Fe: [{ state: 2, common: true }, { state: 3, common: true }, { state: 4, common: false }, { state: 6, common: false }],
  Co: [{ state: 2, common: true }, { state: 3, common: true }, { state: 4, common: false }],
  Ni: [{ state: 2, common: true }, { state: 3, common: false }, { state: 4, common: false }],
  Cu: [{ state: 1, common: false }, { state: 2, common: true }],
  Zn: [{ state: 2, common: true }],
}

// ---------------------------------------------------------------------------
// Table 4.4 (p. 99): thermochemical data and E° for Ti-Zn (M → M²⁺)
// ---------------------------------------------------------------------------

export interface ThermochemistryRow {
  readonly symbol: string
  /** ΔaH°(M), kJ mol⁻¹. */
  readonly atomisationKJ: number
  /** ΔiH₁° and ΔiH₂°, kJ mol⁻¹. */
  readonly ie1KJ: number
  readonly ie2KJ: number
  /** ΔhydH°(M²⁺), kJ mol⁻¹ (negative). */
  readonly hydrationKJ: number
  /** E°(M²⁺/M), V. */
  readonly eVolt: number
}

/** Table 4.4 as printed (Ti to Zn; Sc is not tabulated). Values differ from Table 4.2 in places: see ERRATA. */
export const NCERT_THERMOCHEMISTRY: readonly ThermochemistryRow[] = [
  { symbol: 'Ti', atomisationKJ: 469, ie1KJ: 656, ie2KJ: 1309, hydrationKJ: -1866, eVolt: -1.63 },
  { symbol: 'V', atomisationKJ: 515, ie1KJ: 650, ie2KJ: 1414, hydrationKJ: -1895, eVolt: -1.18 },
  { symbol: 'Cr', atomisationKJ: 398, ie1KJ: 653, ie2KJ: 1592, hydrationKJ: -1925, eVolt: -0.9 },
  { symbol: 'Mn', atomisationKJ: 279, ie1KJ: 717, ie2KJ: 1509, hydrationKJ: -1862, eVolt: -1.18 },
  { symbol: 'Fe', atomisationKJ: 418, ie1KJ: 762, ie2KJ: 1561, hydrationKJ: -1998, eVolt: -0.44 },
  { symbol: 'Co', atomisationKJ: 427, ie1KJ: 758, ie2KJ: 1644, hydrationKJ: -2079, eVolt: -0.28 },
  { symbol: 'Ni', atomisationKJ: 431, ie1KJ: 736, ie2KJ: 1752, hydrationKJ: -2121, eVolt: -0.25 },
  { symbol: 'Cu', atomisationKJ: 339, ie1KJ: 745, ie2KJ: 1958, hydrationKJ: -2121, eVolt: 0.34 },
  { symbol: 'Zn', atomisationKJ: 130, ie1KJ: 906, ie2KJ: 1734, hydrationKJ: -2059, eVolt: -0.76 },
]

// ---------------------------------------------------------------------------
// Table 4.5 (p. 99): formulas of halides of 3d metals. X = F→I; XI = F→Br; XII = F, Cl; XIII = Cl→I
// ---------------------------------------------------------------------------

export type HalideKey = 'F' | 'X' | 'XI' | 'XII' | 'XIII'

export interface HalideRow {
  readonly metal: string
  readonly oxidationState: number
  /** Formula as printed with X for the halogen; `key` gives the NCERT key that applies. */
  readonly formula: string
  readonly key: HalideKey
  /** True where NCERT attaches a superscript roman numeral to the formula (TiX₂, CuX₂, CuX). */
  readonly keySuperscript: boolean
}

/** Table 4.5 as printed. Superscript placements are read from the page image (see ERRATA). */
export const NCERT_HALIDES: readonly HalideRow[] = [
  { metal: 'Cr', oxidationState: 6, formula: 'CrF6', key: 'F', keySuperscript: false },
  { metal: 'V', oxidationState: 5, formula: 'VF5', key: 'F', keySuperscript: false },
  { metal: 'Cr', oxidationState: 5, formula: 'CrF5', key: 'F', keySuperscript: false },
  { metal: 'Ti', oxidationState: 4, formula: 'TiX4', key: 'X', keySuperscript: false },
  { metal: 'V', oxidationState: 4, formula: 'VXI4', key: 'XI', keySuperscript: false },
  { metal: 'Cr', oxidationState: 4, formula: 'CrX4', key: 'X', keySuperscript: false },
  { metal: 'Mn', oxidationState: 4, formula: 'MnF4', key: 'F', keySuperscript: false },
  { metal: 'Ti', oxidationState: 3, formula: 'TiX3', key: 'X', keySuperscript: false },
  { metal: 'V', oxidationState: 3, formula: 'VX3', key: 'X', keySuperscript: false },
  { metal: 'Cr', oxidationState: 3, formula: 'CrX3', key: 'X', keySuperscript: false },
  { metal: 'Mn', oxidationState: 3, formula: 'MnF3', key: 'F', keySuperscript: false },
  { metal: 'Fe', oxidationState: 3, formula: 'FeXI3', key: 'XI', keySuperscript: false },
  { metal: 'Co', oxidationState: 3, formula: 'CoF3', key: 'F', keySuperscript: false },
  { metal: 'Ti', oxidationState: 2, formula: 'TiX2', key: 'XIII', keySuperscript: true },
  { metal: 'V', oxidationState: 2, formula: 'VX2', key: 'X', keySuperscript: false },
  { metal: 'Cr', oxidationState: 2, formula: 'CrX2', key: 'X', keySuperscript: false },
  { metal: 'Mn', oxidationState: 2, formula: 'MnX2', key: 'X', keySuperscript: false },
  { metal: 'Fe', oxidationState: 2, formula: 'FeX2', key: 'X', keySuperscript: false },
  { metal: 'Co', oxidationState: 2, formula: 'CoX2', key: 'X', keySuperscript: false },
  { metal: 'Ni', oxidationState: 2, formula: 'NiX2', key: 'X', keySuperscript: false },
  { metal: 'Cu', oxidationState: 2, formula: 'CuX2', key: 'XII', keySuperscript: true },
  { metal: 'Zn', oxidationState: 2, formula: 'ZnX2', key: 'X', keySuperscript: false },
  { metal: 'Cu', oxidationState: 1, formula: 'CuX', key: 'XIII', keySuperscript: true },
]

// ---------------------------------------------------------------------------
// Table 4.6 (p. 100): formulas of oxides of 3d metals, by group
// ---------------------------------------------------------------------------

export interface OxideRow {
  readonly formula: string
  readonly metal: string
  /** Group of the metal (3-12). */
  readonly group: number
  readonly oxidationState: number
  /** NCERT marks mixed oxides with an asterisk. */
  readonly mixed: boolean
  /** NCERT prints this formula in brackets: (CrO). */
  readonly bracketed: boolean
}

/** Table 4.6 as printed. Mixed oxides (asterisk) are Mn₃O₄, Fe₃O₄, Co₃O₄. */
export const NCERT_OXIDES: readonly OxideRow[] = [
  { formula: 'Mn2O7', metal: 'Mn', group: 7, oxidationState: 7, mixed: false, bracketed: false },
  { formula: 'CrO3', metal: 'Cr', group: 6, oxidationState: 6, mixed: false, bracketed: false },
  { formula: 'V2O5', metal: 'V', group: 5, oxidationState: 5, mixed: false, bracketed: false },
  { formula: 'TiO2', metal: 'Ti', group: 4, oxidationState: 4, mixed: false, bracketed: false },
  { formula: 'V2O4', metal: 'V', group: 5, oxidationState: 4, mixed: false, bracketed: false },
  { formula: 'CrO2', metal: 'Cr', group: 6, oxidationState: 4, mixed: false, bracketed: false },
  { formula: 'MnO2', metal: 'Mn', group: 7, oxidationState: 4, mixed: false, bracketed: false },
  { formula: 'Sc2O3', metal: 'Sc', group: 3, oxidationState: 3, mixed: false, bracketed: false },
  { formula: 'Ti2O3', metal: 'Ti', group: 4, oxidationState: 3, mixed: false, bracketed: false },
  { formula: 'V2O3', metal: 'V', group: 5, oxidationState: 3, mixed: false, bracketed: false },
  { formula: 'Cr2O3', metal: 'Cr', group: 6, oxidationState: 3, mixed: false, bracketed: false },
  { formula: 'Mn2O3', metal: 'Mn', group: 7, oxidationState: 3, mixed: false, bracketed: false },
  { formula: 'Fe2O3', metal: 'Fe', group: 8, oxidationState: 3, mixed: false, bracketed: false },
  { formula: 'Mn3O4', metal: 'Mn', group: 7, oxidationState: 2, mixed: true, bracketed: false },
  { formula: 'Fe3O4', metal: 'Fe', group: 8, oxidationState: 2, mixed: true, bracketed: false },
  { formula: 'Co3O4', metal: 'Co', group: 9, oxidationState: 2, mixed: true, bracketed: false },
  { formula: 'TiO', metal: 'Ti', group: 4, oxidationState: 2, mixed: false, bracketed: false },
  { formula: 'VO', metal: 'V', group: 5, oxidationState: 2, mixed: false, bracketed: false },
  { formula: 'CrO', metal: 'Cr', group: 6, oxidationState: 2, mixed: false, bracketed: true },
  { formula: 'MnO', metal: 'Mn', group: 7, oxidationState: 2, mixed: false, bracketed: false },
  { formula: 'FeO', metal: 'Fe', group: 8, oxidationState: 2, mixed: false, bracketed: false },
  { formula: 'CoO', metal: 'Co', group: 9, oxidationState: 2, mixed: false, bracketed: false },
  { formula: 'NiO', metal: 'Ni', group: 10, oxidationState: 2, mixed: false, bracketed: false },
  { formula: 'CuO', metal: 'Cu', group: 11, oxidationState: 2, mixed: false, bracketed: false },
  { formula: 'ZnO', metal: 'Zn', group: 12, oxidationState: 2, mixed: false, bracketed: false },
  { formula: 'Cu2O', metal: 'Cu', group: 11, oxidationState: 1, mixed: false, bracketed: false },
]

// ---------------------------------------------------------------------------
// Table 4.7 (p. 102): calculated and observed magnetic moments (BM)
// ---------------------------------------------------------------------------

export interface MagneticRow {
  /** Ion as printed (Ti³⁺ etc.). */
  readonly ion: string
  readonly dCount: number
  readonly unpaired: number
  readonly calculatedBm: number
  /** Observed value: a number, a range [low, high], or null. */
  readonly observedBm: number | readonly [number, number]
  /** The observed entry exactly as printed. */
  readonly observedAsPrinted: string
}

/** Table 4.7 as printed. The Ni²⁺ range is printed "2.9 – 3, 4" (ERRATA). */
export const NCERT_MAGNETIC_MOMENTS: readonly MagneticRow[] = [
  { ion: 'Sc³⁺', dCount: 0, unpaired: 0, calculatedBm: 0, observedBm: 0, observedAsPrinted: '0' },
  { ion: 'Ti³⁺', dCount: 1, unpaired: 1, calculatedBm: 1.73, observedBm: 1.75, observedAsPrinted: '1.75' },
  { ion: 'Ti²⁺', dCount: 2, unpaired: 2, calculatedBm: 2.84, observedBm: 2.76, observedAsPrinted: '2.76' },
  { ion: 'V²⁺', dCount: 3, unpaired: 3, calculatedBm: 3.87, observedBm: 3.86, observedAsPrinted: '3.86' },
  { ion: 'Cr²⁺', dCount: 4, unpaired: 4, calculatedBm: 4.9, observedBm: 4.8, observedAsPrinted: '4.80' },
  { ion: 'Mn²⁺', dCount: 5, unpaired: 5, calculatedBm: 5.92, observedBm: 5.96, observedAsPrinted: '5.96' },
  { ion: 'Fe²⁺', dCount: 6, unpaired: 4, calculatedBm: 4.9, observedBm: [5.3, 5.5], observedAsPrinted: '5.3 – 5.5' },
  { ion: 'Co²⁺', dCount: 7, unpaired: 3, calculatedBm: 3.87, observedBm: [4.4, 5.2], observedAsPrinted: '4.4 – 5.2' },
  { ion: 'Ni²⁺', dCount: 8, unpaired: 2, calculatedBm: 2.84, observedBm: [2.9, 3.4], observedAsPrinted: '2.9 – 3, 4' },
  { ion: 'Cu²⁺', dCount: 9, unpaired: 1, calculatedBm: 1.73, observedBm: [1.8, 2.2], observedAsPrinted: '1.8 – 2.2' },
  { ion: 'Zn²⁺', dCount: 10, unpaired: 0, calculatedBm: 0, observedBm: 0, observedAsPrinted: '0' },
]

// ---------------------------------------------------------------------------
// Table 4.8 (p. 103): colours of some aquated first-row transition metal ions
// ---------------------------------------------------------------------------

export interface AquaColourRow {
  readonly ion: string
  readonly dCount: number
  /** Colour as printed. */
  readonly colour: string
}

/** Table 4.8 as printed. The Co row prints "bluepink" once for Co³⁺ (d⁶) and Co²⁺ (d⁷); see ERRATA. */
export const NCERT_AQUA_COLOURS: readonly AquaColourRow[] = [
  { ion: 'Sc³⁺', dCount: 0, colour: 'colourless' },
  { ion: 'Ti⁴⁺', dCount: 0, colour: 'colourless' },
  { ion: 'Ti³⁺', dCount: 1, colour: 'purple' },
  { ion: 'V⁴⁺', dCount: 1, colour: 'blue' },
  { ion: 'V³⁺', dCount: 2, colour: 'green' },
  { ion: 'V²⁺', dCount: 3, colour: 'violet' },
  { ion: 'Cr³⁺', dCount: 3, colour: 'violet' },
  { ion: 'Mn³⁺', dCount: 4, colour: 'violet' },
  { ion: 'Cr²⁺', dCount: 4, colour: 'blue' },
  { ion: 'Mn²⁺', dCount: 5, colour: 'pink' },
  { ion: 'Fe³⁺', dCount: 5, colour: 'yellow' },
  { ion: 'Fe²⁺', dCount: 6, colour: 'green' },
  { ion: 'Co³⁺', dCount: 6, colour: 'bluepink' },
  { ion: 'Co²⁺', dCount: 7, colour: 'bluepink' },
  { ion: 'Ni²⁺', dCount: 8, colour: 'green' },
  { ion: 'Cu²⁺', dCount: 9, colour: 'blue' },
  { ion: 'Zn²⁺', dCount: 10, colour: 'colourless' },
]

// ---------------------------------------------------------------------------
// Table 4.9 (p. 110): electronic configurations and radii of La and the lanthanoids.
// Only electrons outside the [Xe] core are indicated (NCERT footnote).
// ---------------------------------------------------------------------------

export interface LanthanoidRow {
  readonly Z: number
  readonly name: string
  readonly symbol: string
  readonly ln: Config
  readonly ln2Plus: Config | null
  readonly ln3Plus: Config | null
  /** Ln⁴⁺ configuration (printed in the column under the Radii/pm heading in NCERT's layout). */
  readonly ln4Plus: Config | null
  /** Radius of the metal atom Ln, pm (null for Lu, printed "–"). */
  readonly radiusLnPm: number | null
  /** Radius of Ln³⁺, pm (null for Lu, printed "–"). */
  readonly radiusLn3PlusPm: number | null
}

const ln = (
  Z: number, name: string, symbol: string,
  lnC: Config, ln2: Config | null, ln3: Config | null, ln4: Config | null,
  rAtom: number | null, rIon: number | null,
): LanthanoidRow => ({ Z, name, symbol, ln: lnC, ln2Plus: ln2, ln3Plus: ln3, ln4Plus: ln4, radiusLnPm: rAtom, radiusLn3PlusPm: rIon })

export const NCERT_LANTHANOIDS: readonly LanthanoidRow[] = [
  ln(57, 'Lanthanum', 'La', c(['5d', 1], ['6s', 2]), c(['5d', 1]), c(['4f', 0]), null, 187, 106),
  ln(58, 'Cerium', 'Ce', c(['4f', 1], ['5d', 1], ['6s', 2]), c(['4f', 2]), c(['4f', 1]), c(['4f', 0]), 183, 103),
  ln(59, 'Praseodymium', 'Pr', c(['4f', 3], ['6s', 2]), c(['4f', 3]), c(['4f', 2]), c(['4f', 1]), 182, 101),
  ln(60, 'Neodymium', 'Nd', c(['4f', 4], ['6s', 2]), c(['4f', 4]), c(['4f', 3]), c(['4f', 2]), 181, 99),
  ln(61, 'Promethium', 'Pm', c(['4f', 5], ['6s', 2]), c(['4f', 5]), c(['4f', 4]), null, 181, 98),
  ln(62, 'Samarium', 'Sm', c(['4f', 6], ['6s', 2]), c(['4f', 6]), c(['4f', 5]), null, 180, 96),
  ln(63, 'Europium', 'Eu', c(['4f', 7], ['6s', 2]), c(['4f', 7]), c(['4f', 6]), null, 199, 95),
  ln(64, 'Gadolinium', 'Gd', c(['4f', 7], ['5d', 1], ['6s', 2]), c(['4f', 7], ['5d', 1]), c(['4f', 7]), null, 180, 94),
  ln(65, 'Terbium', 'Tb', c(['4f', 9], ['6s', 2]), c(['4f', 9]), c(['4f', 8]), c(['4f', 7]), 178, 92),
  ln(66, 'Dysprosium', 'Dy', c(['4f', 10], ['6s', 2]), c(['4f', 10]), c(['4f', 9]), c(['4f', 8]), 177, 91),
  ln(67, 'Holmium', 'Ho', c(['4f', 11], ['6s', 2]), c(['4f', 11]), c(['4f', 10]), null, 176, 89),
  ln(68, 'Erbium', 'Er', c(['4f', 12], ['6s', 2]), c(['4f', 12]), c(['4f', 11]), null, 175, 88),
  ln(69, 'Thulium', 'Tm', c(['4f', 13], ['6s', 2]), c(['4f', 13]), c(['4f', 12]), null, 174, 87),
  ln(70, 'Ytterbium', 'Yb', c(['4f', 14], ['6s', 2]), c(['4f', 14]), c(['4f', 13]), null, 173, 86),
  ln(71, 'Lutetium', 'Lu', c(['4f', 14], ['5d', 1], ['6s', 2]), c(['4f', 14], ['5d', 1]), c(['4f', 14]), null, null, null),
]

// ---------------------------------------------------------------------------
// Table 4.10 (p. 111): some properties of actinium and the actinoids. Radii as printed.
// ---------------------------------------------------------------------------

export interface ActinoidRow {
  readonly Z: number
  readonly name: string
  readonly symbol: string
  readonly m: Config
  readonly m3Plus: Config | null
  readonly m4Plus: Config | null
  readonly radiusM3PlusPm: number | null
  readonly radiusM4PlusPm: number | null
}

const an = (
  Z: number, name: string, symbol: string, m: Config, m3: Config | null, m4: Config | null,
  r3: number | null, r4: number | null,
): ActinoidRow => ({ Z, name, symbol, m, m3Plus: m3, m4Plus: m4, radiusM3PlusPm: r3, radiusM4PlusPm: r4 })

/** Configurations as printed; NCERT's footnote for this table is not in the text layer (see ERRATA). */
export const NCERT_ACTINOIDS: readonly ActinoidRow[] = [
  an(89, 'Actinium', 'Ac', c(['6d', 1], ['7s', 2]), c(['5f', 0]), null, 111, null),
  an(90, 'Thorium', 'Th', c(['6d', 2], ['7s', 2]), c(['5f', 1]), c(['5f', 0]), null, 99),
  an(91, 'Protactinium', 'Pa', c(['5f', 2], ['6d', 1], ['7s', 2]), c(['5f', 2]), c(['5f', 1]), null, 96),
  an(92, 'Uranium', 'U', c(['5f', 3], ['6d', 1], ['7s', 2]), c(['5f', 3]), c(['5f', 2]), 103, 93),
  an(93, 'Neptunium', 'Np', c(['5f', 4], ['6d', 1], ['7s', 2]), c(['5f', 4]), c(['5f', 3]), 101, 92),
  an(94, 'Plutonium', 'Pu', c(['5f', 6], ['7s', 2]), c(['5f', 5]), c(['5f', 4]), 100, 90),
  an(95, 'Americium', 'Am', c(['5f', 7], ['7s', 2]), c(['5f', 6]), c(['5f', 5]), 99, 89),
  an(96, 'Curium', 'Cm', c(['5f', 7], ['6d', 1], ['7s', 2]), c(['5f', 7]), c(['5f', 6]), 99, 88),
  an(97, 'Berkelium', 'Bk', c(['5f', 9], ['7s', 2]), c(['5f', 8]), c(['5f', 7]), 98, 87),
  an(98, 'Californium', 'Cf', c(['5f', 10], ['7s', 2]), c(['5f', 9]), c(['5f', 8]), 98, 86),
  an(99, 'Einsteinium', 'Es', c(['5f', 11], ['7s', 2]), c(['5f', 10]), c(['5f', 9]), null, null),
  an(100, 'Fermium', 'Fm', c(['5f', 12], ['7s', 2]), c(['5f', 11]), c(['5f', 10]), null, null),
  an(101, 'Mendelevium', 'Md', c(['5f', 13], ['7s', 2]), c(['5f', 12]), c(['5f', 11]), null, null),
  an(102, 'Nobelium', 'No', c(['5f', 14], ['7s', 2]), c(['5f', 13]), c(['5f', 12]), null, null),
  an(103, 'Lawrencium', 'Lr', c(['5f', 14], ['6d', 1], ['7s', 2]), c(['5f', 14]), c(['5f', 13]), null, null),
]

// ---------------------------------------------------------------------------
// Table 4.11 (p. 112): oxidation states of actinium and the actinoids
// ---------------------------------------------------------------------------

/** Table 4.11 as printed (read from the page image). */
export const NCERT_ACTINOID_OXIDATION_STATES: Readonly<Record<string, readonly number[]>> = {
  Ac: [3],
  Th: [4],
  Pa: [3, 4, 5],
  U: [3, 4, 5, 6],
  Np: [3, 4, 5, 6, 7],
  Pu: [3, 4, 5, 6, 7],
  Am: [3, 4, 5, 6],
  Cm: [3, 4],
  Bk: [3, 4],
  Cf: [3],
  Es: [3],
  Fm: [3],
  Md: [3],
  No: [3],
  Lr: [3],
}

// ---------------------------------------------------------------------------
// Running-text facts and equations (as NCERT states them)
// ---------------------------------------------------------------------------

export interface NamedEquation {
  readonly id: string
  /** Equation as printed. Species are Unicode with real subscripts and superscripts. */
  readonly equation: string
  readonly page: number
  /** E° in V where NCERT gives one for this half-reaction. */
  readonly eVolt?: number
}

/** Dichromate and permanganate chemistry, pp. 105-108. */
export const NCERT_OXIDANT_EQUATIONS: readonly NamedEquation[] = [
  { id: 'chromate-dichromate-acid', equation: '2CrO₄²⁻ + 2H⁺ → Cr₂O₇²⁻ + H₂O', page: 105 },
  { id: 'dichromate-chromate-base', equation: 'Cr₂O₇²⁻ + 2OH⁻ → 2CrO₄²⁻ + H₂O', page: 105 },
  { id: 'chromite-fusion', equation: '4FeCr₂O₄ + 8Na₂CO₃ + 7O₂ → 8Na₂CrO₄ + 2Fe₂O₃ + 8CO₂', page: 105 },
  { id: 'sodium-dichromate-from-chromate', equation: '2Na₂CrO₄ + 2H⁺ → Na₂Cr₂O₇ + 2Na⁺ + H₂O', page: 105 },
  { id: 'potassium-dichromate-from-sodium', equation: 'Na₂Cr₂O₇ + 2KCl → K₂Cr₂O₇ + 2NaCl', page: 105 },
  {
    id: 'dichromate-acid-half', equation: 'Cr₂O₇²⁻ + 14H⁺ + 6e⁻ → 2Cr³⁺ + 7H₂O', page: 106, eVolt: 1.33,
  },
  { id: 'dichromate-iodide-half', equation: '6I⁻ → 3I₂ + 6e⁻', page: 106 },
  { id: 'dichromate-h2s-half', equation: '3H₂S → 6H⁺ + 3S + 6e⁻', page: 106 },
  { id: 'dichromate-tin-half', equation: '3Sn²⁺ → 3Sn⁴⁺ + 6e⁻', page: 106 },
  { id: 'dichromate-iron-half', equation: '6Fe²⁺ → 6Fe³⁺ + 6e⁻', page: 106 },
  { id: 'dichromate-iron-full', equation: 'Cr₂O₇²⁻ + 14H⁺ + 6Fe²⁺ → 2Cr³⁺ + 6Fe³⁺ + 7H₂O', page: 106 },
  { id: 'permanganate-prep-fusion', equation: '2MnO₂ + 4KOH + O₂ → 2K₂MnO₄ + 2H₂O', page: 106 },
  { id: 'manganate-disproportionation', equation: '3MnO₄²⁻ + 4H⁺ → 2MnO₄⁻ + MnO₂ + 2H₂O', page: 106 },
  {
    id: 'permanganate-persulphate-prep', equation: '2Mn²⁺ + 5S₂O₈²⁻ + 8H₂O → 2MnO₄⁻ + 10SO₄²⁻ + 16H⁺', page: 107,
  },
  { id: 'permanganate-thermal-decomposition', equation: '2KMnO₄ → K₂MnO₄ + MnO₂ + O₂', page: 107 },
  { id: 'permanganate-to-manganate-half', equation: 'MnO₄⁻ + e⁻ → MnO₄²⁻', page: 107, eVolt: 0.56 },
  { id: 'permanganate-to-dioxide-half', equation: 'MnO₄⁻ + 4H⁺ + 3e⁻ → MnO₂ + 2H₂O', page: 107, eVolt: 1.69 },
  { id: 'permanganate-to-mn2plus-half', equation: 'MnO₄⁻ + 8H⁺ + 5e⁻ → Mn²⁺ + 4H₂O', page: 107, eVolt: 1.52 },
  { id: 'oxalate-half', equation: '5C₂O₄²⁻ → 10CO₂ + 10e⁻', page: 107 },
  { id: 'iron-ii-half', equation: '5Fe²⁺ → 5Fe³⁺ + 5e⁻', page: 107 },
  { id: 'nitrite-half', equation: '5NO₂⁻ + 5H₂O → 5NO₃⁻ + 10H⁺ + 10e⁻', page: 107 },
  { id: 'iodide-half', equation: '10I⁻ → 5I₂ + 10e⁻', page: 107 },
  { id: 'permanganate-iodide-acid', equation: '10I⁻ + 2MnO₄⁻ + 16H⁺ → 2Mn²⁺ + 8H₂O + 5I₂', page: 107 },
  { id: 'permanganate-iron-acid', equation: '5Fe²⁺ + MnO₄⁻ + 8H⁺ → Mn²⁺ + 4H₂O + 5Fe³⁺', page: 107 },
  { id: 'permanganate-oxalate-acid', equation: '5C₂O₄²⁻ + 2MnO₄⁻ + 16H⁺ → 2Mn²⁺ + 8H₂O + 10CO₂', page: 108 },
  { id: 'permanganate-sulphide-acid', equation: '5S²⁻ + 2MnO₄⁻ + 16H⁺ → 2Mn²⁺ + 8H₂O + 5S', page: 108 },
  { id: 'permanganate-sulphite-acid', equation: '5SO₃²⁻ + 2MnO₄⁻ + 6H⁺ → 2Mn²⁺ + 3H₂O + 5SO₄²⁻', page: 108 },
  { id: 'permanganate-nitrite-acid', equation: '5NO₂⁻ + 2MnO₄⁻ + 6H⁺ → 2Mn²⁺ + 5NO₃⁻ + 3H₂O', page: 108 },
  { id: 'permanganate-iodide-neutral', equation: '2MnO₄⁻ + H₂O + I⁻ → 2MnO₂ + 2OH⁻ + IO₃⁻', page: 108 },
  { id: 'permanganate-thiosulphate-neutral', equation: '8MnO₄⁻ + 3S₂O₃²⁻ + H₂O → 8MnO₂ + 6SO₄²⁻ + 2OH⁻', page: 108 },
  { id: 'permanganate-manganous-neutral', equation: '2MnO₄⁻ + 3Mn²⁺ + 2H₂O → 5MnO₂ + 4H⁺', page: 108 },
]

/** Catalysis and other running-text equations, pp. 104 and 113-114. */
export const NCERT_CATALYSIS_EQUATIONS: readonly NamedEquation[] = [
  { id: 'iron-iii-persulphate-overall', equation: '2I⁻ + S₂O₈²⁻ → I₂ + 2SO₄²⁻', page: 104 },
  { id: 'iron-iii-step-1', equation: '2Fe³⁺ + 2I⁻ → 2Fe²⁺ + I₂', page: 104 },
  { id: 'iron-ii-step-2', equation: '2Fe²⁺ + S₂O₈²⁻ → 2Fe³⁺ + 2SO₄²⁻', page: 104 },
  { id: 'copper-i-disproportionation', equation: '2Cu⁺ → Cu²⁺ + Cu', page: 99 },
  { id: 'copper-ii-iodide', equation: '2Cu²⁺ + 4I⁻ → Cu₂I₂(s) + I₂', page: 99 },
]

/** The Mn(II)/Mn(III) and Co E° statements used in the running text, p. 98-101. */
export const NCERT_SENTENCE_FACTS = {
  /** Zr and Hf radii, p. 94 (lanthanoid contraction). */
  zrRadiusPm: 160,
  hfRadiusPm: 159,
  /** E°(Ce⁴⁺/Ce³⁺) in V, p. 109. */
  ceIVIIIEVolt: 1.74,
  /** E°(Ln³⁺/Ln) range in V, p. 110; Eu is the exception at −2.0 V. */
  lnIIIMetalEVoltRange: [-2.4, -2.2] as const,
  euLnIIIMetalEVolt: -2.0,
  /** Ln ionisation enthalpies (approximate, kJ mol⁻¹), p. 110. */
  lnIE1KJApprox: 600,
  lnIE2KJApprox: 1200,
  /** Lanthanoid metal melting points range (K) and Sm (K), p. 110. */
  lnMeltRangeK: [1000, 1200] as const,
  smMeltK: 1623,
  /** Mischmetal composition as NCERT states it, p. 113 (about 95 % lanthanoid, about 5 % iron). */
  mischmetalLnPercent: 95,
  mischmetalFePercent: 5,
  /** Cr–O–Cr angle in dichromate, p. 106. */
  dichromateCrOCrDeg: 126,
  /** Manganate and permanganate colour and magnetism (text, p. 107). */
  manganateGreenParamagnetic: true,
  permanganateDiamagnetic: true,
  /** Solubility of KMnO₄ and decomposition temperature (text, p. 107). */
  kmno4DecomposesK: 513,
  kmno4SolubilityG100g293K: 6.4,
  /** Oxalate titration temperature used in the text (p. 108). */
  oxalateReactionK: 333,
} as const

/** Industrial and catalytic uses named in the running text (p. 113-114). */
export const NCERT_INDUSTRIAL_USES = [
  { process: 'Contact process', catalyst: 'V₂O₅', use: 'catalyses the oxidation of SO₂ in sulphuric acid manufacture', page: 113 },
  { process: 'Ziegler catalysts', catalyst: 'TiCl₄ with Al(CH₃)₃', use: 'polyethylene (polythene) manufacture', page: 113 },
  { process: 'Haber process', catalyst: 'finely divided Fe', use: 'ammonia from N₂/H₂', page: 113 },
  { process: 'Hydrogenation of fats', catalyst: 'Ni', use: 'hydrogenation of fats', page: 113 },
  { process: 'Wacker process', catalyst: 'PdCl₂', use: 'oxidation of ethene to ethanal (see ERRATA)', page: 114 },
] as const

/** Interstitial compounds, p. 104, and alloy facts, p. 104. */
export const NCERT_INTERSTITIAL = {
  formulas: ['TiC', 'Mn₄N', 'Fe₃H', 'VH₀.₅₆', 'TiH₁.₇'],
  page: 104,
} as const

export const NCERT_ALLOY_FACTS = {
  /** Metallic radii within about this percentage for solid solution alloys. */
  radiusSimilarityPercent: 15,
  ferrousAlloyMetals: ['Cr', 'V', 'W', 'Mo', 'Mn'],
  brass: 'Cu–Zn',
  bronze: 'Cu–Sn',
  page: 104,
} as const

// ---------------------------------------------------------------------------
// Errata and doubts. Entries are NOT silent corrections: the table cell or sentence above keeps
// the printed value; `correct` says what the reader should use and why.
// ---------------------------------------------------------------------------

export interface UnitErrata {
  readonly id: string
  readonly where: string
  readonly ncertSays: string
  readonly correct: string
  /** 'slip' = clearly wrong; 'doubt' = inconsistent or unverified, lead decides. */
  readonly kind: 'slip' | 'doubt'
}

export const NCERT_UNIT4_ERRATA: readonly UnitErrata[] = [
  {
    id: 'wacker-ethyne-for-ethene',
    where: 'Section 4.7, p. 114',
    ncertSays: 'In the Wacker process the oxidation of ethyne to ethanal is catalysed by PdCl₂.',
    correct: 'The Wacker process oxidises ethene (ethylene) to ethanal (CH₃CHO). Use ethene.',
    kind: 'slip',
  },
  {
    id: 'tio-for-tio2',
    where: 'Section 4.7, p. 113',
    ncertSays: 'Some compounds are manufactured for special purposes such as TiO for the pigment industry.',
    correct: 'The pigment is titanium(IV) oxide, TiO₂.',
    kind: 'slip',
  },
  {
    id: 'ti-zn-atomisation-table-4-2-vs-4-4',
    where: 'Table 4.2 (p. 94) against Table 4.4 (p. 99)',
    ncertSays:
      'ΔaH°(M) differs between the two tables: Ti 473 vs 469; Cr 397 vs 398; Mn 281 vs 279; Fe 416 vs 418; Co 425 vs 427; Ni 430 vs 431; Zn 126 vs 130 (Sc, V and Cu agree).',
    correct:
      'Both transcribed as printed. Section agents must name the table they use. Do not mix them in one chart without a note. Lead decision needed.',
    kind: 'doubt',
  },
  {
    id: 'table-4-2-density-sc-ti',
    where: 'Table 4.2 (p. 94), density row',
    ncertSays: 'Density of Sc 3.43 g cm⁻³ and Ti 4.1 g cm⁻³.',
    correct:
      'Handbook values from memory (not checked against a source in this session): Sc ≈ 2.99 and Ti ≈ 4.51 g cm⁻³. The other densities agree with handbook values to about 1 %. Kept as printed.',
    kind: 'doubt',
  },
  {
    id: 'table-4-7-v2-calculated',
    where: 'Table 4.7 (p. 102), calculated moment for two unpaired electrons (Ti²⁺)',
    ncertSays: 'Calculated spin-only moment printed as 2.84 BM.',
    correct: '√(2 × 4) = √8 = 2.83 BM (2 d.p.). Kept as printed; use 2.83 in any calculation or display.',
    kind: 'slip',
  },
  {
    id: 'table-4-7-ti2-symbol',
    where: 'Table 4.7 (p. 102), row 3 of the ion column',
    ncertSays: 'The 3d² row is printed "Tl²⁺" (checked by the lead on the page image at 300 dpi).',
    correct: 'Ti²⁺ (3d², 2 unpaired): "Tl" is a misprint for Ti, and the charge is 2+ as printed. Show it as Ti²⁺.',
    kind: 'slip',
  },
  {
    id: 'table-4-7-ni-range',
    where: 'Table 4.7 (p. 102), Ni²⁺ observed moment',
    ncertSays: 'Printed as "2.9 – 3, 4" BM.',
    correct:
      'Read as 2.9–3.4 BM (the comma is a misprint for a decimal point). The observedBm field holds [2.9, 3.4]; observedAsPrinted keeps the printed text. Checked by the lead on the page image.',
    kind: 'doubt',
  },
  {
    id: 'table-4-8-co-bluepink',
    where: 'Table 4.8 (p. 103), Co³⁺ and Co²⁺ rows',
    ncertSays: 'One colour cell reads "bluepink" for both Co³⁺ (3d⁶) and Co²⁺ (3d⁷).',
    correct:
      'The two words are a single cell in the text layer: one colour belongs to each ion (blue and pink). The page image was not checked for this cell. Lead to confirm before any section names the Co³⁺ colour.',
    kind: 'doubt',
  },
  {
    id: 'table-4-9-ln4-column',
    where: 'Table 4.9 (p. 110)',
    ncertSays:
      'The Ln⁴⁺ column is printed under the "Radii/pm" heading, while the Electronic configurations heading covers Ln, Ln²⁺ and Ln³⁺ only.',
    correct:
      'The column holds 4f configurations (4f⁰ for Ce⁴⁺ etc.), consistent with the text (Ce⁴⁺ f⁰, Tb⁴⁺ f⁷). It is stored as ln4Plus, not as a radius.',
    kind: 'doubt',
  },
  {
    id: 'table-4-10-footnote',
    where: 'Table 4.10 (p. 111)',
    ncertSays: 'Configurations are marked with an asterisk, but the footnote is not in the text layer.',
    correct:
      'Configurations are stored as printed, without a [Rn] core; the core is presumed (as for Table 4.9) but not verified. Radii left as printed.',
    kind: 'doubt',
  },
  {
    id: 'table-4-5-key-superscripts',
    where: 'Table 4.5 (p. 99)',
    ncertSays: 'Roman-numeral key superscripts (XI, XII, XIII) sit on TiX₂, VXI₄, FeXI₃, CuX₂ and CuX.',
    correct:
      'Stored per cell as key F, X, XI, XII or XIII, read from the page image. Key: X = F→I; XI = F→Br; XII = F, Cl; XIII = Cl→I.',
    kind: 'doubt',
  },
  {
    id: 'table-4-6-bracketed-crO',
    where: 'Table 4.6 (p. 100)',
    ncertSays: 'CrO (+2) is printed in brackets and Mn₃O₄, Fe₃O₄, Co₃O₄ carry an asterisk (mixed oxides).',
    correct: 'Stored with bracketed and mixed flags; the brackets are kept, not explained by NCERT.',
    kind: 'doubt',
  },
  {
    id: 'ce-iv-reduction-note',
    where: 'Section 4.5.3, p. 109',
    ncertSays: 'The text calls Ce⁴⁺ a strong oxidant with E° (Ce⁴⁺/Ce³⁺) = +1.74 V.',
    correct: 'Kept as printed. The value is not checked against a handbook in this session.',
    kind: 'doubt',
  },
]
