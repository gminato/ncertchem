/**
 * Local molecules for the Unit 9 hydrocarbon drawings. Hand-written graphs, so the demos do not
 * depend on the chemistry modules that are still being written. Benzene is Kekulé form A or B.
 */
import type { MolAtom, MolBond, MolGraph } from '@/lib/chem/molecule-graph'
import { parseSmiles } from '@/lib/chem/molecule-parse'

/** Propene, CH₃–CH=CH₂ (parsed). Atoms: 0 CH₃, 1 CH, 2 CH₂. */
export const PROPENE: MolGraph = parseSmiles('CC=C')

/** 2-Bromopropane (the Markovnikov product), CH₃–CHBr–CH₃ (parsed). Br is atom 2 and the reacting carbon atom 1. */
export const TWO_BROMOPROPANE: MolGraph = parseSmiles('CC(Br)C')

/** 1-Bromopropane (the anti-Markovnikov product), CH₃–CH₂–CH₂–Br (parsed). */
export const ONE_BROMOPROPANE: MolGraph = parseSmiles('CCCBr')

/** Secondary carbocation, CH₃–CH⁺–CH₃ (parsed): the stable intermediate of propene. Cation at atom 1. */
export const SECONDARY_CATION: MolGraph = parseSmiles('C[CH+]C')

/** Primary carbocation, CH₃–CH₂–CH₂⁺ (parsed): the less stable intermediate. Cation at atom 2. */
export const PRIMARY_CATION: MolGraph = parseSmiles('CC[CH2+]')

/** Nitronium ion, O=N⁺=O (parsed). N is atom 1. */
export const NITRONIUM: MolGraph = parseSmiles('[O]=[N+]=[O]')

/** Kekulé benzene, form A: double bonds on 1=2, 3=4, 5=6 (parsed). Atom i is position i + 1. */
export const BENZENE_KEKULE_A: MolGraph = parseSmiles('C1=CC=CC=C1')

/** Kekulé benzene, form B: double bonds on 2=3, 4=5, 6=1. */
export const BENZENE_KEKULE_B: MolGraph = ringGraph([1, 2, 1, 2, 1, 2])

/** A six-carbon ring with the given bond orders: bond i joins atom i and atom i + 1. */
export function ringGraph(orders: readonly [1 | 2, 1 | 2, 1 | 2, 1 | 2, 1 | 2, 1 | 2], hydrogens = true): MolGraph {
  const atoms: MolAtom[] = Array.from({ length: 6 }, () => ({ element: 'C', hCount: hydrogens ? 1 : undefined }))
  const bonds: MolBond[] = orders.map((order, i) => ({ a: i, b: (i + 1) % 6, order }))
  return { atoms, bonds }
}

/** Electrophiles that attach to the ring. */
export type Electrophile = 'NO2' | 'Br'

/** Adds the electrophile group to ring atom 0 (sp³ in the σ-complex). Returns the atom index of the group. */
function addElectrophile(atoms: MolAtom[], bonds: MolBond[], e: Electrophile): number {
  if (e === 'Br') {
    atoms.push({ element: 'Br' })
    bonds.push({ a: 0, b: atoms.length - 1, order: 1 })
    return atoms.length - 1
  }
  // Nitro group: N⁺ with a double bond to one O and a single bond to O⁻.
  atoms.push({ element: 'N', charge: 1 })
  const n = atoms.length - 1
  bonds.push({ a: 0, b: n, order: 1 })
  atoms.push({ element: 'O' })
  bonds.push({ a: n, b: atoms.length - 1, order: 2 })
  atoms.push({ element: 'O', charge: -1 })
  bonds.push({ a: n, b: atoms.length - 1, order: 1 })
  return n
}

/**
 * The σ-complex (arenium ion) of electrophilic substitution. Ring atom 0 is sp³ and carries H
 * and the electrophile; the ring carbons 1 to 5 share the positive charge. Its Kekulé form
 * puts the cation on atom `cation` (1, 3 or 5, the ortho and para positions to atom 0), and
 * with no cation the drawing is the delocalised hybrid, which the horseshoe shows instead.
 */
export function arenium(e: Electrophile, cation?: 1 | 3 | 5): MolGraph {
  const atoms: MolAtom[] = []
  for (let i = 0; i < 6; i++) atoms.push({ element: 'C', hCount: 1 })
  // Bonds of the ring. Double bonds of each contributor sit on the pairs not touching the cation.
  // Bond i joins atoms i and i + 1: cation 1 leaves 2=3 and 4=5; cation 3 leaves 1=2 and 4=5; cation 5 leaves 1=2 and 3=4.
  const doubled = cation === undefined ? [] : cation === 1 ? [2, 4] : cation === 3 ? [1, 4] : [1, 3]
  const bonds: MolBond[] = Array.from({ length: 6 }, (_, i) => ({
    a: i,
    b: (i + 1) % 6,
    order: (doubled.includes(i) ? 2 : 1) as 1 | 2,
  }))
  if (cation !== undefined) atoms[cation] = { element: 'C', hCount: 1, charge: 1 }
  addElectrophile(atoms, bonds, e)
  return { atoms, bonds }
}

/** Nitrobenzene, the product of nitration (parsed): the NO₂ group first, then the ring. */
export function nitrobenzene(): MolGraph {
  return parseSmiles('[O-][N+](=O)C1=CC=CC=C1')
}

/** Benzene, Kekulé A with hydrogens on every carbon. */
export function benzene(): MolGraph {
  return BENZENE_KEKULE_A
}

