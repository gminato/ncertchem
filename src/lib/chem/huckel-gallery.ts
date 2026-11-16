/**
 * The ring gallery of Section 9.5.3 (Hückel's rule) and the report the Huckel checker shows for each ring.
 *
 * Every verdict comes from huckel() in aromaticity.ts. Two things the checker needs that huckel() does not give:
 * - the ring to test. huckel() without a ring only searches rings of up to 12 atoms, so anthracene's 14-atom
 *   perimeter is missed and it would count 10 π electrons (see the test). The report tests the largest cycle
 *   of the graph instead, up to 14 atoms.
 * - a three-way verdict. huckel() says 'antiaromatic-or-non-aromatic' for a 4n π system. A planar ring of 4n
 *   π electrons is antiaromatic; a non-planar one (cyclooctatetraene, tub-shaped) is non-aromatic.
 *
 * Names are conventional names, because iupac-organic.ts cannot name charged or fused rings. The IUPAC name
 * shown alongside is the lib's own, when the lib can name the ring.
 */

import type { MolGraph } from './molecule-graph'
import { huckel, type HuckelResult } from './aromaticity'
import { findRings } from './hydrocarbon-species'
import { iupacName } from './iupac-organic'
import { molecularFormula, parseSmiles } from './molecule-parse'

/** One ring in the gallery. `planar` is false only where the ring cannot lie flat. */
export interface GalleryRing {
  id: string
  smiles: string
  /** The conventional name shown to the learner. */
  name: string
  planar: boolean
  /** One line on the ring's shape, shown in the detail panel. */
  shape: string
}

/** The gallery, in the order the checker shows it. */
export const HUCKEL_GALLERY: readonly GalleryRing[] = [
  { id: 'benzene', smiles: 'C1=CC=CC=C1', name: 'benzene', planar: true, shape: 'A flat hexagon of six sp² carbons.' },
  { id: 'naphthalene', smiles: 'C1=CC=C2C=CC=CC2=C1', name: 'naphthalene', planar: true, shape: 'Two benzene rings sharing one bond, flat.' },
  { id: 'anthracene', smiles: 'C1=CC=C2C=C3C=CC=CC3=CC2=C1', name: 'anthracene', planar: true, shape: 'Three rings fused in a straight row, flat.' },
  { id: 'pyridine', smiles: 'C1=CC=NC=C1', name: 'pyridine', planar: true, shape: 'Benzene with one CH replaced by N; that N has its lone pair outside the ring.' },
  { id: 'pyrrole', smiles: 'C1=CNC=C1', name: 'pyrrole', planar: true, shape: 'Five atoms; the N lone pair sits in the ring.' },
  { id: 'furan', smiles: 'C1=COC=C1', name: 'furan', planar: true, shape: 'Five atoms; one O lone pair sits in the ring.' },
  { id: 'cyclopropenyl-cation', smiles: '[CH+]1C=C1', name: 'cyclopropenyl cation', planar: true, shape: 'A three-membered ring with one empty p orbital.' },
  { id: 'cyclopentadienyl-anion', smiles: '[CH-]1C=CC=C1', name: 'cyclopentadienyl anion', planar: true, shape: 'Five carbons; the carbanion lone pair joins the π system.' },
  { id: 'tropylium', smiles: '[CH+]1C=CC=CC=C1', name: 'tropylium ion', planar: true, shape: 'Seven carbons, a flat ring with one empty p orbital.' },
  { id: 'cyclopentadienyl-cation', smiles: '[CH+]1C=CC=C1', name: 'cyclopentadienyl cation', planar: true, shape: 'Five carbons, a flat ring with one empty p orbital.' },
  { id: 'cyclobutadiene', smiles: 'C1=CC=C1', name: 'cyclobutadiene', planar: true, shape: 'A flat square of four carbons.' },
  { id: 'cyclooctatetraene', smiles: 'C1=CC=CC=CC=C1', name: 'cyclooctatetraene', planar: false, shape: 'Eight carbons in a tub; the ring is not flat.' },
  { id: 'cyclopentadiene', smiles: 'C1=CCC=C1', name: 'cyclopentadiene', planar: true, shape: 'Five carbons, one of them a CH₂ with no p orbital.' },
]

/** The verdict the checker reports: aromatic, antiaromatic, or non-aromatic (and not cyclic). */
export type RingVerdict = 'aromatic' | 'antiaromatic' | 'non-aromatic'

/** Everything the checker shows for one ring. */
export interface RingReport {
  id: string
  name: string
  /** The lib's IUPAC name, when iupac-organic.ts can name the ring. */
  iupac: string | undefined
  graph: MolGraph
  /** Formula with subscripts and a superscript charge, e.g. C₅H₅⁻. */
  formula: string
  cyclic: boolean
  /** True when every ring atom is in the π system (conjugated). */
  conjugated: boolean
  planar: boolean
  piElectrons: number
  /** n of the 4n+2 rule when the count fits it. */
  n: number | undefined
  verdict: RingVerdict
  /** The lib's reasons, with the three-way verdict's reason first. */
  reasons: string[]
}

const SUB: Record<string, string> = { '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉' }

/** Subscript digits and a superscript charge: C5H5- becomes C₅H₅⁻. */
export function ionFormula(plain: string): string {
  const m = /([+-])$/.exec(plain)
  const body = m ? plain.slice(0, -1) : plain
  const digits = body.replace(/[0-9]/g, (d) => SUB[d])
  if (!m) return digits
  return digits + (m[1] === '+' ? '⁺' : '⁻')
}

/**
 * The largest simple cycle of the graph (up to 14 atoms), the ring the checker tests. For a monocycle this
 * is the ring; for naphthalene and anthracene it is the outer perimeter.
 *
 * @returns the atoms in ring order, or undefined for an acyclic graph
 */
export function largestCycle(g: MolGraph): number[] | undefined {
  const rings = findRings(g, 14)
  if (rings.length === 0) return undefined
  return rings.reduce((best, r) => (r.length > best.length ? r : best))
}

/** The verdict of a huckel() result, with the planar flag deciding antiaromatic from non-aromatic. */
function verdictOf(h: HuckelResult, planar: boolean): RingVerdict {
  if (h.verdict === 'aromatic') return 'aromatic'
  if (h.verdict === 'antiaromatic-or-non-aromatic') return planar ? 'antiaromatic' : 'non-aromatic'
  return 'non-aromatic'
}

/**
 * The full report for one gallery ring: the lib's Hückel result on its largest cycle, with the three-way verdict.
 *
 * @throws {RangeError} If the id is not in the gallery
 */
export function ringReport(id: string): RingReport {
  const entry = HUCKEL_GALLERY.find((r) => r.id === id)
  if (!entry) throw new RangeError(`No ring "${id}" in the Hückel gallery`)
  const graph = parseSmiles(entry.smiles)
  const ring = largestCycle(graph)
  const h = huckel(graph, ring)
  const verdict = verdictOf(h, entry.planar)
  let iupac: string | undefined
  try {
    iupac = iupacName(graph)
  } catch {
    iupac = undefined
  }
  const reasons = [...h.reasons]
  if (verdict === 'antiaromatic') reasons.unshift(`${h.piElectrons} π electrons (4n) on a planar ring: antiaromatic`)
  if (verdict === 'non-aromatic' && h.verdict === 'antiaromatic-or-non-aromatic' && !entry.planar) {
    reasons.unshift('a 4n π system that is not planar is non-aromatic, not antiaromatic')
  }
  return {
    id,
    name: entry.name,
    iupac,
    graph,
    formula: ionFormula(molecularFormula(graph)),
    cyclic: h.cyclic,
    conjugated: h.everyRingAtomConjugated,
    planar: entry.planar,
    piElectrons: h.piElectrons,
    n: h.n,
    verdict,
    reasons,
  }
}

/** The learner's answers to the five questions of the checker. An unanswered question is undefined. */
export interface CheckerAnswers {
  cyclic?: boolean
  /** Planar, with every ring atom in the π system. */
  flat?: boolean
  count?: number
  fits?: boolean
  verdict?: RingVerdict
}

/** One question and whether the learner's answer matches the lib (undefined while unanswered). */
export interface CheckerRow {
  key: keyof CheckerAnswers
  correct: boolean | undefined
}

/**
 * Marks each answer against the lib's report for the ring. The question "flat" is correct when the ring is
 * planar and every ring atom is conjugated; "fits" is correct when the count is of the form 4n + 2.
 */
export function scoreAnswers(r: RingReport, a: CheckerAnswers): CheckerRow[] {
  const truth: Record<keyof CheckerAnswers, boolean | number | string> = {
    cyclic: r.cyclic,
    flat: r.conjugated && r.planar,
    count: r.piElectrons,
    fits: r.n !== undefined,
    verdict: r.verdict,
  }
  const given = (key: keyof CheckerAnswers): unknown => a[key]
  return (['cyclic', 'flat', 'count', 'fits', 'verdict'] as const).map((key) => {
    const value = given(key)
    return { key, correct: value === undefined ? undefined : value === truth[key] }
  })
}
