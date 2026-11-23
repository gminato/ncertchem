import { neighbours, parseSmiles } from './molecule-parse'
import type { MolGraph } from './molecule-graph'

/** Section 8.3: which attractions a molecule can make with its neighbours. */
export type Attraction = 'van der Waals' | 'dipole–dipole' | 'hydrogen bonding'

/** The oxygen that makes a molecule polar, and the carbon it pulls electrons away from (δ⁺). */
export interface PolarSite {
  oxygen: number
  partner: number
}

/** A C=O (carbonyl) or C–O–C (ether) group. Null for alkanes and for alcohols (O–H, see hasOHGroup). */
export function polarSite(g: MolGraph): PolarSite | null {
  for (let i = 0; i < g.atoms.length; i++) {
    if (g.atoms[i].element !== 'O') continue
    const nb = neighbours(g, i)
    const double = nb.find((n) => n.order === 2)
    if (double) return { oxygen: i, partner: double.atom }
    const carbons = nb.filter((n) => n.order === 1 && g.atoms[n.atom].element === 'C')
    if (carbons.length === 2) return { oxygen: i, partner: carbons[0].atom }
  }
  return null
}

/** An O bonded to one carbon by a single bond and nothing else: an alcohol O–H. */
export function hasOHGroup(g: MolGraph): boolean {
  return g.atoms.some((a, i) => {
    if (a.element !== 'O') return false
    const nb = neighbours(g, i)
    return nb.length === 1 && nb[0].order === 1
  })
}

/** The attractions a molecule can make with a neighbour of the same kind. Every molecule has van der Waals contacts. */
export function interactionsFor(smiles: string): Attraction[] {
  const g = parseSmiles(smiles)
  if (hasOHGroup(g)) return ['hydrogen bonding', 'van der Waals']
  if (polarSite(g)) return ['dipole–dipole', 'van der Waals']
  return ['van der Waals']
}

/** Chain-length ladder for the water-solubility control (aldehydes only, no ethanal). */
export const CHAIN_LADDER = [
  { smiles: 'C=O' },
  { smiles: 'CCC=O' },
  { smiles: 'CCCCC=O' },
  { smiles: 'CCCCCC=O' },
] as const

/** Qualitative solubility notes, one per CHAIN_LADDER step. Only what the Prose says (no numbers). */
export const SOLUBILITY_NOTES: readonly string[] = [
  'Mixes with water in any proportion.',
  'Solubility has fallen as the alkyl chain lengthened.',
  'Solubility has fallen further.',
  'Least soluble of the four.',
]

/** The water-contact sentence that applies to every step of the ladder. */
export const WATER_CONTACT_NOTE = 'The carbonyl oxygen takes a hydrogen bond from water.'
