/**
 * Electronic effects in organic molecules (NCERT Class 11 Unit 8, Sections 8.7.2 to 8.7.9):
 * reagents, electrophilic centres, carbocation, carbanion and radical stability, inductive and
 * resonance effects, bond cleavage, and the Problems that use them.
 */

import type { MolGraph } from './molecule-graph'
import { neighbours, parseSmiles } from './molecule-parse'

/** Pauling electronegativities of the elements used in this unit. */
export const PAULING_ELECTRONEGATIVITY: Record<string, number> = {
  H: 2.2,
  B: 2.04,
  C: 2.55,
  N: 3.04,
  O: 3.44,
  F: 3.98,
  P: 2.19,
  S: 2.58,
  Cl: 3.16,
  Br: 2.96,
  I: 2.66,
  Cu: 1.9,
}

function electronegativity(element: string): number {
  const value = PAULING_ELECTRONEGATIVITY[element]
  if (value === undefined) {
    throw new RangeError(`No electronegativity for ${element}`)
  }
  return value
}

/** Absolute polarity of a bond: the difference of Pauling electronegativities. */
export function bondPolarity(elementA: string, elementB: string): number {
  return Math.abs(electronegativity(elementA) - electronegativity(elementB))
}

/** Groups listed in NCERT Section 8.7.5 (inductive effect) and 8.7.7 (resonance effect). */
export const inductiveGroups = {
  electronWithdrawing: ['-NO2', '-CN', '-COOH', '-COOR', '-OAr', 'halogens'],
  electronDonating: ['-CH3', '-C2H5'],
} as const

/** NCERT Section 8.7.7: groups with a +R (donating) and a -R (withdrawing) resonance effect. */
export const resonanceGroups = {
  plusR: ['-halogen', '-OH', '-OR', '-OCOR', '-NH2', '-NHR', '-NR2', '-NHCOR'],
  minusR: ['-COOH', '-CHO', '>C=O', '-CN', '-NO2'],
} as const

/** Kinds of reactive intermediate handled by intermediateStability. */
export type IntermediateKind = 'carbocation' | 'carbanion' | 'radical'

/** Stability of one intermediate, with the reasons used to rank it. */
export interface IntermediateStability {
  /** Higher is more stable. Comparable only between intermediates of the same kind. */
  stability: number
  /** Number of α-hydrogens (hyperconjugation structures). */
  alphaH: number
  /** Number of alkyl groups (carbon atoms) attached to the centre (+I effect). */
  alkylGroups: number
  /** Number of adjacent π bonds or lone pairs that delocalise the charge or electron. */
  resonance: number
  reasons: string[]
}

/**
 * Stability of a carbocation, carbanion or radical centre (carbon atom `centre`). Carbocations
 * and radicals are stabilised by alkyl groups (+I) and α-hydrogens (hyperconjugation) and by
 * adjacent π bonds or lone pairs (resonance). Carbanions are destabilised by alkyl groups, so their
 * order is reversed (NCERT 8.7.9).
 *
 * @throws {RangeError} If the centre is not carbon or does not carry the matching charge or electron
 */
export function intermediateStability(kind: IntermediateKind, g: MolGraph, centre: number): IntermediateStability {
  const atom = g.atoms[centre]
  if (!atom || atom.element !== 'C') {
    throw new RangeError('The centre of an intermediate must be carbon')
  }
  const charge = atom.charge ?? 0
  const radical = atom.radical ?? 0
  if (kind === 'carbocation' && charge !== 1) {
    throw new RangeError('A carbocation centre needs charge +1')
  }
  if (kind === 'carbanion' && charge !== -1) {
    throw new RangeError('A carbanion centre needs charge -1')
  }
  if (kind === 'radical' && radical < 1) {
    throw new RangeError('A radical centre needs an unpaired electron')
  }

  const near = neighbours(g, centre)
  const carbonNeighbours = near.filter((n) => g.atoms[n.atom].element === 'C')
  const alkylGroups = carbonNeighbours.length
  const alphaH = carbonNeighbours.reduce((sum, n) => sum + (g.atoms[n.atom].hCount ?? 0), 0)

  let resonance = 0
  for (const n of near) {
    const other = g.atoms[n.atom]
    const hasPi = neighbours(g, n.atom).some((m) => m.atom !== centre && m.order >= 2)
    const lonePairDonor = ['N', 'O', 'S', 'F', 'Cl', 'Br', 'I'].includes(other.element) && (other.charge ?? 0) <= 0
    if (hasPi || lonePairDonor) {
      resonance++
    }
  }

  const reasons: string[] = []
  reasons.push(`${alkylGroups} alkyl group(s): +I stabilisation of the ${kind === 'carbanion' ? 'charge' : 'charge or electron'}`)
  if (kind !== 'carbanion') {
    reasons.push(`${alphaH} α-hydrogen(s): hyperconjugation structures`)
  }
  if (resonance > 0) {
    reasons.push(`${resonance} adjacent π bond or lone pair: resonance`)
  }

  const base = resonance * 1000 + alkylGroups * 10 + alphaH
  const stability = kind === 'carbanion' ? resonance * 1000 - (alkylGroups * 10) : base
  return { stability, alphaH, alkylGroups, resonance, reasons }
}

/** One intermediate to rank: its kind, the molecule, and the carbon at the centre. */
export interface IntermediateItem {
  kind: IntermediateKind
  graph: MolGraph
  centre: number
}

/**
 * Indices of the items ranked from most to least stable (NCERT 8.7.9). For carbocations and
 * radicals this gives 3° > 2° > 1° > methyl; for carbanions the order is reversed.
 */
export function rankIntermediates(items: IntermediateItem[]): number[] {
  return items
    .map((item, index) => ({ index, s: intermediateStability(item.kind, item.graph, item.centre).stability }))
    .sort((x, y) => y.s - x.s || x.index - y.index)
    .map((x) => x.index)
}

/** Reagent classes of NCERT Section 8.7.2. */
export type ReagentClass = 'nucleophile' | 'electrophile' | 'neither'

/**
 * Classifies a species as a nucleophile (electron-pair donor), electrophile (electron-pair
 * acceptor) or neither (NCERT 8.7.2, Problem 8.12):
 * - a positive ion, or a neutral species with an electron-deficient atom (boron with fewer than
 *   four bonds), is an electrophile;
 * - a molecule with a carbon bonded to a halogen, or to N, O or S by a multiple bond (C=O, C#N),
 *   is an electrophile (NCERT: carbonyl compounds and alkyl halides);
 * - a negative ion, or a neutral species with a lone pair on N, O or S, is a nucleophile;
 * - otherwise neither.
 */
export function classifyReagent(g: MolGraph): ReagentClass {
  const totalCharge = g.atoms.reduce((t, a) => t + (a.charge ?? 0), 0)
  if (g.atoms.some((a) => (a.charge ?? 0) > 0)) {
    return 'electrophile'
  }
  const electronDeficientBoron = g.atoms.some(
    (a, i) => a.element === 'B' && (a.charge ?? 0) <= 0 && neighbours(g, i).reduce((t, n) => t + n.order, 0) < 4,
  )
  if (electronDeficientBoron) {
    return 'electrophile'
  }
  const carbonyloid = g.atoms.some((a, i) => {
    if (a.element !== 'C') {
      return false
    }
    return neighbours(g, i).some((n) => {
      const other = g.atoms[n.atom].element
      if (['F', 'Cl', 'Br', 'I'].includes(other)) {
        return true
      }
      return n.order >= 2 && ['N', 'O', 'S'].includes(other)
    })
  })
  if (carbonyloid) {
    return 'electrophile'
  }
  if (g.atoms.some((a) => (a.charge ?? 0) < 0) || totalCharge < 0) {
    return 'nucleophile'
  }
  const lonePair = g.atoms.some((a, i) => {
    if (!['N', 'O', 'S'].includes(a.element)) {
      return false
    }
    return neighbours(g, i).every((n) => n.order === 1)
  })
  return lonePair ? 'nucleophile' : 'neither'
}

/**
 * Carbon atoms that are electrophilic centres because a more electronegative atom (or a positive
 * charge) draws electron density from them (NCERT Problem 8.13).
 */
export function electrophilicCentres(g: MolGraph): number[] {
  const out: number[] = []
  g.atoms.forEach((a, i) => {
    if (a.element !== 'C') {
      return
    }
    const polarised = neighbours(g, i).some((n) => {
      const other = g.atoms[n.atom].element
      if (['F', 'Cl', 'Br', 'I'].includes(other)) {
        return true
      }
      return (n.order >= 2 || other !== 'C') && ['N', 'O', 'S'].includes(other)
    })
    if (polarised || (a.charge ?? 0) > 0) {
      out.push(i)
    }
  })
  return out
}

/** Named cases whose resonance contributors NCERT draws (Problems 8.16 to 8.18). */
export type NamedResonanceCase = 'carboxylate' | 'nitromethane' | 'benzene' | 'acrolein'

const RESONANCE_SMILES: Record<NamedResonanceCase, string[]> = {
  carboxylate: ['CC(=O)[O-]', 'CC([O-])=O'],
  nitromethane: ['C[N+](=O)[O-]', 'C[N+]([O-])=O'],
  benzene: ['C1=CC=CC=C1', 'C1C=CC=CC=1'],
  // Contributors I and II of Problem 8.17. Contributor III is not reconstructed here.
  acrolein: ['C=CC=O', '[CH2+]C=C[O-]'],
}

/**
 * The resonance contributors of a named case as MolGraphs with formal charges. The bond
 * placements are the NCERT drawings; the contributors are not reconstructed beyond those listed.
 */
export function resonanceContributors(name: NamedResonanceCase): MolGraph[] {
  return RESONANCE_SMILES[name].map((smiles) => parseSmiles(smiles))
}

/** Charge-separation score: the product of the positive and negative charges (0 if one sign). */
function separation(g: MolGraph): number {
  let plus = 0
  let minus = 0
  for (const a of g.atoms) {
    if ((a.charge ?? 0) > 0) plus += a.charge ?? 0
    if ((a.charge ?? 0) < 0) minus -= a.charge ?? 0
  }
  return plus * minus
}

/** Negative charge on the more electronegative atom: 0 when fine, 1 when on a less electronegative one. */
function badNegativeCharge(g: MolGraph): number {
  const negatives = g.atoms.filter((a) => (a.charge ?? 0) < 0)
  const positives = g.atoms.filter((a) => (a.charge ?? 0) > 0)
  if (negatives.length === 0 || positives.length === 0) {
    return 0
  }
  const worst = Math.min(...negatives.map((a) => electronegativity(a.element)))
  const best = Math.max(...positives.map((a) => electronegativity(a.element)))
  return worst < electronegativity('O') && worst < best ? 1 : 0
}

/**
 * Orders resonance contributors from most to least important (NCERT 8.7.6): more covalent bonds
 * first, then less charge separation, then a negative charge on the more electronegative atom.
 * Returns the indices, best first.
 */
export function contributorRank(list: MolGraph[]): number[] {
  const score = (g: MolGraph): [number, number, number] => {
    const bonds = g.bonds.reduce((t, b) => t + b.order, 0)
    return [-bonds, separation(g), badNegativeCharge(g)]
  }
  return list
    .map((g, index) => ({ index, s: score(g) }))
    .sort((x, y) => x.s[0] - y.s[0] || x.s[1] - y.s[1] || x.s[2] - y.s[2] || x.index - y.index)
    .map((x) => x.index)
}

/**
 * Homolytic (one electron to each atom, radicals) or heterolytic (both electrons to one atom,
 * giving ions) cleavage of the bond with index `bondIndex` (NCERT 8.7.1, Problem 8.11). In a
 * heterolytic cleavage the more electronegative atom takes the pair; with equal
 * electronegativity the second atom of the bond takes it.
 *
 * @returns the two fragments, [fragment containing bond.a, fragment containing bond.b]
 * @throws {RangeError} If the bond index does not exist
 */
export function cleavage(g: MolGraph, bondIndex: number, mode: 'homolytic' | 'heterolytic'): [MolGraph, MolGraph] {
  const bond = g.bonds[bondIndex]
  if (!bond) {
    throw new RangeError(`No bond with index ${bondIndex}`)
  }
  const atoms = g.atoms.map((a) => ({ ...a }))
  const bonds = g.bonds.filter((_, k) => k !== bondIndex).map((b) => ({ ...b }))
  const a = bond.a
  const b = bond.b
  if (mode === 'homolytic') {
    atoms[a].radical = (atoms[a].radical ?? 0) + 1
    atoms[b].radical = (atoms[b].radical ?? 0) + 1
  } else {
    const ea = electronegativity(atoms[a].element)
    const eb = electronegativity(atoms[b].element)
    const takerIsA = ea > eb
    const taker = takerIsA ? a : b
    const giver = takerIsA ? b : a
    atoms[taker].charge = (atoms[taker].charge ?? 0) - 1
    atoms[giver].charge = (atoms[giver].charge ?? 0) + 1
  }
  const side = componentOf(atoms.length, bonds, a)
  const indexA = atoms.map((_, i) => i).filter((i) => side[i])
  const indexB = atoms.map((_, i) => i).filter((i) => !side[i])
  const remap = (indices: number[]) => new Map(indices.map((old, k) => [old, k]))
  const mapA = remap(indexA)
  const mapB = remap(indexB)
  const fragmentA: MolGraph = {
    atoms: indexA.map((i) => atoms[i]),
    bonds: bonds
      .filter((x) => side[x.a])
      .map((x) => ({ ...x, a: mapA.get(x.a) as number, b: mapA.get(x.b) as number })),
  }
  const fragmentB: MolGraph = {
    atoms: indexB.map((i) => atoms[i]),
    bonds: bonds
      .filter((x) => !side[x.a])
      .map((x) => ({ ...x, a: mapB.get(x.a) as number, b: mapB.get(x.b) as number })),
  }
  return [fragmentA, fragmentB]
}

/** Atoms reachable from `start` through `bonds`, as a membership array over `count` atoms. */
function componentOf(count: number, bonds: MolGraph['bonds'], start: number): boolean[] {
  const seen = new Array<boolean>(count).fill(false)
  seen[start] = true
  const stack = [start]
  while (stack.length > 0) {
    const x = stack.pop() as number
    for (const bd of bonds) {
      const y = bd.a === x ? bd.b : bd.b === x ? bd.a : -1
      if (y >= 0 && !seen[y]) {
        seen[y] = true
        stack.push(y)
      }
    }
  }
  return seen
}

