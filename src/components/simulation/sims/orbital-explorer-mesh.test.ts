import { describe, expect, it } from 'vitest'
import {
  clipTriangles,
  openEdgeCount,
  surfaceNets,
  type ScalarVolume,
} from './orbital-explorer-mesh'

/** A volume sampling f(x, y, z) on a size³ grid spanning −half … +half, offset by half a step. */
function volumeOf(size: number, half: number, f: (x: number, y: number, z: number) => number): ScalarVolume {
  const step = (2 * half) / size
  const coord = (i: number) => -half + (i + 0.5) * step
  const values = new Float64Array(size ** 3)
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      for (let k = 0; k < size; k++) {
        values[(i * size + j) * size + k] = f(coord(i), coord(j), coord(k))
      }
    }
  }
  return { size, origin: -half + step / 2, step, values }
}

describe('surfaceNets', () => {
  it('builds a closed sphere whose vertices sit on the true radius', () => {
    const radius = 1.5
    const volume = volumeOf(40, 2.4, (x, y, z) => Math.hypot(x, y, z) - radius)
    const mesh = surfaceNets(volume, 0)
    expect(mesh.indices.length).toBeGreaterThan(500)
    expect(openEdgeCount(mesh)).toBe(0)
    for (let v = 0; v < mesh.positions.length / 3; v++) {
      const r = Math.hypot(mesh.positions[v * 3], mesh.positions[v * 3 + 1], mesh.positions[v * 3 + 2])
      expect(Math.abs(r - radius)).toBeLessThan(0.08)
    }
  })

  it('points normals outward on a sphere', () => {
    // Positive inside the sphere, as for a lobe, so the outward normal is the negated gradient.
    const volume = volumeOf(32, 2, (x, y, z) => 1 - Math.hypot(x, y, z))
    const mesh = surfaceNets(volume, 0)
    for (let v = 0; v < mesh.positions.length / 3; v++) {
      const [x, y, z] = [mesh.positions[v * 3], mesh.positions[v * 3 + 1], mesh.positions[v * 3 + 2]]
      const [nx, ny, nz] = [mesh.normals[v * 3], mesh.normals[v * 3 + 1], mesh.normals[v * 3 + 2]]
      const dot = (x * nx + y * ny + z * nz) / Math.hypot(x, y, z)
      expect(dot).toBeGreaterThan(0.9)
    }
  })

  it('winds every triangle outward, so front-face culling keeps the whole surface', () => {
    // Field positive inside the sphere: the outward side is where the field drops.
    const mesh = surfaceNets(volumeOf(36, 2, (x, y, z) => 1.2 - Math.hypot(x, y, z)), 0)
    let inward = 0
    for (let t = 0; t < mesh.indices.length; t += 3) {
      const [a, b, c] = [mesh.indices[t], mesh.indices[t + 1], mesh.indices[t + 2]]
      const P = (v: number) => [mesh.positions[v * 3], mesh.positions[v * 3 + 1], mesh.positions[v * 3 + 2]]
      const [pa, pb, pc] = [P(a), P(b), P(c)]
      const u = [pb[0] - pa[0], pb[1] - pa[1], pb[2] - pa[2]]
      const w = [pc[0] - pa[0], pc[1] - pa[1], pc[2] - pa[2]]
      const normal = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]]
      const centre = [(pa[0] + pb[0] + pc[0]) / 3, (pa[1] + pb[1] + pc[1]) / 3, (pa[2] + pb[2] + pc[2]) / 3]
      if (normal[0] * centre[0] + normal[1] * centre[1] + normal[2] * centre[2] <= 0) inward++
    }
    expect(inward).toBe(0)
  })

  it('returns an empty mesh when the surface is outside the grid', () => {
    const volume = volumeOf(16, 1, (x, y, z) => Math.hypot(x, y, z) - 5)
    expect(surfaceNets(volume, 0).indices.length).toBe(0)
  })

  it('produces a torus: a closed surface with a hole, as for the d_z² ring', () => {
    // Torus with major radius 1.2 and minor radius 0.4 around the z-axis.
    const torus = (x: number, y: number, z: number) => {
      const q = Math.hypot(Math.hypot(x, y) - 1.2, z)
      return q - 0.4
    }
    const mesh = surfaceNets(volumeOf(56, 2.2, torus), 0)
    expect(openEdgeCount(mesh)).toBe(0)
    // Euler characteristic of a torus is 0: vertices − edges + faces = 0.
    const edges = new Set<string>()
    for (let t = 0; t < mesh.indices.length; t += 3) {
      for (let e = 0; e < 3; e++) {
        const a = mesh.indices[t + e]
        const b = mesh.indices[t + ((e + 1) % 3)]
        edges.add(a < b ? `${a},${b}` : `${b},${a}`)
      }
    }
    const vertices = mesh.positions.length / 3
    const faces = mesh.indices.length / 3
    expect(vertices - edges.size + faces).toBe(0)
  })
})

describe('clipTriangles and splitBySign', () => {
  it('clips a plane to a disc by keeping triangles inside a radius', () => {
    const plane = volumeOf(40, 3, (x) => x) // nodal plane x = 0
    const mesh = surfaceNets(plane, 0)
    const disc = clipTriangles(mesh, (x, y, z) => Math.hypot(y, z) < 1.5)
    expect(disc.indices.length).toBeGreaterThan(0)
    expect(disc.indices.length).toBeLessThan(mesh.indices.length)
    for (let v = 0; v < disc.indices.length; v++) {
      const i = disc.indices[v]
      expect(Math.hypot(disc.positions[i * 3 + 1], disc.positions[i * 3 + 2])).toBeLessThan(1.5 + 0.1)
    }
  })
})
