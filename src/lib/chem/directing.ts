/**
 * The directive influence of a functional group on a monosubstituted benzene (NCERT 9.5.6), for the
 * orientation predictor and the Section 9.5.6 Scrolly. The group data come from NCERT_ORIENTING_GROUPS;
 * the products and their names come from electrophilicSubstitution; this module adds the ring geometry
 * (which ring carbon is ortho, meta or para to the substituent), the δ signs that the resonance argument
 * gives, and the σ-complex (arenium ion) for an attack at a chosen ring carbon.
 */

import type { MolAtom, MolBond, MolGraph } from './molecule-graph'
import { parseSmiles } from './molecule-parse'
import { findRings } from './hydrocarbon-species'
import { electrophilicSubstitution, type Reaction } from './hydrocarbon-reactions'
import { NCERT_ORIENTING_GROUPS, type DirectingGroup } from './ncert-unit9-tables'

/** A ring position relative to the substituent (ipso) carbon. */
export type RingPosition = 'ipso' | 'ortho' | 'meta' | 'para'

/**
 * A monosubstituted benzene for each NCERT 9.5.6 group, keyed by the group label NCERT_ORIENTING_GROUPS uses.
 * Each is written in Kekulé form. The -CH3 entry stands for every alkyl group (the lib maps -alkyl to -CH3).
 */
export const DIRECTING_SMILES: Readonly<Record<string, string>> = {
  '-OH': 'OC1=CC=CC=C1',
  '-NH2': 'NC1=CC=CC=C1',
  '-NHR': 'CNC1=CC=CC=C1',
  '-NHCOCH3': 'CC(=O)NC1=CC=CC=C1',
  '-OCH3': 'COC1=CC=CC=C1',
  '-CH3': 'CC1=CC=CC=C1',
  '-C2H5': 'CCC1=CC=CC=C1',
  '-F': 'FC1=CC=CC=C1',
  '-Cl': 'ClC1=CC=CC=C1',
  '-Br': 'BrC1=CC=CC=C1',
  '-I': 'IC1=CC=CC=C1',
  '-NO2': 'O=[N+]([O-])C1=CC=CC=C1',
  '-CN': 'N#CC1=CC=CC=C1',
  '-CHO': 'O=CC1=CC=CC=C1',
  '-COR': 'CC(=O)C1=CC=CC=C1',
  '-COOH': 'OC(=O)C1=CC=CC=C1',
  '-COOR': 'COC(=O)C1=CC=CC=C1',
}

/**
 * The groups the orientation predictor offers. −SO₃H is left out: electrophilicSubstitution throws for
 * benzenesulfonic acid as the substrate ("Atom S would have 6 bonds on a valence of 2"), so no outcome can
 * be given. The Section 9.5.6 table still lists it as a meta director.
 */
export const PREDICTOR_GROUPS: readonly string[] = ['-OH', '-NH2', '-NHR', '-NHCOCH3', '-OCH3', '-CH3', '-C2H5', '-F', '-Cl', '-Br', '-I', '-NO2', '-CN', '-CHO', '-COR', '-COOH', '-COOR']

/** The NCERT_ORIENTING_GROUPS entry for a group label. @throws {RangeError} If NCERT gives none */
export function directingEntry(group: string): DirectingGroup {
  const entry = NCERT_ORIENTING_GROUPS.find((g) => g.group === group)
  if (!entry) throw new RangeError(`NCERT gives no directing rule for ${group}`)
  return entry
}

/**
 * The monosubstituted benzene for a group. The -SO3H group has no SMILES here (the parser does not take a
 * hypervalent sulphur), so it is taken from the lib's own benzenesulfonic acid.
 *
 * @throws {RangeError} For a group with no substrate
 */
export function substrateOf(group: string): MolGraph {
  const smiles = DIRECTING_SMILES[group]
  if (smiles) return parseSmiles(smiles)
  if (group === '-SO3H') {
    const sulphonation = electrophilicSubstitution(parseSmiles('C1=CC=CC=C1'), 'sulphonation')
    return sulphonation.products[0].graph
  }
  throw new RangeError(`No substrate for ${group}`)
}

/** The ring of a benzene graph in cyclic order, and the ring carbon that carries the substituent (ipso). */
export function ringOf(g: MolGraph): { ring: number[]; ipso: number } {
  const ring = findRings(g, 6).find((r) => r.length === 6)
  if (!ring) throw new RangeError('A benzene ring is needed')
  const ipso = ring.find((a) => g.bonds.some((b) => (b.a === a && !ring.includes(b.b)) || (b.b === a && !ring.includes(b.a))))
  if (ipso === undefined) throw new RangeError('A monosubstituted benzene is needed')
  return { ring, ipso }
}

/** The position of a ring carbon relative to the ipso carbon, or null for an atom that is not on the ring. */
export function positionOf(g: MolGraph, atom: number): RingPosition | null {
  const { ring, ipso } = ringOf(g)
  const k = ring.indexOf(atom)
  if (k < 0) return null
  const d = (k - ring.indexOf(ipso) + 6) % 6
  if (d === 0) return 'ipso'
  if (d === 1 || d === 5) return 'ortho'
  if (d === 2 || d === 4) return 'meta'
  return 'para'
}

/** The ring carbons (by atom index) in one position class. */
export function atomsAt(g: MolGraph, position: RingPosition): number[] {
  const { ring } = ringOf(g)
  return ring.filter((a) => positionOf(g, a) === position)
}

/**
 * The δ sign that the NCERT 9.5.6 resonance argument gives at the ortho and para carbons: δ− for the
 * ortho-para directors (the group releases electron density there), δ+ for the meta directors (it
 * withdraws it). The meta carbons are not labelled.
 */
export function densitySign(group: string): 'δ−' | 'δ+' {
  return directingEntry(group).directs === 'meta' ? 'δ+' : 'δ−'
}

/** One outcome of a click on a ring carbon: the lib's reaction, the click's position, and whether NCERT allows it. */
export interface AttackOutcome {
  position: RingPosition | null
  /** Whether the lib gives a product at this position. */
  reachable: boolean
  reaction: Reaction
  /** The lib's product at this position, when there is one. */
  product?: { name: string; formula: string }
  /** The lib's reason for the directing (its `why`). */
  why: string
  activating: boolean
  directs: 'ortho-para' | 'meta'
}

/**
 * Whether an electrophilic attack at a ring carbon of a monosubstituted benzene gives a product, by the lib's
 * electrophilicSubstitution. The reaction is the lib's; the click is only mapped to its position.
 *
 * @throws {RangeError} If the kind is not modelled or the ring carbon is not on the ring
 */
export function attackOutcome(group: string, kind: 'nitration' | 'bromination' | 'chlorination', atom: number): AttackOutcome {
  const g = substrateOf(group)
  const reaction = electrophilicSubstitution(g, kind)
  const position = positionOf(g, atom)
  if (position === null) throw new RangeError('Click a ring carbon')
  const match = reaction.products.find((p) => p.position === position)
  const entry = directingEntry(group)
  return {
    position,
    reachable: position !== 'ipso' && match !== undefined,
    reaction,
    product: match ? { name: match.name, formula: match.formula } : undefined,
    why: reaction.why,
    activating: entry.effect === 'activating',
    directs: entry.directs,
  }
}

/**
 * The σ-complex (arenium ion) for an attack of NO₂⁺ at ring carbon `attack`, with the positive charge on
 * ring carbon `charge`. The charge must sit ortho or para to the attack (ring offsets 1, 3 or 5). The attack
 * carbon is sp³ and carries its hydrogen and the NO₂ group. With `oxonium`, the charge is moved onto the
 * substituent's donor atom, which is drawn as C=O⁺H (only possible when the charge sits on the ipso carbon,
 * as the NCERT 9.5.6 extra contributor for an o or p attack on phenol).
 *
 * Hydrogens and the substituent are kept; the ring bonds are rewritten for this form. Net charge: +1.
 *
 * @throws {RangeError} If the charge is not ortho or para to the attack, or `oxonium` is asked for a charge off the ipso carbon
 */
export function areniumIon(g: MolGraph, attack: number, charge: number, oxonium = false): MolGraph {
  const { ring, ipso } = ringOf(g)
  const ia = ring.indexOf(attack)
  if (ia < 0 || ring.indexOf(charge) < 0) throw new RangeError('Attack and charge must be ring carbons')
  // Walk the ring from the attack carbon, in whichever direction puts the charge on an odd offset.
  const offsetIn = (dir: number) => (dir * (ring.indexOf(charge) - ia) + 12) % 6
  const dir = [1, -1].find((d) => [1, 3, 5].includes(offsetIn(d)))
  if (dir === undefined) throw new RangeError('The charge must be ortho or para to the attack')
  const order = [0, 1, 2, 3, 4, 5].map((i) => ring[(ia + dir * i + 12) % 6])
  const c = order.indexOf(charge)
  if (oxonium && charge !== ipso) throw new RangeError('The oxonium contributor needs the charge on the ipso carbon')
  // The atoms 1..5 other than the charge pair up along the ring into double bonds.
  const pairs: [number, number][] = []
  const used = new Set<number>([c])
  for (let i = 1; i < 5; i++) {
    if (i === c || i + 1 === c || used.has(i) || used.has(i + 1)) continue
    pairs.push([order[i], order[i + 1]])
    used.add(i)
    used.add(i + 1)
  }
  const ringBondOrder = (a: number, b: number): 1 | 2 => (pairs.some(([x, y]) => (x === a && y === b) || (x === b && y === a)) ? 2 : 1)

  const atoms: MolAtom[] = g.atoms.map((a) => ({ ...a }))
  const bonds: MolBond[] = g.bonds.map((b) => {
    const inRing = ring.includes(b.a) && ring.includes(b.b)
    return inRing ? { ...b, order: ringBondOrder(b.a, b.b) } : { ...b }
  })
  atoms[charge] = { ...atoms[charge], charge: oxonium ? 0 : 1 }

  // The NO2 group on the sp3 attack carbon: N(+) with =O and -O(-), so the group itself is neutral.
  const n = atoms.length
  atoms.push({ element: 'N', charge: 1, hCount: 0 }, { element: 'O', hCount: 0 }, { element: 'O', charge: -1, hCount: 0 })
  bonds.push({ a: attack, b: n, order: 1 }, { a: n, b: n + 1, order: 2 }, { a: n, b: n + 2, order: 1 })

  if (oxonium) {
    const donor = g.bonds.find((b) => (b.a === ipso && !ring.includes(b.b)) || (b.b === ipso && !ring.includes(b.a)))
    if (!donor) throw new RangeError('The substituent has no donor atom')
    const donorAtom = donor.a === ipso ? donor.b : donor.a
    atoms[donorAtom] = { ...atoms[donorAtom], charge: 1 }
    const idx = bonds.findIndex((b) => (b.a === ipso && b.b === donorAtom) || (b.b === ipso && b.a === donorAtom))
    bonds[idx] = { ...bonds[idx], order: 2 }
  }
  return { atoms, bonds }
}
