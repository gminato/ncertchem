/**
 * Pure 2D/3D geometry helpers for coordination complex SVG drawings
 * (square planar, tetrahedral, octahedral, and chelate arcs).
 */

export interface Vec3 {
  readonly x: number
  readonly y: number
  readonly z: number
}

export interface Point2 {
  readonly x: number
  readonly y: number
  readonly z: number
}

/** Rotate a 3D point around the Y axis (yaw) then X axis (pitch), angles in degrees. */
export function rotate3D(p: Vec3, yawDeg: number, pitchDeg: number): Vec3 {
  const ry = (yawDeg * Math.PI) / 180
  const rx = (pitchDeg * Math.PI) / 180
  const cy = Math.cos(ry)
  const sy = Math.sin(ry)
  const cx = Math.cos(rx)
  const sx = Math.sin(rx)

  const x1 = p.x * cy + p.z * sy
  const z1 = -p.x * sy + p.z * cy
  const y2 = p.y * cx - z1 * sx
  const z2 = p.y * sx + z1 * cx

  return { x: x1, y: y2, z: z2 }
}

/** Orthographic-with-gentle-perspective projection into SVG coordinates (y increases downward). */
export function project3D(
  p: Vec3,
  cx: number,
  cy: number,
  scale: number,
  yawDeg = 22,
  pitchDeg = 16,
): Point2 {
  const r = rotate3D(p, yawDeg, pitchDeg)
  const depth = 1 + r.z * 0.12
  return {
    x: cx + r.x * scale * depth,
    y: cy - r.y * scale * depth,
    z: r.z,
  }
}

/** Unit vertices of a regular octahedron: 0=top(+y), 1=bottom(-y), 2=front-left, 3=front-right, 4=back-right, 5=back-left. */
export const OCTA_VERTS: readonly Vec3[] = [
  { x: 0, y: 1, z: 0 }, // 0: top axial
  { x: 0, y: -1, z: 0 }, // 1: bottom axial
  { x: -0.7071, y: 0, z: 0.7071 }, // 2: front-left equatorial
  { x: 0.7071, y: 0, z: 0.7071 }, // 3: front-right equatorial
  { x: 0.7071, y: 0, z: -0.7071 }, // 4: back-right equatorial
  { x: -0.7071, y: 0, z: -0.7071 }, // 5: back-left equatorial
]

/** The 12 edges of the octahedron (index pairs into OCTA_VERTS). */
export const OCTA_EDGES: readonly (readonly [number, number])[] = [
  [0, 2], [0, 3], [0, 4], [0, 5],
  [1, 2], [1, 3], [1, 4], [1, 5],
  [2, 3], [3, 4], [4, 5], [5, 2],
]

/** Unit vertices of a regular tetrahedron (all 6 pairwise distances equal). */
const S = 1 / Math.sqrt(3)
export const TETRA_VERTS: readonly Vec3[] = [
  { x: 0, y: 1, z: 0 },
  { x: 0.9428, y: -0.3333, z: 0 },
  { x: -0.4714, y: -0.3333, z: 0.8165 },
  { x: -0.4714, y: -0.3333, z: -0.8165 },
]

/** All 6 vertex pairs of a tetrahedron (every pair is adjacent at 109.5 deg). */
export const TETRA_EDGES: readonly (readonly [number, number])[] = [
  [0, 1], [0, 2], [0, 3],
  [1, 2], [2, 3], [3, 1],
]

/** Square planar corner offsets in 2D (top-left, top-right, bottom-right, bottom-left). */
export const SQ_CORNERS: readonly { readonly dx: number; readonly dy: number }[] = [
  { dx: -1, dy: -1 }, // 0: top-left
  { dx: 1, dy: -1 }, // 1: top-right
  { dx: 1, dy: 1 }, // 2: bottom-right
  { dx: -1, dy: 1 }, // 3: bottom-left
]

/** Mirror a 3D point across the YZ plane (x -> -x). */
export function mirrorX(p: Vec3): Vec3 {
  return { x: -p.x, y: p.y, z: p.z }
}

/** Quadratic Bezier path for a curved didentate chelate arc bowing outward from the metal centre. */
export function chelateArcPath(
  a: Point2,
  b: Point2,
  cx: number,
  cy: number,
  bow = 0.58,
): { d: string; labelX: number; labelY: number } {
  const mx = (a.x + b.x) / 2
  const my = (a.y + b.y) / 2
  const vx = mx - cx
  const vy = my - cy
  const len = Math.hypot(vx, vy) || 1
  const dist = Math.hypot(b.x - a.x, b.y - a.y)
  const push = Math.max(dist * bow, 24)
  const ctrlX = mx + (vx / len) * push
  const ctrlY = my + (vy / len) * push
  // Midpoint of quadratic Bezier at t = 0.5
  const midX = 0.25 * a.x + 0.5 * ctrlX + 0.25 * b.x
  const midY = 0.25 * a.y + 0.5 * ctrlY + 0.25 * b.y
  return {
    d: `M ${a.x.toFixed(1)} ${a.y.toFixed(1)} Q ${ctrlX.toFixed(1)} ${ctrlY.toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`,
    labelX: midX + (vx / len) * 12,
    labelY: midY + (vy / len) * 12,
  }
}

/** Euclidean distance between two 3D vertices. */
export function dist3D(a: Vec3, b: Vec3): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z)
}

export const _UNUSED_S = S
