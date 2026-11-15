/**
 * Calorimetry for NCERT Class 11 Unit 5, Section 5.3 (measurement of ΔU and ΔH). A bomb
 * calorimeter runs at constant volume and gives ΔU. A coffee-cup (or atmospheric) calorimeter runs
 * at constant pressure and gives ΔH. Both are read from the temperature rise and the heat capacity
 * of the apparatus (Problem 5.6).
 *
 * Sign convention: the heat evolved by the reaction is the negative of the heat absorbed by the
 * calorimeter. An exothermic reaction gives a negative ΔU or ΔH.
 */

function assertFinite(name: string, value: number): void {
  if (!Number.isFinite(value)) {
    throw new RangeError(`${name} must be a finite number (received ${value})`)
  }
}

function assertPositive(name: string, value: number): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${name} must be positive (received ${value})`)
  }
}

/**
 * Heat change of the reaction from the calorimeter's temperature rise, q_reaction = −C_cal ΔT.
 * The heat capacity C_cal is for the whole apparatus (the bomb or cup and the water around it).
 *
 * @param heatCapacity Calorimeter heat capacity, in the energy unit per kelvin used by the caller (kJ K⁻¹ in Problem 5.6).
 * @param deltaTK Temperature rise of the calorimeter, kelvin (positive for a rise).
 * @returns Heat released by the reaction, in the energy unit of heatCapacity. Negative for an exothermic reaction.
 * @throws {RangeError} If the heat capacity is not positive or ΔT is not finite
 */
export function reactionHeatFromTemperatureRise(heatCapacity: number, deltaTK: number): number {
  assertPositive('heat capacity', heatCapacity)
  assertFinite('ΔT', deltaTK)
  return -heatCapacity * deltaTK
}

/**
 * Molar energy change of a reaction from a calorimetric run, scaling the reaction heat to one mole
 * of the substance that reacted (per-mole scaling in Problem 5.6).
 *
 * @param heatCapacity Calorimeter heat capacity, kJ K⁻¹.
 * @param deltaTK Temperature rise, K.
 * @param molesReacted Amount of the substance that reacted, mol.
 * @returns Molar change in kJ mol⁻¹.
 */
export function molarReactionEnergy(heatCapacity: number, deltaTK: number, molesReacted: number): number {
  assertPositive('amount reacted', molesReacted)
  return reactionHeatFromTemperatureRise(heatCapacity, deltaTK) / molesReacted
}

/**
 * Molar internal energy change ΔU of a reaction run in a bomb calorimeter (constant volume, no
 * work, so q_V = ΔU; Section 5.3(a)).
 *
 * @param heatCapacity Bomb calorimeter heat capacity, kJ K⁻¹.
 * @param deltaTK Temperature rise, K.
 * @param molesReacted Amount reacted, mol.
 * @returns ΔU per mole in kJ mol⁻¹.
 */
export function bombCalorimeterMolarDeltaU(heatCapacity: number, deltaTK: number, molesReacted: number): number {
  return molarReactionEnergy(heatCapacity, deltaTK, molesReacted)
}

/**
 * Molar enthalpy change ΔH of a reaction run at constant atmospheric pressure, in a coffee-cup or
 * similar calorimeter (q_p = ΔH; Section 5.3(b)).
 *
 * @param heatCapacity Calorimeter heat capacity, kJ K⁻¹.
 * @param deltaTK Temperature rise, K.
 * @param molesReacted Amount reacted, mol.
 * @returns ΔH per mole in kJ mol⁻¹.
 */
export function coffeeCupMolarDeltaH(heatCapacity: number, deltaTK: number, molesReacted: number): number {
  return molarReactionEnergy(heatCapacity, deltaTK, molesReacted)
}

/**
 * Heat capacity of a calorimeter made of its own apparatus plus a mass of water in it, from the
 * specific heat of water. Useful for a coffee-cup run where the water is the main heat sink.
 *
 * @param apparatusHeatCapacityKJPerK Heat capacity of the apparatus alone, kJ K⁻¹ (0 if negligible).
 * @param waterMassG Mass of water, g.
 * @param waterSpecificHeatJPerGK Specific heat of water, J g⁻¹ K⁻¹ (4.184 is the usual value).
 * @returns Total heat capacity in kJ K⁻¹.
 */
export function totalHeatCapacityKJPerK(
  apparatusHeatCapacityKJPerK: number,
  waterMassG: number,
  waterSpecificHeatJPerGK: number,
): number {
  assertFinite('apparatus heat capacity', apparatusHeatCapacityKJPerK)
  assertPositive('water mass', waterMassG)
  assertPositive('water specific heat', waterSpecificHeatJPerGK)
  return apparatusHeatCapacityKJPerK + (waterMassG * waterSpecificHeatJPerGK) / 1000
}
