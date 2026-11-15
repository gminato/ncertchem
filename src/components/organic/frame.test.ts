import { describe, expect, it } from 'vitest'
import { lonePairAngles } from './frame'

const deg = (r: number) => Math.round((((r * 180) / Math.PI) % 360 + 360) % 360)

describe('lonePairAngles', () => {
  // Atom 0 at the origin; a bond to the right (0°).
  const pts = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: -0.5, y: 0.866 }]
  it('spreads three pairs of a one-bond O⁻ or halogen at 90°, 180° and 270° from the bond', () => {
    expect(lonePairAngles(pts, [[1], [0]], 0, 3).map(deg)).toEqual([90, 180, 270])
  })
  it('puts the two pairs of a C=O oxygen at ±120° from the bond', () => {
    expect(lonePairAngles(pts, [[1], [0]], 0, 2).map(deg)).toEqual([120, 240])
  })
  it('shares the largest gap between two bonds evenly', () => {
    // Bonds at 0° and 120°: the largest gap runs from 120° to 360°.
    expect(lonePairAngles(pts, [[1, 2], [0], [0]], 0, 2).map(deg)).toEqual([200, 280])
  })
  it('returns nothing for no pairs', () => {
    expect(lonePairAngles(pts, [[1], [0]], 0, 0)).toEqual([])
  })
})
