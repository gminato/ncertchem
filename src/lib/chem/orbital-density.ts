/**
 * Sampling of hydrogen-like orbitals on a grid, for the 3D orbital explorer. It gives
 * the wavefunction ψ, the boundary surface that encloses a chosen share of the
 * probability, and a deterministic probability cloud.
 *
 * Everything here is in atomic units: distances in a₀ (52.9 pm), and ψ as defined by
 * {@link psi} in hydrogen-orbitals.ts. The fast evaluator below uses a tabulated radial
 * function and precomputed angular polynomials. Tests check it against the reference
 * `psi` at random points.
 */

import { radialR, orbitalName } from './hydrogen-orbitals'

/** Step of the tabulated radial function R_nl(r), in a₀. */
const RADIAL_STEP = 0.01
/** Radial table runs out to this distance (a₀); beyond it ψ is taken as zero (below 1e-12 for n ≤ 4). */
const RADIAL_MAX = 100

/** Radial table: R_nl(k · RADIAL_STEP) for k = 0, 1, …. */
const radialTables = new Map<string, Float64Array>()

function radialTable(n: number, l: number): Float64Array {
  const key = `${n},${l}`
  const cached = radialTables.get(key)
  if (cached) return cached
  const count = Math.round(RADIAL_MAX / RADIAL_STEP) + 1
  const table = new Float64Array(count)
  for (let k = 0; k < count; k++) {
    table[k] = radialR(n, l, k * RADIAL_STEP)
  }
  radialTables.set(key, table)
  return table
}

/** Linear interpolation of the tabulated radial function. */
function radialAt(table: Float64Array, r: number): number {
  const position = r / RADIAL_STEP
  const index = Math.floor(position)
  if (index >= table.length - 1) return 0
  const frac = position - index
  return table[index] * (1 - frac) + table[index + 1] * frac
}

function factorial(k: number): number {
  let f = 1
  for (let i = 2; i <= k; i++) f *= i
  return f
}

/** Coefficients (lowest power first) of the Legendre polynomial P_l(x). */
function legendreCoefficients(l: number): number[] {
  let prev = [1]
  if (l === 0) return prev
  let curr = [0, 1]
  for (let k = 1; k < l; k++) {
    const next = new Array<number>(k + 2).fill(0)
    for (let i = 0; i < curr.length; i++) next[i + 1] += ((2 * k + 1) * curr[i]) / (k + 1)
    for (let i = 0; i < prev.length; i++) next[i] -= (k * prev[i]) / (k + 1)
    prev = curr
    curr = next
  }
  return curr
}

function derivative(coeffs: number[]): number[] {
  if (coeffs.length <= 1) return [0]
  return coeffs.slice(1).map((c, i) => c * (i + 1))
}

function evaluatePolynomial(coeffs: number[], x: number): number {
  let value = 0
  for (let i = coeffs.length - 1; i >= 0; i--) value = value * x + coeffs[i]
  return value
}

/**
 * Angular part of one real harmonic, as a function of cos θ and φ, with the same
 * normalisation and sign conventions as `realSphericalHarmonic` in hydrogen-orbitals.ts.
 */
function angularFunction(l: number, m: number): (cosT: number, sinT: number, phi: number) => number {
  const absM = Math.abs(m)
  let poly = legendreCoefficients(l)
  for (let k = 0; k < absM; k++) poly = derivative(poly)
  const normSquared = ((2 * l + 1) / (4 * Math.PI)) * (factorial(l - absM) / factorial(l + absM))
  const norm = m === 0 ? Math.sqrt(normSquared) : Math.SQRT2 * Math.sqrt(normSquared)

  if (m === 0) {
    return (cosT) => norm * evaluatePolynomial(poly, cosT)
  }
  if (m > 0) {
    return (cosT, sinT, phi) => norm * sinT ** absM * evaluatePolynomial(poly, cosT) * Math.cos(absM * phi)
  }
  return (cosT, sinT, phi) => norm * sinT ** absM * evaluatePolynomial(poly, cosT) * Math.sin(absM * phi)
}

/**
 * The radii (a₀) where the radial part R_nl has a node, found by scanning and bisection up to
 * maxA0. There are n − ℓ − 1 of them (checked by the tests).
 */
export function radialNodeRadii(n: number, l: number, maxA0 = 40): number[] {
  const step = 0.005
  const nodes: number[] = []
  let previous = radialR(n, l, step)
  for (let r = 2 * step; r <= maxA0; r += step) {
    const current = radialR(n, l, r)
    if (previous * current < 0) {
      let lo = r - step
      let hi = r
      for (let iter = 0; iter < 60; iter++) {
        const mid = (lo + hi) / 2
        if (radialR(n, l, lo) * radialR(n, l, mid) <= 0) hi = mid
        else lo = mid
      }
      nodes.push((lo + hi) / 2)
    }
    previous = current
  }
  return nodes
}

/**
 * The values of cos θ (between −1 and 1) where the θ part of the real harmonic (l, m) is
 * zero. Each root is a nodal cone about the z-axis: cos θ = 0 is the xy-plane, and dz² has
 * roots ±1/√3, which is θ = 54.74° and 125.26°. The roots are found by scanning for sign
 * changes and bisecting, so they come from the same polynomial that {@link orbitalValueFn} uses.
 */
export function angularRootsCosTheta(l: number, m: number): number[] {
  const absM = Math.abs(m)
  let poly = legendreCoefficients(l)
  for (let k = 0; k < absM; k++) poly = derivative(poly)
  const f = (x: number) => evaluatePolynomial(poly, x)
  const roots: number[] = []
  const steps = 4000
  let prevX = -1 + 1e-9
  let prevV = f(prevX)
  for (let s = 1; s <= steps; s++) {
    const x = -1 + (2 * s) / steps
    const v = f(Math.min(x, 1 - 1e-9))
    if (prevV === 0) roots.push(prevX)
    else if (prevV * v < 0) {
      let lo = prevX
      let hi = Math.min(x, 1 - 1e-9)
      for (let iter = 0; iter < 80; iter++) {
        const mid = (lo + hi) / 2
        if (f(lo) * f(mid) <= 0) hi = mid
        else lo = mid
      }
      roots.push((lo + hi) / 2)
    }
    prevX = x
    prevV = v
  }
  return roots
}

/**
 * The azimuthal angles (radians, in [0, π)) of the nodal half-planes through the z-axis.
 * For m > 0 the factor cos(mφ) vanishes at φ = (k + ½)π/m; for m < 0 the factor sin(|m|φ)
 * vanishes at φ = kπ/|m|. Each angle is one full plane (φ and φ + π are the same plane).
 */
export function nodalPlaneAngles(m: number): number[] {
  const absM = Math.abs(m)
  if (absM === 0) return []
  const angles: number[] = []
  for (let k = 0; k < absM; k++) {
    angles.push(m > 0 ? ((k + 0.5) * Math.PI) / absM : (k * Math.PI) / absM)
  }
  return angles
}

/** A function ψ(x, y, z) for one real orbital, in atomic units. */
export type OrbitalValueFn = (x: number, y: number, z: number) => number

/**
 * Builds a fast ψ(x, y, z) for the real orbital (n, l, m). Radial values come from a table
 * and angular polynomials are precomputed, so a grid of tens of thousands of points is cheap.
 *
 * @throws {RangeError} If (n, l, m) is not a valid real orbital (see {@link orbitalName})
 */
export function orbitalValueFn(n: number, l: number, m: number): OrbitalValueFn {
  orbitalName(n, l, m) // validates the quantum numbers with the reference rules
  const table = radialTable(n, l)
  const angular = angularFunction(l, m)
  return (x, y, z) => {
    const rho2 = x * x + y * y
    const r = Math.sqrt(rho2 + z * z)
    if (r === 0) return l === 0 ? table[0] * angular(1, 0, 0) : 0
    const cosT = z / r
    const sinT = Math.sqrt(rho2) / r
    const phi = Math.atan2(y, x)
    return radialAt(table, r) * angular(cosT, sinT, phi)
  }
}

/** Radial probability density r²R² on the tabulated grid, used for the radial extent. */
function radialDensityTable(n: number, l: number): Float64Array {
  const table = radialTable(n, l)
  const out = new Float64Array(table.length)
  for (let k = 0; k < table.length; k++) {
    const r = k * RADIAL_STEP
    out[k] = r * r * table[k] * table[k]
  }
  return out
}

/**
 * Radius (a₀) beyond which the radial probability is less than `tail` of the total.
 * It bounds the boxes used for sampling, so the lobes are never clipped by the grid.
 */
export function radialExtent(n: number, l: number, tail = 1e-4): number {
  const density = radialDensityTable(n, l)
  let total = 0
  for (let k = 1; k < density.length; k++) total += (density[k] + density[k - 1]) / 2
  let remaining = total
  for (let k = 1; k < density.length; k++) {
    remaining -= (density[k] + density[k - 1]) / 2
    if (remaining <= tail * total) return k * RADIAL_STEP
  }
  return RADIAL_MAX
}

/** A cubic grid of ψ values. Point (i, j, k) sits at coordinate(i) etc., with no point on an axis. */
export interface OrbitalGrid {
  n: number
  l: number
  m: number
  /** Points per side. */
  size: number
  /** Half-width of the box in a₀; the box spans −half to +half. */
  half: number
  /** Spacing between points in a₀. */
  step: number
  /** ψ at each point, indexed (i · size + j) · size + k. */
  psi: Float64Array
}

/** Coordinate (a₀) of grid index i along any axis. The grid is offset by half a step, so no point is on 0. */
export function gridCoordinate(grid: Pick<OrbitalGrid, 'half' | 'step'>, index: number): number {
  return -grid.half + (index + 0.5) * grid.step
}

/** Samples ψ on a size³ grid covering the box −half … +half for orbital (n, l, m). */
export function sampleOrbitalGrid(
  n: number,
  l: number,
  m: number,
  size: number,
  half: number
): OrbitalGrid {
  if (!Number.isInteger(size) || size < 4) throw new RangeError(`Grid size must be an integer ≥ 4 (received ${size})`)
  if (!(half > 0)) throw new RangeError(`Grid half-width must be positive (received ${half})`)
  const value = orbitalValueFn(n, l, m)
  const step = (2 * half) / size
  const psi = new Float64Array(size * size * size)
  const coords = Float64Array.from({ length: size }, (_, i) => -half + (i + 0.5) * step)
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      for (let k = 0; k < size; k++) {
        psi[(i * size + j) * size + k] = value(coords[i], coords[j], coords[k])
      }
    }
  }
  return { n, l, m, size, half, step, psi }
}

/**
 * The density threshold ρ_t such that the cells with |ψ|² ≥ ρ_t hold `fraction` of the
 * total probability on the grid. Its isosurface is the boundary surface (90% by default).
 */
export function boundaryThreshold(grid: OrbitalGrid, fraction = 0.9): number {
  if (!(fraction > 0 && fraction < 1)) throw new RangeError(`fraction must be between 0 and 1 (received ${fraction})`)
  const dV = grid.step ** 3
  const density = Float64Array.from(grid.psi, (v) => v * v)
  let total = 0
  for (const rho of density) total += rho * dV
  // A typed array sorts numerically and natively, which is much faster than a comparator.
  const ascending = density.sort()
  let running = 0
  for (let k = ascending.length - 1; k >= 0; k--) {
    running += ascending[k] * dV
    if (running >= fraction * total) return ascending[k]
  }
  return 0
}

/** Largest distance from the origin (a₀) of any grid point whose |ψ|² is at least `threshold`. */
export function enclosedRadius(grid: OrbitalGrid, threshold: number): number {
  let maxR2 = 0
  const { size } = grid
  for (let i = 0; i < size; i++) {
    const x = gridCoordinate(grid, i)
    for (let j = 0; j < size; j++) {
      const y = gridCoordinate(grid, j)
      for (let k = 0; k < size; k++) {
        const z = gridCoordinate(grid, k)
        const v = grid.psi[(i * size + j) * size + k]
        if (v * v >= threshold) {
          const r2 = x * x + y * y + z * z
          if (r2 > maxR2) maxR2 = r2
        }
      }
    }
  }
  return Math.sqrt(maxR2)
}

/** Deterministic 32-bit PRNG (mulberry32). The same seed always gives the same sequence. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export interface ProbabilityCloud {
  /** x, y, z of each sampled point, three numbers per point, in a₀. */
  positions: Float32Array
  /** Sign of ψ at each point: +1 or −1. */
  signs: Int8Array
}

/**
 * Samples the probability cloud by inverse-transform (CDF) sampling on the grid: each cell
 * is chosen with probability |ψ|² / Σ|ψ|² and a seeded random point is placed uniformly
 * inside that cell. Points therefore follow the probability density in O(cells + count log cells)
 * time, and nodes stay empty.
 *
 * @throws {RangeError} If `count` is not a positive integer
 */
export function sampleProbabilityCloud(grid: OrbitalGrid, count: number, seed = 1): ProbabilityCloud {
  if (!Number.isInteger(count) || count < 1) throw new RangeError(`count must be a positive integer (received ${count})`)
  const cellCount = grid.psi.length
  const cdf = new Float64Array(cellCount)
  let total = 0
  for (let idx = 0; idx < cellCount; idx++) {
    const v = grid.psi[idx]
    total += v * v
    cdf[idx] = total
  }
  if (!(total > 0)) {
    throw new Error('Cannot sample a probability cloud from an all-zero grid')
  }
  const random = mulberry32(seed)
  const positions = new Float32Array(count * 3)
  const signs = new Int8Array(count)
  const { size, half, step } = grid
  const sizeSq = size * size
  for (let p = 0; p < count; p++) {
    const target = random() * total
    let lo = 0
    let hi = cellCount - 1
    while (lo < hi) {
      const mid = (lo + hi) >>> 1
      if (cdf[mid] <= target) lo = mid + 1
      else hi = mid
    }
    const idx = lo
    const i = Math.floor(idx / sizeSq)
    const rem = idx - i * sizeSq
    const j = Math.floor(rem / size)
    const k = rem - j * size
    positions[p * 3] = -half + (i + random()) * step
    positions[p * 3 + 1] = -half + (j + random()) * step
    positions[p * 3 + 2] = -half + (k + random()) * step
    signs[p] = grid.psi[idx] >= 0 ? 1 : -1
  }
  return { positions, signs }
}
