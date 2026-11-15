/**
 * Shapes of carbon compounds (NCERT Class 11 Unit 8, Sections 8.2.1 and 8.2.2): the hybridisation
 * of each carbon, the ideal bond angle and s character of each hybrid, the length of a C–C bond by
 * its order, and plain-data geometries of methane, ethene and ethyne for drawings.
 *
 * Every number here comes from the Unit 4 bond radii, the hybrid direction sets in hybridisation.ts
 * or the molecule graph, so the drawings and the readouts cannot disagree with the libraries.
 */

import { estimateBondLength } from './bond-parameters'
import { hybridDirections, sCharacter } from './hybridisation'
import type { MolGraph } from './molecule-graph'
import { hybridisation, neighbours } from './molecule-parse'

/** The three hybrids of carbon in this Section. */
export type CarbonHybrid = 'sp3' | 'sp2' | 'sp'

export const CARBON_HYBRIDS: readonly CarbonHybrid[] = ['sp3', 'sp2', 'sp']

/** A point in the drawing scene, in scene units (y up). */
export type ScenePoint = [number, number, number]

/** Plain data for one atom of a scene: id, element and position. */
export interface SceneAtom {
  id: string
  element: string
  position: ScenePoint
}

/** A bond between two atoms of a scene, by id. */
export interface SceneBond {
  a: string
  b: string
  order: 1 | 2 | 3
}

/** A small molecule's geometry for a 3D drawing. */
export interface ShapeScene {
  atoms: SceneAtom[]
  bonds: SceneBond[]
}

/** Scene units per picometre of a C–C bond: a 154 pm bond is drawn 1.54 units long. */
export const SCENE_UNITS_PER_PM = 0.01

/** Drawn length of a C–H bond, in scene units. It is drawing scale only, and no value is read from it. */
const CH_SCENE_LENGTH = 1.1

/**
 * The ideal bond angle of a carbon hybrid, from the hybrid direction set: 109.5° for sp³, 120° for
 * sp² and 180° for sp. Computed as the angle between the first two hybrid directions.
 */
export function idealBondAngle(hybrid: CarbonHybrid): number {
  const [a, b] = hybridDirections(hybrid)
  const dot = a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
  const degrees = (Math.acos(Math.max(-1, Math.min(1, dot))) * 180) / Math.PI
  return Math.round(degrees * 10) / 10
}

/** Percentage of s character in a carbon hybrid (25, 33.3 or 50), from {@link sCharacter}. */
export function sCharacterPercent(hybrid: CarbonHybrid): number {
  return sCharacter(hybrid) * 100
}

/**
 * Length in pm of a C–C bond of order 1, 2 or 3, estimated as the sum of two Table 4.4 covalent
 * radii for that order (154, 134 and 120 pm).
 */
export function carbonCarbonLengthPm(order: 1 | 2 | 3): number {
  return estimateBondLength('C', 'C', order)
}

/** The hybridisation of carbon atom `i`, from the molecule graph. */
export function carbonHybrid(g: MolGraph, i: number): CarbonHybrid {
  return hybridisation(g, i)
}

/** Indices of the carbon atoms of a molecule, in the order the graph lists them. */
export function carbonIndices(g: MolGraph): number[] {
  return g.atoms.flatMap((atom, i) => (atom.element === 'C' ? [i] : []))
}

/** A bond at a carbon to another carbon, with its order and estimated length. */
export interface CarbonCarbonBond {
  neighbour: number
  order: 1 | 2 | 3
  lengthPm: number
}

/** The C–C bonds at carbon `i`, each with its order and estimated length. Other bonds are left out. */
export function carbonCarbonBondsAt(g: MolGraph, i: number): CarbonCarbonBond[] {
  return neighbours(g, i)
    .filter((n) => g.atoms[n.atom]?.element === 'C')
    .map((n) => {
      const order = n.order as 1 | 2 | 3
      return { neighbour: n.atom, order, lengthPm: carbonCarbonLengthPm(order) }
    })
}

/** The angle in degrees at vertex `b` between the bonds to `a` and to `c`. */
export function angleDeg(a: ScenePoint, b: ScenePoint, c: ScenePoint): number {
  const u = [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
  const v = [c[0] - b[0], c[1] - b[1], c[2] - b[2]]
  const dot = u[0] * v[0] + u[1] * v[1] + u[2] * v[2]
  const lu = Math.hypot(u[0], u[1], u[2])
  const lv = Math.hypot(v[0], v[1], v[2])
  return (Math.acos(Math.max(-1, Math.min(1, dot / (lu * lv)))) * 180) / Math.PI
}

/** Position of an atom in a scene, by id. @throws {RangeError} if the id is not in the scene. */
export function scenePosition(scene: ShapeScene, id: string): ScenePoint {
  const atom = scene.atoms.find((a) => a.id === id)
  if (!atom) throw new RangeError(`No atom ${id} in the scene`)
  return atom.position
}

/** Methane: a tetrahedral carbon at the origin with four H on the sp³ hybrid directions. */
export function methaneScene(): ShapeScene {
  const dirs = hybridDirections('sp3')
  const atoms: SceneAtom[] = [{ id: 'C', element: 'C', position: [0, 0, 0] }]
  const bonds: SceneBond[] = []
  dirs.forEach((d, i) => {
    const id = `H${i + 1}`
    atoms.push({ id, element: 'H', position: [d[0] * CH_SCENE_LENGTH, d[1] * CH_SCENE_LENGTH, d[2] * CH_SCENE_LENGTH] })
    bonds.push({ a: 'C', b: id, order: 1 })
  })
  return { atoms, bonds }
}

/**
 * Ethene: two planar sp² carbons joined by a double bond of 134 pm, each with two H in the plane at
 * 120° to the C–C axis, so every bond angle at a carbon is 120°.
 */
export function ethyleneScene(): ShapeScene {
  const half = carbonCarbonLengthPm(2) * SCENE_UNITS_PER_PM / 2
  const c = Math.cos(Math.PI / 3)
  const s = Math.sin(Math.PI / 3)
  return {
    atoms: [
      { id: 'C1', element: 'C', position: [-half, 0, 0] },
      { id: 'C2', element: 'C', position: [half, 0, 0] },
      { id: 'H1', element: 'H', position: [-half - CH_SCENE_LENGTH * c, CH_SCENE_LENGTH * s, 0] },
      { id: 'H2', element: 'H', position: [-half - CH_SCENE_LENGTH * c, -CH_SCENE_LENGTH * s, 0] },
      { id: 'H3', element: 'H', position: [half + CH_SCENE_LENGTH * c, CH_SCENE_LENGTH * s, 0] },
      { id: 'H4', element: 'H', position: [half + CH_SCENE_LENGTH * c, -CH_SCENE_LENGTH * s, 0] },
    ],
    bonds: [
      { a: 'C1', b: 'C2', order: 2 },
      { a: 'C1', b: 'H1', order: 1 },
      { a: 'C1', b: 'H2', order: 1 },
      { a: 'C2', b: 'H3', order: 1 },
      { a: 'C2', b: 'H4', order: 1 },
    ],
  }
}

/** Ethyne: two linear sp carbons joined by a triple bond of 120 pm, with one H on each, on the axis. */
export function ethyneScene(): ShapeScene {
  const half = carbonCarbonLengthPm(3) * SCENE_UNITS_PER_PM / 2
  return {
    atoms: [
      { id: 'C1', element: 'C', position: [-half, 0, 0] },
      { id: 'C2', element: 'C', position: [half, 0, 0] },
      { id: 'H1', element: 'H', position: [-half - CH_SCENE_LENGTH, 0, 0] },
      { id: 'H2', element: 'H', position: [half + CH_SCENE_LENGTH, 0, 0] },
    ],
    bonds: [
      { a: 'C1', b: 'C2', order: 3 },
      { a: 'C1', b: 'H1', order: 1 },
      { a: 'C2', b: 'H2', order: 1 },
    ],
  }
}

/** A molecule offered in the hybridisation spotter: its SMILES string (names come from iupacName). */
export interface SpotterPreset {
  id: string
  smiles: string
}

/**
 * The molecules of the hybridisation spotter. Each mixes sp³, sp² and sp carbons (or is all one
 * hybrid, as benzene and ethyne are), so the Learner has to read the bonds, not the formula.
 */
export const SPOTTER_PRESETS: readonly SpotterPreset[] = [
  { id: 'propene', smiles: 'C=CC' },
  { id: 'acrylonitrile', smiles: 'C=CC#N' },
  { id: 'propyne', smiles: 'CC#C' },
  { id: 'butadiene', smiles: 'C=CC=C' },
  { id: 'ethanal', smiles: 'CC=O' },
  { id: 'propadiene', smiles: 'C=C=C' },
  { id: 'ethyne', smiles: 'C#C' },
  { id: 'propanone', smiles: 'CC(C)=O' },
  { id: 'ethanoic-acid', smiles: 'CC(=O)O' },
  { id: 'ethanenitrile', smiles: 'CC#N' },
  { id: 'butenyne', smiles: 'C=CC#C' },
  { id: 'benzene', smiles: 'C1=CC=CC=C1' },
  { id: 'but-2-yne', smiles: 'CC#CC' },
  { id: 'but-2-ene', smiles: 'CC=CC' },
  { id: 'ethanol', smiles: 'CCO' },
]

/** A formula with its digits lowered as subscripts, e.g. C7H16 becomes C₇H₁₆. For display only. */
export function subscriptDigits(formula: string): string {
  const sub = ['₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉']
  return formula.replace(/\d/g, (d) => sub[Number(d)])
}
