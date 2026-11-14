import { describe, it, expect } from 'vitest'
import {
  integrateAlpha,
  pathToCircle,
  rutherfordAngle,
  scatterClass,
} from './alpha-scattering'

const DEG = Math.PI / 180

describe('rutherfordAngle', () => {
  it('gives 90° when the impact parameter equals b₀', () => {
    expect(rutherfordAngle(1, 1)).toBeCloseTo(Math.PI / 2, 12)
  })

  it('grows as the impact parameter shrinks', () => {
    expect(rutherfordAngle(0.5)).toBeGreaterThan(rutherfordAngle(1))
    expect(rutherfordAngle(1)).toBeGreaterThan(rutherfordAngle(10))
  })
})

describe('integrateAlpha (numerical check of the Coulomb path)', () => {
  for (const b of [0.5, 1, 2, 5, 10, 25]) {
    it(`agrees with tan(θ/2) = b₀/b to 0.5° at b = ${b} b₀`, () => {
      const { angle } = integrateAlpha(b)
      expect(Math.abs(Math.abs(angle) - rutherfordAngle(b))).toBeLessThan(0.5 * DEG)
    })
  }

  it('deflects towards +y for a particle passing above the nucleus, and the opposite for below', () => {
    const up = integrateAlpha(3).angle
    const down = integrateAlpha(-3).angle
    expect(up).toBeGreaterThan(0)
    expect(down).toBeLessThan(0)
    expect(up).toBeCloseTo(-down, 6)
  })

  it('deflects more as the impact parameter shrinks', () => {
    const angles = [20, 8, 4, 2, 1, 0.5].map((b) => Math.abs(integrateAlpha(b).angle))
    for (let i = 1; i < angles.length; i++) expect(angles[i]).toBeGreaterThan(angles[i - 1])
  })

  it('bounces a head-on-ish particle back by more than 90°', () => {
    expect(Math.abs(integrateAlpha(0.5).angle)).toBeGreaterThan(90 * DEG)
  })

  it('returns a path that starts far out and ends far out', () => {
    const { points } = integrateAlpha(2)
    expect(points[0].x).toBeCloseTo(-60, 9)
    const last = points[points.length - 1]
    expect(Math.hypot(last.x, last.y)).toBeGreaterThanOrEqual(60 - 1e-9)
  })
})

describe('pathToCircle', () => {
  it('extends the path until it reaches the detector circle', () => {
    const trajectory = integrateAlpha(2)
    const path = pathToCircle(trajectory, 150)
    const end = path[path.length - 1]
    expect(Math.hypot(end.x, end.y)).toBeCloseTo(150, 6)
  })
})

describe('scatterClass', () => {
  it('sorts angles into straight (< 5°), deflected and bounced (> 90°)', () => {
    expect(scatterClass(1 * DEG)).toBe('straight')
    expect(scatterClass(-30 * DEG)).toBe('deflected')
    expect(scatterClass(120 * DEG)).toBe('bounced')
  })
})

describe('screen hits for undeflected particles', () => {
  // Radius 150 in units of b₀: the screen is far from the nucleus, so the outgoing
  // direction determines where each particle lands.
  const hitY = (b: number) => {
    const t = integrateAlpha(b)
    const path = pathToCircle(t, 150)
    return path[path.length - 1].y
  }

  it('lands the final segment along the computed scattering angle', () => {
    const t = integrateAlpha(60)
    const path = pathToCircle(t, 150)
    const a = path[path.length - 2]
    const z = path[path.length - 1]
    const dir = Math.atan2(z.y - a.y, z.x - a.x)
    expect(Math.abs(dir - t.angle)).toBeLessThan(1e-6)
  })

  it('keeps undeflected particles nearly parallel: hits move with b, not focused', () => {
    // Spacing of impact parameters is 36; the screen hits should differ by about the same.
    const spread = hitY(96) - hitY(60)
    expect(Math.abs(spread - 36)).toBeLessThan(2)
  })
})
