/**
 * Geometry for orbital overlap. Each atomic orbital is a set of signed discs
 * (lobes). Two orbitals overlap where a lobe of one meets a lobe of the other,
 * and that overlap has the sign of the product of the two lobe signs. Cancelling
 * overlaps give a zero net overlap.
 *
 * Only lobes that face the other atom take part. The lobes pointing away never
 * overlap in a bonding picture, and counting them would flip the sign of the
 * overlap as the atoms come together.
 */

import type { Vec2 } from './geometry'

export type OverlapKind = 'ss' | 'sp' | 'pp-sigma' | 'pp-pi'
export type OverlapPhase = 'positive' | 'negative' | 'zero'

export interface Lobe {
  centre: Vec2
  radius: number
  sign: 1 | -1
}

export interface OverlapOrbital {
  lobes: Lobe[]
  /** An s sphere, or a p dumbbell along x or y. */
  shape: 's' | 'p-x' | 'p-y'
  centre: Vec2
}

/** Radius of an s orbital disc, and of one lobe of a p orbital. In SVG units. */
export const S_RADIUS = 34
export const P_LOBE_RADIUS = 20
/** Distance from a p orbital's centre to each lobe's centre. */
export const P_LOBE_OFFSET = 20
/**
 * Side-on (π) overlap needs the nuclei closer, because the lobes lie beside each other rather
 * than end to end. The π case uses this fraction of the spread.
 */
export const PI_SPREAD_FACTOR = 0.6
/** Largest separation between the two orbital centres, in SVG units. */
export const MAX_SPREAD = 110
/**
 * The smallest separation drawn. At exactly zero the two orbitals would share a
 * centre, and their lobes would sit on top of each other with the wrong signs.
 */
export const MIN_SEPARATION = 0.15

const EPS = 1e-9

function sOrbital(centre: Vec2, sign: 1 | -1): OverlapOrbital {
  return { shape: 's', centre, lobes: [{ centre, radius: S_RADIUS, sign }] }
}

function pOrbital(centre: Vec2, axis: 'x' | 'y', signs: [1 | -1, 1 | -1]): OverlapOrbital {
  const off = P_LOBE_OFFSET
  const a: Vec2 = axis === 'x' ? { x: centre.x - off, y: centre.y } : { x: centre.x, y: centre.y - off }
  const b: Vec2 = axis === 'x' ? { x: centre.x + off, y: centre.y } : { x: centre.x, y: centre.y + off }
  return {
    shape: axis === 'x' ? 'p-x' : 'p-y',
    centre,
    lobes: [
      { centre: a, radius: P_LOBE_RADIUS, sign: signs[0] },
      { centre: b, radius: P_LOBE_RADIUS, sign: signs[1] },
    ],
  }
}

/**
 * The two orbitals for an overlap case, placed around the origin. `separation`
 * runs from 0 (as close as the lobes can get) to 1 (far apart), and sets the gap
 * between the centres. The phase chooses which lobes face each other:
 * `positive` pairs like signs, `negative` pairs opposite signs. `zero` is the
 * side-on case where equal and opposite lobes cancel.
 */
export function overlapOrbitals(
  kind: OverlapKind,
  phase: OverlapPhase,
  separation: number
): [OverlapOrbital, OverlapOrbital] {
  const s = Math.max(MIN_SEPARATION, Math.min(1, separation))
  const d = s * MAX_SPREAD
  const half = d / 2
  const flip: 1 | -1 = phase === 'negative' ? -1 : 1
  const unflip: 1 | -1 = flip === 1 ? -1 : 1

  const dPi = d * PI_SPREAD_FACTOR
  const halfPi = dPi / 2

  switch (kind) {
    case 'ss':
      return [sOrbital({ x: -half, y: 0 }, 1), sOrbital({ x: half, y: 0 }, flip)]

    case 'sp': {
      if (phase === 'zero') {
        // The s orbital approaches the p from the side, so it meets both lobes equally.
        return [pOrbital({ x: 0, y: 0 }, 'x', [1, -1]), sOrbital({ x: 0, y: d * 0.5 }, 1)]
      }
      // The s orbital sits left of a p whose left lobe faces it.
      return [sOrbital({ x: -half, y: 0 }, 1), pOrbital({ x: half, y: 0 }, 'x', [flip, unflip])]
    }

    case 'pp-sigma': {
      if (phase === 'zero') {
        // A p along x meets a p along y side-on: the y lobes have opposite signs and cancel.
        return [pOrbital({ x: -half, y: 0 }, 'x', [1, -1]), pOrbital({ x: half, y: 0 }, 'y', [1, -1])]
      }
      return [
        pOrbital({ x: -half, y: 0 }, 'x', [-1, 1]),
        pOrbital({ x: half, y: 0 }, 'x', [flip, unflip]),
      ]
    }

    case 'pp-pi':
      // Parallel p orbitals side by side: the top lobes meet, and so do the bottom lobes.
      return [
        pOrbital({ x: -halfPi, y: 0 }, 'y', [1, -1]),
        pOrbital({ x: halfPi, y: 0 }, 'y', [flip, unflip]),
      ]
  }
}

export interface OverlapRegion {
  path: Vec2[]
  sign: 1 | -1
}

/** Unit vector from one centre to the other, or the x axis when they coincide. */
function axisBetween(from: Vec2, to: Vec2): Vec2 {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const len = Math.hypot(dx, dy)
  return len < EPS ? { x: 1, y: 0 } : { x: dx / len, y: dy / len }
}

/** True when a lobe lies on the side of its own centre that faces the other orbital, or level with it. */
function faces(lobe: Lobe, centre: Vec2, towards: Vec2): boolean {
  const offset = (lobe.centre.x - centre.x) * towards.x + (lobe.centre.y - centre.y) * towards.y
  return offset >= -EPS
}

/**
 * The overlap regions between two orbitals: one lens for each facing pair of
 * lobes that meet. A region's sign is the product of the two lobe signs.
 */
export function overlapRegions(
  a: OverlapOrbital,
  b: OverlapOrbital,
  lens: (c1: Vec2, r1: number, c2: Vec2, r2: number) => Vec2[] | null
): OverlapRegion[] {
  const towardsB = axisBetween(a.centre, b.centre)
  const towardsA = { x: -towardsB.x, y: -towardsB.y }
  const regions: OverlapRegion[] = []
  for (const la of a.lobes) {
    if (!faces(la, a.centre, towardsB)) continue
    for (const lb of b.lobes) {
      if (!faces(lb, b.centre, towardsA)) continue
      const path = lens(la.centre, la.radius, lb.centre, lb.radius)
      if (path) regions.push({ path, sign: la.sign * lb.sign > 0 ? 1 : -1 })
    }
  }
  return regions
}

/** Net sign of all the overlap regions: +1, -1, or 0 when they cancel. */
export function netOverlapSign(regions: readonly OverlapRegion[]): 1 | -1 | 0 {
  const total = regions.reduce((sum, r) => sum + r.sign, 0)
  if (total > 0) return 1
  if (total < 0) return -1
  return 0
}
