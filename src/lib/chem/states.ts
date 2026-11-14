/**
 * The states of water at 1 atm, as a function of temperature. This is the
 * model behind the states-of-matter Simulation.
 *
 * Freezing and boiling happen at fixed temperatures (0 °C and 100 °C at
 * 1 atm). Drawn as a sharp switch, a change of state would look like a jump,
 * so the model adds a narrow band on each side of each change. Inside a band,
 * the two phases are drawn together and their shares change smoothly. The band
 * is wider here than in a real beaker, so the change is visible on screen.
 */

/** Offset between the Celsius and kelvin scales: T(K) = t(°C) + 273.15. */
export const KELVIN_OFFSET = 273.15

/** Melting (freezing) point of water at 1 atm, in °C. */
export const WATER_MELTING_POINT_C = 0

/** Boiling point of water at 1 atm, in °C. */
export const WATER_BOILING_POINT_C = 100

/** Half-width, in °C, of the band where two phases are drawn together. */
export const COEXISTENCE_HALF_WIDTH_C = 2

/** Reference temperature for particle speeds: 25 °C (298.15 K). Speed factor is 1 here. */
export const REFERENCE_TEMPERATURE_K = 25 + KELVIN_OFFSET

export interface PhaseFractions {
  /** Share of the particles in the solid phase, 0 to 1. */
  solid: number
  /** Share of the particles in the liquid phase, 0 to 1. */
  liquid: number
  /** Share of the particles in the gas phase, 0 to 1. */
  gas: number
}

/**
 * The state the readout names. `melting` and `boiling` are the bands where two
 * phases are present together.
 */
export type WaterState = 'solid' | 'melting' | 'liquid' | 'boiling' | 'gas'

function assertFiniteTemperature(tC: number): void {
  if (!Number.isFinite(tC)) {
    throw new RangeError(`Temperature must be a finite number (received ${tC})`)
  }
}

/** Converts a temperature in °C to kelvin. */
export function celsiusToKelvin(tC: number): number {
  assertFiniteTemperature(tC)
  return tC + KELVIN_OFFSET
}

/**
 * Shares of the solid, liquid and gas phases of water at 1 atm. The three always
 * sum to 1. Outside the two bands, one phase is present alone.
 *
 * @throws {RangeError} If the temperature is not a finite number
 */
export function waterPhaseFractions(tC: number): PhaseFractions {
  assertFiniteTemperature(tC)
  const d = COEXISTENCE_HALF_WIDTH_C
  const mp = WATER_MELTING_POINT_C
  const bp = WATER_BOILING_POINT_C

  if (tC <= mp - d) return { solid: 1, liquid: 0, gas: 0 }
  if (tC < mp + d) {
    const solid = (mp + d - tC) / (2 * d)
    return { solid, liquid: 1 - solid, gas: 0 }
  }
  if (tC <= bp - d) return { solid: 0, liquid: 1, gas: 0 }
  if (tC < bp + d) {
    const liquid = (bp + d - tC) / (2 * d)
    return { solid: 0, liquid, gas: 1 - liquid }
  }
  return { solid: 0, liquid: 0, gas: 1 }
}

/**
 * The state of water at a temperature, for the readout. Inside a band the answer
 * is `melting` or `boiling`, since both phases are present there.
 *
 * @throws {RangeError} If the temperature is not a finite number
 */
export function waterStateAt(tC: number): WaterState {
  assertFiniteTemperature(tC)
  const d = COEXISTENCE_HALF_WIDTH_C
  if (tC <= WATER_MELTING_POINT_C - d) return 'solid'
  if (tC < WATER_MELTING_POINT_C + d) return 'melting'
  if (tC <= WATER_BOILING_POINT_C - d) return 'liquid'
  if (tC < WATER_BOILING_POINT_C + d) return 'boiling'
  return 'gas'
}

/**
 * Factor by which particle speeds are scaled at a temperature. Kinetic energy
 * is proportional to the kelvin temperature, so the speed scales with its square
 * root: v ∝ √T(K). The factor is 1 at 25 °C.
 *
 * @throws {RangeError} If the temperature is not a finite number, or is at or below absolute zero
 */
export function speedScale(tC: number): number {
  const kelvin = celsiusToKelvin(tC)
  if (kelvin <= 0) {
    throw new RangeError(`Temperature must be above absolute zero (received ${tC} °C)`)
  }
  return Math.sqrt(kelvin / REFERENCE_TEMPERATURE_K)
}
