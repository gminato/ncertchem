import { describe, expect, it } from 'vitest'
import { CUMENE_STEPS, CUMENE_STEP_COUNT, cumeneStepMeta } from './cumene-steps'

describe('cumene-hydroperoxide-cleavage steps', () => {
  it('defines four steps matching the MDX Scrolly', () => {
    expect(CUMENE_STEP_COUNT).toBe(4)
    expect(CUMENE_STEPS).toHaveLength(4)
    expect(CUMENE_STEPS.map((s) => s.stageKey)).toEqual([
      'benzylic-ch',
      'hydroperoxide',
      'phenyl-shift',
      'dual-products',
    ])
  })

  it('clamps out-of-range steps safely', () => {
    expect(cumeneStepMeta(-1).index).toBe(0)
    expect(cumeneStepMeta(10).index).toBe(3)
  })
})
