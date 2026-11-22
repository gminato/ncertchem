import { describe, expect, it } from 'vitest'
import { NCERT_S2_ENTITIES } from '@/lib/chem/ncert-c12-unit5-s2-tables'
import {
  ALL_DISSECTED_OPTIONS,
  DEFAULT_ENTITY_FORMULA,
  dissectComplex,
} from './coordination-dissector-logic'

describe('coordination-dissector-logic', () => {
  it('exposes all 10 NCERT Section 5.2 complexes and defaults to [Co(en)3]3+', () => {
    expect(ALL_DISSECTED_OPTIONS).toHaveLength(10)
    const def = dissectComplex(DEFAULT_ENTITY_FORMULA)
    expect(def.entity.formula).toBe('[Co(en)3]3+')
    expect(def.cn).toBe(6)
    expect(def.oxNumber).toBe(3)
    expect(def.romanLabel).toBe('Co(III)')
    expect(def.homoleptic).toBe(true)
  })

  it('computes CN and oxidation number accurately for every Section 5.2 complex', () => {
    for (const entity of NCERT_S2_ENTITIES) {
      const d = dissectComplex(entity.formula)
      expect(d.cn).toBe(entity.coordinationNumber)
      expect(d.oxNumber).toBe(entity.metalCharge)
    }
  })

  it('identifies K4[Fe(CN)6] counter ion and [Co(NH3)4Cl2]+ heteroleptic status', () => {
    const ferro = dissectComplex('[Fe(CN)6]4-')
    expect(ferro.displayFormula).toBe('K₄[Fe(CN)₆]')
    expect(ferro.counterIonPrefix).toBe('K₄')
    expect(ferro.oxNumber).toBe(2)
    expect(ferro.romanLabel).toBe('Fe(II)')

    const hetero = dissectComplex('[Co(NH3)4Cl2]+')
    expect(hetero.homoleptic).toBe(false)
    expect(hetero.cn).toBe(6)
    expect(hetero.oxNumber).toBe(3)
  })
})
