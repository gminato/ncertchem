import { describe, expect, it } from 'vitest'
import {
  CONCENTRATION_STEP_COUNT,
  SOLUTE_MOLAR_MASS,
  VOLUME_CASES_L,
  concentrationSnapshotForStep,
  heatedMolarity,
  heatedVolume,
  molarityForVolume,
  solutionMolality,
} from './concentration-steps'

describe('concentrationSnapshotForStep', () => {
  it('has four Steps: volumes, solvent, heated at 25 °C, heated at 80 °C', () => {
    expect(CONCENTRATION_STEP_COUNT).toBe(4)
    expect(concentrationSnapshotForStep(0).volumes).toBe(1)
    expect(concentrationSnapshotForStep(1).solvent).toBe(1)
    expect(concentrationSnapshotForStep(2).celsius).toBe(25)
    expect(concentrationSnapshotForStep(3).celsius).toBe(80)
    expect(concentrationSnapshotForStep(3).heated).toBe(1)
  })
})

describe('molarity by volume', () => {
  it('gives 0.500, 1.00 and 2.00 mol L⁻¹ for the same 0.500 mol', () => {
    expect(VOLUME_CASES_L.map((v) => molarityForVolume(v))).toEqual([0.5, 1, 2])
  })
})

describe('temperature and concentration', () => {
  it('molar mass of NaCl is 58.5 g mol⁻¹ from the lib', () => {
    expect(SOLUTE_MOLAR_MASS).toBeCloseTo(58.5, 9)
  })

  it('molality is 0.500 mol kg⁻¹ at every temperature', () => {
    expect(solutionMolality()).toBe(0.5)
  })

  it('heating expands the solution and lowers its molarity', () => {
    expect(heatedVolume(80)).toBeGreaterThan(heatedVolume(25))
    expect(heatedMolarity(80)).toBeLessThan(heatedMolarity(25))
    expect(heatedMolarity(25)).toBeGreaterThan(0.48)
    expect(heatedMolarity(25)).toBeLessThan(0.5)
  })
})
