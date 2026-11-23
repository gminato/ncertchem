import { describe, expect, it } from 'vitest'
import { NCERT_ANALYTICAL_REAGENTS, NCERT_APPLICATIONS } from './ncert-c12-unit5-s9-tables'

describe('NCERT Unit 5 section 5.7 data', () => {
  it('has unique ids and covers all five fields', () => {
    const ids = NCERT_APPLICATIONS.map((a) => a.id)
    expect(new Set(ids).size).toBe(ids.length)
    const fields = new Set(NCERT_APPLICATIONS.map((a) => a.field))
    expect([...fields].sort()).toEqual(['analysis', 'biology', 'industry', 'medicine', 'metallurgy'])
  })
  it('gets oxidation states of the printed complexes right', () => {
    const get = (id: string) => NCERT_APPLICATIONS.find((a) => a.id === id)!
    expect(get('gold').oxidationState).toBe(1)
    expect(get('hypo').oxidationState).toBe(1)
    expect(get('nickel').oxidationState).toBe(0)
    expect(get('hypo').coordinationNumber).toBe(2)
  })
  it('pairs biological pigments with their metals', () => {
    const m = (id: string) => NCERT_APPLICATIONS.find((a) => a.id === id)!.metal
    expect([m('chlorophyll'), m('haemoglobin'), m('b12')]).toEqual(['Mg', 'Fe', 'Co'])
  })
  it('lists four analytical reagents', () => {
    expect(NCERT_ANALYTICAL_REAGENTS).toHaveLength(4)
  })
  it('uses no em or en dashes', () => {
    expect(JSON.stringify(NCERT_APPLICATIONS)).not.toMatch(/[\u2013\u2014]/)
  })
})
