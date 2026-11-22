import { describe, expect, it } from 'vitest'
import {
  OCTA_EDGES,
  OCTA_VERTS,
  TETRA_EDGES,
  TETRA_VERTS,
  chelateArcPath,
  dist3D,
  mirrorX,
  project3D,
  rotate3D,
} from './complex-geometry'

describe('complex-geometry', () => {
  it('regular tetrahedron has all 6 pairwise distances equal', () => {
    const dists = TETRA_EDGES.map(([i, j]) => dist3D(TETRA_VERTS[i], TETRA_VERTS[j]))
    const first = dists[0]
    for (const d of dists) {
      expect(d).toBeCloseTo(first, 3)
    }
  })

  it('regular octahedron has 6 unit vertices and 12 equal edges', () => {
    expect(OCTA_VERTS).toHaveLength(6)
    expect(OCTA_EDGES).toHaveLength(12)
    for (const v of OCTA_VERTS) {
      expect(Math.hypot(v.x, v.y, v.z)).toBeCloseTo(1, 3)
    }
    for (const [i, j] of OCTA_EDGES) {
      expect(dist3D(OCTA_VERTS[i], OCTA_VERTS[j])).toBeCloseTo(Math.SQRT2, 3)
    }
  })

  it('rotation preserves vector length and mirrorX negates x', () => {
    const p = { x: 0.6, y: -0.3, z: 0.74 }
    const r = rotate3D(p, 47, 23)
    expect(Math.hypot(r.x, r.y, r.z)).toBeCloseTo(Math.hypot(p.x, p.y, p.z), 5)
    expect(mirrorX(p)).toEqual({ x: -0.6, y: -0.3, z: 0.74 })
  })

  it('project3D and chelateArcPath return finite SVG coordinates', () => {
    const a = project3D(OCTA_VERTS[0], 100, 100, 50)
    const b = project3D(OCTA_VERTS[2], 100, 100, 50)
    const arc = chelateArcPath(a, b, 100, 100)
    expect(arc.d).toMatch(/^M /)
    expect(Number.isFinite(arc.labelX)).toBe(true)
    expect(Number.isFinite(arc.labelY)).toBe(true)
  })
})
