import { molality, molarity } from './mole'

/**
 * Density of liquid water in g mL⁻¹ at selected temperatures (standard tabulated
 * values). Between points the value is linearly interpolated.
 */
const WATER_DENSITY_G_PER_ML: readonly (readonly [number, number])[] = [
  [0, 0.99984],
  [4, 0.99997],
  [10, 0.9997],
  [20, 0.9982],
  [25, 0.99704],
  [30, 0.99565],
  [40, 0.99222],
  [50, 0.98804],
  [60, 0.9832],
  [70, 0.97781],
  [80, 0.97179],
  [90, 0.96535],
  [100, 0.95838],
]

export const WATER_TEMP_MIN_C = WATER_DENSITY_G_PER_ML[0][0]
export const WATER_TEMP_MAX_C = WATER_DENSITY_G_PER_ML[WATER_DENSITY_G_PER_ML.length - 1][0]

/**
 * Density of liquid water at a temperature, in g mL⁻¹.
 *
 * @param celsius Temperature in °C, between 0 and 100 (liquid water only)
 * @throws {RangeError} Outside 0 to 100 °C
 */
export function waterDensity(celsius: number): number {
  if (!Number.isFinite(celsius) || celsius < WATER_TEMP_MIN_C || celsius > WATER_TEMP_MAX_C) {
    throw new RangeError(
      `Temperature must be between ${WATER_TEMP_MIN_C} and ${WATER_TEMP_MAX_C} °C (received ${celsius})`
    )
  }
  for (let i = 0; i < WATER_DENSITY_G_PER_ML.length - 1; i++) {
    const [t0, d0] = WATER_DENSITY_G_PER_ML[i]
    const [t1, d1] = WATER_DENSITY_G_PER_ML[i + 1]
    if (celsius <= t1) {
      return d0 + ((celsius - t0) / (t1 - t0)) * (d1 - d0)
    }
  }
  return WATER_DENSITY_G_PER_ML[WATER_DENSITY_G_PER_ML.length - 1][1]
}

/**
 * Density of a solution at a temperature, in g mL⁻¹. The caller supplies the
 * density at 25 °C; the change with temperature is assumed to follow water's
 * (the ratio of water densities). That is a simplifying model, not a measured
 * law for any particular solution.
 *
 * @param densityAt25 Solution density at 25 °C, in g mL⁻¹
 * @param celsius Temperature in °C, between 0 and 100
 */
export function solutionDensity(densityAt25: number, celsius: number): number {
  return densityAt25 * (waterDensity(celsius) / waterDensity(25))
}

/**
 * Volume of a solution in litres: total mass divided by density at the given
 * temperature.
 *
 * @param soluteMoles Amount of solute in mol
 * @param soluteMolarMass Molar mass of the solute in g mol⁻¹
 * @param solventKg Mass of solvent in kg
 * @param densityAt25 Solution density at 25 °C, in g mL⁻¹
 * @param celsius Temperature in °C
 */
export function solutionVolumeLitres(
  soluteMoles: number,
  soluteMolarMass: number,
  solventKg: number,
  densityAt25: number,
  celsius: number
): number {
  const massGrams = solventKg * 1000 + soluteMoles * soluteMolarMass
  const volumeMl = massGrams / solutionDensity(densityAt25, celsius)
  return volumeMl / 1000
}

/**
 * Molarity of a solution at a temperature. The moles of solute stay fixed while
 * the volume changes with temperature, so the molarity changes too.
 */
export function molarityAtTemperature(
  soluteMoles: number,
  soluteMolarMass: number,
  solventKg: number,
  densityAt25: number,
  celsius: number
): number {
  return molarity(
    soluteMoles,
    solutionVolumeLitres(soluteMoles, soluteMolarMass, solventKg, densityAt25, celsius)
  )
}

/**
 * Molality of a solution: moles of solute per kg of solvent. It depends only on
 * masses, never on volume, so it is the same at every temperature.
 */
export function molalityOfSolution(soluteMoles: number, solventKg: number): number {
  return molality(soluteMoles, solventKg)
}
