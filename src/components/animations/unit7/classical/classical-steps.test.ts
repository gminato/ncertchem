import { describe, expect, it } from 'vitest'
import {
  CLASSICAL_STEPS,
  CLASSICAL_STEP_COUNT,
  classicalStep,
} from './classical-steps'

describe('classical-steps', () => {
  it('contains exactly 5 steps covering all four classical broadenings and the summary', () => {
    expect(CLASSICAL_STEP_COUNT).toBe(5)
    expect(CLASSICAL_STEPS).toHaveLength(5)
  })

  it('bounds steps within [0, 4] for negative or out-of-range inputs', () => {
    expect(classicalStep(-1).index).toBe(0)
    expect(classicalStep(10).index).toBe(4)
    expect(classicalStep(2.4).index).toBe(2)
  })

  it('provides complete chemistry metadata for every step', () => {
    for (const step of CLASSICAL_STEPS) {
      expect(step.title).toBeTruthy()
      expect(step.stageNumber).toBeTruthy()
      expect(step.oxRule).toBeTruthy()
      expect(step.redRule).toBeTruthy()
      expect(step.reactionMhchem).toContain('\\ce{')
      expect(step.equationDisplay).toBeTruthy()
      expect(step.oxReason).toBeTruthy()
      expect(step.redReason).toBeTruthy()
    }
  })

  it('contains a 4-row matrix in the final summary step', () => {
    const summary = classicalStep(4)
    expect(summary.matrixRows).toBeDefined()
    expect(summary.matrixRows).toHaveLength(4)
    expect(summary.matrixRows?.[0].criterion).toContain('Oxygen')
    expect(summary.matrixRows?.[1].criterion).toContain('Hydrogen')
  })
})
