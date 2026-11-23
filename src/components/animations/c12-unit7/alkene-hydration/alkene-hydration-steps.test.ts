import { describe, expect, it } from 'vitest'
import { parseSmiles } from '@/lib/chem/molecule-parse'
import {
  ALKENE_HYDRATION_STEPS,
  ALKENE_HYDRATION_STEP_COUNT,
  HYDRATION_SPECIES,
  hydrationSpeciesLabel,
} from './alkene-hydration-steps'

describe('alkene-hydration-mechanisms Scrolly metadata', () => {
  it('defines 5 ordered steps matching the MDX narrative', () => {
    expect(ALKENE_HYDRATION_STEP_COUNT).toBe(5)
    expect(ALKENE_HYDRATION_STEPS).toHaveLength(5)
    expect(ALKENE_HYDRATION_STEPS.slice(0, 3).every((s) => s.pathway === 'acid')).toBe(true)
    expect(ALKENE_HYDRATION_STEPS.slice(3).every((s) => s.pathway === 'hydroboration')).toBe(true)
  })

  it('derives accurate IUPAC names and formulas for Markovnikov and anti-Markovnikov products', () => {
    expect(hydrationSpeciesLabel(HYDRATION_SPECIES.propene)).toBe('Propene (C₃H₆)')
    expect(hydrationSpeciesLabel(HYDRATION_SPECIES.propan2ol)).toBe('Propan-2-ol (C₃H₈O)')
    expect(hydrationSpeciesLabel(HYDRATION_SPECIES.propan1ol)).toBe('Propan-1-ol (C₃H₈O)')
    const cation = parseSmiles(HYDRATION_SPECIES.isopropylCation)
    expect(cation.atoms[1].charge).toBe(1)
  })
})
