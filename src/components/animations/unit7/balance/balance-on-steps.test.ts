import { describe, expect, it } from 'vitest'
import {
  ON_STEPS,
  ON_STEP_COUNT,
  getONStep,
  ON_SKELETON,
  ON_MEDIUM,
} from './balance-on-steps'
import { isBalanced } from '@/lib/chem/redox-balance'

describe('balance-on-steps.ts', () => {
  it('defines exactly 5 steps following NCERT Section 7.3.2(a)', () => {
    expect(ON_STEP_COUNT).toBe(5)
    expect(ON_STEPS).toHaveLength(5)
  })

  it('clamps indices safely in getONStep', () => {
    expect(getONStep(-1).stepIndex).toBe(0)
    expect(getONStep(0).stepIndex).toBe(0)
    expect(getONStep(4).stepIndex).toBe(4)
    expect(getONStep(99).stepIndex).toBe(4)
  })

  it('Step 1 sets up the unbalanced skeleton', () => {
    const s0 = getONStep(0)
    expect(s0.stepNumber).toBe(1)
    expect(s0.isFullyBalanced).toBe(false)
    expect(s0.reactants).toHaveLength(2)
    expect(s0.products).toHaveLength(2)
  })

  it('Step 2 assigns oxidation numbers correctly', () => {
    const s1 = getONStep(1)
    expect(s1.onChanges.reduced.element).toBe('Mn')
    expect(s1.onChanges.reduced.from).toBe(7)
    expect(s1.onChanges.reduced.to).toBe(2)
    expect(s1.onChanges.reduced.perAtomChange).toBe(-5)

    expect(s1.onChanges.oxidised.element).toBe('C')
    expect(s1.onChanges.oxidised.from).toBe(3)
    expect(s1.onChanges.oxidised.to).toBe(4)
    expect(s1.onChanges.oxidised.perAtomChange).toBe(1)
    expect(s1.onChanges.oxidised.perUnitChange).toBe(2)
  })

  it('Step 3 equalises oxidation number changes using LCM 10', () => {
    const s2 = getONStep(2)
    expect(s2.onChanges.lcm).toBe(10)
    expect(s2.onChanges.reduced.multiplier).toBe(2)
    expect(s2.onChanges.oxidised.multiplier).toBe(5)
    // Mn and C should now be balanced
    const mnTally = s2.atomTally.find((t) => t.item === 'Mn')
    const cTally = s2.atomTally.find((t) => t.item === 'C')
    expect(mnTally?.balanced).toBe(true)
    expect(cTally?.balanced).toBe(true)
  })

  it('Step 4 balances net ionic charge with 16 H+', () => {
    const s3 = getONStep(3)
    expect(s3.chargeBalance.balanced).toBe(true)
    expect(s3.chargeBalance.leftCharge).toBe(4)
    expect(s3.chargeBalance.rightCharge).toBe(4)
    expect(s3.chargeBalance.hAdded).toBe(16)
  })

  it('Step 5 achieves full mass and charge balance with 8 H2O', () => {
    const s4 = getONStep(4)
    expect(s4.isFullyBalanced).toBe(true)
    for (const item of s4.atomTally) {
      expect(item.balanced).toBe(true)
      expect(item.left).toBe(item.right)
    }

    // Verify through the chem lib isBalanced
    const verify = isBalanced(
      '2MnO4- + 5C2O42- + 16H+ -> 2Mn2+ + 10CO2 + 8H2O'
    )
    expect(verify.balanced).toBe(true)
  })
})
