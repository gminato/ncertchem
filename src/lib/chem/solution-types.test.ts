import { describe, expect, it } from 'vitest'
import {
  EVERYDAY_ALLOYS,
  FLUORIDE_THRESHOLDS_PPM,
  INTRAVENOUS_FLUID_CONTEXT,
  NCERT_SOLUTION_TYPES,
  PHYSICAL_PHASES,
  SOLVENT_PHASE_TO_CATEGORY,
  classifyBinarySolution,
  classifyFluorideLevel,
  filterByCategory,
  filterBySolutePhase,
  filterBySolventPhase,
  getHomogeneityNote,
  getSolutionTypeById,
} from './solution-types'

describe('solution-types helpers', () => {
  it('covers all 9 binary solute × solvent combinations', () => {
    expect(NCERT_SOLUTION_TYPES).toHaveLength(9)
    const seen = new Set<string>()
    for (const solvent of PHYSICAL_PHASES) {
      for (const solute of PHYSICAL_PHASES) {
        const entry = classifyBinarySolution(solute, solvent)
        expect(entry.solutePhase).toBe(solute)
        expect(entry.solventPhase).toBe(solvent)
        expect(entry.category).toBe(SOLVENT_PHASE_TO_CATEGORY[solvent])
        seen.add(entry.id)
      }
    }
    expect(seen.size).toBe(9)
  })

  it('looks up entries by id and returns undefined for unknown ids', () => {
    const amalgam = getSolutionTypeById('liquid-solid')
    expect(amalgam).toBeDefined()
    expect(amalgam?.category).toBe('Solid')
    expect(amalgam?.soluteName).toBe('Hg')
    expect(amalgam?.solventName).toBe('Na')
    expect(getSolutionTypeById('plasma-gas')).toBeUndefined()
  })

  it('filters into groups of 3 by solvent phase, solute phase, and category', () => {
    for (const phase of PHYSICAL_PHASES) {
      expect(filterBySolventPhase(phase)).toHaveLength(3)
      expect(filterBySolutePhase(phase)).toHaveLength(3)
    }
    expect(filterByCategory('Gaseous')).toHaveLength(3)
    expect(filterByCategory('Liquid')).toHaveLength(3)
    expect(filterByCategory('Solid')).toHaveLength(3)
  })

  it('provides a non-empty homogeneity note for every phase pair', () => {
    for (const solvent of PHYSICAL_PHASES) {
      for (const solute of PHYSICAL_PHASES) {
        const note = getHomogeneityNote(solute, solvent)
        expect(note.length).toBeGreaterThan(30)
      }
    }
  })

  it('records brass, bronze, and German silver compositions accurately', () => {
    const byId = new Map(EVERYDAY_ALLOYS.map((a) => [a.id, a]))
    expect(byId.get('brass')?.symbols).toEqual(['Cu', 'Zn'])
    expect(byId.get('brass')?.isBinary).toBe(true)
    expect(byId.get('bronze')?.symbols).toEqual(['Cu', 'Sn'])
    expect(byId.get('bronze')?.isBinary).toBe(true)
    expect(byId.get('german-silver')?.symbols).toEqual(['Cu', 'Zn', 'Ni'])
    expect(byId.get('german-silver')?.isBinary).toBe(false)
  })

  it('classifies fluoride ppm bands around 1 ppm preventive and 1.5 ppm mottling thresholds', () => {
    expect(FLUORIDE_THRESHOLDS_PPM.preventiveTarget).toBe(1.0)
    expect(FLUORIDE_THRESHOLDS_PPM.mottlingOnset).toBe(1.5)
    expect(classifyFluorideLevel(0.2)).toBe('low')
    expect(classifyFluorideLevel(1.0)).toBe('preventive')
    expect(classifyFluorideLevel(1.5)).toBe('mottling')
    expect(classifyFluorideLevel(50)).toBe('toxic')
    expect(() => classifyFluorideLevel(-0.1)).toThrow(RangeError)
    expect(() => classifyFluorideLevel(Number.NaN)).toThrow(RangeError)
  })

  it('describes intravenous fluid plasma-matching requirement', () => {
    expect(INTRAVENOUS_FLUID_CONTEXT.solvent).toBe('Water')
    expect(INTRAVENOUS_FLUID_CONTEXT.requirement).toMatch(/plasma/i)
  })
})
