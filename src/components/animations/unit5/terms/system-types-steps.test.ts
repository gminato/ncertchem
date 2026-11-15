import { describe, expect, it } from 'vitest'
import { SYSTEM_TYPES_STEP_COUNT, systemTypeForStep } from './system-types-steps'

describe('system-types Scrolly targets (Section 5.1.2)', () => {
  it('has four Steps', () => {
    expect(SYSTEM_TYPES_STEP_COUNT).toBe(4)
  })

  it('lets matter cross only an open boundary', () => {
    for (let i = 0; i < SYSTEM_TYPES_STEP_COUNT; i++) {
      const t = systemTypeForStep(i)
      if (t.matter !== 'none') expect(t.kind).toBe('open')
    }
    expect(systemTypeForStep(1).matter).toBe('both')
  })

  it('lets energy cross an open or closed boundary, and never an isolated one', () => {
    expect(systemTypeForStep(3)).toMatchObject({ kind: 'isolated', heat: 'none', work: 'none', matter: 'none' })
    expect(systemTypeForStep(2)).toMatchObject({ kind: 'closed', matter: 'none', heat: 'out', work: 'in' })
  })

  it('clamps out-of-range Steps', () => {
    expect(systemTypeForStep(-3).kind).toBe('closed')
    expect(systemTypeForStep(99).kind).toBe('isolated')
    expect(systemTypeForStep(Number.NaN).kind).toBe('closed')
  })
})
