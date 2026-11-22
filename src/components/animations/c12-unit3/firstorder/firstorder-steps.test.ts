import { describe, expect, it } from 'vitest'
import {
  FLASK_TIME,
  MAX_SLOTS,
  P_I,
  R0,
  K,
  concAt,
  flaskCounts,
  getFirstOrderStepState,
  lnAt,
  log10At,
  pressureAFromGauge,
  pressureAAt,
  totalPressureAt,
} from './firstorder-steps'

describe('first order Steps', () => {
  it('gives the five Steps their modes (0-based)', () => {
    expect([0, 1, 2, 3, 4].map((s) => getFirstOrderStepState(s).mode)).toEqual(['conc', 'conc', 'ln', 'log', 'flask'])
    expect(getFirstOrderStepState(0).tangents).toBe(true)
    expect(getFirstOrderStepState(1).guides).toBe(true)
    expect(getFirstOrderStepState(4).flaskTime).toBe(FLASK_TIME)
  })

  it('matches the Prose numbers at 0, 20, 40 and 60 s', () => {
    expect(concAt(0)).toBeCloseTo(0.2, 12)
    expect(concAt(20) / concAt(0)).toBeCloseTo(Math.exp(-0.5), 12)
    expect(concAt(60)).toBeCloseTo(0.0446, 3)
    expect(lnAt(0)).toBeCloseTo(-1.61, 2)
    expect(lnAt(60) - lnAt(40)).toBeCloseTo(-0.5, 9)
    expect(log10At(60)).toBeCloseTo(0.651, 3)
    expect(log10At(20)).toBeCloseTo(0.217, 3)
    expect(R0 * K).toBeCloseTo(5e-3, 12)
  })

  it('gives the gas pressures and the p_A = 2pᵢ − pₜ relation', () => {
    expect(totalPressureAt(0)).toBeCloseTo(P_I, 12)
    expect(totalPressureAt(60)).toBeCloseTo(0.711, 3)
    expect(pressureAAt(60)).toBeCloseTo(0.0893, 4)
    expect(pressureAFromGauge(totalPressureAt(60))).toBeCloseTo(pressureAAt(60), 12)
  })

  it('keeps molecule counts equal to 45 per atm of pressure, and never past the slots', () => {
    const c0 = flaskCounts(0)
    expect(c0).toMatchObject({ nA: 18, nB: 0, nC: 0, total: 18 })
    const c60 = flaskCounts(60)
    expect(c60.nA).toBe(4)
    expect(c60.nB + c60.nC).toBe(28)
    expect(c60.total).toBe(Math.round(c60.pT * 45))
    expect(MAX_SLOTS).toBe(36)
    for (let t = 0; t <= 200; t += 5) expect(flaskCounts(t).total).toBeLessThanOrEqual(MAX_SLOTS)
  })
})
