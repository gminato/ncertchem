import { describe, expect, it } from 'vitest'
import {
  PHENOL_NAMED_REDOX_STEP_COUNT,
  STRUCT_BENZAL_INTERMEDIATE,
  STRUCT_BENZENE,
  STRUCT_BENZOQUINONE,
  STRUCT_FORMYL_PHENOXIDE,
  STRUCT_PHENOXIDE,
  STRUCT_SALICYLALDEHYDE,
  STRUCT_SALICYLIC_ACID,
  clampStep,
} from '@/lib/chem/c12-u7-s9-phenols'

describe('phenol-named-redox Scrolly steps', () => {
  it('matches the 5 MDX steps for phenoxide, named reactions, and redox', () => {
    expect(PHENOL_NAMED_REDOX_STEP_COUNT).toBe(5)
    expect(clampStep(-1, PHENOL_NAMED_REDOX_STEP_COUNT)).toBe(0)
    expect(clampStep(4, PHENOL_NAMED_REDOX_STEP_COUNT)).toBe(4)
  })

  it('models Kolbe and Reimer-Tiemann structures accurately', () => {
    expect(STRUCT_PHENOXIDE.highlightPositions).toEqual([2, 4, 6])
    expect(STRUCT_SALICYLIC_ACID.substituents.map((s) => [s.position, s.label])).toEqual([
      [1, 'OH'],
      [2, 'COOH'],
    ])
    expect(STRUCT_BENZAL_INTERMEDIATE.bracketed).toBe(true)
    expect(STRUCT_BENZAL_INTERMEDIATE.substituents.map((s) => [s.position, s.label])).toEqual([
      [1, 'O⁻Na⁺'],
      [2, 'CHCl₂'],
    ])
    expect(STRUCT_FORMYL_PHENOXIDE.substituents.map((s) => [s.position, s.label])).toEqual([
      [1, 'O⁻Na⁺'],
      [2, 'CHO'],
    ])
    expect(STRUCT_SALICYLALDEHYDE.substituents.map((s) => [s.position, s.label])).toEqual([
      [1, 'OH'],
      [2, 'CHO'],
    ])
  })

  it('distinguishes aromatic benzene from non-aromatic p-benzoquinone diketone', () => {
    expect(STRUCT_BENZENE.ringMode).toBe('kekule-a')
    expect(STRUCT_BENZENE.substituents).toHaveLength(0)

    expect(STRUCT_BENZOQUINONE.ringMode).toBe('quinone')
    expect(STRUCT_BENZOQUINONE.substituents).toEqual([
      { position: 1, label: 'O', bondOrder: 2, tone: 'o' },
      { position: 4, label: 'O', bondOrder: 2, tone: 'o' },
    ])
  })
})
