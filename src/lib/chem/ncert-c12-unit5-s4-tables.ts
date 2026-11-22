/**
 * Reference data from NCERT Class 12 Chemistry Part I, Unit 5 (Coordination Compounds),
 * Section 5.4 Isomerism in Coordination Compounds, book pp. 125-128. Facts and example
 * formulas are as NCERT prints them in the running text and Figures 5.2 to 5.7. Worked
 * examples, Intext Questions and Exercises are deliberately not transcribed (ADR-0001).
 */

export type IsomerFamily = 'stereo' | 'structural'

/** One kind of isomerism in the NCERT classification (p. 125). */
export interface IsomerKind {
  readonly id: string
  readonly name: string
  readonly family: IsomerFamily
  /** Sub-heading number in the book. */
  readonly section: string
}

/** The two principal types and six subtypes, in the order NCERT lists them. */
export const NCERT_ISOMER_KINDS: readonly IsomerKind[] = [
  { id: 'geometrical', name: 'Geometrical isomerism', family: 'stereo', section: '5.4.1' },
  { id: 'optical', name: 'Optical isomerism', family: 'stereo', section: '5.4.2' },
  { id: 'linkage', name: 'Linkage isomerism', family: 'structural', section: '5.4.3' },
  { id: 'coordination', name: 'Coordination isomerism', family: 'structural', section: '5.4.4' },
  { id: 'ionisation', name: 'Ionisation isomerism', family: 'structural', section: '5.4.5' },
  { id: 'solvate', name: 'Solvate isomerism', family: 'structural', section: '5.4.6' },
]

/** A pair of isomers NCERT names, with the feature that distinguishes them. */
export interface IsomerPair {
  readonly kind: string
  readonly a: string
  readonly b: string
  /** What NCERT says differs between the two (colour, binding atom, and so on). */
  readonly aNote?: string
  readonly bNote?: string
  readonly figure?: string
}

export const NCERT_ISOMER_PAIRS: readonly IsomerPair[] = [
  { kind: 'geometrical', a: 'cis-[Pt(NH3)2Cl2]', b: 'trans-[Pt(NH3)2Cl2]', figure: 'Fig. 5.2' },
  { kind: 'geometrical', a: 'cis-[Co(NH3)4Cl2]+', b: 'trans-[Co(NH3)4Cl2]+', figure: 'Fig. 5.3' },
  { kind: 'geometrical', a: 'cis-[CoCl2(en)2]+', b: 'trans-[CoCl2(en)2]+', figure: 'Fig. 5.4' },
  { kind: 'geometrical', a: 'fac-[Co(NH3)3(NO2)3]', b: 'mer-[Co(NH3)3(NO2)3]', figure: 'Fig. 5.5' },
  { kind: 'optical', a: 'd-[Co(en)3]3+', b: 'l-[Co(en)3]3+', figure: 'Fig. 5.6' },
  { kind: 'optical', a: 'd-cis-[PtCl2(en)2]2+', b: 'l-cis-[PtCl2(en)2]2+', figure: 'Fig. 5.7' },
  { kind: 'linkage', a: '[Co(NH3)5(ONO)]Cl2', b: '[Co(NH3)5(NO2)]Cl2', aNote: 'red, bound through O', bNote: 'yellow, bound through N' },
  { kind: 'coordination', a: '[Co(NH3)6][Cr(CN)6]', b: '[Cr(NH3)6][Co(CN)6]' },
  { kind: 'ionisation', a: '[Co(NH3)5(SO4)]Br', b: '[Co(NH3)5Br]SO4' },
  { kind: 'solvate', a: '[Cr(H2O)6]Cl3', b: '[Cr(H2O)5Cl]Cl2.H2O', aNote: 'violet', bNote: 'grey-green' },
]

/** Isomer counts NCERT states for a geometry and ligand set (pp. 125-126). */
export interface GeometricCase {
  readonly formula: string
  readonly geometry: 'square planar' | 'octahedral' | 'tetrahedral'
  /** Number of geometrical isomers; 1 means the arrangement shows no geometrical isomerism. */
  readonly isomers: number
  readonly labels: readonly string[]
}

export const NCERT_GEOMETRIC_CASES: readonly GeometricCase[] = [
  { formula: 'MX2L2', geometry: 'square planar', isomers: 2, labels: ['cis', 'trans'] },
  { formula: 'MABXL', geometry: 'square planar', isomers: 3, labels: ['cis', 'cis', 'trans'] },
  { formula: 'MX2L4', geometry: 'octahedral', isomers: 2, labels: ['cis', 'trans'] },
  { formula: 'MX2(L-L)2', geometry: 'octahedral', isomers: 2, labels: ['cis', 'trans'] },
  { formula: 'Ma3b3', geometry: 'octahedral', isomers: 2, labels: ['fac', 'mer'] },
  { formula: 'tetrahedral with two kinds of unidentate ligand', geometry: 'tetrahedral', isomers: 1, labels: [] },
]

/** Octahedral chiral cases: which isomer is optically active (p. 126). */
export const NCERT_CHIRAL_CASES = [
  { entity: '[Co(en)3]3+', chiral: true },
  { entity: 'cis-[PtCl2(en)2]2+', chiral: true },
  { entity: 'trans-[PtCl2(en)2]2+', chiral: false },
] as const
