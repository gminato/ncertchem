import type { ReactNode } from 'react'

/** Replaces the ASCII hyphen-minus in a number with the true minus sign, U+2212. */
export function trueMinus(text: string): string {
  return text.replace(/-/g, '−')
}

/**
 * Raised text inside a <text> element. The trailing tspan returns the baseline,
 * so text written after this component sits on the line again.
 */
export function Sup({ children }: { children: ReactNode }): ReactNode {
  return (
    <>
      <tspan dy="-0.45em" fontSize="0.72em">
        {children}
      </tspan>
      <tspan dy="0.45em" />
    </>
  )
}

/** A power of ten as SVG text, 10 with a raised exponent such as 10⁻³⁴. */
export function PowerOfTen({ exp }: { exp: number }): ReactNode {
  return (
    <>
      10
      <Sup>{trueMinus(String(exp))}</Sup>
    </>
  )
}

/**
 * A number in scientific notation as SVG text, such as 7.3 × 10⁻¹⁰ m. The
 * mantissa is given already rounded; the exponent is raised.
 */
export function Scientific({
  mantissa,
  exp,
  unit,
}: {
  mantissa: string
  exp: number
  unit?: string
}): ReactNode {
  return (
    <>
      {mantissa} × <PowerOfTen exp={exp} />
      {unit ? ` ${unit}` : null}
    </>
  )
}

/** Splits a positive or negative value into a rounded mantissa and an integer exponent. */
export function splitScientific(value: number, digits = 1): { mantissa: string; exp: number } {
  const exp = Math.floor(Math.log10(Math.abs(value)))
  const mantissa = (value / 10 ** exp).toFixed(digits)
  return { mantissa, exp }
}
