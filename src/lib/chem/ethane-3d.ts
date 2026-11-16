/**
 * Ethane as a 3D model at a dihedral angle, for the Molecule3D scene of Section 9.2.4.
 *
 * The C–C axis is the z axis. The front carbon sits at z = −½ and the back carbon at z = +½, so the
 * C–C bond is one scene unit long (a schematic length, not a scale in pm). Each carbon carries three
 * hydrogens at the tetrahedral angle, 109.5°, to its own bond. The front hydrogens stay still; the back
 * hydrogens turn about the axis by the dihedral angle, so 0° puts each back H directly behind a front H
 * (eclipsed) and 60° puts it between two front H (staggered), as in conformations.ts.
 */

export type Vec3 = [number, number, number]

export interface EthaneAtom {
  id: string
  element: 'C' | 'H'
  position: Vec3
}

export interface EthaneBond {
  a: string
  b: string
  order: 1
}

/** The atoms and bonds of ethane, in the shape Molecule3D draws. */
export interface EthaneModel {
  atoms: EthaneAtom[]
  bonds: EthaneBond[]
}

const DEG = Math.PI / 180
const cosDeg = (d: number) => Math.cos(d * DEG)
const sinDeg = (d: number) => Math.sin(d * DEG)

/** The angle between bonds at each carbon in this model, arccos(−1/3), about 109.47°: every H–C–H and H–C–C angle. */
export const TETRAHEDRAL_ANGLE_DEG = (Math.acos(-1 / 3) * 180) / Math.PI

/** Azimuths of the front hydrogens about the C–C axis, in degrees. */
const FRONT_AZIMUTHS_DEG = [90, 210, 330] as const

/** Radial and axial parts of a unit bond at the tetrahedral angle to the C–C axis. */
const AXIAL = -1 / 3
const RADIAL = Math.sqrt(8) / 3

const FRONT_CARBON: Vec3 = [0, 0, -0.5]
const BACK_CARBON: Vec3 = [0, 0, 0.5]

/**
 * The positions of ethane at a dihedral angle. Hydrogens h1 to h3 are on the front carbon and h4 to h6 on the
 * back carbon, and every C–H bond is one scene unit long.
 *
 * @throws {RangeError} If the angle is not finite
 */
export function ethaneModel(dihedralDeg: number): EthaneModel {
  if (!Number.isFinite(dihedralDeg)) throw new RangeError('The dihedral angle must be a finite number of degrees')
  const atoms: EthaneAtom[] = [
    { id: 'c1', element: 'C', position: FRONT_CARBON },
    { id: 'c2', element: 'C', position: BACK_CARBON },
  ]
  FRONT_AZIMUTHS_DEG.forEach((phi, i) => {
    atoms.push({
      id: `h${i + 1}`,
      element: 'H',
      position: add(FRONT_CARBON, [RADIAL * cosDeg(phi), RADIAL * sinDeg(phi), AXIAL]),
    })
  })
  FRONT_AZIMUTHS_DEG.forEach((phi, i) => {
    const psi = phi + dihedralDeg
    atoms.push({
      id: `h${i + 4}`,
      element: 'H',
      // From the back carbon the other carbon lies at −z, so these bonds lean towards +z.
      position: add(BACK_CARBON, [RADIAL * cosDeg(psi), RADIAL * sinDeg(psi), -AXIAL]),
    })
  })
  const bonds: EthaneBond[] = [
    { a: 'c1', b: 'c2', order: 1 },
    { a: 'c1', b: 'h1', order: 1 },
    { a: 'c1', b: 'h2', order: 1 },
    { a: 'c1', b: 'h3', order: 1 },
    { a: 'c2', b: 'h4', order: 1 },
    { a: 'c2', b: 'h5', order: 1 },
    { a: 'c2', b: 'h6', order: 1 },
  ]
  return { atoms, bonds }
}

/**
 * The H–C–C–H dihedral angle of a model, in degrees in (−180, 180], between a front hydrogen and a back one.
 *
 * @param model an ethane model from ethaneModel
 * @param front index 1 to 3 of the front hydrogen
 * @param back index 4 to 6 of the back hydrogen
 */
export function measuredDihedral(model: EthaneModel, front = 1, back = 4): number {
  const p = (id: string): Vec3 => {
    const atom = model.atoms.find((a) => a.id === id)
    if (!atom) throw new RangeError(`No atom ${id} in the model`)
    return atom.position
  }
  const p0 = p(`h${front}`)
  const p1 = p('c1')
  const p2 = p('c2')
  const p3 = p(`h${back}`)
  const b0 = sub(p1, p0)
  const b1 = sub(p2, p1)
  const b2 = sub(p3, p2)
  const n1 = cross(b0, b1)
  const n2 = cross(b1, b2)
  const len1 = Math.hypot(...b1)
  const m1 = cross(n1, scale(b1, 1 / len1))
  const x = dot(n1, n2)
  const y = dot(m1, n2)
  // IUPAC sign: positive when the front bond turns clockwise, seen from the front carbon, to reach the back bond.
  return (-Math.atan2(y, x) * 180) / Math.PI
}

function add(a: Vec3, b: Vec3): Vec3 {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
}
function sub(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
}
function scale(a: Vec3, k: number): Vec3 {
  return [a[0] * k, a[1] * k, a[2] * k]
}
function dot(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
}
function cross(a: Vec3, b: Vec3): Vec3 {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
}
