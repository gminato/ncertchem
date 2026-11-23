import { describe, expect, it } from 'vitest'
import {
  ETHANOL_FACTS,
  ETHANOL_STEP_COUNT,
  ETHANOL_STEP_LABELS,
  ETHANOL_STEP_TITLES,
  validateEthanolStepMolecules,
} from './ethanol-steps'

describe('ethanol-fermentation-pathway step metadata', () => {
  it('defines 5 matching step labels and titles', () => {
    expect(ETHANOL_STEP_COUNT).toBe(5)
    expect(ETHANOL_STEP_LABELS).toHaveLength(ETHANOL_STEP_COUNT)
    expect(ETHANOL_STEP_TITLES).toHaveLength(ETHANOL_STEP_COUNT)
  })

  it('matches NCERT 14% threshold, 351 K boiling point, and denaturants', () => {
    expect(ETHANOL_FACTS.inhibitionPercent).toBe(14)
    expect(ETHANOL_FACTS.ethanolBpK).toBe(351)
    expect(ETHANOL_FACTS.denaturants).toHaveLength(2)
  })

  it('parses all Kekule SMILES cleanly', () => {
    const parsed = validateEthanolStepMolecules()
    expect(parsed).toHaveLength(4)
    for (const item of parsed) {
      expect(item.graph.atoms.length).toBeGreaterThan(0)
    }
  })
})
