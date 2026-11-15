/**
 * Enthalpy, heat capacity and the extensive or intensive classification, for NCERT Class 11
 * Unit 5, Sections 5.2.2 (enthalpy), 5.2.2(b) (extensive and intensive properties) and 5.2.2(c–d)
 * (heat capacity, and C_p − C_v = R for an ideal gas).
 *
 * Units: enthalpies and internal energies in kJ mol⁻¹ where the function is about a reaction;
 * heat capacities in the units the caller uses (J K⁻¹ or kJ K⁻¹), returned unchanged in scale.
 */

import { R_J_PER_MOL_K } from './pv-work'

/** The gas constant NCERT uses for C_p − C_v = R per mole (equation 5.13). */
export const CP_MINUS_CV_J_PER_MOL_K = R_J_PER_MOL_K

/** One species in a balanced equation, with its stoichiometric coefficient and physical state. */
export interface ReactionSpecies {
  coefficient: number
  state: 'g' | 'l' | 's' | 'aq'
}

/**
 * Change in the number of moles of gas, Δn_g = (moles of gaseous products) − (moles of gaseous
 * reactants), for a balanced reaction (Section 5.2.2(a)).
 *
 * @throws {RangeError} If a coefficient is not a positive finite number
 */
export function deltaNg(reactants: readonly ReactionSpecies[], products: readonly ReactionSpecies[]): number {
  const gasMoles = (side: readonly ReactionSpecies[]): number =>
    side.reduce((sum, s) => {
      if (!Number.isFinite(s.coefficient) || s.coefficient <= 0) {
        throw new RangeError(`stoichiometric coefficient must be positive (received ${s.coefficient})`)
      }
      return s.state === 'g' ? sum + s.coefficient : sum
    }, 0)
  return gasMoles(products) - gasMoles(reactants)
}

function assertFinite(name: string, value: number): void {
  if (!Number.isFinite(value)) {
    throw new RangeError(`${name} must be a finite number (received ${value})`)
  }
}

/**
 * Enthalpy change from internal energy change, ΔH = ΔU + Δn_g RT (equation 5.10). The result is in
 * the same units as ΔU (kJ mol⁻¹ here), with R converted from J to kJ.
 *
 * @param deltaUKJ Internal energy change, kJ mol⁻¹.
 * @param deltaNgMoles Change in moles of gas, Δn_g.
 * @param temperatureK Temperature in kelvin.
 * @param gasConstantJ Gas constant in J mol⁻¹ K⁻¹. Defaults to 8.314.
 */
export function enthalpyFromInternalEnergy(
  deltaUKJ: number,
  deltaNgMoles: number,
  temperatureK: number,
  gasConstantJ: number = R_J_PER_MOL_K,
): number {
  assertFinite('ΔU', deltaUKJ)
  assertFinite('Δn_g', deltaNgMoles)
  if (!Number.isFinite(temperatureK) || temperatureK <= 0) {
    throw new RangeError(`temperature must be positive in kelvin (received ${temperatureK})`)
  }
  return deltaUKJ + (deltaNgMoles * gasConstantJ * temperatureK) / 1000
}

/**
 * Internal energy change from enthalpy change, ΔU = ΔH − Δn_g RT. The inverse of
 * enthalpyFromInternalEnergy, in kJ mol⁻¹.
 */
export function internalEnergyFromEnthalpy(
  deltaHKJ: number,
  deltaNgMoles: number,
  temperatureK: number,
  gasConstantJ: number = R_J_PER_MOL_K,
): number {
  assertFinite('ΔH', deltaHKJ)
  assertFinite('Δn_g', deltaNgMoles)
  if (!Number.isFinite(temperatureK) || temperatureK <= 0) {
    throw new RangeError(`temperature must be positive in kelvin (received ${temperatureK})`)
  }
  return deltaHKJ - (deltaNgMoles * gasConstantJ * temperatureK) / 1000
}

/**
 * Heat for a body with heat capacity C, q = C ΔT (equation 5.11). The output has the units of C
 * times kelvin, so J K⁻¹ gives J and kJ K⁻¹ gives kJ.
 *
 * @throws {RangeError} If C or ΔT is not finite
 */
export function heatFromHeatCapacity(heatCapacity: number, deltaTK: number): number {
  assertFinite('heat capacity', heatCapacity)
  assertFinite('ΔT', deltaTK)
  return heatCapacity * deltaTK
}

/**
 * Heat for a mass of substance with specific heat c, q = m c ΔT (equation 5.11, Section 5.2.2(c)).
 *
 * @param massG Mass in grams.
 * @param specificHeatJPerGK Specific heat in J g⁻¹ K⁻¹ (or J g⁻¹ °C⁻¹, since a degree is the same size).
 * @param deltaTK Temperature change in kelvin (or degrees Celsius).
 * @returns Heat in joules.
 */
export function heatFromSpecificHeat(massG: number, specificHeatJPerGK: number, deltaTK: number): number {
  assertFinite('mass', massG)
  assertFinite('specific heat', specificHeatJPerGK)
  assertFinite('ΔT', deltaTK)
  return massG * specificHeatJPerGK * deltaTK
}

/**
 * Molar heat capacity, C_m = C / n: the heat capacity of one mole of the substance.
 *
 * @throws {RangeError} If the amount is not positive
 */
export function molarHeatCapacity(heatCapacity: number, moles: number): number {
  assertFinite('heat capacity', heatCapacity)
  if (!Number.isFinite(moles) || moles <= 0) {
    throw new RangeError(`amount must be positive (received ${moles})`)
  }
  return heatCapacity / moles
}

/**
 * Molar heat capacity at constant pressure for an ideal gas, from the one at constant volume:
 * C_p = C_v + R per mole (equation 5.13). Units follow the input (J mol⁻¹ K⁻¹ in, J mol⁻¹ K⁻¹ out).
 */
export function cpFromCv(cvMolar: number): number {
  assertFinite('C_v', cvMolar)
  return cvMolar + CP_MINUS_CV_J_PER_MOL_K
}

/** Whether a property scales with the amount of matter, as NCERT Section 5.2.2(b) describes. */
export type PropertyKind = 'extensive' | 'intensive'

/**
 * Extensive and intensive properties as NCERT Section 5.2.2(b) classifies them. Molar properties
 * (molar volume, molar heat capacity) are intensive: NCERT defines them per mole, so they do not
 * change when the amount is halved. Specific heat is per unit mass and is intensive by the same
 * argument; it is listed here for convenience and is not printed in NCERT's list.
 */
export const NCERT_PROPERTY_KINDS: Readonly<Record<string, PropertyKind>> = {
  mass: 'extensive',
  volume: 'extensive',
  'internal energy': 'extensive',
  enthalpy: 'extensive',
  'heat capacity': 'extensive',
  'Gibbs energy': 'extensive',
  temperature: 'intensive',
  density: 'intensive',
  pressure: 'intensive',
  'molar volume': 'intensive',
  'molar heat capacity': 'intensive',
  'specific heat': 'intensive',
}

/**
 * Classifies a property named in NCERT Section 5.2.2(b) as extensive or intensive.
 *
 * @throws {RangeError} If the property is not in the list
 */
export function classifyProperty(name: string): PropertyKind {
  if (!Object.prototype.hasOwnProperty.call(NCERT_PROPERTY_KINDS, name)) {
    throw new RangeError(`property "${name}" is not classified in NCERT Unit 5`)
  }
  return NCERT_PROPERTY_KINDS[name]
}
