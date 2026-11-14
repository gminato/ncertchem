const SUPERSCRIPT: Record<string, string> = {
  '0': '⁰',
  '1': '¹',
  '2': '²',
  '3': '³',
  '4': '⁴',
  '5': '⁵',
  '6': '⁶',
  '7': '⁷',
  '8': '⁸',
  '9': '⁹',
  '-': '⁻',
}

/** Writes an integer exponent with Unicode superscript digits, e.g. -19 → "⁻¹⁹". */
export function superscript(n: number): string {
  return String(Math.round(n))
    .split('')
    .map((ch) => SUPERSCRIPT[ch] ?? ch)
    .join('')
}

/**
 * A number in scientific notation, with the minus sign as U+2212 and the
 * exponent in superscript, e.g. sci(-1.602176e-19, 4) → "−1.602 × 10⁻¹⁹".
 *
 * @param digits Significant figures in the mantissa
 */
export function sci(value: number, digits: number): string {
  if (value === 0) return '0'
  const exponent = Math.floor(Math.log10(Math.abs(value)))
  let mantissa = value / 10 ** exponent
  let fixed = mantissa.toFixed(Math.max(0, digits - 1))
  // Rounding can push the mantissa to 10.
  if (Math.abs(Number(fixed)) >= 10) {
    mantissa /= 10
    fixed = mantissa.toFixed(Math.max(0, digits - 1))
    return `${fixed.replace('-', '−')} × 10${superscript(exponent + 1)}`
  }
  const sign = value < 0 ? '−' : ''
  return `${sign}${fixed.replace('-', '')} × 10${superscript(exponent)}`
}

/** Clamps a Step index to 0..count-1 and rounds non-integers. */
export function clampIndex(step: number, count: number): number {
  if (!Number.isFinite(step)) return 0
  return Math.min(count - 1, Math.max(0, Math.round(step)))
}
