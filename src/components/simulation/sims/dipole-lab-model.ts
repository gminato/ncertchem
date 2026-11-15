/**
 * Model behind the Dipole lab simulation (NCERT Class 11 Unit 4, Section 4.3.6 and Table 4.5).
 *
 * The three-dimensional bond and lone-pair dipoles come from dipole.ts. This file only chooses
 * which molecules the lab offers, turns their vectors into 2D arrows on one fixed view, and lays
 * the arrows out tip to tail. Every number here is a model number in arbitrary units, not a
 * debye value; the printed debye values are read from the NCERT table elsewhere.
 */

import {
  bondDipoleVector,
  dipoleMoleculeFromVsepr,
  lonePairDipoleVector,
  netDipole,
  type DipoleMolecule,
} from '@/lib/chem/dipole'
import { NCERT_TABLE_4_5_DIPOLE_MOMENTS } from '@/lib/chem/ncert-unit4-tables'
import type { Vec3 } from '@/lib/chem/vsepr'

export type LabMoleculeKey = 'CO2' | 'BF3' | 'H2O' | 'NH3' | 'NF3' | 'CH4' | 'CHCl3' | 'CCl4' | 'HF'

export interface LabMolecule {
  key: LabMoleculeKey
  /** Display formula in conventional form. */
  label: string
  centre: string
  ligands: readonly string[]
  lonePairs: number
}

/** The molecules the lab offers, each of which appears in NCERT Table 4.5. */
export const LAB_MOLECULES: readonly LabMolecule[] = [
  { key: 'CO2', label: 'CO₂', centre: 'C', ligands: ['O', 'O'], lonePairs: 0 },
  { key: 'BF3', label: 'BF₃', centre: 'B', ligands: ['F', 'F', 'F'], lonePairs: 0 },
  { key: 'H2O', label: 'H₂O', centre: 'O', ligands: ['H', 'H'], lonePairs: 2 },
  { key: 'NH3', label: 'NH₃', centre: 'N', ligands: ['H', 'H', 'H'], lonePairs: 1 },
  { key: 'NF3', label: 'NF₃', centre: 'N', ligands: ['F', 'F', 'F'], lonePairs: 1 },
  { key: 'CH4', label: 'CH₄', centre: 'C', ligands: ['H', 'H', 'H', 'H'], lonePairs: 0 },
  { key: 'CHCl3', label: 'CHCl₃', centre: 'C', ligands: ['H', 'Cl', 'Cl', 'Cl'], lonePairs: 0 },
  { key: 'CCl4', label: 'CCl₄', centre: 'C', ligands: ['Cl', 'Cl', 'Cl', 'Cl'], lonePairs: 0 },
  { key: 'HF', label: 'HF', centre: 'H', ligands: ['F'], lonePairs: 0 },
]

export function labMolecule(key: LabMoleculeKey): LabMolecule {
  const found = LAB_MOLECULES.find((m) => m.key === key)
  if (!found) throw new RangeError(`Unknown lab molecule ${key}`)
  return found
}

/**
 * The 3D dipole model of a lab molecule. HF is a diatomic, which the VSEPR table does not
 * cover, so its single bond is placed along z by hand. Its fluorine lone pairs are left out.
 */
export function dipoleModelFor(molecule: LabMolecule): DipoleMolecule {
  if (molecule.key === 'HF') {
    return { centre: 'H', ligands: [{ symbol: 'F', direction: [0, 0, 1] }], lonePairDirections: [] }
  }
  return dipoleMoleculeFromVsepr(molecule.centre, molecule.ligands, molecule.lonePairs)
}

type Basis = { u: Vec3; w: Vec3; t: Vec3 }

const DEPTH = 0.3

function dot(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
}

function unit(a: Vec3): Vec3 | null {
  const len = Math.hypot(a[0], a[1], a[2])
  if (len < 1e-9) return null
  return [a[0] / len, a[1] / len, a[2] / len]
}

function cross(a: Vec3, b: Vec3): Vec3 {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
}

/**
 * A view for one molecule. The screen's vertical axis is the molecule's net dipole (taken with
 * its lone pairs, so the view does not change when the lone pair is toggled), or the first
 * bond when the net is zero. The horizontal axis is the second bond, made perpendicular to the
 * vertical, so symmetric shapes read as they are drawn in the textbook.
 */
export function viewBasisFor(model: DipoleMolecule): Basis {
  const net = netDipole(model).vector
  const first = model.ligands[0]?.direction ?? model.lonePairDirections[0] ?? [0, 0, 1]
  const u = unit(net) ?? unit(first) ?? [0, 0, 1]
  const second = model.ligands[1]?.direction ?? model.lonePairDirections[0]
  const along = second ? dot(second, u) : 0
  let w = second ? unit([second[0] - along * u[0], second[1] - along * u[1], second[2] - along * u[2]]) : null
  if (!w) w = unit(cross(u, Math.abs(u[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0])) ?? [1, 0, 0]
  const t = cross(u, w)
  return { u, w, t }
}

/** Projects a 3D vector to the 2D screen (y down) with the given basis. The projection is linear. */
export function makeProjector(basis: Basis): (v: Vec3) => Point {
  return (v: Vec3) => ({ x: dot(v, basis.w), y: -dot(v, basis.u) + DEPTH * dot(v, basis.t) })
}

/** Screen pixels per unit of model dipole (one unit is one unit of Δχ, or of the lone-pair term). */
export const ARROW_PX_PER_UNIT = 50
/** Distance from the centre to each ligand nucleus, in unfitted screen units. */
export const BOND_PX = 130
/** Distance from the centre to the edge of the central atom, in unfitted screen units. */
export const ATOM_CLEAR = 16

export interface Point {
  x: number
  y: number
}

export interface BondArrow {
  kind: 'bond' | 'lone-pair'
  /** Symbol of the ligand (bonds) or 'lone pair'. */
  label: string
  /** The arrow's tail (δ⁺ end) and head (δ⁻ end) when the bonds stand in place. */
  bondStart: Point
  bondEnd: Point
  /** Where the tail sits in the tip-to-tail chain, and the arrow's vector in that chain. */
  chainStart: Point
  chainEnd: Point
  /** Nucleus of the ligand, for drawing the atom and the bond line; null for a lone pair. */
  nucleus: Point | null
  /** Unit-length screen direction of the bond or lone pair from the centre. */
  direction: Point
}

export interface LabScene {
  /** Projects a 3D model vector to screen units, in the view this molecule uses. */
  project: (v: Vec3) => Point
  molecule: LabMolecule
  lonePairOn: boolean
  arrows: BondArrow[]
  /** Lone-pair lobes, drawn even when the lone-pair dipole is switched off. */
  lobes: Point[]
  /** Net dipole from the chain: the end of the last arrow. Equal to the origin when the net is zero. */
  net: Point
  /** True when the model's net dipole is zero within rounding. */
  netIsZero: boolean
  /** Lib net dipole with the lone pairs that are switched on, in model units. */
  netMagnitude: number
}

const ZERO = 1e-6

/**
 * Lays the molecule out in screen units, with the centre at (0, 0). Bonds stand in place
 * first; the chain then stacks the dipole vectors tip to tail from the centre.
 */
export function sceneFor(molecule: LabMolecule, lonePairOn: boolean): LabScene {
  const model = dipoleModelFor(molecule)
  const activeLonePairs = lonePairOn ? model.lonePairDirections : []
  const net = netDipole({ ...model, lonePairDirections: activeLonePairs })
  const project = makeProjector(viewBasisFor(model))
  const arrows: BondArrow[] = []
  let chainX = 0
  let chainY = 0

  const pushArrow = (
    kind: BondArrow['kind'],
    label: string,
    direction3d: Vec3,
    vector3d: Vec3,
    nucleus: Point | null,
    startAtOuter: boolean
  ) => {
    const q = project(direction3d)
    const v = project(vector3d)
    const vx = v.x * ARROW_PX_PER_UNIT
    const vy = v.y * ARROW_PX_PER_UNIT
    const outer = { x: q.x * (BOND_PX - ATOM_CLEAR), y: q.y * (BOND_PX - ATOM_CLEAR) }
    const inner = { x: q.x * ATOM_CLEAR, y: q.y * ATOM_CLEAR }
    const bondStart = startAtOuter ? outer : inner
    const bondEnd = { x: bondStart.x + vx, y: bondStart.y + vy }
    const chainStart = { x: chainX, y: chainY }
    chainX += vx
    chainY += vy
    const chainEnd = { x: chainX, y: chainY }
    const len = Math.hypot(q.x, q.y) || 1
    arrows.push({
      kind,
      label,
      bondStart,
      bondEnd,
      chainStart,
      chainEnd,
      nucleus,
      direction: { x: q.x / len, y: q.y / len },
    })
  }

  model.ligands.forEach((ligand) => {
    const v = bondDipoleVector(model.centre, ligand)
    const d = ligand.direction
    const q = project(d)
    const nucleus = { x: q.x * BOND_PX, y: q.y * BOND_PX }
    // A bond whose δ⁻ end is the ligand points out from the centre; the reverse points in.
    const pointsOut = v[0] * d[0] + v[1] * d[1] + v[2] * d[2] >= 0
    pushArrow('bond', ligand.symbol, d, v, nucleus, !pointsOut)
  })

  const lobes: Point[] = []
  model.lonePairDirections.forEach((u) => {
    const q = project(u)
    const len = Math.hypot(q.x, q.y) || 1
    lobes.push({ x: (q.x / len) * (ATOM_CLEAR + 0.8 * ARROW_PX_PER_UNIT + 14), y: (q.y / len) * (ATOM_CLEAR + 0.8 * ARROW_PX_PER_UNIT + 14) })
    if (lonePairOn) {
      pushArrow('lone-pair', 'lone pair', u, lonePairDipoleVector(u), null, false)
    }
  })

  const netEnd = { x: chainX, y: chainY }
  return {
    project,
    molecule,
    lonePairOn,
    arrows,
    lobes,
    net: netEnd,
    netIsZero: net.magnitude < ZERO,
    netMagnitude: net.magnitude,
  }
}

/**
 * Model magnitudes, in model units, for the two readings that the lone-pair toggle switches
 * between: the bonds alone, and the bonds with their lone pairs.
 */
export function lonePairComparison(molecule: LabMolecule): { bondsOnly: number; withLonePairs: number } {
  const model = dipoleModelFor(molecule)
  return {
    bondsOnly: netDipole({ ...model, lonePairDirections: [] }).magnitude,
    withLonePairs: netDipole(model).magnitude,
  }
}

/** The printed NCERT Table 4.5 row for a molecule. Every lab molecule has one. */
export function printedRow(molecule: LabMolecule) {
  const row = NCERT_TABLE_4_5_DIPOLE_MOMENTS.rows.find((r) => r.molecule === molecule.key)
  if (!row) throw new RangeError(`No Table 4.5 row for ${molecule.key}`)
  return row
}
