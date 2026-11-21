import { describe, expect, it } from 'vitest'
import { FARADAY } from './ncert-c12-unit2-tables'
import { PLATING_METALS, electronsPerIon, platingMetal, platingReadout, seriesReadout } from './electroplating'

describe('electroplating', () => {
  it('reads electron counts from Table 2.1', () => {
    expect(electronsPerIon(platingMetal('Ag'))).toBe(1)
    expect(electronsPerIon(platingMetal('Cu'))).toBe(2)
    expect(electronsPerIon(platingMetal('Ni'))).toBe(2)
  })

  it('offers no aluminium bath', () => {
    expect(PLATING_METALS.map((m) => m.ion)).not.toContain('Al³⁺')
  })

  it('computes Q, moles of electrons and mass for silver at 0.50 A for 10 min', () => {
    const r = platingReadout(platingMetal('Ag'), 0.5, 600)
    expect(r.charge).toBeCloseTo(300, 10)
    expect(r.molesOfElectrons).toBeCloseTo(300 / FARADAY, 10)
    // m = (Q/F) × M/n = (300/96487) × 107.87
    expect(r.massG).toBeCloseTo((300 / FARADAY) * 107.87, 6)
    expect(r.massG).toBeCloseTo(0.3354, 4)
  })

  it('halves the mass per coulomb for copper because n = 2', () => {
    const cu = platingReadout(platingMetal('Cu'), 1, 1000)
    expect(cu.massG).toBeCloseTo((1000 / FARADAY) * (63.55 / 2), 6)
  })

  it('gives masses in series in the ratio M/n', () => {
    const { masses, charge } = seriesReadout([platingMetal('Ag'), platingMetal('Cu')], 2, 900)
    expect(charge).toBe(1800)
    expect(masses[0] / masses[1]).toBeCloseTo((107.87 / 1) / (63.55 / 2), 8)
  })

  it('rejects an unknown metal', () => {
    expect(() => platingMetal('Al' as 'Ag')).toThrow(RangeError)
  })
})
