import { describe, expect, it } from 'vitest'
import { RUNNING_VALUES, quantityText, snapshotForStep } from './factor-steps'

describe('UnitFactors steps', () => {
  it('converts 2.5 h to 150 min to 9000 s', () => {
    expect(RUNNING_VALUES).toEqual([2.5, 150, 9000])
    expect(quantityText(RUNNING_VALUES[2])).toBe('9000')
  })

  it('cancels hours before minutes', () => {
    expect(snapshotForStep(0).c1).toBe(0)
    expect(snapshotForStep(1).c1).toBe(1)
    expect(snapshotForStep(1).c2).toBe(0)
    expect(snapshotForStep(2).c2).toBe(1)
  })

  it('clamps out-of-range steps', () => {
    expect(snapshotForStep(-2).fin).toBe(0)
    expect(snapshotForStep(9).fin).toBe(1)
  })
})
