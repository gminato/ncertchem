/**
 * Aldol model for the Section 8.4 (4) Simulation: which carbonyl compounds have α-hydrogens,
 * and the aldol and condensation product of every donor-acceptor pair the Simulation offers.
 * Every product SMILES is tested in aldol-model.test.ts (formula = donor + acceptor, condensed = aldol − H₂O).
 */

export type PartnerId = 'ethanal' | 'propanal' | 'methylpropanal' | 'acetone' | 'benzaldehyde'

export interface Partner {
  id: PartnerId
  smiles: string
  /** Atom indices (into parseSmiles order) of the α-carbons, washed in the drawing. */
  alphaAtoms: readonly number[]
  /** Hydrogens on the α-carbons. Benzaldehyde's ring carbon has none. */
  alphaHydrogens: number
}

export const PARTNERS: readonly Partner[] = [
  { id: 'ethanal', smiles: 'CC=O', alphaAtoms: [0], alphaHydrogens: 3 },
  { id: 'propanal', smiles: 'CCC=O', alphaAtoms: [1], alphaHydrogens: 2 },
  { id: 'methylpropanal', smiles: 'CC(C)C=O', alphaAtoms: [1], alphaHydrogens: 1 },
  { id: 'acetone', smiles: 'CC(C)=O', alphaAtoms: [0, 2], alphaHydrogens: 6 },
  { id: 'benzaldehyde', smiles: 'O=CC1=CC=CC=C1', alphaAtoms: [], alphaHydrogens: 0 },
]

/** The first compound the learner picks. Benzaldehyde only ever joins as the second partner. */
export const FIRST_PARTNERS: readonly PartnerId[] = ['ethanal', 'propanal', 'methylpropanal', 'acetone']

/** Second partners that make a grid the model supports, for each first partner. */
export const SECOND_PARTNERS: Readonly<Record<string, readonly PartnerId[]>> = {
  ethanal: ['benzaldehyde'],
  propanal: ['methylpropanal', 'benzaldehyde'],
  methylpropanal: ['propanal', 'benzaldehyde'],
  acetone: ['benzaldehyde'],
}

export function partner(id: PartnerId): Partner {
  const p = PARTNERS.find((x) => x.id === id)
  if (!p) throw new Error(`unknown partner ${id}`)
  return p
}

export interface AldolCell {
  /** Aldol (β-hydroxy carbonyl) from the donor's carbanion adding to the acceptor's C=O. */
  aldol: string
  /** α,β-unsaturated carbonyl after loss of water, or null when the new α-carbon has no hydrogen left. */
  condensed: string | null
}

/** Keyed `donor>acceptor`: the donor gives the carbanion, the acceptor is attacked. */
export const ALDOL_CELLS: Readonly<Record<string, AldolCell>> = {
  'ethanal>ethanal': { aldol: 'CC(O)CC=O', condensed: 'CC=CC=O' },
  'propanal>propanal': { aldol: 'CCC(O)C(C)C=O', condensed: 'CCC=C(C)C=O' },
  'methylpropanal>methylpropanal': { aldol: 'CC(C)(C=O)C(O)C(C)C', condensed: null },
  'acetone>acetone': { aldol: 'CC(=O)CC(C)(C)O', condensed: 'CC(=O)C=C(C)C' },
  'ethanal>benzaldehyde': { aldol: 'O=CCC(O)C1=CC=CC=C1', condensed: 'O=CC=CC1=CC=CC=C1' },
  'propanal>benzaldehyde': { aldol: 'CC(C=O)C(O)C1=CC=CC=C1', condensed: 'CC(C=O)=CC1=CC=CC=C1' },
  'methylpropanal>benzaldehyde': { aldol: 'CC(C)(C=O)C(O)C1=CC=CC=C1', condensed: null },
  'acetone>benzaldehyde': { aldol: 'CC(=O)CC(O)C1=CC=CC=C1', condensed: 'CC(=O)C=CC1=CC=CC=C1' },
  'propanal>methylpropanal': { aldol: 'CC(C=O)C(O)C(C)C', condensed: 'CC(C=O)=CC(C)C' },
  'methylpropanal>propanal': { aldol: 'CC(C)(C=O)C(O)CC', condensed: null },
}

export function cellFor(donor: PartnerId, acceptor: PartnerId): AldolCell {
  const c = ALDOL_CELLS[`${donor}>${acceptor}`]
  if (!c) throw new Error(`no aldol cell for ${donor} > ${acceptor}`)
  return c
}

export function canAldol(id: PartnerId): boolean {
  return partner(id).alphaHydrogens > 0
}

export interface AldolGrid {
  /** Partners that can give a carbanion (they have α-hydrogens). */
  donors: PartnerId[]
  /** Every partner on the bench: attacked in the columns. */
  acceptors: PartnerId[]
  /** Partners with no α-hydrogen, shown as text rather than as a grid row. */
  inert: PartnerId[]
}

export function aldolGrid(first: PartnerId, second: PartnerId | null): AldolGrid {
  const partners: PartnerId[] = second ? [first, second] : [first]
  return {
    donors: partners.filter(canAldol),
    acceptors: partners,
    inert: partners.filter((id) => !canAldol(id)),
  }
}

/** Every aldol product the grid shows, in reading order (donor row, then acceptor column). */
export function gridCells(grid: AldolGrid): { donor: PartnerId; acceptor: PartnerId; cell: AldolCell }[] {
  return grid.donors.flatMap((donor) => grid.acceptors.map((acceptor) => ({ donor, acceptor, cell: cellFor(donor, acceptor) })))
}
