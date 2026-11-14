import { molarMass } from '@/lib/chem/formula'
import {
  molarityAtTemperature,
  molalityOfSolution,
  solutionVolumeLitres,
  waterDensity,
} from '@/lib/chem/solution'
import { molarity } from '@/lib/chem/mole'

/** Number of Steps in the ConcentrationVessels Animation. */
export const CONCENTRATION_STEP_COUNT = 4

/** The solute: 0.500 mol of sodium chloride. */
export const SOLUTE = { formula: 'NaCl', moles: 0.5 } as const
export const SOLUTE_MOLAR_MASS = molarMass(SOLUTE.formula)

/** The solvent for the molality and temperature examples: 1.000 kg of water. */
export const SOLVENT_KG = 1

/**
 * Density of the solution at 25 °C, in g mL⁻¹. This is an assumed, illustrative
 * value for a dilute salt solution of this strength; the temperature change
 * follows water's (see solutionDensity).
 */
export const SOLUTION_DENSITY_25 = 1.02

/** The vessel's full height stands for this volume, in litres. */
export const VESSEL_CAPACITY_L = 1.2

/** Volumes of the three molarity examples, in litres. Same solute, same amount. */
export const VOLUME_CASES_L = [1, 0.5, 0.25] as const

export interface ConcentrationSnapshot {
  /** Opacity of the three-vessel molarity group. */
  volumes: number
  /** Opacity of the one-vessel molality group (water and solute). */
  solvent: number
  /** Opacity of the heated solution group. */
  heated: number
  /** Temperature of the heated solution, in °C. Tweened between Steps. */
  celsius: number
}

const TARGETS: ConcentrationSnapshot[] = [
  { volumes: 1, solvent: 0, heated: 0, celsius: 25 },
  { volumes: 0, solvent: 1, heated: 0, celsius: 25 },
  { volumes: 0, solvent: 0, heated: 1, celsius: 25 },
  { volumes: 0, solvent: 0, heated: 1, celsius: 80 },
]

export function clampConcentrationStep(step: number): number {
  if (!Number.isFinite(step)) return 0
  return Math.min(CONCENTRATION_STEP_COUNT - 1, Math.max(0, Math.round(step)))
}

/** Target state for a Step. */
export function concentrationSnapshotForStep(step: number): ConcentrationSnapshot {
  return { ...TARGETS[clampConcentrationStep(step)] }
}

/** Molarity of the sodium chloride in one of the three volume examples, in mol L⁻¹. */
export function molarityForVolume(volumeL: number): number {
  return molarity(SOLUTE.moles, volumeL)
}

/** Molarity of the heated solution at a temperature, in mol L⁻¹. */
export function heatedMolarity(celsius: number): number {
  return molarityAtTemperature(SOLUTE.moles, SOLUTE_MOLAR_MASS, SOLVENT_KG, SOLUTION_DENSITY_25, celsius)
}

/** Volume of the pure solvent (1.000 kg of water) at 25 °C, in litres. */
export function solventVolume25(): number {
  return (SOLVENT_KG * 1000) / waterDensity(25) / 1000
}

/** Volume of the heated solution at a temperature, in litres. */
export function heatedVolume(celsius: number): number {
  return solutionVolumeLitres(SOLUTE.moles, SOLUTE_MOLAR_MASS, SOLVENT_KG, SOLUTION_DENSITY_25, celsius)
}

/** Molality of the solution, in mol kg⁻¹. It does not depend on temperature. */
export function solutionMolality(): number {
  return molalityOfSolution(SOLUTE.moles, SOLVENT_KG)
}

/** Visually hidden description of each Step, read by screen readers. */
export function stepDescription(step: number): string {
  const m = solutionMolality().toFixed(3)
  switch (clampConcentrationStep(step)) {
    case 0:
      return `Molarity uses volume. The same 0.500 mol of NaCl gives 0.50 M in 1.00 L, 1.00 M in 0.500 L and 2.00 M in 0.250 L.`
    case 1:
      return `Molality uses the mass of solvent. 0.500 mol of NaCl in 1.000 kg of water is ${m} mol kg⁻¹.`
    case 2:
      return `Heated to 25 °C, the solution has a volume of ${heatedVolume(25).toFixed(3)} L, so its molarity is ${heatedMolarity(25).toFixed(3)} M.`
    default:
      return `Heated to 80 °C, the liquid expands to ${heatedVolume(80).toFixed(3)} L. Molarity falls to ${heatedMolarity(80).toFixed(3)} M, while molality stays at ${m} mol kg⁻¹.`
  }
}
