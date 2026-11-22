import { describe, expect, it } from 'vitest'
import { rateFromLaw } from '@/lib/chem/kinetics'
import {
  EXAMPLE_K,
  ORDER_SPECS,
  ORDER_STEPS,
  SAMPLE_CONCS,
  fmtRate,
  getOrderStepState,
  kValueRuns,
  rateAt,
  rateLawRuns,
  thumbnailPoints,
  unitRuns,
} from './order-steps'

const plain = (runs: readonly { text: string }[]) => runs.map((r) => r.text).join('')

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

  it('builds the units of k from the lib parts, with real superscripts and no caret notation', () => {
    expect(unitRuns(0)).toEqual([{ text: 'mol' }, { text: ' ' }, { text: 'L' }, { text: '⁻¹' }, { text: ' ' }, { text: 's' }, { text: '⁻¹' }])
    expect(plain(unitRuns(1))).toBe('s⁻¹')
    expect(plain(unitRuns(2))).toBe('mol⁻¹ L s⁻¹')
    expect(unitRuns(0.5)).toEqual([
      { text: 'mol' },
      { text: '1/2', sup: true },
      { text: ' ' },
      { text: 'L' },
      { text: '−1/2', sup: true },
      { text: ' ' },
      { text: 's' },
      { text: '⁻¹' },
    ])
    for (const spec of ORDER_SPECS) {
      expect(plain(spec.rateLaw)).not.toContain('^')
      expect(plain(unitRuns(spec.order))).not.toContain('^')
    }
  })

  it('writes the one-half rate law with a superscript 1/2 and the zero-order rate law with ⁰', () => {
    expect(rateLawRuns(0.5)).toEqual([{ text: 'Rate = k[A]' }, { text: '1/2', sup: true }])
    expect(plain(rateLawRuns(0))).toBe('Rate = k[A]⁰ = k')
  })

  it('gives the value of k with its units, matching the Step text', () => {
    expect(plain(kValueRuns(0))).toBe('k = 0.200 mol L⁻¹ s⁻¹')
    expect(plain(kValueRuns(0.5))).toBe('k = 0.200 mol1/2 L−1/2 s⁻¹')
    expect(plain(kValueRuns(1, 'slope = k = 0.200 '))).toBe('slope = k = 0.200 s⁻¹')
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
