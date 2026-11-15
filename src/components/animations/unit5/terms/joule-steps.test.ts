import { describe, expect, it } from 'vitest'
import { JOULE_STEP_COUNT, JOULE_WORK_J, formatSignedJoule, jouleLedgerForStep, jouleSnapshotForStep } from './joule-steps'

describe('Joule Scrolly targets (Section 5.1.4(a))', () => {
  it('has five Steps', () => {
    expect(JOULE_STEP_COUNT).toBe(5)
  })

  it('both thermometers start at state A and end at the same state B', () => {
    expect(jouleSnapshotForStep(0).leftLevel).toBe(jouleSnapshotForStep(0).rightLevel)
    expect(jouleSnapshotForStep(3).leftLevel).toBe(jouleSnapshotForStep(3).rightLevel)
    expect(jouleSnapshotForStep(3).leftLevel).toBeGreaterThan(jouleSnapshotForStep(0).leftLevel)
  })

  it('the paddle and the rod each do the same work, so ΔU = w_ad matches on both sides', () => {
    const at3 = jouleLedgerForStep(3)
    expect(at3.leftWJ).toBe(JOULE_WORK_J)
    expect(at3.rightWJ).toBe(JOULE_WORK_J)
    expect(at3.leftDeltaUJ).toBe(at3.rightDeltaUJ)
    expect(at3.leftDeltaUJ).toBe(JOULE_WORK_J)
  })

  it('an insulated gas that expands does negative work: w_ad = ΔU = −750 J, and it cools to state A', () => {
    const at4 = jouleLedgerForStep(4)
    expect(at4.leftWJ).toBe(-JOULE_WORK_J)
    expect(at4.leftDeltaUJ).toBe(-JOULE_WORK_J)
    expect(jouleSnapshotForStep(4).leftLevel).toBe(jouleSnapshotForStep(0).leftLevel)
  })

  it('the piston moves out at Step 4 and the arrow points away from the gas', () => {
    expect(jouleSnapshotForStep(4).pistonPos).toBeGreaterThan(jouleSnapshotForStep(3).pistonPos)
    expect(jouleSnapshotForStep(4).leftArrow).toBe(-1)
  })

  it('no work is recorded before the experiment starts', () => {
    expect(jouleLedgerForStep(0)).toEqual({ leftWJ: 0, leftDeltaUJ: 0, rightWJ: 0, rightDeltaUJ: 0 })
  })

  it('formats signed joules with the U+2212 minus sign', () => {
    expect(formatSignedJoule(750)).toBe('+750 J')
    expect(formatSignedJoule(-750)).toBe('−750 J')
    expect(formatSignedJoule(0)).toBe('0 J')
  })
})
