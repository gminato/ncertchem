import { describe, expect, it } from 'vitest'
import { NOCL_K } from './example'
import { iceExample } from './ice-steps'
import { qkSteps } from './qk-steps'

describe('Q and K Steps', () => {
  const steps = qkSteps()

  it('shows Q below K, Q above K and Q equal to K, in that order', () => {
    expect(steps.map((s) => s.kind)).toEqual(['below', 'above', 'equal'])
    expect(steps.map((s) => s.direction)).toEqual(['forward', 'reverse', 'at equilibrium'])
  })

  it('computes Q from the mixtures with the library: 0.04, 72 and K itself', () => {
    expect(steps[0].Q).toBeCloseTo(0.04, 9)
    expect(steps[1].Q).toBeCloseTo(72, 9)
    expect(steps[2].Q).toBeCloseTo(NOCL_K, 9)
    expect(steps[0].Q).toBeLessThan(NOCL_K)
    expect(steps[1].Q).toBeGreaterThan(NOCL_K)
  })

  it('makes the equilibrium mixture the ICE solution', () => {
    const eq = iceExample().equilibrium
    expect(steps[2].mixture).toEqual(eq)
  })

  it('sizes the vessel counts in proportion to the concentrations', () => {
    expect(steps[0].counts).toEqual([5, 5, 1])
    expect(steps[1].counts).toEqual([3, 3, 15])
    expect(steps[2].counts).toEqual([5, 3, 5])
  })
})
