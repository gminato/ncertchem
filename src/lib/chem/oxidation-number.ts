/**
 * Oxidation number determination and step-by-step reasoning following NCERT Class 11 Unit 7.
 *
 * Rules are evaluated in priority order according to Section 7.3:
 * 1. Free elements = 0.
 * 2. Monatomic ions = charge.
 * 3. Fluorine is always -1 in all compounds.
 * 4. Group 1 alkali metals = +1, Group 2 alkaline earth metals = +2, Al = +3.
 * 5. Hydrogen = +1, except in metal hydrides (LiH, NaH, CaH2, NaBH4) where H = -1.
 * 6. Oxygen = -2, except in peroxides (-1), superoxides (-1/2), and fluorine oxides (+2, +1).
 * 7. Halogens (Cl, Br, I) = -1 as halides (unless combined with O or F).
 * 8. Sum rule solves the remaining unknown element: algebraic sum equals the total charge.
 *
 * Exact fractions (Rational { num, den }) are used throughout to represent values like
 * 8/3 (Fe3O4), 16/3 (Br3O8), 4/3 (C3O2), and 5/2 (S4O6^2-).
 */

import { parseFormula, type FormulaCounts } from './formula'

/** An exact rational number representing an oxidation state. */
export interface Rational {
  num: number
  den: number
}

function gcd(a: number, b: number): number {
  let x = Math.abs(a)
  let y = Math.abs(b)
  while (y !== 0) {
    const t = y
    y = x % y
    x = t
  }
  return x === 0 ? 1 : x
}

/**
 * Constructs a reduced rational number with a positive denominator.
 *
 * @param num Numerator
 * @param den Denominator (defaults to 1)
 * @throws {RangeError} If denominator is zero or non-finite
 */
export function makeRational(num: number, den = 1): Rational {
  if (!Number.isFinite(num) || !Number.isFinite(den)) {
    throw new RangeError(`Rational parts must be finite (received ${num}/${den})`)
  }
  if (den === 0) {
    throw new RangeError('Rational denominator cannot be zero')
  }
  const sign = den < 0 ? -1 : 1
  const g = gcd(num, den)
  return {
    num: (sign * num) / g,
    den: (sign * den) / g,
  }
}

/** Formats a rational number as a signed string (e.g. "+6", "-1", "+8/3", "0"). */
export function rationalToString(r: Rational): string {
  if (r.num === 0) {
    return '0'
  }
  const sign = r.num > 0 ? '+' : '-'
  const absNum = Math.abs(r.num)
  if (r.den === 1) {
    return `${sign}${absNum}`
  }
  return `${sign}${absNum}/${r.den}`
}

/** Converts a rational number to a floating-point number. */
export function rationalToNumber(r: Rational): number {
  return r.num / r.den
}

const ALKALI_METALS = new Set(['Li', 'Na', 'K', 'Rb', 'Cs', 'Fr'])
const ALKALINE_EARTH_METALS = new Set(['Be', 'Mg', 'Ca', 'Sr', 'Ba', 'Ra'])
const TRANSITION_AND_POST_TRANSITION_METALS = new Set([
  'Au', 'Tl', 'Fe', 'Cu', 'Mn', 'Cr', 'Co', 'Ni', 'Zn', 'Ag', 'Hg', 'Pb', 'Sn', 'Ti', 'V', 'Pt', 'Cd',
])

const PEROXIDES = new Set(['H2O2', 'Na2O2', 'K2O2', 'BaO2', 'CaO2'])
const SUPEROXIDES = new Set(['KO2', 'RbO2', 'CsO2'])

/** Entry in the structural exceptions table overriding normal averaging. */
export interface StructuralOxidationException {
  formula: string
  oxidationNumbers: Record<string, Rational>
  note: string
}

/**
 * Structural exceptions where normal averaging rules yield chemically impossible oxidation numbers
 * (e.g. exceeding maximum group valence). NCERT Section 7.3 special cases.
 */
export const STRUCTURAL_OXIDATION_EXCEPTIONS: Record<string, StructuralOxidationException> = {
  H2SO5: {
    formula: 'H2SO5',
    oxidationNumbers: {
      H: makeRational(1, 1),
      S: makeRational(6, 1),
      O: makeRational(-8, 5),
    },
    note: "Caro's acid (peroxomonosulphuric acid, H2SO5): S is +6 (group 16 maximum); contains one peroxide linkage (-O-O-) with two O atoms at -1 and three O atoms at -2 (average -8/5).",
  },
  H2S2O8: {
    formula: 'H2S2O8',
    oxidationNumbers: {
      H: makeRational(1, 1),
      S: makeRational(6, 1),
      O: makeRational(-7, 4),
    },
    note: "Marshall's acid (peroxodisulphuric acid, H2S2O8): S is +6 (group 16 maximum); contains one peroxide linkage (-O-O-) with two O atoms at -1 and six O atoms at -2 (average -7/4).",
  },
  K2S2O8: {
    formula: 'K2S2O8',
    oxidationNumbers: {
      K: makeRational(1, 1),
      S: makeRational(6, 1),
      O: makeRational(-7, 4),
    },
    note: "Potassium persulphate (K2S2O8): S is +6 (group 16 maximum); contains one peroxide linkage (-O-O-) with two O atoms at -1 and six O atoms at -2 (average -7/4).",
  },
  CrO5: {
    formula: 'CrO5',
    oxidationNumbers: {
      Cr: makeRational(6, 1),
      O: makeRational(-6, 5),
    },
    note: 'Chromium pentoxide (CrO5, butterfly structure): Cr is +6 (maximum transition valence); contains one oxo oxygen (=O, -2) and two peroxo groups (four O atoms at -1, average -6/5).',
  },
}

/** Known polyatomic ions for site-specific oxidation number determination. */
const KNOWN_POLYATOMIC_IONS: readonly { formula: string; charge: number; siteName: string }[] = [
  { formula: 'Cr2O7', charge: -2, siteName: 'Cr2O7^2-' },
  { formula: 'CrO4', charge: -2, siteName: 'CrO4^2-' },
  { formula: 'S2O3', charge: -2, siteName: 'S2O3^2-' },
  { formula: 'C2O4', charge: -2, siteName: 'C2O4^2-' },
  { formula: 'MnO4', charge: -1, siteName: 'MnO4^-' },
  { formula: 'ClO4', charge: -1, siteName: 'ClO4^-' },
  { formula: 'ClO3', charge: -1, siteName: 'ClO3^-' },
  { formula: 'ClO2', charge: -1, siteName: 'ClO2^-' },
  { formula: 'ClO', charge: -1, siteName: 'ClO^-' },
  { formula: 'PO4', charge: -3, siteName: 'PO4^3-' },
  { formula: 'SO4', charge: -2, siteName: 'SO4^2-' },
  { formula: 'SO3', charge: -2, siteName: 'SO3^2-' },
  { formula: 'CO3', charge: -2, siteName: 'CO3^2-' },
  { formula: 'NO3', charge: -1, siteName: 'NO3^-' },
  { formula: 'NO2', charge: -1, siteName: 'NO2^-' },
  { formula: 'NH4', charge: 1, siteName: 'NH4^+' },
  { formula: 'CN', charge: -1, siteName: 'CN^-' },
  { formula: 'OH', charge: -1, siteName: 'OH^-' },
]

/** One distinct site or constituent ion in a chemical species. */
export interface SiteOxidation {
  site: string
  formula: string
  charge: number
  count: number
  oxidationNumbers: Record<string, Rational>
}

/** Result of site-by-site oxidation number analysis, supporting both array iteration and record lookup. */
export type SiteOxidationResult = SiteOxidation[] & Record<string, Record<string, Rational>>

/** Asserts that the algebraic sum of (count * ON) strictly equals the net ionic charge. */
function assertSumRule(
  result: Record<string, Rational>,
  counts: FormulaCounts,
  netCharge: number,
  formula: string,
): void {
  let totalNum = 0
  let totalDen = 1
  for (const [sym, count] of Object.entries(counts)) {
    const r = result[sym]
    if (!r) {
      throw new RangeError(`Element "${sym}" was not assigned an oxidation number in "${formula}"`)
    }
    totalNum = totalNum * r.den + count * r.num * totalDen
    totalDen = totalDen * r.den
  }
  if (totalNum !== netCharge * totalDen) {
    throw new RangeError(
      `Sum rule violation for "${formula}": sum of oxidation numbers (${totalNum}/${totalDen}) does not equal net charge (${netCharge})`,
    )
  }
}

/** One step in an oxidation number derivation. */
export interface OxidationStep {
  element: string
  ruleApplied: string
  equation?: string
  assignedValue: Rational
}

/** Complete explanation for deriving an element's oxidation number. */
export interface OxidationExplanation {
  formula: string
  charge: number
  targetElement: string
  finalOxidationNumber: Rational
  steps: readonly OxidationStep[]
}

/**
 * Strips charge notations (e.g. "Cr2O7^2-", "Cr2O72-", "MnO4-", "Fe2+") if present,
 * returning the clean base formula and parsed charge.
 */
function extractFormulaAndCharge(input: string, fallbackCharge = 0): { formula: string; charge: number } {
  const trimmed = input.trim()
  const caretMatch = /^([A-Za-z0-9·.*()\[\]]+)\^([+-]?\d*[+-])$/.exec(trimmed)
  if (caretMatch) {
    const rawChg = caretMatch[2]
    const sign = rawChg.endsWith('-') ? -1 : 1
    const digits = rawChg.slice(0, -1).replace(/[+-]/g, '')
    const mag = digits.length > 0 ? Number(digits) : 1
    return { formula: caretMatch[1], charge: sign * mag }
  }

  // Trailing charge like "Cr2O72-" or "MnO4-" or "Fe3+"
  const trailingMatch = /^([A-Za-z0-9·.*()\[\]]+?)(?:(\d+)?([+-]))$/.exec(trimmed)
  if (trailingMatch) {
    // Ensure the part before looks like a valid formula ending in digit or letter
    const base = trailingMatch[1]
    const mag = trailingMatch[2] ? Number(trailingMatch[2]) : 1
    const sign = trailingMatch[3] === '-' ? -1 : 1
    // Only accept if base ends with formula characters and fallbackCharge was 0
    if (fallbackCharge === 0) {
      return { formula: base, charge: sign * mag }
    }
  }

  return { formula: trimmed, charge: fallbackCharge }
}

/**
 * Determines the oxidation number of each element in a formula, following NCERT rules.
 *
 * @param formula Chemical formula, e.g. "NaH2PO4", "Cr2O7", "Fe3O4", "KI3".
 * @param charge Net ionic charge (defaults to 0).
 * @returns Record of Rational oxidation numbers keyed by element symbol.
 * @throws {RangeError} If formula is empty or more than one element is undetermined.
 */
export function oxidationNumbers(formula: string, charge = 0): Record<string, Rational> {
  if (typeof formula !== 'string' || formula.trim().length === 0) {
    throw new RangeError('Formula must be a non-empty string')
  }

  const { formula: cleanFormula, charge: netCharge } = extractFormulaAndCharge(formula, charge)
  const cleanBase = cleanFormula.replace(/[·.*].*$/, '') // without hydrate for hydride/peroxide checks

  // Structural exceptions table overrides normal averaging (NCERT Section 7.3 special cases)
  if (cleanBase in STRUCTURAL_OXIDATION_EXCEPTIONS) {
    const entry = STRUCTURAL_OXIDATION_EXCEPTIONS[cleanBase]
    const res: Record<string, Rational> = { ...entry.oxidationNumbers }
    Object.defineProperty(res, 'note', { value: entry.note, enumerable: false })
    return res
  }

  const counts: FormulaCounts = parseFormula(cleanFormula)
  const symbols = Object.keys(counts)

  if (symbols.length === 0) {
    throw new RangeError('Formula contains no elements')
  }

  // Rule 1: Free uncombined elements have oxidation number 0
  if (symbols.length === 1 && netCharge === 0) {
    return { [symbols[0]]: makeRational(0, 1) }
  }

  // Rule 2: Monatomic ions have oxidation number equal to charge
  if (symbols.length === 1 && netCharge !== 0) {
    const sym = symbols[0]
    return { [sym]: makeRational(netCharge, counts[sym]) }
  }

  const result: Record<string, Rational> = {}
  const assignmentPriority: Record<string, number> = {}

  // Rule 3: Fluorine is always -1 in all compounds (Priority 10)
  if ('F' in counts) {
    result.F = makeRational(-1, 1)
    assignmentPriority.F = 10
  }

  // Rule 4: Group 1 alkali metals (+1), Group 2 alkaline earth metals (+2), Aluminium (+3) (Priority 9)
  for (const sym of symbols) {
    if (ALKALI_METALS.has(sym)) {
      result[sym] = makeRational(1, 1)
      assignmentPriority[sym] = 9
    } else if (ALKALINE_EARTH_METALS.has(sym)) {
      result[sym] = makeRational(2, 1)
      assignmentPriority[sym] = 9
    } else if (sym === 'Al') {
      result.Al = makeRational(3, 1)
      assignmentPriority.Al = 9
    }
  }

  // Cyanide complexes: treat CN as cyanide group with C +2 and N -3 (Priority 8)
  const hasCyanide = cleanBase.includes('CN')
  if (hasCyanide && 'C' in counts && 'N' in counts && !result.C && !result.N) {
    result.C = makeRational(2, 1)
    result.N = makeRational(-3, 1)
    assignmentPriority.C = 8
    assignmentPriority.N = 8
  }

  // Rule 5: Hydrogen (+1 or -1 in metal hydrides) (Priority 7)
  if ('H' in counts && !result.H) {
    const hasAlkali = symbols.some((s) => ALKALI_METALS.has(s))
    const hasAlkaline = symbols.some((s) => ALKALINE_EARTH_METALS.has(s))
    const isNaBH4 = cleanBase === 'NaBH4'
    const isLiAlH4 = cleanBase === 'LiAlH4'
    const isBinaryMetalHydride = (hasAlkali || hasAlkaline) && symbols.length === 2 && !('O' in counts)

    if (isBinaryMetalHydride || isNaBH4 || isLiAlH4) {
      result.H = makeRational(-1, 1)
      assignmentPriority.H = 7
    } else {
      result.H = makeRational(1, 1)
      assignmentPriority.H = 7
    }
  }

  // Rule 6: Oxygen (-2, or exceptions for OF2, O2F2, peroxides, superoxides) (Priority 6 for exceptions, 5 for normal)
  if ('O' in counts && !result.O) {
    if (cleanBase === 'OF2') {
      result.O = makeRational(2, 1)
      assignmentPriority.O = 6
    } else if (cleanBase === 'O2F2') {
      result.O = makeRational(1, 1)
      assignmentPriority.O = 6
    } else if (PEROXIDES.has(cleanBase)) {
      result.O = makeRational(-1, 1)
      assignmentPriority.O = 6
    } else if (SUPEROXIDES.has(cleanBase)) {
      result.O = makeRational(-1, 2)
      assignmentPriority.O = 6
    } else {
      result.O = makeRational(-2, 1)
      assignmentPriority.O = 5
    }
  }

  // Rule 7: Halogens (Cl, Br, I) (Priority 4)
  // In interhalogens, the MORE electronegative halogen is -1 and the other is positive.
  // Electronegativity order: F > Cl > Br > I
  const hasOxygen = 'O' in counts
  const hasFluorine = 'F' in counts
  const isPolyiodide = cleanBase === 'KI3' || (cleanBase === 'I3' && netCharge === -1)

  const halogensPresent = (['Cl', 'Br', 'I'] as const).filter((h) => h in counts)
  if (halogensPresent.length > 0 && !hasOxygen && !hasFluorine && !isPolyiodide) {
    const mostElectronegative = halogensPresent[0]
    if (!result[mostElectronegative]) {
      result[mostElectronegative] = makeRational(-1, 1)
      assignmentPriority[mostElectronegative] = 4
    }
  }

  // Rule 7b: Binary metal sulphides (Priority 3)
  if ('S' in counts && !result.S && !hasOxygen && !hasFluorine && symbols.length === 2) {
    const otherSym = symbols.find((s) => s !== 'S')
    if (
      otherSym &&
      (TRANSITION_AND_POST_TRANSITION_METALS.has(otherSym) ||
        ALKALI_METALS.has(otherSym) ||
        ALKALINE_EARTH_METALS.has(otherSym))
    ) {
      result.S = makeRational(-2, 1)
      assignmentPriority.S = 3
    }
  }

  // Rule 7c: Common oxoanion groups in salts where MULTIPLE elements are undetermined (Priority 2)
  // In sulphates (SO4), S is +6 and O is -2
  // In nitrates (NO3), N is +5 and O is -2
  // In carbonates (CO3), C is +4 and O is -2
  const undeterminedBeforeOxoanion = symbols.filter((s) => !(s in result))
  if (undeterminedBeforeOxoanion.length > 1) {
    if (cleanBase.includes('SO4') && !result.S) {
      result.S = makeRational(6, 1)
      assignmentPriority.S = 2
    } else if (cleanBase.includes('NO3') && !result.N) {
      result.N = makeRational(5, 1)
      assignmentPriority.N = 2
    } else if (cleanBase.includes('CO3') && !result.C) {
      result.C = makeRational(4, 1)
      assignmentPriority.C = 2
    }
  }

  // Sum rule conflict resolution:
  // If all elements were assigned by fixed rules, check if the sum equals netCharge.
  // When a lower-priority rule (e.g. O -2 in HOF) conflicts with the sum, that element is solved from the sum instead.
  let undetermined = symbols.filter((s) => !(s in result))

  if (undetermined.length === 0) {
    let commonDen = 1
    for (const s of symbols) {
      commonDen *= result[s].den
    }
    let currentSumScaled = 0
    for (const s of symbols) {
      currentSumScaled += counts[s] * result[s].num * (commonDen / result[s].den)
    }

    if (currentSumScaled !== netCharge * commonDen) {
      // Conflict: revoke the assignment of the lowest-priority element and solve via sum rule
      const lowestElem = symbols.reduce((min, s) => {
        const pS = assignmentPriority[s] ?? 999
        const pMin = assignmentPriority[min] ?? 999
        return pS < pMin ? s : min
      }, symbols[0])
      delete result[lowestElem]
      delete assignmentPriority[lowestElem]
      undetermined = [lowestElem]
    } else {
      assertSumRule(result, counts, netCharge, formula)
      return result
    }
  }

  if (undetermined.length > 1) {
    throw new RangeError(
      `Cannot determine oxidation numbers for "${formula}": multiple elements undetermined (${undetermined.join(', ')})`,
    )
  }

  const target = undetermined[0]
  const targetCount = counts[target]

  // Rule 8: Sum rule to solve for the remaining unknown element
  let commonDen = 1
  for (const s of symbols) {
    if (s !== target) {
      commonDen *= result[s].den
    }
  }

  let knownSumScaled = 0
  for (const s of symbols) {
    if (s !== target) {
      const r = result[s]
      knownSumScaled += counts[s] * r.num * (commonDen / r.den)
    }
  }

  const remainingNum = netCharge * commonDen - knownSumScaled
  const remainingDen = targetCount * commonDen

  result[target] = makeRational(remainingNum, remainingDen)

  // ALWAYS assert at the end that Σ(count × ON) equals the charge; throw a RangeError otherwise.
  assertSumRule(result, counts, netCharge, formula)
  return result
}

/**
 * Determines oxidation numbers by site/constituent ion, splitting known polyatomic ions
 * (e.g. NH4+, NO3-, SO4^2-, CN-, etc.) so that differing oxidation states of the same element
 * in distinct chemical environments are separately resolved (e.g. NH4NO3 gives N -3 in NH4+ and N +5 in NO3-).
 *
 * @param formula Chemical formula, e.g. "NH4NO3", "(NH4)2SO4", "FeSO4", "K4[Fe(CN)6]".
 * @param charge Net ionic charge (defaults to 0).
 */
export function oxidationNumbersBySite(formula: string, charge = 0): SiteOxidationResult {
  if (typeof formula !== 'string' || formula.trim().length === 0) {
    throw new RangeError('Formula must be a non-empty string')
  }

  const { formula: cleanFormula, charge: netCharge } = extractFormulaAndCharge(formula, charge)
  const cleanBase = cleanFormula.replace(/[·.*].*$/, '')
  const totalCounts = parseFormula(cleanBase)
  const remainingCounts = { ...totalCounts }

  const matchedSites: SiteOxidation[] = []

  // Check known polyatomic ions
  for (const ion of KNOWN_POLYATOMIC_IONS) {
    if (!cleanBase.includes(ion.formula)) continue
    const ionCounts = parseFormula(ion.formula)

    let fits = 0
    const parenRegex = new RegExp('\\(' + ion.formula + '\\)(\\d+)?')
    const parenMatch = parenRegex.exec(cleanBase)
    if (parenMatch) {
      fits = parenMatch[1] ? Number(parenMatch[1]) : 1
    } else {
      const possible = Math.min(
        ...Object.entries(ionCounts).map(([sym, c]) => Math.floor((remainingCounts[sym] ?? 0) / c)),
      )
      if (possible > 0) fits = possible
    }

    if (fits > 0) {
      let canSubtract = true
      for (const [sym, c] of Object.entries(ionCounts)) {
        if ((remainingCounts[sym] ?? 0) < c * fits) canSubtract = false
      }
      if (canSubtract) {
        for (const [sym, c] of Object.entries(ionCounts)) {
          remainingCounts[sym] -= c * fits
          if (remainingCounts[sym] === 0) delete remainingCounts[sym]
        }
        let ionOx: Record<string, Rational>
        if (ion.formula === 'CN') {
          ionOx = { C: makeRational(2, 1), N: makeRational(-3, 1) }
        } else {
          ionOx = oxidationNumbers(ion.formula, ion.charge)
        }
        matchedSites.push({
          site: ion.siteName,
          formula: ion.formula,
          charge: ion.charge,
          count: fits,
          oxidationNumbers: ionOx,
        })
      }
    }
  }

  // Handle remaining cations / elements
  let knownCharge = matchedSites.reduce((sum, s) => sum + s.count * s.charge, 0)
  for (const sym of Object.keys(remainingCounts)) {
    const c = remainingCounts[sym]
    let ionCharge = 0
    let siteName = sym
    if (ALKALI_METALS.has(sym)) {
      ionCharge = 1
      siteName = `${sym}+`
    } else if (ALKALINE_EARTH_METALS.has(sym)) {
      ionCharge = 2
      siteName = `${sym}^2+`
    } else if (sym === 'Al') {
      ionCharge = 3
      siteName = `${sym}^3+`
    } else {
      const remainingCharge = netCharge - knownCharge
      ionCharge = remainingCharge / c
      const mag = Math.abs(ionCharge)
      const sign = ionCharge > 0 ? '+' : '-'
      siteName = mag === 1 ? `${sym}${sign}` : `${sym}^${mag}${sign}`
    }
    knownCharge += ionCharge * c
    matchedSites.push({
      site: siteName,
      formula: sym,
      charge: ionCharge,
      count: c,
      oxidationNumbers: { [sym]: makeRational(ionCharge, 1) },
    })
  }

  // If no polyatomic ions were found, return the whole formula as single site
  if (matchedSites.length === 0) {
    const ox = oxidationNumbers(cleanBase, netCharge)
    matchedSites.push({
      site: cleanBase,
      formula: cleanBase,
      charge: netCharge,
      count: 1,
      oxidationNumbers: ox,
    })
  }

  const result = [...matchedSites] as SiteOxidationResult
  for (const s of matchedSites) {
    result[s.site] = s.oxidationNumbers
    result[s.formula] = s.oxidationNumbers
    const noCaret = s.site.replace(/\^/g, '')
    result[noCaret] = s.oxidationNumbers
    const baseKey = s.site.replace(/\^?[+-]?\d*[+-]$/, '')
    result[baseKey] = s.oxidationNumbers
  }

  return result
}

const ROMAN_NUMERALS = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII']

/**
 * Returns the Stock notation representation of a compound, matching NCERT Problem 7.3.
 *
 * @example stockName('HAuCl4') // 'HAu(III)Cl4'
 * @example stockName('Fe2O3') // 'Fe2(III)O3'
 */
export function stockName(formula: string, charge = 0): string {
  const ox = oxidationNumbers(formula, charge)
  const counts = parseFormula(formula)
  const symbols = Object.keys(counts)

  // Identify transition/post-transition metal or variable valence element
  const metal = symbols.find((s) => TRANSITION_AND_POST_TRANSITION_METALS.has(s))
  if (!metal || !ox[metal]) {
    return formula
  }

  const oxNum = rationalToNumber(ox[metal])
  const roman = ROMAN_NUMERALS[Math.round(oxNum)] ?? String(oxNum)

  // Place (roman) immediately after the metal and its subscript
  const regex = new RegExp(`(${metal}\\d*)`)
  return formula.replace(regex, `$1(${roman})`)
}

function selectDefaultTargetElement(symbols: string[], formula: string): string {
  const score = (s: string): number => {
    if (ALKALI_METALS.has(s) || ALKALINE_EARTH_METALS.has(s) || s === 'Al' || s === 'F') {
      return 1 // strictly fixed by Rule 2 or Rule 5
    }
    if (s === 'H') {
      const hasMetal = symbols.some((other) => ALKALI_METALS.has(other) || ALKALINE_EARTH_METALS.has(other))
      return hasMetal ? 5 : 3
    }
    if (s === 'O') {
      const isException =
        SUPEROXIDES.has(formula) ||
        PEROXIDES.has(formula) ||
        symbols.includes('F') ||
        symbols.some((other) => ALKALI_METALS.has(other) || ALKALINE_EARTH_METALS.has(other))
      return isException ? 6 : 4
    }
    if (s === 'Cl' || s === 'Br' || s === 'I') {
      const withOorF = symbols.includes('O') || symbols.includes('F')
      return withOorF ? 9 : 2
    }
    return 10 // variable valence transition metals & p-block central atoms
  }

  let best = symbols[0]
  let bestScore = score(symbols[0])
  for (let i = 1; i < symbols.length; i++) {
    const s = symbols[i]
    const sc = score(s)
    if (sc > bestScore) {
      best = s
      bestScore = sc
    }
  }
  return best
}

function nonTargetRulePriority(element: string): number {
  if (ALKALI_METALS.has(element) || ALKALINE_EARTH_METALS.has(element) || element === 'Al') return 1 // Rule 2
  if (element === 'F') return 2 // Rule 5
  if (element === 'H') return 3 // Rule 4
  if (element === 'O') return 4 // Rule 3
  if (element === 'Cl' || element === 'Br' || element === 'I') return 5 // Rule 5
  return 6
}

/**
 * Generates an ordered list of reasoning steps used to derive an element's oxidation number.
 *
 * @param formula Chemical formula
 * @param charge Net ionic charge
 * @param targetElement The element to solve for (defaults to the sum-rule solved element)
 */
export function explainOxidationNumber(
  formula: string,
  charge = 0,
  targetElement?: string,
): OxidationExplanation {
  const { formula: cleanFormula, charge: netCharge } = extractFormulaAndCharge(formula, charge)
  const cleanBase = cleanFormula.replace(/[·.*].*$/, '')

  if (cleanBase in STRUCTURAL_OXIDATION_EXCEPTIONS) {
    const entry = STRUCTURAL_OXIDATION_EXCEPTIONS[cleanBase]
    const counts = parseFormula(cleanBase)
    const symbols = Object.keys(counts)
    const target = targetElement ?? selectDefaultTargetElement(symbols, cleanBase)
    const finalVal = entry.oxidationNumbers[target] ?? makeRational(0, 1)
    return {
      formula,
      charge: netCharge,
      targetElement: target,
      finalOxidationNumber: finalVal,
      steps: [
        {
          element: target,
          ruleApplied: `Structural exception: ${entry.note}`,
          assignedValue: finalVal,
        },
      ],
    }
  }

  const ox = oxidationNumbers(formula, charge)
  const counts = parseFormula(formula)
  const symbols = Object.keys(counts)

  const target = targetElement ?? selectDefaultTargetElement(symbols, formula)
  if (!counts[target]) {
    throw new RangeError(`Element "${target}" does not exist in formula "${formula}"`)
  }

  const steps: OxidationStep[] = []

  // Order non-target elements by rule priority so fixed-value rules come first
  const nonTargetSymbols = symbols
    .filter((s) => s !== target)
    .sort((a, b) => nonTargetRulePriority(a) - nonTargetRulePriority(b))

  for (const s of nonTargetSymbols) {
    const val = ox[s]
    let rule = `NCERT rule assignment for ${s}`
    if (ALKALI_METALS.has(s)) {
      rule = 'Alkali metal (Group 1) is always +1 in compounds (Rule 2)'
    } else if (ALKALINE_EARTH_METALS.has(s)) {
      rule = 'Alkaline earth metal (Group 2) is always +2 in compounds (Rule 2)'
    } else if (s === 'Al') {
      rule = 'Aluminium is always +3 in its compounds (Rule 2)'
    } else if (s === 'F') {
      rule = 'Fluorine is always −1 in all its compounds (Rule 5)'
    } else if (s === 'H') {
      rule = val.num < 0 ? 'Hydrogen is −1 in metal hydrides (Rule 4 exception)' : 'Hydrogen is +1 in compounds with non-metals (Rule 4)'
    } else if (s === 'O') {
      if (val.num === -1 && val.den === 1) rule = 'Oxygen is −1 in peroxides (Rule 3 exception)'
      else if (val.num === -1 && val.den === 2) rule = 'Oxygen is −1/2 in superoxides (Rule 3 exception)'
      else if (val.num > 0) rule = `Oxygen is positive (${rationalToString(val).replace(/-/g, '−')}) when bonded to fluorine (Rule 3 exception)`
      else if (val.num === -2 && val.den === 1) rule = 'Oxygen is −2 in most compounds (Rule 3)'
      else rule = `Oxygen is ${rationalToString(val).replace(/-/g, '−')} here, fixed by the sum rule (Rule 6)`
    } else if (s === 'Cl' || s === 'Br' || s === 'I') {
      rule = `Halogen ${s} has oxidation number −1 as halide (Rule 5)`
    }
    steps.push({
      element: s,
      ruleApplied: rule,
      assignedValue: val,
    })
  }

  // Target step (sum rule / exception check)
  const finalVal = ox[target]
  const terms = symbols
    .map((s) => {
      const c = counts[s]
      const countPrefix = c === 1 ? '' : `${c} × `
      if (s === target) {
        return `${countPrefix}x`
      }
      return `${countPrefix}(${rationalToString(ox[s]).replace(/-/g, '−')})`
    })
    .join(' + ')

  const chargeStr = charge === 0 ? '0' : charge > 0 ? `+${charge}` : `−${Math.abs(charge)}`

  let targetRule = 'Sum rule: algebraic sum of oxidation numbers equals net charge (Rule 6)'
  if (target === 'O') {
    if (finalVal.num === -1 && finalVal.den === 2) {
      targetRule = 'Oxygen is −1/2 in superoxides (Rule 3 exception); checked by the sum rule (Rule 6)'
    } else if (finalVal.num === -1 && finalVal.den === 1) {
      targetRule = 'Oxygen is −1 in peroxides (Rule 3 exception); checked by the sum rule (Rule 6)'
    } else if (finalVal.num > 0 && symbols.includes('F')) {
      targetRule = `Oxygen is positive (${rationalToString(finalVal).replace(/-/g, '−')}) when bonded to fluorine (Rule 3 exception); checked by the sum rule (Rule 6)`
    }
  } else if (target === 'H' && finalVal.num < 0) {
    targetRule = 'Hydrogen is −1 in metal hydrides (Rule 4 exception); checked by the sum rule (Rule 6)'
  }

  steps.push({
    element: target,
    ruleApplied: targetRule,
    equation: `${terms} = ${chargeStr}`,
    assignedValue: finalVal,
  })

  return {
    formula,
    charge,
    targetElement: target,
    finalOxidationNumber: finalVal,
    steps,
  }
}
