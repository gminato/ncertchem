import { atomRadius } from '@/components/vocab/atom'
import { MOLECULE_LAYOUTS } from '@/components/vocab/molecules'

/**
 * Pure geometry for the molecular Animations in Unit 1. Molecules are placed from the
 * shared MOLECULE_LAYOUTS table, can be pulled apart into their atoms (`explode`), and
 * can be morphed atom by atom into the atoms of another arrangement. Atoms keep their
 * identity through a morph, so the atom count of each element is visibly conserved.
 */

/** A single atom in a scene. `mol` is the index of the molecule it belongs to. */
export interface SceneAtom {
  element: string
  x: number
  y: number
  /** Sphere radius in SVG units, already scaled. */
  r: number
  mol: number
}

/** A bond between two atoms, by their index in `atoms`. */
export interface SceneBond {
  a: number
  b: number
}

export interface Scene {
  atoms: SceneAtom[]
  bonds: SceneBond[]
}

/** Where to draw one molecule: a formula from MOLECULE_LAYOUTS, a centre and a scale. */
export interface MoleculeSite {
  formula: string
  cx: number
  cy: number
  scale: number
}

/** How far the atoms of a molecule fly apart at explode = 1, as a multiple of their bond offset. */
export const EXPLODE_FACTOR = 1.2

/** Ball-and-stick spheres are this fraction of the element's default radius. */
const BALL_FACTOR = 0.62

/** Sphere radius for an atom drawn at `scale` in ball-and-stick style. */
export function ballRadius(element: string, scale: number): number {
  return atomRadius(element) * BALL_FACTOR * scale
}

/**
 * Places molecules. Each atom sits at its layout position, scaled, and pushed
 * outward from the molecule's centre when `explode` is above zero.
 *
 * @throws {RangeError} On a formula with no layout in MOLECULE_LAYOUTS
 */
export function placeMolecules(sites: readonly MoleculeSite[], explode = 0): Scene {
  const atoms: SceneAtom[] = []
  const bonds: SceneBond[] = []
  sites.forEach((site, mol) => {
    const layout = MOLECULE_LAYOUTS[site.formula]
    if (!layout) {
      throw new RangeError(`No molecule layout for "${site.formula}"`)
    }
    const offset = 1 + explode * EXPLODE_FACTOR
    const base = atoms.length
    layout.atoms.forEach((atom) => {
      atoms.push({
        element: atom.element,
        x: site.cx + atom.x * site.scale * offset,
        y: site.cy + atom.y * site.scale * offset,
        r: ballRadius(atom.element, site.scale),
        mol,
      })
    })
    layout.bonds.forEach((bond) => {
      bonds.push({ a: base + bond.a, b: base + bond.b })
    })
  })
  return { atoms, bonds }
}

/**
 * For each atom in `from`, the index of the atom in `to` that it becomes. Atoms are
 * paired in list order within each element, so the i-th H of `from` maps to the i-th
 * H of `to`. Element counts must match, which is what makes the morph conserve atoms.
 *
 * @throws {RangeError} If the element counts of the two lists differ
 */
export function pairAtoms(from: readonly SceneAtom[], to: readonly SceneAtom[]): number[] {
  const queues = new Map<string, number[]>()
  to.forEach((atom, index) => {
    const queue = queues.get(atom.element) ?? []
    queue.push(index)
    queues.set(atom.element, queue)
  })
  const targetOf = from.map((atom) => {
    const queue = queues.get(atom.element)
    const target = queue?.shift()
    if (target === undefined) {
      throw new RangeError(`Atom count for ${atom.element} differs between the two scenes`)
    }
    return target
  })
  for (const [element, queue] of queues) {
    if (queue.length > 0) {
      throw new RangeError(`Atom count for ${element} differs between the two scenes`)
    }
  }
  return targetOf
}

/** A position for one atom partway through a morph. */
export interface MovingAtom {
  element: string
  x: number
  y: number
  r: number
}

/**
 * Positions of the atoms of `from` at morph progress t (0 = at `from`, 1 = at their
 * partner in `to`). Each atom moves in a straight line; the radius is kept from `from`.
 */
export function morphAtoms(
  from: readonly SceneAtom[],
  to: readonly SceneAtom[],
  targetOf: readonly number[],
  t: number
): MovingAtom[] {
  const p = Math.min(1, Math.max(0, t))
  return from.map((atom, i) => {
    const goal = to[targetOf[i]]
    return {
      element: atom.element,
      x: atom.x + (goal.x - atom.x) * p,
      y: atom.y + (goal.y - atom.y) * p,
      r: atom.r,
    }
  })
}

/** Counts of each element in a list of atoms, e.g. { H: 4, O: 2 }. */
export function elementCounts(atoms: readonly { element: string }[]): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const atom of atoms) {
    counts[atom.element] = (counts[atom.element] ?? 0) + 1
  }
  return counts
}

/**
 * The inverse of `pairAtoms`: for each atom in `to`, the index of the atom in `from`
 * that became it. Used to carry the bonds of the product scene back onto the moving atoms.
 */
export function invertPairing(targetOf: readonly number[]): number[] {
  const inverse: number[] = new Array(targetOf.length)
  targetOf.forEach((j, i) => {
    inverse[j] = i
  })
  return inverse
}
