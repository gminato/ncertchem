/**
 * Model for the orbital explorer: which real orbitals can be chosen, what to say about
 * them, and the cached 3D geometry (boundary surface, nodal surface, probability cloud and
 * 2D cross-sections) for each one. Pure TypeScript, so it is tested without a browser.
 */

import { BOHR_RADIUS_PM } from '@/lib/chem/constants'
import { orbitalName } from '@/lib/chem/hydrogen-orbitals'
import { angularNodes, radialNodes, subshellLabel, totalNodes } from '@/lib/chem/quantum'
import {
  boundaryThreshold,
  enclosedRadius,
  orbitalValueFn,
  radialExtent,
  sampleOrbitalGrid,
  sampleProbabilityCloud,
  type OrbitalGrid,
} from '@/lib/chem/orbital-density'
import {
  clipTriangles,
  compactMesh,
  surfaceNets,
  type TriangleMesh,
} from './orbital-explorer-mesh'

/** A real orbital: principal quantum number n, azimuthal l, and real magnetic index m. */
export interface OrbitalChoice {
  n: number
  l: number
  m: number
}

/** Probability enclosed by the boundary surface. */
export const BOUNDARY_FRACTION = 0.9
/** Boundary surface radius after scaling, in scene units. Keeps the lobes at 60–70% of the stage. */
export const FIT_RADIUS = 1.5
/** Points in the probability cloud. */
export const CLOUD_POINTS = 12000
/** Grid points per side for the 3D sampling. */
const GRID_SIZE = 60
/** Grid points per side for the 2D cross-sections. */
const SLICE_SIZE = 41
/** Seed for the cloud: the same orbital always gives the same cloud. */
const CLOUD_SEED = 20260

export const N_CHOICES: readonly number[] = [1, 2, 3, 4]

const SHELL_LETTERS = ['K', 'L', 'M', 'N'] as const

/** Subshells allowed for n: l = 0 … n − 1. */
export function lChoices(n: number): number[] {
  return Array.from({ length: n }, (_, l) => l)
}

/** Magnetic indices allowed for l, in the order they are offered: −l … +l. */
export function mChoices(l: number): number[] {
  return Array.from({ length: 2 * l + 1 }, (_, i) => i - l)
}

/** Brings any choice to the nearest allowed one. Invalid l or m fall back to the closest valid value. */
export function clampChoice(choice: OrbitalChoice): OrbitalChoice {
  const n = Math.min(4, Math.max(1, Math.round(choice.n)))
  const l = Math.min(n - 1, Math.max(0, Math.round(choice.l)))
  const m = Math.abs(choice.m) <= l && Number.isInteger(choice.m) ? choice.m : 0
  return { n, l, m }
}

/** Name of the orbital without its shell digit, as shown on a button: "pz", "dz²", "dxy". */
export function orbitalButtonLabel(choice: OrbitalChoice): string {
  return orbitalName(choice.n, choice.l, choice.m).replace(/^\d/, '')
}

/** Full name of the orbital, such as "3dz²" or "2px". */
export function orbitalFullName(choice: OrbitalChoice): string {
  return orbitalName(choice.n, choice.l, choice.m)
}

/** Shell letter for n: K, L, M or N. */
export function shellLetter(n: number): string {
  const letter = SHELL_LETTERS[n - 1]
  if (!letter) throw new RangeError(`n must be 1 to 4 (received ${n})`)
  return letter
}

/** Node counts for the readout, from the rules in quantum.ts. */
export function orbitalNodes(choice: OrbitalChoice): { radial: number; angular: number; total: number } {
  const radial = radialNodes(choice.n, choice.l)
  const angular = angularNodes(choice.l)
  const total = totalNodes(choice.n)
  if (radial + angular !== total) {
    throw new Error(`Node rule mismatch for ${orbitalFullName(choice)}`)
  }
  return { radial, angular, total }
}

/** Every real orbital with n ≤ 4: 30 in all. Used to prefetch the geometry. */
export function allChoices(): OrbitalChoice[] {
  const out: OrbitalChoice[] = []
  for (const n of N_CHOICES) {
    for (const l of lChoices(n)) {
      for (const m of mChoices(l)) out.push({ n, l, m })
    }
  }
  return out
}

/** Scene-unit geometry for one orbital. Built once, then cached. */
export interface OrbitalGeometry {
  key: string
  /** Real radius of the boundary surface, in pm (rounded to 10 pm). */
  extentPm: number
  /** Lobe where ψ > 0 (the phase colour --orbital-pos). */
  positive: TriangleMesh
  /** Lobe where ψ < 0 (the phase colour --orbital-neg). */
  negative: TriangleMesh
  /** Nodal surface, ψ = 0: nodal planes, cones and radial spheres, trimmed to the lobes. */
  nodes: TriangleMesh
  /** Probability cloud, three numbers per point in scene units, with the sign of ψ at each point. */
  cloud: { positions: Float32Array; signs: Int8Array }
  /** Cross-sections for the 2D fallback. Each is size × size, with the density relative to the boundary threshold. */
  slices: {
    size: number
    /** Half-width of each slice in scene units. */
    half: number
    xy: { density: Float32Array; signs: Int8Array }
    xz: { density: Float32Array; signs: Int8Array }
  }
}

/** Compacts a mesh and scales its positions by `factor`. Normals are unit vectors and are kept. */
function scaleMesh(mesh: TriangleMesh, factor: number): TriangleMesh {
  const compact = compactMesh(mesh)
  for (let i = 0; i < compact.positions.length; i++) compact.positions[i] *= factor
  return compact
}

/** Cross-section of the orbital on a plane, relative to the boundary threshold, with the sign of ψ. */
function sliceOn(
  value: (x: number, y: number, z: number) => number,
  threshold: number,
  half: number,
  plane: 'xy' | 'xz'
): { density: Float32Array; signs: Int8Array } {
  const density = new Float32Array(SLICE_SIZE * SLICE_SIZE)
  const signs = new Int8Array(SLICE_SIZE * SLICE_SIZE)
  const step = (2 * half) / SLICE_SIZE
  for (let i = 0; i < SLICE_SIZE; i++) {
    for (let j = 0; j < SLICE_SIZE; j++) {
      const a = -half + (i + 0.5) * step
      const b = -half + (j + 0.5) * step
      const v = plane === 'xy' ? value(a, b, 0) : value(a, 0, b)
      density[i * SLICE_SIZE + j] = (v * v) / threshold
      signs[i * SLICE_SIZE + j] = v >= 0 ? 1 : -1
    }
  }
  return { density, signs }
}

/**
 * Builds the geometry for one orbital. A coarse pass finds where the 90% region ends, so the
 * fine grid can be drawn tightly around it. Costs a few tens of milliseconds for the largest
 * orbitals, so callers should cache the result.
 *
 * @throws {RangeError} If the choice is not a valid real orbital
 */
export function buildOrbitalGeometry(choice: OrbitalChoice): OrbitalGeometry {
  const { n, l, m } = clampChoice(choice)
  const key = `${n}-${l}-${m}`
  const value = orbitalValueFn(n, l, m)

  // Coarse pass: where does the 90% region end?
  const coarse = sampleOrbitalGrid(n, l, m, 40, radialExtent(n, l) * 1.1)
  const coarseThreshold = boundaryThreshold(coarse, BOUNDARY_FRACTION)
  const coarseRadius = enclosedRadius(coarse, coarseThreshold)
  const half = Math.max(1, coarseRadius * 1.25)

  // Fine pass on the tight box.
  const grid = sampleOrbitalGrid(n, l, m, GRID_SIZE, half)
  const threshold = boundaryThreshold(grid, BOUNDARY_FRACTION)
  const boundaryRadius = enclosedRadius(grid, threshold)
  const scale = FIT_RADIUS / boundaryRadius

  const volumeOrigin = -half + grid.step / 2

  // Lobes: the boundary |ψ|² = threshold, built separately for each sign of ψ. Each field is
  // |ψ|² restricted to one sign, minus the threshold. Its zero contour lies strictly inside
  // that lobe, so a grid cell that straddles a node cannot bridge the two lobes.
  const positiveField = new Float64Array(grid.psi.length)
  const negativeField = new Float64Array(grid.psi.length)
  for (let i = 0; i < grid.psi.length; i++) {
    const v = grid.psi[i]
    const rho = v * v
    positiveField[i] = (v > 0 ? rho : 0) - threshold
    negativeField[i] = (v < 0 ? rho : 0) - threshold
  }
  const positive = surfaceNets({ size: grid.size, origin: volumeOrigin, step: grid.step, values: positiveField }, 0)
  const negative = surfaceNets({ size: grid.size, origin: volumeOrigin, step: grid.step, values: negativeField }, 0)

  // Nodal surface: ψ = 0, trimmed to the boundary radius so nodal planes become discs.
  const nodesRaw = surfaceNets({ size: grid.size, origin: volumeOrigin, step: grid.step, values: grid.psi }, 0)
  const nodes = clipTriangles(nodesRaw, (x, y, z) => Math.hypot(x, y, z) <= boundaryRadius * 1.02)

  const cloud = sampleProbabilityCloud(grid, CLOUD_POINTS, CLOUD_SEED)
  const cloudPositions = new Float32Array(cloud.positions.length)
  for (let i = 0; i < cloudPositions.length; i++) cloudPositions[i] = cloud.positions[i] * scale

  const sliceHalf = boundaryRadius * 1.1
  const xy = sliceOn(value, threshold, sliceHalf, 'xy')
  const xz = sliceOn(value, threshold, sliceHalf, 'xz')

  const extentPm = Math.round((boundaryRadius * BOHR_RADIUS_PM) / 10) * 10

  return {
    key,
    extentPm,
    positive: scaleMesh(positive, scale),
    negative: scaleMesh(negative, scale),
    nodes: scaleMesh(nodes, scale),
    cloud: { positions: cloudPositions, signs: cloud.signs },
    slices: { size: SLICE_SIZE, half: sliceHalf * scale, xy, xz },
  }
}

const geometryCache = new Map<string, OrbitalGeometry>()

/** Cached geometry for an orbital. The first call for an orbital does the work; later calls are instant. */
export function getOrbitalGeometry(choice: OrbitalChoice): OrbitalGeometry {
  const clamped = clampChoice(choice)
  const key = `${clamped.n}-${clamped.l}-${clamped.m}`
  const cached = geometryCache.get(key)
  if (cached) return cached
  const built = buildOrbitalGeometry(clamped)
  geometryCache.set(key, built)
  return built
}

/** True when the geometry for this choice is already cached. */
export function isGeometryCached(choice: OrbitalChoice): boolean {
  const clamped = clampChoice(choice)
  return geometryCache.has(`${clamped.n}-${clamped.l}-${clamped.m}`)
}

/** Subshell label for a choice, e.g. "3d". */
export function choiceSubshell(choice: OrbitalChoice): string {
  return subshellLabel(choice.n, choice.l)
}

/** Plain-language summary of the current choice, for the screen-reader live region and the readout. */
export function describeChoice(choice: OrbitalChoice, geometry?: Pick<OrbitalGeometry, 'extentPm'>): string {
  const nodes = orbitalNodes(choice)
  const parts = [
    `${orbitalFullName(choice)} orbital in shell ${shellLetter(choice.n)}.`,
    `${nodes.radial} radial ${nodes.radial === 1 ? 'node' : 'nodes'}, ${nodes.angular} angular ${
      nodes.angular === 1 ? 'node' : 'nodes'
    }, ${nodes.total} in total.`,
  ]
  if (geometry) parts.push(`Its boundary surface, enclosing 90% of the probability, reaches about ${geometry.extentPm} pm.`)
  return parts.join(' ')
}
