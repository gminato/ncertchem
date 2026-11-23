import { iupacNameFromSmiles } from '@/lib/chem/iupac-organic'
import { parseSmiles, molecularFormula } from '@/lib/chem/molecule-parse'
import { NCERT_TABLE_6_1, type HalideName } from '@/lib/chem/ncert-c12-unit6-data'

/** Six Steps in the Section 6.2 Scrolly (0-based index from the Scrolly). */
export const NAMING_STEP_COUNT = 6

/** Step 1: 2-bromobutane, the bromine on carbon 2 (atom 4 is Br, atom 2 carries it). */
export const SEC_BUTYL_SMILES = 'CCC(C)Br'
/** Step 1 halogen atom index in SEC_BUTYL_SMILES. */
export const SEC_BUTYL_BR = 4
export const SEC_BUTYL_COMMON = 'sec-butyl bromide'

/**
 * Steps 2 to 4: 2-bromo-4-methylhexane. Atom order follows the SMILES: 0 C, 1 C (bears Br), 2 Br,
 * 3 C, 4 C (bears the methyl), 5 CH3 (the branch), 6 C, 7 C.
 */
export const LONG_SMILES = 'CC(Br)CC(C)CC'
/** The six carbons of the longest chain, in chain order (C0 to C7 without the methyl C5). */
export const LONG_CHAIN = [0, 1, 3, 4, 6, 7] as const
/** Atoms that carry substituents: the bromine's carbon and the methyl's carbon. */
export const LONG_BR_CARBON = 1
export const LONG_BR = 2
export const LONG_METHYL_CARBON = 4
export const LONG_METHYL = 5

/** Step 5: the three dichlorobenzenes, ortho (1,2), meta (1,3) and para (1,4). */
export const ORTHO_SMILES = 'ClC1=CC=CC=C1Cl'
export const META_SMILES = 'ClC1=CC=CC(Cl)=C1'
export const PARA_SMILES = 'ClC1=CC=C(Cl)C=C1'

/** Step 6: gem (both Cl on one carbon) and vic (Cl on neighbouring carbons) dichloroethanes. */
export const GEM_SMILES = 'CC(Cl)Cl'
export const VIC_SMILES = 'ClCCCl'
export const GEM_COMMON = 'ethylidene chloride'
export const VIC_COMMON = 'ethylene dichloride'

/** Step 6: Table 6.1 rows shown as a short list (common names as NCERT prints them). */
export const TABLE_ROW_COMMONS = ['Methylene chloride', 'Chloroform', 'Allyl bromide'] as const

/** The IUPAC name the namer gives for a SMILES (never typed by hand). */
export function nameOf(smiles: string): string {
  return iupacNameFromSmiles(smiles)
}

/**
 * Locant sets for substituents on a chain. `chain` lists the carbons in chain order; the left
 * count starts at chain[0] and the right count at the last carbon. Both sets are sorted ascending.
 */
export function chainLocants(chain: readonly number[], substituentCarbons: readonly number[]): { left: number[]; right: number[] } {
  const n = chain.length
  const pos = (atom: number): number => {
    const i = chain.indexOf(atom)
    if (i < 0) throw new Error(`atom ${atom} is not on the chain`)
    return i
  }
  const left = substituentCarbons.map((a) => pos(a) + 1).sort((a, b) => a - b)
  const right = substituentCarbons.map((a) => n - pos(a)).sort((a, b) => a - b)
  return { left, right }
}

/** True when the first set is lower at the first point of difference (the IUPAC lowest-locant rule). */
export function isLowerSet(a: readonly number[], b: readonly number[]): boolean {
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    if (a[i] !== b[i]) return a[i] < b[i]
  }
  return false
}

/** Prefixes sorted alphabetically (IUPAC order), as they appear in the name. */
export function alphabeticalPrefixes(prefixes: readonly string[]): string[] {
  return [...prefixes].sort((a, b) => a.localeCompare(b))
}

/** A Table 6.1 row by its common name, read from the lead data (never typed in). */
export function tableRow(common: string): HalideName {
  const row = NCERT_TABLE_6_1.find((r) => r.common === common)
  if (!row) throw new Error(`Table 6.1 has no row ${common}`)
  return row
}

/** Molecular formula (plain text) of a SMILES from the parser. */
export function formulaOf(smiles: string): string {
  return molecularFormula(parseSmiles(smiles))
}
