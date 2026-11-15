/**
 * Vapour pressures and gas solubility for the sealed-container Simulation and the Section 6.1
 * Scrolly: a liquid or solid in a closed box reaches a steady vapour pressure, and a gas in a
 * sealed bottle reaches a steady dissolved concentration set by Henry's law.
 *
 * Water uses the Antoine constants in physical-equilibrium.ts. Ethanol uses its own Antoine
 * constants. Iodine has no Antoine constants here, so it uses an approximate Clausius–Clapeyron
 * line anchored at one value; treat its numbers as approximate.
 */

import { waterVapourPressureMmHg } from './physical-equilibrium'

export type VapourSubstance = 'water' | 'ethanol' | 'iodine'

/** Antoine constants for ethanol, log₁₀(P / mmHg) = A − B / (C + T / °C), roughly 0 to 93 °C. */
const ETHANOL_ANTOINE = { A: 8.20417, B: 1642.89, C: 230.3 } as const

/** Solid iodine: vapour pressure 0.31 mmHg (about 41 Pa) at 25 °C. */
const IODINE_REFERENCE = { celsius: 25, mmHg: 0.31 } as const
/** Approximate molar enthalpy of sublimation of iodine, kJ mol⁻¹. */
const IODINE_SUBLIMATION_KJ = 62.4
const GAS_CONSTANT_J = 8.314

/** Valid temperature range for the functions here, °C (the lower end is set by the water Antoine fit). */
export const VAPOUR_MIN_C = 1
export const VAPOUR_MAX_C = 100

function assertTemperature(celsius: number): void {
  if (!Number.isFinite(celsius) || celsius < VAPOUR_MIN_C || celsius > VAPOUR_MAX_C) {
    throw new RangeError(`Temperature must be between ${VAPOUR_MIN_C} and ${VAPOUR_MAX_C} °C (received ${celsius})`)
  }
}

/**
 * Saturated vapour pressure of a substance in mmHg at a temperature in °C.
 *
 * Water: physical-equilibrium.ts (Antoine, 1 to 100 °C). Ethanol: Antoine (about 0 to 93 °C; used here from 1 °C).
 * Iodine: approximate Clausius–Clapeyron line from 0.31 mmHg at 25 °C.
 *
 * @throws {RangeError} Outside 0 to 100 °C
 */
export function vapourPressureMmHg(substance: VapourSubstance, celsius: number): number {
  assertTemperature(celsius)
  switch (substance) {
    case 'water':
      return waterVapourPressureMmHg(celsius)
    case 'ethanol': {
      const { A, B, C } = ETHANOL_ANTOINE
      return 10 ** (A - B / (C + celsius))
    }
    case 'iodine': {
      const T = celsius + 273.15
      const T0 = IODINE_REFERENCE.celsius + 273.15
      const exponent = -((IODINE_SUBLIMATION_KJ * 1000) / GAS_CONSTANT_J) * (1 / T - 1 / T0)
      return IODINE_REFERENCE.mmHg * Math.exp(exponent)
    }
  }
}

/**
 * Closed-form approach to the sealed-box equilibrium. With evaporation E = kc × p* and
 * condensation kc × p, the vapour pressure obeys dp/dt = E − kc × p, so p(t) = p*(1 − e^(−kc t)).
 * It starts from an empty box (p = 0) and settles at p* whatever kc is.
 *
 * @param pStar Equilibrium vapour pressure, any unit (mmHg or bar)
 * @param kc Condensation constant, per second, positive
 * @param t Time since sealing, seconds, zero or more
 */
export function sealedApproach(pStar: number, kc: number, t: number): number {
  if (!(kc > 0) || !Number.isFinite(kc)) throw new RangeError(`kc must be positive (received ${kc})`)
  if (!(t >= 0) || !Number.isFinite(t)) throw new RangeError(`t must be zero or more (received ${t})`)
  if (!(pStar >= 0) || !Number.isFinite(pStar)) throw new RangeError(`p* must be zero or more (received ${pStar})`)
  return pStar * (1 - Math.exp(-kc * t))
}

/** Share of the equilibrium vapour pressure reached at time t in a sealed box: 0 at t = 0, near 1 later. */
export function sealedFraction(kc: number, t: number): number {
  return sealedApproach(1, kc, t)
}

/** Henry's-law constant for CO₂ in water at 298 K, mol L⁻¹ bar⁻¹ (approximate textbook value). */
export const CO2_HENRY_298 = 0.034
/** Temperature term for CO₂ in Henry's law, K: kH rises as the solution cools (approximate). */
const CO2_HENRY_TEMPERATURE_K = 2400
/** Partial pressure of CO₂ in ordinary air, bar (about 415 ppm at 1 atm). */
export const AIR_CO2_BAR = 0.00042

/**
 * Henry's-law constant for CO₂ at a temperature in °C, mol L⁻¹ bar⁻¹, from the value at 298 K and
 * the van't Hoff form kH(T) = kH(298) exp[2400 K (1/T − 1/298 K)]. Approximate.
 */
export function co2HenryConstant(celsius: number): number {
  assertTemperature(celsius)
  const T = celsius + 273.15
  return CO2_HENRY_298 * Math.exp(CO2_HENRY_TEMPERATURE_K * (1 / T - 1 / 298.15))
}

/**
 * Dissolved CO₂ at equilibrium with a gas pressure above the liquid, mol L⁻¹: c = kH × p.
 *
 * @param celsius Temperature, °C
 * @param pressureBar CO₂ partial pressure, bar, zero or more
 */
export function dissolvedCO2(celsius: number, pressureBar: number): number {
  if (!(pressureBar >= 0) || !Number.isFinite(pressureBar)) {
    throw new RangeError(`pressure must be zero or more (received ${pressureBar})`)
  }
  return co2HenryConstant(celsius) * pressureBar
}

/**
 * Dissolved CO₂ after the cap is removed: it relaxes from the sealed value c₀ to the new equilibrium
 * with air, cEq, with time constant tau (seconds). tau is a display choice, not a measured value.
 */
export function relaxToEquilibrium(c0: number, cEq: number, t: number, tau: number): number {
  if (!(tau > 0)) throw new RangeError(`tau must be positive (received ${tau})`)
  if (!(t >= 0)) throw new RangeError(`t must be zero or more (received ${t})`)
  return cEq + (c0 - cEq) * Math.exp(-t / tau)
}
