import { describe, expect, it } from 'vitest'
import { NCERT_CORROSION, NCERT_FUEL_CELL } from '@/lib/chem/ncert-c12-unit2-tables'
import {
  FUEL_RUST_STEPS,
  E_CELL_RUST,
  EFF_FUEL_CELL,
  EFF_THERMAL,
  clampFuelRustStep,
  fmtSignedVolts,
  getFuelRustStep,
  standardE0,
} from './fuel-rust-steps'

describe('fuel-cell-and-rust steps', () => {
  it('has six Steps in the order the prose describes', () => {
    expect(FUEL_RUST_STEPS.map((s) => s.scene)).toEqual([
      'cell',
      'cell',
      'bars',
      'corrosion',
      'rust',
      'protection',
    ])
    expect(FUEL_RUST_STEPS.map((s) => s.index)).toEqual([0, 1, 2, 3, 4, 5])
  })

  it('clamps out-of-range and fractional steps', () => {
    expect(clampFuelRustStep(-3)).toBe(0)
    expect(clampFuelRustStep(99)).toBe(5)
    expect(clampFuelRustStep(2.7)).toBe(2)
    expect(clampFuelRustStep(Number.NaN)).toBe(0)
    expect(getFuelRustStep(4).scene).toBe('rust')
  })

  it('only the running cell and the corrosion Steps are active', () => {
    expect(FUEL_RUST_STEPS.filter((s) => s.active).map((s) => s.index)).toEqual([1, 3, 4])
  })

  it('takes every potential and efficiency from the NCERT libs', () => {
    expect(standardE0('Fe2+/Fe')).toBe(NCERT_CORROSION.anodeE0)
    expect(standardE0('O2/H2O')).toBe(NCERT_CORROSION.cathodeE0)
    expect(E_CELL_RUST).toBe(NCERT_CORROSION.overallE0Cell)
    expect(EFF_FUEL_CELL).toBe(NCERT_FUEL_CELL.efficiencyPercent)
    expect(EFF_THERMAL).toBe(NCERT_FUEL_CELL.thermalPlantEfficiencyPercent)
  })

  it('formats potentials with a real minus sign', () => {
    expect(fmtSignedVolts(-0.44)).toBe('−0.44 V')
    expect(fmtSignedVolts(1.23)).toBe('+1.23 V')
  })
})
