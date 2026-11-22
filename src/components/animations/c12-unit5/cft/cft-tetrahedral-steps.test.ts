import { describe, expect, it } from 'vitest'
import {
  TETRAHEDRAL_STEP_COUNT,
  clampTetrahedralStep,
  tetrahedralStepState,
} from './cft-tetrahedral-steps'

describe('cft-tetrahedral-steps', () => {
  it('clamps step indices safely', () => {
    expect(clampTetrahedralStep(-3)).toBe(0)
    expect(clampTetrahedralStep(Number.NaN)).toBe(0)
    expect(clampTetrahedralStep(10)).toBe(TETRAHEDRAL_STEP_COUNT - 1)
  })

  it('uses NCERT tetrahedral shifts and 4/9 ratio', () => {
    expect(tetrahedralStepState(0).kind).toBe('cube-geometry')
    const s1 = tetrahedralStepState(1)
    expect(s1.kind).toBe('inverted-split')
    expect(s1.t2Shift).toBeCloseTo(2 / 5, 10)
    expect(s1.eShift).toBeCloseTo(-3 / 5, 10)
    expect(3 * s1.t2Shift + 2 * s1.eShift).toBeCloseTo(0, 10)

    const s2 = tetrahedralStepState(2)
    expect(s2.kind).toBe('side-by-side')
    expect(s2.ratio).toBeCloseTo(4 / 9, 10)
  })
})
