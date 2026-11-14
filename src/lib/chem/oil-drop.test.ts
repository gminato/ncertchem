import { describe, it, expect } from 'vitest'
import {
  GRAVITY,
  balancingField,
  balancingVoltage,
  dropCharge,
  dropWeight,
  histogram,
  simulatedDropCharges,
} from './oil-drop'
import { ELEMENTARY_CHARGE_C } from './constants'

describe('dropCharge', () => {
  it('gives whole multiples of the elementary charge', () => {
    expect(dropCharge(1)).toBe(ELEMENTARY_CHARGE_C)
    expect(dropCharge(3)).toBeCloseTo(3 * ELEMENTARY_CHARGE_C, 30)
  })

  it('rejects fractional numbers of charges', () => {
    expect(() => dropCharge(1.5)).toThrow(RangeError)
  })
})

describe('balancing a drop', () => {
  const mass = 3.0e-15

  it('weighs m g', () => {
    expect(dropWeight(mass)).toBeCloseTo(mass * GRAVITY, 25)
  })

  it('needs E = mg / (ne): the balancing field falls as the charge count rises', () => {
    expect(balancingField(mass, 1)).toBeGreaterThan(balancingField(mass, 3))
    expect(balancingField(mass, 3) * dropCharge(3)).toBeCloseTo(dropWeight(mass), 25)
  })

  it('gives a plausible plate voltage for a 1 cm gap (a few hundred volts)', () => {
    const v = balancingVoltage(mass, 3, 0.01)
    expect(v).toBeGreaterThan(500)
    expect(v).toBeLessThan(700)
  })
});

describe('simulatedDropCharges', () => {
  const values = simulatedDropCharges()

  it('is deterministic', () => {
    expect(simulatedDropCharges()).toEqual(values)
  })

  it('places every measurement within 0.5 % of a whole multiple of e', () => {
    for (const v of values) {
      const n = Math.round(v)
      expect(n).toBeGreaterThanOrEqual(1)
      expect(Math.abs(v / n - 1)).toBeLessThanOrEqual(0.004 + 1e-12)
    }
  })

  it('has peaks at 1, 2, 3, 4 and 5 in the histogram of charges', () => {
    const bins = histogram(values, 0.1, 6)
    const countNear = (n: number) =>
      bins
        .filter((b) => Math.abs(b.start - (n - 0.1)) < 1e-9 || Math.abs(b.start - n) < 1e-9)
        .reduce((sum, b) => sum + b.count, 0)
    for (const n of [1, 2, 3, 4, 5]) {
      expect(countNear(n)).toBeGreaterThan(0)
    }
    // Nothing falls between the peaks: the bin around 1.5 is empty.
    const between = bins.find((b) => Math.abs(b.start - 1.5) < 1e-9)
    expect(between?.count).toBe(0)
  })
})

describe('histogram', () => {
  it('counts values into bins and ignores values outside the range', () => {
    const bins = histogram([0.05, 0.07, 1.02, 9], 0.5, 2)
    expect(bins.map((b) => b.count)).toEqual([2, 0, 1, 0])
  })

  it('rejects a non-positive bin width', () => {
    expect(() => histogram([1], 0, 2)).toThrow(RangeError)
  })
})
