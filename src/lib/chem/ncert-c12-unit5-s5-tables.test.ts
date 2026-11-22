import { describe, expect, it } from 'vitest'
import {
  NCERT_MNBR4,
  NCERT_TABLE_5_2,
  NCERT_VBT_COMPLEXES,
  spinOnly,
} from './ncert-c12-unit5-s5-tables'

describe('Table 5.2', () => {
  it('has five rows and two kinds of coordination number 6 hybridisation', () => {
    expect(NCERT_TABLE_5_2).toHaveLength(5)
    expect(NCERT_TABLE_5_2.filter((r) => r.coordinationNumber === 6).map((r) => r.hybridisation)).toEqual(['sp³d²', 'd²sp³'])
  })
})

describe('VBT complexes', () => {
  it('inner orbital complexes use d²sp³, outer use sp³d²', () => {
    for (const c of NCERT_VBT_COMPLEXES) {
      if (c.orbitalType === 'inner') expect(c.hybridisation).toBe('d²sp³')
      if (c.orbitalType === 'outer') expect(c.hybridisation).toBe('sp³d²')
    }
  })
  it('unpaired counts never exceed the d count and match d-electron parity', () => {
    for (const c of NCERT_VBT_COMPLEXES) {
      expect(c.unpaired).toBeLessThanOrEqual(c.d)
      expect((c.d - c.unpaired) % 2).toBe(0)
    }
  })
  it('MnBr4 moment matches five unpaired electrons', () => {
    expect(spinOnly(NCERT_MNBR4.unpaired)).toBeCloseTo(NCERT_MNBR4.moment, 1)
  })
})
