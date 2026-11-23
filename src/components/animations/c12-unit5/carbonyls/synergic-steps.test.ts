import { describe, expect, it } from 'vitest'
import { SYNERGIC_STEPS, SYNERGIC_STEP_COUNT, synergicStepState } from './synergic-steps'

describe('carbonyl-synergic-bonding Scrolly data (Class 12 Unit 5 Section 5.6)', () => {
  it('defines four distinct steps and clamps out-of-range indices', () => {
    expect(SYNERGIC_STEP_COUNT).toBe(4)
    expect(SYNERGIC_STEPS).toHaveLength(4)
    expect(synergicStepState(-1).kind).toBe('parts')
    expect(synergicStepState(0).kind).toBe('parts')
    expect(synergicStepState(1).kind).toBe('sigma')
    expect(synergicStepState(2).kind).toBe('pi')
    expect(synergicStepState(3).kind).toBe('synergy')
    expect(synergicStepState(10).kind).toBe('synergy')
  })

  it('progresses from unbonded parts through sigma, pi back donation, and synergic reinforcement', () => {
    const [parts, sigma, pi, synergy] = SYNERGIC_STEPS

    expect(parts.showSigmaArrow).toBe(false)
    expect(parts.showPiArrows).toBe(false)
    expect(parts.vacantMetalFilled).toBe(false)
    expect(parts.piStarFilled).toBe(false)
    expect(parts.mcBondStrength).toBe('none')

    expect(sigma.showSigmaArrow).toBe(true)
    expect(sigma.showPiArrows).toBe(false)
    expect(sigma.vacantMetalFilled).toBe(true)
    expect(sigma.metalNegativeTint).toBe(true)
    expect(sigma.mcBondStrength).toBe('single')

    expect(pi.showSigmaArrow).toBe(false)
    expect(pi.showPiArrows).toBe(true)
    expect(pi.piStarFilled).toBe(true)
    expect(pi.metalNegativeTint).toBe(false)

    expect(synergy.showSigmaArrow).toBe(true)
    expect(synergy.showPiArrows).toBe(true)
    expect(synergy.mcBondStrength).toBe('synergic')
  })
})
