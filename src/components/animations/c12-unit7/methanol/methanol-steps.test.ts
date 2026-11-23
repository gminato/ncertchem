import { describe, expect, it } from 'vitest'
import {
  METHANOL_CONDITIONS,
  METHANOL_STEP_COUNT,
  METHANOL_STEP_LABELS,
  METHANOL_STEP_TITLES,
  validateMethanolStepMolecules,
} from './methanol-steps'

describe('methanol-syngas-route step metadata', () => {
  it('defines 4 matching step labels and titles', () => {
    expect(METHANOL_STEP_COUNT).toBe(4)
    expect(METHANOL_STEP_LABELS).toHaveLength(METHANOL_STEP_COUNT)
    expect(METHANOL_STEP_TITLES).toHaveLength(METHANOL_STEP_COUNT)
  })

  it('uses exact NCERT reactor conditions and boiling points', () => {
    expect(METHANOL_CONDITIONS.catalyst).toBe('ZnO-Cr₂O₃')
    expect(METHANOL_CONDITIONS.pressureLabel).toBe('200-300 atm')
    expect(METHANOL_CONDITIONS.temperatureLabel).toBe('573-673 K')
    expect(METHANOL_CONDITIONS.methanolBpK).toBe(337)
    expect(METHANOL_CONDITIONS.ethanolBpK).toBe(351)
    expect(METHANOL_CONDITIONS.deltaBpK).toBe(14)
  })

  it('parses all Kekule SMILES cleanly', () => {
    const parsed = validateMethanolStepMolecules()
    expect(parsed).toHaveLength(4)
    for (const item of parsed) {
      expect(item.graph.atoms.length).toBeGreaterThan(0)
    }
  })
})
