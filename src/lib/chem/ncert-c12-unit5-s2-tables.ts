/**
 * Reference data from NCERT Class 12 Chemistry Part I, Unit 5 (Coordination Compounds),
 * Section 5.2 "Definitions of Some Important Terms Pertaining to Coordination Compounds"
 * (book pp. 121-122, Fig. 5.1). Values are the examples the running text names.
 * Worked examples, Intext Questions and Exercises are deliberately not transcribed (ADR-0001).
 */

export type Denticity = 'unidentate' | 'didentate' | 'polydentate' | 'ambidentate'

export interface Ligand {
  readonly formula: string
  readonly name: string
  readonly charge: number
  /** Donor atoms available for binding to one metal ion (ambidentate: 1 at a time). */
  readonly donorAtoms: number
  readonly kind: Denticity
}

export const NCERT_S2_LIGANDS: readonly Ligand[] = [
  { formula: 'Cl', name: 'chloride', charge: -1, donorAtoms: 1, kind: 'unidentate' },
  { formula: 'H2O', name: 'water', charge: 0, donorAtoms: 1, kind: 'unidentate' },
  { formula: 'NH3', name: 'ammonia', charge: 0, donorAtoms: 1, kind: 'unidentate' },
  { formula: 'en', name: 'ethane-1,2-diamine', charge: 0, donorAtoms: 2, kind: 'didentate' },
  { formula: 'C2O4', name: 'oxalate', charge: -2, donorAtoms: 2, kind: 'didentate' },
  { formula: 'N(CH2CH2NH2)3', name: 'tris(2-aminoethyl)amine', charge: 0, donorAtoms: 4, kind: 'polydentate' },
  { formula: 'EDTA', name: 'ethylenediaminetetraacetate', charge: -4, donorAtoms: 6, kind: 'polydentate' },
  { formula: 'NO2', name: 'nitrite (N or O donor)', charge: -1, donorAtoms: 1, kind: 'ambidentate' },
  { formula: 'SCN', name: 'thiocyanate (S or N donor)', charge: -1, donorAtoms: 1, kind: 'ambidentate' },
] as const

export type Polyhedron =
  | 'octahedral'
  | 'tetrahedral'
  | 'square planar'
  | 'trigonal bipyramidal'
  | 'square pyramidal'

export interface CoordinationEntity {
  readonly formula: string
  readonly saltFormula?: string
  readonly counterIon?: string
  readonly metal: string
  readonly metalCharge: number
  readonly ligands: readonly { readonly ligand: string; readonly count: number }[]
  readonly entityCharge: number
  readonly coordinationNumber: number
  readonly polyhedron?: Polyhedron
  readonly note?: string
}

/** Entities named in Section 5.2, with the coordination number each has by definition. */
export const NCERT_S2_ENTITIES: readonly CoordinationEntity[] = [
  { formula: '[Co(NH3)6]3+', metal: 'Co', metalCharge: 3, ligands: [{ ligand: 'NH3', count: 6 }], entityCharge: 3, coordinationNumber: 6, polyhedron: 'octahedral' },
  { formula: '[Ni(CO)4]', metal: 'Ni', metalCharge: 0, ligands: [{ ligand: 'CO', count: 4 }], entityCharge: 0, coordinationNumber: 4, polyhedron: 'tetrahedral' },
  { formula: '[PtCl4]2-', metal: 'Pt', metalCharge: 2, ligands: [{ ligand: 'Cl', count: 4 }], entityCharge: -2, coordinationNumber: 4, polyhedron: 'square planar' },
  { formula: '[Fe(CN)6]4-', saltFormula: 'K4[Fe(CN)6]', counterIon: 'K+', metal: 'Fe', metalCharge: 2, ligands: [{ ligand: 'CN', count: 6 }], entityCharge: -4, coordinationNumber: 6, note: 'in K4[Fe(CN)6], K+ is the counter ion' },
  { formula: '[PtCl6]2-', metal: 'Pt', metalCharge: 4, ligands: [{ ligand: 'Cl', count: 6 }], entityCharge: -2, coordinationNumber: 6 },
  { formula: '[Ni(NH3)4]2+', metal: 'Ni', metalCharge: 2, ligands: [{ ligand: 'NH3', count: 4 }], entityCharge: 2, coordinationNumber: 4 },
  { formula: '[Fe(C2O4)3]3-', metal: 'Fe', metalCharge: 3, ligands: [{ ligand: 'C2O4', count: 3 }], entityCharge: -3, coordinationNumber: 6, note: 'three didentate ligands' },
  { formula: '[Co(en)3]3+', metal: 'Co', metalCharge: 3, ligands: [{ ligand: 'en', count: 3 }], entityCharge: 3, coordinationNumber: 6, note: 'three didentate ligands' },
  { formula: '[Cu(CN)4]3-', metal: 'Cu', metalCharge: 1, ligands: [{ ligand: 'CN', count: 4 }], entityCharge: -3, coordinationNumber: 4, note: 'written Cu(I)' },
  { formula: '[Co(NH3)4Cl2]+', metal: 'Co', metalCharge: 3, ligands: [{ ligand: 'NH3', count: 4 }, { ligand: 'Cl', count: 2 }], entityCharge: 1, coordinationNumber: 6, note: 'heteroleptic' },
] as const

/** Fig. 5.1: all five coordination polyhedra drawn by NCERT with their coordination numbers. */
export const NCERT_S2_POLYHEDRA: readonly { readonly name: Polyhedron; readonly example?: string; readonly coordinationNumber: number }[] = [
  { name: 'octahedral', example: '[Co(NH3)6]3+', coordinationNumber: 6 },
  { name: 'tetrahedral', example: '[Ni(CO)4]', coordinationNumber: 4 },
  { name: 'square planar', example: '[PtCl4]2-', coordinationNumber: 4 },
  { name: 'trigonal bipyramidal', coordinationNumber: 5 },
  { name: 'square pyramidal', coordinationNumber: 5 },
] as const

/** Oxidation number = metal charge after removing ligands with their shared pairs. */
export function oxidationNumber(entityCharge: number, ligandCharges: readonly number[]): number {
  return entityCharge - ligandCharges.reduce((a, b) => a + b, 0)
}

/** Coordination number = sum of (count x donor atoms bound) over ligands. */
export function coordinationNumber(ligands: readonly { donorAtoms: number; count: number }[]): number {
  return ligands.reduce((a, l) => a + l.donorAtoms * l.count, 0)
}

/** Homoleptic complexes bind only one kind of donor group; heteroleptic bind more than one. */
export function isHomoleptic(entity: Pick<CoordinationEntity, 'ligands'>): boolean {
  return entity.ligands.length === 1
}
