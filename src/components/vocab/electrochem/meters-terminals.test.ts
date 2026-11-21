import { describe, expect, it } from 'vitest'
import { meterTerminals } from './Meters'

describe('meterTerminals', () => {
  it('puts + on the left by default and on the right when asked', () => {
    const left = meterTerminals(300, 100, 140)
    const right = meterTerminals(300, 100, 140, 'right')
    expect(left.plus.x).toBeLessThan(left.minus.x)
    expect(right.plus.x).toBeGreaterThan(right.minus.x)
    expect(right.plus).toEqual(left.minus)
  })
})
