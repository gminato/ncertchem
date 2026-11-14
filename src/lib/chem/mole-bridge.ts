import { AVOGADRO } from './constants'
import { molarMass, parseFormula } from './formula'
import { roundToSigFigs } from './sigfigs'

/**
 * Decimal places of the molar masses used in the mole-bridge calculations. NCERT
 * quotes molar masses to two decimal places (18.02 g mol⁻¹), and rounding them
 * first lets a worked line be checked with a pocket calculator.
 */
export const BRIDGE_MOLAR_MASS_DECIMALS = 2

/** Significant figures used when a number is written in the worked lines. */
export const BRIDGE_SIG_FIGS = 4

export type SubstanceResult =
  | { ok: true; formula: string; molarMass: number }
  | { ok: false; message: string }

/**
 * Reads a formula typed by the Learner. Valid input gives its molar mass,
 * rounded for display and calculation. Invalid input gives a message that the
 * Learner can act on, and never throws.
 */
export function resolveSubstance(input: string): SubstanceResult {
  const formula = input.trim()
  if (formula === '') {
    return { ok: false, message: 'Type a formula, such as CH4 or Na2CO3.' }
  }
  try {
    parseFormula(formula)
    return { ok: true, formula, molarMass: bridgeMolarMass(formula) }
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'not a valid formula'
    return {
      ok: false,
      message: `Cannot read "${formula}": ${reason}. Use element symbols with a capital first letter, such as NaCl.`,
    }
  }
}

/**
 * The molar mass of a formula in g mol⁻¹, rounded to BRIDGE_MOLAR_MASS_DECIMALS,
 * e.g. 18.02 for H₂O (the unrounded sum is 18.016).
 *
 * @throws {RangeError} On an invalid formula
 */
export function bridgeMolarMass(formula: string): number {
  return Number(molarMass(formula).toFixed(BRIDGE_MOLAR_MASS_DECIMALS))
}

const SUPERSCRIPT_DIGITS = '⁰¹²³⁴⁵⁶⁷⁸⁹'

/** Superscript text for an integer exponent, e.g. 23 gives "²³" and -3 gives "⁻³". */
export function superscript(n: number): string {
  return String(n).replace(/-|\d/g, (ch) => (ch === '-' ? '⁻' : SUPERSCRIPT_DIGITS[Number(ch)]))
}

/**
 * Normalised scientific notation (1 ≤ mantissa < 10) to `sig` significant
 * figures, as the mantissa text and the exponent. Rounding that reaches 10 is
 * carried into the exponent, so 9.9999e23 gives "1.000" and 24.
 */
export function scientificParts(x: number, sig = BRIDGE_SIG_FIGS): { mantissa: string; exponent: number } {
  if (x === 0) return { mantissa: (0).toFixed(sig - 1), exponent: 0 }
  const [mantissa, exponent] = x.toExponential(sig - 1).split('e')
  return { mantissa, exponent: Number(exponent) }
}

/**
 * A large or tiny number in scientific notation with the ×10ⁿ superscript
 * form used on the site, e.g. formatScientific(6.02214076e23, 4) is "6.022 × 10²³".
 */
export function formatScientific(x: number, sig = BRIDGE_SIG_FIGS): string {
  if (x === 0) return '0'
  const [mantissa, exponent] = x.toExponential(sig - 1).split('e')
  return `${mantissa} × 10${superscript(Number(exponent))}`
}

/**
 * A quantity to `sig` significant figures: plain digits for ordinary sizes
 * (2.000, 36.04) and scientific notation for very large or very small values.
 */
export function formatQuantity(x: number, sig = BRIDGE_SIG_FIGS): string {
  if (x === 0) return '0'
  const magnitude = Math.abs(x)
  if (magnitude >= 1e-3 && magnitude < 1e6) return roundToSigFigs(x, sig)
  return formatScientific(x, sig)
}

/** The Avogadro constant as the site writes it (6.022 × 10²³, the NCERT value). */
export const AVOGADRO_LABEL = formatScientific(AVOGADRO)

/** Mass, amount and particle count of one sample of a substance. */
export interface SampleValues {
  grams: number
  moles: number
  particles: number
}

/** Mass in grams from an amount in moles: m = n × M. */
export function gramsFromMoles(formula: string, moles: number): number {
  return moles * bridgeMolarMass(formula)
}

/** Amount in moles from a mass in grams: n = m ÷ M. */
export function molesFromGrams(formula: string, grams: number): number {
  return grams / bridgeMolarMass(formula)
}

/** Amount in moles from a number of particles: n = N ÷ N_A. */
export function molesFromParticles(particles: number): number {
  return particles / AVOGADRO
}

/**
 * Values for a sample given its amount in moles: m = n × M and N = n × N_A.
 * The amount is first rounded to BRIDGE_SIG_FIGS, so that every worked line can
 * be reproduced from the numbers printed in it.
 */
export function sampleFromMoles(formula: string, moles: number): SampleValues {
  const n = Number(moles.toPrecision(BRIDGE_SIG_FIGS))
  return {
    grams: gramsFromMoles(formula, n),
    moles: n,
    particles: n * AVOGADRO,
  }
}

/** The worked line for mass to amount, e.g. "36.04 g ÷ 18.02 g mol⁻¹ = 2.000 mol". */
export function massToMolesLine(grams: number, moles: number, formula: string): string {
  const m = bridgeMolarMass(formula)
  return `${formatQuantity(grams)} g ÷ ${formatQuantity(m)} g mol⁻¹ = ${formatQuantity(moles)} mol`
}

/** The worked line for amount to mass, e.g. "2.000 mol × 18.02 g mol⁻¹ = 36.04 g". */
export function molesToMassLine(moles: number, grams: number, formula: string): string {
  const m = bridgeMolarMass(formula)
  return `${formatQuantity(moles)} mol × ${formatQuantity(m)} g mol⁻¹ = ${formatQuantity(grams)} g`
}

/** The worked line for amount to particles, e.g. "2.000 mol × 6.022 × 10²³ mol⁻¹ = 1.204 × 10²⁴". */
export function molesToParticlesLine(moles: number, particles: number): string {
  return `${formatQuantity(moles)} mol × ${AVOGADRO_LABEL} mol⁻¹ = ${formatScientific(particles)}`
}

/** The worked line for particles to amount, e.g. "1.2044 × 10²⁴ ÷ 6.022 × 10²³ mol⁻¹ = 2.000 mol". */
export function particlesToMolesLine(particles: number, moles: number): string {
  return `${formatScientific(particles)} ÷ ${AVOGADRO_LABEL} mol⁻¹ = ${formatQuantity(moles)} mol`
}
