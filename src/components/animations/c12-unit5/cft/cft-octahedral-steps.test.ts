import { describe, expect, it } from 'vitest'
import {
  OCTAHEDRAL_STEP_COUNT,
  clampOctahedralStep,
  octahedralStepState,
} from './cft-octahedral-steps'

describe('cft-octahedral-steps', () => {
  it('clamps out-of-range and non-finite step indices', () => {
    expect(clampOctahedralStep(-5)).toBe(0)
    expect(clampOctahedralStep(Number.NaN)).toBe(0)
    expect(clampOctahedralStep(99)).toBe(OCTAHEDRAL_STEP_COUNT - 1)
    expect(clampOctahedralStep(2.9)).toBe(2)
  })

  it('progresses from spherical field to full splitting with zero net energy shift', () => {
    const s0 = octahedralStepState(0)
    expect(s0.kind).toBe('spherical')
    expect(s0.showSphere).toBe(true)
    expect(s0.splitFraction).toBe(0)

    const s1 = octahedralStepState(1)
    expect(s1.kind).toBe('ligands-arrive')
    expect(s1.highlightRepulsion).toBe(true)
    expect(s1.ligandProgress).toBe(1)

    const s2 = octahedralStepState(2)
    expect(s2.kind).toBe('levels-split')
    expect(s2.splitFraction).toBe(1)
    expect(s2.egShift).toBeCloseTo(3 / 5, 10)
    expect(s2.t2gShift).toBeCloseTo(-2 / 5, 10)

    const s3 = octahedralStepState(3)
    expect(s3.kind).toBe('energy-balance')
    expect(s3.showShiftBrackets).toBe(true)
    expect(s3.netShift).toBeCloseTo(0, 10)
  })
})
