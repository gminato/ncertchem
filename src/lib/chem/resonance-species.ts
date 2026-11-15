/**
 * Resonance species for the Section 8.7.4 to 8.7.10 lab and Scrolly (Unit 8). Each species gives
 * its forms as SMILES (parsed by parseSmiles), the curved arrows that turn the first form into each
 * further form, the bonds that carry the hybrid's 1½ character and the atoms that carry the hybrid's
 * δ charges. The forms are ranked by NCERT Section 8.7.6 (see rankForms).
 *
 * Atom indices are those of the SMILES in `forms[0]`; each later form has its own indexing.
 */

import type { MolGraph } from './molecule-graph'
import { parseSmiles } from './molecule-parse'
import { contributorRank } from './electronic-effects'

/** Where an arrow starts or ends: an atom, the midpoint of a bond (by its two atoms), or a lone pair. */
export type ArrowEnd = { atom: number } | { bond: [number, number]; t?: number } | { lonePair: number }

/** One curved arrow: from an electron pair (or bond) to where the pair goes. */
export interface PushArrow {
  from: ArrowEnd
  to: ArrowEnd
  kind?: 'pair' | 'radical'
}

export interface HybridCharge {
  atom: number
  label: 'δ+' | 'δ−'
}

export interface ResonanceSpecies {
  id: string
  /** Descriptive name for the species, used in prose and labels. */
  name: string
  /** forms[0] is the form drawn first; the others are the further contributors. */
  forms: readonly string[]
  /** pushes[k] turns forms[0] into forms[k + 1]. Benzene has no arrows: its Kekulé forms differ only by where the double bonds sit. */
  pushes: readonly (readonly PushArrow[])[]
  /** Bonds between these atom pairs (in forms[0]) are drawn with a dashed line in the hybrid (1½). */
  partialBonds: readonly (readonly [number, number])[]
  /** Ring bonds of the hybrid: drawn as one even bond (order 1) with the inscribed circle, not dashed. */
  ringBonds?: readonly (readonly [number, number])[]
  hybridCharges: readonly HybridCharge[]
  /** Draw an inscribed circle in each ring of the hybrid. */
  innerCircles?: boolean
}

const lp = (atom: number): ArrowEnd => ({ lonePair: atom })
const onAtom = (atom: number): ArrowEnd => ({ atom })
const onBond = (a: number, b: number, t = 0.5): ArrowEnd => ({ bond: [a, b], t })
const onBondAt = (a: number, b: number): ArrowEnd => ({ bond: [a, b] })

/** The species of the Unit 8 resonance lab. Every form is an electron-consistent Lewis structure. */
export const RESONANCE_SPECIES: readonly ResonanceSpecies[] = [
  {
    id: 'carboxylate',
    name: 'Acetate ion (a carboxylate)',
    forms: ['CC(=O)[O-]', 'CC([O-])=O'],
    pushes: [[{ from: lp(3), to: onBondAt(1, 3) }, { from: onBond(1, 2), to: onAtom(2) }]],
    partialBonds: [
      [1, 2],
      [1, 3],
    ],
    hybridCharges: [
      { atom: 2, label: 'δ−' },
      { atom: 3, label: 'δ−' },
    ],
  },
  {
    id: 'nitromethane',
    name: 'Nitromethane',
    forms: ['C[N+](=O)[O-]', 'C[N+]([O-])=O'],
    pushes: [[{ from: lp(3), to: onBondAt(1, 3) }, { from: onBond(1, 2), to: onAtom(2) }]],
    partialBonds: [
      [1, 2],
      [1, 3],
    ],
    hybridCharges: [
      { atom: 2, label: 'δ−' },
      { atom: 3, label: 'δ−' },
    ],
  },
  {
    id: 'allyl',
    name: 'Allyl cation',
    forms: ['C=C[CH2+]', '[CH2+]C=C'],
    pushes: [[{ from: onBond(0, 1), to: onAtom(2) }]],
    partialBonds: [
      [0, 1],
      [1, 2],
    ],
    hybridCharges: [
      { atom: 0, label: 'δ+' },
      { atom: 2, label: 'δ+' },
    ],
  },
  {
    id: 'phenoxide',
    name: 'Phenoxide ion',
    forms: ['[O-]C1=CC=CC=C1', 'O=C1C=CC=C[CH-]1', 'O=C1C=C[CH-]C=C1'],
    pushes: [
      [{ from: lp(0), to: onBondAt(0, 1) }, { from: onBond(1, 2), to: onAtom(2) }],
      [
        { from: lp(0), to: onBondAt(0, 1) },
        { from: onBond(1, 2), to: onBondAt(2, 3) },
        { from: onBond(3, 4), to: onAtom(4) },
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
      { atom: 0, label: 'δ−' },
      { atom: 2, label: 'δ−' },
      { atom: 4, label: 'δ−' },
      { atom: 6, label: 'δ−' },
    ],
    innerCircles: true,
  },
  {
    id: 'nitrobenzene',
    name: 'Nitrobenzene',
    forms: ['O=[N+]([O-])C1=CC=CC=C1', '[O-][N+]([O-])=C1C=CC=C[CH+]1', '[O-][N+]([O-])=C1C=C[CH+]C=C1'],
    pushes: [
      [{ from: onBond(0, 1), to: onAtom(0) }, { from: onBond(3, 4), to: onBondAt(1, 3) }],
      [
        { from: onBond(0, 1), to: onAtom(0) },
        { from: onBond(3, 4), to: onBondAt(1, 3) },
        { from: onBond(5, 6), to: onBondAt(4, 5) },
      ],
    ],
    partialBonds: [
      [0, 1],
      [1, 2],
      [1, 3],
    ],
    ringBonds: [
      [3, 4],
      [4, 5],
      [5, 6],
      [6, 7],
      [7, 8],
      [8, 3],
    ],
    hybridCharges: [
      { atom: 0, label: 'δ−' },
      { atom: 2, label: 'δ−' },
      { atom: 4, label: 'δ+' },
      { atom: 6, label: 'δ+' },
      { atom: 8, label: 'δ+' },
    ],
    innerCircles: true,
  },
  {
    id: 'benzene',
    name: 'Benzene',
    forms: ['C1=CC=CC=C1', 'C1C=CC=CC=1'],
    pushes: [[]],
    partialBonds: [],
    ringBonds: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 0],
    ],
    hybridCharges: [],
    innerCircles: true,
  },
  {
    id: 'nitrite',
    name: 'Nitrite ion',
    forms: ['[O-]N=O', 'O=N[O-]'],
    pushes: [[{ from: lp(0), to: onBondAt(0, 1) }, { from: onBond(1, 2), to: onAtom(2) }]],
    partialBonds: [
      [0, 1],
      [1, 2],
    ],
    hybridCharges: [
      { atom: 0, label: 'δ−' },
      { atom: 2, label: 'δ−' },
    ],
  },
  {
    id: 'aniline',
    name: 'Aniline (the NH₂ group donates, +R)',
    forms: ['NC1=CC=CC=C1', '[NH2+]=C1C=CC=C[CH-]1', '[NH2+]=C1C=C[CH-]C=C1'],
    pushes: [
      [{ from: lp(0), to: onBondAt(0, 1) }, { from: onBond(1, 2), to: onAtom(2) }],
      [
        { from: lp(0), to: onBondAt(0, 1) },
        { from: onBond(1, 2), to: onBondAt(2, 3) },
        { from: onBond(3, 4), to: onAtom(4) },
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
  },
]

/** The species with this id. @throws {RangeError} If there is none. */
export function resonanceSpecies(id: string): ResonanceSpecies {
  const found = RESONANCE_SPECIES.find((s) => s.id === id)
  if (!found) throw new RangeError(`No resonance species ${id}`)
  return found
}

/** The forms of a species as MolGraphs, in the order of `forms`. */
export function speciesForms(s: ResonanceSpecies): MolGraph[] {
  return s.forms.map((smiles) => parseSmiles(smiles))
}

/** The bond index in `g` joining atoms a and b, or -1. */
export function bondIndex(g: MolGraph, a: number, b: number): number {
  return g.bonds.findIndex((x) => (x.a === a && x.b === b) || (x.a === b && x.b === a))
}

/**
 * The hybrid of a species: form 0 with its partial and ring bonds drawn as order 1 and no formal
 * charges. Returns the bond indices to draw dashed (1½), which are the partialBonds only.
 *
 * @throws {RangeError} If a partial bond is not a bond of form 0
 */
export function hybridOf(s: ResonanceSpecies): { graph: MolGraph; partialBonds: number[]; charges: HybridCharge[] } {
  const base = parseSmiles(s.forms[0])
  const indexOf = (pairs: readonly (readonly [number, number])[]) =>
    pairs.map(([a, b]) => {
      const k = bondIndex(base, a, b)
      if (k < 0) throw new RangeError(`${s.id}: atoms ${a} and ${b} are not bonded in form 0`)
      return k
    })
  const partial = indexOf(s.partialBonds)
  const even = [...partial, ...indexOf(s.ringBonds ?? [])]
  const graph: MolGraph = {
    atoms: base.atoms.map((a) => ({ element: a.element, hCount: a.hCount ?? 0 })),
    bonds: base.bonds.map((bd, k) => (even.includes(k) ? { ...bd, order: 1 as const } : { ...bd })),
  }
  return { graph, partialBonds: partial, charges: [...s.hybridCharges] }
}

/** Score of one form, as the NCERT rules of Section 8.7.6 read it. Lower sorts first. */
export interface FormScore {
  /** Index of the form in the list given to rankForms. */
  form: number
  /** Covalent bonds counted as shared pairs (a double bond counts 2). More is better. */
  covalentBonds: number
  /** Product of the positive and negative charges (0 for a form with one sign only). Less is better. */
  chargeSeparation: number
  /** Negative charges on carbon, which is less electronegative than O. Fewer is better. */
  carbanionCharges: number
}

/** The four rule scores of each form, in the order given. */
export function formScores(forms: readonly MolGraph[]): FormScore[] {
  return forms.map((g, form) => {
    let plus = 0
    let minus = 0
    let carbanion = 0
    for (const a of g.atoms) {
      const c = a.charge ?? 0
      if (c > 0) plus += c
      if (c < 0) {
        minus -= c
        if (a.element === 'C') carbanion += -c
      }
    }
    return {
      form,
      covalentBonds: g.bonds.reduce((t, b) => t + b.order, 0),
      chargeSeparation: plus * minus,
      carbanionCharges: carbanion,
    }
  })
}

/**
 * Forms ranked from most to least important (NCERT 8.7.6), with forms that tie grouped in tiers.
 * The order is the one contributorRank gives (more covalent bonds, less charge separation, a
 * negative charge on the more electronegative atom), plus the carbanion rule that contributorRank
 * leaves out when a form has no positive charge: a negative charge on carbon ranks below one on O.
 */
export function rankForms(forms: readonly MolGraph[]): { order: number[]; tiers: number[][]; scores: FormScore[] } {
  const scores = formScores(forms)
  const key = (s: FormScore) => [-s.covalentBonds, s.chargeSeparation, s.carbanionCharges]
  const sorted = [...scores].sort((x, y) => {
    const kx = key(x)
    const ky = key(y)
    for (let i = 0; i < kx.length; i++) {
      if (kx[i] !== ky[i]) return kx[i] - ky[i]
    }
    return x.form - y.form
  })
  const tiers: number[][] = []
  let prev: number[] | null = null
  for (const s of sorted) {
    const k = key(s)
    if (prev && k.every((v, i) => v === prev?.[i])) {
      tiers[tiers.length - 1].push(s.form)
    } else {
      tiers.push([s.form])
    }
    prev = k
  }
  return { order: sorted.map((s) => s.form), tiers, scores }
}

/**
 * The lib's own contributorRank order for the same forms, for checking. It agrees with rankForms
 * whenever no carbanion is involved.
 */
export function contributorOrder(forms: readonly MolGraph[]): number[] {
  return contributorRank([...forms])
}

/** Net charge of a form. Every form of one species has the same net charge. */
export function netCharge(g: MolGraph): number {
  return g.atoms.reduce((t, a) => t + (a.charge ?? 0), 0)
}
