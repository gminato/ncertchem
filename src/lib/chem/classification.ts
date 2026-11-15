/**
 * Classification of organic compounds for Unit 8, Section 8.4: acyclic (open chain) or cyclic
 * compounds, the cyclic ones split into alicyclic, aromatic (benzenoid and non-benzenoid) and
 * heterocyclic (NCERT's tree on PDF p. 6), and the functional group of a molecule (Section 8.4.1).
 *
 * Everything is worked out from the MolGraph. A ring is an induced simple cycle (no bond joins two
 * of its atoms other than the ring's own bonds), so the perimeter of naphthalene is not a ring of
 * its own. A ring is aromatic when every ring atom is sp2 and the ring holds 4n + 2 π electrons
 * (Hückel's rule): a C=C bond in the ring gives one π electron per atom, a C=O carbon with its
 * double bond outside the ring gives none (as in tropone), and O, S or a pyrrole-type N gives two.
 */

import type { MolGraph } from './molecule-graph'
import { neighbours } from './molecule-parse'
import { NCERT_FUNCTIONAL_PRIORITY } from './ncert-unit8-tables'

export type RingClass = 'acyclic' | 'alicyclic' | 'aromatic' | 'heterocyclic'

export type Subclass =
  | 'open chain'
  | 'homocyclic'
  | 'benzenoid'
  | 'non-benzenoid'
  | 'heterocyclic aromatic'
  | 'heterocyclic non-aromatic'

/** The class of a molecule, its subclass and the rings the classification used. */
export interface Classification {
  ringClass: RingClass
  subclass: Subclass
  /** Induced simple rings, each an ordered list of atom indices. */
  rings: number[][]
  /** The rings that satisfy Hückel's rule. */
  aromaticRings: number[][]
}

/** Every bond joining two atoms of the list, by its index in graph.bonds. */
function bondsWithin(g: MolGraph, atoms: readonly number[]): number[] {
  const inside = new Set(atoms)
  return g.bonds.map((b, i) => (inside.has(b.a) && inside.has(b.b) ? i : -1)).filter((i) => i >= 0)
}

/**
 * The induced simple cycles of a graph: each cycle's atoms in order, with no chord joining two of
 * its atoms. Brute force over simple paths, which is fast for the molecules of this Section.
 */
export function inducedRings(g: MolGraph): number[][] {
  const n = g.atoms.length
  const adj: number[][] = Array.from({ length: n }, () => [])
  for (const b of g.bonds) {
    adj[b.a].push(b.b)
    adj[b.b].push(b.a)
  }
  const seen = new Set<string>()
  const rings: number[][] = []
  for (let s = 0; s < n; s++) {
    const path = [s]
    const onPath = new Set([s])
    const walk = (u: number) => {
      for (const v of adj[u]) {
        if (v === s && path.length >= 3) {
          const key = [...path].sort((x, y) => x - y).join(',')
          if (!seen.has(key) && bondsWithin(g, path).length === path.length) {
            seen.add(key)
            rings.push([...path])
          }
        } else if (v > s && !onPath.has(v)) {
          path.push(v)
          onPath.add(v)
          walk(v)
          path.pop()
          onPath.delete(v)
        }
      }
    }
    walk(s)
  }
  return rings
}

/**
 * π electrons contributed by a ring, or null when a ring atom is not sp2 (so the ring cannot be
 * aromatic). Carbon with a double bond in the ring gives 1; carbon with an exocyclic double bond
 * gives 0; O, S, and an N with no double bond give 2 (a lone pair in the ring); a ring N with a
 * double bond gives 1.
 */
export function ringPiElectrons(g: MolGraph, ring: readonly number[]): number | null {
  const inRing = new Set(ring)
  // A double bond to any atom of another ring of a fused system is still a π bond of the system.
  const anyRing = new Set(inducedRings(g).flat())
  let total = 0
  for (const a of ring) {
    const atom = g.atoms[a]
    const bonds = neighbours(g, a)
    const ringDouble = bonds.some((b) => b.order === 2 && (inRing.has(b.atom) || anyRing.has(b.atom)))
    const exoDouble = bonds.some((b) => b.order === 2 && !anyRing.has(b.atom))
    const ringSingles = bonds.filter((b) => inRing.has(b.atom)).length
    if (atom.element === 'C') {
      if (ringDouble) total += 1
      else if (exoDouble) total += 0
      else return null
    } else if (atom.element === 'N' && ringDouble) {
      total += 1
    } else if ((atom.element === 'O' || atom.element === 'S' || atom.element === 'N') && !ringDouble && !exoDouble && ringSingles === 2) {
      total += 2
    } else {
      return null
    }
  }
  return total
}

/** True when a ring satisfies Hückel's rule (4n + 2 π electrons, n ≥ 0) and is fully sp2. */
export function isAromaticRing(g: MolGraph, ring: readonly number[]): boolean {
  const pi = ringPiElectrons(g, ring)
  return pi !== null && pi >= 2 && (pi - 2) % 4 === 0
}

/** Classifies a molecule as NCERT's tree does (Section 8.4). */
export function classifyMolecule(g: MolGraph): Classification {
  const rings = inducedRings(g)
  if (rings.length === 0) {
    return { ringClass: 'acyclic', subclass: 'open chain', rings, aromaticRings: [] }
  }
  const aromaticRings = rings.filter((r) => isAromaticRing(g, r))
  if (aromaticRings.length > 0) {
    const hetero = aromaticRings.some((r) => r.some((a) => g.atoms[a].element !== 'C'))
    if (hetero) return { ringClass: 'heterocyclic', subclass: 'heterocyclic aromatic', rings, aromaticRings }
    const benzenoid = aromaticRings.some((r) => r.length === 6)
    return { ringClass: 'aromatic', subclass: benzenoid ? 'benzenoid' : 'non-benzenoid', rings, aromaticRings }
  }
  const hetero = rings.some((r) => r.some((a) => g.atoms[a].element !== 'C'))
  if (hetero) return { ringClass: 'heterocyclic', subclass: 'heterocyclic non-aromatic', rings, aromaticRings }
  return { ringClass: 'alicyclic', subclass: 'homocyclic', rings, aromaticRings }
}

/** The functional groups the Section draws, in the lib's ids. */
export const GROUP_IDS = [
  'carboxylic acid',
  'ester',
  'amide',
  'nitrile',
  'aldehyde',
  'ketone',
  'phenol',
  'alcohol',
  'amine',
  'alkene',
  'alkyne',
  'ether',
  'alkyl halide',
] as const

export type GroupId = (typeof GROUP_IDS)[number]

/** The badge text and the name of each group, as the drawings and the sorter show them. */
export const GROUP_TABLE: Record<GroupId, { label: string; name: string }> = {
  'carboxylic acid': { label: '–COOH', name: 'carboxylic acid' },
  ester: { label: '–COOR', name: 'ester' },
  amide: { label: '–CONH₂', name: 'amide' },
  nitrile: { label: '–C≡N', name: 'nitrile' },
  aldehyde: { label: '–CHO', name: 'aldehyde' },
  ketone: { label: '>C=O', name: 'ketone' },
  phenol: { label: '–OH', name: 'phenol' },
  alcohol: { label: '–OH', name: 'alcohol' },
  amine: { label: '–N<', name: 'amine' },
  alkene: { label: '>C=C<', name: 'alkene' },
  alkyne: { label: '–C≡C–', name: 'alkyne' },
  ether: { label: '–O–', name: 'ether' },
  'alkyl halide': { label: '–X', name: 'alkyl halide' },
}

/** One functional group found in a molecule: its id and the atoms that make it up. */
export interface GroupHit {
  group: GroupId
  atoms: number[]
}

const HALOGENS = ['F', 'Cl', 'Br', 'I']

/**
 * The functional groups of a molecule (Section 8.4.1). Hydrogens come from `hCount`, so the
 * graph must come from parseSmiles. Aromatic rings are not counted as C=C groups.
 */
export function functionalGroups(g: MolGraph): GroupHit[] {
  const hits: GroupHit[] = []
  const aromatic = new Set(classifyMolecule(g).aromaticRings.flat())
  const el = (a: number) => g.atoms[a].element
  const hs = (a: number) => g.atoms[a].hCount ?? 0
  const nb = (a: number) => neighbours(g, a)
  const doubleO = (c: number) => nb(c).find((b) => b.order === 2 && el(b.atom) === 'O')?.atom
  const isCarbonyl = (c: number) => el(c) === 'C' && doubleO(c) !== undefined

  // Carbonyl carbons: acid, ester, amide, aldehyde, ketone (in that order of precedence).
  g.atoms.forEach((atom, c) => {
    if (atom.element !== 'C') return
    const o = doubleO(c)
    if (o === undefined) return
    const singles = nb(c).filter((b) => b.order === 1)
    const oh = singles.find((b) => el(b.atom) === 'O' && hs(b.atom) > 0)
    const acylO = singles.find((b) => el(b.atom) === 'O' && hs(b.atom) === 0 && nb(b.atom).some((x) => x.atom !== c))
    const amideN = singles.find((b) => el(b.atom) === 'N' && !aromatic.has(b.atom))
    if (oh) hits.push({ group: 'carboxylic acid', atoms: [c, o, oh.atom] })
    else if (acylO) hits.push({ group: 'ester', atoms: [c, o, acylO.atom] })
    else if (amideN) hits.push({ group: 'amide', atoms: [c, o, amideN.atom] })
    else if (hs(c) === 1) hits.push({ group: 'aldehyde', atoms: [c, o] })
    else if (singles.filter((b) => el(b.atom) === 'C').length === 2) hits.push({ group: 'ketone', atoms: [c, o] })
  })

  // Nitriles and alkynes: a triple bond between C and N, or between two C.
  g.bonds.forEach((b) => {
    if (b.order !== 3) return
    if (el(b.a) === 'C' && el(b.b) === 'N') hits.push({ group: 'nitrile', atoms: [b.a, b.b] })
    else if (el(b.a) === 'N' && el(b.b) === 'C') hits.push({ group: 'nitrile', atoms: [b.b, b.a] })
    else if (el(b.a) === 'C' && el(b.b) === 'C') hits.push({ group: 'alkyne', atoms: [b.a, b.b] })
  })

  // Alkenes: a C=C bond that is not one of the bonds of an aromatic ring.
  const inAromaticRing = new Set(classifyMolecule(g).aromaticRings.flatMap((r) => bondsWithin(g, r)))
  g.bonds.forEach((b, i) => {
    if (b.order === 2 && el(b.a) === 'C' && el(b.b) === 'C' && !inAromaticRing.has(i)) {
      hits.push({ group: 'alkene', atoms: [b.a, b.b] })
    }
  })

  // Alcohols and phenols: O with an H, bonded by a single bond to a carbon that is not a carbonyl.
  g.atoms.forEach((atom, o) => {
    if (atom.element !== 'O' || hs(o) === 0) return
    const c = nb(o).find((b) => b.order === 1 && el(b.atom) === 'C')?.atom
    if (c === undefined || isCarbonyl(c)) return
    hits.push({ group: aromatic.has(c) ? 'phenol' : 'alcohol', atoms: [o, c] })
  })

  // Amines: an N with no multiple bond, outside an aromatic ring, bonded to carbon but not to a carbonyl carbon.
  g.atoms.forEach((atom, n) => {
    if (atom.element !== 'N' || aromatic.has(n)) return
    const bonds = nb(n)
    if (bonds.some((b) => b.order !== 1)) return
    const carbons = bonds.filter((b) => el(b.atom) === 'C')
    if (carbons.length === 0 || carbons.some((b) => isCarbonyl(b.atom))) return
    if (bonds.some((b) => el(b.atom) === 'N' || el(b.atom) === 'O')) return
    hits.push({ group: 'amine', atoms: [n] })
  })

  // Ethers: an O with two single bonds to carbon and no H, not part of a carbonyl's ester link.
  g.atoms.forEach((atom, o) => {
    if (atom.element !== 'O' || hs(o) > 0 || aromatic.has(o)) return
    const bonds = nb(o)
    if (bonds.length !== 2 || bonds.some((b) => b.order !== 1 || el(b.atom) !== 'C')) return
    if (bonds.some((b) => isCarbonyl(b.atom))) return
    hits.push({ group: 'ether', atoms: [o] })
  })

  // Alkyl halides: a halogen on an sp3 carbon (not on a ring).
  g.atoms.forEach((atom, x) => {
    if (!HALOGENS.includes(atom.element)) return
    const c = nb(x).find((b) => b.order === 1 && el(b.atom) === 'C')?.atom
    if (c === undefined || aromatic.has(c)) return
    hits.push({ group: 'alkyl halide', atoms: [x, c] })
  })

  return hits
}

/** The NCERT priority token of each group, as NCERT_FUNCTIONAL_PRIORITY writes it. */
const PRIORITY_TOKEN: Partial<Record<GroupId, string>> = {
  'carboxylic acid': '-COOH',
  ester: '-COOR',
  amide: '-CONH2',
  nitrile: '-CN',
  aldehyde: '-CHO',
  ketone: '>C=O',
  alcohol: '-OH',
  phenol: '-OH',
  amine: '-NH2',
  alkene: '>C=C<',
  alkyne: '-C≡C-',
}

/**
 * The principal functional group (Section 8.4.1): the highest group in NCERT's order of priority.
 * Halogens and ethers are prefixes in IUPAC names, so they are the principal group only when no
 * other group is present. Returns null for a hydrocarbon.
 */
export function principalGroup(hits: readonly GroupHit[]): GroupId | null {
  const present = new Set(hits.map((h) => h.group))
  for (const token of NCERT_FUNCTIONAL_PRIORITY) {
    const id = GROUP_IDS.find((g) => PRIORITY_TOKEN[g] === token && present.has(g))
    if (id) return id
  }
  if (present.has('alkyl halide')) return 'alkyl halide'
  if (present.has('ether')) return 'ether'
  return null
}
