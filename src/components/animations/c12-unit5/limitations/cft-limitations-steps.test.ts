import { describe, expect, it } from 'vitest'
import {
  CFT_LIMITATIONS_STEP_COUNT,
  cftLimitationsStepState,
  clampCftLimitationsStep,
} from './cft-limitations-steps'

describe('cft-limitations step logic', () => {
  it('clamps step indices into 0..3', () => {
    expect(CFT_LIMITATIONS_STEP_COUNT).toBe(4)
    expect(clampCftLimitationsStep(-5)).toBe(0)
    expect(clampCftLimitationsStep(Number.NaN)).toBe(0)
    expect(clampCftLimitationsStep(7)).toBe(3)
  })

  it('maps each step to its exact kind and preserves the two NCERT better theories', () => {
    expect(cftLimitationsStepState(0).kind).toBe('prediction')
    expect(cftLimitationsStepState(1).kind).toBe('measurement')
    expect(cftLimitationsStepState(2).kind).toBe('covalency')
    const s3 = cftLimitationsStepState(3)
    expect(s3.kind).toBe('way-forward')
    expect(s3.betterTheories).toEqual(['ligand field theory', 'molecular orbital theory'])
    expect(s3.limitations).toHaveLength(2)
  })
})
