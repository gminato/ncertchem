import { describe, expect, it } from 'vitest'
import {
  NCERT_COBALT_SECONDARY_VALENCE,
  NCERT_PRIMARY_VALENCE,
  NCERT_WERNER_COBALT,
  NCERT_WERNER_FACTS,
  NCERT_WERNER_SHAPES,
} from './ncert-c12-unit5-s1-tables'

describe('Unit 5 section 5.1 tables', () => {
  it('has the four Table 5.1 rows with printed AgCl moles', () => {
    expect(NCERT_WERNER_COBALT.map((r) => r.agclMoles)).toEqual([3, 2, 1, 1])
    expect(NCERT_WERNER_COBALT.map((r) => r.colour)).toEqual(['Yellow', 'Purple', 'Green', 'Violet'])
  })
  it('AgCl moles equal counter ions and secondary valence is six', () => {
    for (const r of NCERT_WERNER_COBALT) {
      expect(r.counterIons).toBe(r.agclMoles)
      expect(r.ammonia + r.boundChloride).toBe(NCERT_COBALT_SECONDARY_VALENCE)
      expect(r.entityCharge).toBe(r.counterIons)
      expect(r.boundChloride + r.counterIons).toBe(3)
    }
  })
  it('keeps green and violet as isomers', () => {
    expect(NCERT_WERNER_COBALT[2].empirical).toBe(NCERT_WERNER_COBALT[3].empirical)
  })
  it('lists primary valences and shapes', () => {
    expect(NCERT_PRIMARY_VALENCE.map((p) => p.primary)).toEqual([3, 2, 2])
    expect(NCERT_WERNER_SHAPES).toHaveLength(5)
    expect(NCERT_WERNER_FACTS.nobelYear).toBe(1913)
  })
})
