import { describe, expect, it } from 'vitest'
import {
  DEFAULT_ION_INDEX,
  DIAMAGNETIC_PUSH,
  ION_CHOICES,
  calculatedSeries,
  measuredSeries,
  momentSummary,
  readMoment,
} from './magnetic-moment-lab-model'

function indexOf(ion: string): number {
  return ION_CHOICES.findIndex((_, i) => readMoment(i).ion === ion)
}

describe('magnetic moment lab readings', () => {
  it('defaults to Cr³⁺: d³, three unpaired, μ = 3.87 BM, not in Table 4.7', () => {
    const r = readMoment(DEFAULT_ION_INDEX)
    expect(r.ion).toBe('Cr³⁺')
    expect(r.dCount).toBe(3)
    expect(r.unpaired).toBe(3)
    expect(r.muText).toBe('3.87')
    expect(r.measured).toBeNull()
    expect(r.measuredText).toBeNull()
    expect(r.configuration).toBe('[Ar] 3d³')
  })

  it('shows Ni²⁺ as the measured range and the spin-only value 2.83, never 2.84', () => {
    const r = readMoment(indexOf('Ni²⁺'))
    expect(r.unpaired).toBe(2)
    expect(r.muText).toBe('2.83')
    expect(r.measuredText).toBe('2.9–3.4')
    expect(r.measured).toEqual([2.9, 3.4])
  })

  it('reads Fe²⁺ as a range above its spin-only 4.90 BM', () => {
    const r = readMoment(indexOf('Fe²⁺'))
    expect(r.configuration).toBe('[Ar] 3d⁶')
    expect(r.unpaired).toBe(4)
    expect(r.muText).toBe('4.90')
    expect(r.measuredText).toBe('5.3–5.5')
  })

  it('treats Sc³⁺ and Zn²⁺ as diamagnetic with a faint push out', () => {
    for (const ion of ['Sc³⁺', 'Zn²⁺']) {
      const r = readMoment(indexOf(ion))
      expect(r.behaviour).toBe('diamagnetic')
      expect(r.unpaired).toBe(0)
      expect(r.pull).toBe(DIAMAGNETIC_PUSH)
      expect(r.pull).toBeLessThan(0)
    }
  })

  it('scales the pull with μ so that five unpaired electrons give the full pull of +1', () => {
    const r = readMoment(indexOf('Mn²⁺'))
    expect(r.unpaired).toBe(5)
    expect(r.pull).toBeCloseTo(1, 12)
    for (let i = 0; i < ION_CHOICES.length; i++) {
      const p = readMoment(i).pull
      expect(p).toBeGreaterThanOrEqual(-1)
      expect(p).toBeLessThanOrEqual(1)
    }
  })

  it('keeps the calculated series at the spin-only values for d¹ to d¹⁰', () => {
    const s = calculatedSeries()
    expect(s.map((p) => p.d)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
    expect(s.map((p) => p.mu.toFixed(2))).toEqual(['1.73', '2.83', '3.87', '4.90', '5.92', '4.90', '3.87', '2.83', '1.73', '0.00'])
  })

  it('lists measured values by d count with one ion per count', () => {
    const m = measuredSeries()
    const counts = m.map((p) => p.d)
    expect(new Set(counts).size).toBe(counts.length)
    expect(counts).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
  })

  it('writes a summary that never shows 2.84 and names the measured value', () => {
    const text = momentSummary(readMoment(indexOf('Ni²⁺')))
    expect(text).toContain('2.83')
    expect(text).not.toContain('2.84')
    expect(text).toContain('2.9–3.4')
    expect(momentSummary(readMoment(DEFAULT_ION_INDEX))).toContain('not listed in Table 4.7')
  })
})
