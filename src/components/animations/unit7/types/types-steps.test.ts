import { describe, expect, it } from 'vitest'
import { buildLadderModel } from './ladder-model'
import { REDOX_TYPE_STEPS, getRedoxTypeStep } from './types-steps'

describe('REDOX_TYPE_STEPS', () => {
  it('has six steps; five ladders and one structure', () => {
    expect(REDOX_TYPE_STEPS).toHaveLength(6)
    expect(REDOX_TYPE_STEPS.map((s) => s.stepIndex)).toEqual([0, 1, 2, 3, 4, 5])
    expect(REDOX_TYPE_STEPS.slice(0, 5).every((s) => s.kind === 'ladder')).toBe(true)
    expect(REDOX_TYPE_STEPS[5].kind).toBe('structure')
  })

  it('every ladder step builds a model with at least one arrow', () => {
    for (const step of REDOX_TYPE_STEPS.slice(0, 5)) {
      const model = buildLadderModel(step.equation)
      expect(model, step.title).not.toBeNull()
      expect(model!.arrows.length, step.title).toBeGreaterThan(0)
    }
  })

  it('states the CaCO3 contrast from the library values', () => {
    expect(REDOX_TYPE_STEPS[1].footnote).toContain('Ca +2, C +4, O −2')
  })

  it('clamps step index safely in getRedoxTypeStep', () => {
    expect(getRedoxTypeStep(-1).stepIndex).toBe(0)
    expect(getRedoxTypeStep(2.4).stepIndex).toBe(2)
    expect(getRedoxTypeStep(99).stepIndex).toBe(5)
  })
})
