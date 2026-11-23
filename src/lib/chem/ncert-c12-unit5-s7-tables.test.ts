import { describe, expect, it } from 'vitest'
import {
  NCERT_GEMS,
  NCERT_NI_EN_SERIES,
  NCERT_S7_FACTS,
  NCERT_TABLE_5_3,
  photonEnergyJ,
} from './ncert-c12-unit5-s7-tables'

describe('NCERT Unit 5 S5.5.5-5.5.6 tables', () => {
  it('has the six Table 5.3 rows with printed wavelengths', () => {
    expect(NCERT_TABLE_5_3.map((r) => r.wavelengthNm)).toEqual([535, 500, 475, 310, 600, 498])
    const ti = NCERT_TABLE_5_3.find((r) => r.id === 'ti-h2o-6')
    expect(ti?.observed).toBe('Violet')
    expect(NCERT_TABLE_5_3.find((r) => r.id === 'cu-h2o-4')?.observed).toBe('Blue')
  })
  it('Ni en series loses two waters per en', () => {
    for (const s of NCERT_NI_EN_SERIES) expect(s.waterLeft).toBe(6 - 2 * s.enPerNi)
    expect(NCERT_NI_EN_SERIES.map((s) => s.colour)).toEqual(['green', 'pale blue', 'blue/purple', 'violet'])
  })
  it('gems are d3 chromium(III)', () => {
    expect(NCERT_GEMS.every((g) => g.dElectrons === 3)).toBe(true)
  })
  it('lists two limitations', () => {
    expect(NCERT_S7_FACTS.limitations).toHaveLength(2)
  })
  it('photon energy at 498 nm is about 3.99e-19 J', () => {
    expect(photonEnergyJ(498) / 1e-19).toBeCloseTo(3.99, 1)
  })
})
