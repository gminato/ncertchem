/**
 * Layout table for Molecule. Each entry is a set of atoms with their
 * projected 2D positions (SVG units, centred on the molecule's centroid), a
 * depth value for back-to-front drawing, and bonds between atom indices.
 *
 * The geometry is written in 3D, with a bond length of 1, then projected with
 * a fixed view rotation. That keeps the bond angles exact (H2O 104.5 degrees,
 * CH4 tetrahedral, NH3 pyramidal) and the table deterministic.
 */

export interface MoleculeAtom {
  element: string
  /** Position relative to the molecule centre, in SVG units. */
  x: number
  y: number
  /** Depth relative to the centre, in the same units. Larger values are nearer the viewer. */
  z: number
}

/** A bond between two atoms (by index). `order` 2 and 3 draw double and triple bonds. */
export interface MoleculeBond {
  a: number
  b: number
  order: 1 | 2 | 3
}

export interface MoleculeLayout {
  atoms: MoleculeAtom[]
  bonds: MoleculeBond[]
}

/** Bond length in SVG units at scale 1. */
export const BOND_LENGTH_PX = 26

type Vec3 = [number, number, number]
type AtomSpec = [element: string, position: Vec3]
type BondSpec = [a: number, b: number, order: 1 | 2 | 3]

/** Fixed view: a slight turn about the vertical axis, then a tilt, to read as 3D. */
const VIEW_ROT_Y = 0.5
const VIEW_ROT_X = -0.28

function projectAndCentre(atoms: AtomSpec[], bonds: BondSpec[]): MoleculeLayout {
  const cosY = Math.cos(VIEW_ROT_Y)
  const sinY = Math.sin(VIEW_ROT_Y)
  const cosX = Math.cos(VIEW_ROT_X)
  const sinX = Math.sin(VIEW_ROT_X)

  const projected = atoms.map(([element, [x, y, z]]) => {
    const x1 = x * cosY + z * sinY
    const z1 = -x * sinY + z * cosY
    const y2 = y * cosX - z1 * sinX
    const z2 = y * sinX + z1 * cosX
    return {
      element,
      x: x1 * BOND_LENGTH_PX,
      y: y2 * BOND_LENGTH_PX,
      z: z2 * BOND_LENGTH_PX,
    }
  })

  const cx = projected.reduce((sum, a) => sum + a.x, 0) / projected.length
  const cy = projected.reduce((sum, a) => sum + a.y, 0) / projected.length
  const cz = projected.reduce((sum, a) => sum + a.z, 0) / projected.length
  const round = (v: number) => Math.round(v * 100) / 100

  return {
    atoms: projected.map((a) => ({
      element: a.element,
      x: round(a.x - cx),
      y: round(a.y - cy),
      z: round(a.z - cz),
    })),
    bonds: bonds.map(([a, b, order]) => ({ a, b, order })),
  }
}

const TETRA = 1 / Math.sqrt(3)
/** NH3: the three N-H bonds make a 107 degree angle, so each is 68 degrees from the lone-pair axis. */
const NH3_BETA = (68 * Math.PI) / 180
const NH3_SIN = Math.sin(NH3_BETA)
const NH3_COS = Math.cos(NH3_BETA)
const nh3Hydrogen = (phiDeg: number): Vec3 => {
  const phi = (phiDeg * Math.PI) / 180
  // The lone pair points up (negative y in SVG), so the hydrogens point down.
  return [NH3_SIN * Math.cos(phi), NH3_COS, NH3_SIN * Math.sin(phi)]
}

/** Half of the H-O-H angle in water (104.5 degrees in total). */
const WATER_HALF_ANGLE = (104.5 / 2) * (Math.PI / 180)

/**
 * Built-in molecule layouts, keyed by formula. Add more by assigning into this
 * record. Each entry is consumed by `<Molecule formula="…" />`.
 */
export const MOLECULE_LAYOUTS: Record<string, MoleculeLayout> = {
  H2: projectAndCentre(
    [
      ['H', [-0.5, 0, 0]],
      ['H', [0.5, 0, 0]],
    ],
    [[0, 1, 1]]
  ),
  O2: projectAndCentre(
    [
      ['O', [-0.5, 0, 0]],
      ['O', [0.5, 0, 0]],
    ],
    [[0, 1, 2]]
  ),
  N2: projectAndCentre(
    [
      ['N', [-0.5, 0, 0]],
      ['N', [0.5, 0, 0]],
    ],
    [[0, 1, 3]]
  ),
  // Nitric oxide has one unpaired electron, which is not drawn: the bond is shown as double.
  NO: projectAndCentre(
    [
      ['N', [-0.5, 0, 0]],
      ['O', [0.5, 0, 0]],
    ],
    [[0, 1, 2]]
  ),
  Cl2: projectAndCentre(
    [
      ['Cl', [-0.5, 0, 0]],
      ['Cl', [0.5, 0, 0]],
    ],
    [[0, 1, 1]]
  ),
  HCl: projectAndCentre(
    [
      ['H', [-0.5, 0, 0]],
      ['Cl', [0.5, 0, 0]],
    ],
    [[0, 1, 1]]
  ),
  // Ionic pair: no covalent bond is drawn.
  NaCl: projectAndCentre(
    [
      ['Na', [-0.6, 0, 0]],
      ['Cl', [0.6, 0, 0]],
    ],
    []
  ),
  H2O: projectAndCentre(
    [
      ['O', [0, 0, 0]],
      ['H', [-Math.sin(WATER_HALF_ANGLE), Math.cos(WATER_HALF_ANGLE), 0]],
      ['H', [Math.sin(WATER_HALF_ANGLE), Math.cos(WATER_HALF_ANGLE), 0]],
    ],
    [
      [0, 1, 1],
      [0, 2, 1],
    ]
  ),
  // Hydrogen peroxide: the H-O-O-H skeleton is skewed, with an O-O-H angle of about 95 degrees.
  H2O2: projectAndCentre(
    [
      ['O', [-0.5, 0, 0]],
      ['O', [0.5, 0, 0]],
      ['H', [-0.587, 0.996, 0]],
      ['H', [0.587, -0.366, 0.926]],
    ],
    [
      [0, 1, 1],
      [0, 2, 1],
      [1, 3, 1],
    ]
  ),
  CO2: projectAndCentre(
    [
      ['C', [0, 0, 0]],
      ['O', [-1, 0, 0]],
      ['O', [1, 0, 0]],
    ],
    [
      [0, 1, 2],
      [0, 2, 2],
    ]
  ),
  CH4: projectAndCentre(
    [
      ['C', [0, 0, 0]],
      ['H', [TETRA, TETRA, TETRA]],
      ['H', [TETRA, -TETRA, -TETRA]],
      ['H', [-TETRA, TETRA, -TETRA]],
      ['H', [-TETRA, -TETRA, TETRA]],
    ],
    [
      [0, 1, 1],
      [0, 2, 1],
      [0, 3, 1],
      [0, 4, 1],
    ]
  ),
  NH3: projectAndCentre(
    [
      ['N', [0, 0, 0]],
      ['H', nh3Hydrogen(90)],
      ['H', nh3Hydrogen(210)],
      ['H', nh3Hydrogen(330)],
    ],
    [
      [0, 1, 1],
      [0, 2, 1],
      [0, 3, 1],
    ]
  ),
  // Ions: the charge is not drawn, so label the particle with its charge.
  'I⁻': projectAndCentre([['I', [0, 0, 0]]], []),
  'IO⁻': projectAndCentre(
    [
      ['I', [-0.5, 0, 0]],
      ['O', [0.5, 0, 0]],
    ],
    [[0, 1, 1]]
  ),
}
