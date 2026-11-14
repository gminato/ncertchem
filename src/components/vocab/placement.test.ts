import { describe, it, expect } from 'vitest'
import { orbitLabelPosition, ladderLabels } from './placement'

describe('orbitLabelPosition', () => {
  it('places the label centre at radius r + offset along the angle', () => {
    const p = orbitLabelPosition(0, 0, 30, 0, 10)
    expect(p.x).toBeCloseTo(40, 6)
    expect(p.y).toBeCloseTo(0, 6)

    const q = orbitLabelPosition(10, 20, 30, -90, 8)
    expect(q.x).toBeCloseTo(10, 6)
    expect(q.y).toBeCloseTo(20 - 38, 6)
  })

  it('always lands outside the circle, for any angle', () => {
    for (let angle = -180; angle <= 180; angle += 15) {
      const p = orbitLabelPosition(5, -5, 40, angle, 9)
      const dist = Math.hypot(p.x - 5, p.y + 5)
      expect(dist).toBeCloseTo(49, 6)
      expect(dist).toBeGreaterThan(40)
    }
  })

  it('anchors labels away from the orbit on the left, right and centre', () => {
    expect(orbitLabelPosition(0, 0, 10, 0, 5).textAnchor).toBe('start')
    expect(orbitLabelPosition(0, 0, 10, -45, 5).textAnchor).toBe('start')
    expect(orbitLabelPosition(0, 0, 10, 180, 5).textAnchor).toBe('end')
    expect(orbitLabelPosition(0, 0, 10, 135, 5).textAnchor).toBe('end')
    expect(orbitLabelPosition(0, 0, 10, -90, 5).textAnchor).toBe('middle')
    expect(orbitLabelPosition(0, 0, 10, 90, 5).textAnchor).toBe('middle')
  })
})

describe('ladderLabels', () => {
  function minSeparation(ys: number[]): number {
    const sorted = [...ys].sort((a, b) => a - b)
    let min = Infinity
    for (let i = 0; i < sorted.length - 1; i++) {
      min = Math.min(min, sorted[i + 1] - sorted[i])
    }
    return min
  }

  it('leaves well-separated rungs untouched and not nudged', () => {
    const result = ladderLabels([{ y: -40 }, { y: 0 }, { y: 40 }], 12)
    expect(result.map((r) => r.labelY)).toEqual([-40, 0, 40])
    expect(result.every((r) => !r.nudged)).toBe(true)
  })

  it('never lets two labels be closer than minGap', () => {
    // n = 3 and n = 4 rungs are almost on top of each other
    const rungs = [{ y: 46 }, { y: -27.6 }, { y: -41.2 }, { y: -46 }]
    const result = ladderLabels(rungs, 13)
    expect(minSeparation(result.map((r) => r.labelY))).toBeGreaterThanOrEqual(13 - 1e-4)
  })

  it('keeps the output in input order and reports the rung y', () => {
    const rungs = [{ y: 46 }, { y: -41.2 }, { y: -46 }]
    const result = ladderLabels(rungs, 13)
    expect(result.map((r) => r.rungY)).toEqual([46, -41.2, -46])
  })

  it('marks labels that had to move and shares the displacement between neighbours', () => {
    const result = ladderLabels([{ y: 0 }, { y: 4 }], 12)
    expect(result[0].nudged).toBe(true)
    expect(result[1].nudged).toBe(true)
    // Symmetric push around the midpoint (2)
    expect(result[0].labelY).toBeCloseTo(-4, 4)
    expect(result[1].labelY).toBeCloseTo(8, 4)
  })

  it('handles an empty list', () => {
    expect(ladderLabels([], 10)).toEqual([])
  })
})
