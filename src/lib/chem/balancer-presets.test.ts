import { describe, expect, it } from 'vitest'
import {
  BALANCER_PRESETS,
  getPresetBalanceResult,
  computeReactionTally,
  getSimStepDetails,
} from './balancer-presets'

describe('balancer-presets.ts', () => {
  it('contains at least 8 presets across acidic and basic media', () => {
    expect(BALANCER_PRESETS.length).toBeGreaterThanOrEqual(8)
    const acidicCount = BALANCER_PRESETS.filter((p) => p.medium === 'acidic').length
    const basicCount = BALANCER_PRESETS.filter((p) => p.medium === 'basic').length
    expect(acidicCount).toBeGreaterThanOrEqual(4)
    expect(basicCount).toBeGreaterThanOrEqual(4)
  })

  it('none of the presets duplicate NCERT Problems 7.8, 7.9 or 7.10', () => {
    for (const preset of BALANCER_PRESETS) {
      expect(preset.skeleton).not.toBe('Cr2O72- + SO32- -> Cr3+ + SO42-')
      expect(preset.skeleton).not.toBe('MnO4- + Br- -> MnO2 + BrO3-')
      expect(preset.skeleton).not.toBe('MnO4- + I- -> MnO2 + I2')
    }
  })

  it('every preset successfully balances with both half-reaction and oxidation-number methods', () => {
    for (const preset of BALANCER_PRESETS) {
      const hr = getPresetBalanceResult(preset, 'half-reaction')
      expect(hr.isBalanced).toBe(true)
      expect(hr.steps.length).toBe(7)

      const on = getPresetBalanceResult(preset, 'oxidation-number')
      expect(on.isBalanced).toBe(true)
      expect(on.steps.length).toBe(5)
    }
  })

  it('computeReactionTally computes atoms and charges even with electrons', () => {
    const tally = computeReactionTally('Cr(OH)3 + 5OH- -> CrO42- + 4H2O + 3e-')
    const cr = tally.find((t) => t.item === 'Cr')
    const charge = tally.find((t) => t.item === 'Charge')
    expect(cr?.balanced).toBe(true)
    expect(charge?.left).toBe(-5)
    expect(charge?.right).toBe(-5)
    expect(charge?.balanced).toBe(true)
  })

  it('getSimStepDetails generates valid simulation states and challenges', () => {
    const preset = BALANCER_PRESETS[0] // permanganate-oxalate
    const step4 = getSimStepDetails(preset, 'half-reaction', 4)
    expect(step4.oxHalf).toBeDefined()
    expect(step4.redHalf).toBeDefined()
    expect(step4.challenge).toBeDefined()
    expect(step4.challenge?.targetAnswer).toBeGreaterThan(0)
  })
})
