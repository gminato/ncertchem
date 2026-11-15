import { describe, expect, it } from 'vitest'
import {
  STATE_FUNCTION_DEMO_PATHS,
  adiabaticDeltaU,
  deltaU,
  isolatedDeltaU,
  pathsDifferInHeatOrWork,
  pathsGiveSameDeltaU,
} from './thermo-first-law'

describe('first law, ΔU = q + w (NCERT Section 5.1.4)', () => {
  it('adds heat absorbed and work done on the system', () => {
    expect(deltaU(100, 50)).toBe(150)
  })

  it('gives a negative ΔU when heat leaves and work is done by the system', () => {
    expect(deltaU(-30, -20)).toBe(-50)
  })

  it('takes w = 0 and q = 0 for an isolated system, so ΔU = 0', () => {
    expect(isolatedDeltaU()).toBe(0)
    expect(deltaU(0, 0)).toBe(0)
  })

  it('reduces to ΔU = w_ad for an adiabatic wall (q = 0)', () => {
    expect(adiabaticDeltaU(1000)).toBe(1000)
    expect(deltaU(0, 1000)).toBe(adiabaticDeltaU(1000))
  })

  it('reduces to ΔU = q for a change at constant volume with no work (Section 5.1.4(b))', () => {
    expect(deltaU(250, 0)).toBe(250)
  })

  it('rejects non-finite inputs', () => {
    expect(() => deltaU(Number.NaN, 0)).toThrow(RangeError)
    expect(() => deltaU(0, Number.POSITIVE_INFINITY)).toThrow(RangeError)
    expect(() => adiabaticDeltaU(Number.NaN)).toThrow(RangeError)
  })
})

describe('state-function demo (Section 5.1.4(a))', () => {
  const [adiabatic, mixed] = STATE_FUNCTION_DEMO_PATHS

  it('has two routes with different heat and work', () => {
    expect(pathsDifferInHeatOrWork(adiabatic, mixed)).toBe(true)
    expect(adiabatic.q).not.toBe(mixed.q)
    expect(adiabatic.w).not.toBe(mixed.w)
  })

  it('gives the same ΔU on both routes', () => {
    expect(deltaU(adiabatic.q, adiabatic.w)).toBe(1000)
    expect(deltaU(mixed.q, mixed.w)).toBe(1000)
    expect(pathsGiveSameDeltaU(adiabatic, mixed)).toBe(true)
  })

  it('reports different ΔU for routes that end in different states', () => {
    const other = { name: 'Other end state', q: 600, w: 300 }
    expect(pathsGiveSameDeltaU(adiabatic, other)).toBe(false)
  })

  it('does not call two identical routes different', () => {
    expect(pathsDifferInHeatOrWork(adiabatic, { ...adiabatic, name: 'copy' })).toBe(false)
  })
})
