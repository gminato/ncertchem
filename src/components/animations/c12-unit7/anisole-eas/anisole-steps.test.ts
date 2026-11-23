import { describe, expect, it } from 'vitest'
import { ANISOLE_STEP_COUNT, ANISOLE_STEPS, getAnisoleStep } from './anisole-steps'

describe('anisole-resonance-eas Scrolly steps', () => {
  it('defines four steps matching the MDX scrolly', () => {
    expect(ANISOLE_STEP_COUNT).toBe(4)
    expect(ANISOLE_STEPS).toHaveLength(4)
    expect(ANISOLE_STEPS.map((s) => s.index)).toEqual([0, 1, 2, 3])
  })

  it('places negative charge strictly on ortho (2, 6) and para (4) positions, never meta (3, 5)', () => {
    const allCharged = new Set(ANISOLE_STEPS.flatMap((s) => s.chargedRingSites))
    expect([...allCharged].sort((a, b) => a - b)).toEqual([2, 4, 6])
    for (const step of ANISOLE_STEPS) {
      for (const m of step.metaPositions) {
        expect(step.chargedRingSites).not.toContain(m)
      }
    }
  })

  it('clamps out-of-range step indices safely', () => {
    expect(getAnisoleStep(-1).index).toBe(0)
    expect(getAnisoleStep(10).index).toBe(3)
    expect(getAnisoleStep(1.9).index).toBe(1)
  })
})
