import { describe, it, expect } from 'vitest'
import type { MolBond, MolGraph } from '@/lib/chem/molecule-graph'
import { CLASH_DISTANCE, boundingBox, dist, findRings, layout2D, type Point } from './layout'
import { CHLOROTOLUENE, CYCLOHEXENE, TRIMETHYLPENTANE } from './fixture'
import { parseSmiles } from '@/lib/chem/molecule-parse'

/** Builds an alkane from a SMILES-like string of C atoms, with '(' ')' for branches. */
function alkane(smiles: string): MolGraph {
  const atoms: MolGraph['atoms'] = []
  const bonds: MolBond[] = []
  const stack: number[] = []
  let prev = -1
  for (const ch of smiles) {
    if (ch === '(') {
      stack.push(prev)
    } else if (ch === ')') {
      prev = stack.pop() as number
    } else {
      atoms.push({ element: 'C' })
      const i = atoms.length - 1
      if (prev >= 0) bonds.push({ a: prev, b: i, order: 1 })
      prev = i
    }
  }
  const deg = atoms.map(() => 0)
  for (const b of bonds) {
    deg[b.a]++
    deg[b.b]++
  }
  atoms.forEach((a, i) => (a.hCount = 4 - deg[i]))
  return { atoms, bonds }
}

/** Every alkane isomer from methane to heptane (hand-written SMILES-like skeletons). */
const ALKANE_ISOMERS = [
  'C',
  'CC',
  'CCC',
  'CCCC',
  'CC(C)C',
  'CCCCC',
  'CCC(C)C',
  'CC(C)(C)C',
  'CCCCCC',
  'CCCC(C)C',
  'CCC(C)CC',
  'CC(C)CCC',
  'CC(C)C(C)C',
  'CC(C)(C)CC',
  'CCCCCCC',
  'CC(C)CCCC',
  'CCC(C)CCC',
  'CC(C)(C)CCC',
  'CC(C)C(C)CC',
  'CC(C)CC(C)C',
  'CCC(C)(C)CC',
  'CCC(CC)CC',
  'CC(C)(C)C(C)C',
]

function pairwiseMin(points: Point[]): number {
  let m = Infinity
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) m = Math.min(m, dist(points[i], points[j]))
  }
  return m
}

describe('layout2D: acyclic molecules', () => {
  it.each(ALKANE_ISOMERS)('%s has no clashes and unit bond lengths', (smiles) => {
    const g = alkane(smiles)
    const pts = layout2D(g)
    expect(pts).toHaveLength(g.atoms.length)
    if (g.atoms.length > 1) expect(pairwiseMin(pts)).toBeGreaterThanOrEqual(CLASH_DISTANCE)
    for (const b of g.bonds) {
      expect(Math.abs(dist(pts[b.a], pts[b.b]) - 1)).toBeLessThan(0.01)
    }
  })

  it('lays the longest chain as a zig-zag with 120 degree angles', () => {
    const g = alkane('CCCCC')
    const pts = layout2D(g)
    // Interior angle at each inner atom of the chain
    for (let i = 1; i < 4; i++) {
      const a = pts[i - 1]
      const b = pts[i]
      const c = pts[i + 1]
      const v1 = { x: a.x - b.x, y: a.y - b.y }
      const v2 = { x: c.x - b.x, y: c.y - b.y }
      const cos = (v1.x * v2.x + v1.y * v2.y) / (Math.hypot(v1.x, v1.y) * Math.hypot(v2.x, v2.y))
      expect(Math.acos(cos) * (180 / Math.PI)).toBeCloseTo(120, 0)
    }
  })

  it('places the trimethylpentane skeleton without clashes', () => {
    const pts = layout2D(TRIMETHYLPENTANE)
    expect(pairwiseMin(pts)).toBeGreaterThanOrEqual(CLASH_DISTANCE)
  })

  it('respects given coordinates', () => {
    const g: MolGraph = {
      atoms: [
        { element: 'C', hCount: 3, x: 5, y: 2 },
        { element: 'C', hCount: 3 },
        { element: 'C', hCount: 3 },
      ],
      bonds: [
        { a: 0, b: 1, order: 1 },
        { a: 1, b: 2, order: 1 },
      ],
    }
    const pts = layout2D(g)
    expect(pts[0]).toEqual({ x: 5, y: 2 })
    expect(dist(pts[1], pts[2])).toBeCloseTo(1, 2)
  })
})

describe('layout2D: rings', () => {
  it.each([3, 4, 5, 6, 7, 8])('draws a %i-membered ring as a regular polygon', (n) => {
    const atoms = Array.from({ length: n }, () => ({ element: 'C', hCount: 2 }))
    const bonds: MolBond[] = atoms.map((_, i) => ({ a: i, b: (i + 1) % n, order: 1 as const }))
    const g: MolGraph = { atoms, bonds }
    const rings = findRings(g)
    expect(rings).toHaveLength(1)
    expect(rings[0]).toHaveLength(n)
    const pts = layout2D(g)
    for (const b of bonds) expect(Math.abs(dist(pts[b.a], pts[b.b]) - 1)).toBeLessThan(0.01)
    const cx = pts.reduce((s, p) => s + p.x, 0) / n
    const cy = pts.reduce((s, p) => s + p.y, 0) / n
    const radii = pts.map((p) => Math.hypot(p.x - cx, p.y - cy))
    const R = 1 / (2 * Math.sin(Math.PI / n))
    for (const r of radii) expect(Math.abs(r - R)).toBeLessThan(0.01)
  })

  it('benzene in Kekule form is a regular hexagon with a substituent outside', () => {
    const pts = layout2D(CHLOROTOLUENE)
    const ring = pts.slice(0, 6)
    const cx = ring.reduce((s, p) => s + p.x, 0) / 6
    const cy = ring.reduce((s, p) => s + p.y, 0) / 6
    for (const p of ring) expect(Math.abs(Math.hypot(p.x - cx, p.y - cy) - 1)).toBeLessThan(0.01)
    // The methyl (6) and chlorine (7) sit radially outside their ring atoms
    for (const [sub, parent] of [[6, 0], [7, 3]] as const) {
      const outward = Math.hypot(pts[sub].x - cx, pts[sub].y - cy)
      expect(outward).toBeGreaterThan(1.9)
      expect(dist(pts[sub], pts[parent])).toBeCloseTo(1, 2)
    }
    expect(pairwiseMin(pts)).toBeGreaterThanOrEqual(CLASH_DISTANCE)
  })

  it('cyclohexene keeps all atoms apart', () => {
    const pts = layout2D(CYCLOHEXENE)
    expect(pairwiseMin(pts)).toBeGreaterThanOrEqual(CLASH_DISTANCE)
  })

  it('fuses two rings that share an edge (naphthalene)', () => {
    const ids = Array.from({ length: 10 }, (_, i) => i)
    // Ring A: 0-1-2-3-4-5, ring B shares atoms 4 and 5... use a standard fused skeleton:
    // ring A 0..5, ring B 4,5,6,7,8,9 with shared bond 4-5.
    const bonds: MolBond[] = [
      { a: 0, b: 1, order: 1 },
      { a: 1, b: 2, order: 1 },
      { a: 2, b: 3, order: 1 },
      { a: 3, b: 4, order: 1 },
      { a: 4, b: 5, order: 1 },
      { a: 5, b: 0, order: 1 },
      { a: 5, b: 6, order: 1 },
      { a: 6, b: 7, order: 1 },
      { a: 7, b: 8, order: 1 },
      { a: 8, b: 9, order: 1 },
      { a: 9, b: 4, order: 1 },
    ]
    const g: MolGraph = { atoms: ids.map(() => ({ element: 'C', hCount: 1 })), bonds }
    expect(findRings(g)).toHaveLength(2)
    const pts = layout2D(g)
    for (const b of bonds) expect(Math.abs(dist(pts[b.a], pts[b.b]) - 1)).toBeLessThan(0.01)
    expect(pairwiseMin(pts)).toBeGreaterThanOrEqual(CLASH_DISTANCE)
  })
})

describe('boundingBox', () => {
  it('spans the extreme points', () => {
    const box = boundingBox([
      { x: -1, y: 2 },
      { x: 3, y: -4 },
      { x: 0, y: 0 },
    ])
    expect(box.width).toBe(4)
    expect(box.height).toBe(6)
    expect(box.minX).toBe(-1)
    expect(box.maxY).toBe(2)
  })
})

describe('sp atoms are linear', () => {
  const angleAt = (p: { x: number; y: number }[], a: number, b: number, c: number) => {
    const u = { x: p[a].x - p[b].x, y: p[a].y - p[b].y }
    const v = { x: p[c].x - p[b].x, y: p[c].y - p[b].y }
    const cos = (u.x * v.x + u.y * v.y) / (Math.hypot(u.x, u.y) * Math.hypot(v.x, v.y))
    return (Math.acos(Math.max(-1, Math.min(1, cos))) * 180) / Math.PI
  }
  it('draws C–C≡C–C in a straight line in a chain and on a branch', () => {
    const p = layout2D(parseSmiles('CC#CC'))
    expect(angleAt(p, 0, 1, 2)).toBeCloseTo(180, 5)
    expect(angleAt(p, 1, 2, 3)).toBeCloseTo(180, 5)
    const q = layout2D(parseSmiles('CCC#CCC'))
    expect(angleAt(q, 1, 2, 3)).toBeCloseTo(180, 5)
    expect(angleAt(q, 2, 3, 4)).toBeCloseTo(180, 5)
    expect(angleAt(q, 0, 1, 2)).toBeCloseTo(120, 5)
    const r = layout2D(parseSmiles('CC(C)(C)C#C'))
    expect(angleAt(r, 1, 4, 5)).toBeCloseTo(180, 5)
  })
  it('draws the central carbon of an allene at 180°', () => {
    const p = layout2D(parseSmiles('C=C=C'))
    expect(angleAt(p, 0, 1, 2)).toBeCloseTo(180, 5)
  })
})
