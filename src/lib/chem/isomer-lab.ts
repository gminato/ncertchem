/**
 * Pure domain logic for the Isomer Lab simulation (Class 12, Unit 5, Section 5.4).
 * Grounded directly in NCERT_ISOMER_KINDS, NCERT_ISOMER_PAIRS, NCERT_GEOMETRIC_CASES,
 * and NCERT_CHIRAL_CASES from ncert-c12-unit5-s4-tables.ts.
 */

import {
  NCERT_CHIRAL_CASES,
  NCERT_GEOMETRIC_CASES,
  NCERT_ISOMER_KINDS,
  NCERT_ISOMER_PAIRS,
  type IsomerKind,
  type IsomerPair,
} from './ncert-c12-unit5-s4-tables'

export type LabGeometry = 'square planar' | 'octahedral' | 'tetrahedral'

export type LigandSetId =
  | 'sq-mx2l2'
  | 'sq-mabxl'
  | 'oct-mx2l4'
  | 'oct-mx2ll2'
  | 'oct-ma3b3'
  | 'oct-mll3'
  | 'tet-mx2l2'

export interface IsomerSpec {
  readonly id: string
  readonly label: string
  readonly subtitle: string
  readonly chiral: boolean
  readonly achiralReason?: string
}

export interface LigandSetCase {
  readonly id: LigandSetId
  readonly formula: string
  readonly exampleFormula: string
  readonly geometry: LabGeometry
  readonly geometricIsomerCount: number
  readonly note: string
  readonly isomers: readonly IsomerSpec[]
}

export const LIGAND_SET_CASES: readonly LigandSetCase[] = [
  {
    id: 'sq-mx2l2',
    formula: 'MX2L2',
    exampleFormula: '[Pt(NH3)2Cl2]',
    geometry: 'square planar',
    geometricIsomerCount: 2,
    note: 'Two X ligands can be adjacent (90 deg, cis) or opposite (180 deg, trans).',
    isomers: [
      { id: 'cis', label: 'cis', subtitle: 'X ligands adjacent (90 deg)', chiral: false, achiralReason: 'The molecular plane itself is a mirror plane.' },
      { id: 'trans', label: 'trans', subtitle: 'X ligands opposite (180 deg)', chiral: false, achiralReason: 'The molecular plane itself is a mirror plane.' },
    ],
  },
  {
    id: 'sq-mabxl',
    formula: 'MABXL',
    exampleFormula: '[Pt(NH3)(Br)(Cl)(py)]',
    geometry: 'square planar',
    geometricIsomerCount: 3,
    note: 'Fix A in one corner; the ligand opposite A can be X, B, or L, giving 3 isomers (two cis and one trans).',
    isomers: [
      { id: 'cis-1', label: 'cis', subtitle: 'A opposite X', chiral: false, achiralReason: 'Planar complex lies in its own mirror plane.' },
      { id: 'cis-2', label: 'cis', subtitle: 'A opposite B', chiral: false, achiralReason: 'Planar complex lies in its own mirror plane.' },
      { id: 'trans', label: 'trans', subtitle: 'A opposite L', chiral: false, achiralReason: 'Planar complex lies in its own mirror plane.' },
    ],
  },
  {
    id: 'oct-mx2l4',
    formula: 'MX2L4',
    exampleFormula: '[Co(NH3)4Cl2]+',
    geometry: 'octahedral',
    geometricIsomerCount: 2,
    note: 'Two X ligands occupy adjacent vertices (90 deg, cis) or opposite axial vertices (180 deg, trans).',
    isomers: [
      { id: 'cis', label: 'cis', subtitle: 'X-M-X angle 90 deg', chiral: false, achiralReason: 'A mirror plane passes through M and both X ligands.' },
      { id: 'trans', label: 'trans', subtitle: 'X-M-X angle 180 deg', chiral: false, achiralReason: 'Multiple mirror planes pass through M and the ligands.' },
    ],
  },
  {
    id: 'oct-mx2ll2',
    formula: 'MX2(L-L)2',
    exampleFormula: '[PtCl2(en)2]2+',
    geometry: 'octahedral',
    geometricIsomerCount: 2,
    note: 'Only the cis isomer is chiral and optically active; trans has a mirror plane through both Cl and M.',
    isomers: [
      { id: 'cis', label: 'cis', subtitle: 'Cl adjacent, two en rings twist', chiral: true },
      { id: 'trans', label: 'trans', subtitle: 'Cl opposite, mirror plane cuts M and both Cl', chiral: false, achiralReason: 'Mirror plane through both Cl ligands and M maps the complex onto itself.' },
    ],
  },
  {
    id: 'oct-ma3b3',
    formula: 'Ma3b3',
    exampleFormula: '[Co(NH3)3(NO2)3]',
    geometry: 'octahedral',
    geometricIsomerCount: 2,
    note: 'Three identical ligands on one triangular face give fac; along a meridian circle give mer.',
    isomers: [
      { id: 'fac', label: 'fac', subtitle: 'Three a ligands on one triangular face', chiral: false, achiralReason: 'A mirror plane cuts through one a, one b, and M.' },
      { id: 'mer', label: 'mer', subtitle: 'Three a ligands along a meridian', chiral: false, achiralReason: 'The meridian plane is itself a mirror plane.' },
    ],
  },
  {
    id: 'oct-mll3',
    formula: 'M(L-L)3',
    exampleFormula: '[Co(en)3]3+',
    geometry: 'octahedral',
    geometricIsomerCount: 1,
    note: 'Three didentate en rings wrap like a propeller: no geometrical isomers, but a non-superimposable d/l enantiomer pair.',
    isomers: [
      { id: 'propeller', label: 'tris-chelate', subtitle: 'Three en rings form a chiral propeller', chiral: true },
    ],
  },
  {
    id: 'tet-mx2l2',
    formula: 'MX2L2 (tetrahedral)',
    exampleFormula: '[Zn(NH3)2Cl2]',
    geometry: 'tetrahedral',
    geometricIsomerCount: 1,
    note: 'Every pair of vertices in a tetrahedron is adjacent at 109.5 deg, so cis and trans isomers do not exist.',
    isomers: [
      { id: 'single', label: 'no cis/trans', subtitle: 'All 6 vertex pairs are equivalent neighbours', chiral: false, achiralReason: 'A mirror plane passes through M and both X ligands.' },
    ],
  },
]

export function casesForGeometry(geometry: LabGeometry): readonly LigandSetCase[] {
  return LIGAND_SET_CASES.filter((c) => c.geometry === geometry)
}

export function getLigandSetCase(id: LigandSetId): LigandSetCase {
  return LIGAND_SET_CASES.find((c) => c.id === id) ?? LIGAND_SET_CASES[0]
}

export interface PairExplanation {
  readonly index: number
  readonly pair: IsomerPair
  readonly kindInfo: IsomerKind
  readonly whatChanged: string
  readonly colourHint?: {
    readonly aLabel: string
    readonly aTone: string
    readonly bLabel: string
    readonly bTone: string
  }
}

const CHANGE_DESCRIPTIONS: readonly string[] = [
  'Spatial placement of Cl and NH3 around square planar Pt: adjacent (cis) vs opposite (trans).',
  'Spatial placement of two Cl ligands around octahedral Co: adjacent at 90 deg (cis) vs opposite at 180 deg (trans).',
  'Spatial placement of two Cl ligands with two didentate en rings: adjacent (cis) vs opposite (trans).',
  'Three NH3 and three NO2 ligands arranged on a triangular face (fac) vs around a meridian (mer).',
  'Three didentate en rings twist in opposite propeller senses, forming non-superimposable d and l mirror images.',
  'Only the cis form has no mirror plane; its two d and l forms are non-superimposable enantiomers.',
  'Ambidentate nitrite flips its donor atom: O-bound (-ONO, red) vs N-bound (-NO2, yellow).',
  'Ligand sets swap between the two metal centres: NH3 moves from Co to Cr and CN- from Cr to Co.',
  'A ligand and counter ion trade places across the coordination bracket: SO4^2- out and Br- in.',
  'One water molecule moves from inside the coordination sphere to the crystal lattice as one Cl- enters.',
]

export function getPairExplanations(): readonly PairExplanation[] {
  return NCERT_ISOMER_PAIRS.map((pair, index) => {
    const kindInfo = NCERT_ISOMER_KINDS.find((k) => k.id === pair.kind) ?? NCERT_ISOMER_KINDS[0]
    let colourHint: PairExplanation['colourHint']
    if (pair.kind === 'linkage') {
      colourHint = {
        aLabel: pair.aNote ?? 'red',
        aTone: 'var(--el-O)',
        bLabel: pair.bNote ?? 'yellow',
        bTone: 'var(--ox)',
      }
    } else if (pair.kind === 'solvate') {
      colourHint = {
        aLabel: pair.aNote ?? 'violet',
        aTone: 'var(--spec-violet)',
        bLabel: pair.bNote ?? 'grey-green',
        bTone: 'var(--work)',
      }
    }
    return {
      index,
      pair,
      kindInfo,
      whatChanged: CHANGE_DESCRIPTIONS[index] ?? '',
      colourHint,
    }
  })
}

export { NCERT_CHIRAL_CASES, NCERT_GEOMETRIC_CASES, NCERT_ISOMER_KINDS, NCERT_ISOMER_PAIRS }
