/**
 * Isosurface extraction for the orbital explorer, by surface nets. Each cell that the
 * surface crosses gets one vertex, placed at the average of its edge crossings, and each
 * grid edge that changes sign gets one quad joining the four cells around it. The result is
 * a closed, watertight mesh for any surface that stays inside the grid, with no lookup table
 * to get wrong. Normals come from the gradient of the field.
 */

/** A cubic grid of field values. Point (i, j, k) sits at origin + i·step on each axis. */
export interface ScalarVolume {
  /** Points per side. */
  size: number
  /** Coordinate of index 0 on every axis. */
  origin: number
  /** Spacing between points. */
  step: number
  /** Field value at each point, indexed (i · size + j) · size + k. */
  values: Float64Array
}

/** An indexed triangle mesh. Positions and normals hold three numbers per vertex. */
export interface TriangleMesh {
  positions: Float32Array
  normals: Float32Array
  indices: Uint32Array
}

/** Corner offsets of a cell, in the order used by the edge tables below. */
const CORNER_DX = [0, 1, 0, 1, 0, 1, 0, 1]
const CORNER_DY = [0, 0, 1, 1, 0, 0, 1, 1]
const CORNER_DZ = [0, 0, 0, 0, 1, 1, 1, 1]

/** The 12 cell edges as pairs of corner indices: four along x, four along y, four along z. */
const EDGE_A = [0, 2, 4, 6, 0, 1, 4, 5, 0, 1, 2, 3]
const EDGE_B = [1, 3, 5, 7, 2, 3, 6, 7, 4, 5, 6, 7]

/** The empty mesh, returned when the surface does not cross the grid. */
function emptyMesh(): TriangleMesh {
  return { positions: new Float32Array(0), normals: new Float32Array(0), indices: new Uint32Array(0) }
}

/** Central-difference gradient of the volume, one array per axis, using one-sided differences at the edges. */
function gradientVolumes(volume: ScalarVolume): [Float64Array, Float64Array, Float64Array] {
  const { size, values, step } = volume
  const gx = new Float64Array(values.length)
  const gy = new Float64Array(values.length)
  const gz = new Float64Array(values.length)
  const last = size - 1
  for (let i = 0; i < size; i++) {
    const i0 = Math.max(0, i - 1)
    const i1 = Math.min(last, i + 1)
    for (let j = 0; j < size; j++) {
      const j0 = Math.max(0, j - 1)
      const j1 = Math.min(last, j + 1)
      for (let k = 0; k < size; k++) {
        const k0 = Math.max(0, k - 1)
        const k1 = Math.min(last, k + 1)
        const idx = (i * size + j) * size + k
        gx[idx] = (values[(i1 * size + j) * size + k] - values[(i0 * size + j) * size + k]) / ((i1 - i0) * step)
        gy[idx] = (values[(i * size + j1) * size + k] - values[(i * size + j0) * size + k]) / ((j1 - j0) * step)
        gz[idx] = (values[(i * size + j) * size + k1] - values[(i * size + j) * size + k0]) / ((k1 - k0) * step)
      }
    }
  }
  return [gx, gy, gz]
}

/** Trilinear interpolation of a grid array at fractional grid coordinates. */
function trilinear(data: Float64Array, size: number, fi: number, fj: number, fk: number): number {
  const i0 = Math.min(size - 2, Math.max(0, Math.floor(fi)))
  const j0 = Math.min(size - 2, Math.max(0, Math.floor(fj)))
  const k0 = Math.min(size - 2, Math.max(0, Math.floor(fk)))
  const ti = Math.min(1, Math.max(0, fi - i0))
  const tj = Math.min(1, Math.max(0, fj - j0))
  const tk = Math.min(1, Math.max(0, fk - k0))
  const at = (i: number, j: number, k: number) => data[(i * size + j) * size + k]
  const c00 = at(i0, j0, k0) * (1 - ti) + at(i0 + 1, j0, k0) * ti
  const c10 = at(i0, j0 + 1, k0) * (1 - ti) + at(i0 + 1, j0 + 1, k0) * ti
  const c01 = at(i0, j0, k0 + 1) * (1 - ti) + at(i0 + 1, j0, k0 + 1) * ti
  const c11 = at(i0, j0 + 1, k0 + 1) * (1 - ti) + at(i0 + 1, j0 + 1, k0 + 1) * ti
  const c0 = c00 * (1 - tj) + c10 * tj
  const c1 = c01 * (1 - tj) + c11 * tj
  return c0 * (1 - tk) + c1 * tk
}

/**
 * Extracts the surface where the field equals `level`. The surface must lie inside the
 * grid: a surface that touches the boundary is left open there.
 *
 * Output coordinates are in the same units as `origin` and `step`. Normals are the negated
 * gradient, so they point away from the side where the field is above `level`. For a lobe
 * (field = |ψ|² − threshold, positive inside) they point outward.
 */
export function surfaceNets(volume: ScalarVolume, level: number): TriangleMesh {
  const { size, origin, step, values } = volume
  if (size < 3) return emptyMesh()
  const cells = size - 1
  const cellIndex = new Int32Array(cells * cells * cells).fill(-1)
  const positions: number[] = []
  const grid = (i: number, j: number, k: number) => (i * size + j) * size + k
  const cellId = (i: number, j: number, k: number) => (i * cells + j) * cells + k

  // One vertex per cell that the surface crosses. The corner values are read into a reused
  // buffer, so the loop allocates nothing per cell.
  const vals = new Float64Array(8)
  for (let i = 0; i < cells; i++) {
    for (let j = 0; j < cells; j++) {
      for (let k = 0; k < cells; k++) {
        let below = 0
        for (let c = 0; c < 8; c++) {
          const v = values[grid(i + CORNER_DX[c], j + CORNER_DY[c], k + CORNER_DZ[c])] - level
          vals[c] = v
          if (v < 0) below++
        }
        if (below === 0 || below === 8) continue
        let sx = 0
        let sy = 0
        let sz = 0
        let count = 0
        for (let e = 0; e < 12; e++) {
          const a = EDGE_A[e]
          const b = EDGE_B[e]
          const va = vals[a]
          const vb = vals[b]
          if ((va < 0) === (vb < 0)) continue
          const t = va / (va - vb)
          sx += CORNER_DX[a] + (CORNER_DX[b] - CORNER_DX[a]) * t
          sy += CORNER_DY[a] + (CORNER_DY[b] - CORNER_DY[a]) * t
          sz += CORNER_DZ[a] + (CORNER_DZ[b] - CORNER_DZ[a]) * t
          count++
        }
        cellIndex[cellId(i, j, k)] = positions.length / 3
        positions.push(
          origin + (i + sx / count) * step,
          origin + (j + sy / count) * step,
          origin + (k + sz / count) * step
        )
      }
    }
  }

  if (positions.length === 0) return emptyMesh()

  const indices: number[] = []
  const pushQuad = (c0: number, c1: number, c2: number, c3: number, flip: boolean) => {
    // A quad whose cells are missing is skipped whole, so triangles never shift out of step.
    if (c0 < 0 || c1 < 0 || c2 < 0 || c3 < 0) return
    if (flip) {
      indices.push(c0, c3, c2, c0, c2, c1)
    } else {
      indices.push(c0, c1, c2, c0, c2, c3)
    }
  }

  // One quad per sign-changing grid edge, joining the four cells that share it. Each cycle is
  // counter-clockwise about its own axis (+x for x-edges, −y for y-edges, +z for z-edges), so
  // the flip depends on the axis: every triangle then winds outward.
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      for (let k = 0; k < size; k++) {
        const v0 = values[grid(i, j, k)] - level
        // Edge along +x: needs j and k in 1..size-2 so that four cells surround it.
        if (i < cells && j >= 1 && j < cells && k >= 1 && k < cells) {
          const v1 = values[grid(i + 1, j, k)] - level
          if ((v0 < 0) !== (v1 < 0)) {
            pushQuad(
              cellIndex[cellId(i, j - 1, k - 1)],
              cellIndex[cellId(i, j, k - 1)],
              cellIndex[cellId(i, j, k)],
              cellIndex[cellId(i, j - 1, k)],
              v0 < 0
            )
          }
        }
        // Edge along +y.
        if (j < cells && i >= 1 && i < cells && k >= 1 && k < cells) {
          const v1 = values[grid(i, j + 1, k)] - level
          if ((v0 < 0) !== (v1 < 0)) {
            pushQuad(
              cellIndex[cellId(i - 1, j, k - 1)],
              cellIndex[cellId(i, j, k - 1)],
              cellIndex[cellId(i, j, k)],
              cellIndex[cellId(i - 1, j, k)],
              v0 >= 0
            )
          }
        }
        // Edge along +z.
        if (k < cells && i >= 1 && i < cells && j >= 1 && j < cells) {
          const v1 = values[grid(i, j, k + 1)] - level
          if ((v0 < 0) !== (v1 < 0)) {
            pushQuad(
              cellIndex[cellId(i - 1, j - 1, k)],
              cellIndex[cellId(i, j - 1, k)],
              cellIndex[cellId(i, j, k)],
              cellIndex[cellId(i - 1, j, k)],
              v0 < 0
            )
          }
        }
      }
    }
  }

  // Normals: negated gradient of the field at each vertex, interpolated from the grid.
  const [gx, gy, gz] = gradientVolumes(volume)
  const vertexCount = positions.length / 3
  const normals = new Float32Array(vertexCount * 3)
  for (let v = 0; v < vertexCount; v++) {
    const fi = (positions[v * 3] - origin) / step
    const fj = (positions[v * 3 + 1] - origin) / step
    const fk = (positions[v * 3 + 2] - origin) / step
    const nx = -trilinear(gx, size, fi, fj, fk)
    const ny = -trilinear(gy, size, fi, fj, fk)
    const nz = -trilinear(gz, size, fi, fj, fk)
    const len = Math.hypot(nx, ny, nz) || 1
    normals[v * 3] = nx / len
    normals[v * 3 + 1] = ny / len
    normals[v * 3 + 2] = nz / len
  }

  return {
    positions: new Float32Array(positions),
    normals,
    indices: new Uint32Array(indices),
  }
}

/**
 * Keeps only triangles whose three vertices all satisfy `keep`. Used to trim a nodal
 * surface to the region around the orbital, so a nodal plane becomes a disc.
 */
export function clipTriangles(mesh: TriangleMesh, keep: (x: number, y: number, z: number) => boolean): TriangleMesh {
  const vertexOk = new Uint8Array(mesh.positions.length / 3)
  for (let v = 0; v < vertexOk.length; v++) {
    vertexOk[v] = keep(mesh.positions[v * 3], mesh.positions[v * 3 + 1], mesh.positions[v * 3 + 2]) ? 1 : 0
  }
  const kept: number[] = []
  for (let t = 0; t < mesh.indices.length; t += 3) {
    const a = mesh.indices[t]
    const b = mesh.indices[t + 1]
    const c = mesh.indices[t + 2]
    if (vertexOk[a] && vertexOk[b] && vertexOk[c]) kept.push(a, b, c)
  }
  return { positions: mesh.positions, normals: mesh.normals, indices: new Uint32Array(kept) }
}

/** Number of edges that are used by exactly one triangle. Zero means the mesh is closed. */
export function openEdgeCount(mesh: TriangleMesh): number {
  const counts = new Map<string, number>()
  for (let t = 0; t < mesh.indices.length; t += 3) {
    const tri = [mesh.indices[t], mesh.indices[t + 1], mesh.indices[t + 2]]
    for (let e = 0; e < 3; e++) {
      const a = tri[e]
      const b = tri[(e + 1) % 3]
      const key = a < b ? `${a},${b}` : `${b},${a}`
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
  }
  let open = 0
  for (const count of counts.values()) if (count !== 2) open++
  return open
}

/**
 * Returns the same triangles with only the vertices they use, renumbered from zero. A lobe
 * split from a whole surface keeps the full vertex array otherwise, which wastes GPU memory.
 */
export function compactMesh(mesh: TriangleMesh): TriangleMesh {
  const remap = new Map<number, number>()
  const order: number[] = []
  const indices = new Uint32Array(mesh.indices.length)
  for (let t = 0; t < mesh.indices.length; t++) {
    const old = mesh.indices[t]
    let next = remap.get(old)
    if (next === undefined) {
      next = order.length
      remap.set(old, next)
      order.push(old)
    }
    indices[t] = next
  }
  const positions = new Float32Array(order.length * 3)
  const normals = new Float32Array(order.length * 3)
  order.forEach((old, v) => {
    positions.set(mesh.positions.subarray(old * 3, old * 3 + 3), v * 3)
    normals.set(mesh.normals.subarray(old * 3, old * 3 + 3), v * 3)
  })
  return { positions, normals, indices }
}

