/**
 * Helpers for the physical equilibria of NCERT Class 11 Unit 6, Section 6.1: the vapour pressure of
 * water against temperature, the boiling point against pressure, Henry's law for gases dissolving in
 * liquids, and the dynamic evaporation–condensation balance in a sealed container.
 */

/** Antoine constants for water, log₁₀(P / mmHg) = A − B / (C + T / °C), valid from 1 to 100 °C. */
const ANTOINE_A = 8.07131
const ANTOINE_B = 1730.63
const ANTOINE_C = 233.426
const ANTOINE_MIN_C = 1
const ANTOINE_MAX_C = 100

/** Millimetres of mercury in one bar (1 bar = 750.062 mmHg). */
const MMHG_PER_BAR = 750.062

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

/**
 * Saturated vapour pressure of water in mmHg at a temperature, from the Antoine equation with
 * constants for water (valid from 1 to 100 °C). About 760 mmHg at 100 °C and 23.8 mmHg at 25 °C.
 *
 * @param celsius Temperature, °C, between 1 and 100
 * @throws {RangeError} Outside the valid range
 */
export function waterVapourPressureMmHg(celsius: number): number {
  if (!Number.isFinite(celsius) || celsius < ANTOINE_MIN_C || celsius > ANTOINE_MAX_C) {
    throw new RangeError(`Temperature must be between ${ANTOINE_MIN_C} and ${ANTOINE_MAX_C} °C (received ${celsius})`)
  }
  return 10 ** (ANTOINE_A - ANTOINE_B / (ANTOINE_C + celsius))
}

/**
 * Saturated vapour pressure of water in bar, from waterVapourPressureMmHg.
 *
 * @throws {RangeError} Outside the valid temperature range
 */
export function waterVapourPressureBar(celsius: number): number {
  return waterVapourPressureMmHg(celsius) / MMHG_PER_BAR
}

/**
 * Boiling temperature of water in °C at a given external pressure, inverting the Antoine equation.
 * 1 bar gives the standard boiling point, about 99.6 °C; 1 atm (1.01325 bar) gives the normal boiling
 * point, about 100 °C.
 *
 * @param pressureBar External pressure, bar, positive
 * @throws {RangeError} If the pressure is not positive or the boiling point falls outside 1 to 100 °C
 */
export function boilingTemperatureC(pressureBar: number): number {
  assertPositive('pressure', pressureBar)
  const logP = Math.log10(pressureBar * MMHG_PER_BAR)
  const celsius = ANTOINE_B / (ANTOINE_A - logP) - ANTOINE_C
  if (celsius < ANTOINE_MIN_C || celsius > ANTOINE_MAX_C) {
    throw new RangeError(`Boiling point ${celsius.toFixed(1)} °C is outside the valid 1 to 100 °C range`)
  }
  return celsius
}

/**
 * Henry's law: the molar solubility of a gas is proportional to its partial pressure, c = kH × p
 * (Section 6.1). kH is in mol L⁻¹ bar⁻¹ and the pressure in bar.
 *
 * @throws {RangeError} If kH is not positive or the pressure is negative
 */
export function henryConcentration(kH: number, pressureBar: number): number {
  assertPositive('kH', kH)
  assertNonNegative('pressure', pressureBar)
  return kH * pressureBar
}

/** The two opposing rates in a sealed container with liquid and vapour present. */
export interface EvaporationBalance {
  evaporation: number
  condensation: number
  /** evaporation − condensation: positive means the liquid is gaining vapour. */
  net: number
}

/**
 * Rates of evaporation and condensation in a sealed container (Section 6.1.2). Evaporation depends
 * only on the liquid and the temperature, so it is a constant. Condensation is proportional to the
 * vapour pressure. The two are equal at the equilibrium vapour pressure p* = evaporation / condensation.
 *
 * @throws {RangeError} If a rate constant is not positive or the vapour pressure is negative
 */
export function dynamicEquilibrium(params: {
  evaporationRate: number
  condensationConstant: number
  vapourPressure: number
}): EvaporationBalance {
  assertPositive('evaporation rate', params.evaporationRate)
  assertPositive('condensation constant', params.condensationConstant)
  assertNonNegative('vapour pressure', params.vapourPressure)
  const condensation = params.condensationConstant * params.vapourPressure
  return {
    evaporation: params.evaporationRate,
    condensation,
    net: params.evaporationRate - condensation,
  }
}

/** One sample of the approach to the sealed-container equilibrium. */
export interface VapourSample {
  time: number
  vapourPressure: number
}

/**
 * Vapour pressure against time in a sealed container, from d p / dt = evaporation − condensation × p,
 * integrated with the forward Euler method. It settles at p* = evaporation / condensation whatever the
 * starting vapour pressure.
 *
 * @param params Rates, initial vapour pressure, time step dt and number of steps
 * @throws {RangeError} On invalid rates, step or count
 */
export function approachSealedEquilibrium(params: {
  evaporationRate: number
  condensationConstant: number
  initialVapour: number
  dt: number
  steps: number
}): VapourSample[] {
  assertPositive('evaporation rate', params.evaporationRate)
  assertPositive('condensation constant', params.condensationConstant)
  assertNonNegative('initial vapour pressure', params.initialVapour)
  assertPositive('time step', params.dt)
  if (!Number.isInteger(params.steps) || params.steps < 1) {
    throw new RangeError(`steps must be a positive integer (received ${params.steps})`)
  }
  const samples: VapourSample[] = [{ time: 0, vapourPressure: params.initialVapour }]
  let p = params.initialVapour
  for (let i = 1; i <= params.steps; i++) {
    p = Math.max(p + params.dt * (params.evaporationRate - params.condensationConstant * p), 0)
    samples.push({ time: i * params.dt, vapourPressure: p })
  }
  return samples
}
