import { describe, expect, it } from 'vitest'
import {
  PHENOL_EAS_STEP_COUNT,
  STRUCT_DISULPHONIC,
  STRUCT_O_BROMOPHENOL,
  STRUCT_O_NITROPHENOL,
  STRUCT_P_BROMOPHENOL,
  STRUCT_P_NITROPHENOL,
  STRUCT_PHENOL_ACTIVATED,
  STRUCT_PICRIC_ACID,
  STRUCT_TRIBROMOPHENOL,
  clampStep,
} from '@/lib/chem/c12-u7-s9-phenols'

describe('phenol-eas-control Scrolly steps', () => {
  it('matches the 5 MDX steps in Section 7.4.4', () => {
    expect(PHENOL_EAS_STEP_COUNT).toBe(5)
    expect(clampStep(0, PHENOL_EAS_STEP_COUNT)).toBe(0)
    expect(clampStep(4, PHENOL_EAS_STEP_COUNT)).toBe(4)
    expect(clampStep(99, PHENOL_EAS_STEP_COUNT)).toBe(4)
  })

  it('activates ortho (2, 6) and para (4) positions on phenol', () => {
    expect(STRUCT_PHENOL_ACTIVATED.highlightPositions).toEqual([2, 4, 6])
    expect(STRUCT_PHENOL_ACTIVATED.ringCharges?.map((c) => c.position)).toEqual([2, 4, 6])
  })

  it('places substituents accurately on nitration and bromination products', () => {
    expect(STRUCT_O_NITROPHENOL.substituents.map((s) => [s.position, s.label])).toEqual([
      [1, 'OH'],
      [2, 'NO₂'],
    ])
    expect(STRUCT_P_NITROPHENOL.substituents.map((s) => [s.position, s.label])).toEqual([
      [1, 'OH'],
      [4, 'NO₂'],
    ])
    expect(STRUCT_DISULPHONIC.substituents.map((s) => [s.position, s.label])).toEqual([
      [1, 'OH'],
      [2, 'SO₃H'],
      [4, 'SO₃H'],
    ])
    expect(STRUCT_PICRIC_ACID.substituents.map((s) => s.position)).toEqual([1, 2, 4, 6])
    expect(STRUCT_O_BROMOPHENOL.tag).toBe('Minor')
    expect(STRUCT_P_BROMOPHENOL.tag).toBe('Major')
    expect(STRUCT_TRIBROMOPHENOL.substituents.map((s) => s.position)).toEqual([1, 2, 4, 6])
  })
})
