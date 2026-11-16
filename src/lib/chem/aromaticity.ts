/**
 * Hückel's (4n+2) π-electron rule for a ring of a MolGraph (NCERT Class 11 Unit 9, section 9.5.1).
 *
 * The check counts π electrons ring atom by ring atom: a ring C in a ring double bond contributes 1,
 * a carbocation centre 0 and a carbanion centre 2; a pyridine-type N (double bond in the ring) 1, a
 * pyrrole-type N or a furan/thiophene O or S (lone pair in the ring) 2. A ring atom with an exocyclic
 * double bond or an sp3 carbon breaks conjugation.
 *
 * Planarity is assumed for a small fully conjugated ring. Cyclooctatetraene is the explicit exception:
 * its 4n π system is not planar (tub shape), so it is non-aromatic rather than antiaromatic.
 */

import type { MolGraph } from './molecule-graph'
import { neighbours } from './molecule-parse'
import { findRings } from './hydrocarbon-species'

/** The verdict of the rule for a molecule. */
export type AromaticVerdict = 'aromatic' | 'antiaromatic-or-non-aromatic' | 'not cyclic' | 'not fully conjugated'

/** The result of huckel(): the ring checked, its π electrons and the verdict with its reasons. */
export interface HuckelResult {
  cyclic: boolean
  everyRingAtomConjugated: boolean
  /** The ring atoms (indices into the graph) that were checked, in ring order; empty if not cyclic. */
  ring: number[]
  piElectrons: number
  /** n of the 4n+2 rule when the count fits it; undefined otherwise. */
  n: number | undefined
  verdict: AromaticVerdict
  reasons: string[]
}

interface AtomPi {
  conjugated: boolean
  electrons: number
  note: string
}

/** The π contribution of one ring atom, given the ring it sits in. */
function atomPi(g: MolGraph, i: number, ring: number[]): AtomPi {
  const atom = g.atoms[i]
  const nb = neighbours(g, i)
  const inRing = (j: number) => ring.includes(j)
  const ringDouble = nb.some((n) => n.order === 2 && inRing(n.atom))
  const exoDouble = nb.some((n) => n.order === 2 && !inRing(n.atom))
  const ringBonds = nb.filter((n) => inRing(n.atom)).length
  const charge = atom.charge ?? 0
  if (atom.element === 'C') {
    if (charge === 1) return { conjugated: true, electrons: 0, note: 'carbocation centre (empty p orbital)' }
    if (charge === -1) return { conjugated: true, electrons: 2, note: 'carbanion centre (lone pair in the π system)' }
    if (exoDouble) return { conjugated: false, electrons: 0, note: 'exocyclic C=X breaks the ring π system' }
    if (ringDouble) return { conjugated: true, electrons: 1, note: 'sp2 carbon with a ring double bond' }
    return { conjugated: false, electrons: 0, note: 'sp3 carbon in the ring (no p orbital in the π system)' }
  }
  if (atom.element === 'N') {
    if (ringDouble) return { conjugated: true, electrons: 1, note: 'pyridine-type nitrogen (double bond in the ring)' }
    if (charge === 0 && ringBonds === 2 && !exoDouble) return { conjugated: true, electrons: 2, note: 'pyrrole-type nitrogen (lone pair in the ring)' }
    return { conjugated: false, electrons: 0, note: 'nitrogen cannot donate into the ring here' }
  }
  if (atom.element === 'O' || atom.element === 'S') {
    if (!ringDouble && !exoDouble && ringBonds === 2 && charge === 0) {
      return { conjugated: true, electrons: 2, note: `${atom.element} lone pair in the ring (furan or thiophene type)` }
    }
    return { conjugated: false, electrons: 0, note: `${atom.element} cannot donate a pair into the ring here` }
  }
  return { conjugated: false, electrons: 0, note: `${atom.element} is not handled by the rule` }
}

/** True if consecutive atoms of the list are bonded and the list closes into a ring. */
function isCycle(g: MolGraph, ring: number[]): boolean {
  if (ring.length < 3) return false
  return ring.every((a, k) => {
    const b = ring[(k + 1) % ring.length]
    return g.bonds.some((x) => (x.a === a && x.b === b) || (x.a === b && x.b === a))
  })
}

/**
 * Applies Hückel's rule to a ring of the graph. With `ringAtoms` the ring is given (in ring order); without it,
 * the largest fully conjugated ring is checked (for naphthalene, its 10-atom perimeter).
 *
 * @param ringAtoms the ring atoms in ring order (optional)
 * @returns the verdict, the π-electron count and the reasons
 * @throws {RangeError} If ringAtoms is given but is not a ring of the graph
 */
export function huckel(g: MolGraph, ringAtoms?: number[]): HuckelResult {
  if (ringAtoms && !isCycle(g, ringAtoms)) throw new RangeError('ringAtoms must list the atoms of a ring in ring order')
  const rings = ringAtoms ? [ringAtoms] : findRings(g, 18)
  if (rings.length === 0) {
    return {
      cyclic: false,
      everyRingAtomConjugated: false,
      ring: [],
      piElectrons: 0,
      n: undefined,
      verdict: 'not cyclic',
      reasons: ['the molecule has no ring, so Hückel’s rule does not apply'],
    }
  }
  const scored = rings.map((r) => ({ ring: r, pis: r.map((i) => atomPi(g, i, r)) }))
  const conjugated = scored.filter((s) => s.pis.every((p) => p.conjugated))
  const pick = conjugated.length
    ? conjugated.reduce((best, s) => (s.ring.length > best.ring.length ? s : best))
    : scored.reduce((best, s) => (s.ring.length > best.ring.length ? s : best))
  if (conjugated.length === 0) {
    const broken = pick.pis.filter((p) => !p.conjugated).map((p) => p.note)
    return {
      cyclic: true,
      everyRingAtomConjugated: false,
      ring: pick.ring,
      piElectrons: pick.pis.reduce((s, p) => s + p.electrons, 0),
      n: undefined,
      verdict: 'not fully conjugated',
      reasons: [`not every ring atom is in the π system: ${[...new Set(broken)].join('; ')}`],
    }
  }
  const electrons = pick.pis.reduce((s, p) => s + p.electrons, 0)
  const reasons = pick.pis.map((p) => p.note)
  if (electrons % 4 === 2) {
    const n = (electrons - 2) / 4
    return {
      cyclic: true,
      everyRingAtomConjugated: true,
      ring: pick.ring,
      piElectrons: electrons,
      n,
      verdict: 'aromatic',
      reasons: [`${electrons} π electrons = 4×${n}+2`, 'assumes a planar, fully conjugated ring', ...reasons],
    }
  }
  const eight = pick.ring.length === 8 && electrons === 8
  return {
    cyclic: true,
    everyRingAtomConjugated: true,
    ring: pick.ring,
    piElectrons: electrons,
    n: undefined,
    verdict: 'antiaromatic-or-non-aromatic',
    reasons: [
      eight
        ? 'cyclooctatetraene has 8 π electrons (4n); it is tub-shaped and not planar, so it is non-aromatic, not antiaromatic'
        : `${electrons} π electrons is not 4n+2; a planar ring of 4n π electrons is antiaromatic, and a non-planar one is non-aromatic`,
      ...reasons,
    ],
  }
}
