import { describe, expect, it } from 'vitest'
import {
  HALF_BASIC_ROUTE,
  HALF_STEPS,
  HALF_STEP_COUNT,
  getHalfStep,
} from './balance-half-steps'
import { balanceRedox, isBalanced } from '@/lib/chem/redox-balance'
import { parseEquation } from './balance-equation'

function termSignature(eq: string): string[] {
  return parseEquation(eq).flatMap((row) => [
    ...row.reactants.map((t) => `L:${t.coefficient}${t.formula}`),
    ...row.products.map((t) => `R:${t.coefficient}${t.formula}`),
  ]).sort()
}

const LIB_OVERALL = balanceRedox('Cr(OH)3 + ClO- -> CrO4^2- + Cl-', 'basic').equationMhchem

describe('balance-half-steps.ts', () => {
  it('defines exactly 7 steps following NCERT Section 7.3.2(b)', () => {
    expect(HALF_STEP_COUNT).toBe(7)
    expect(HALF_STEPS).toHaveLength(7)
  })

  it('clamps indices safely in getHalfStep', () => {
    expect(getHalfStep(-1).stepIndex).toBe(0)
    expect(getHalfStep(99).stepIndex).toBe(6)
  })

  it('Step 4 balances atoms in basic medium but not yet the charge', () => {
    const s3 = getHalfStep(3)
    for (const item of [...s3.oxHalf.tally, ...s3.redHalf.tally]) {
      if (item.item !== 'Charge') expect(item.balanced).toBe(true)
    }
    expect(s3.oxHalf.tally.find((t) => t.item === 'Charge')?.balanced).toBe(false)
  })

  it('Step 5 balances charges with electrons (3 e- in ox, 2 e- in red)', () => {
    const s4 = getHalfStep(4)
    expect(s4.oxHalf.electrons).toBe(3)
    expect(s4.redHalf.electrons).toBe(2)
    expect(s4.oxHalf.tally.find((t) => t.item === 'Charge')?.balanced).toBe(true)
    expect(s4.redHalf.tally.find((t) => t.item === 'Charge')?.balanced).toBe(true)
  })

  it('the overall equation of steps 6 and 7 is the lib result, and is balanced', () => {
    expect(getHalfStep(5).overallEquationMhchem).toBe(LIB_OVERALL)
    expect(getHalfStep(6).overallEquationMhchem).toBe(LIB_OVERALL)
    expect(isBalanced(LIB_OVERALL).balanced).toBe(true)
  })

  it('the NCERT basic route stages are each balanced, and the last stage is the Step 5 half-reaction', () => {
    for (const group of HALF_BASIC_ROUTE) {
      for (const stage of group.stages) {
        expect(isBalanced(stage.equationMhchem).balanced).toBe(true)
      }
    }
    const ox = HALF_BASIC_ROUTE.find((g) => g.key === 'ox')!
    const red = HALF_BASIC_ROUTE.find((g) => g.key === 'red')!
    expect(ox.stages[ox.stages.length - 1].equationMhchem).toBe(getHalfStep(4).oxHalf.equationMhchem)
    expect(red.stages[red.stages.length - 1].equationMhchem).toBe(getHalfStep(4).redHalf.equationMhchem)
  })

  it('the overall equations match the lib result term for term', () => {
    expect(termSignature(getHalfStep(6).overallEquationMhchem ?? '')).toEqual(termSignature(LIB_OVERALL))
  })
})
