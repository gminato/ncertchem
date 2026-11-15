import { describe, expect, it } from 'vitest'
import {
  TRANSFER_STEPS,
  TRANSFER_STEP_COUNT,
  transferStep,
} from './transfer-steps'

describe('transfer-steps', () => {
  it('contains exactly 5 steps covering electron transfer, half-reactions, and agent definitions', () => {
    expect(TRANSFER_STEP_COUNT).toBe(5)
    expect(TRANSFER_STEPS).toHaveLength(5)
  })

  it('bounds steps within [0, 4]', () => {
    expect(transferStep(-2).index).toBe(0)
    expect(transferStep(99).index).toBe(4)
    expect(transferStep(2.8).index).toBe(3)
  })

  it('provides verified progress values for animation tweening', () => {
    expect(transferStep(0).progress).toBe(0)
    expect(transferStep(1).progress).toBe(0.5)
    expect(transferStep(2).progress).toBe(1.0)
    expect(transferStep(3).progress).toBe(1.0)
    expect(transferStep(4).progress).toBe(1.0)
  })

  it('contains valid mhchem equations for half-reactions in step 3', () => {
    const s3 = transferStep(3)
    expect(s3.oxHalfMhchem).toContain('\\ce{2Na(s) -> 2Na+ + 2e-}')
    expect(s3.redHalfMhchem).toContain('\\ce{Cl2(g) + 2e- -> 2Cl-}')
    expect(s3.overallMhchem).toContain('\\ce{2Na(s) + Cl2(g) -> 2NaCl(s)}')
  })

  it('clearly assigns oxidant and reductant roles in step 4', () => {
    const s4 = transferStep(4)
    expect(s4.oxRole).toContain('Reducing Agent')
    expect(s4.redRole).toContain('Oxidising Agent')
  })
})
