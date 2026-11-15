import { describe, expect, it } from 'vitest'
import { CACO3_KP_1100K, caco3VesselState, co2MolesAtKp, gasMolesAtPressure } from './heterogeneous'

describe('CaCO3 in a closed vessel (Section 6.5)', () => {
  it('uses 2.00 bar for Kp at 1100 K, as NCERT gives 2.0 × 10⁵ Pa', () => {
    expect(CACO3_KP_1100K).toBe(2.0)
  })

  it('finds the CO2 amount that gives Kp: n = Kp·V/(RT) = 0.2188 mol in 10.0 L', () => {
    expect(co2MolesAtKp(2.0, 10, 1100)).toBeCloseTo(20 / (0.0831 * 1100), 12)
    expect(co2MolesAtKp(2.0, 10, 1100).toFixed(4)).toBe('0.2188')
  })

  it('converts a pressure to moles of gas with pV = nRT: 1.00 bar in 10.0 L at 1100 K is 0.1094 mol', () => {
    expect(gasMolesAtPressure(1.0, 10, 1100)).toBeCloseTo(0.10941, 4)
  })

  it('gives the same pressure, Kp, with a little solid or a lot', () => {
    const little = caco3VesselState(0.5, 10, 1100)
    const lots = caco3VesselState(2.0, 10, 1100)
    expect(little.pressureBar).toBeCloseTo(2.0, 9)
    expect(lots.pressureBar).toBeCloseTo(2.0, 9)
    expect(little.co2Moles).toBeCloseTo(lots.co2Moles, 12)
    expect(little.solidRemaining).toBeCloseTo(0.5 - 0.21879, 4)
    expect(lots.solidRemaining).toBeCloseTo(2.0 - 0.21879, 4)
    expect(little.solidPresent && lots.solidPresent).toBe(true)
  })

  it('gives a pressure below Kp when the solid runs out first', () => {
    const scarce = caco3VesselState(0.1, 10, 1100)
    expect(scarce.solidPresent).toBe(false)
    expect(scarce.solidRemaining).toBeCloseTo(0, 12)
    expect(scarce.pressureBar).toBeCloseTo((0.1 * 0.0831 * 1100) / 10, 9)
    expect(scarce.pressureBar).toBeLessThan(CACO3_KP_1100K)
  })

  it('gives [CO2] = Kp/(RT) as the modified Kc while solid is present', () => {
    const s = caco3VesselState(2.0, 10, 1100)
    expect(s.co2Concentration).toBeCloseTo(2.0 / (0.0831 * 1100), 9)
  })

  it('starts with no CO2 and a pressure of zero when no solid has decomposed yet', () => {
    const none = caco3VesselState(0, 10, 1100)
    expect(none.pressureBar).toBe(0)
    expect(none.solidPresent).toBe(false)
  })

  it('rejects a negative amount of solid', () => {
    expect(() => caco3VesselState(-1, 10, 1100)).toThrow(RangeError)
  })
})
