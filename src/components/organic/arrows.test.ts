import { describe, it, expect } from 'vitest'
import { arrowHeadPoints, bondAnchor, curvedArrowGeometry, lonePairAnchor, quadBezier } from './arrows'
import { along, bondSegments, chargeText, labelRuns, hydrogensFirst, lonePairCount, stereoPath } from './frame'
import { adjacency } from './layout'

describe('quadBezier', () => {
  it('passes through both ends and the control point weighting at t = 0.5', () => {
    const p0 = { x: 0, y: 0 }
    const c = { x: 5, y: 10 }
    const p1 = { x: 10, y: 0 }
    expect(quadBezier(p0, c, p1, 0)).toEqual(p0)
    expect(quadBezier(p0, c, p1, 1)).toEqual(p1)
    expect(quadBezier(p0, c, p1, 0.5)).toEqual({ x: 5, y: 5 })
  })
})

describe('curvedArrowGeometry', () => {
  it('a straight arrow (bend 0) has its control point at the midpoint', () => {
    const g = curvedArrowGeometry({ x: 0, y: 0 }, { x: 10, y: 0 }, { bend: 0, gap: 0 })
    expect(g.control.x).toBeCloseTo(5)
    expect(g.control.y).toBeCloseTo(0)
  })

  it('bends by bend * chord, to the left of travel for positive bend', () => {
    const g = curvedArrowGeometry({ x: 0, y: 0 }, { x: 10, y: 0 }, { bend: 0.5, gap: 0 })
    expect(g.control.x).toBeCloseTo(5)
    expect(g.control.y).toBeCloseTo(5)
    const mid = quadBezier(g.start, g.control, g.tip, 0.5)
    expect(mid.y).toBeCloseTo(2.5)
  })

  it('places the tip at the trimmed end and the tangent along the arrow', () => {
    const g = curvedArrowGeometry({ x: 0, y: 0 }, { x: 10, y: 0 }, { bend: 0, gap: 2 })
    expect(g.tip.x).toBeCloseTo(8)
    expect(g.tangent.x).toBeCloseTo(1)
    expect(g.tangent.y).toBeCloseTo(0)
    expect(g.start.x).toBeCloseTo(2)
  })

  it('a pair head has three points with the tip first and symmetric barbs', () => {
    const g = curvedArrowGeometry({ x: 0, y: 0 }, { x: 10, y: 0 }, { bend: 0, gap: 0, kind: 'pair' })
    expect(g.head).toHaveLength(3)
    expect(g.head[0]).toEqual(g.tip)
    expect(g.head[1].y).toBeCloseTo(-g.head[2].y)
    expect(g.head[1].x).toBeCloseTo(g.head[2].x)
  })

  it('a radical (fishhook) head has one barb to a single side', () => {
    const g = curvedArrowGeometry({ x: 0, y: 0 }, { x: 10, y: 0 }, { bend: 0, gap: 0, kind: 'radical' })
    expect(g.head).toHaveLength(3)
    expect(g.head[0]).toEqual(g.tip)
    // The back point lies on the axis; the barb is off to one side only
    expect(g.head[1].y).toBeCloseTo(0)
    expect(g.head[2].y).not.toBeCloseTo(0)
  })

  it('arrowHeadPoints serialises the head polygon', () => {
    const g = curvedArrowGeometry({ x: 0, y: 0 }, { x: 10, y: 0 }, { bend: 0, gap: 0 })
    expect(arrowHeadPoints(g).split(' ')).toHaveLength(3)
  })
})

describe('anchors', () => {
  it('a bond anchor at t = 0.5 is the midpoint', () => {
    expect(bondAnchor({ x: 0, y: 0 }, { x: 4, y: 2 })).toEqual({ x: 2, y: 1 })
    expect(along({ x: 0, y: 0 }, { x: 4, y: 2 }, 0.25)).toEqual({ x: 1, y: 0.5 })
  })

  it('a lone-pair anchor sits the radius away along the angle', () => {
    const p = lonePairAnchor({ x: 1, y: 1 }, 0, 3)
    expect(p.x).toBeCloseTo(4)
    expect(p.y).toBeCloseTo(1)
  })
})

describe('frame helpers', () => {
  it('a double bond in a chain has two parallel lines, centred on the axis', () => {
    const segs = bondSegments({ x: 0, y: 0 }, { x: 10, y: 0 }, 2, { spacing: 2 })
    expect(segs).toHaveLength(2)
    expect(segs[0].y1).toBeCloseTo(-segs[1].y1)
    expect(segs[0].y1).not.toBeCloseTo(0)
  })

  it('a triple bond has three lines', () => {
    expect(bondSegments({ x: 0, y: 0 }, { x: 10, y: 0 }, 3, { spacing: 2 })).toHaveLength(3)
  })

  it('a wedge is a closed filled triangle', () => {
    expect(stereoPath({ x: 0, y: 0 }, { x: 10, y: 0 }, 'wedge', 2)).toMatch(/Z$/)
  })

  it('labels put hydrogens after the element from the left and before it from the right', () => {
    const g = { atoms: [{ element: 'C' }, { element: 'O', hCount: 1 }], bonds: [{ a: 0, b: 1, order: 1 as const }] }
    const adj = adjacency(g)
    // Carbon at the origin; the oxygen (atom 1) sits to its right, so the bond comes from the left.
    const oxygenRight = [{ x: 0, y: 0 }, { x: 1, y: 0 }]
    const oxygenLeft = [{ x: 0, y: 0 }, { x: -1, y: 0 }]
    expect(hydrogensFirst(oxygenRight, adj, 1)).toBe(false)
    expect(hydrogensFirst(oxygenLeft, adj, 1)).toBe(true)
    expect(labelRuns('O', 1, false).map((r) => r.text).join('')).toBe('OH')
    expect(labelRuns('N', 2, true).map((r) => r.text).join('')).toBe('H2N')
  })

  it('formal charges use true minus signs and omit a unit magnitude', () => {
    expect(chargeText(-1)).toBe('−')
    expect(chargeText(2)).toBe('2+')
    expect(chargeText(-2)).toBe('2−')
  })

  it('lone pairs follow group electrons minus bonds, hydrogens and charge', () => {
    expect(lonePairCount('O', 0, 2, 0)).toBe(2) // carbonyl oxygen
    expect(lonePairCount('O', -1, 1, 0)).toBe(3) // carboxylate O-
    expect(lonePairCount('N', 1, 4, 0)).toBe(0) // ammonium
    expect(lonePairCount('C', 0, 4, 0)).toBe(0) // carbon has none
  })
})
