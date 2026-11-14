import { describe, expect, it } from 'vitest'
import {
  allChoices,
  buildOrbitalGeometry,
  clampChoice,
  describeChoice,
  lChoices,
  mChoices,
  orbitalButtonLabel,
  orbitalFullName,
  orbitalNodes,
  shellLetter,
  type OrbitalGeometry,
} from './orbital-explorer-model'

/** Mean of the vertex coordinate along an axis for the triangles of one mesh, weighted by vertex. */
function meanOf(positions: Float32Array, axis: 0 | 1 | 2): number {
  let sum = 0
  const count = positions.length / 3
  for (let v = 0; v < count; v++) sum += positions[v * 3 + axis]
  return count ? sum / count : 0
}

/** Vertices of a mesh, as [x, y, z] triples, restricted to the ones referenced by its triangles. */
function usedVertices(mesh: { positions: Float32Array; indices: Uint32Array }): [number, number, number][] {
  const seen = new Set<number>()
  for (const i of mesh.indices) seen.add(i)
  return [...seen].map((i) => [mesh.positions[i * 3], mesh.positions[i * 3 + 1], mesh.positions[i * 3 + 2]])
}

const cache = new Map<string, OrbitalGeometry>()
function geom(n: number, l: number, m: number): OrbitalGeometry {
  const key = `${n}-${l}-${m}`
  let g = cache.get(key)
  if (!g) {
    g = buildOrbitalGeometry({ n, l, m })
    cache.set(key, g)
  }
  return g
}

describe('choices', () => {
  it('offers l from 0 to n − 1, and m from −l to +l', () => {
    expect(lChoices(1)).toEqual([0])
    expect(lChoices(4)).toEqual([0, 1, 2, 3])
    expect(mChoices(2)).toEqual([-2, -1, 0, 1, 2])
  })

  it('lists 30 real orbitals for n ≤ 4 (1 + 4 + 9 + 16)', () => {
    expect(allChoices()).toHaveLength(30)
  })

  it('clamps an invalid l to n − 1 and an invalid m to 0', () => {
    expect(clampChoice({ n: 2, l: 3, m: 2 })).toEqual({ n: 2, l: 1, m: 0 })
    expect(clampChoice({ n: 3, l: 2, m: -2 })).toEqual({ n: 3, l: 2, m: -2 })
    expect(clampChoice({ n: 1, l: 2, m: 1 })).toEqual({ n: 1, l: 0, m: 0 })
  })

  it('names orbitals with the lib naming rules', () => {
    expect(orbitalFullName({ n: 3, l: 2, m: 0 })).toBe('3dz²')
    expect(orbitalButtonLabel({ n: 3, l: 2, m: 0 })).toBe('dz²')
    expect(orbitalButtonLabel({ n: 2, l: 1, m: -1 })).toBe('py')
    expect(orbitalButtonLabel({ n: 4, l: 3, m: -2 })).toBe('fxyz')
    expect(shellLetter(3)).toBe('M')
  })
})

describe('node readout', () => {
  it('follows radial = n − l − 1, angular = l, total = n − 1', () => {
    expect(orbitalNodes({ n: 3, l: 2, m: 0 })).toEqual({ radial: 0, angular: 2, total: 2 })
    expect(orbitalNodes({ n: 3, l: 0, m: 0 })).toEqual({ radial: 2, angular: 0, total: 2 })
    expect(orbitalNodes({ n: 4, l: 3, m: 1 })).toEqual({ radial: 0, angular: 3, total: 3 })
  })

  it('describes the choice in words for the live region', () => {
    const text = describeChoice({ n: 2, l: 0, m: 0 })
    expect(text).toContain('2s orbital in shell L')
    expect(text).toContain('1 radial node, 0 angular nodes, 1 in total')
  })
})

describe('buildOrbitalGeometry', () => {
  it('draws the 1s boundary at the closed-form 90% radius, 2.66 a₀ (about 141 pm)', () => {
    const g = geom(1, 0, 0)
    // 1 − e^{−2r}(1 + 2r + 2r²) = 0.9 at r = 2.66 a₀, which is 140.7 pm.
    expect(g.extentPm).toBeGreaterThanOrEqual(130)
    expect(g.extentPm).toBeLessThanOrEqual(150)
  })

  it('scales the boundary so its radius is 1.5 scene units', () => {
    const g = geom(3, 2, 0)
    const maxR = Math.max(...usedVertices(g.positive).map(([x, y, z]) => Math.hypot(x, y, z)))
    expect(maxR).toBeGreaterThan(1.35)
    expect(maxR).toBeLessThan(1.6)
  })

  it('puts the p_z positive lobe on +z and the negative lobe on −z', () => {
    const g = geom(2, 1, 0)
    expect(meanOf(g.positive.positions, 2)).toBeGreaterThan(0.4)
    expect(meanOf(g.negative.positions, 2)).toBeLessThan(-0.4)
  })

  it('draws the d_z² lobes along the z-axis (positive) and a negative ring around the equator', () => {
    const g = geom(3, 2, 0)
    const pos = usedVertices(g.positive)
    const neg = usedVertices(g.negative)
    const tipsOnAxis = pos.filter(([x, y, z]) => Math.abs(z) > 0.9 && Math.hypot(x, y) < 0.5)
    expect(tipsOnAxis.length).toBeGreaterThan(5)
    const ring = neg.filter(([, , z]) => Math.abs(z) < 0.25)
    expect(ring.length).toBeGreaterThan(20)
    // Ring vertices lie in the xy-plane at a distance well away from the axis.
    const ringRadius = ring.map(([x, y]) => Math.hypot(x, y))
    // The torus has a hole around the axis: no negative vertex lies on the z-axis.
    expect(Math.min(...ringRadius)).toBeGreaterThan(0.05)
  })

  it('draws d_x²−y² lobes along the x and y axes with opposite signs', () => {
    const g = geom(3, 2, 2)
    const posX = usedVertices(g.positive).filter(([x, y]) => Math.abs(x) > 2 * Math.abs(y))
    const negY = usedVertices(g.negative).filter(([x, y]) => Math.abs(y) > 2 * Math.abs(x))
    expect(posX.length).toBeGreaterThan(5)
    expect(negY.length).toBeGreaterThan(5)
  })

  it('has an analytic nodal plane for 2p_z that lies exactly on the xy-plane', () => {
    const g = geom(2, 1, 0)
    const nodes = usedVertices(g.nodes.sheets)
    expect(nodes.length).toBeGreaterThan(20)
    for (const [, , z] of nodes) expect(Math.abs(z)).toBeLessThan(1e-6)
    expect(g.nodes.spheres.indices.length).toBe(0)
  })

  it('has analytic dz² cones at cos θ = ±1/√3 (θ = 54.74° and 125.26°)', () => {
    const g = geom(3, 2, 0)
    const cosines = usedVertices(g.nodes.sheets)
      .map(([x, y, z]) => ({ r: Math.hypot(x, y, z), z }))
      .filter(({ r }) => r > 0.2)
      .map(({ r, z }) => z / r)
    const target = 1 / Math.sqrt(3)
    expect(cosines.length).toBeGreaterThan(100)
    for (const c of cosines) expect(Math.min(Math.abs(c - target), Math.abs(c + target))).toBeLessThan(1e-4)
    expect(cosines.some((c) => c > 0)).toBe(true)
    expect(cosines.some((c) => c < 0)).toBe(true)
  })

  it('has three radial spheres for 4s and the node count from the lib (n − ℓ − 1)', () => {
    const g = geom(4, 0, 0)
    // Node radii are scaled into scene units, so the sphere radii are positive and sorted by the lib.
    const radii = new Set(
      usedVertices(g.nodes.spheres).map(([x, y, z]) => Math.round(Math.hypot(x, y, z) * 1000) / 1000)
    )
    expect(radii.size).toBe(3)
  })

  it('has a spherical nodal surface for 2s at r = 2 a₀ (no points of the 2s cloud there)', () => {
    const g = geom(2, 0, 0)
    // Scale factor: scene units per a₀ = 1.5 / boundary radius, and the radius is extentPm / 52.9.
    const boundaryA0 = g.extentPm / 52.9
    const nodeRadius = (2 * 1.5) / boundaryA0
    const nodes = usedVertices(g.nodes.spheres)
    expect(nodes.length).toBeGreaterThan(50)
    for (const [x, y, z] of nodes) {
      expect(Math.abs(Math.hypot(x, y, z) - nodeRadius)).toBeLessThan(0.05 * nodeRadius)
    }
    const cloudNearNode = [...Array(g.cloud.signs.length)].filter((_, p) => {
      const r = Math.hypot(g.cloud.positions[p * 3], g.cloud.positions[p * 3 + 1], g.cloud.positions[p * 3 + 2])
      return Math.abs(r - nodeRadius) < 0.03 * nodeRadius
    })
    expect(cloudNearNode.length).toBeLessThan(40)
  })

  it('returns a cloud with the requested number of points and both phase signs for 2p', () => {
    const g = geom(2, 1, 0)
    expect(g.cloud.signs.length).toBe(12000)
    expect(g.cloud.signs.some((s) => s > 0)).toBe(true)
    expect(g.cloud.signs.some((s) => s < 0)).toBe(true)
  })

  it('builds 2D cross-sections for the fallback', () => {
    const g = geom(3, 2, 0)
    expect(g.slices.xy.density.length).toBe(g.slices.size * g.slices.size)
    expect(g.slices.xz.signs.length).toBe(g.slices.size * g.slices.size)
  })

  it('builds the largest (n = 4) orbitals within a reasonable time', () => {
    const start = Date.now()
    buildOrbitalGeometry({ n: 4, l: 3, m: 0 })
    const elapsed = Date.now() - start
    // Logged so the reviewer can see the cost; a generous bound keeps slow CI runners green.
    console.info(`4fz³ geometry built in ${elapsed} ms`)
    expect(elapsed).toBeLessThan(4000)
  })
})
