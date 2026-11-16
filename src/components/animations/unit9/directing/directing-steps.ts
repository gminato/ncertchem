/**
 * Pure data for the directing-groups Scrolly (Section 9.5.6): the five Steps in order, the phenol
 * resonance species (NCERT's −OH example), the σ-complexes for an attack of NO₂⁺ on phenol at the
 * ortho, meta and para carbons, and the table of NCERT's groups. Every structure is built here from
 * the lib; the drawing components read it.
 */

import type { MolGraph } from '@/lib/chem/molecule-graph'
import { parseSmiles, molecularFormula } from '@/lib/chem/molecule-parse'
import { areniumIon, atomsAt, DIRECTING_SMILES, substrateOf } from '@/lib/chem/directing'
import { NCERT_ORIENTING_GROUPS, type DirectingGroup } from '@/lib/chem/ncert-unit9-tables'
import { resonanceSpecies, type ResonanceSpecies } from '@/lib/chem/resonance-species'
import { subscriptDigits } from '@/components/organic'

/** The five Steps: the donor, the withdrawing group, the three σ-complexes, the extra contributor, the table. */
export const DIRECTING_STEP_KINDS = ['donor', 'withdrawer', 'sigma', 'extra', 'table'] as const
export type DirectingStepKind = (typeof DIRECTING_STEP_KINDS)[number]

/**
 * Phenol with its OH lone pair in the ring: the form drawn first, then the two contributors with the
 * negative charge on the ortho and para carbons. Same electron-pushing pattern as the lib's aniline
 * species (Unit 8), with O for N; the O keeps its hydrogen as an oxonium in the contributors.
 */
export const PHENOL: ResonanceSpecies = {
  id: 'phenol',
  name: 'Phenol (the OH group donates, +R)',
  forms: ['OC1=CC=CC=C1', '[OH+]=C1C=CC=C[CH-]1', '[OH+]=C1C=C[CH-]C=C1'],
  pushes: [
    [
      { from: { lonePair: 0 }, to: { bond: [0, 1] } },
      { from: { bond: [1, 2], t: 0.5 }, to: { atom: 2 } },
    ],
    [
      { from: { lonePair: 0 }, to: { bond: [0, 1] } },
      { from: { bond: [1, 2], t: 0.5 }, to: { bond: [2, 3] } },
      { from: { bond: [3, 4], t: 0.5 }, to: { atom: 4 } },
    ],
  ],
  partialBonds: [[0, 1]],
  ringBonds: [
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 5],
    [5, 6],
    [6, 1],
  ],
  hybridCharges: [
    { atom: 2, label: 'δ−' },
    { atom: 4, label: 'δ−' },
    { atom: 6, label: 'δ−' },
  ],
  innerCircles: true,
}

/** One σ-complex to draw: the attack carbon, the ring carbon that carries the +, and whether the oxonium contributor is used. */
export interface SigmaItem {
  label: string
  attack: number
  charge: number
  oxonium: boolean
  /** A short note drawn under the drawing. */
  note: string
  graph: MolGraph
  formula: string
}

const PHENOL_SMILES = DIRECTING_SMILES['-OH']

/** The phenol ring's ipso carbon and the carbons of each position (lib positions). */
function phenolSites() {
  const g = parseSmiles(PHENOL_SMILES)
  const ortho = atomsAt(g, 'ortho')
  const meta = atomsAt(g, 'meta')
  const para = atomsAt(g, 'para')
  const ipso = atomsAt(g, 'ipso')[0]
  return { g, ipso, ortho, meta, para }
}

/**
 * The σ-complex for an NO₂⁺ attack at `attack`, with the + on a ring carbon next to the attack that is not
 * the ipso carbon (a basic contributor). For the ring carbons the lib gives the positions directly.
 */
function basicSigma(attack: number, label: string, note = '+ on the ring'): SigmaItem {
  const { g, ipso } = phenolSites()
  const ring = atomsAt(g, 'ortho').concat(atomsAt(g, 'meta'), atomsAt(g, 'para'), [ipso])
  const next = [...g.bonds].flatMap((b) => [
    [b.a, b.b],
    [b.b, b.a],
  ])
  const neighbours = next.filter(([a]) => a === attack).map(([, b]) => b).filter((b) => ring.includes(b) && b !== ipso)
  const charge = neighbours[0]
  const graph = areniumIon(g, attack, charge)
  return { label, attack, charge, oxonium: false, note, graph, formula: molecularFormula(graph) }
}

/** The σ-complex with the + on the ipso carbon and the oxonium contributor: only for an attack ortho or para to the OH. */
function oxoniumSigma(attack: number, label: string): SigmaItem {
  const { g, ipso } = phenolSites()
  const graph = areniumIon(g, attack, ipso, true)
  return { label, attack, charge: ipso, oxonium: true, note: 'C=O⁺H form', graph, formula: molecularFormula(graph) }
}

/** The three attack positions of phenol: ortho, meta and para (one ring carbon of each). */
export function phenolAttacks() {
  const { ortho, meta, para } = phenolSites()
  return { ortho: ortho[0], meta: meta[0], para: para[0] }
}

/** Basic σ-complexes for an attack at the ortho, meta and para carbons of phenol. */
export function sigmaRow(): SigmaItem[] {
  const a = phenolAttacks()
  return [basicSigma(a.ortho, 'ortho attack'), basicSigma(a.meta, 'meta attack'), basicSigma(a.para, 'para attack')]
}

/** The extra contributor: the + on the C–OH carbon, for the ortho and para attacks. The meta attack has none. */
export function extraRow(): SigmaItem[] {
  const a = phenolAttacks()
  return [oxoniumSigma(a.ortho, 'ortho attack'), basicSigma(a.meta, 'meta attack', 'no C=O⁺H'), oxoniumSigma(a.para, 'para attack')]
}

/** The forms of the nitrobenzene species (Unit 9 reuses the lib's species for the −NO₂ step). */
export function nitroSpecies(): ResonanceSpecies {
  return resonanceSpecies('nitrobenzene')
}

/** A group label with its subscript digits, for the table: −NHCOCH₃, −C₂H₅ and so on. */
export function groupLabel(group: string): string {
  return group.replace('-', '−').replace(/\d+/g, (d) => subscriptDigits(Number(d)))
}

/** The NCERT groups in the three columns of the table. */
export function groupColumns(): { activating: DirectingGroup[]; halogens: DirectingGroup[]; meta: DirectingGroup[] } {
  const halogens = NCERT_ORIENTING_GROUPS.filter((g) => ['-F', '-Cl', '-Br', '-I'].includes(g.group))
  const activating = NCERT_ORIENTING_GROUPS.filter((g) => g.effect === 'activating')
  const meta = NCERT_ORIENTING_GROUPS.filter((g) => g.directs === 'meta')
  return { activating, halogens, meta }
}

/** The substrate for a group as a graph (re-exported so the drawings and tests use one path). */
export { substrateOf }
