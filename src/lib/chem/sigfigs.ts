/**
 * Significant-figure utilities, following NCERT Class 11 Unit 1 (section 1.4).
 *
 * Inputs that must preserve trailing zeros are strings. Rounding is done on the
 * decimal digits of the number, not on binary floating-point values.
 */

interface ParsedDecimal {
  negative: boolean
  intDigits: string
  fracDigits: string
  hasPoint: boolean
  exponent: number
}

interface RoundedDigits {
  negative: boolean
  /** Exactly `sig` digits, most significant first. */
  digits: string
  /** Power of ten of the first digit. */
  exponent: number
}

const SUPERSCRIPT_TO_ASCII: Record<string, string> = {
  '⁰': '0',
  '¹': '1',
  '²': '2',
  '³': '3',
  '⁴': '4',
  '⁵': '5',
  '⁶': '6',
  '⁷': '7',
  '⁸': '8',
  '⁹': '9',
  '⁻': '-',
  '⁺': '+',
}

const DECIMAL_PATTERN = /^([+-]?)(\d+(?:\.\d*)?|\.\d+)(?:\s*(?:[eE]|[x×*]\s*10\s*\^?)\s*([+-]?\d+))?$/

/**
 * Parses a decimal string such as "0.0025", "100.", "2.0e3", "2.0×10³" or "8.256×10-3".
 * Superscript exponent characters are accepted and normalised.
 *
 * @throws {RangeError} If the string is not a recognisable decimal number
 */
function parseDecimalString(input: string): ParsedDecimal {
  if (typeof input !== 'string') {
    throw new RangeError('Value must be a string')
  }
  const normalised = input.trim().replace(/([⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺]+)$/u, (run) => {
    return '^' + [...run].map((ch) => SUPERSCRIPT_TO_ASCII[ch]).join('')
  })

  const match = DECIMAL_PATTERN.exec(normalised)
  if (!match) {
    throw new RangeError(`Not a recognisable number: "${input}"`)
  }

  const [, sign, mantissa, exp] = match
  const pointIndex = mantissa.indexOf('.')
  const hasPoint = pointIndex !== -1
  const intDigits = hasPoint ? mantissa.slice(0, pointIndex) : mantissa
  const fracDigits = hasPoint ? mantissa.slice(pointIndex + 1) : ''

  return {
    negative: sign === '-',
    intDigits,
    fracDigits,
    hasPoint,
    exponent: exp === undefined ? 0 : Number(exp),
  }
}

/**
 * Counts significant figures in a decimal string, using NCERT's rules:
 * - non-zero digits are always significant;
 * - zeros before the first non-zero digit are not significant ("0.0025" has 2);
 * - zeros between non-zero digits are significant ("2.005" has 4);
 * - trailing zeros are significant only after a decimal point ("2.500" has 4,
 *   "100" has 1, "100." has 3);
 * - in scientific notation only the mantissa counts ("2.0e3" has 2).
 * A value of zero is counted as one significant figure.
 *
 * @throws {RangeError} If the string is not a recognisable number
 */
export function countSigFigs(value: string): number {
  const parsed = parseDecimalString(value)
  const digits = parsed.intDigits + parsed.fracDigits
  const significant = digits.replace(/^0+/, '')
  if (significant.length === 0) {
    return 1
  }
  if (parsed.hasPoint) {
    return significant.length
  }
  return significant.replace(/0+$/, '').length
}

/**
 * Rounds |x| to `sig` significant digits using NCERT's rule, applied to the
 * shortest decimal representation of x:
 * - removed digit > 5: round up;
 * - removed digit < 5: round down;
 * - removed digit exactly 5 (with nothing non-zero after it): round to the even digit,
 *   so the preceding digit goes up only if it is odd (6.35 -> 6.4, 6.25 -> 6.2).
 *   A 5 followed by a non-zero digit rounds up.
 */
function roundToDigits(x: number, sig: number): RoundedDigits {
  if (!Number.isFinite(x)) {
    throw new RangeError(`Value must be finite (received ${x})`)
  }
  if (!Number.isInteger(sig) || sig < 1) {
    throw new RangeError(`Number of significant figures must be a positive integer (received ${sig})`)
  }

  const negative = x < 0
  const magnitude = Math.abs(x)
  if (magnitude === 0) {
    return { negative: false, digits: '0'.repeat(sig), exponent: 0 }
  }

  const [mantissa, expText] = magnitude.toExponential().split('e')
  const exponent = Number(expText)
  const all = mantissa.replace('.', '')
  const keep = all.slice(0, sig).padEnd(sig, '0')
  const rest = all.slice(sig)

  if (rest.length === 0) {
    return { negative, digits: keep, exponent }
  }

  const first = rest[0]
  const restHasNonZero = /[1-9]/.test(rest.slice(1))
  const lastKeptIsOdd = Number(keep[sig - 1]) % 2 === 1
  const roundUp = first > '5' || (first === '5' && (restHasNonZero || lastKeptIsOdd))

  if (!roundUp) {
    return { negative, digits: keep, exponent }
  }

  // Add one to the kept digits, propagating carries.
  const chars = keep.split('')
  let index = sig - 1
  while (index >= 0) {
    if (chars[index] === '9') {
      chars[index] = '0'
      index--
    } else {
      chars[index] = String(Number(chars[index]) + 1)
      break
    }
  }
  if (index < 0) {
    // All nines carried out: 9.96 -> 10.0 at two significant figures.
    return { negative, digits: '1' + '0'.repeat(sig - 1), exponent: exponent + 1 }
  }
  return { negative, digits: chars.join(''), exponent }
}

/**
 * Rounds a number to `n` significant figures and returns a plain decimal string
 * that keeps trailing zeros, e.g. roundToSigFigs(2.0004, 3) is "2.00".
 * Values of 10^n or more with trailing zeros are written in full (roundToSigFigs(100, 1) is "100"),
 * so use toScientific when the significant-figure count must be unambiguous.
 *
 * @throws {RangeError} If x is not finite or n is not a positive integer
 */
export function roundToSigFigs(x: number, n: number): string {
  const { negative, digits, exponent } = roundToDigits(x, n)
  const sign = negative ? '-' : ''
  const count = digits.length

  if (exponent >= count - 1) {
    return sign + digits + '0'.repeat(exponent - (count - 1))
  }
  if (exponent >= 0) {
    const integerPart = digits.slice(0, exponent + 1)
    const fractionPart = digits.slice(exponent + 1)
    return `${sign}${integerPart}.${fractionPart}`
  }
  return `${sign}0.${'0'.repeat(-exponent - 1)}${digits}`
}

/**
 * Formats a number in scientific notation with `sig` significant figures, e.g.
 * toScientific(0.0025, 2) is "2.5×10^-3".
 *
 * @throws {RangeError} If x is not finite or sig is not a positive integer
 */
export function toScientific(x: number, sig: number): string {
  const { negative, digits, exponent } = roundToDigits(x, sig)
  const mantissa = digits.length > 1 ? `${digits[0]}.${digits.slice(1)}` : digits
  return `${negative ? '-' : ''}${mantissa}×10^${exponent}`
}

/**
 * Significant figures of a product or quotient: the result keeps the fewest
 * significant figures of any input.
 *
 * @throws {RangeError} If no values are given or a value is not recognisable
 */
export function sigFigsForProduct(...values: string[]): number {
  if (values.length === 0) {
    throw new RangeError('At least one value is required')
  }
  return Math.min(...values.map(countSigFigs))
}

/**
 * Decimal places of a sum or difference: the result keeps the fewest decimal
 * places of any input. Scientific notation is taken into account.
 *
 * @throws {RangeError} If no values are given or a value is not recognisable
 */
export function decimalPlacesForSum(...values: string[]): number {
  if (values.length === 0) {
    throw new RangeError('At least one value is required')
  }
  const places = values.map((value) => {
    const parsed = parseDecimalString(value)
    return Math.max(0, parsed.fracDigits.length - parsed.exponent)
  })
  return Math.min(...places)
}
