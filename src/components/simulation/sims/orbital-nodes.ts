/**
 * Nodal surfaces of a real orbital, built analytically rather than from a voxel grid, so
 * they are smooth. The angular nodes are exact:
 * - each root cos θ = c of the θ part is a cone about the z-axis (c = 0 is the xy-plane);
 * - each nodal azimuth φ is a half-plane through the z-axis, which together with its
 *   opposite is a full plane.
 * The radial nodes are spheres at the computed node radii. Sheets are trimmed to a radius,
 * and a rim (line segments) outlines each sheet so it reads as a disc or cone edge.
 */

import { angularRootsCosTheta, nodalPlaneAngles } from '@/lib/chem/orbital-density'
import type { TriangleMesh } from './orbital-explorer-mesh'

export interface NodalSurfaces {
  /** Planes and cones, trimmed to the radius. Drawn as a faint fill, double-sided. */
  sheets: TriangleMesh
  /** Radial nodes: one sphere per node radius. */
  spheres: TriangleMesh
  /** Rim segments: six numbers per segment (x, y, z of each end). */
  rims: Float32Array
}

/** Sides and rings used for smooth sheets and spheres. */
const SECTORS = 96
const CONE_RINGS = 24
const SPHERE_LAT = 32
const SPHERE_LON = 56

class MeshBuilder {
  readonly positions: number[] = []
  readonly indices: number[] = []
  readonly rims: number[] = []

  vertex(x: number, y: number, z: number): number {
    this.positions.push(x, y, z)
    return this.positions.length / 3 - 1
  }

  triangle(a: number, b: number, c: number): void {
    this.indices.push(a, b, c)
  }

  segment(ax: number, ay: number, az: number, bx: number, by: number, bz: number): void {
    this.rims.push(ax, ay, az, bx, by, bz)
  }

  toMesh(): TriangleMesh {
    return {
      positions: new Float32Array(this.positions),
      normals: new Float32Array(this.positions.length),
      indices: new Uint32Array(this.indices),
    }
  }
}

/** A cone about +z at cos θ = c, trimmed to `radius`. For c = 0 it is the xy-plane disc. */
function addCone(b: MeshBuilder, c: number, radius: number): void {
  const sinT = Math.sqrt(Math.max(0, 1 - c * c))
  const ring = (k: number, j: number) => {
    const rho = (radius * k) / CONE_RINGS
    const phi = (2 * Math.PI * (j % SECTORS)) / SECTORS
    return [rho * sinT * Math.cos(phi), rho * sinT * Math.sin(phi), rho * c] as const
  }
  const index: number[][] = []
  for (let k = 0; k <= CONE_RINGS; k++) {
    const row: number[] = []
    for (let j = 0; j < SECTORS; j++) {
      const [x, y, z] = ring(k, j)
      row.push(b.vertex(x, y, z))
    }
    index.push(row)
  }
  for (let k = 0; k < CONE_RINGS; k++) {
    for (let j = 0; j < SECTORS; j++) {
      const j1 = (j + 1) % SECTORS
      b.triangle(index[k][j], index[k][j1], index[k + 1][j1])
      b.triangle(index[k][j], index[k + 1][j1], index[k + 1][j])
    }
  }
  for (let j = 0; j < SECTORS; j++) {
    const [ax, ay, az] = ring(CONE_RINGS, j)
    const [bx, by, bz] = ring(CONE_RINGS, j + 1)
    b.segment(ax, ay, az, bx, by, bz)
  }
}

/** The full plane through the z-axis at azimuth φ (and φ + π), as a disc of `radius`. */
function addPlane(b: MeshBuilder, phi: number, radius: number): void {
  const ux = Math.cos(phi)
  const uy = Math.sin(phi)
  const point = (alpha: number) => {
    const s = Math.cos(alpha)
    const t = Math.sin(alpha)
    return [radius * s * ux, radius * s * uy, radius * t] as const
  }
  const centre = b.vertex(0, 0, 0)
  const rim: number[] = []
  for (let j = 0; j < SECTORS; j++) {
    const [x, y, z] = point((2 * Math.PI * j) / SECTORS)
    rim.push(b.vertex(x, y, z))
  }
  for (let j = 0; j < SECTORS; j++) {
    b.triangle(centre, rim[j], rim[(j + 1) % SECTORS])
    const [ax, ay, az] = point((2 * Math.PI * j) / SECTORS)
    const [bx, by, bz] = point((2 * Math.PI * (j + 1)) / SECTORS)
    b.segment(ax, ay, az, bx, by, bz)
  }
}

/** A sphere of radius r, as a latitude-longitude mesh. */
function addSphere(b: MeshBuilder, radius: number): void {
  const grid: number[][] = []
  for (let i = 0; i <= SPHERE_LAT; i++) {
    const theta = (Math.PI * i) / SPHERE_LAT
    const row: number[] = []
    for (let j = 0; j <= SPHERE_LON; j++) {
      const phi = (2 * Math.PI * j) / SPHERE_LON
      row.push(
        b.vertex(
          radius * Math.sin(theta) * Math.cos(phi),
          radius * Math.sin(theta) * Math.sin(phi),
          radius * Math.cos(theta)
        )
      )
    }
    grid.push(row)
  }
  for (let i = 0; i < SPHERE_LAT; i++) {
    for (let j = 0; j < SPHERE_LON; j++) {
      b.triangle(grid[i][j], grid[i + 1][j], grid[i + 1][j + 1])
      b.triangle(grid[i][j], grid[i + 1][j + 1], grid[i][j + 1])
    }
  }
}

/**
 * The nodal surfaces of the real orbital (l, m), in the orbital's own frame where z is the
 * chemistry z-axis. `radius` trims the sheets (scene units). `radialNodes` are the node
 * radii in the same units.
 *
 * @throws {RangeError} From the angular lib if (l, m) is invalid
 */
export function analyticNodes(l: number, m: number, radius: number, radialNodes: number[]): NodalSurfaces {
  const sheets = new MeshBuilder()
  for (const c of angularRootsCosTheta(l, m)) addCone(sheets, c, radius)
  for (const phi of nodalPlaneAngles(m)) addPlane(sheets, phi, radius)

  const spheres = new MeshBuilder()
  for (const r of radialNodes) addSphere(spheres, r)

  const sheetMesh = sheets.toMesh()
  return {
    sheets: sheetMesh,
    spheres: spheres.toMesh(),
    rims: Float32Array.from(sheets.rims),
  }
}
