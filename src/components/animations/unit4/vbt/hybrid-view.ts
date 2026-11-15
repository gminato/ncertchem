import { moleculeGeometry } from '@/lib/chem/hybrid-explorer'
import type { GeometryShape } from './vbt-steps'

/** Bond length in SVG units: the scene's bond length times this scale. */
export const SHAPE_SCALE = 76
/** Ligand and central-atom circle radii, in SVG units. */
export const LIGAND_RADIUS = 26
export const CENTRE_RADIUS = 30

/**
 * Yaw and pitch (degrees) of each view, and roll in the drawing plane. Each view was chosen so
 * that no ligand projects onto the centre atom or onto another ligand. The tests check this.
 */
export const VIEWS: Record<GeometryShape, { yaw: number; pitch: number; roll: number }> = {
  BeCl2: { yaw: 0, pitch: 0, roll: 90 },
  BCl3: { yaw: 30, pitch: 40, roll: 0 },
  CH4: { yaw: 90, pitch: 0, roll: 0 },
  H2O: { yaw: 0, pitch: 40, roll: 0 },
  PCl5: { yaw: 60, pitch: 25, roll: 0 },
  SF6: { yaw: 45, pitch: 35, roll: 0 },
}

export interface ProjectedAtom {
  id: string
  element: string
  kind: 'centre' | 'ligand' | 'lone'
  x: number
  y: number
  /** Positive towards the viewer, negative behind the centre. Unnormalised. */
  depth: number
}

const rad = (deg: number) => (deg * Math.PI) / 180

/**
 * Projects a shape from scene space onto the drawing plane. The shape is yawed about the
 * vertical axis, pitched about the horizontal axis so that the back of the shape lifts above
 * the centre, then rolled in the drawing plane. Screen y points down, so it is negated.
 */
export function projectShape(shape: GeometryShape, anchor: { x: number; y: number }): ProjectedAtom[] {
  const g = moleculeGeometry(shape)
  const { yaw, pitch, roll } = VIEWS[shape]
  const [cy, sy] = [Math.cos(rad(yaw)), Math.sin(rad(yaw))]
  const [cp, sp] = [Math.cos(rad(pitch)), Math.sin(rad(pitch))]
  const [cr, sr] = [Math.cos(rad(roll)), Math.sin(rad(roll))]

  const place = ([x, y, z]: readonly number[]) => {
    const x1 = x * cy + z * sy
    const z1 = -x * sy + z * cy
    const y2 = y * cp - z1 * sp
    const z2 = y * sp + z1 * cp
    const px = x1 * SHAPE_SCALE
    const py = -y2 * SHAPE_SCALE
    return { x: anchor.x + px * cr - py * sr, y: anchor.y + px * sr + py * cr, depth: z2 }
  }

  const [centre, ...ligands] = g.atoms
  const out: ProjectedAtom[] = [
    { id: centre.id, element: centre.element, kind: 'centre', ...place(centre.position) },
    ...ligands.map((a) => ({ id: a.id, element: a.element, kind: 'ligand' as const, ...place(a.position) })),
  ]
  g.lonePairs.forEach((lp, i) => {
    out.push({ id: `lp-${i}`, element: '', kind: 'lone', ...place(lp.direction.map((v) => v * 0.55)) })
  })
  return out
}
