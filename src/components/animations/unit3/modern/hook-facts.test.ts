import { describe, expect, it } from 'vitest'
import { elementBySymbol } from '@/lib/chem/periodic-data'

describe('facts quoted in the Section 3.3 Hook', () => {
  it('gives iodine 126.9 u and tellurium 127.6 u, with tellurium before iodine', () => {
    const te = elementBySymbol('Te')
    const i = elementBySymbol('I')
    expect(te?.Z).toBe(52)
    expect(i?.Z).toBe(53)
    expect(i!.atomicMass.toFixed(1)).toBe('126.9')
    expect(te!.atomicMass.toFixed(1)).toBe('127.6')
    expect(te!.atomicMass).toBeGreaterThan(i!.atomicMass)
  })
})
