/**
 * Isomer families for Unit 8, Section 8.6 (Isomerism): the sets of molecules that the isomer
 * animation and the isomer explorer draw, the relation between any two of them, and the cis and
 * trans geometries of but-2-ene.
 *
 * Every structure is a MolGraph from a SMILES string (or from alkaneIsomers). Every name comes
 * from iupacName and every relation from isomerRelation; nothing here hard-codes a name.
 */

import type { MolGraph } from './molecule-graph'
import { alkaneIsomers, isomerRelation, type IsomerRelation } from './isomers'
import { iupacName } from './iupac-organic'
import { molecularFormula, parseSmiles, toCondensed } from './molecule-parse'

/** One molecule of a family: its graph, IUPAC name and condensed formula (null for a ring). */
export interface FamilyMember {
  graph: MolGraph
  name: string
  condensed: string | null
}

/** The formulas the explorer offers. */
export type FamilyId = 'C4H10' | 'C5H12' | 'C6H14' | 'C7H16' | 'C2H6O' | 'C3H6O' | 'C3H8O' | 'C4H10O'

/** A formula and the isomers drawn for it. */
export interface IsomerFamily {
  id: FamilyId
  /** Molecular formula, e.g. 'C7H16'. */
  formula: string
  /** True when `members` lists every structural isomer of the formula (acyclic, saturated sets). */
  complete: boolean
  members: FamilyMember[]
}

/** Alkane formulas come from alkaneIsomers; the others are curated SMILES sets. */
const ALKANE_IDS: Record<string, number> = { C4H10: 4, C5H12: 5, C6H14: 6, C7H16: 7 }

/**
 * Curated sets. The C2H6O, C3H8O and C4H10O sets hold every saturated acyclic isomer of the
 * formula; the C3H6O set is a selection (it also has ring, enol and other forms not drawn here).
 */
const CURATED: Record<'C2H6O' | 'C3H6O' | 'C3H8O' | 'C4H10O', { complete: boolean; smiles: string[] }> = {
  C2H6O: { complete: true, smiles: ['CCO', 'COC'] },
  C3H6O: { complete: false, smiles: ['CCC=O', 'CC(=O)C', 'C=CCO', 'OC1CC1'] },
  C3H8O: { complete: true, smiles: ['CCCO', 'CC(C)O', 'CCOC'] },
  C4H10O: { complete: true, smiles: ['CCCCO', 'CCC(C)O', 'CC(C)CO', 'CC(C)(C)O', 'CCOCC', 'CCCOC', 'CC(C)OC'] },
}

/** Every formula the isomer explorer offers, in display order. */
export const FAMILY_IDS: readonly FamilyId[] = ['C4H10', 'C5H12', 'C6H14', 'C7H16', 'C2H6O', 'C3H8O', 'C3H6O', 'C4H10O']

function member(graph: MolGraph, name: string): FamilyMember {
  let condensed: string | null = null
  try {
    condensed = toCondensed(graph)
  } catch {
    // toCondensed covers acyclic molecules only; a ring is drawn with its name and formula instead.
  }
  return { graph, name, condensed }
}

/**
 * The isomer family for a formula. Built once per formula.
 *
 * @throws {RangeError} If the id is not in FAMILY_IDS
 */
export function isomerFamily(id: FamilyId): IsomerFamily {
  const cached = cache.get(id)
  if (cached) return cached
  let family: IsomerFamily
  if (id in ALKANE_IDS) {
    const n = ALKANE_IDS[id]
    family = {
      id,
      formula: id,
      complete: true,
      members: alkaneIsomers(n).map((iso) => member(iso.graph, iso.name)),
    }
  } else if (id in CURATED) {
    const set = CURATED[id as keyof typeof CURATED]
    family = {
      id,
      formula: id,
      complete: set.complete,
      members: set.smiles.map((smiles) => {
        const graph = parseSmiles(smiles)
        if (molecularFormula(graph) !== id) throw new RangeError(`${smiles} is not ${id}`)
        return member(graph, iupacName(graph))
      }),
    }
  } else {
    throw new RangeError(`Unknown isomer family ${id}`)
  }
  cache.set(id, family)
  return family
}

const cache = new Map<FamilyId, IsomerFamily>()

/** Number of structural isomers of CnH(2n+2), from the enumeration (1 <= n <= 7). */
export function alkaneIsomerCount(n: number): number {
  return alkaneIsomers(n).length
}

/** A plain-language sentence for an IsomerRelation, as NCERT 8.6.1 classifies them. */
export function relationPhrase(relation: IsomerRelation): string {
  switch (relation) {
    case 'identical':
      return 'the same molecule drawn twice'
    case 'chain':
      return 'chain isomers: the carbon skeletons differ'
    case 'position':
      return 'position isomers: the same skeleton and groups, with a group or multiple bond in another place'
    case 'functional':
      return 'functional isomers: the functional groups differ'
    case 'metamerism':
      return 'metamers: the same functional group with different alkyl groups on either side'
    case 'not isomers':
      return 'not isomers: the molecular formulas differ'
  }
}

/** The relation between two members, from isomerRelation, with its phrase. */
export function compareMembers(a: FamilyMember, b: FamilyMember): { relation: IsomerRelation; phrase: string } {
  const relation = isomerRelation(a.graph, b.graph)
  return { relation, phrase: relationPhrase(relation) }
}

/* ---------- cis and trans but-2-ene (Section 8.6.2) ---------- */

/** An atom of a 3D geometry: id, element and position in scene units (one C–C bond is about 1). */
export interface Geometry3DAtom {
  id: string
  element: 'C' | 'H'
  position: [number, number, number]
}

/** A bond of a 3D geometry, between atom ids. Double bonds are order 2. */
export interface Geometry3DBond {
  a: string
  b: string
  order: 1 | 2
}

/** A 3D geometry of an alkene: its atoms and bonds. */
export interface AlkeneGeometry {
  atoms: Geometry3DAtom[]
  bonds: Geometry3DBond[]
}

export type AlkeneConfiguration = 'cis' | 'trans'

const CC_BOND = 1
const CH_BOND = 0.75
/** sin 60°: the in-plane offset of a 120° sp² bond. */
const S60 = Math.sqrt(3) / 2

/** Unit vector, and a vector scaled to a length. */
const unit = (v: [number, number, number]): [number, number, number] => {
  const l = Math.hypot(v[0], v[1], v[2])
  return [v[0] / l, v[1] / l, v[2] / l]
}
const add = (p: [number, number, number], v: [number, number, number], s = 1): [number, number, number] => [
  p[0] + v[0] * s,
  p[1] + v[1] * s,
  p[2] + v[2] * s,
]
const cross = (a: [number, number, number], b: [number, number, number]): [number, number, number] => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
]

/**
 * The three hydrogens of a methyl carbon at `centre`, bonded in direction `dir` (unit vector from
 * the carbon it hangs from). Each C–H makes 109.5° with the C–C bond, and the three are spaced
 * 120° apart around it.
 */
function methylHydrogens(centre: [number, number, number], dir: [number, number, number]): [number, number, number][] {
  const e1: [number, number, number] = [0, 0, 1]
  const e2 = unit(cross(dir, e1))
  const cosA = Math.cos((70.5 * Math.PI) / 180) // angle between the C–H and the outward C–C direction
  const sinA = Math.sin((70.5 * Math.PI) / 180)
  return [0, 120, 240].map((deg) => {
    const phi = (deg * Math.PI) / 180
    const h: [number, number, number] = [
      cosA * dir[0] + sinA * (Math.cos(phi) * e1[0] + Math.sin(phi) * e2[0]),
      cosA * dir[1] + sinA * (Math.cos(phi) * e1[1] + Math.sin(phi) * e2[1]),
      cosA * dir[2] + sinA * (Math.cos(phi) * e1[2] + Math.sin(phi) * e2[2]),
    ]
    return add(centre, h, CH_BOND)
  })
}

/**
 * The geometry of but-2-ene (CH₃CH=CHCH₃) in one configuration. The C=C bond lies along x; the
 * sp² carbons are planar (120° angles) and the methyl groups are tetrahedral. In cis-but-2-ene
 * both CH₃ groups lie on the same side of the C=C axis; in trans-but-2-ene they are on opposite
 * sides.
 */
export function but2eneGeometry(config: AlkeneConfiguration): AlkeneGeometry {
  const C2: [number, number, number] = [-CC_BOND / 2, 0, 0]
  const C3: [number, number, number] = [CC_BOND / 2, 0, 0]
  const sign = config === 'cis' ? 1 : -1
  const dirC2 = unit([-0.5, S60, 0]) // C2 to C1, 120° from the C=C axis
  const dirC3 = unit([0.5, sign * S60, 0]) // C3 to C4
  const C1 = add(C2, dirC2, CC_BOND)
  const C4 = add(C3, dirC3, CC_BOND)
  const H2 = add(C2, [-0.5, -S60, 0], CH_BOND)
  const H3 = add(C3, [0.5, -sign * S60, 0], CH_BOND)
  const hC1 = methylHydrogens(C1, dirC2)
  const hC4 = methylHydrogens(C4, dirC3)

  const atoms: Geometry3DAtom[] = [
    { id: 'C1', element: 'C', position: C1 },
    { id: 'C2', element: 'C', position: C2 },
    { id: 'C3', element: 'C', position: C3 },
    { id: 'C4', element: 'C', position: C4 },
    { id: 'H2', element: 'H', position: H2 },
    { id: 'H3', element: 'H', position: H3 },
    ...hC1.map((p, i) => ({ id: `H1${'abc'[i]}`, element: 'H' as const, position: p })),
    ...hC4.map((p, i) => ({ id: `H4${'abc'[i]}`, element: 'H' as const, position: p })),
  ]
  const bonds: Geometry3DBond[] = [
    { a: 'C1', b: 'C2', order: 1 },
    { a: 'C2', b: 'C3', order: 2 },
    { a: 'C3', b: 'C4', order: 1 },
    { a: 'C2', b: 'H2', order: 1 },
    { a: 'C3', b: 'H3', order: 1 },
    ...['a', 'b', 'c'].flatMap((k) => [
      { a: 'C1', b: `H1${k}`, order: 1 as const },
      { a: 'C4', b: `H4${k}`, order: 1 as const },
    ]),
  ]
  return { atoms, bonds }
}

/**
 * Whether the two methyl carbons of a but-2-ene geometry lie on the same side of the C=C axis
 * (cis) or on opposite sides (trans), from the positions of the atoms.
 *
 * @throws {RangeError} If the atoms C1–C4 are missing
 */
export function alkeneConfiguration(geometry: AlkeneGeometry): AlkeneConfiguration {
  const pos = new Map(geometry.atoms.map((a) => [a.id, a.position] as const))
  const c2 = pos.get('C2')
  const c3 = pos.get('C3')
  const c1 = pos.get('C1')
  const c4 = pos.get('C4')
  if (!c1 || !c2 || !c3 || !c4) throw new RangeError('but-2-ene needs atoms C1 to C4')
  // Side of the C2→C3 axis, in the xy plane: the sign of the 2D cross product.
  const side = (p: [number, number, number]) => Math.sign((c3[0] - c2[0]) * (p[1] - c2[1]) - (c3[1] - c2[1]) * (p[0] - c2[0]))
  return side(c1) === side(c4) ? 'cis' : 'trans'
}

/** The IUPAC name of but-2-ene with its configuration, e.g. 'cis-but-2-ene', from iupacName. */
export function but2eneName(config: AlkeneConfiguration): string {
  return `${config}-${iupacName(parseSmiles('CC=CC'))}`
}
