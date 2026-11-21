import { describe, expect, it } from 'vitest'
import {
  FARADAY,
  FARADAY_ROUNDED,
  GAS_CONSTANT_J,
  NCERT_BATTERIES,
  NCERT_CONDUCTIVITY_MATERIALS,
  NCERT_CORROSION,
  NCERT_EXAMPLE_2_6_KCL,
  NCERT_FUEL_CELL,
  NCERT_KCL_CONDUCTIVITY,
  NCERT_LIMITING_ION_CONDUCTIVITY,
  NCERT_STANDARD_POTENTIALS,
  NCERT_UNIT2_ERRATA,
  NERNST_SLOPE_298,
} from './ncert-c12-unit2-tables'

describe('constants', () => {
  it('uses NCERT Faraday value and the rounded value separately', () => {
    expect(FARADAY).toBe(96487)
    expect(FARADAY_ROUNDED).toBe(96500)
    expect(GAS_CONSTANT_J).toBe(8.314)
    expect(NERNST_SLOPE_298).toBe(0.059)
  })
})

describe('Table 2.1 standard potentials', () => {
  it('has all 34 rows in NCERT order, from F2 to Li+', () => {
    expect(NCERT_STANDARD_POTENTIALS).toHaveLength(34)
    expect(NCERT_STANDARD_POTENTIALS[0].e0).toBe(2.87)
    expect(NCERT_STANDARD_POTENTIALS[NCERT_STANDARD_POTENTIALS.length - 1].e0).toBe(-3.05)
  })

  it('is sorted by decreasing E° (NCERT order)', () => {
    for (let i = 1; i < NCERT_STANDARD_POTENTIALS.length; i++) {
      expect(NCERT_STANDARD_POTENTIALS[i].e0).toBeLessThanOrEqual(NCERT_STANDARD_POTENTIALS[i - 1].e0)
    }
  })

  it('matches spot-checked rows from the page image', () => {
    const byId = (id: string) => NCERT_STANDARD_POTENTIALS.find((r) => r.id === id)
    expect(byId('Cu2+/Cu')?.e0).toBe(0.34)
    expect(byId('Cu+/Cu')?.e0).toBe(0.52)
    expect(byId('Hg2+/Hg2 2+')?.e0).toBe(0.92)
    expect(byId('H2O/H2')?.e0).toBe(-0.83)
    expect(byId('Zn2+/Zn')?.e0).toBe(-0.76)
    expect(byId('AgBr/Ag')?.e0).toBe(0.1)
  })

  it('has an mhchem string and a plain reaction on every row, with an arrow', () => {
    for (const row of NCERT_STANDARD_POTENTIALS) {
      expect(row.ce).toContain('->')
      expect(row.reaction).toContain('→')
      expect(row.electrons).toBeGreaterThan(0)
    }
  })

  it('flags reduced-metal rows correctly', () => {
    const metals = NCERT_STANDARD_POTENTIALS.filter((r) => r.reducedFormIsMetal).map((r) => r.id)
    expect(metals).toContain('Cu2+/Cu')
    expect(metals).toContain('Li+/Li')
    expect(metals).not.toContain('H+/H2')
    expect(metals).not.toContain('AgCl/Ag')
  })
})

describe('Table 2.2 conductivity of materials', () => {
  it('has 17 rows across the four groups', () => {
    expect(NCERT_CONDUCTIVITY_MATERIALS).toHaveLength(17)
    const groups = new Set(NCERT_CONDUCTIVITY_MATERIALS.map((r) => r.group))
    expect(groups.size).toBe(4)
  })

  it('keeps printed values for pure water and Ge', () => {
    expect(NCERT_CONDUCTIVITY_MATERIALS.find((r) => r.material === 'Pure water')?.sPerM).toBe(3.5e-5)
    expect(NCERT_CONDUCTIVITY_MATERIALS.find((r) => r.material === 'Ge')?.sPerM).toBe(2.0)
  })
})

describe('Table 2.3 KCl conductivity', () => {
  it('has three rows and the unit conversions hold on each row', () => {
    expect(NCERT_KCL_CONDUCTIVITY).toHaveLength(3)
    for (const r of NCERT_KCL_CONDUCTIVITY) {
      expect(r.kappaSmInv).toBeCloseTo(r.kappaScmInv * 100, 9)
      expect(r.molPerM3).toBeCloseTo(r.molPerL * 1000, 9)
      expect(r.lambdaSm2).toBeCloseTo(r.lambdaScm2 * 1e-4, 12)
    }
  })

  it('matches the printed molar conductivities', () => {
    expect(NCERT_KCL_CONDUCTIVITY.map((r) => r.lambdaScm2)).toEqual([111.3, 129.0, 141.0])
  })
})

describe('Table 2.4 limiting ion conductivities', () => {
  it('has all 10 ions with the printed values', () => {
    expect(NCERT_LIMITING_ION_CONDUCTIVITY).toHaveLength(10)
    const get = (id: string) => NCERT_LIMITING_ION_CONDUCTIVITY.find((r) => r.id === id)?.lambda0Scm2
    expect(get('H+')).toBe(349.6)
    expect(get('SO4_2-')).toBe(160.0)
    expect(get('CH3COO-')).toBe(40.9)
  })

  it('reproduces NCERT regularities (Kohlrausch differences, Sec. 2.4.4)', () => {
    const get = (id: string) => NCERT_LIMITING_ION_CONDUCTIVITY.find((r) => r.id === id)!.lambda0Scm2
    // K+ − Na+ = 23.4 S cm² mol⁻¹, the same difference as KCl − NaCl and KBr − NaBr
    expect(get('K+') - get('Na+')).toBeCloseTo(23.4, 6)
    // Br⁻ − Cl⁻ = 1.8 S cm² mol⁻¹
    expect(get('Br-') - get('Cl-')).toBeCloseTo(1.8, 6)
  })
})

describe('Example 2.6 KCl data', () => {
  it('has four concentrations with √c values that match the printed √c column', () => {
    expect(NCERT_EXAMPLE_2_6_KCL).toHaveLength(4)
    const roots = NCERT_EXAMPLE_2_6_KCL.map((r) => Math.sqrt(r.c)).map((v) => Math.round(v * 1e5) / 1e5)
    expect(roots).toEqual([0.01407, 0.01758, 0.02283, 0.03145])
  })
})

describe('batteries, fuel cell and corrosion', () => {
  it('lists the four NCERT batteries with the printed voltages where NCERT states them', () => {
    expect(NCERT_BATTERIES.map((b) => b.id)).toEqual(['dry-cell', 'mercury-cell', 'lead-storage', 'nickel-cadmium'])
    expect(NCERT_BATTERIES.find((b) => b.id === 'dry-cell')?.ncertVoltage).toBe(1.5)
    expect(NCERT_BATTERIES.find((b) => b.id === 'mercury-cell')?.ncertVoltage).toBe(1.35)
    expect(NCERT_BATTERIES.find((b) => b.id === 'lead-storage')?.ncertVoltage).toBeNull()
    expect(NCERT_BATTERIES.find((b) => b.id === 'nickel-cadmium')?.ncertVoltage).toBeNull()
  })

  it('gives the lead battery a recharge reaction and the primary/secondary split', () => {
    const lead = NCERT_BATTERIES.find((b) => b.id === 'lead-storage')!
    expect(lead.kind).toBe('secondary')
    expect(lead.rechargeCe).toContain('Pb(s)')
    expect(NCERT_BATTERIES.filter((b) => b.kind === 'primary')).toHaveLength(2)
  })

  it('gives the fuel cell 70% and 40% efficiencies', () => {
    expect(NCERT_FUEL_CELL.efficiencyPercent).toBe(70)
    expect(NCERT_FUEL_CELL.thermalPlantEfficiencyPercent).toBe(40)
  })

  it('corrosion E°cell equals 1.23 − (−0.44)', () => {
    expect(NCERT_CORROSION.cathodeE0 - NCERT_CORROSION.anodeE0).toBeCloseTo(NCERT_CORROSION.overallE0Cell, 9)
  })
})

describe('errata', () => {
  it('lists the known NCERT slips with unique ids', () => {
    const ids = NCERT_UNIT2_ERRATA.map((e) => e.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids).toContain('ex2.3-missing-digit')
    expect(ids).toContain('ex2.7-table-ref')
    expect(NCERT_UNIT2_ERRATA.length).toBeGreaterThanOrEqual(8)
  })
})
