import { describe, it, expect } from 'vitest'
import {
  angleArcPoints,
  angleBetween3,
  angleSeparation,
  bondSticks,
  cameraBasis,
  dot3,
  fitToBox,
  freeDirections,
  interpolatePositions,
  lensPolygon,
  len3,
  perpendicularTo,
  projectOrthographic,
  type Vec3,
} from './geometry'

const DEG = Math.PI / 180

describe('freeDirections (lone pairs away from bonds)', () => {
  it('puts two lone pairs of a bent atom on the open side of its two bonds', () => {
    // Two bonds 104.5° apart, centred on the -90° (up) direction.
    const bonds = [-90 - 52.25, -90 + 52.25]
    const [p, q] = freeDirections(bonds, 2)
    expect(angleSeparation(p, bonds[0])).toBeGreaterThan(60)
    expect(angleSeparation(p, bonds[1])).toBeGreaterThan(60)
    expect(angleSeparation(q, bonds[0])).toBeGreaterThan(60)
    expect(angleSeparation(p, q)).toBeGreaterThanOrEqual(89)
  })

  it('spreads two lone pairs around an atom with one bond, 120° apart', () => {
    const [p, q] = freeDirections([0], 2)
    expect(angleSeparation(p, 0)).toBeCloseTo(120, -1)
    expect(angleSeparation(q, 0)).toBeCloseTo(120, -1)
    expect(angleSeparation(p, q)).toBeCloseTo(120, -1)
  })

  it('places one lone pair opposite a single bond', () => {
    const [p] = freeDirections([0], 1)
    expect(angleSeparation(p, 0)).toBe(180)
  })

  it('is deterministic and empty for zero lone pairs', () => {
    expect(freeDirections([10, 200], 0)).toEqual([])
    expect(freeDirections([10, 200], 2)).toEqual(freeDirections([10, 200], 2))
  })

  it('handles more than three lone pairs with a greedy spread', () => {
    const dirs = freeDirections([], 4)
    expect(dirs).toHaveLength(4)
    for (let i = 0; i < dirs.length; i++) {
      for (let j = i + 1; j < dirs.length; j++) {
        expect(angleSeparation(dirs[i], dirs[j])).toBeGreaterThan(40)
      }
    }
  })
})

describe('bondSticks (double-bond offset plane)', () => {
  const a: Vec3 = [0, 0, 0]
  const b: Vec3 = [1, 0, 0]

  it('draws one stick for a single bond, on the bond axis', () => {
    const sticks = bondSticks(a, b, 1)
    expect(sticks).toHaveLength(1)
    expect(sticks[0].from).toEqual(a)
    expect(sticks[0].to).toEqual(b)
  })

  it('offsets a double bond into two parallel sticks in the default xy plane', () => {
    const sticks = bondSticks(a, b, 2, { spacing: 0.2 })
    expect(sticks).toHaveLength(2)
    for (const stick of sticks) {
      expect(stick.from[2]).toBeCloseTo(0, 9)
      expect(stick.to[2]).toBeCloseTo(0, 9)
      expect(dot3(stick.from, [1, 0, 0])).toBeCloseTo(0, 9)
    }
    const separation = Math.abs(sticks[0].from[1] - sticks[1].from[1])
    expect(separation).toBeCloseTo(0.2, 9)
    expect(sticks.every((s) => !s.dashed)).toBe(true)
  })

  it('offsets a triple bond into three sticks, one on the axis', () => {
    const sticks = bondSticks(a, b, 3, { spacing: 0.2 })
    expect(sticks).toHaveLength(3)
    expect(sticks[1].from).toEqual(a)
  })

  it('draws a 1.5 bond as one solid and one dashed stick', () => {
    const sticks = bondSticks(a, b, 1.5)
    expect(sticks).toHaveLength(2)
    expect(sticks.filter((s) => s.dashed)).toHaveLength(1)
    expect(sticks.filter((s) => !s.dashed)).toHaveLength(1)
  })

  it('keeps the parallel sticks in the plane given by planeNormal', () => {
    const sticks = bondSticks(a, b, 2, { spacing: 0.2, planeNormal: [0, 1, 0] })
    for (const stick of sticks) expect(stick.from[1]).toBeCloseTo(0, 9)
  })
})

describe('perpendicularTo', () => {
  it('is a unit vector orthogonal to the direction', () => {
    const d: Vec3 = [0.3, -0.8, 0.5]
    const p = perpendicularTo(d)
    expect(len3(p)).toBeCloseTo(1, 9)
    expect(dot3(p, d)).toBeCloseTo(0, 9)
  })

  it('still works when the direction is parallel to the normal', () => {
    const p = perpendicularTo([0, 0, 2], [0, 0, 1])
    expect(len3(p)).toBeCloseTo(1, 9)
    expect(dot3(p, [0, 0, 1])).toBeCloseTo(0, 9)
  })
})

describe('angleArcPoints (the drawn angle)', () => {
  it('starts on the first arm and ends on the second, at the given radius', () => {
    const centre: Vec3 = [0, 0, 0]
    const pts = angleArcPoints(centre, [1, 0, 0], [0, 1, 0], 0.5, 16)
    expect(pts[0][0]).toBeCloseTo(0.5, 9)
    expect(pts[0][1]).toBeCloseTo(0, 9)
    expect(pts[pts.length - 1][0]).toBeCloseTo(0, 9)
    expect(pts[pts.length - 1][1]).toBeCloseTo(0.5, 9)
    for (const p of pts) expect(len3(p)).toBeCloseTo(0.5, 9)
  })

  it('sweeps exactly the angle between the two arms', () => {
    const centre: Vec3 = [0, 0, 0]
    const a: Vec3 = [1, 0, 0]
    const b: Vec3 = [Math.cos(104.5 * DEG), Math.sin(104.5 * DEG), 0]
    const pts = angleArcPoints(centre, a, b, 1, 20)
    expect(angleBetween3(a, pts[10])).toBeCloseTo(52.25, 1)
  })
})

describe('camera and projection', () => {
  it('projects a point on the camera right axis to the right of the screen', () => {
    const basis = cameraBasis([0, 0, 5])
    const right = projectOrthographic([1, 0, 0], basis)
    expect(right.x).toBeGreaterThan(0)
    expect(right.y).toBeCloseTo(0, 9)
    const up = projectOrthographic([0, 1, 0], basis)
    expect(up.y).toBeLessThan(0)
  })

  it('fits points into a box with the requested aspect and centres them', () => {
    const fit = fitToBox(
      [
        { x: -2, y: 0 },
        { x: 2, y: 0 },
      ],
      200,
      100,
      10
    )
    expect(fit.scale).toBeCloseTo((200 - 20) / 4, 9)
    expect(fit.tx).toBeCloseTo(100, 9)
    expect(fit.ty).toBeCloseTo(50, 9)
  })
})

describe('lensPolygon (overlap of two discs)', () => {
  it('returns null for discs that do not touch', () => {
    expect(lensPolygon({ x: 0, y: 0 }, 1, { x: 5, y: 0 }, 1)).toBeNull()
  })

  it('returns the smaller disc when one contains the other', () => {
    const poly = lensPolygon({ x: 0, y: 0 }, 5, { x: 1, y: 0 }, 1)
    expect(poly).not.toBeNull()
    for (const p of poly ?? []) expect(Math.hypot(p.x - 1, p.y)).toBeCloseTo(1, 6)
  })

  it('bounds the lens between the two circles', () => {
    const poly = lensPolygon({ x: 0, y: 0 }, 2, { x: 2, y: 0 }, 2) ?? []
    expect(poly.length).toBeGreaterThan(10)
    for (const p of poly) {
      expect(Math.hypot(p.x, p.y)).toBeLessThanOrEqual(2 + 1e-6)
      expect(Math.hypot(p.x - 2, p.y)).toBeLessThanOrEqual(2 + 1e-6)
    }
    const xs = poly.map((p) => p.x)
    expect(Math.min(...xs)).toBeCloseTo(0, 6)
    expect(Math.max(...xs)).toBeCloseTo(2, 6)
  })
})

describe('interpolatePositions (tweened poses)', () => {
  it('moves each point linearly and clamps t', () => {
    const from: Vec3[] = [[0, 0, 0]]
    const to: Vec3[] = [[2, 0, 0]]
    expect(interpolatePositions(from, to, 0.5)).toEqual([[1, 0, 0]])
    expect(interpolatePositions(from, to, 2)).toEqual([[2, 0, 0]])
  })
})
