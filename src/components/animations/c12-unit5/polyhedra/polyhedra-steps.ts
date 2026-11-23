import { NCERT_S2_POLYHEDRA } from '@/lib/chem/ncert-c12-unit5-s2-tables'

export const POLYHEDRA_STEP_COUNT = 4

export type PolyhedraVisual = 'octahedral' | 'tetrahedral' | 'square-planar' | 'five-coordinate'

export interface Vec3 {
  readonly x: number
  readonly y: number
  readonly z: number
}

export interface PolyhedronMesh {
  readonly vertices: readonly Vec3[]
  readonly edges: readonly (readonly [number, number])[]
  readonly faces: readonly (readonly number[])[]
}

export interface PolyhedraStepInfo {
  readonly visual: PolyhedraVisual
  readonly title: string
  readonly cnLabel: string
  readonly example?: string
}

export const POLYHEDRA_STEPS: readonly PolyhedraStepInfo[] = [
  {
    visual: 'octahedral',
    title: 'octahedral, CN = 6',
    cnLabel: 'CN = 6',
    example: '[Co(NH₃)₆]³⁺',
  },
  {
    visual: 'tetrahedral',
    title: 'tetrahedral, CN = 4',
    cnLabel: 'CN = 4',
    example: '[Ni(CO)₄]',
  },
  {
    visual: 'square-planar',
    title: 'square planar, CN = 4',
    cnLabel: 'CN = 4',
    example: '[PtCl₄]²⁻',
  },
  {
    visual: 'five-coordinate',
    title: 'five-coordinate polyhedra, CN = 5',
    cnLabel: 'CN = 5',
  },
] as const

export function polyhedraStepInfo(step: number): PolyhedraStepInfo {
  const idx = Math.min(Math.max(Math.trunc(step), 0), POLYHEDRA_STEP_COUNT - 1)
  return POLYHEDRA_STEPS[idx] ?? POLYHEDRA_STEPS[0]
}

// --- 3D Unit Polyhedra Meshes ---

export const OCTAHEDRON_MESH: PolyhedronMesh = {
  vertices: [
    { x: 0, y: -1, z: 0 }, // 0 top
    { x: 0, y: 1, z: 0 },  // 1 bottom
    { x: 1, y: 0, z: 0 },  // 2 right
    { x: -1, y: 0, z: 0 }, // 3 left
    { x: 0, y: 0, z: 1 },  // 4 front
    { x: 0, y: 0, z: -1 }, // 5 back
  ],
  edges: [
    [0, 2], [0, 3], [0, 4], [0, 5],
    [1, 2], [1, 3], [1, 4], [1, 5],
    [2, 4], [4, 3], [3, 5], [5, 2],
  ],
  faces: [
    [0, 2, 4], [0, 4, 3], [0, 3, 5], [0, 5, 2],
    [1, 2, 4], [1, 4, 3], [1, 3, 5], [1, 5, 2],
  ],
}

const INV_SQRT3 = 1 / Math.sqrt(3)
export const TETRAHEDRON_MESH: PolyhedronMesh = {
  vertices: [
    { x: INV_SQRT3, y: -INV_SQRT3, z: INV_SQRT3 },
    { x: -INV_SQRT3, y: -INV_SQRT3, z: -INV_SQRT3 },
    { x: -INV_SQRT3, y: INV_SQRT3, z: INV_SQRT3 },
    { x: INV_SQRT3, y: INV_SQRT3, z: -INV_SQRT3 },
  ],
  edges: [
    [0, 1], [0, 2], [0, 3],
    [1, 2], [1, 3], [2, 3],
  ],
  faces: [
    [0, 1, 2], [0, 1, 3], [0, 2, 3], [1, 2, 3],
  ],
}

export const CUBE_WIREFRAME: { vertices: readonly Vec3[]; edges: readonly (readonly [number, number])[] } = {
  vertices: [
    { x: -INV_SQRT3, y: -INV_SQRT3, z: -INV_SQRT3 },
    { x: INV_SQRT3, y: -INV_SQRT3, z: -INV_SQRT3 },
    { x: INV_SQRT3, y: -INV_SQRT3, z: INV_SQRT3 },
    { x: -INV_SQRT3, y: -INV_SQRT3, z: INV_SQRT3 },
    { x: -INV_SQRT3, y: INV_SQRT3, z: -INV_SQRT3 },
    { x: INV_SQRT3, y: INV_SQRT3, z: -INV_SQRT3 },
    { x: INV_SQRT3, y: INV_SQRT3, z: INV_SQRT3 },
    { x: -INV_SQRT3, y: INV_SQRT3, z: INV_SQRT3 },
  ],
  edges: [
    [0, 1], [1, 2], [2, 3], [3, 0],
    [4, 5], [5, 6], [6, 7], [7, 4],
    [0, 4], [1, 5], [2, 6], [3, 7],
  ],
}

const INV_SQRT2 = 1 / Math.sqrt(2)
export const SQUARE_PLANAR_MESH: PolyhedronMesh = {
  vertices: [
    { x: INV_SQRT2, y: 0, z: INV_SQRT2 },
    { x: -INV_SQRT2, y: 0, z: INV_SQRT2 },
    { x: -INV_SQRT2, y: 0, z: -INV_SQRT2 },
    { x: INV_SQRT2, y: 0, z: -INV_SQRT2 },
  ],
  edges: [
    [0, 1], [1, 2], [2, 3], [3, 0],
  ],
  faces: [
    [0, 1, 2, 3],
  ],
}

const COS120 = -0.5
const SIN120 = Math.sqrt(3) / 2
export const TRIGONAL_BIPYRAMIDAL_MESH: PolyhedronMesh = {
  vertices: [
    { x: 0, y: -1, z: 0 }, // 0 axial top
    { x: 0, y: 1, z: 0 },  // 1 axial bottom
    { x: 0.95, y: 0, z: 0 }, // 2 eq 1
    { x: 0.95 * COS120, y: 0, z: 0.95 * SIN120 }, // 3 eq 2
    { x: 0.95 * COS120, y: 0, z: -0.95 * SIN120 }, // 4 eq 3
  ],
  edges: [
    [0, 2], [0, 3], [0, 4],
    [1, 2], [1, 3], [1, 4],
    [2, 3], [3, 4], [4, 2],
  ],
  faces: [
    [0, 2, 3], [0, 3, 4], [0, 4, 2],
    [1, 2, 3], [1, 3, 4], [1, 4, 2],
  ],
}

export const SQUARE_PYRAMIDAL_MESH: PolyhedronMesh = {
  vertices: [
    { x: 0, y: -0.95, z: 0 }, // 0 apex
    { x: 0.78, y: 0.35, z: 0.78 },  // 1 base 1
    { x: -0.78, y: 0.35, z: 0.78 }, // 2 base 2
    { x: -0.78, y: 0.35, z: -0.78 },// 3 base 3
    { x: 0.78, y: 0.35, z: -0.78 }, // 4 base 4
  ],
  edges: [
    [0, 1], [0, 2], [0, 3], [0, 4],
    [1, 2], [2, 3], [3, 4], [4, 1],
  ],
  faces: [
    [1, 2, 3, 4],
    [0, 1, 2], [0, 2, 3], [0, 3, 4], [0, 4, 1],
  ],
}

export interface ProjectedPoint {
  readonly x: number
  readonly y: number
  readonly z: number
}

/** Rotate a 3D point by yaw (around Y) then pitch (around X), and project onto SVG (cx, cy). */
export function project3D(
  p: Vec3,
  yawRad: number,
  pitchRad: number,
  cx: number,
  cy: number,
  scale: number
): ProjectedPoint {
  const cyaw = Math.cos(yawRad)
  const syaw = Math.sin(yawRad)
  const x1 = p.x * cyaw + p.z * syaw
  const z1 = -p.x * syaw + p.z * cyaw

  const cpitch = Math.cos(pitchRad)
  const spitch = Math.sin(pitchRad)
  const y2 = p.y * cpitch - z1 * spitch
  const z2 = p.y * spitch + z1 * cpitch

  const persp = 4.2 / (4.2 - z2 * 0.75)
  return {
    x: cx + x1 * scale * persp,
    y: cy + y2 * scale * persp,
    z: z2,
  }
}

export const NCERT_POLYHEDRA_COUNT = NCERT_S2_POLYHEDRA.length
