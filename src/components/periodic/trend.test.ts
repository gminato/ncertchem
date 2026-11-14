import { describe, it, expect } from 'vitest'
import { linearScale, niceTicks, placeCallouts, trendPathSegments } from './trend'
import type { TrendPoint } from './trend'
import { radiusToPx } from './atom-size'

describe('niceTicks', () => {
  it('covers the data with round steps', () => {
    const { ticks, lo, hi } = niceTicks(5.1, 21.7, 5)
    expect(lo).toBeLessThanOrEqual(5.1)
    expect(hi).toBeGreaterThanOrEqual(21.7)
    const step = ticks[1] - ticks[0]
    expect([1, 2, 2.5, 5, 10, 20, 25, 50]).toContain(Number(step.toFixed(6)))
  })

  it('produces evenly spaced ticks in ascending order', () => {
    const { ticks } = niceTicks(0, 1, 4)
    for (let i = 1; i < ticks.length; i++) {
      expect(ticks[i]).toBeGreaterThan(ticks[i - 1])
      expect(ticks[i] - ticks[i - 1]).toBeCloseTo(ticks[1] - ticks[0], 9)
    }
  })

  it('widens a flat range so there is still an axis', () => {
    const { lo, hi, ticks } = niceTicks(3, 3, 5)
    expect(hi).toBeGreaterThan(lo)
    expect(ticks.length).toBeGreaterThan(1)
  })

  it('falls back to a safe axis for non-finite input', () => {
    expect(niceTicks(Number.NaN, 1).lo).toBe(0)
  })
})

describe('linearScale', () => {
  it('maps the domain ends onto the range ends', () => {
    const s = linearScale([0, 10], [100, 0])
    expect(s(0)).toBe(100)
    expect(s(10)).toBe(0)
    expect(s(5)).toBe(50)
  })

  it('centres a degenerate domain', () => {
    expect(linearScale([4, 4], [0, 10])(4)).toBe(5)
  })
})

describe('trendPathSegments', () => {
  const xs = linearScale([0, 4], [0, 4])
  const ys = linearScale([0, 10], [10, 0])

  it('returns one segment for a complete series', () => {
    const points: TrendPoint[] = [
      { x: 1, y: 1, label: 'a' },
      { x: 2, y: 2, label: 'b' },
      { x: 3, y: 3, label: 'c' },
    ]
    const segments = trendPathSegments(points, xs, ys)
    expect(segments).toHaveLength(1)
    expect(segments[0]).toHaveLength(3)
  })

  it('breaks the line at a missing value instead of drawing to zero', () => {
    const points: TrendPoint[] = [
      { x: 1, y: 1, label: 'a' },
      { x: 2, y: null, label: 'b' },
      { x: 3, y: 3, label: 'c' },
    ]
    const segments = trendPathSegments(points, xs, ys)
    expect(segments).toHaveLength(2)
    expect(segments[0]).toHaveLength(1)
    expect(segments[1]).toHaveLength(1)
  })

  it('returns no segments for an empty series', () => {
    expect(trendPathSegments([], xs, ys)).toEqual([])
  })
})

describe('placeCallouts', () => {
  it('puts a lone label just above its point', () => {
    const [placed] = placeCallouts([{ x: 100, y: 200, text: 'Dip' }])
    expect(placed.labelX).toBe(100)
    expect(placed.labelY).toBeLessThan(200)
  })

  it('lifts a label that would overlap a neighbour', () => {
    const placed = placeCallouts([
      { x: 100, y: 200, text: 'First' },
      { x: 120, y: 200, text: 'Second' },
    ])
    const [a, b] = placed.sort((p, q) => p.x - q.x)
    expect(Math.abs(a.labelY - b.labelY)).toBeGreaterThanOrEqual(15)
  })

  it('leaves well separated labels where they are', () => {
    const placed = placeCallouts([
      { x: 50, y: 200, text: 'Left' },
      { x: 400, y: 200, text: 'Right' },
    ])
    expect(placed[0].labelY).toBe(placed[1].labelY)
  })
})

describe('radiusToPx', () => {
  it('scales linearly so the largest item reaches the maximum radius', () => {
    expect(radiusToPx(186, 186, 60)).toBe(60)
    expect(radiusToPx(93, 186, 60)).toBeCloseTo(30)
  })

  it('is monotone in the radius', () => {
    const values = [72, 102, 133, 140].map((pm) => radiusToPx(pm, 140, 60))
    for (let i = 1; i < values.length; i++) expect(values[i]).toBeGreaterThan(values[i - 1])
  })

  it('returns zero when there is no maximum to scale against', () => {
    expect(radiusToPx(10, 0, 60)).toBe(0)
  })
})
