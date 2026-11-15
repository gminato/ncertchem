import { describe, expect, it } from 'vitest'
import {
  HALF_STEPS,
  HALF_STEP_COUNT,
  getHalfStep,
} from './balance-half-steps'
import { isBalanced } from '@/lib/chem/redox-balance'

describe('balance-half-steps.ts', () => {
  it('defines exactly 7 steps following NCERT Section 7.3.2(b)', () => {
    expect(HALF_STEP_COUNT).toBe(7)
    expect(HALF_STEPS).toHaveLength(7)
  })

  it('clamps indices safely in getHalfStep', () => {
    expect(getHalfStep(-1).stepIndex).toBe(0)
    expect(getHalfStep(0).stepIndex).toBe(0)
    expect(getHalfStep(6).stepIndex).toBe(6)
    expect(getHalfStep(99).stepIndex).toBe(6)
  })

  it('Step 1 sets up the skeletal half-reactions', () => {
    const s0 = getHalfStep(0)
    expect(s0.stepNumber).toBe(1)
    expect(s0.isOverallBalanced).toBe(false)
    expect(s0.oxHalf.electrons).toBe(0)
    expect(s0.redHalf.electrons).toBe(0)
  })

  it('Step 4 balances atoms in basic medium with OH- and H2O', () => {
    const s3 = getHalfStep(3)
    // Check that atom tallies are all balanced in both halves
    for (const item of s3.oxHalf.tally) {
      if (item.item !== 'Charge') expect(item.balanced).toBe(true)
    }
    for (const item of s3.redHalf.tally) {
      if (item.item !== 'Charge') expect(item.balanced).toBe(true)
    }
    // But charge is not yet balanced
    const oxCharge = s3.oxHalf.tally.find((t) => t.item === 'Charge')
    expect(oxCharge?.balanced).toBe(false)
  })

  it('Step 5 balances charges with electrons (3 e- in ox, 2 e- in red)', () => {
    const s4 = getHalfStep(4)
    expect(s4.oxHalf.electrons).toBe(3)
    expect(s4.redHalf.electrons).toBe(2)
    const oxCharge = s4.oxHalf.tally.find((t) => t.item === 'Charge')
    const redCharge = s4.redHalf.tally.find((t) => t.item === 'Charge')
    expect(oxCharge?.balanced).toBe(true)
    expect(redCharge?.balanced).toBe(true)
  })

  it('Step 6 and 7 provide the balanced net ionic equation', () => {
    const s5 = getHalfStep(5)
    expect(s5.overallEquationMhchem).toBeDefined()
    expect(s5.isOverallBalanced).toBe(true)

    const s6 = getHalfStep(6)
    expect(s6.overallEquationMhchem).toBeDefined()
    expect(s6.isOverallBalanced).toBe(true)

    const netEq = s6.overallEquationMhchem!
    const verify = isBalanced(netEq)
    expect(verify.balanced).toBe(true)
  })
})
