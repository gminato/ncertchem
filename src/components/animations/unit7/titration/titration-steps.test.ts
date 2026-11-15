import { describe, expect, it } from 'vitest'
import {
  TITRATION_STEPS,
  TITRATION_STEP_COUNT,
  SCROLLY_EQUIVALENCE_VOLUME_ML,
  SCROLLY_INITIAL_FE_MMOL,
  SCROLLY_EQUIV_MNO4_MMOL,
  titrationStep,
} from './titration-steps'
import { equivalenceVolume } from '@/lib/chem/redox-titration'

describe('titration-steps.ts', () => {
  it('has exactly 5 deterministic steps', () => {
    expect(TITRATION_STEP_COUNT).toBe(5)
    expect(TITRATION_STEPS).toHaveLength(5)
  })

  it('computes equivalence volume using chemistry lib as exactly 20.0 mL', () => {
    expect(SCROLLY_EQUIVALENCE_VOLUME_ML).toBeCloseTo(20.0, 4)
    const verified = equivalenceVolume(0.01, 0.05, 20.0, 'permanganate-fe')
    expect(SCROLLY_EQUIVALENCE_VOLUME_ML).toBe(verified)
  })

  it('calculates initial Fe2+ and required KMnO4 moles accurately', () => {
    expect(SCROLLY_INITIAL_FE_MMOL).toBeCloseTo(1.0, 4)
    expect(SCROLLY_EQUIV_MNO4_MMOL).toBeCloseTo(0.2, 4)
  })

  it('monotonically increases volume delivered and progress percentage', () => {
    let lastVol = -1
    let lastPct = -1
    for (const step of TITRATION_STEPS) {
      expect(step.addedMl).toBeGreaterThanOrEqual(lastVol)
      expect(step.progressPct).toBeGreaterThanOrEqual(lastPct)
      lastVol = step.addedMl
      lastPct = step.progressPct
    }
  })

  it('sets endPoint to true strictly at step index 4', () => {
    TITRATION_STEPS.forEach((step, idx) => {
      if (idx === 4) {
        expect(step.endPoint).toBe(true)
        expect(step.flaskAppearance).toBe('First Lasting Pink')
        expect(step.addedMl).toBe(20.0)
      } else {
        expect(step.endPoint).toBe(false)
        expect(step.flaskAppearance).toBe('Colourless')
        expect(step.addedMl).toBeLessThan(20.0)
      }
    })
  })

  it('correctly clamps step indices with titrationStep()', () => {
    expect(titrationStep(-1).stepIndex).toBe(0)
    expect(titrationStep(0).stepIndex).toBe(0)
    expect(titrationStep(2.3).stepIndex).toBe(2)
    expect(titrationStep(4).stepIndex).toBe(4)
    expect(titrationStep(10).stepIndex).toBe(4)
  })
})
