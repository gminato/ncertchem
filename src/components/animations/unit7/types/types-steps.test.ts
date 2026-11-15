import { describe, expect, it } from 'vitest'
import { REDOX_TYPE_STEPS, getRedoxTypeStep } from './types-steps'

describe('types-steps.ts', () => {
  it('defines exactly 6 deterministic steps (steps 0 to 5)', () => {
    expect(REDOX_TYPE_STEPS).toHaveLength(6)
    REDOX_TYPE_STEPS.forEach((step, idx) => {
      expect(step.stepIndex).toBe(idx)
      expect(step.title.length).toBeGreaterThan(0)
      expect(step.reactionDisplay.length).toBeGreaterThan(0)
      expect(step.explanation.length).toBeGreaterThan(0)
      expect(step.ladderRange[0]).toBeLessThan(step.ladderRange[1])
    })
  })

  it('clamps step index safely in getRedoxTypeStep', () => {
    expect(getRedoxTypeStep(-1).stepIndex).toBe(0)
    expect(getRedoxTypeStep(0).stepIndex).toBe(0)
    expect(getRedoxTypeStep(2.4).stepIndex).toBe(2)
    expect(getRedoxTypeStep(5).stepIndex).toBe(5)
    expect(getRedoxTypeStep(99).stepIndex).toBe(5)
  })

  it('validates transition fromId and toId reference valid species', () => {
    REDOX_TYPE_STEPS.forEach((step) => {
      const speciesIds = new Set(step.species.map((s) => s.id))
      step.transitions.forEach((tr) => {
        expect(speciesIds.has(tr.fromId)).toBe(true)
        expect(speciesIds.has(tr.toId)).toBe(true)
      })
    })
  })

  it('verifies Step 4 disproportionation bifurcation', () => {
    const step4 = REDOX_TYPE_STEPS[4]
    expect(step4.category).toBe('disproportionation')
    expect(step4.transitions).toHaveLength(2)

    const [tr1, tr2] = step4.transitions
    expect(tr1.fromId).toBe(tr2.fromId) // Starts at the same element state
    expect(tr1.tone).toBe('ox')
    expect(tr2.tone).toBe('red')
  })

  it('verifies Step 5 fractional paradox targets S4O6^2- accurately', () => {
    const step5 = REDOX_TYPE_STEPS[5]
    expect(step5.isStructureStep).toBe(true)
    const onValues = step5.species.map((s) => s.on)
    expect(onValues).toContain(5)
    expect(onValues).toContain(0)
    expect(onValues).toContain(2.5)
  })
})
