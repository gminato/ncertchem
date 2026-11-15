import { describe, expect, it } from 'vitest'
import { R_J_PER_MOL_K } from '@/lib/chem/pv-work'
import { AB_DELTA_G0_KJ, AB_TEMPERATURE_K, abK, equilibriumExtent, gibbsAt, gibbsCurve, gqSteps } from './gq-steps'

describe('Gibbs energy Steps for the A ⇌ B model', () => {
  const k = abK()
  const steps = gqSteps()

  it('derives K from ΔG° = −RT ln K at 298 K', () => {
    expect(Math.log(k)).toBeCloseTo((-AB_DELTA_G0_KJ * 1000) / (R_J_PER_MOL_K * AB_TEMPERATURE_K), 9)
  })

  it('finds the equilibrium extent with the library, equal to K/(1 + K) for A ⇌ B', () => {
    expect(equilibriumExtent()).toBeCloseTo(k / (1 + k), 9)
  })

  it('gives ΔG negative below K, equal to ΔG° at Q = 1, zero at equilibrium and positive above K', () => {
    expect(steps[0].deltaG).toBeLessThan(0)
    expect(steps[1].Q).toBeCloseTo(1, 12)
    expect(steps[1].deltaG).toBeCloseTo(AB_DELTA_G0_KJ, 9)
    expect(Math.abs(steps[2].deltaG)).toBeLessThan(1e-6)
    expect(steps[3].deltaG).toBeGreaterThan(0)
  })

  it('names the direction of each Step from Q against K', () => {
    expect(steps.map((s) => s.direction)).toEqual(['forward', 'forward', 'at equilibrium', 'reverse'])
  })

  it('has its minimum at the equilibrium extent, where the slope ΔG is zero', () => {
    const curve = gibbsCurve(2000)
    const lowest = curve.reduce((a, b) => (b.G < a.G ? b : a))
    expect(Math.abs(lowest.xi - equilibriumExtent())).toBeLessThan(0.002)
    expect(lowest.G).toBeLessThan(AB_DELTA_G0_KJ)
    expect(gibbsAt(0)).toBeCloseTo(0, 12)
  })
})
