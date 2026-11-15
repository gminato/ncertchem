/**
 * The data a molecule is drawn from. Shared by the 3D scene, its 2D fallback
 * and the fixtures. Plain objects only, so they can cross the server/client
 * boundary as props.
 */

import type { Vec3 } from './geometry'

export interface Molecule3DAtom {
  /** Unique within the molecule. Bonds, lone pairs and arcs refer to atoms by this id. */
  id: string
  /** Element symbol, e.g. "O", "Cl". Unknown symbols use the neutral colour. */
  element: string
  position: Vec3
}

export interface Molecule3DBond {
  /** Atom ids. */
  a: string
  b: string
  /** 1.5 is a delocalised bond: one solid stick and one dashed stick. */
  order: 1 | 1.5 | 2 | 3
}

export interface LonePair3D {
  /** Id of the atom carrying the lone pair. */
  atom: string
  /** Direction from the atom, in scene units. It is normalised when drawn. */
  direction: Vec3
}

export interface AngleArc3D {
  /** Ids of the two bonded atoms and of the vertex the angle is measured at. */
  a: string
  centre: string
  b: string
  /** The value shown beside the arc, e.g. "104.5°". */
  label: string
}

export interface Dipole3D {
  /** Tail (δ+ end) and head (δ− end) of the arrow, in scene units. */
  from: Vec3
  to: Vec3
  label?: string
}

export interface Molecule3DData {
  atoms: Molecule3DAtom[]
  bonds: Molecule3DBond[]
  lonePairs?: LonePair3D[]
  angleArcs?: AngleArc3D[]
  dipoles?: Dipole3D[]
}

/** Position of every atom by id, with `overrides` (for tweened poses) taking precedence. */
export function atomPositionMap(
  atoms: readonly Molecule3DAtom[],
  overrides?: Readonly<Record<string, Vec3>>
): Map<string, Vec3> {
  const map = new Map<string, Vec3>()
  for (const atom of atoms) map.set(atom.id, overrides?.[atom.id] ?? atom.position)
  return map
}
