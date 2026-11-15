/**
 * Target states of the structure-morph Scrolly (Section 8.3). Each Step names the molecule and the
 * way it is drawn. The morph (complete to bond-line) and the condensed fade are tweened by the
 * component; this file only says where each Step ends up. Molecules are SMILES read by the lib.
 */
import type { Molecule3DData } from '@/components/molecule/molecule-data'
import { parseSmiles } from '@/lib/chem/molecule-parse'
import type { MolGraph } from '@/lib/chem/molecule-graph'

/** 4-methylpentan-2-ol, the molecule that is morphed through three written forms. */
export const MORPH_SMILES = 'CC(O)CC(C)C'
/** Cyclohexane, a ring of six CH₂ corners. */
export const CYCLOHEXANE_SMILES = 'C1CCCCC1'
/** Methylbenzene: a benzene ring in Kekulé form with a methyl group on one carbon. */
export const ARENE_SMILES = 'CC1=CC=CC=C1'
/** Bromochlorofluoromethane, a carbon with four different groups. */
export const TETRAHEDRAL_SMILES = 'FC(Cl)Br'

export type RepresentationStep =
  | { kind: 'complete'; smiles: string }
  | { kind: 'condensed'; smiles: string }
  | { kind: 'bond-line'; smiles: string }
  | { kind: 'ring'; smiles: string }
  | { kind: 'arene'; smiles: string }
  | { kind: 'tetrahedral'; smiles: string }

/** The six Steps, in the order the Section tells them. */
export function representationSteps(): readonly RepresentationStep[] {
  return [
    { kind: 'complete', smiles: MORPH_SMILES },
    { kind: 'condensed', smiles: MORPH_SMILES },
    { kind: 'bond-line', smiles: MORPH_SMILES },
    { kind: 'ring', smiles: CYCLOHEXANE_SMILES },
    { kind: 'arene', smiles: ARENE_SMILES },
    { kind: 'tetrahedral', smiles: TETRAHEDRAL_SMILES },
  ]
}

/** Where the complete-to-bond-line morph ends for a Step: 0 is the complete formula, 1 the bond-line drawing. */
export function morphTarget(step: RepresentationStep): 0 | 1 {
  return step.kind === 'bond-line' ? 1 : 0
}

/** 1 while the condensed line is shown in place of the complete formula, 0 otherwise. */
export function condensedFade(step: RepresentationStep): 0 | 1 {
  return step.kind === 'condensed' ? 1 : 0
}

/** Lib-parsed graph for a SMILES string used by a Step. */
export function stepGraph(smiles: string): MolGraph {
  return parseSmiles(smiles)
}

/** Tetrahedral vertices of a carbon, as unit directions (an ideal tetrahedron, bond angle 109.47°). */
const VERTICES: readonly [number, number, number][] = [
  [1, 1, 1],
  [1, -1, -1],
  [-1, 1, -1],
  [-1, -1, 1],
].map(([x, y, z]) => {
  const n = Math.sqrt(3)
  return [x / n, y / n, z / n] as [number, number, number]
})

/** Carbon–substituent distance in ångström, a typical C–X length. */
const BOND_LENGTH = 1.1

/**
 * A 3D model of a carbon with four substituents on the corners of a tetrahedron. The substituents
 * are its heavy-atom neighbours and its implicit hydrogens (hCount), in that order.
 *
 * @throws {RangeError} If the carbon does not have four substituents in all
 */
export function tetrahedralModel(g: MolGraph, carbon: number): Molecule3DData {
  const heavy = g.bonds.flatMap((b) => (b.a === carbon ? [g.atoms[b.b].element] : b.b === carbon ? [g.atoms[b.a].element] : []))
  const hydrogens = Array.from({ length: g.atoms[carbon].hCount ?? 0 }, () => 'H')
  const elements = [...heavy, ...hydrogens]
  if (elements.length !== 4) throw new RangeError('tetrahedralModel needs a carbon with four substituents')
  const atoms: Molecule3DData['atoms'] = [{ id: 'C', element: 'C', position: [0, 0, 0] }]
  const bonds: Molecule3DData['bonds'] = []
  elements.forEach((element, k) => {
    const v = VERTICES[k]
    const id = `X${k}`
    atoms.push({ id, element, position: [v[0] * BOND_LENGTH, v[1] * BOND_LENGTH, v[2] * BOND_LENGTH] })
    bonds.push({ a: 'C', b: id, order: 1 })
  })
  return { atoms, bonds }
}
