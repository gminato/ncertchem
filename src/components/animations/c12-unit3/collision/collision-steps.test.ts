import { describe, expect, it } from 'vitest'
import {
  EFFECTIVE_FRACTION,
  ONE_IN_ENERGETIC,
  TEXT_EFFECTIVE,
  TEXT_HIGH,
  TEXT_LOW,
  approachPhase,
  closestPairs,
  drift,
  flashOpacity,
  particleHomes,
  type Bounds,
} from './collision-steps'

const BOX: Bounds = { x0: 70, y0: 76, x1: 510, y1: 286 }

describe('collision readouts (from the kinetics lib)', () => {
  it('quotes e^(-Ea/RT) at 300 K to 3 s.f.', () => {
    expect(TEXT_LOW).toBe('1.81 × 10⁻²')
    expect(TEXT_HIGH).toBe('1.97 × 10⁻⁹')
  })

  it('quotes the effective fraction P e^(-Ea/RT) and about one energetic collision in 55', () => {
    expect(TEXT_EFFECTIVE).toBe('4.54 × 10⁻³')
    expect(EFFECTIVE_FRACTION).toBeCloseTo(0.25 * 0.0181461, 5)
    expect(ONE_IN_ENERGETIC).toBe(55)
  })
})

describe('particleHomes', () => {
  it('returns the requested count, inside the bounds, and well spaced', () => {
    const homes = particleHomes(11, 20, BOX, 46)
    expect(homes).toHaveLength(20)
    for (const p of homes) {
      expect(p.x).toBeGreaterThanOrEqual(BOX.x0)
      expect(p.x).toBeLessThanOrEqual(BOX.x1)
      expect(p.y).toBeGreaterThanOrEqual(BOX.y0)
      expect(p.y).toBeLessThanOrEqual(BOX.y1)
    }
    for (let i = 0; i < homes.length; i++) {
      for (let j = i + 1; j < homes.length; j++) {
        expect(Math.hypot(homes[i].x - homes[j].x, homes[i].y - homes[j].y)).toBeGreaterThanOrEqual(46)
      }
    }
  })

  it('is deterministic for a seed', () => {
    expect(particleHomes(11, 12, BOX, 46)).toEqual(particleHomes(11, 12, BOX, 46))
  })
})

describe('drift and phases', () => {
  it('keeps every particle inside the vessel for a long run of time', () => {
    const homes = particleHomes(11, 20, BOX, 46)
    for (let t = 0; t < 120; t += 0.37) {
      homes.forEach((h, i) => {
        const p = drift(h, i, t)
        expect(p.x).toBeGreaterThanOrEqual(BOX.x0 - 12)
        expect(p.x).toBeLessThanOrEqual(BOX.x1 + 12)
        expect(p.y).toBeGreaterThanOrEqual(BOX.y0 - 12)
        expect(p.y).toBeLessThanOrEqual(BOX.y1 + 12)
      })
    }
  })

  it('pairs the closest particles without reuse', () => {
    const homes = particleHomes(11, 20, BOX, 46)
    const pairs = closestPairs(homes, 5)
    expect(pairs).toHaveLength(5)
    const flat = pairs.flat()
    expect(new Set(flat).size).toBe(flat.length)
  })

  it('keeps flashes visible and phased', () => {
    for (let k = 0; k < 5; k++) {
      for (let t = 0; t < 10; t += 0.5) {
        const o = flashOpacity(k, t)
        expect(o).toBeGreaterThanOrEqual(0.3)
        expect(o).toBeLessThanOrEqual(1)
      }
    }
  })

  it('starts the approach at contact (phase 1 at t = 0) and stays in [0, 1]', () => {
    expect(approachPhase(0)).toBe(1)
    for (let t = 0; t < 20; t += 0.1) {
      expect(approachPhase(t)).toBeGreaterThanOrEqual(0)
      expect(approachPhase(t)).toBeLessThanOrEqual(1)
    }
  })
})
