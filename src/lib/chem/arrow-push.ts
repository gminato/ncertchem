/**
 * Curved-arrow bookkeeping for the Unit 8 arrow-pusher (Section 8.7, electron movement). A step is
 * one elementary change: a heterolytic cleavage (a full-headed arrow from a bond to the more
 * electronegative atom), a homolytic cleavage (two half-headed arrows, one to each atom) or an
 * attack of a nucleophile's lone pair on an electron-poor carbon (a full-headed arrow).
 *
 * Several species of one step are kept as one MolGraph (the union of its parts), so that the
 * arrows refer to a single atom and bond numbering. The bookkeeping (which fragment takes the
 * pair, the charges and radicals afterwards) is done by `cleavage` in electronic-effects.ts and by
 * `applyAttack` here.
 */

import { cleavage, classifyReagent, PAULING_ELECTRONEGATIVITY } from './electronic-effects'
import type { MolGraph } from './molecule-graph'
import { molecularFormula, parseSmiles, toCondensed } from './molecule-parse'
import { speciesLabel } from './species-labels'

/** A full head moves an electron pair; a half head (fish hook) moves one electron. */
export type ArrowHead = 'pair' | 'radical'

/** Where the electrons start: a bond (by bond index) or an atom's lone pair or unpaired electron. */
export type ArrowSource = { kind: 'bond'; bond: number } | { kind: 'atom'; atom: number }

/** One arrow: its start, the atom where the electrons end, and the head. */
export interface ArrowSpec {
  source: ArrowSource
  target: number
  head: ArrowHead
}

/** What an elementary step does to the molecule. */
export type PushKind = 'heterolysis' | 'homolysis' | 'attack'

/** One species of a step, drawn at an offset (pixels, the same frame for every part). */
export interface PushPart {
  smiles: string
  offset: { x: number; y: number }
}

/** A step as authored: the species, and which bond breaks or which atoms meet. */
export type PushStepSpec =
  | {
      id: string
      kind: 'heterolysis' | 'homolysis'
      title: string
      parts: PushPart[]
      /** The two element symbols of the bond that breaks, e.g. ['C', 'Br']. Must match one bond. */
      bond: [string, string]
    }
  | {
      id: string
      kind: 'attack'
      title: string
      parts: PushPart[]
      /** Part index and element of the nucleophile's donating atom (its lone pair). */
      nucleophile: { part: number; element: string }
      /** Part index and element of the electron-poor carbon (the one with the + charge) that receives the pair. */
      electrophile: { part: number; element: string }
    }

/** A step with its union graph, its partition by part, and the arrows that are correct. */
export interface PushStep {
  id: string
  kind: PushKind
  title: string
  graph: MolGraph
  /** Index of the first atom of each part in `graph.atoms`. */
  partStart: number[]
  parts: PushPart[]
  required: ArrowSpec[]
  /** The bond that breaks (homolysis and heterolysis), or -1 for an attack. */
  bond: number
  /** The donating atom of an attack, or -1. */
  donor: number
  /** The electron-poor atom of an attack, or -1. */
  acceptor: number
}

/**
 * The union of several parts as one MolGraph. Atoms and bonds keep the order of the parts, so
 * the atom index of part p, atom k is `partStart[p] + k`.
 */
export function unionGraph(graphs: MolGraph[]): { graph: MolGraph; partStart: number[] } {
  const atoms: MolGraph['atoms'] = []
  const bonds: MolGraph['bonds'] = []
  const partStart: number[] = []
  for (const g of graphs) {
    const offset = atoms.length
    partStart.push(offset)
    atoms.push(...g.atoms.map((a) => ({ ...a })))
    bonds.push(...g.bonds.map((b) => ({ ...b, a: b.a + offset, b: b.b + offset })))
  }
  return { graph: { atoms, bonds }, partStart }
}

/** Electronegativity of an element from the Pauling table of the unit (throws if missing). */
export function electronegativityOf(element: string): number {
  const value = PAULING_ELECTRONEGATIVITY[element]
  if (value === undefined) {
    throw new RangeError(`No electronegativity for ${element}`)
  }
  return value
}

/**
 * The atom that takes the pair in a heterolytic cleavage: the more electronegative atom of the
 * bond. With equal electronegativity the second atom takes it, as in `cleavage`.
 */
export function heterolysisTaker(g: MolGraph, bond: number): number {
  const b = g.bonds[bond]
  if (!b) {
    throw new RangeError(`No bond with index ${bond}`)
  }
  const ea = electronegativityOf(g.atoms[b.a].element)
  const eb = electronegativityOf(g.atoms[b.b].element)
  return ea > eb ? b.a : b.b
}

/** Index of the bond whose two elements are `pair` (in either order). */
export function findBond(g: MolGraph, pair: [string, string]): number {
  const found = g.bonds.findIndex((b) => {
    const x = g.atoms[b.a].element
    const y = g.atoms[b.b].element
    return (x === pair[0] && y === pair[1]) || (x === pair[1] && y === pair[0])
  })
  if (found < 0) {
    throw new RangeError(`No bond between ${pair[0]} and ${pair[1]}`)
  }
  return found
}

/** Index of the first atom of `element` in part `part`. */
function findAtomInPart(
  graph: MolGraph,
  partStart: number[],
  parts: PushPart[],
  part: number,
  element: string,
  charged: boolean,
): number {
  const start = partStart[part]
  const end = part + 1 < partStart.length ? partStart[part + 1] : graph.atoms.length
  for (let i = start; i < end; i++) {
    const a = graph.atoms[i]
    if (a.element === element && (!charged || (a.charge ?? 0) > 0)) {
      return i
    }
  }
  throw new RangeError(`No ${element} in part ${part} (${parts[part]?.smiles})`)
}

/**
 * Builds a PushStep from its authored form: parses each part, joins them, and works out the bond
 * or atoms and the correct arrows from the electronegativities (heterolysis) or the kind.
 */
export function buildStep(spec: PushStepSpec): PushStep {
  const graphs = spec.parts.map((p) => parseSmiles(p.smiles))
  const { graph, partStart } = unionGraph(graphs)
  if (spec.kind === 'attack') {
    const donor = findAtomInPart(graph, partStart, spec.parts, spec.nucleophile.part, spec.nucleophile.element, false)
    // The electron-poor carbon is the one carrying the positive charge.
    const acceptor = findAtomInPart(graph, partStart, spec.parts, spec.electrophile.part, spec.electrophile.element, true)
    return {
      id: spec.id,
      kind: 'attack',
      title: spec.title,
      graph,
      partStart,
      parts: spec.parts,
      required: [{ source: { kind: 'atom', atom: donor }, target: acceptor, head: 'pair' }],
      bond: -1,
      donor,
      acceptor,
    }
  }
  const bond = findBond(graph, spec.bond)
  const b = graph.bonds[bond]
  if (spec.kind === 'heterolysis') {
    return {
      id: spec.id,
      kind: 'heterolysis',
      title: spec.title,
      graph,
      partStart,
      parts: spec.parts,
      required: [{ source: { kind: 'bond', bond }, target: heterolysisTaker(graph, bond), head: 'pair' }],
      bond,
      donor: -1,
      acceptor: -1,
    }
  }
  return {
    id: spec.id,
    kind: 'homolysis',
    title: spec.title,
    graph,
    partStart,
    parts: spec.parts,
    required: [
      { source: { kind: 'bond', bond }, target: b.a, head: 'radical' },
      { source: { kind: 'bond', bond }, target: b.b, head: 'radical' },
    ],
    bond,
    donor: -1,
    acceptor: -1,
  }
}

/** Two arrow starts are the same bond or the same atom. */
function sameSourceOf(x: ArrowSource, y: ArrowSource): boolean {
  if (x.kind === 'bond' && y.kind === 'bond') return x.bond === y.bond
  if (x.kind === 'atom' && y.kind === 'atom') return x.atom === y.atom
  return false
}

/** Two arrows are the same arrow when their start, end and head agree. */
export function sameArrow(x: ArrowSpec, y: ArrowSpec): boolean {
  return x.target === y.target && x.head === y.head && sameSourceOf(x.source, y.source)
}

/** Label of an atom for the learner: its element, with its charge or unpaired electron. */
export function atomLabel(g: MolGraph, i: number): string {
  const a = g.atoms[i]
  const charge = a.charge ?? 0
  const radical = a.radical ?? 0
  const mark = charge > 0 ? '⁺' : charge < 0 ? '⁻' : radical > 0 ? '•' : ''
  return `${a.element}${mark}`
}

/** Label of a bond for the learner, e.g. "C–Br". */
export function bondLabel(g: MolGraph, bond: number): string {
  const b = g.bonds[bond]
  return `${atomLabel(g, b.a)}–${atomLabel(g, b.b)}`
}

/** Outcome of a judged arrow: accepted (and which required arrow it matches) or a reason. */
export type ArrowVerdict = { ok: true; matched: number } | { ok: false; reason: string }

/**
 * Judges one arrow the learner has drawn against the step's required arrows, not counting the
 * ones already placed. The reason is written for the learner and uses the lib's numbers
 * (electronegativities) where they explain the answer.
 */
export function judgeArrow(step: PushStep, attempt: ArrowSpec, placed: ArrowSpec[]): ArrowVerdict {
  const g = step.graph
  if (placed.some((p) => sameArrow(p, attempt))) {
    return { ok: false, reason: 'That arrow is already drawn.' }
  }
  const exact = step.required.findIndex((r) => sameArrow(r, attempt))
  if (exact >= 0 && !placed.some((p) => sameArrow(p, step.required[exact]))) {
    return { ok: true, matched: exact }
  }
  if (exact >= 0) {
    return { ok: false, reason: 'That arrow is already drawn.' }
  }

  const sourceMatches = (r: ArrowSpec) => sameSourceOf(r.source, attempt.source)

  const sameSource = step.required.filter(sourceMatches)
  if (sameSource.length === 0) {
    if (attempt.source.kind === 'bond') {
      const where = attempt.source.bond
      return {
        ok: false,
        reason:
          step.kind === 'attack'
            ? `In this step the pair comes from a lone pair on the nucleophile, not from the ${bondLabel(g, where)} bond.`
            : `The electrons do not leave the ${bondLabel(g, where)} bond in this step. Look for the bond named in the prompt.`,
      }
    }
    return {
      ok: false,
      reason:
        step.kind === 'attack'
          ? 'The pair is a lone pair on the nucleophile, so the arrow starts on that atom.'
          : 'The electrons of this step start on the bond that breaks, not on an atom.',
    }
  }

  if (step.kind === 'heterolysis') {
    const r = sameSource[0]
    const taker = r.target
    const other = g.bonds[step.bond].a === taker ? g.bonds[step.bond].b : g.bonds[step.bond].a
    if (attempt.target === other) {
      const eTaker = electronegativityOf(g.atoms[taker].element)
      const eOther = electronegativityOf(g.atoms[other].element)
      return {
        ok: false,
        reason: `The pair goes to the more electronegative atom. ${atomLabel(g, other)} (χ ${eOther}) is less electronegative than ${atomLabel(g, taker)} (χ ${eTaker}), so ${atomLabel(g, taker)} takes the pair and ${atomLabel(g, other)} keeps a positive charge.`,
      }
    }
    if (attempt.head !== r.head) {
      return { ok: false, reason: 'A cleavage that gives ions moves a whole pair of electrons, so use a full head.' }
    }
    return { ok: false, reason: 'The arrow must end on one of the two atoms of the bond that breaks.' }
  }

  if (step.kind === 'homolysis') {
    if (attempt.head !== 'radical') {
      return {
        ok: false,
        reason: 'Homolysis gives each atom one electron, so each arrow is a half head (a fish hook).',
      }
    }
    const b = g.bonds[step.bond]
    if (attempt.target !== b.a && attempt.target !== b.b) {
      return { ok: false, reason: 'Each arrow must end on one of the two atoms of the bond that breaks.' }
    }
    return { ok: false, reason: `${atomLabel(g, attempt.target)} already has its electron from this bond.` }
  }

  // attack
  const r = sameSource[0]
  if (attempt.target !== r.target) {
    return {
      ok: false,
      reason: `The pair must go to the electron-poor carbon, which has an empty p orbital and a +1 charge: ${atomLabel(g, r.target)}.`,
    }
  }
  if (attempt.head !== 'pair') {
    return { ok: false, reason: 'A lone pair moves as a full head: it is two electrons.' }
  }
  return { ok: false, reason: 'That arrow is not the one needed here.' }
}

/** Result of drawing every required arrow: the fragments or product, as the lib works it out. */
export interface StepOutcome {
  /** One line per species afterwards, e.g. "CH₃CH⁺CH₃ (C₃H₇⁺)". */
  lines: string[]
  /** Set for an attack: the product as one graph. */
  product?: MolGraph
}

/**
 * Adds a bond from the donor's lone pair to the acceptor. The donor gains one unit of positive
 * charge (it loses a negative one) and the acceptor loses its positive charge, as the pair fills
 * its empty orbital. Charges, not hydrogens, are updated: hCount stays as written.
 *
 * @throws {RangeError} If the atoms are already bonded or the acceptor is not electron-poor
 */
export function applyAttack(g: MolGraph, donor: number, acceptor: number): MolGraph {
  if (g.bonds.some((b) => (b.a === donor && b.b === acceptor) || (b.a === acceptor && b.b === donor))) {
    throw new RangeError('The two atoms are already bonded')
  }
  if (!((g.atoms[acceptor].charge ?? 0) > 0)) {
    throw new RangeError('The acceptor must carry a positive charge')
  }
  const atoms = g.atoms.map((a) => ({ ...a }))
  atoms[donor].charge = (atoms[donor].charge ?? 0) + 1
  atoms[acceptor].charge = (atoms[acceptor].charge ?? 0) - 1
  return { atoms, bonds: [...g.bonds.map((b) => ({ ...b })), { a: donor, b: acceptor, order: 1 }] }
}

/** Digits as subscripts and the ion signs as superscripts, for a formula or a condensed string. */
export function subscriptText(text: string): string {
  return text
    .replace(/\d+/g, (d) => d.split('').map((c) => '₀₁₂₃₄₅₆₇₈₉'[Number(c)]).join(''))
    .replace(/\+/g, '⁺')
    .replace(/-/g, '⁻')
}

/** A species for a learner: its labelled name if the unit has one, else its condensed formula. */
export function displaySpecies(g: MolGraph): string {
  const known = speciesLabel(g)
  if (known) return known
  if (g.atoms.length === 1) return atomLabel(g, 0)
  const radical = g.atoms.some((a) => (a.radical ?? 0) > 0)
  return `${subscriptText(toCondensed(g))}${radical ? '•' : ''}`
}

/** A species for the outcome: a labelled ion or radical by its name, otherwise its name and formula. */
function speciesLine(g: MolGraph): string {
  if (g.atoms.length === 1 || speciesLabel(g)) {
    return displaySpecies(g)
  }
  return `${displaySpecies(g)} (${subscriptText(molecularFormula(g))})`
}

/**
 * What the step produces once all its arrows are drawn, from the lib: the two fragments of a
 * cleavage (with the pair on the taker), or the product of an attack.
 */
export function stepOutcome(step: PushStep): StepOutcome {
  if (step.kind === 'attack') {
    const product = applyAttack(step.graph, step.donor, step.acceptor)
    const nu = classifyReagent(subgraph(step, 0))
    const el = classifyReagent(subgraph(step, 1))
    return {
      lines: [
        `Donor: ${nu}. Acceptor: ${el}.`,
        `Product: ${speciesLine(product)}`,
      ],
      product,
    }
  }
  const mode = step.kind === 'heterolysis' ? 'heterolytic' : 'homolytic'
  const [left, right] = cleavage(step.graph, step.bond, mode)
  return { lines: [`${speciesLine(left)}`, `${speciesLine(right)}`] }
}

/** The graph of one part of a step, without the others. */
export function subgraph(step: PushStep, part: number): MolGraph {
  const start = step.partStart[part]
  const end = part + 1 < step.partStart.length ? step.partStart[part + 1] : step.graph.atoms.length
  const atoms = step.graph.atoms.slice(start, end).map((a) => ({ ...a }))
  const bonds = step.graph.bonds
    .filter((b) => b.a >= start && b.a < end && b.b >= start && b.b < end)
    .map((b) => ({ ...b, a: b.a - start, b: b.b - start }))
  return { atoms, bonds }
}

/** Which part an atom belongs to. */
export function partOf(step: PushStep, atom: number): number {
  let part = 0
  step.partStart.forEach((s, p) => {
    if (atom >= s) part = p
  })
  return part
}
