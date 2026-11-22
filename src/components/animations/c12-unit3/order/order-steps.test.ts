import { describe, expect, it } from 'vitest'
import { rateFromLaw } from '@/lib/chem/kinetics'
import {
  EXAMPLE_K,
  ORDER_STEPS,
  SAMPLE_CONCS,
  fmtRate,
  getOrderStepState,
  rateAt,
  thumbnailPoints,
  unitsOf,
} from './order-steps'

describe('order-curves step targets', () => {
  it('has five steps, the last one being the units decoder', () => {
    expect(ORDER_STEPS).toHaveLength(5)
    expect(ORDER_STEPS[4].decoder).toBe(true)
    expect(ORDER_STEPS.slice(0, 4).every((s) => !s.decoder)).toBe(true)
  })

  it('computes the sample rates from the lib (zero, first, second, one-half)', () => {
    expect(SAMPLE_CONCS.map((a) => fmtRate(rateAt(0, a)))).toEqual(['0.200', '0.200', '0.200'])
    expect(SAMPLE_CONCS.map((a) => fmtRate(rateAt(1, a)))).toEqual(['0.0500', '0.100', '0.200'])
    expect(SAMPLE_CONCS.map((a) => fmtRate(rateAt(2, a)))).toEqual(['0.0125', '0.0500', '0.200'])
    expect(SAMPLE_CONCS.map((a) => fmtRate(rateAt(0.5, a)))).toEqual(['0.100', '0.141', '0.200'])
  })

  it('makes every curve meet at (1, k) because k is the rate at [A] = 1 mol L⁻¹', () => {
    for (const order of [0, 1, 2, 0.5]) {
      expect(rateAt(order, 1)).toBeCloseTo(EXAMPLE_K, 12)
      expect(rateAt(order, 1)).toBe(rateFromLaw(EXAMPLE_K, { A: 1 }, { A: order }))
    }
  })

  it('reads the units of k from the lib for each order', () => {
    expect(unitsOf(0)).toBe('mol L⁻¹ s⁻¹')
    expect(unitsOf(1)).toBe('s⁻¹')
    expect(unitsOf(2)).toBe('mol⁻¹ L s⁻¹')
    expect(unitsOf(0.5)).toBe('mol^(1/2) L^(−1/2) s⁻¹')
  })

  it('shows the active curve at full strength and earlier ones faded', () => {
    expect(getOrderStepState(0).curves).toEqual({ zero: 'active', first: 'hidden', second: 'hidden', half: 'hidden' })
    expect(getOrderStepState(2).curves).toEqual({ zero: 'faded', first: 'faded', second: 'active', half: 'hidden' })
    expect(getOrderStepState(3).curves.half).toBe('active')
  })

  it('clamps out-of-range step indexes', () => {
    expect(getOrderStepState(-3).index).toBe(0)
    expect(getOrderStepState(99).index).toBe(4)
  })

  it('samples thumbnails from [A] = 0 to 1 with the same rates', () => {
    const pts = thumbnailPoints(2, 4)
    expect(pts).toHaveLength(5)
    expect(pts[0]).toEqual([0, 0])
    expect(pts[4][0]).toBe(1)
    expect(pts[4][1]).toBeCloseTo(EXAMPLE_K, 12)
  })
})
