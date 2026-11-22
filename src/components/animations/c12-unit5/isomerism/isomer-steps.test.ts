import { describe, expect, it } from 'vitest'
import {
  chiralityStepVisual,
  familyTreeStepVisual,
  geometricStepVisual,
  structuralStepVisual,
} from './isomer-steps'

describe('Section 5.4 scrolly step state machines', () => {
  it('maps isomer-family-tree steps 0..2 and clamps out-of-range values', () => {
    expect(familyTreeStepVisual(-1)).toBe('overview')
    expect(familyTreeStepVisual(0)).toBe('overview')
    expect(familyTreeStepVisual(1)).toBe('stereo')
    expect(familyTreeStepVisual(2)).toBe('structural')
    expect(familyTreeStepVisual(9)).toBe('structural')
  })

  it('maps geometrical-isomer-builder steps 0..4', () => {
    expect([0, 1, 2, 3, 4].map(geometricStepVisual)).toEqual([
      'sq-cis-trans',
      'sq-mabxl',
      'tetrahedral',
      'oct-cis-trans',
      'oct-fac-mer',
    ])
    expect(geometricStepVisual(-2)).toBe('sq-cis-trans')
    expect(geometricStepVisual(10)).toBe('oct-fac-mer')
  })

  it('maps chirality-mirror steps 0..3', () => {
    expect([0, 1, 2, 3].map(chiralityStepVisual)).toEqual([
      'propellers',
      'superimpose',
      'polarimeter',
      'cis-vs-trans',
    ])
  })

  it('maps structural-isomer-swaps steps 0..3', () => {
    expect([0, 1, 2, 3].map(structuralStepVisual)).toEqual([
      'linkage',
      'coordination',
      'ionisation',
      'solvate',
    ])
  })
})
