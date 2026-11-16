/**
 * The three pentanes of Table 9.2 as schematic 3D carbon skeletons, for the boiling-point Step of the
 * radical-chain Scrolly. The bonds come from the SMILES graph; the positions are hand-set so the shapes
 * read clearly (a zigzag chain, a branched chain, a tetrahedral centre). They show shape, not measured
 * geometry, and hydrogens are left out. Names and boiling points come from the lib (iupac-organic,
 * ncert-unit9-tables).
 */

import type { Molecule3DAtom, Molecule3DBond, Molecule3DData } from '@/components/molecule'
import { NCERT_TABLE_9_2_ALKANES } from '@/lib/chem/ncert-unit9-tables'
import { iupacName } from '@/lib/chem/iupac-organic'
import { parseSmiles } from '@/lib/chem/molecule-parse'
import type { Vec3 } from '@/components/molecule/geometry'

/** The three pentanes, in the order the Step shows them: straight chain first. */
export const PENTANE_SMILES = ['CCCCC', 'CCC(C)C', 'CC(C)(C)C'] as const

const ZIGZAG_H = 0.72
const TETRA = 0.866 // 1.5 / √3: puts the four methyls of the centre 1.5 units away

/** Positions by atom index in each SMILES string (see parseSmiles). */
const POSITIONS: Record<(typeof PENTANE_SMILES)[number], Vec3[]> = {
  CCCCC: [
    [0, 0, 0],
    [1.25, ZIGZAG_H, 0],
    [2.5, 0, 0],
    [3.75, ZIGZAG_H, 0],
    [5, 0, 0],
  ],
  'CCC(C)C': [
    [0, 0, 0],
    [1.25, ZIGZAG_H, 0],
    [2.5, 0, 0],
    [2.5, -1.25, 0.9],
    [3.75, ZIGZAG_H, 0],
  ],
  'CC(C)(C)C': [
    [-TETRA, -TETRA, -TETRA],
    [0, 0, 0],
    [TETRA, TETRA, TETRA],
    [TETRA, -TETRA, -TETRA],
    [-TETRA, TETRA, -TETRA],
  ],
}

export interface PentaneModel {
  smiles: (typeof PENTANE_SMILES)[number]
  name: string
  /** Boiling point from NCERT Table 9.2, in kelvin. */
  boilingPointK: number
  data: Molecule3DData
}

/** The Table 9.2 row for a name from the lib, matched without regard to case. */
function boilingPointFor(name: string): number {
  const row = NCERT_TABLE_9_2_ALKANES.rows.find((r) => r.name.toLowerCase() === name.toLowerCase())
  if (!row) throw new RangeError(`"${name}" is not in NCERT Table 9.2`)
  return row.boilingPointK
}

/** The 3D data of one pentane: atoms and bonds from the graph, positions from POSITIONS. */
export function pentaneData(smiles: (typeof PENTANE_SMILES)[number]): Molecule3DData {
  const g = parseSmiles(smiles)
  const pos = POSITIONS[smiles]
  if (pos.length !== g.atoms.length) throw new RangeError('The positions do not match the atoms of the graph')
  const atoms: Molecule3DAtom[] = g.atoms.map((a, i) => ({ id: `c${i}`, element: a.element, position: pos[i] }))
  const bonds: Molecule3DBond[] = g.bonds.map((b) => ({ a: `c${b.a}`, b: `c${b.b}`, order: 1 }))
  return { atoms, bonds }
}

/** The three pentane models, with names and boiling points from the lib. */
export function pentaneModels(): PentaneModel[] {
  return PENTANE_SMILES.map((smiles) => {
    const name = iupacName(parseSmiles(smiles))
    return { smiles, name, boilingPointK: boilingPointFor(name), data: pentaneData(smiles) }
  })
}
