import { describe, expect, it } from 'vitest'
import {
  NCERT_CHIRAL_CASES,
  NCERT_GEOMETRIC_CASES,
  NCERT_ISOMER_KINDS,
  NCERT_ISOMER_PAIRS,
} from './ncert-c12-unit5-s4-tables'

describe('NCERT Unit 5 section 5.4 tables', () => {
  it('lists two stereo and four structural kinds', () => {
    expect(NCERT_ISOMER_KINDS).toHaveLength(6)
    expect(NCERT_ISOMER_KINDS.filter((k) => k.family === 'stereo')).toHaveLength(2)
    expect(NCERT_ISOMER_KINDS.filter((k) => k.family === 'structural')).toHaveLength(4)
  })

  it('every pair belongs to a known kind and every kind has a pair', () => {
    const ids = new Set(NCERT_ISOMER_KINDS.map((k) => k.id))
    for (const p of NCERT_ISOMER_PAIRS) expect(ids.has(p.kind)).toBe(true)
    for (const id of ids) expect(NCERT_ISOMER_PAIRS.some((p) => p.kind === id)).toBe(true)
  })

  it('isomer counts match the labels', () => {
    for (const c of NCERT_GEOMETRIC_CASES) {
      if (c.isomers > 1) expect(c.labels).toHaveLength(c.isomers)
    }
    expect(NCERT_GEOMETRIC_CASES.find((c) => c.formula === 'MABXL')?.isomers).toBe(3)
    expect(NCERT_GEOMETRIC_CASES.find((c) => c.geometry === 'tetrahedral')?.isomers).toBe(1)
  })

  it('only the cis form of [PtCl2(en)2]2+ is chiral', () => {
    const get = (e: string) => NCERT_CHIRAL_CASES.find((c) => c.entity === e)?.chiral
    expect(get('cis-[PtCl2(en)2]2+')).toBe(true)
    expect(get('trans-[PtCl2(en)2]2+')).toBe(false)
  })
})
