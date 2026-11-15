/**
 * Functional-group naming for Section 8.5.3 (chains) and 8.5.4 (substituted benzenes).
 *
 * This module builds molecules from a few choices (a chain with groups on chosen carbons, or a
 * ring with substituents on chosen positions) and explains which group is principal, using
 * NCERT's order of priority (NCERT_FUNCTIONAL_PRIORITY). It never writes a name itself: every
 * name comes from iupacName in iupac-organic.ts, and a shape the lib does not name is reported
 * with the lib's own reason.
 */

import { iupacName } from './iupac-organic'
import { neighbours, parseSmiles } from './molecule-parse'
import type { MolGraph } from './molecule-graph'
import { NCERT_FUNCTIONAL_PRIORITY } from './ncert-unit8-tables'

/** A group the chain builder can attach to a carbon. */
export type ChainGroupId = 'OH' | 'NH2' | 'Cl' | 'NO2' | 'OCH3' | 'oxo' | 'CHO' | 'COOH'

/** A substituent the ring builder can attach to a position. */
export type RingGroupId = 'Cl' | 'Br' | 'CH3' | 'OH' | 'NH2' | 'NO2' | 'OCH3'

/** A bond order between two chain carbons. */
export type LinkOrder = 1 | 2 | 3

/** A class of principal group, each mapped to its line in NCERT's priority list. */
export type PrincipalKind = 'acid' | 'aldehyde' | 'ketone' | 'alcohol' | 'amine' | 'alkene' | 'alkyne'

interface GroupSpec {
  /** Display label, with the dash as typeset in NCERT. */
  label: string
  /** SMILES written in a branch on the attached atom. */
  smiles: string
  /**
   * For a group that is part of the chain's own carbon (-CHO, -COOH): the token that carbon is
   * written as, and the reversed token used when the carbon is the first atom of the SMILES.
   */
  own?: { token: string; first: string }
  /** Bonds from the carbon to the group's own atoms (not counting the chain bonds). */
  bond: 1 | 2 | 3
  /** The principal class of the group, or null when it is only ever a prefix. */
  kind: PrincipalKind | null
  /** The prefix name used when the group is not principal. */
  prefix: string
  /** Where the group may sit on the chain: any carbon, an interior carbon, or a chain end. */
  placement: 'any' | 'interior' | 'end'
}

/**
 * Chain groups. A -CHO or -COOH carbon is the chain's own end carbon (it is counted in the chain
 * length, not added to it), so these groups sit at a chain end.
 */
export const CHAIN_GROUPS: Record<ChainGroupId, GroupSpec> = {
  OH: { label: '–OH', smiles: 'O', bond: 1, kind: 'alcohol', prefix: 'hydroxy', placement: 'any' },
  NH2: { label: '–NH₂', smiles: 'N', bond: 1, kind: 'amine', prefix: 'amino', placement: 'any' },
  Cl: { label: '–Cl', smiles: 'Cl', bond: 1, kind: null, prefix: 'chloro', placement: 'any' },
  NO2: { label: '–NO₂', smiles: '[N+](=O)[O-]', bond: 1, kind: null, prefix: 'nitro', placement: 'any' },
  OCH3: { label: '–OCH₃', smiles: 'OC', bond: 1, kind: null, prefix: 'methoxy', placement: 'any' },
  oxo: { label: '>C=O', smiles: '=O', bond: 2, kind: 'ketone', prefix: 'oxo', placement: 'interior' },
  CHO: { label: '–CHO', smiles: 'C=O', own: { token: 'C=O', first: 'O=C' }, bond: 2, kind: 'aldehyde', prefix: 'formyl', placement: 'end' },
  COOH: { label: '–COOH', smiles: 'C(=O)O', own: { token: 'C(=O)O', first: 'OC(=O)' }, bond: 3, kind: 'acid', prefix: 'carboxy', placement: 'end' },
}

/** Ring substituents. Each is a single group on one ring carbon. */
export const RING_GROUPS: Record<RingGroupId, { label: string; smiles: string }> = {
  Cl: { label: '–Cl', smiles: 'Cl' },
  Br: { label: '–Br', smiles: 'Br' },
  CH3: { label: '–CH₃', smiles: 'C' },
  OH: { label: '–OH', smiles: 'O' },
  NH2: { label: '–NH₂', smiles: 'N' },
  NO2: { label: '–NO₂', smiles: '[N+](=O)[O-]' },
  OCH3: { label: '–OCH₃', smiles: 'OC' },
}

/** NCERT's text for each principal class, as it appears in the priority list. */
const PRIORITY_TEXT: Record<PrincipalKind, string> = {
  acid: '-COOH',
  aldehyde: '-CHO',
  ketone: '>C=O',
  alcohol: '-OH',
  amine: '-NH2',
  alkene: '>C=C<',
  alkyne: '-C≡C-',
}

/** The suffix each principal class gives to the parent name. */
export const SUFFIX: Record<PrincipalKind, string> = {
  acid: 'oic acid',
  aldehyde: 'al',
  ketone: 'one',
  alcohol: 'ol',
  amine: 'amine',
  alkene: 'ene',
  alkyne: 'yne',
}

/**
 * Typesets a line from the lib's ASCII text: group labels get the en dash and subscript digits
 * (–COOH, –NH₂, –SO₃H). Affix hyphens such as -en- and -oic acid are left as they are.
 */
export function typeset(text: string): string {
  return text
    .replace(/-(?=[A-Z])/g, '–')
    .replace(/NH2/g, 'NH₂')
    .replace(/SO3H/g, 'SO₃H')
}

/** The name of a principal class as a student reads it, e.g. "–COOH". */
export function priorityLabel(kind: PrincipalKind): string {
  return PRIORITY_TEXT[kind]
}

/** A principal class's place in NCERT's list (0 is highest). */
export function priorityRank(kind: PrincipalKind): number {
  const i = NCERT_FUNCTIONAL_PRIORITY.indexOf(PRIORITY_TEXT[kind])
  if (i < 0) throw new Error(`${PRIORITY_TEXT[kind]} is not in NCERT's priority list`)
  return i
}

/** A chain of carbons with at most one group per carbon, and a bond order for each link. */
export interface ChainState {
  groups: (ChainGroupId | null)[]
  /** links[k] joins carbon k and carbon k + 1. */
  links: LinkOrder[]
}

/** A chain of `length` carbons with single bonds and no groups. */
export function emptyChain(length: number): ChainState {
  return { groups: new Array<ChainGroupId | null>(length).fill(null), links: new Array<LinkOrder>(Math.max(0, length - 1)).fill(1) }
}

/** Bonds that carbon k uses: its links, plus the bond to its group. */
function carbonUse(state: ChainState, k: number): number {
  const n = state.groups.length
  let used = 0
  if (k > 0) used += state.links[k - 1]
  if (k < n - 1) used += state.links[k]
  const g = state.groups[k]
  if (g) used += CHAIN_GROUPS[g].bond
  return used
}

function placementOk(n: number, k: number, id: ChainGroupId): boolean {
  const p = CHAIN_GROUPS[id].placement
  if (p === 'interior') return k > 0 && k < n - 1
  if (p === 'end') return k === 0 || k === n - 1
  return true
}

/** True when carbon k can carry group `id` with the bonds it already has (or none, when id is null). */
export function groupAllowed(state: ChainState, k: number, id: ChainGroupId | null): boolean {
  if (id === null) return true
  const n = state.groups.length
  if (!placementOk(n, k, id)) return false
  const before = state.groups[k]
  const used = carbonUse(state, k) - (before ? CHAIN_GROUPS[before].bond : 0)
  return used + CHAIN_GROUPS[id].bond <= 4
}

/** True when link i can be set to `order` with both of its carbons still at most tetravalent. */
export function linkAllowed(state: ChainState, i: number, order: LinkOrder): boolean {
  const next: ChainState = { groups: state.groups, links: state.links.map((x, j) => (j === i ? order : x)) }
  return carbonUse(next, i) <= 4 && carbonUse(next, i + 1) <= 4
}

/** Sets carbon k to group `id` (or clears it). Returns the same state when the change is not allowed. */
export function withGroup(state: ChainState, k: number, id: ChainGroupId | null): ChainState {
  if (!groupAllowed(state, k, id)) return state
  const groups = state.groups.slice()
  groups[k] = id
  return { groups, links: state.links }
}

/** Sets link i to `order`. Returns the same state when the change is not allowed. */
export function withLink(state: ChainState, i: number, order: LinkOrder): ChainState {
  if (!linkAllowed(state, i, order)) return state
  const links = state.links.slice()
  links[i] = order
  return { groups: state.groups, links }
}

/**
 * Changes the number of carbons. Carbons that are kept keep their groups when the groups are
 * still allowed there; the rest are cleared, and any link that no longer fits drops to a single bond.
 */
export function withLength(state: ChainState, length: number): ChainState {
  let next = emptyChain(length)
  for (let k = 0; k < Math.min(length, state.groups.length); k++) {
    if (state.groups[k]) next = withGroup(next, k, state.groups[k])
  }
  for (let i = 0; i < Math.min(length - 1, state.links.length); i++) {
    if (state.links[i] !== 1) next = withLink(next, i, state.links[i])
  }
  return next
}

const BOND_SYMBOL: Record<LinkOrder, string> = { 1: '', 2: '=', 3: '#' }

/** SMILES of the chain: each carbon with its group in a branch, and the bond symbol between carbons. */
export function chainSmiles(state: ChainState): string {
  const n = state.groups.length
  let out = ''
  for (let k = 0; k < n; k++) {
    const g = state.groups[k]
    const spec = g ? CHAIN_GROUPS[g] : null
    if (spec?.own) {
      out += k === 0 ? spec.own.first : spec.own.token
    } else {
      out += 'C' + (spec ? `(${spec.smiles})` : '')
    }
    if (k < n - 1) out += BOND_SYMBOL[state.links[k]]
  }
  return out
}

/**
 * SMILES of a benzene ring in Kekulé form. `subs[i]` is the substituent on ring position i + 1
 * (positions run round the ring in order, so 1 and 2 are neighbours).
 */
export function ringSmiles(subs: readonly (RingGroupId | null)[]): string {
  if (subs.length !== 6) throw new RangeError('A benzene ring has six positions')
  const br = (i: number) => {
    const id = subs[i]
    return id ? `(${RING_GROUPS[id].smiles})` : ''
  }
  // Double bonds 1=2, 3=4, 5=6; ring closure from position 6 back to position 1.
  return `C1${br(0)}=C${br(1)}C${br(2)}=C${br(3)}C${br(4)}=C1${br(5)}`
}

/** The result of asking the lib for a name: the name, or the lib's reason for not naming the shape. */
export type NameOutcome = { ok: true; name: string } | { ok: false; reason: string }

/** The IUPAC name of a SMILES string, from iupacName. A shape the lib does not name gives its reason. */
export function nameOf(smiles: string): NameOutcome {
  try {
    return { ok: true, name: iupacName(parseSmiles(smiles)) }
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : String(err) }
  }
}

/** Every principal class present in the chain, from its groups and its multiple bonds. */
function presentKinds(state: ChainState): PrincipalKind[] {
  const kinds: PrincipalKind[] = []
  for (const g of state.groups) {
    const kind = g ? CHAIN_GROUPS[g].kind : null
    if (kind) kinds.push(kind)
  }
  for (const order of state.links) {
    if (order === 2) kinds.push('alkene')
    if (order === 3) kinds.push('alkyne')
  }
  return kinds
}

/** The principal class of a chain: the highest in NCERT's order among those present, or null. */
export function chainPrincipal(state: ChainState): PrincipalKind | null {
  const kinds = presentKinds(state)
  if (kinds.length === 0) return null
  return kinds.reduce((best, k) => (priorityRank(k) < priorityRank(best) ? k : best))
}

/**
 * The reasoning for the name, one sentence per line, from the groups on the chain. The name itself
 * is not here: it comes from nameOf.
 */
export function chainExplanation(state: ChainState): string[] {
  const principal = chainPrincipal(state)
  const lines: string[] = []
  if (!principal) {
    const multiple = state.links.some((x) => x > 1)
    lines.push(multiple ? 'No functional group: the multiple bond gives the name its ending.' : 'No functional group and no multiple bond: the name comes from the chain length alone.')
    return lines
  }
  if (principal === 'alkene' || principal === 'alkyne') {
    lines.push(`The multiple bond is the only group that ranks, so it gives the suffix -${SUFFIX[principal]}.`)
  } else {
    lines.push(`${PRIORITY_TEXT[principal]} ranks highest in NCERT's order of the groups present, so it is the principal group and the name ends in -${SUFFIX[principal]}.`)
  }
  const prefixes = new Set<string>()
  for (const g of state.groups) {
    if (!g) continue
    const spec = CHAIN_GROUPS[g]
    if (spec.kind !== principal) prefixes.add(spec.prefix)
  }
  if (prefixes.size > 0) lines.push(`The other groups are named as prefixes: ${[...prefixes].map((p) => `${p}-`).join(', ')}.`)
  if (state.groups.some((g) => g && CHAIN_GROUPS[g].kind === null)) {
    lines.push('Halogen, nitro and methoxy groups are always prefixes, whatever else is present.')
  }
  if (principal !== 'alkene' && state.links.some((x) => x === 2)) lines.push('The C=C stays in the chain and is written as -en-.')
  if (principal !== 'alkyne' && state.links.some((x) => x === 3)) lines.push('The C≡C stays in the chain and is written as -yn-.')
  lines.push('Numbering starts from the end that gives the principal group the lower locant.')
  return lines
}

/** The retained names of benzene derivatives that the lib uses as the parent, in NCERT's order. */
export function ringParentHint(subs: readonly (RingGroupId | null)[]): string {
  const has = (id: RingGroupId) => subs.includes(id)
  if (has('OH')) return 'The –OH outranks the other ring groups, so the parent is phenol and the carbon carrying the –OH is C1.'
  if (has('NH2')) return 'With no –OH present, –NH₂ gives the parent aniline, and the carbon carrying the –NH₂ is C1.'
  if (has('OCH3')) return 'With no –OH or –NH₂, the –OCH₃ gives the retained name anisole for the ring.'
  return 'The ring is the parent, benzene. The locants are as low as possible, and when they tie the substituent first in the alphabet gets the lower number.'
}

/** Atoms of a ring built by ringSmiles, in ring-position order (index 0 is position 1). */
export function ringAtomIndices(subs: readonly (RingGroupId | null)[]): number[] {
  const out: number[] = []
  let index = 0
  for (const id of subs) {
    out.push(index)
    index += 1
    if (id) index += parseSmiles(RING_GROUPS[id].smiles).atoms.length
  }
  return out
}

/** The atoms and bonds of one match for a principal class in a molecule. */
export interface GroupMatch {
  atoms: number[]
  bonds: number[]
}

function bondIndex(g: MolGraph, a: number, b: number): number {
  return g.bonds.findIndex((x) => (x.a === a && x.b === b) || (x.a === b && x.b === a))
}

/**
 * Every match of a principal class in the graph: the atoms of the group and the bonds that join
 * them. The matches are found by their bonding pattern, not by their position in a SMILES string.
 */
export function findGroups(g: MolGraph, kind: PrincipalKind): GroupMatch[] {
  const el = (i: number) => g.atoms[i].element
  const out: GroupMatch[] = []
  const nbs = (i: number) => neighbours(g, i)
  const isCarbonylC = (i: number) => el(i) === 'C' && nbs(i).some((x) => x.order === 2 && el(x.atom) === 'O')
  g.atoms.forEach((_, i) => {
    if (kind === 'acid' && el(i) === 'C') {
      const dO = nbs(i).find((x) => x.order === 2 && el(x.atom) === 'O')
      const sO = nbs(i).find((x) => x.order === 1 && el(x.atom) === 'O')
      if (dO && sO) out.push({ atoms: [i, dO.atom, sO.atom], bonds: [bondIndex(g, i, dO.atom), bondIndex(g, i, sO.atom)] })
    } else if (kind === 'ketone' && el(i) === 'C') {
      const dO = nbs(i).find((x) => x.order === 2 && el(x.atom) === 'O')
      const carbons = nbs(i).filter((x) => el(x.atom) === 'C' && x.order === 1).length
      if (dO && carbons === 2) out.push({ atoms: [i, dO.atom], bonds: [bondIndex(g, i, dO.atom)] })
    } else if (kind === 'aldehyde' && el(i) === 'C') {
      const dO = nbs(i).find((x) => x.order === 2 && el(x.atom) === 'O')
      const carbons = nbs(i).filter((x) => el(x.atom) === 'C' && x.order === 1).length
      if (dO && carbons === 1 && (g.atoms[i].hCount ?? 0) === 1) out.push({ atoms: [i, dO.atom], bonds: [bondIndex(g, i, dO.atom)] })
    } else if (kind === 'alcohol' && el(i) === 'O') {
      const c = nbs(i).find((x) => x.order === 1 && el(x.atom) === 'C')
      if (c && (g.atoms[i].hCount ?? 0) === 1 && !isCarbonylC(c.atom)) out.push({ atoms: [i, c.atom], bonds: [bondIndex(g, i, c.atom)] })
    } else if (kind === 'amine' && el(i) === 'N' && !(g.atoms[i].charge ?? 0)) {
      const c = nbs(i).find((x) => x.order === 1 && el(x.atom) === 'C')
      if (c) out.push({ atoms: [i, c.atom], bonds: [bondIndex(g, i, c.atom)] })
    }
  })
  if (kind === 'alkene' || kind === 'alkyne') {
    const want = kind === 'alkene' ? 2 : 3
    g.bonds.forEach((b, j) => {
      if (b.order === want && el(b.a) === 'C' && el(b.b) === 'C' && !isCarbonylC(b.a) && !isCarbonylC(b.b)) {
        out.push({ atoms: [b.a, b.b], bonds: [j] })
      }
    })
  }
  return out
}

/**
 * The longest path of carbons in an acyclic molecule, from one end to the other. Heteroatoms are
 * left out, so a -COOH or -OH on the chain does not extend it. Returns [] for a ring.
 */
export function carbonChain(g: MolGraph): number[] {
  const carbons = g.atoms.map((a, i) => (a.element === 'C' ? i : -1)).filter((i) => i >= 0)
  if (carbons.length === 0) return []
  const farthest = (start: number) => {
    const parent = new Map<number, number>([[start, -1]])
    const queue = [start]
    let last = start
    for (let h = 0; h < queue.length; h++) {
      const v = queue[h]
      last = v
      for (const nb of neighbours(g, v)) {
        if (g.atoms[nb.atom].element !== 'C' || parent.has(nb.atom)) continue
        parent.set(nb.atom, v)
        queue.push(nb.atom)
      }
    }
    const path: number[] = []
    for (let v = last; v !== -1; v = parent.get(v) ?? -1) path.unshift(v)
    return path
  }
  const first = farthest(carbons[0])
  return farthest(first[0])
}

/**
 * Locants for a chain path: the end nearer the principal atom is numbered 1, or the other end if
 * that gives the principal atom the lower locant. Returns the path in locant order.
 */
export function numberChain(path: readonly number[], principal: number | null): number[] {
  if (principal === null) return path.slice()
  const i = path.indexOf(principal)
  if (i < 0) return path.slice()
  return i <= path.length - 1 - i ? path.slice() : path.slice().reverse()
}

/** The molecules of the quiz, each a chain or a ring that the lib names. */
export const QUIZ_SMILES: readonly string[] = [
  'C=CCC(=O)CC(=O)O',
  'OCC=CC(=O)C',
  'O=CCCCO',
  'OCCCCl',
  'CC1=CC=C(Cl)C=C1',
  'OC1=CC=C(Cl)C=C1',
]

/** One question of the quiz: the structure, the lib's name, and four names in a fixed order. */
export interface QuizItem {
  smiles: string
  name: string
  options: string[]
  answer: number
}

/**
 * The quiz question at `index` (it wraps round the list). The three wrong options are the lib's
 * names of other quiz molecules, so each is a real name and a distinct molecule's name.
 */
export function quizItem(index: number): QuizItem {
  const n = QUIZ_SMILES.length
  const at = ((index % n) + n) % n
  const names = QUIZ_SMILES.map((s) => {
    const outcome = nameOf(s)
    if (!outcome.ok) throw new Error(`Quiz molecule ${s} is not named: ${outcome.reason}`)
    return outcome.name
  })
  const correct = names[at]
  const wrong = [1, 2, 3].map((d) => names[(at + d) % n])
  const answer = at % 4
  const options = wrong.slice()
  options.splice(answer, 0, correct)
  return { smiles: QUIZ_SMILES[at], name: correct, options, answer }
}
