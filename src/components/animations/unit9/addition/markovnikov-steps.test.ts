import { describe, expect, it } from 'vitest'
import { MARKOVNIKOV_STEP_COUNT, markovnikovStep } from './markovnikov-steps'

describe('markovnikovStep', () => {
  it('has five steps that go from the first ionic stage to the peroxide route', () => {
    expect(MARKOVNIKOV_STEP_COUNT).toBe(5)
    expect(markovnikovStep(0).mode).toBe('ionic')
    expect(markovnikovStep(0).progress).toBeLessThan(1 / 3)
    expect(markovnikovStep(4).mode).toBe('radical')
    expect(markovnikovStep(4).step).toBe('peroxide')
  })

  it('shows the major carbocation, then the minor one as the comparison, then the product', () => {
    expect(markovnikovStep(1)).toMatchObject({ mode: 'ionic', branch: 'major' })
    expect(markovnikovStep(2)).toMatchObject({ mode: 'ionic', branch: 'minor' })
    expect(markovnikovStep(3)).toMatchObject({ mode: 'ionic', branch: 'major', progress: 1 })
  })

  it('clamps out-of-range and fractional steps', () => {
    expect(markovnikovStep(-3)).toEqual(markovnikovStep(0))
    expect(markovnikovStep(99)).toEqual(markovnikovStep(4))
    expect(markovnikovStep(1.4)).toEqual(markovnikovStep(1))
  })
})
