import { describe, expect, it } from 'vitest'
import { FARADAY } from './ncert-c12-unit2-tables'
import { LEAD_ELECTRONS, PBSO4_MOLAR_MASS, PB_MOLAR_MASS, leadCycleAtTime } from './lead-acid-cycle'

describe('lead-acid molar masses', () => {
  it('takes Pb and PbSO4 from the atomic masses', () => {
    expect(PB_MOLAR_MASS).toBeCloseTo(207.2, 1)
    expect(PBSO4_MOLAR_MASS).toBeCloseTo(303.3, 1)
  })
})

describe('leadCycleAtTime', () => {
  it('passes Q = It and converts lead by two electrons per Pb', () => {
    const r = leadCycleAtTime(2.0, 3.0)
    expect(r.charge).toBeCloseTo(21600, 6)
    expect(r.electronMoles).toBeCloseTo(21600 / FARADAY, 9)
    expect(r.leadMoles).toBeCloseTo(r.electronMoles / LEAD_ELECTRONS, 9)
  })

  it('gives 23.19 g of lead for 2.0 A over 3.0 h', () => {
    expect(leadCycleAtTime(2.0, 3.0).leadMassG).toBeCloseTo(23.19, 2)
  })

  it('uses 2 mol H2SO4 per mol Pb and forms 2 mol PbSO4 per mol Pb', () => {
    const r = leadCycleAtTime(2.0, 3.0)
    expect(r.h2SO4Moles).toBeCloseTo(2 * r.leadMoles, 9)
    expect(r.pbSO4MassG).toBeCloseTo(2 * r.leadMoles * PBSO4_MOLAR_MASS, 9)
  })

  it('is zero at the start', () => {
    const r = leadCycleAtTime(2.0, 0)
    expect(r.charge).toBe(0)
    expect(r.leadMassG).toBe(0)
  })
})
