import { describe, it, expect } from 'vitest'
import { linearScale, niceTicks, placeCallouts, trendPathSegments } from './trend'
import type { PixelPoint, TrendPoint } from './trend'
import { radiusToPx } from './atom-size'

const BOUNDS = { left: 0, right: 600, top: 0, bottom: 300 }

/** Whether a label box touches any sampled point of the series. */
function boxHitsSeries(box: { x0: number; x1: number; y0: number; y1: number }, series: PixelPoint[][]): boolean {
  for (const seg of series) {
    for (let i = 0; i + 1 < seg.length; i++) {
      for (let s = 0; s <= 20; s++) {
        const t = s / 20
        const x = seg[i].x + (seg[i + 1].x - seg[i].x) * t
        const y = seg[i].y + (seg[i + 1].y - seg[i].y) * t
        if (x >= box.x0 && x <= box.x1 && y >= box.y0 && y <= box.y1) return true
      }
    }
  }
  return false
}

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
  // A V-shaped series: the dip at the middle is where the callout should go.
  const series: PixelPoint[][] = [
    [
      { x: 100, y: 100 },
      { x: 300, y: 220 },
      { x: 500, y: 100 },
    ],
  ]

  it('keeps every label box clear of the series', () => {
    const placed = placeCallouts(
      [{ x: 300, y: 220, text: 'B dips: the 2p electron is shielded' }],
      series,
      BOUNDS
    )
    expect(placed).toHaveLength(1)
    expect(boxHitsSeries(placed[0].box, series)).toBe(false)
  })

  it('puts the label on the side that is clear and records which side', () => {
    const [placed] = placeCallouts([{ x: 300, y: 220, text: 'Dip' }], series, BOUNDS)
    expect(placed.side === 'above' || placed.side === 'below').toBe(true)
    if (placed.side === 'above') expect(placed.labelY).toBeLessThan(220)
    else expect(placed.labelY).toBeGreaterThan(220)
  })

  it('keeps two labels from overlapping each other', () => {
    const placed = placeCallouts(
      [
        { x: 200, y: 160, text: 'First label here' },
        { x: 230, y: 160, text: 'Second label here' },
      ],
      [],
      BOUNDS
    )
    const [a, b] = placed
    const overlap = a.box.x0 < b.box.x1 && b.box.x0 < a.box.x1 && a.box.y0 < b.box.y1 && b.box.y0 < a.box.y1
    expect(overlap).toBe(false)
  })

  it('returns a result for every input, even when nothing is clear', () => {
    const crowded = placeCallouts([{ x: 50, y: 150, text: 'X' }], [[{ x: 0, y: 0 }, { x: 600, y: 300 }]], {
      left: 0,
      right: 100,
      top: 0,
      bottom: 100,
    })
    expect(crowded).toHaveLength(1)
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
