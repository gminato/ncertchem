import { describe, expect, it } from 'vitest'
import {
  LAB_CV_J_PER_K,
  LAB_HEAT_STEP_J,
  LAB_T_START_K,
  LAB_V_MAX_L,
  LAB_V_START_L,
  applyHeat,
  gasPressureBar,
  initialLabState,
  ledgerDeltaU,
  movePiston,
  temperatureDeltaU,
  twoPathEnds,
} from './first-law-lab'
import { pathsDifferInHeatOrWork, pathsGiveSameDeltaU } from './thermo-first-law'

describe('first-law lab: starting state', () => {
  it('starts at 300 K and 1 bar, so V = nRT/p = 24.94 L', () => {
    const s = initialLabState()
    expect(s.temperatureK).toBe(LAB_T_START_K)
    expect(gasPressureBar(s)).toBeCloseTo(1, 9)
    expect(s.volumeL).toBeCloseTo(24.942, 3)
    expect(s.volumeL).toBe(LAB_V_START_L)
  })

  it('uses C_V = (3/2) nR for one mole of a monatomic ideal gas, 12.47 J K⁻¹', () => {
    expect(LAB_CV_J_PER_K).toBeCloseTo(12.471, 3)
  })
})

describe('first-law lab: heat at constant volume (Section 5.1.4(b))', () => {
  it('records q with no work, so ΔU = q', () => {
    const s = applyHeat(initialLabState(), LAB_HEAT_STEP_J)
    expect(s.q).toBe(200)
    expect(s.w).toBe(0)
    expect(ledgerDeltaU(s)).toBeCloseTo(200, 9)
  })

  it('raises the temperature by q / C_V, so the ledger matches C_V ΔT', () => {
    const s = applyHeat(initialLabState(), LAB_HEAT_STEP_J)
    expect(s.temperatureK - LAB_T_START_K).toBeCloseTo(200 / LAB_CV_J_PER_K, 9)
    expect(temperatureDeltaU(s)).toBeCloseTo(ledgerDeltaU(s), 9)
  })

  it('a negative heat removes energy and cools the gas', () => {
    const s = applyHeat(initialLabState(), -LAB_HEAT_STEP_J)
    expect(s.q).toBe(-200)
    expect(s.temperatureK).toBeLessThan(LAB_T_START_K)
  })

  it('rejects a non-finite amount of heat', () => {
    expect(() => applyHeat(initialLabState(), Number.NaN)).toThrow(RangeError)
  })
})

describe('first-law lab: piston moves against a constant external pressure (Section 5.2.1)', () => {
  it('a release to a lower pressure expands the gas, cools it, and gives negative work', () => {
    const r = movePiston(initialLabState(), 0.5)
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.state.volumeL).toBeGreaterThan(LAB_V_START_L)
    expect(r.state.temperatureK).toBeLessThan(LAB_T_START_K)
    expect(r.workJ).toBeLessThan(0)
  })

  it('a push to a higher pressure compresses the gas, heats it, and gives positive work', () => {
    const r = movePiston(initialLabState(), 2)
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.state.volumeL).toBeLessThan(LAB_V_START_L)
    expect(r.state.temperatureK).toBeGreaterThan(LAB_T_START_K)
    expect(r.workJ).toBeGreaterThan(0)
  })

  it('ends in mechanical equilibrium: the gas pressure equals the external pressure', () => {
    for (const p of [0.5, 0.8, 1.3, 2]) {
      const r = movePiston(initialLabState(), p)
      expect(r.ok).toBe(true)
      if (!r.ok) continue
      expect(gasPressureBar(r.state)).toBeCloseTo(p, 9)
    }
  })

  it('obeys the first law with q = 0: ΔU = w, and C_V ΔT equals w', () => {
    for (const p of [0.5, 1.5, 2]) {
      const r = movePiston(initialLabState(), p)
      expect(r.ok).toBe(true)
      if (!r.ok) continue
      expect(r.state.q).toBe(0)
      expect(ledgerDeltaU(r.state)).toBeCloseTo(r.workJ, 6)
      expect(temperatureDeltaU(r.state)).toBeCloseTo(r.workJ, 6)
    }
  })

  it('keeps the ledger and temperature in agreement after heat and then a move', () => {
    const heated = applyHeat(initialLabState(), 400)
    const r = movePiston(heated, 1.6)
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(ledgerDeltaU(r.state)).toBeCloseTo(temperatureDeltaU(r.state), 6)
    expect(r.state.q).toBe(400)
  })

  it('refuses a move that would take the piston out of the cylinder', () => {
    // From a hot state, releasing to 0.5 bar would need more than the cylinder holds.
    let s = initialLabState()
    for (let i = 0; i < 8; i++) s = applyHeat(s, LAB_HEAT_STEP_J)
    const r = movePiston(s, 0.5)
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.reason).toContain(`${LAB_V_MAX_L} L`)
  })

  it('rejects a non-positive external pressure', () => {
    expect(() => movePiston(initialLabState(), 0)).toThrow(RangeError)
    expect(() => movePiston(initialLabState(), Number.NaN)).toThrow(RangeError)
  })
})

describe('first-law lab: two paths from state A to state B (Section 5.1.4(c))', () => {
  const [route1, route2] = twoPathEnds()

  it('both routes give the same ΔU, so U is a state function', () => {
    expect(route1.deltaUJ).toBe(1000)
    expect(route2.deltaUJ).toBe(1000)
    expect(pathsGiveSameDeltaU(route1.path, route2.path)).toBe(true)
  })

  it('the routes differ in q and w, so those are path functions', () => {
    expect(pathsDifferInHeatOrWork(route1.path, route2.path)).toBe(true)
    expect(route1.path.q).not.toBe(route2.path.q)
    expect(route1.path.w).not.toBe(route2.path.w)
  })

  it('both routes end at the same temperature, ΔU / C_V above the start', () => {
    expect(route1.endTemperatureK).toBeCloseTo(LAB_T_START_K + 1000 / LAB_CV_J_PER_K, 9)
    expect(route2.endTemperatureK).toBe(route1.endTemperatureK)
  })
})
