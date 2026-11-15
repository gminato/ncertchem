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
  const cleanBase = cleanFormula.replace(/[·.*].*$/, '') // without hydrate for hydride/peroxide checks

  // Rule 3: Fluorine is always -1
  if ('F' in counts) {
    result.F = makeRational(-1, 1)
  }

  // Rule 4: Alkali metals (+1), Alkaline earth metals (+2), Aluminium (+3)
  for (const sym of symbols) {
    if (ALKALI_METALS.has(sym)) {
      result[sym] = makeRational(1, 1)
    } else if (ALKALINE_EARTH_METALS.has(sym)) {
      result[sym] = makeRational(2, 1)
    } else if (sym === 'Al') {
      result.Al = makeRational(3, 1)
    }
  }

  // Rule 5: Hydrogen (+1 or -1 in metal hydrides)
  if ('H' in counts && !result.H) {
    const hasAlkali = symbols.some((s) => ALKALI_METALS.has(s))
    const hasAlkaline = symbols.some((s) => ALKALINE_EARTH_METALS.has(s))
    const isNaBH4 = cleanBase === 'NaBH4'
    const isLiAlH4 = cleanBase === 'LiAlH4'
    const isBinaryMetalHydride = (hasAlkali || hasAlkaline) && symbols.length === 2 && !('O' in counts)

    if (isBinaryMetalHydride || isNaBH4 || isLiAlH4) {
      result.H = makeRational(-1, 1)
    } else {
      result.H = makeRational(1, 1)
    }
  }

  // Rule 6: Oxygen (-2, or exceptions for OF2, O2F2, peroxides, superoxides)
  if ('O' in counts && !result.O) {
    if (cleanBase === 'OF2') {
      result.O = makeRational(2, 1)
    } else if (cleanBase === 'O2F2') {
      result.O = makeRational(1, 1)
    } else if (PEROXIDES.has(cleanBase)) {
      result.O = makeRational(-1, 1)
    } else if (SUPEROXIDES.has(cleanBase)) {
      result.O = makeRational(-1, 2)
    } else {
      result.O = makeRational(-2, 1)
    }
  }

  // Rule 7: Halogens (Cl, Br, I) as halides (-1) when not bonded to O or more electronegative halogens
  // Special polyiodides like KI3 or I3- are not assigned -1 so the sum rule solves for the average
  const hasOxygen = 'O' in counts
  const hasFluorine = 'F' in counts
  const isPolyiodide = cleanBase === 'KI3' || (cleanBase === 'I3' && netCharge === -1)

  for (const hal of ['Cl', 'Br', 'I'] as const) {
    if (hal in counts && !result[hal] && !hasOxygen && !hasFluorine && !isPolyiodide) {
      // If there are other elements in the compound besides alkali/alkaline earth metals, assign halide -1
      // e.g. SiCl4, TiCl4, CCl4, HAuCl4, CuI, FeCl3
      result[hal] = makeRational(-1, 1)
    }
  }

  // Rule 7b: Binary metal sulphides (e.g. Cu2S, Na2S, ZnS, FeS, MgS, HgS) where S is sulphide (-2)
  if ('S' in counts && !result.S && !hasOxygen && !hasFluorine && symbols.length === 2) {
    const otherSym = symbols.find((s) => s !== 'S')
    if (
      otherSym &&
      (TRANSITION_AND_POST_TRANSITION_METALS.has(otherSym) ||
        ALKALI_METALS.has(otherSym) ||
        ALKALINE_EARTH_METALS.has(otherSym))
    ) {
      result.S = makeRational(-2, 1)
    }
  }

  // Rule 7c: Common oxoanion groups in salts:
  // In sulphates (SO4 group), S is +6 and O is -2
  // In nitrates (NO3 group), N is +5 and O is -2
  // In carbonates (CO3 group), C is +4 and O is -2
  if (symbols.length > 2) {
    if (cleanBase.includes('SO4') && !result.S) {
      result.S = makeRational(6, 1)
    } else if (cleanBase.includes('NO3') && !result.N) {
      result.N = makeRational(5, 1)
    } else if (cleanBase.includes('CO3') && !result.C) {
      result.C = makeRational(4, 1)
    }
  }

  // Rule 8: Sum rule to solve for the remaining unknown element
  const undetermined = symbols.filter((s) => !(s in result))

  if (undetermined.length === 0) {
    return result
  }

  if (undetermined.length > 1) {
    throw new RangeError(
      `Cannot determine oxidation numbers for "${formula}": multiple elements undetermined (${undetermined.join(', ')})`,
    )
  }

  const target = undetermined[0]
  const targetCount = counts[target]

  // Known sum: S = sum(count[E] * num / den)
  // Bring to common denominator
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

  // targetCount * ox[target] * commonDen + knownSumScaled = netCharge * commonDen
  // targetCount * ox[target] * commonDen = netCharge * commonDen - knownSumScaled
  const remainingNum = netCharge * commonDen - knownSumScaled
  const remainingDen = targetCount * commonDen

  result[target] = makeRational(remainingNum, remainingDen)
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
  const ox = oxidationNumbers(formula, charge)
  const counts = parseFormula(formula)
  const symbols = Object.keys(counts)

  const target = targetElement ?? symbols.find((s) => s !== 'O' && s !== 'H' && !ALKALI_METALS.has(s)) ?? symbols[0]
  if (!counts[target]) {
    throw new RangeError(`Element "${target}" does not exist in formula "${formula}"`)
  }

  const steps: OxidationStep[] = []

  for (const s of symbols) {
    if (s === target) {
      continue
    }
    const val = ox[s]
    let rule = `NCERT rule assignment for ${s}`
    if (ALKALI_METALS.has(s)) {
      rule = 'Alkali metal (Group 1) is always +1 in compounds (Rule 2)'
    } else if (ALKALINE_EARTH_METALS.has(s)) {
      rule = 'Alkaline earth metal (Group 2) is always +2 in compounds (Rule 2)'
    } else if (s === 'Al') {
      rule = 'Aluminium is always +3 in its compounds (Rule 2)'
    } else if (s === 'F') {
      rule = 'Fluorine is always -1 in all its compounds (Rule 5)'
    } else if (s === 'H') {
      rule = val.num < 0 ? 'Hydrogen is -1 in metal hydrides (Rule 4 exception)' : 'Hydrogen is +1 in compounds with non-metals (Rule 4)'
    } else if (s === 'O') {
      rule = val.num === -1 ? 'Oxygen is -1 in peroxides (Rule 3 exception)' : 'Oxygen is -2 in most compounds (Rule 3)'
    } else if (s === 'Cl' || s === 'Br' || s === 'I') {
      rule = `Halogen ${s} has oxidation number -1 as halide (Rule 5)`
    }
    steps.push({
      element: s,
      ruleApplied: rule,
      assignedValue: val,
    })
  }

  // Sum rule step
  const finalVal = ox[target]
  const terms = symbols
    .map((s) => {
      const c = counts[s]
      const countPrefix = c === 1 ? '' : `${c} × `
      if (s === target) {
        return `${countPrefix}x`
      }
      return `${countPrefix}(${rationalToString(ox[s])})`
    })
    .join(' + ')

  steps.push({
    element: target,
    ruleApplied: 'Sum rule: algebraic sum of oxidation numbers equals net charge (Rule 6)',
    equation: `${terms} = ${charge}`,
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
