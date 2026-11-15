/**
 * Solubility product, molar solubility, the ionic product and the common-ion effect for NCERT
 * Class 11 Unit 6 (Equilibrium), Section 6.13 (Problems 6.26 to 6.28).
 *
 * Solubilities are in mol L⁻¹ and Ksp values are at 298 K (Table 6.9).
 */

/** Ionic composition of a salt MₓXᵧ with charges p and q (x·p = y·q). */
export interface SaltComposition {
  cation: string
  cationCharge: number
  /** Number of cations per formula unit. */
  x: number
  anion: string
  anionCharge: number
  /** Number of anions per formula unit. */
  y: number
}

/** The Ksp expression of a salt, as text, with its stoichiometric counts. */
export interface KspExpressionResult {
  expression: string
  x: number
  y: number
}

/** Outcome of comparing the ionic product Qsp with Ksp. */
export type PrecipitationVerdict = 'precipitates' | 'at saturation' | 'no precipitate'

function assertPositive(name: string, value: number): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${name} must be a positive number (received ${value})`)
  }
}

function assertNonNegative(name: string, value: number): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${name} must be zero or a positive number (received ${value})`)
  }
}

function assertPositiveInteger(name: string, value: number): void {
  if (!Number.isInteger(value) || value < 1) {
    throw new RangeError(`${name} must be a positive integer (received ${value})`)
  }
}

/**
 * The Ksp expression for a salt, for example [Ag⁺]² [CrO4²⁻] for Ag2CrO4 (equation 6.44). The
 * charges must balance: x · cationCharge = y · anionCharge.
 *
 * @throws {RangeError} If the counts are not positive integers or the salt is not charge-neutral
 */
export function kspExpression(salt: SaltComposition): KspExpressionResult {
  assertPositiveInteger('x', salt.x)
  assertPositiveInteger('y', salt.y)
  assertPositiveInteger('cation charge', salt.cationCharge)
  assertPositiveInteger('anion charge', salt.anionCharge)
  if (salt.x * salt.cationCharge !== salt.y * salt.anionCharge) {
    throw new RangeError('The salt is not charge-neutral: x × cation charge must equal y × anion charge')
  }
  const cationPart = salt.x === 1 ? '' : `^${salt.x}`
  const anionPart = salt.y === 1 ? '' : `^${salt.y}`
  const cationText = `[${salt.cation}${chargeText(salt.cationCharge)}]${cationPart}`
  const anionText = `[${salt.anion}${chargeText(-salt.anionCharge)}]${anionPart}`
  return { expression: `${cationText} ${anionText}`, x: salt.x, y: salt.y }
}

function chargeText(charge: number): string {
  const magnitude = Math.abs(charge)
  const sign = charge > 0 ? '+' : '-'
  return magnitude === 1 ? sign : `^${magnitude}${sign}`
}

/**
 * Molar solubility from Ksp for MₓXᵧ, S = (Ksp / (xˣ yʸ))^(1/(x+y)) (equation 6.45). For 6912 = 3³·4⁴
 * the equation becomes Ksp = 6912 S⁷ for a 3:4 salt.
 *
 * @throws {RangeError} If Ksp or a stoichiometric count is not positive
 */
export function molarSolubility(ksp: number, x: number, y: number): number {
  assertPositive('Ksp', ksp)
  assertPositiveInteger('x', x)
  assertPositiveInteger('y', y)
  return (ksp / (x ** x * y ** y)) ** (1 / (x + y))
}

/**
 * Ksp from molar solubility, Ksp = xˣ yʸ S^(x+y) (equation 6.44). The inverse of molarSolubility.
 *
 * @throws {RangeError} If S or a stoichiometric count is not positive
 */
export function kspFromSolubility(s: number, x: number, y: number): number {
  assertPositive('solubility', s)
  assertPositiveInteger('x', x)
  assertPositiveInteger('y', y)
  return x ** x * y ** y * s ** (x + y)
}

/**
 * Ionic product Qsp = [M]^x [X]^y for given ion concentrations, which need not be at equilibrium
 * (Section 6.13.1).
 *
 * @throws {RangeError} On a negative concentration or a non-positive count
 */
export function ionicProduct(cationConc: number, anionConc: number, x: number, y: number): number {
  assertNonNegative('cation concentration', cationConc)
  assertNonNegative('anion concentration', anionConc)
  assertPositiveInteger('x', x)
  assertPositiveInteger('y', y)
  return cationConc ** x * anionConc ** y
}

/**
 * Whether a salt precipitates, by comparing the ionic product with Ksp (Section 6.6.2 applied to
 * solubility). Qsp above Ksp precipitates; equal is at saturation; below does not precipitate.
 *
 * @throws {RangeError} If Qsp is negative or Ksp is not positive
 */
export function willPrecipitate(qsp: number, ksp: number): PrecipitationVerdict {
  assertNonNegative('Qsp', qsp)
  assertPositive('Ksp', ksp)
  if (Math.abs(qsp - ksp) <= 1e-12 * ksp) return 'at saturation'
  return qsp > ksp ? 'precipitates' : 'no precipitate'
}

const BISECTION_STEPS = 200

/**
 * Molar solubility of MₓXᵧ in a solution that already holds a common ion at concentration
 * commonConc, solved exactly (Section 6.13.2). With a common cation the total cation concentration is
 * commonConc + xS and the anion is yS; with a common anion, the cation is xS and the anion is
 * commonConc + yS. Ksp = [M]ˣ[X]ʸ is solved by bisection on log scale, since the right-hand side
 * increases monotonically with S. Reproduces Problem 6.28 (Ni(OH)2 in 0.10 M NaOH, 2.0 × 10⁻¹³ M).
 *
 * @param ksp Solubility product, positive
 * @param x Cations per formula unit
 * @param y Anions per formula unit
 * @param commonConc Concentration of the common ion from another source, zero or positive
 * @param which Which ion is common
 * @throws {RangeError} On a non-positive Ksp or count, or a negative common concentration
 */
export function solubilityWithCommonIon(
  ksp: number,
  x: number,
  y: number,
  commonConc: number,
  which: 'cation' | 'anion'
): number {
  assertPositive('Ksp', ksp)
  assertPositiveInteger('x', x)
  assertPositiveInteger('y', y)
  assertNonNegative('common-ion concentration', commonConc)

  const logRatio = (s: number): number => {
    const cation = which === 'cation' ? commonConc + x * s : x * s
    const anion = which === 'anion' ? commonConc + y * s : y * s
    return x * Math.log(cation) + y * Math.log(anion) - Math.log(ksp)
  }

  let low = 0
  let high = 1
  for (let i = 0; i < BISECTION_STEPS; i++) {
    const mid = (low + high) / 2
    if (logRatio(mid) > 0) high = mid
    else low = mid
  }
  return (low + high) / 2
}
