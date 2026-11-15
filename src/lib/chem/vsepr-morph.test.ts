import { describe, expect, it } from 'vitest'
import { vseprPositions } from './vsepr'
import {
  angleBetweenDeg,
  axNotation,
  availableMoves,
  bondAngleDeg,
  domainsFor,
  interpolatePose,
  poseFromDomains,
  poseTo,
  settledBonds,
  subscriptFormula,
  switchPoint,
  type Pose,
} from './vsepr-morph'

const RIGHT: [number, number, number] = [1, 0, 0]
const UP: [number, number, number] = [0, 1, 0]

/** Angle between the first two bonds of a config, in degrees. */
function firstBondAngle(bondPairs: number, lonePairs: number, squeeze: number): number {
  const bonds = domainsFor({ bondPairs, lonePairs, squeeze }).filter((d) => d.kind === 'bond')
  return angleBetweenDeg(bonds[0].dir, bonds[1].dir)
}

describe('bond angles (NCERT Table 4.8)', () => {
  it('uses the ideal angle when there is no squeeze', () => {
    expect(bondAngleDeg({ bondPairs: 4, lonePairs: 0, squeeze: 0 })).toBe(109.5)
    expect(bondAngleDeg({ bondPairs: 2, lonePairs: 0, squeeze: 1 })).toBe(180)
  })

  it('moves the angle to the reported value when fully squeezed', () => {
    expect(bondAngleDeg({ bondPairs: 2, lonePairs: 1, squeeze: 1 })).toBeCloseTo(119.5, 9)
    expect(bondAngleDeg({ bondPairs: 3, lonePairs: 1, squeeze: 1 })).toBeCloseTo(107, 9)
    expect(bondAngleDeg({ bondPairs: 2, lonePairs: 2, squeeze: 1 })).toBeCloseTo(104.5, 9)
  })

  it('gives the CH4 to NH3 to H2O squeeze in order', () => {
    const ch4 = bondAngleDeg({ bondPairs: 4, lonePairs: 0, squeeze: 0 })
    const nh3 = bondAngleDeg({ bondPairs: 3, lonePairs: 1, squeeze: 1 })
    const h2o = bondAngleDeg({ bondPairs: 2, lonePairs: 2, squeeze: 1 })
    expect(ch4).toBeGreaterThan(nh3)
    expect(nh3).toBeGreaterThan(h2o)
  })
})

describe('domainsFor', () => {
  it('reproduces the ideal positions at squeeze 0', () => {
    for (const [b, e] of [
      [2, 0], [3, 0], [4, 0], [5, 0], [6, 0], [2, 1], [3, 1], [2, 2], [4, 1], [3, 2], [5, 1], [4, 2],
    ] as const) {
      const domains = domainsFor({ bondPairs: b, lonePairs: e, squeeze: 0 })
      const ideal = vseprPositions(b, e)
      expect(domains.filter((d) => d.kind === 'bond').map((d) => d.dir)).toEqual(ideal.bonds)
      expect(domains.filter((d) => d.kind === 'lone').map((d) => d.dir)).toEqual(ideal.lonePairs)
    }
  })

  it('keeps bonds first, then lone pairs, with the right counts', () => {
    const domains = domainsFor({ bondPairs: 3, lonePairs: 2, squeeze: 0 })
    expect(domains.map((d) => d.kind)).toEqual(['bond', 'bond', 'bond', 'lone', 'lone'])
  })

  it('gives the tetrahedral angle for AX3E before the squeeze, and 107 degrees after', () => {
    expect(firstBondAngle(3, 1, 0)).toBeCloseTo(109.4712, 3)
    expect(firstBondAngle(3, 1, 1)).toBeCloseTo(107, 6)
  })

  it('gives 104.5 degrees for AX2E2 after the squeeze and 119.5 for AX2E', () => {
    expect(firstBondAngle(2, 2, 1)).toBeCloseTo(104.5, 6)
    expect(firstBondAngle(2, 1, 1)).toBeCloseTo(119.5, 6)
  })

  it('does not squeeze classes that NCERT gives no angle for', () => {
    expect(domainsFor({ bondPairs: 4, lonePairs: 1, squeeze: 1 })).toEqual(domainsFor({ bondPairs: 4, lonePairs: 1, squeeze: 0 }))
  })

  it('keeps every lone pair at its ideal place while bonds squeeze', () => {
    const ideal = vseprPositions(2, 2).lonePairs
    const squeezed = domainsFor({ bondPairs: 2, lonePairs: 2, squeeze: 1 }).filter((d) => d.kind === 'lone')
    expect(squeezed.map((d) => d.dir)).toEqual(ideal)
  })

  it('throws for combinations NCERT does not tabulate', () => {
    expect(() => domainsFor({ bondPairs: 1, lonePairs: 0, squeeze: 0 })).toThrow(RangeError)
  })
})

describe('poseTo and interpolatePose', () => {
  it('maps a tetrahedral pose to AX3E with one lone-pair slot and no empty slots', () => {
    const from = poseFromDomains(domainsFor({ bondPairs: 4, lonePairs: 0, squeeze: 0 }), RIGHT, UP)
    const to = poseTo(from, domainsFor({ bondPairs: 3, lonePairs: 1, squeeze: 0 }), RIGHT, UP)
    expect(to.slots.filter((s) => s.kind === 'lone')).toHaveLength(1)
    expect(to.slots.filter((s) => s.kind === 'bond')).toHaveLength(3)
    expect(to.slots.some((s) => s.kind === 'none')).toBe(false)
  })

  it('grows a new bond from the centre when the count goes up', () => {
    const from = poseFromDomains(domainsFor({ bondPairs: 2, lonePairs: 0, squeeze: 0 }), RIGHT, UP)
    const to = poseTo(from, domainsFor({ bondPairs: 4, lonePairs: 0, squeeze: 0 }), RIGHT, UP)
    const start = interpolatePose(from, to, 0)
    const end = interpolatePose(from, to, 1)
    const emerging = start.slots.filter((s, i) => i >= 2 && s.kind !== 'none')
    expect(emerging.every((s) => s.scale === 0)).toBe(true)
    expect(settledBonds(end)).toHaveLength(4)
  })

  it('returns the endpoints at t = 0 and t = 1', () => {
    const from: Pose = poseFromDomains(domainsFor({ bondPairs: 3, lonePairs: 0, squeeze: 0 }), RIGHT, UP)
    const to = poseTo(from, domainsFor({ bondPairs: 3, lonePairs: 0, squeeze: 1 }), RIGHT, UP)
    const start = interpolatePose(from, to, 0).slots
    from.slots.forEach((s, i) => {
      expect(start[i].kind).toBe(s.kind)
      expect(start[i].dir[0]).toBeCloseTo(s.dir[0], 9)
      expect(start[i].dir[1]).toBeCloseTo(s.dir[1], 9)
      expect(start[i].dir[2]).toBeCloseTo(s.dir[2], 9)
    })
    const end = interpolatePose(from, to, 1).slots
    to.slots.forEach((s, i) => {
      expect(end[i].kind).toBe(s.kind)
      expect(end[i].dir[0]).toBeCloseTo(s.dir[0], 9)
      expect(end[i].dir[1]).toBeCloseTo(s.dir[1], 9)
      expect(end[i].dir[2]).toBeCloseTo(s.dir[2], 9)
    })
  })

  it('switches a lone pair on at the midpoint and a bond off at the end', () => {
    expect(switchPoint('bond', 'lone')).toBe(0.5)
    expect(switchPoint('none', 'lone')).toBe(0.5)
    expect(switchPoint('lone', 'none')).toBe(0.5)
    expect(switchPoint('bond', 'none')).toBe(1)
    expect(switchPoint('none', 'bond')).toBe(0)
  })

  it('keeps the basis orthonormal in the middle of a morph', () => {
    const a = poseFromDomains(domainsFor({ bondPairs: 4, lonePairs: 0, squeeze: 0 }), [1, 0, 0], [0, 1, 0])
    const b = poseFromDomains(domainsFor({ bondPairs: 2, lonePairs: 0, squeeze: 0 }), [0, 0, 1], [0, 1, 0])
    const mid = interpolatePose(a, b, 0.5).basis
    const dotRU = mid.right[0] * mid.up[0] + mid.right[1] * mid.up[1] + mid.right[2] * mid.up[2]
    const lenR = Math.hypot(...mid.right)
    const lenU = Math.hypot(...mid.up)
    expect(Math.abs(dotRU)).toBeLessThan(1e-9)
    expect(lenR).toBeCloseTo(1, 9)
    expect(lenU).toBeCloseTo(1, 9)
  })
})

describe('notation and moves', () => {
  it('writes AXₙEₘ with subscripts and drops the E when there is no lone pair', () => {
    expect(axNotation(2, 2)).toBe('AX₂E₂')
    expect(axNotation(4, 0)).toBe('AX₄')
    expect(axNotation(3, 1)).toBe('AX₃E')
    expect(axNotation(4, 1)).toBe('AX₄E')
    expect(axNotation(2, 0)).toBe('AX₂')
  })

  it('subscripts digits and leaves charges alone', () => {
    expect(subscriptFormula('NH4⁺')).toBe('NH₄⁺')
    expect(subscriptFormula('H2O')).toBe('H₂O')
  })

  it('only offers moves that land on an NCERT class', () => {
    expect(availableMoves({ bondPairs: 2, lonePairs: 0 })).toEqual({
      addBond: true, removeBond: false, addLonePair: true, removeLonePair: false,
    })
    expect(availableMoves({ bondPairs: 6, lonePairs: 0 })).toEqual({
      addBond: false, removeBond: true, addLonePair: false, removeLonePair: false,
    })
    expect(availableMoves({ bondPairs: 4, lonePairs: 2 })).toEqual({
      addBond: false, removeBond: true, addLonePair: false, removeLonePair: true,
    })
  })
})
