import { describe, expect, it } from 'vitest'
import {
  OCTA_EDGES,
  OCTA_MIRROR_DIAG03_VERTS,
  OCTA_MIRROR_YZ_VERTS,
  OCTA_VERTS,
  TETRA_EDGES,
  TETRA_MIRROR_PLANE_VERTS,
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

  it('3D symmetry mirror planes contain their expected vertices and rotate with yaw', () => {
    // Tetrahedral mirror plane lies in z = 0, containing M, TETRA_VERTS[0], and TETRA_VERTS[1]
    for (const v of TETRA_MIRROR_PLANE_VERTS) {
      expect(v.z).toBe(0)
    }
    expect(TETRA_VERTS[0].z).toBe(0)
    expect(TETRA_VERTS[1].z).toBe(0)

    // Octahedral YZ plane lies in x = 0, containing M and axial vertices 0, 1
    for (const v of OCTA_MIRROR_YZ_VERTS) {
      expect(v.x).toBe(0)
    }
    expect(OCTA_VERTS[0].x).toBe(0)
    expect(OCTA_VERTS[1].x).toBe(0)

    // Octahedral diagonal plane lies in x = z, containing vertices 0, 1, 3, 5
    for (const v of OCTA_MIRROR_DIAG03_VERTS) {
      expect(v.x).toBeCloseTo(v.z, 5)
    }
    expect(OCTA_VERTS[3].x).toBeCloseTo(OCTA_VERTS[3].z, 5)
    expect(OCTA_VERTS[5].x).toBeCloseTo(OCTA_VERTS[5].z, 5)

    // Projected plane corners actually change when yawDeg changes
    const pA = project3D(TETRA_MIRROR_PLANE_VERTS[1], 130, 106, 62, 22, 14)
    const pB = project3D(TETRA_MIRROR_PLANE_VERTS[1], 130, 106, 62, 112, 14)
    expect(Math.hypot(pA.x - pB.x, pA.y - pB.y)).toBeGreaterThan(20)
  })
})
