/**
 * Chemical kinetics maths for Class 12 Unit 3 (NCERT Part I, pp. 62-84).
 *
 * Conventions used throughout:
 * - Concentrations in mol L⁻¹ (or partial pressures in atm for gases), times in s.
 * - Activation energies in J mol⁻¹ unless a function name says kJ.
 * - Rates of reaction are returned as positive numbers (Rate = −Δ[R]/Δt = +Δ[P]/Δt).
 * - Invalid input throws RangeError. Results use exact logs and exponentials (Math.log, Math.exp),
 *   never NCERT's rounded 2.303 or 0.693, so the Sections quote the same numbers as the Simulations.
 *
 * Unit strings use Unicode: superscript digits and the superscript minus U+207B for negative
 * exponents (mol L⁻¹ s⁻¹), and U+2212 for a numeric minus sign. A fractional exponent is written
 * in brackets, e.g. mol^(1/2) L^(−1/2) s⁻¹.
 */

import { roundToSigFigs, toScientific } from './sigfigs'

export { mulberry32 } from './orbital-density'

/** Gas constant, J K⁻¹ mol⁻¹ (NCERT's value, 8.314). */
export const GAS_CONSTANT_J = 8.314

/** Whether a species is consumed (reactant) or formed (product) in the reaction. */
export type SpeciesRole = 'reactant' | 'product'

/** An exact rational number, used for fractional orders in unit exponents. */
export interface Rational {
  readonly numerator: number
  readonly denominator: number
}

/** One base unit in a rate-constant unit expression, e.g. mol with exponent 1. */
export interface UnitPart {
  readonly symbol: 'mol' | 'L' | 's'
  readonly exponent: Rational
}

export interface RateConstantUnits {
  readonly parts: readonly UnitPart[]
  /** Readable Unicode form, e.g. "mol L⁻¹ s⁻¹" for zero order. */
  readonly text: string
}

export interface DeducedOrder {
  /** Exact value from log(r2/r1)/log(c2/c1). */
  readonly raw: number
  /** Raw value rounded to the nearest 0.5. */
  readonly rounded: number
}

export interface InitialRateExperiment {
  /** Initial concentrations keyed by species name. */
  readonly concs: Readonly<Record<string, number>>
  /** Initial rate of the reaction, mol L⁻¹ s⁻¹. */
  readonly rate: number
}

export interface TwoStepAmounts {
  /** Reactant A remaining, same units as A0. */
  readonly A: number
  /** Intermediate I. */
  readonly I: number
  /** Product P. */
  readonly P: number
}

/* ------------------------------------------------------------------ validation */

function requireFinite(name: string, x: number): void {
  if (!Number.isFinite(x)) throw new RangeError(`${name} must be a finite number, got ${x}`)
}

function requirePositive(name: string, x: number): void {
  requireFinite(name, x)
  if (x <= 0) throw new RangeError(`${name} must be greater than zero, got ${x}`)
}

function requireNonNegative(name: string, x: number): void {
  requireFinite(name, x)
  if (x < 0) throw new RangeError(`${name} must not be negative, got ${x}`)
}

/* ------------------------------------------------------------------ rates */

/**
 * Average rate between two instants: the slope of the chord (secant) on a concentration–time
 * graph, returned as a positive number. A reactant must fall (role 'reactant') and a product
 * must rise (role 'product'), otherwise the sign would be wrong and a RangeError is thrown.
 *
 * @param c1 Concentration at t1
 * @param c2 Concentration at t2
 */
export function averageRate(
  c1: number,
  c2: number,
  t1: number,
  t2: number,
  role: SpeciesRole = 'reactant',
): number {
  requireNonNegative('c1', c1)
  requireNonNegative('c2', c2)
  requireFinite('t1', t1)
  requireFinite('t2', t2)
  if (t2 <= t1) throw new RangeError(`t2 (${t2}) must be later than t1 (${t1})`)
  const change = role === 'reactant' ? c1 - c2 : c2 - c1
  if (change < 0) {
    throw new RangeError(`concentration moves the wrong way for a ${role}; the rate would be negative`)
  }
  return change / (t2 - t1)
}

/**
 * Converts the time derivative of one species to the rate of reaction for a balanced equation.
 * For a reactant with coefficient a: Rate = −(1/a) d[A]/dt. For a product with coefficient c:
 * Rate = (1/c) d[C]/dt. The result is positive for a consuming reactant.
 *
 * @param dConcDt Time derivative of the species' concentration (signed, mol L⁻¹ s⁻¹)
 * @param coefficient Stoichiometric coefficient, a positive integer
 */
export function speciesRateToReactionRate(
  dConcDt: number,
  coefficient: number,
  role: SpeciesRole = 'reactant',
): number {
  requireFinite('dConcDt', dConcDt)
  requirePositive('coefficient', coefficient)
  return role === 'reactant' ? -dConcDt / coefficient : dConcDt / coefficient
}

/**
 * Inverse of speciesRateToReactionRate: d[A]/dt = −a × Rate for a reactant, d[C]/dt = c × Rate
 * for a product.
 */
export function reactionRateToSpeciesRate(
  rate: number,
  coefficient: number,
  role: SpeciesRole = 'reactant',
): number {
  requireNonNegative('rate', rate)
  requirePositive('coefficient', coefficient)
  return role === 'reactant' ? -coefficient * rate : coefficient * rate
}

/** Slope of the secant of f between t1 and t2 (signed). */
export function secantSlope(f: (t: number) => number, t1: number, t2: number): number {
  requireFinite('t1', t1)
  requireFinite('t2', t2)
  if (t2 === t1) throw new RangeError('t1 and t2 must differ')
  return (f(t2) - f(t1)) / (t2 - t1)
}

/**
 * Slope of the tangent of f at t, by a central difference with step h. Use firstOrderTangentSlope
 * or zeroOrderTangentSlope when the curve is known exactly.
 */
export function tangentSlope(f: (t: number) => number, t: number, h?: number): number {
  requireFinite('t', t)
  const step = h ?? 1e-6 * Math.max(1, Math.abs(t))
  requirePositive('h', step)
  return (f(t + step) - f(t - step)) / (2 * step)
}

/* ------------------------------------------------------------------ rate laws */

/**
 * Rate = k × Π[X]^order for the species named in `orders`. A concentration of zero gives a rate
 * of zero for a positive order, and 1 for an order of zero. A negative order with zero
 * concentration is undefined and throws.
 *
 * @param concs Concentrations keyed by species, mol L⁻¹
 * @param orders Exponents keyed by species (may be fractional, zero or negative)
 */
export function rateFromLaw(
  k: number,
  concs: Readonly<Record<string, number>>,
  orders: Readonly<Record<string, number>>,
): number {
  requireNonNegative('k', k)
  let rate = k
  for (const species of Object.keys(orders)) {
    const order = orders[species]
    const c = concs[species]
    if (c === undefined) throw new RangeError(`no concentration given for ${species}`)
    requireNonNegative(`[${species}]`, c)
    requireFinite(`order of ${species}`, order)
    if (c === 0) {
      if (order < 0) throw new RangeError(`[${species}] is zero but its order is negative`)
      rate *= order === 0 ? 1 : 0
    } else {
      rate *= Math.pow(c, order)
    }
  }
  return rate
}

/** Overall order: the sum of the exponents in the rate law (may be 0, fractional or negative). */
export function overallOrder(orders: Readonly<Record<string, number>>): number {
  let total = 0
  for (const order of Object.values(orders)) {
    requireFinite('order', order)
    total += order
  }
  return total
}

/**
 * Order with respect to one reactant from two runs in which only that reactant changes:
 * n = log(r2/r1) / log(c2/c1).
 *
 * @throws {RangeError} If any value is not positive, or the two concentrations are equal
 */
export function orderFromTwoRuns(c1: number, r1: number, c2: number, r2: number): number {
  requirePositive('c1', c1)
  requirePositive('r1', r1)
  requirePositive('c2', c2)
  requirePositive('r2', r2)
  if (c1 === c2) throw new RangeError('the two concentrations must differ')
  return Math.log(r2 / r1) / Math.log(c2 / c1)
}

/**
 * Deduces the order with respect to each species from initial-rate experiments (Table 3.2 style).
 * For each species, the first pair of experiments that differ only in that species gives the raw
 * order; the rounded order is the raw value to the nearest 0.5.
 *
 * @throws {RangeError} If no experiment pair isolates a species, or the species sets differ
 */
export function deduceOrders(
  experiments: readonly InitialRateExperiment[],
): Record<string, DeducedOrder> {
  if (experiments.length < 2) throw new RangeError('at least two experiments are needed')
  const species = Object.keys(experiments[0].concs)
  const result: Record<string, DeducedOrder> = {}
  for (const s of species) {
    const pair = findIsolatingPair(experiments, s)
    if (pair === undefined) throw new RangeError(`no pair of experiments isolates ${s}`)
    const [a, b] = pair
    const raw = orderFromTwoRuns(a.concs[s], a.rate, b.concs[s], b.rate)
    result[s] = { raw, rounded: Math.round(raw * 2) / 2 }
  }
  return result
}

function findIsolatingPair(
  experiments: readonly InitialRateExperiment[],
  species: string,
): [InitialRateExperiment, InitialRateExperiment] | undefined {
  for (let i = 0; i < experiments.length; i++) {
    for (let j = i + 1; j < experiments.length; j++) {
      const a = experiments[i]
      const b = experiments[j]
      if (a.concs[species] === b.concs[species]) continue
      const others = Object.keys(a.concs).filter((x) => x !== species)
      if (others.every((x) => a.concs[x] === b.concs[x])) return [a, b]
    }
  }
  return undefined
}

/** k = rate / Π[X]^order: the rate constant from one run with a known rate law. */
export function rateConstantFromRun(
  rate: number,
  concs: Readonly<Record<string, number>>,
  orders: Readonly<Record<string, number>>,
): number {
  requireNonNegative('rate', rate)
  const product = rateFromLaw(1, concs, orders)
  if (product === 0) throw new RangeError('the rate law gives zero, so k cannot be found')
  return rate / product
}

/* ------------------------------------------------------------------ units of k */

/** Turns a number into an exact rational with denominator up to maxDen (default 12). */
export function rationalFromNumber(x: number, maxDen = 12): Rational {
  requireFinite('x', x)
  for (let d = 1; d <= maxDen; d++) {
    const n = Math.round(x * d)
    if (Math.abs(x * d - n) < 1e-9) {
      const g = gcd(Math.abs(n), d)
      return { numerator: n / g || 0, denominator: d / g }
    }
  }
  throw new RangeError(`${x} is not a rational with denominator up to ${maxDen}`)
}

function gcd(a: number, b: number): number {
  return b === 0 ? a || 1 : gcd(b, a % b)
}

function rationalValue(r: Rational): number {
  return r.numerator / r.denominator
}

const SUPERSCRIPT_DIGITS: Record<string, string> = {
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

function superscript(n: number): string {
  return String(n)
    .split('')
    .map((ch) => SUPERSCRIPT_DIGITS[ch] ?? ch)
    .join('')
}

function exponentText(r: Rational): string {
  if (r.denominator === 1) return r.numerator === 1 ? '' : superscript(r.numerator)
  const sign = r.numerator < 0 ? '−' : ''
  return `^(${sign}${Math.abs(r.numerator)}/${r.denominator})`
}

/**
 * Units of the rate constant for an order n: (mol L⁻¹)^(1−n) s⁻¹. Returns the structured parts
 * (mol with exponent 1−n, L with exponent n−1, s with exponent −1) and a Unicode string.
 * Order 0 gives "mol L⁻¹ s⁻¹", order 1 gives "s⁻¹", order 2 gives "mol⁻¹ L s⁻¹", and order ½ gives
 * "mol^(1/2) L^(−1/2) s⁻¹".
 *
 * @throws {RangeError} If the order is not a finite number with a small denominator
 */
export function rateConstantUnits(order: number): RateConstantUnits {
  requireFinite('order', order)
  const molExp = rationalFromNumber(1 - order)
  const lExp = rationalFromNumber(order - 1)
  const sExp: Rational = { numerator: -1, denominator: 1 }
  const parts: UnitPart[] = [
    { symbol: 'mol', exponent: molExp },
    { symbol: 'L', exponent: lExp },
    { symbol: 's', exponent: sExp },
  ]
  return { parts, text: unitText(parts) }
}

function unitText(parts: readonly UnitPart[]): string {
  return parts
    .filter((p) => p.exponent.numerator !== 0)
    .map((p) => p.symbol + exponentText(p.exponent))
    .join(' ')
}

/**
 * Reads the order back from unit parts: order = 1 − (exponent of mol). The L exponent must equal
 * n − 1 and the s exponent must be −1, otherwise the parts are not the units of a rate constant.
 *
 * @throws {RangeError} If the parts are not consistent with (mol L⁻¹)^(1−n) s⁻¹
 */
export function orderFromUnits(parts: readonly UnitPart[]): number {
  let mol = 0
  let litre = 0
  let second = 0
  for (const p of parts) {
    const value = rationalValue(p.exponent)
    if (p.symbol === 'mol') mol += value
    else if (p.symbol === 'L') litre += value
    else second += value
  }
  const order = 1 - mol
  const consistent = Math.abs(litre - (order - 1)) < 1e-9 && Math.abs(second + 1) < 1e-9
  if (!consistent) throw new RangeError('these units are not those of a rate constant')
  return order
}

/* ------------------------------------------------------------------ zero order */

/** [R] = [R]₀ − kt for a zero order reaction, never below zero. */
export function zeroOrderConc(R0: number, k: number, t: number): number {
  requireNonNegative('R0', R0)
  requireNonNegative('k', k)
  requireNonNegative('t', t)
  return Math.max(0, R0 - k * t)
}

/** k = ([R]₀ − [R]) / t for a zero order reaction. */
export function zeroOrderK(R0: number, R: number, t: number): number {
  requireNonNegative('R0', R0)
  requireNonNegative('R', R)
  requirePositive('t', t)
  if (R > R0) throw new RangeError('[R] cannot be larger than [R]₀ for a reactant')
  return (R0 - R) / t
}

/** t½ = [R]₀ / 2k. Doubles when [R]₀ doubles. */
export function zeroOrderHalfLife(R0: number, k: number): number {
  requireNonNegative('R0', R0)
  requirePositive('k', k)
  return R0 / (2 * k)
}

/** Time at which [R] reaches zero: [R]₀ / k. */
export function zeroOrderTimeToZero(R0: number, k: number): number {
  requireNonNegative('R0', R0)
  requirePositive('k', k)
  return R0 / k
}

/** Slope of the [R]–t line for zero order: −k at every time. */
export function zeroOrderTangentSlope(k: number): number {
  requireNonNegative('k', k)
  return -k
}

/* ------------------------------------------------------------------ first order */

/** [R] = [R]₀ e^(−kt). */
export function firstOrderConc(R0: number, k: number, t: number): number {
  requireNonNegative('R0', R0)
  requireNonNegative('k', k)
  requireNonNegative('t', t)
  return R0 * Math.exp(-k * t)
}

/** Exact instantaneous slope d[R]/dt = −k[R] for first order. */
export function firstOrderTangentSlope(R0: number, k: number, t: number): number {
  return -k * firstOrderConc(R0, k, t)
}

/** Instantaneous rate of a first order reaction, k[R] (positive). */
export function firstOrderRate(R0: number, k: number, t: number): number {
  return -firstOrderTangentSlope(R0, k, t)
}

/** k = ln([R]₀/[R]) / t. */
export function firstOrderK(R0: number, R: number, t: number): number {
  requirePositive('R0', R0)
  requirePositive('R', R)
  requirePositive('t', t)
  if (R > R0) throw new RangeError('[R] cannot be larger than [R]₀ for a reactant')
  return Math.log(R0 / R) / t
}

/** Natural log of a concentration (the ln[R]–t line has slope −k). */
export function lnConc(R: number): number {
  requirePositive('R', R)
  return Math.log(R)
}

/** log₁₀([R]₀/[R]) (the plot against t has slope k/ln 10). */
export function log10Ratio(R0: number, R: number): number {
  requirePositive('R0', R0)
  requirePositive('R', R)
  return Math.log10(R0 / R)
}

/** t½ = ln 2 / k, independent of [R]₀. */
export function firstOrderHalfLife(k: number): number {
  requirePositive('k', k)
  return Math.LN2 / k
}

/** Time for a first order reaction to leave the given fraction remaining: t = −ln(f)/k, 0 < f ≤ 1. */
export function timeToFraction(k: number, fractionRemaining: number): number {
  requirePositive('k', k)
  requirePositive('fractionRemaining', fractionRemaining)
  if (fractionRemaining > 1) throw new RangeError('fractionRemaining must be at most 1')
  return Math.log(1 / fractionRemaining) / k
}

/** Fraction left after n half-lives: 2^(−n). */
export function fractionRemainingAfterHalfLives(n: number): number {
  requireNonNegative('n', n)
  return Math.pow(2, -n)
}

/**
 * Gas phase A(g) → B(g) + C(g) at constant volume: partial pressure of A at time t,
 * p_A = 2pᵢ − pₜ, where pᵢ is the starting pressure and pₜ the total pressure at time t.
 *
 * @throws {RangeError} If pₜ is outside [pᵢ, 2pᵢ], the range that keeps p_A between pᵢ and zero
 */
export function partialPressureA(pi: number, pt: number): number {
  requirePositive('pi', pi)
  requireFinite('pt', pt)
  if (pt < pi || pt > 2 * pi) throw new RangeError('pt must lie between pi and 2pi')
  return 2 * pi - pt
}

/** k = (1/t) ln(pᵢ / p_A), with p_A = 2pᵢ − pₜ (same as (2.303/t) log(pᵢ/(2pᵢ − pₜ))). */
export function firstOrderKFromPressure(pi: number, pt: number, t: number): number {
  requirePositive('t', t)
  const pA = partialPressureA(pi, pt)
  return Math.log(pi / pA) / t
}

/* ------------------------------------------------------------------ Arrhenius */

/** Converts kJ mol⁻¹ to J mol⁻¹. */
export function kJPerMolToJPerMol(kJ: number): number {
  requireFinite('kJ', kJ)
  return kJ * 1000
}

/** Converts J mol⁻¹ to kJ mol⁻¹. */
export function jPerMolToKJPerMol(J: number): number {
  requireFinite('J', J)
  return J / 1000
}

/** k = A e^(−Eₐ/RT). Ea in J mol⁻¹. */
export function arrheniusK(A: number, Ea: number, T: number): number {
  requirePositive('A', A)
  requireNonNegative('Ea', Ea)
  requirePositive('T', T)
  return A * Math.exp(-Ea / (GAS_CONSTANT_J * T))
}

/**
 * The Arrhenius line ln k = −(Eₐ/R)(1/T) + ln A, for a plot of ln k against 1/T.
 */
export function lnKLine(A: number, Ea: number): { slope: number; intercept: number } {
  requirePositive('A', A)
  requireNonNegative('Ea', Ea)
  return { slope: -Ea / GAS_CONSTANT_J, intercept: Math.log(A) }
}

/**
 * Activation energy (J mol⁻¹) from two rate constants:
 * Eₐ = R ln(k₂/k₁) / (1/T₁ − 1/T₂). This is the same as log(k₂/k₁) = (Eₐ/2.303R)(T₂ − T₁)/(T₁T₂).
 *
 * @throws {RangeError} If the result is negative (the rate constant falls with temperature)
 */
export function activationEnergyFromTwo(k1: number, T1: number, k2: number, T2: number): number {
  requirePositive('k1', k1)
  requirePositive('k2', k2)
  requirePositive('T1', T1)
  requirePositive('T2', T2)
  if (T1 === T2) throw new RangeError('T1 and T2 must differ')
  const Ea = (GAS_CONSTANT_J * Math.log(k2 / k1)) / (1 / T1 - 1 / T2)
  if (Ea < 0) throw new RangeError('k falls with temperature here, so Ea would be negative')
  return Ea
}

/** Pre-exponential factor A = k e^(Eₐ/RT), from one rate constant. */
export function preExponentialFrom(k: number, Ea: number, T: number): number {
  requirePositive('k', k)
  requireNonNegative('Ea', Ea)
  requirePositive('T', T)
  return k * Math.exp(Ea / (GAS_CONSTANT_J * T))
}

/** Rate constant at T₂ from k₁ at T₁ and Eₐ: k₂ = k₁ exp(−(Eₐ/R)(1/T₂ − 1/T₁)). */
export function kAtT2(k1: number, T1: number, T2: number, Ea: number): number {
  requirePositive('k1', k1)
  requirePositive('T1', T1)
  requirePositive('T2', T2)
  requireNonNegative('Ea', Ea)
  return k1 * Math.exp((-Ea / GAS_CONSTANT_J) * (1 / T2 - 1 / T1))
}

/** Fraction of molecules with kinetic energy at least Eₐ: e^(−Eₐ/RT). */
export function fractionAboveEa(Ea: number, T: number): number {
  requireNonNegative('Ea', Ea)
  requirePositive('T', T)
  return Math.exp(-Ea / (GAS_CONSTANT_J * T))
}

/** k(T + dT) / k(T) from the Arrhenius equation (dT defaults to 10 K). */
export function rateRatioForRise(Ea: number, T: number, dT = 10): number {
  requireNonNegative('Ea', Ea)
  requirePositive('T', T)
  requirePositive('T + dT', T + dT)
  return Math.exp((-Ea / GAS_CONSTANT_J) * (1 / (T + dT) - 1 / T))
}

/* ------------------------------------------------------------------ Maxwell–Boltzmann */

/**
 * Maxwell–Boltzmann density of molar kinetic energy, per J mol⁻¹:
 * f(E) = 2√(E/π) (RT)^(−3/2) e^(−E/RT). It integrates to 1 over E from 0 to infinity.
 * NCERT's Arrhenius factor e^(−Eₐ/RT) is the tail of this curve (see mbFractionAbove).
 */
export function mbEnergyDensity(E: number, T: number): number {
  requireNonNegative('E', E)
  requirePositive('T', T)
  const RT = GAS_CONSTANT_J * T
  return (2 * Math.sqrt(E / Math.PI) * Math.pow(RT, -1.5)) * Math.exp(-E / RT)
}

/** Points (E, f(E)) of the energy density from 0 to Emax, evenly spaced (samples ≥ 2). */
export function mbCurve(
  T: number,
  Emax: number,
  samples: number,
): Array<{ E: number; f: number }> {
  requirePositive('T', T)
  requirePositive('Emax', Emax)
  if (!Number.isInteger(samples) || samples < 2) throw new RangeError('samples must be an integer ≥ 2')
  const points: Array<{ E: number; f: number }> = []
  for (let i = 0; i < samples; i++) {
    const E = (Emax * i) / (samples - 1)
    points.push({ E, f: mbEnergyDensity(E, T) })
  }
  return points
}

/** Most probable molar kinetic energy, RT/2 (the peak of the curve), J mol⁻¹. */
export function mbMostProbableEnergy(T: number): number {
  requirePositive('T', T)
  return (GAS_CONSTANT_J * T) / 2
}

/**
 * Fraction of molecules with molar kinetic energy above E, exact for three dimensions:
 * with x = E/RT, P = erfc(√x) + (2/√π)√x e^(−x). It is 1 at E = 0 and rises with T at fixed E.
 */
export function mbFractionAbove(E: number, T: number): number {
  requireNonNegative('E', E)
  requirePositive('T', T)
  const x = E / (GAS_CONSTANT_J * T)
  return erfc(Math.sqrt(x)) + ((2 / Math.sqrt(Math.PI)) * Math.sqrt(x) * Math.exp(-x))
}

/**
 * Complementary error function, Numerical Recipes Chebyshev fit (fractional error below 1.2e-7).
 */
export function erfc(x: number): number {
  requireFinite('x', x)
  if (x < 0) return 2 - erfc(-x)
  const t = 1 / (1 + 0.5 * x)
  const poly =
    -x * x - 1.26551223 +
    t *
      (1.00002368 +
        t *
          (0.37409196 +
            t *
              (0.09678418 +
                t *
                  (-0.18628806 +
                    t *
                      (0.27886807 +
                        t *
                          (-1.13520398 +
                            t * (1.48851587 + t * (-0.82215223 + t * 0.17087277))))))))
  return t * Math.exp(poly)
}

/* ------------------------------------------------------------------ catalysts */

/** Rate enhancement from a catalyst: e^((Eₐ,uncat − Eₐ,cat)/RT). The same for forward and backward. */
export function catalystRateEnhancement(EaUncat: number, EaCat: number, T: number): number {
  requireNonNegative('EaUncat', EaUncat)
  requireNonNegative('EaCat', EaCat)
  requirePositive('T', T)
  return Math.exp((EaUncat - EaCat) / (GAS_CONSTANT_J * T))
}

/**
 * Activation energy of the backward reaction: Eₐ,backward = Eₐ,forward − ΔrH (J mol⁻¹).
 * A catalyst changes both barriers equally, so the difference ΔrH is unchanged.
 *
 * @throws {RangeError} If the backward barrier would be negative
 */
export function backwardBarrier(EaForward: number, dH: number): number {
  requireNonNegative('EaForward', EaForward)
  requireFinite('dH', dH)
  const Ea = EaForward - dH
  if (Ea < 0) throw new RangeError('the backward activation energy would be negative')
  return Ea
}

/* ------------------------------------------------------------------ collision theory */

/** Rate = P Z e^(−Eₐ/RT): steric factor P, collision frequency Z, Eₐ in J mol⁻¹. */
export function collisionRate(P: number, Z: number, Ea: number, T: number): number {
  requireNonNegative('P', P)
  requireNonNegative('Z', Z)
  requireNonNegative('Ea', Ea)
  requirePositive('T', T)
  return P * Z * Math.exp(-Ea / (GAS_CONSTANT_J * T))
}

/* ------------------------------------------------------------------ mechanism model */

/**
 * Exact amounts for the consecutive mechanism A →(k₁) I →(k₂) P, from A₀ at t = 0.
 * A = A₀ e^(−k₁t); I = A₀ k₁ (e^(−k₁t) − e^(−k₂t)) / (k₂ − k₁); P = A₀ − A − I, written in closed
 * form so that A + I + P = A₀. When k₁ and k₂ are equal (within 1e-9 relative), the limiting
 * forms I = A₀ k t e^(−kt) and P = A₀[1 − (1 + kt)e^(−kt)] are used.
 */
export function twoStepSeries(A0: number, k1: number, k2: number, t: number): TwoStepAmounts {
  requireNonNegative('A0', A0)
  requirePositive('k1', k1)
  requirePositive('k2', k2)
  requireNonNegative('t', t)
  const scale = Math.max(k1, k2)
  if (Math.abs(k1 - k2) <= 1e-9 * scale) {
    const k = (k1 + k2) / 2
    const decay = Math.exp(-k * t)
    return {
      A: A0 * decay,
      I: A0 * k * t * decay,
      P: A0 * (1 - (1 + k * t) * decay),
    }
  }
  const e1 = Math.exp(-k1 * t)
  const e2 = Math.exp(-k2 * t)
  const diff = k2 - k1
  return {
    A: A0 * e1,
    I: (A0 * k1 * (e1 - e2)) / diff,
    P: A0 * (1 - (k2 * e1 - k1 * e2) / diff),
  }
}

/* ------------------------------------------------------------------ formatting */

/**
 * Significant figures with half-up rounding (roundToSigFigs from sigfigs.ts), written with a
 * Unicode minus sign: formatSig(31.775, 4) is "31.78".
 */
export function formatSig(x: number, sig: number): string {
  return roundToSigFigs(x, sig).replace('-', '−')
}

/**
 * Scientific notation with Unicode superscripts and a U+2212 minus sign:
 * formatSci(0.000123, 3) is "1.23 × 10⁻⁴" (the exponent minus is the superscript U+207B).
 */
export function formatSci(x: number, sig: number): string {
  const match = /^(-?)([\d.]+)×10\^(-?\d+)$/.exec(toScientific(x, sig))
  if (match === null) throw new RangeError(`cannot format ${x}`)
  const [, sign, mantissa, exponent] = match
  return `${sign ? '−' : ''}${mantissa} × 10${superscript(Number(exponent))}`
}
