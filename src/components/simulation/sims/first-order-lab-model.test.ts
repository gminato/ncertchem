import { describe, expect, it } from 'vitest'
import { DEFAULT_K, DEFAULT_R0, plotDomain, readConcentration, readPressure, vesselCounts } from './first-order-lab-model'

describe('first-order lab readings', () => {
  it('reads [R] and the rate at the default time (matches the Prose)', () => {
    const r = readConcentration(DEFAULT_R0, DEFAULT_K, 60)
    expect(r.R).toBeCloseTo(0.0446, 4)
    expect(r.rate).toBeCloseTo(1.12e-3, 5)
    expect(r.kFromReading).toBeCloseTo(DEFAULT_K, 12)
    expect(r.halfLife).toBeCloseTo(Math.LN2 / DEFAULT_K, 9)
  })

  it('recovers k from any [R] reading', () => {
    for (const t of [2, 20, 75, 120]) {
      expect(readConcentration(0.3, 0.07, t).kFromReading).toBeCloseTo(0.07, 9)
    }
  })

  it('reads total pressure p_t = 2pᵢ − p_A (matches the Prose: 0.711 atm at 60 s)', () => {
    const p = readPressure(DEFAULT_K, 60)
    expect(p.pA).toBeCloseTo(0.0893, 4)
    expect(p.pT).toBeCloseTo(0.711, 3)
    expect(p.pCeiling).toBeCloseTo(0.8, 12)
    expect(p.kFromReading).toBeCloseTo(DEFAULT_K, 9)
  })

  it('draws molecule counts that follow the gas ratio to within rounding', () => {
    const c = vesselCounts(DEFAULT_K, 60)
    expect(c.reactant).toBe(3)
    expect(c.productEach).toBe(9)
    expect(vesselCounts(DEFAULT_K, 0)).toEqual({ reactant: 12, productEach: 0 })
  })

  it('keeps every y window ordered and containing the curve ends', () => {
    for (const mode of ['conc', 'ln', 'log'] as const) {
      const d = plotDomain(mode, DEFAULT_R0, 0.1)
      expect(d.yMax).toBeGreaterThan(d.yMin)
    }
    const ln = plotDomain('ln', DEFAULT_R0, 0.1)
    expect(Math.log(DEFAULT_R0) - 0.1 * 120).toBeGreaterThan(ln.yMin)
  })
})
