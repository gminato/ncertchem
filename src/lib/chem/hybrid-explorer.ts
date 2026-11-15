/**
 * The model behind the hybrid explorer (NCERT Class 11 Unit 4, Section 4.6). For a central atom
 * it gives the ground-state orbital boxes, the promoted state (the same valence electrons with
 * as many unpaired electrons as the bonds need), the hybrid set with its leftover unhybridised
 * p (or d) orbitals, and a plain-data geometry for drawing the molecule.
 *
 * Electron counts are the only chemistry here: every orbital count comes from hybridisation.ts,
 * the ground state from quantum.ts and the valence electron count from periodic-data.ts.
 */

import { hybridisationFor, hybridisedOrbitals, stericNumber, type Hybridisation, NCERT_HYBRIDISATION_EXAMPLES } from './hybridisation'
import { orbitalDiagram } from './quantum'
import { elementBySymbol, valenceElectrons } from './periodic-data'
import { vseprPositions, type Vec3 } from './vsepr'

/** A box of one orbital, holding 0, 1 or 2 electrons. */
export type BoxFill = 0 | 1 | 2

/** One subshell drawn as a row of boxes, with the electrons in each box. */
export interface SubshellBoxes {
  label: string
  boxes: BoxFill[]
}

/** The centre atoms the explorer offers. Bond counts are for the central atom. */
export interface HybridCentre {
  /** Key used by the Simulation and tests. */
  id: string
  /** Display formula of the whole molecule, in conventional form. */
  molecule: string
  /** Symbol of the central atom whose orbitals are drawn. */
  centre: string
  /** Symbol of the bonded atom (for the Lewis-style label). */
  ligand: string
  /** σ bonds the central atom forms with its neighbours (multiple bonds counted once). */
  bondedAtoms: number
  /** Lone pairs on the central atom. */
  lonePairs: number
  /** π bonds the central atom takes part in (one per extra bond of a multiple bond). */
  piBonds: number
}

export const HYBRID_CENTRES: readonly HybridCentre[] = [
  { id: 'BeCl2', molecule: 'BeCl₂', centre: 'Be', ligand: 'Cl', bondedAtoms: 2, lonePairs: 0, piBonds: 0 },
  { id: 'BCl3', molecule: 'BCl₃', centre: 'B', ligand: 'Cl', bondedAtoms: 3, lonePairs: 0, piBonds: 0 },
  { id: 'CH4', molecule: 'CH₄', centre: 'C', ligand: 'H', bondedAtoms: 4, lonePairs: 0, piBonds: 0 },
  { id: 'NH3', molecule: 'NH₃', centre: 'N', ligand: 'H', bondedAtoms: 3, lonePairs: 1, piBonds: 0 },
  { id: 'H2O', molecule: 'H₂O', centre: 'O', ligand: 'H', bondedAtoms: 2, lonePairs: 2, piBonds: 0 },
  { id: 'C2H4', molecule: 'C₂H₄ (each C)', centre: 'C', ligand: 'H', bondedAtoms: 3, lonePairs: 0, piBonds: 1 },
  { id: 'C2H2', molecule: 'C₂H₂ (each C)', centre: 'C', ligand: 'H', bondedAtoms: 2, lonePairs: 0, piBonds: 2 },
  { id: 'PCl5', molecule: 'PCl₅', centre: 'P', ligand: 'Cl', bondedAtoms: 5, lonePairs: 0, piBonds: 0 },
  { id: 'SF6', molecule: 'SF₆', centre: 'S', ligand: 'F', bondedAtoms: 6, lonePairs: 0, piBonds: 0 },
]

/** Looks up a centre by its id. @throws {RangeError} for an unknown id. */
export function hybridCentre(id: string): HybridCentre {
  const found = HYBRID_CENTRES.find((c) => c.id === id)
  if (!found) throw new RangeError(`No hybrid centre called ${id}`)
  return found
}

/** The hybridisation of a centre, from its steric number (bonded atoms plus lone pairs). */
export function centreHybridisation(c: HybridCentre): Hybridisation {
  return hybridisationFor(stericNumber(c.bondedAtoms, c.lonePairs))
}

/** The conventional label, e.g. "sp²" or "sp³d". */
export function hybridLabel(h: Hybridisation): string {
  return {
    sp: 'sp',
    sp2: 'sp²',
    sp3: 'sp³',
    sp3d: 'sp³d',
    sp3d2: 'sp³d²',
  }[h]
}

/** Atomic number of a symbol. @throws {RangeError} for an unknown symbol. */
export function atomicNumberOf(symbol: string): number {
  const record = elementBySymbol(symbol)
  if (!record) throw new RangeError(`Unknown element symbol ${symbol}`)
  return record.Z
}

/** Valence electrons of the centre atom. */
export function centreValenceElectrons(c: HybridCentre): number {
  const v = valenceElectrons(atomicNumberOf(c.centre))
  if (v === null) throw new RangeError(`${c.centre} has no main-group valence count`)
  return v
}

/** Highest principal quantum number among the occupied subshells: the valence shell. */
function valenceShellN(Z: number): number {
  return Math.max(...orbitalDiagram(Z).map((s) => Number.parseInt(s.label, 10)))
}

/**
 * The valence subshells of the centre in the ground state, as box rows: s and p of the valence
 * shell, and for a third-period centre the d row as well. Subshells with no electrons are
 * listed too (empty boxes), because the promoted state and the hybrids need them.
 */
export function groundStateRows(c: HybridCentre): SubshellBoxes[] {
  const Z = atomicNumberOf(c.centre)
  const n = valenceShellN(Z)
  const diagram = orbitalDiagram(Z)
  const letters = n >= 3 ? ['s', 'p', 'd'] : ['s', 'p']
  const sizes: Record<string, number> = { s: 1, p: 3, d: 5 }
  return letters.map((letter) => {
    const label = `${n}${letter}`
    const occupied = diagram.find((s) => s.label === label)
    const boxes: BoxFill[] = occupied
      ? occupied.orbitals.map((o): BoxFill => (o.up && o.down ? 2 : o.up ? 1 : 0))
      : Array.from({ length: sizes[letter] }, (): BoxFill => 0)
    return { label, boxes }
  })
}

/**
 * The promoted state: the centre's valence electrons spread one to a box across the valence
 * subshells (s, then p, then d), and only then paired. For C this gives 2s¹ 2p³, which is the
 * state with four unpaired electrons that NCERT uses for CH₄.
 */
export function promotedRows(c: HybridCentre): SubshellBoxes[] {
  const rows = groundStateRows(c).map((r) => ({ label: r.label, boxes: r.boxes.map((): BoxFill => 0) }))
  let remaining = centreValenceElectrons(c)
  for (const row of rows) {
    for (let i = 0; i < row.boxes.length && remaining > 0; i++) {
      row.boxes[i] = 1
      remaining--
    }
  }
  for (const row of rows) {
    for (let i = 0; i < row.boxes.length && remaining > 0; i++) {
      row.boxes[i] = 2
      remaining--
    }
  }
  return rows
}

/** Number of unpaired electrons in a set of rows. */
export function unpairedIn(rows: readonly SubshellBoxes[]): number {
  return rows.reduce((sum, r) => sum + r.boxes.filter((b) => b === 1).length, 0)
}

/** True when promotion is needed: the promoted state has more unpaired electrons than the ground state. */
export function promotionNeeded(c: HybridCentre): boolean {
  return unpairedIn(promotedRows(c)) > unpairedIn(groundStateRows(c))
}

/** The hybrid set: one box per hybrid orbital, with its electrons, and the leftover orbitals. */
export interface HybridState {
  hybrid: Hybridisation
  label: string
  /** One box per hybrid: one electron for a bonding hybrid, two for a lone pair. */
  hybrids: BoxFill[]
  /** Unhybridised p orbitals left over. An electron in one of them makes a π bond. */
  leftoverP: BoxFill[]
  /** Unhybridised d orbitals left over (empty for every centre here). */
  leftoverD: BoxFill[]
  /** Electrons across all boxes. Equals the centre's valence electron count. */
  electrons: number
  /** Number of hybrid orbitals that take part in σ bonds. */
  sigmaHybrids: number
}

/** The hybrid set for a centre, with the electrons placed as NCERT's bookkeeping does. */
export function hybridState(c: HybridCentre): HybridState {
  const hybrid = centreHybridisation(c)
  const used = hybridisedOrbitals(hybrid)
  const hybrids: BoxFill[] = [
    ...Array.from({ length: c.bondedAtoms }, (): BoxFill => 1),
    ...Array.from({ length: c.lonePairs }, (): BoxFill => 2),
  ]
  const usedP = used.filter((o) => o === 'p').length
  const usedD = used.filter((o) => o === 'd').length
  const hasD = used.length > 0 && (hybrid === 'sp3d' || hybrid === 'sp3d2')
  const totalP = 3
  const totalD = hasD ? 5 : 0
  const leftoverP: BoxFill[] = Array.from({ length: totalP - usedP }, (_, i): BoxFill => (i < c.piBonds ? 1 : 0))
  const leftoverD: BoxFill[] = Array.from({ length: totalD - usedD }, (): BoxFill => 0)
  const electrons =
    hybrids.reduce<number>((sum, b) => sum + b, 0) + leftoverP.reduce<number>((sum, b) => sum + b, 0)
  return {
    hybrid,
    label: hybridLabel(hybrid),
    hybrids,
    leftoverP,
    leftoverD,
    electrons,
    sigmaHybrids: c.bondedAtoms,
  }
}

/** The NCERT whole-molecule σ and π counts for a centre's molecule (Section 4.6). */
export function sigmaPiCounts(c: HybridCentre): { sigma: number; pi: number } {
  const example = NCERT_HYBRIDISATION_EXAMPLES.find((e) => e.molecule === c.id)
  if (!example) throw new RangeError(`No NCERT example for ${c.id}`)
  return { sigma: example.sigmaBonds, pi: example.piBonds }
}

/** A drawn atom: element symbol, a stable id and a 3D position in the scene (y up). */
export interface GeometryAtom {
  id: string
  element: string
  position: Vec3
}

export interface GeometryBond {
  a: string
  b: string
  order: 1 | 2 | 3
}

export interface GeometryLonePair {
  atom: string
  direction: Vec3
}

export interface MoleculeGeometry {
  atoms: GeometryAtom[]
  bonds: GeometryBond[]
  lonePairs: GeometryLonePair[]
}

/** Distance from the centre to each bonded atom in scene units. */
const BOND_SCENE = 1.6

/** Maps a VSEPR library vector (axial along z) to the scene (y up), as the molecule fixtures do. */
const toScene = (v: Vec3): Vec3 => [-v[0] * BOND_SCENE, v[2] * BOND_SCENE, v[1] * BOND_SCENE]

/** Molecules drawn with VSEPR directions, keyed by the centre id. */
const VSEPR_MOLECULES: Readonly<Record<string, { centre: string; ligand: string; bonds: number; lp: number }>> = {
  BeCl2: { centre: 'Be', ligand: 'Cl', bonds: 2, lp: 0 },
  BCl3: { centre: 'B', ligand: 'Cl', bonds: 3, lp: 0 },
  CH4: { centre: 'C', ligand: 'H', bonds: 4, lp: 0 },
  NH3: { centre: 'N', ligand: 'H', bonds: 3, lp: 1 },
  H2O: { centre: 'O', ligand: 'H', bonds: 2, lp: 2 },
  PCl5: { centre: 'P', ligand: 'Cl', bonds: 5, lp: 0 },
  SF6: { centre: 'S', ligand: 'F', bonds: 6, lp: 0 },
}

/**
 * Plain-data geometry of the molecule for a centre id: VSEPR directions for the AB_n shapes,
 * and explicit planar coordinates for ethene (H–C–C about 121°) and ethyne (linear).
 *
 * @throws {RangeError} For an unknown id
 */
export function moleculeGeometry(id: string): MoleculeGeometry {
  if (id === 'C2H4') {
    const cc = 0.8
    const ch = 1.1
    const hx = ch * Math.cos((59 * Math.PI) / 180)
    const hy = ch * Math.sin((59 * Math.PI) / 180)
    return {
      atoms: [
        { id: 'C1', element: 'C', position: [-cc, 0, 0] },
        { id: 'C2', element: 'C', position: [cc, 0, 0] },
        { id: 'H1', element: 'H', position: [-cc - hx, hy, 0] },
        { id: 'H2', element: 'H', position: [-cc - hx, -hy, 0] },
        { id: 'H3', element: 'H', position: [cc + hx, hy, 0] },
        { id: 'H4', element: 'H', position: [cc + hx, -hy, 0] },
      ],
      bonds: [
        { a: 'C1', b: 'C2', order: 2 },
        { a: 'C1', b: 'H1', order: 1 },
        { a: 'C1', b: 'H2', order: 1 },
        { a: 'C2', b: 'H3', order: 1 },
        { a: 'C2', b: 'H4', order: 1 },
      ],
      lonePairs: [],
    }
  }
  if (id === 'C2H2') {
    return {
      atoms: [
        { id: 'C1', element: 'C', position: [-0.6, 0, 0] },
        { id: 'C2', element: 'C', position: [0.6, 0, 0] },
        { id: 'H1', element: 'H', position: [-1.6, 0, 0] },
        { id: 'H2', element: 'H', position: [1.6, 0, 0] },
      ],
      bonds: [
        { a: 'C1', b: 'C2', order: 3 },
        { a: 'C1', b: 'H1', order: 1 },
        { a: 'C2', b: 'H2', order: 1 },
      ],
      lonePairs: [],
    }
  }
  const spec = VSEPR_MOLECULES[id]
  if (!spec) throw new RangeError(`No geometry for ${id}`)
  const { bonds, lonePairs } = vseprPositions(spec.bonds, spec.lp)
  const atoms: GeometryAtom[] = [{ id: spec.centre, element: spec.centre, position: [0, 0, 0] }]
  bonds.forEach((b, i) => atoms.push({ id: `${spec.ligand}${i + 1}`, element: spec.ligand, position: toScene(b) }))
  return {
    atoms,
    bonds: bonds.map((_b, i) => ({ a: spec.centre, b: `${spec.ligand}${i + 1}`, order: 1 as const })),
    lonePairs: lonePairs.map((lp) => ({ atom: spec.centre, direction: toScene(lp) })),
  }
}

/** Plain-English summary of one centre, used by the live readout and the tests. */
export function describeCentre(c: HybridCentre): string {
  const state = hybridState(c)
  const { sigma, pi } = sigmaPiCounts(c)
  return `${c.molecule}: central ${c.centre} is ${state.label}, with ${sigma} σ and ${pi} π bond${pi === 1 ? '' : 's'} in the molecule.`
}
