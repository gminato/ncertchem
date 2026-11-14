import { describe, expect, it } from 'vitest'
import { elementMassRatio, sideMass } from './combination'

describe('sideMass (law of conservation of mass)', () => {
  it('2H2 + O2 and 2H2O both weigh 36.03 g', () => {
    const left = sideMass([
      { formula: 'H2', coeff: 2 },
      { formula: 'O2', coeff: 1 },
    ])
    const right = sideMass([{ formula: 'H2O', coeff: 2 }])
    expect(left.toFixed(2)).toBe('36.03')
    expect(right.toFixed(2)).toBe('36.03')
    expect(Math.abs(left - right)).toBeLessThan(1e-9)
  })

  it('rejects a zero or fractional coefficient', () => {
    expect(() => sideMass([{ formula: 'H2', coeff: 0 }])).toThrow(RangeError)
    expect(() => sideMass([{ formula: 'H2', coeff: 1.5 }])).toThrow(RangeError)
  })
})

describe('elementMassRatio (law of multiple proportions)', () => {
  it('H2O and H2O2 combine 16 g and 32 g of O with the same H: a ratio of 1 : 2', () => {
    const inWater = elementMassRatio('H2O', 'O', 'H')
    const inPeroxide = elementMassRatio('H2O2', 'O', 'H')
    expect(inWater).toBeCloseTo(16.0 / 2.016, 3)
    expect(inPeroxide / inWater).toBeCloseTo(2, 10)
  })

  it('throws when the element is not in the formula', () => {
    expect(() => elementMassRatio('H2O', 'C', 'H')).toThrow(RangeError)
  })
})
