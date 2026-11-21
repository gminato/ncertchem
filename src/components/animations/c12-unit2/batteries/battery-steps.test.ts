import { describe, expect, it } from 'vitest'
import { NCERT_BATTERIES } from '@/lib/chem/ncert-c12-unit2-tables'
import { BATTERY_STEPS, fmtVolt, ncertVoltageOf, reactionText, toUnicodeChem } from './battery-steps'

describe('battery Scrolly steps', () => {
  it('has five Steps in the order the Prose describes them', () => {
    expect(BATTERY_STEPS.map((s) => s.id)).toEqual(['dry-cell', 'mercury-cell', 'lead-discharge', 'lead-recharge', 'nickel-cadmium'])
    BATTERY_STEPS.forEach((s, i) => expect(s.index).toBe(i))
  })

  it('keeps every coverage and acid target in 0 to 1', () => {
    for (const s of BATTERY_STEPS) {
      expect(s.targets.coverage).toBeGreaterThanOrEqual(0)
      expect(s.targets.coverage).toBeLessThanOrEqual(1)
      expect(s.targets.acid).toBeGreaterThanOrEqual(0)
      expect(s.targets.acid).toBeLessThanOrEqual(1)
    }
  })

  it('discharge sulphates the plates and recharge clears them', () => {
    const [, , discharge, recharge] = BATTERY_STEPS
    expect(discharge.targets.coverage).toBeGreaterThan(recharge.targets.coverage)
    expect(discharge.targets.acid).toBeLessThan(recharge.targets.acid)
  })
})

describe('reaction text from NCERT_BATTERIES', () => {
  it('converts charges, subscripts and arrows without changing the species', () => {
    expect(toUnicodeChem('Zn(s) -> Zn^{2+} + 2e-')).toBe('Zn(s) → Zn²⁺ + 2e⁻')
    expect(toUnicodeChem('Pb(s) + SO4^{2-} -> PbSO4(s) + 2e-')).toBe('Pb(s) + SO₄²⁻ → PbSO₄(s) + 2e⁻')
    expect(toUnicodeChem('PbO2(s) + SO4^{2-} + 4H+ + 2e- -> PbSO4(s) + 2H2O')).toBe('PbO₂(s) + SO₄²⁻ + 4H⁺ + 2e⁻ → PbSO₄(s) + 2H₂O')
    expect(toUnicodeChem('Cd(s) + 2Ni(OH)3(s) -> CdO(s) + 2Ni(OH)2(s) + H2O(l)')).toBe('Cd(s) + 2Ni(OH)₃(s) → CdO(s) + 2Ni(OH)₂(s) + H₂O(l)')
  })

  it('shows a voltage only where NCERT states one', () => {
    expect(ncertVoltageOf('dry-cell')).toBe(1.5)
    expect(ncertVoltageOf('mercury-cell')).toBe(1.35)
    expect(() => ncertVoltageOf('lead-storage')).toThrow()
    expect(() => reactionText('nickel-cadmium', 'anodeCe')).toThrow()
  })

  it('formats every reaction the Steps show, with no ASCII arrow or caret left', () => {
    for (const entry of NCERT_BATTERIES) {
      for (const field of ['anodeCe', 'cathodeCe', 'overallCe', 'rechargeCe'] as const) {
        if (entry[field] === null) continue
        const text = reactionText(entry.id, field)
        expect(text).not.toMatch(/->|\^|\{|\}/)
        expect(text).toContain('→')
      }
    }
  })

  it('renders the minus sign as U+2212', () => {
    expect(fmtVolt(-1.35, 2)).toBe('−1.35')
    expect(fmtVolt(1.35, 2)).toBe('1.35')
  })
})
