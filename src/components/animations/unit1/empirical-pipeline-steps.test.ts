import { describe, expect, it } from 'vitest'
import {
  EMPIRICAL_PIPELINE_STEP_COUNT,
  clampPipelineStep,
  targetsForPipelineStep,
} from './empirical-pipeline-steps'

describe('EmpiricalPipeline step targets', () => {
  it('has five Steps', () => {
    expect(EMPIRICAL_PIPELINE_STEP_COUNT).toBe(5)
    expect(clampPipelineStep(-1)).toBe(0)
    expect(clampPipelineStep(7)).toBe(4)
  })

  it('walks the columns percentage, grams, moles, ratio, then shows the formulas', () => {
    expect(targetsForPipelineStep(0).activeColumn).toBe('percent')
    expect(targetsForPipelineStep(1).activeColumn).toBe('grams')
    expect(targetsForPipelineStep(2).activeColumn).toBe('moles')
    expect(targetsForPipelineStep(3).activeColumn).toBe('ratio')
    expect(targetsForPipelineStep(4)).toEqual({ activeColumn: null, result: 1 })
  })

  it('shows no formula block before the last Step', () => {
    for (const step of [0, 1, 2, 3]) {
      expect(targetsForPipelineStep(step).result).toBe(0)
    }
  })
})
