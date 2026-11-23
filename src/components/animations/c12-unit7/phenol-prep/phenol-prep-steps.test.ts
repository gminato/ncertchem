import { describe, expect, it } from 'vitest'
import { PHENOL_PREP_STEP_COUNT, PHENOL_PREP_STEPS, phenolPrepStepMeta } from './phenol-prep-steps'

describe('phenol-prep-routes steps', () => {
  it('defines four distinct learner steps matching the MDX Scrolly', () => {
    expect(PHENOL_PREP_STEP_COUNT).toBe(4)
    expect(PHENOL_PREP_STEPS).toHaveLength(4)
    expect(PHENOL_PREP_STEPS.map((s) => s.routeKey)).toEqual([
      'haloarene',
      'sulphonic',
      'diazonium',
      'workup-comparison',
    ])
  })

  it('cites exact NCERT conditions in each route', () => {
    expect(phenolPrepStepMeta(0).reagents).toContain('623 K')
    expect(phenolPrepStepMeta(0).reagents).toContain('300 atm')
    expect(phenolPrepStepMeta(1).reagents).toContain('Oleum')
    expect(phenolPrepStepMeta(2).reagents).toContain('273-278 K')
    expect(phenolPrepStepMeta(3).routeKey).toBe('workup-comparison')
  })

  it('clamps out-of-range step indices safely', () => {
    expect(phenolPrepStepMeta(-2).index).toBe(0)
    expect(phenolPrepStepMeta(99).index).toBe(3)
  })
})
