/**
 * Nucleophilic substitution picker (Class 12 Unit 6, Section 7).
 *
 * Products are built by replacing the halogen of a haloalkane with a group that starts at the
 * attacking atom. Each reagent is a row of NCERT Table 6.4 (its text and class come from the lib
 * data file). Where Table 6.4 has a general R′, one concrete R′ is fixed here and named in `rPrime`.
 */
import { NCERT_TABLE_6_4 } from './ncert-c12-unit6-data'
import { iupacNameFromSmiles } from './iupac-organic'
import { molecularFormula, parseSmiles } from './molecule-parse'
import type { MolGraph } from './molecule-graph'

export interface PickerSubstrate {
  id: string
  smiles: string
  /** Index of the leaving halogen in the SMILES atom order (always the last atom here). */
  halogen: 'Cl' | 'Br' | 'I'
}

export const PICKER_SUBSTRATES: readonly PickerSubstrate[] = [
  { id: 'bromoethane', smiles: 'CCBr', halogen: 'Br' },
  { id: '1-bromobutane', smiles: 'CCCCBr', halogen: 'Br' },
  { id: '2-bromopropane', smiles: 'CC(C)Br', halogen: 'Br' },
]

export interface PickerReagent {
  id: string
  /** Index of the matching row in NCERT_TABLE_6_4. */
  row: number
  /** SMILES of the group that replaces the halogen, starting at the attacking atom. '' = hydride (H⁻). */
  group: string
  /** Element of the attacking atom, or null when there is no attacking atom (hydride). */
  attackAtom: 'C' | 'N' | 'O' | 'I' | 'H' | null
  /** The concrete R′ (or R″) used where Table 6.4 has a general group, for display. */
  rPrime: string | null
  /** The other salt of an ambident pair (attacks through a different atom). */
  partner: string | null
}

export const PICKER_REAGENTS: readonly PickerReagent[] = [
  { id: 'naoh', row: 0, group: 'O', attackAtom: 'O', rPrime: null, partner: null },
  { id: 'h2o', row: 1, group: 'O', attackAtom: 'O', rPrime: null, partner: null },
  { id: 'naor', row: 2, group: 'OC', attackAtom: 'O', rPrime: 'R′ = CH₃', partner: null },
  { id: 'nai', row: 3, group: 'I', attackAtom: 'I', rPrime: null, partner: null },
  { id: 'nh3', row: 4, group: 'N', attackAtom: 'N', rPrime: null, partner: null },
  { id: 'r-nh2', row: 5, group: 'NC', attackAtom: 'N', rPrime: 'R′ = CH₃', partner: null },
  { id: 'r2-nh', row: 6, group: 'N(C)C', attackAtom: 'N', rPrime: 'R′ = R″ = CH₃', partner: null },
  { id: 'kcn', row: 7, group: 'C#N', attackAtom: 'C', rPrime: null, partner: 'agcn' },
  { id: 'agcn', row: 8, group: '[N+]#[C-]', attackAtom: 'N', rPrime: null, partner: 'kcn' },
  { id: 'kno2', row: 9, group: 'ON=O', attackAtom: 'O', rPrime: null, partner: 'agno2' },
  { id: 'agno2', row: 10, group: '[N+](=O)[O-]', attackAtom: 'N', rPrime: null, partner: 'kno2' },
  { id: 'r-coo-ag', row: 11, group: 'OC(C)=O', attackAtom: 'O', rPrime: 'R′ = CH₃', partner: null },
  { id: 'lialh4', row: 12, group: '', attackAtom: null, rPrime: null, partner: null },
  { id: 'r-m', row: 13, group: 'C', attackAtom: 'C', rPrime: 'R′ = CH₃', partner: null },
]

export interface PickerProduct {
  smiles: string
  /** Molecular formula as the lib prints it (plain digits). */
  formula: string
  /** The namer's IUPAC name, or null where the namer has no rule (isocyanides, nitrites, amines with N-alkyl). */
  name: string | null
  productClass: string
  graph: MolGraph
  /** Index of the carbon that bore the halogen (same index in substrate and product). */
  carbonIndex: number
  /** Index of the attacking atom in the product graph, or null for hydride. */
  attackIndex: number | null
}

export function findPickerSubstrate(id: string): PickerSubstrate {
  const found = PICKER_SUBSTRATES.find((s) => s.id === id)
  if (!found) throw new RangeError(`Unknown substrate: ${id}`)
  return found
}

export function findPickerReagent(id: string): PickerReagent {
  const found = PICKER_REAGENTS.find((r) => r.id === id)
  if (!found) throw new RangeError(`Unknown reagent: ${id}`)
  return found
}

/** The namer's IUPAC name, or null where it refuses (it throws for groups it cannot name). */
export function pickerName(smiles: string): string | null {
  try {
    return iupacNameFromSmiles(smiles)
  } catch {
    return null
  }
}

/** Build the substitution product of one haloalkane with one Table 6.4 reagent. */
export function pickerProduct(substrateId: string, reagentId: string): PickerProduct {
  const substrate = findPickerSubstrate(substrateId)
  const reagent = findPickerReagent(reagentId)
  const row = NCERT_TABLE_6_4[reagent.row]
  const subGraph = parseSmiles(substrate.smiles)
  const halogenIndex = subGraph.atoms.length - 1
  const halogenBond = subGraph.bonds.find((b) => b.a === halogenIndex || b.b === halogenIndex)
  if (!halogenBond) throw new Error(`No carbon bears the halogen in ${substrate.smiles}`)
  const bearing = halogenBond.a === halogenIndex ? halogenBond.b : halogenBond.a
  // The SMILES prefix keeps the substrate's atom order, so the group's first atom sits at halogenIndex.
  const prefix = substrate.smiles.slice(0, -substrate.halogen.length)
  const smiles = prefix + reagent.group
  const graph = parseSmiles(smiles)
  return {
    smiles,
    formula: molecularFormula(graph),
    name: pickerName(smiles),
    productClass: row.productClass,
    graph,
    carbonIndex: bearing,
    attackIndex: reagent.group === '' ? null : halogenIndex,
  }
}
