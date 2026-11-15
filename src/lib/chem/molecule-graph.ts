/**
 * The shared shape of an organic molecule as a graph (Unit 8 onwards). The chemistry models
 * (parsing, naming, isomers, electronic effects) produce and consume it, and the drawing
 * components (src/components/organic) render it. Types only: keep logic in the modules that
 * use it, so both sides can be built independently.
 *
 * Hydrogens on carbon are implicit, as in a bond-line formula: `hCount` gives them when a
 * module has worked them out. Atoms are referred to by their index in `atoms`.
 */

/** An atom of the molecule. */
export interface MolAtom {
  /** Element symbol, e.g. 'C', 'O', 'N', 'Cl'. */
  element: string
  /** Formal charge, e.g. +1 for a carbocation centre. Defaults to 0. */
  charge?: number
  /** Unpaired electrons, e.g. 1 for a free-radical centre. Defaults to 0. */
  radical?: number
  /** Hydrogens attached to this atom (implicit in drawings of carbon). */
  hCount?: number
  /** Optional 2D position in drawing units (one bond is 1 unit long). */
  x?: number
  y?: number
}

/** Wedge (towards the viewer) or dash (away), drawn from atom `a` to atom `b`. */
export type BondStereo = 'wedge' | 'dash'

/** A covalent bond between atoms `a` and `b` (indices into `atoms`). */
export interface MolBond {
  a: number
  b: number
  order: 1 | 2 | 3
  stereo?: BondStereo
}

/** A molecule or ion as a graph. Rings are ordinary cycles; benzene is written in Kekulé form. */
export interface MolGraph {
  atoms: MolAtom[]
  bonds: MolBond[]
}
