import { ELEMENTS, type Element } from './elements'

/** Number of atoms of each element, keyed by chemical symbol. */
export type FormulaCounts = Record<string, number>

function lookupElement(symbol: string): Element {
  const element = ELEMENTS[symbol]
  if (!element) {
    throw new RangeError(`Unknown element symbol "${symbol}"`)
  }
  return element
}

function isDigit(ch: string): boolean {
  return ch >= '0' && ch <= '9'
}

function isUpper(ch: string): boolean {
  return ch >= 'A' && ch <= 'Z'
}

function isLower(ch: string): boolean {
  return ch >= 'a' && ch <= 'z'
}

function addScaled(target: FormulaCounts, source: FormulaCounts, factor: number): void {
  for (const symbol of Object.keys(source)) {
    target[symbol] = (target[symbol] ?? 0) + source[symbol] * factor
  }
}

/**
 * Parses one hydrate-free part of a formula (no '·', '.' or '*' separators),
 * handling element symbols, digit subscripts and nested ( ) or [ ] groups.
 */
function parsePart(part: string): FormulaCounts {
  if (part.length === 0) {
    throw new RangeError('Malformed formula: empty part')
  }

  const stack: FormulaCounts[] = [{}]
  const expectedClosers: string[] = []
  let i = 0

  const readCount = (): number => {
    const start = i
    while (i < part.length && isDigit(part[i])) {
      i++
    }
    if (i === start) {
      return 1
    }
    const count = Number(part.slice(start, i))
    if (count < 1) {
      throw new RangeError(`Malformed formula "${part}": subscripts must be at least 1`)
    }
    return count
  }

  while (i < part.length) {
    const ch = part[i]

    if (isUpper(ch)) {
      let symbol = ch
      i++
      if (i < part.length && isLower(part[i])) {
        symbol += part[i]
        i++
      }
      lookupElement(symbol)
      const count = readCount()
      const top = stack[stack.length - 1]
      top[symbol] = (top[symbol] ?? 0) + count
    } else if (ch === '(' || ch === '[') {
      stack.push({})
      expectedClosers.push(ch === '(' ? ')' : ']')
      i++
    } else if (ch === ')' || ch === ']') {
      const expected = expectedClosers.pop()
      if (expected === undefined || expected !== ch) {
        throw new RangeError(`Malformed formula "${part}": unmatched "${ch}"`)
      }
      const group = stack.pop()
      if (group === undefined) {
        throw new RangeError(`Malformed formula "${part}": unmatched "${ch}"`)
      }
      i++
      const multiplier = readCount()
      addScaled(stack[stack.length - 1], group, multiplier)
    } else {
      throw new RangeError(`Malformed formula "${part}": unexpected character "${ch}"`)
    }
  }

  if (expectedClosers.length > 0) {
    throw new RangeError(`Malformed formula "${part}": unclosed group`)
  }
  return stack[0]
}

/**
 * Parses a chemical formula into atom counts per element.
 *
 * Supports element symbols, digit subscripts, ( ) and [ ] groups, and hydrate
 * notation with a middle dot, full stop or asterisk (e.g. "CuSO4·5H2O").
 *
 * @example parseFormula('Ca(OH)2') // { Ca: 1, O: 2, H: 2 }
 * @throws {RangeError} On an unknown element symbol or malformed input
 */
export function parseFormula(formula: string): FormulaCounts {
  if (typeof formula !== 'string' || formula.length === 0) {
    throw new RangeError('Formula must be a non-empty string')
  }

  const parts = formula.split(/[·.*]/)
  const total: FormulaCounts = {}

  parts.forEach((rawPart, index) => {
    let multiplier = 1
    let body = rawPart

    if (index > 0) {
      const match = /^(\d+)(.+)$/.exec(rawPart)
      if (match) {
        multiplier = Number(match[1])
        if (multiplier < 1) {
          throw new RangeError(`Malformed formula "${formula}": hydrate multiplier must be at least 1`)
        }
        body = match[2]
      }
    }

    addScaled(total, parsePart(body), multiplier)
  })

  return total
}

/**
 * Molar mass of a set of atom counts, in g mol⁻¹ (unrounded sum of atomic masses).
 *
 * @throws {RangeError} On an unknown element symbol
 */
export function molarMassOfCounts(counts: FormulaCounts): number {
  let mass = 0
  for (const symbol of Object.keys(counts)) {
    mass += lookupElement(symbol).atomicMass * counts[symbol]
  }
  return mass
}

/**
 * Molar mass of a formula in g mol⁻¹, as the sum of NCERT atomic masses (unrounded).
 * For example, molarMass('H2O') is 18.016 (NCERT quotes 18.02).
 *
 * @throws {RangeError} On an invalid formula
 */
export function molarMass(formula: string): number {
  return molarMassOfCounts(parseFormula(formula))
}

/**
 * Mass percentage of each element in a compound: 100 × (mass of element) / (molar mass).
 *
 * @throws {RangeError} On an invalid formula
 */
export function massPercent(formula: string): Record<string, number> {
  const counts = parseFormula(formula)
  const total = molarMassOfCounts(counts)
  const percent: Record<string, number> = {}
  for (const symbol of Object.keys(counts)) {
    percent[symbol] = (100 * lookupElement(symbol).atomicMass * counts[symbol]) / total
  }
  return percent
}

/** Tolerance (in units of atoms) when deciding that a scaled ratio is a whole number. */
const WHOLE_TOLERANCE = 0.1

/**
 * Empirical formula from mass percentages, following NCERT's method:
 * 1. divide each percentage by the element's atomic mass (moles of each element);
 * 2. divide all by the smallest;
 * 3. round to whole numbers, first multiplying the ratios by 2, 3 or 4 if they lie
 *    within 0.1 of x.5, x.33 (or x.67) or x.25 (or x.75).
 *
 * @param percentByMass Mass percentage of each element, e.g. { H: 4.07, C: 24.27, Cl: 71.65 }
 * @throws {RangeError} On an unknown symbol or a non-positive percentage
 */
export function empiricalFormula(percentByMass: Record<string, number>): FormulaCounts {
  const symbols = Object.keys(percentByMass)
  if (symbols.length === 0) {
    throw new RangeError('At least one element percentage is required')
  }

  const moles: Record<string, number> = {}
  for (const symbol of symbols) {
    const percent = percentByMass[symbol]
    const element = lookupElement(symbol)
    if (!Number.isFinite(percent) || percent <= 0) {
      throw new RangeError(`Percentage for ${symbol} must be a positive number (received ${percent})`)
    }
    moles[symbol] = percent / element.atomicMass
  }

  const smallest = Math.min(...symbols.map((symbol) => moles[symbol]))
  const ratios = symbols.map((symbol) => moles[symbol] / smallest)

  // Smallest multiplier (1, 2, 3, 4) that makes every ratio a whole number within tolerance.
  let multiplier = 1
  for (const candidate of [1, 2, 3, 4]) {
    const allWhole = ratios.every((ratio) => {
      const scaled = ratio * candidate
      return Math.abs(scaled - Math.round(scaled)) <= WHOLE_TOLERANCE
    })
    if (allWhole) {
      multiplier = candidate
      break
    }
  }

  const counts: FormulaCounts = {}
  symbols.forEach((symbol, index) => {
    counts[symbol] = Math.round(ratios[index] * multiplier)
  })
  return counts
}

/**
 * Molecular formula from an empirical formula and the molar mass of the compound.
 * The multiplier n = molar mass / empirical formula mass must be a whole number.
 *
 * @param empirical Atom counts of the empirical formula, e.g. { C: 1, H: 2, Cl: 1 }
 * @param molarMassGPerMol Molar mass of the compound in g mol⁻¹
 * @throws {RangeError} If the molar mass is not a positive whole multiple of the empirical mass
 */
export function molecularFormula(empirical: FormulaCounts, molarMassGPerMol: number): FormulaCounts {
  if (!Number.isFinite(molarMassGPerMol) || molarMassGPerMol <= 0) {
    throw new RangeError(`Molar mass must be a positive number (received ${molarMassGPerMol})`)
  }
  const empiricalMass = molarMassOfCounts(empirical)
  const ratio = molarMassGPerMol / empiricalMass
  const n = Math.round(ratio)
  if (n < 1 || Math.abs(ratio - n) > WHOLE_TOLERANCE) {
    throw new RangeError(
      `Molar mass ${molarMassGPerMol} is not a whole multiple of the empirical formula mass ${empiricalMass.toFixed(3)}`
    )
  }
  const counts: FormulaCounts = {}
  for (const symbol of Object.keys(empirical)) {
    counts[symbol] = empirical[symbol] * n
  }
  return counts
}

/**
 * Formats atom counts as a formula string, in Hill-style order: C first, then H,
 * then the remaining elements alphabetically. A count of 1 is omitted.
 * Note: H is placed second even when there is no carbon (so HCl, not ClH).
 *
 * @throws {RangeError} On an unknown symbol or a count that is not a positive integer
 */
export function formatFormula(counts: FormulaCounts): string {
  const symbols = Object.keys(counts)
  for (const symbol of symbols) {
    lookupElement(symbol)
    const count = counts[symbol]
    if (!Number.isInteger(count) || count < 1) {
      throw new RangeError(`Atom count for ${symbol} must be a positive integer (received ${count})`)
    }
  }

  const ordered = symbols
    .filter((symbol) => symbol !== 'C' && symbol !== 'H')
    .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
  const leading = ['C', 'H'].filter((symbol) => symbol in counts)

  return [...leading, ...ordered]
    .map((symbol) => (counts[symbol] === 1 ? symbol : `${symbol}${counts[symbol]}`))
    .join('')
}
