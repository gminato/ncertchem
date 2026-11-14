import { describe, expect, it } from 'vitest'
import {
  MASS_BALANCE_PRODUCTS,
  MASS_BALANCE_REACTANTS,
  MASS_BALANCE_STEP_COUNT,
  atomTotals,
  massChangeReadout,
  massReadout,
  snapshotForStep,
  stepDescription,
} from './mass-balance-steps'

describe('MassBalance steps', () => {
  it('has four Steps and clamps out-of-range indices', () => {
    expect(MASS_BALANCE_STEP_COUNT).toBe(4)
    expect(snapshotForStep(-3)).toEqual(snapshotForStep(0))
    expect(snapshotForStep(99)).toEqual(snapshotForStep(3))
  })

  it('runs the reaction only from Step 1 onward, and shows the readout from Step 2', () => {
    expect(snapshotForStep(0).progress).toBe(0)
    expect(snapshotForStep(1).progress).toBe(1)
    expect(snapshotForStep(0).readout).toBe(0)
    expect(snapshotForStep(1).readout).toBe(0)
    expect(snapshotForStep(2).readout).toBe(1)
  })

  it('shows the atom tally only on the last Step', () => {
    expect(snapshotForStep(2).tally).toBe(0)
    expect(snapshotForStep(3).tally).toBe(1)
  })
})

describe('mass balance numbers', () => {
  it('reactants and products both weigh 36.03 g', () => {
    expect(massReadout()).toBe('36.03')
    expect(massChangeReadout()).toBe('0.00')
  })

  it('atom totals are conserved: 4 H and 2 O on each side', () => {
    expect(atomTotals(MASS_BALANCE_REACTANTS)).toEqual({ H: 4, O: 2 })
    expect(atomTotals(MASS_BALANCE_PRODUCTS)).toEqual({ H: 4, O: 2 })
  })

  it('describes each Step with the computed masses', () => {
    expect(stepDescription(0)).toContain('36.03')
    expect(stepDescription(2)).toContain('0.00')
  })
})
