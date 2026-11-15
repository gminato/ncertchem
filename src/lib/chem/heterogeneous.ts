/**
 * A closed vessel holding a pure solid that decomposes to a gas, CaCO3(s) ⇌ CaO(s) + CO2(g)
 * (NCERT Class 11 Unit 6, Section 6.5). The solid's amount does not appear in K. What decides the
 * pressure is whether any solid is left at equilibrium.
 */

import { R_BAR_L_PER_MOL_K } from './equilibrium'

/**
 * Kp = p(CO2) at 1100 K for CaCO3(s) ⇌ CaO(s) + CO2(g), in bar. NCERT gives 2.0 × 10⁵ Pa at this
 * temperature, which is 2.00 bar (NCERT Class 11 Part I, Unit 6, Section 6.5, printed page 180: the
 * paragraph on the thermal dissociation of calcium carbonate).
 */
export const CACO3_KP_1100K = 2.0

/**
 * Moles of an ideal gas in a vessel of volume V (L) at pressure p (bar): n = pV/(RT).
 *
 * @throws {RangeError} If p, V or T is not positive
 */
export function gasMolesAtPressure(pressureBar: number, volumeL: number, temperatureK: number): number {
  assertPositive('pressure', pressureBar)
  return co2MolesAtKp(pressureBar, volumeL, temperatureK)
}

/**
 * Moles of CO2 that a vessel of volume V (L) holds at Kp, from pV = nRT: n = Kp·V/(RT). This is the
 * amount at equilibrium if enough solid is present to supply it.
 *
 * @throws {RangeError} If Kp, V or T is not positive
 */
export function co2MolesAtKp(kp: number, volumeL: number, temperatureK: number): number {
  assertPositive('Kp', kp)
  assertPositive('volume', volumeL)
  assertPositive('temperature', temperatureK)
  return (kp * volumeL) / (R_BAR_L_PER_MOL_K * temperatureK)
}

/** The state of a CaCO3 vessel at equilibrium, for a given amount of solid and volume. */
export interface CaCO3VesselState {
  /** Moles of CaCO3(s) put into the vessel. */
  solidMoles: number
  /** Moles of CO2(g) at equilibrium. */
  co2Moles: number
  /** Moles of CaCO3(s) left at equilibrium. Zero means the solid has run out. */
  solidRemaining: number
  /** CO2 pressure at equilibrium, bar. Equals Kp while any solid remains. */
  pressureBar: number
  /** Concentration of CO2 at equilibrium, mol L⁻¹. This is the modified Kc, [CO2]. */
  co2Concentration: number
  /** True when some solid is left, so the pressure is fixed by Kp alone. */
  solidPresent: boolean
}

/**
 * Equilibrium of CaCO3 in a sealed vessel. The CO2 formed is the smaller of the solid available and
 * the amount that gives Kp. Solid present: p(CO2) = Kp, whatever the amount of solid. Solid used up
 * first: all of it decomposes and p = n RT / V, below Kp.
 *
 * @throws {RangeError} If the solid amount is negative or Kp, V or T is not positive
 */
export function caco3VesselState(
  solidMoles: number,
  volumeL: number,
  temperatureK: number,
  kp: number = CACO3_KP_1100K
): CaCO3VesselState {
  if (!Number.isFinite(solidMoles) || solidMoles < 0) {
    throw new RangeError(`The amount of solid must be zero or positive (received ${solidMoles})`)
  }
  const capacity = co2MolesAtKp(kp, volumeL, temperatureK)
  const co2Moles = Math.min(solidMoles, capacity)
  const solidRemaining = solidMoles - co2Moles
  const pressureBar = (co2Moles * R_BAR_L_PER_MOL_K * temperatureK) / volumeL
  return {
    solidMoles,
    co2Moles,
    solidRemaining,
    pressureBar,
    co2Concentration: co2Moles / volumeL,
    solidPresent: solidRemaining > 1e-12,
  }
}

function assertPositive(name: string, value: number): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${name} must be a positive number (received ${value})`)
  }
}
