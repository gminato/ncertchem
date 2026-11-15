import { describe, expect, it } from 'vitest'
import {
  CO2_CONCENTRATION_AT_EQUILIBRIUM,
  HET_T,
  HET_V,
  hetSteps,
} from './heterogeneous-steps'
import { CACO3_KP_1100K } from '@/lib/chem/heterogeneous'

describe('heterogeneous Scrolly steps', () => {
  const steps = hetSteps()

  it('has five Steps: start, partway, equilibrium, scarce solid, and the other equilibria', () => {
    expect(steps.map((s) => s.kind)).toEqual(['vessels', 'vessels', 'vessels', 'vessels', 'cards'])
  })

  it('starts with no CO2 and no pressure in either vessel', () => {
    const first = steps[0]
    if (first.kind !== 'vessels') throw new Error('expected vessels')
    expect(first.a.pressureBar).toBe(0)
    expect(first.b.co2Moles).toBe(0)
    expect(first.a.solidRemaining).toBeCloseTo(0.5, 12)
    expect(first.b.solidRemaining).toBeCloseTo(2.0, 12)
  })

  it('reaches the same pressure, Kp = 2.00 bar, in both vessels at equilibrium', () => {
    const eq = steps[2]
    if (eq.kind !== 'vessels') throw new Error('expected vessels')
    expect(eq.a.pressureBar).toBeCloseTo(CACO3_KP_1100K, 9)
    expect(eq.b.pressureBar).toBeCloseTo(CACO3_KP_1100K, 9)
    expect(eq.a.co2Moles).toBeCloseTo(eq.b.co2Moles, 12)
    expect(eq.a.solidPresent && eq.b.solidPresent).toBe(true)
  })

  it('shows the pressure falling below Kp when the scarce vessel runs out of solid', () => {
    const scarce = steps[3]
    if (scarce.kind !== 'vessels') throw new Error('expected vessels')
    expect(scarce.a.solidPresent).toBe(false)
    expect(scarce.a.pressureBar).toBeCloseTo((0.1 * 0.0831 * HET_T) / HET_V, 9)
    expect(scarce.a.pressureBar).toBeLessThan(CACO3_KP_1100K)
    expect(scarce.b.pressureBar).toBeCloseTo(CACO3_KP_1100K, 9)
  })

  it('takes [CO2] = Kp/(RT) as the concentration in the modified constant', () => {
    expect(CO2_CONCENTRATION_AT_EQUILIBRIUM).toBeCloseTo(2 / (0.0831 * 1100), 12)
  })
})
