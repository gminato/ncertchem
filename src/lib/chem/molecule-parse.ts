/**
 * Parsing and basic descriptors for organic molecules (NCERT Class 11 Unit 8), built on the shared
 * MolGraph types in molecule-graph.ts.
 *
 * Supported SMILES subset:
 * - organic-subset atoms B C N O P S F Cl Br I, written without brackets (hydrogens filled in);
 * - bracket atoms [Element H-count charge], e.g. [NH4+], [O-], [CH3+], [CH3] (a radical);
 *   the element may be any of the organic-subset elements, H or Cu;
 * - branches ( ), ring closures 1 to 9 (a bond symbol before a ring digit sets its order), and the
 *   bond symbols - = #.
 *
 * Hydrogens: an organic-subset atom gets the number of hydrogens that completes its standard
 * valence. A bracket atom takes exactly the H count written. A radical is a bracket atom whose
 * valence is not filled: radical = valence - (bond orders + hydrogens), where the valence is
 * the neutral valence adjusted by the charge (carbon: 4 minus |charge|; N, O, P, S: neutral
 * valence plus charge).
 *
 * Anything else (aromatic lower case, stereo marks, dots, unbalanced brackets) throws a RangeError.
 */

import type { MolAtom, MolBond, MolGraph } from './molecule-graph'

/** Neutral standard valence of each supported element. */
const NEUTRAL_VALENCE: Record<string, number> = {
  H: 1,
  B: 3,
  C: 4,
  N: 3,
  O: 2,
  F: 1,
  Cl: 1,
  Br: 1,
  I: 1,
  P: 3,
  S: 2,
  Cu: 1,
}

const ORGANIC_SUBSET = ['Cl', 'Br', 'B', 'C', 'N', 'O', 'P', 'S', 'F', 'I']

/** Valence of an atom with a given charge, used for radical detection. */
function valenceFor(element: string, charge: number): number {
  const neutral = NEUTRAL_VALENCE[element]
  if (element === 'C') {
    return 4 - Math.abs(charge)
  }
  return neutral + charge
}

/** A neighbour of an atom and the order of the bond to it. */
export interface Neighbour {
  atom: number
  order: 1 | 2 | 3
}

/** The neighbours of atom `i`, in bond order of the graph. */
export function neighbours(g: MolGraph, i: number): Neighbour[] {
  const out: Neighbour[] = []
  for (const bond of g.bonds) {
    if (bond.a === i) {
      out.push({ atom: bond.b, order: bond.order })
    } else if (bond.b === i) {
      out.push({ atom: bond.a, order: bond.order })
    }
  }
  return out
}

/** Sum of bond orders at atom `i` (its valence used by bonds, excluding hydrogens). */
export function bondOrderSum(g: MolGraph, i: number): number {
  return neighbours(g, i).reduce((total, n) => total + n.order, 0)
}

/** Order of the bond between atoms `a` and `b`, or 0 if they are not bonded. */
export function bondOrderBetween(g: MolGraph, a: number, b: number): number {
  const bond = g.bonds.find((x) => (x.a === a && x.b === b) || (x.a === b && x.b === a))
  return bond ? bond.order : 0
}

/** Parses a bracket atom body such as "NH4+", "CH3", "O-" or "Cu". */
function parseBracket(body: string, position: number): { element: string; h: number; charge: number } {
  const match = /^([A-Z][a-z]?)(H(\d*))?([+-]+|[+-]\d+)?$/.exec(body)
  if (!match) {
    throw new RangeError(`Unsupported bracket atom "[${body}]" at position ${position}`)
  }
  const element = match[1]
  if (NEUTRAL_VALENCE[element] === undefined) {
    throw new RangeError(`Unsupported element "${element}" in bracket atom at position ${position}`)
  }
  const h = match[2] === undefined ? 0 : match[3] === '' || match[3] === undefined ? 1 : Number(match[3])
  let charge = 0
  const chargeText = match[4]
  if (chargeText) {
    if (/^[+-]\d+$/.test(chargeText)) {
      const magnitude = Number(chargeText.slice(1))
      charge = chargeText[0] === '+' ? magnitude : -magnitude
    } else {
      const sign = chargeText[0] === '+' ? 1 : -1
      charge = sign * chargeText.length
    }
  }
  return { element, h, charge }
}

/**
 * Parses a SMILES string in the supported subset into a MolGraph (see the file header).
 *
 * @example parseSmiles('CC(=O)O') // acetic acid, C2H4O2
 * @throws {RangeError} On unsupported or malformed input, or an over-valent atom
 */
export function parseSmiles(smiles: string): MolGraph {
  if (typeof smiles !== 'string' || smiles.length === 0) {
    throw new RangeError('SMILES must be a non-empty string')
  }

  const atoms: MolAtom[] = []
  const bonds: MolBond[] = []
  const bracketFlag: boolean[] = []
  const bracketAtoms: { index: number; body: string; position: number }[] = []
  const branchStack: (number | null)[] = []
  const rings = new Map<string, { atom: number; order: 1 | 2 | 3 | null }>()
  let prev: number | null = null
  let pending: 1 | 2 | 3 | null = null
  let i = 0

  const addAtom = (element: string, h: number | null, charge: number, bracket: boolean): number => {
    const index = atoms.length
    atoms.push({ element, hCount: h ?? 0, ...(charge !== 0 ? { charge } : {}) })
    bracketFlag.push(bracket)
    if (prev !== null) {
      bonds.push({ a: prev, b: index, order: pending ?? 1 })
    }
    pending = null
    prev = index
    return index
  }

  while (i < smiles.length) {
    const ch = smiles[i]

    if (ch === '(') {
      branchStack.push(prev)
      i++
      continue
    }
    if (ch === ')') {
      if (branchStack.length === 0) {
        throw new RangeError(`Unbalanced ")" in SMILES at position ${i}`)
      }
      prev = branchStack.pop() ?? null
      i++
      continue
    }
    if (ch === '-' || ch === '=' || ch === '#') {
      if (prev === null) {
        throw new RangeError(`Bond symbol "${ch}" with no atom before it at position ${i}`)
      }
      pending = ch === '-' ? 1 : ch === '=' ? 2 : 3
      i++
      continue
    }
    if (/^[1-9]$/.test(ch)) {
      if (prev === null) {
        throw new RangeError(`Ring closure ${ch} with no atom before it at position ${i}`)
      }
      const open = rings.get(ch)
      if (open) {
        const order = pending ?? open.order ?? 1
        bonds.push({ a: open.atom, b: prev, order })
        rings.delete(ch)
      } else {
        rings.set(ch, { atom: prev, order: pending })
      }
      pending = null
      i++
      continue
    }
    if (ch === '[') {
      const end = smiles.indexOf(']', i)
      if (end < 0) {
        throw new RangeError(`Unclosed "[" in SMILES at position ${i}`)
      }
      const body = smiles.slice(i + 1, end)
      const { element, h, charge } = parseBracket(body, i)
      const index = addAtom(element, h, charge, true)
      bracketAtoms.push({ index, body, position: i })
      i = end + 1
      continue
    }

    const symbol = ORGANIC_SUBSET.find((s) => smiles.startsWith(s, i))
    if (symbol) {
      addAtom(symbol, null, 0, false)
      i += symbol.length
      continue
    }

    throw new RangeError(`Unsupported SMILES character "${ch}" at position ${i}`)
  }

  if (branchStack.length > 0) {
    throw new RangeError('Unclosed "(" in SMILES')
  }
  if (rings.size > 0) {
    throw new RangeError('Unclosed ring closure in SMILES')
  }
  if (pending !== null) {
    throw new RangeError('SMILES ends with a bond symbol')
  }
  if (atoms.length === 0) {
    throw new RangeError('SMILES has no atoms')
  }

  // Radicals of bracket atoms need every bond, so they are worked out once the graph is complete.
  const graph: MolGraph = { atoms, bonds }
  for (const { index, body, position } of bracketAtoms) {
    const atom = atoms[index]
    const valence = valenceFor(atom.element, atom.charge ?? 0)
    const unsat = valence - (bondOrderSum(graph, index) + (atom.hCount ?? 0))
    if (unsat < 0) {
      throw new RangeError(`Atom [${body}] at position ${position} has too many bonds`)
    }
    if (unsat > 0) {
      atom.radical = unsat
    }
  }

  // Fill implicit hydrogens on organic-subset atoms.
  for (let k = 0; k < atoms.length; k++) {
    if (bracketFlag[k]) {
      continue
    }
    const element = atoms[k].element
    const free = NEUTRAL_VALENCE[element] - bondOrderSum(graph, k)
    if (free < 0) {
      throw new RangeError(`Atom ${element} at index ${k} has too many bonds`)
    }
    atoms[k].hCount = free
  }

  return graph
}

/**
 * Molecular formula in Hill order: C first, H second, then the other elements alphabetically (or
 * all alphabetically when there is no carbon). A net charge is appended as '+' or '-' (e.g. 'H4N+').
 *
 * @example molecularFormula(parseSmiles('CCO')) // 'C2H6O'
 */
export function molecularFormula(g: MolGraph): string {
  const counts: Record<string, number> = {}
  let charge = 0
  for (const atom of g.atoms) {
    counts[atom.element] = (counts[atom.element] ?? 0) + 1
    counts.H = (counts.H ?? 0) + (atom.hCount ?? 0)
    charge += atom.charge ?? 0
  }
  const elements = Object.keys(counts)
  const order = elements.includes('C')
    ? ['C', 'H', ...elements.filter((e) => e !== 'C' && e !== 'H').sort()]
    : elements.sort()
  let text = ''
  for (const el of order) {
    const n = counts[el]
    if (n > 0) {
      text += el + (n > 1 ? String(n) : '')
    }
  }
  if (charge !== 0) {
    const magnitude = Math.abs(charge)
    text += (magnitude > 1 ? String(magnitude) : '') + (charge > 0 ? '+' : '-')
  }
  return text
}

/**
 * Degree of unsaturation (rings plus pi bonds) of a neutral molecule:
 * DoU = C + 1 + (N + P + B)/2 - (H + halogens)/2.
 */
export function degreeOfUnsaturation(g: MolGraph): number {
  let c = 0
  let hPlus = 0
  let trivalent = 0
  for (const atom of g.atoms) {
    hPlus += atom.hCount ?? 0
    if (atom.element === 'C') {
      c++
    } else if (atom.element === 'N' || atom.element === 'P' || atom.element === 'B') {
      trivalent++
    } else if (['F', 'Cl', 'Br', 'I'].includes(atom.element)) {
      hPlus++
    }
  }
  return c + 1 + trivalent / 2 - hPlus / 2
}

/**
 * Hybridisation of carbon atom `i` (NCERT 8.2.1): sp when it has two pi bonds, sp2 when it has
 * one, and sp3 otherwise. A planar carbocation or radical centre (three bonded groups, charge +1
 * or one unpaired electron) is sp2.
 *
 * @throws {RangeError} If atom `i` is not carbon
 */
export function hybridisation(g: MolGraph, i: number): 'sp3' | 'sp2' | 'sp' {
  const atom = g.atoms[i]
  if (!atom || atom.element !== 'C') {
    throw new RangeError('hybridisation is defined here for carbon atoms only')
  }
  const near = neighbours(g, i)
  const pi = near.reduce((total, n) => total + (n.order - 1), 0)
  if (pi >= 2) {
    return 'sp'
  }
  if (pi === 1) {
    return 'sp2'
  }
  const groups = near.length + (atom.hCount ?? 0)
  if (groups === 3 && ((atom.charge ?? 0) > 0 || (atom.radical ?? 0) > 0)) {
    return 'sp2'
  }
  return 'sp3'
}

/**
 * Degree of a carbon atom: the number of carbon atoms bonded to it (1°, 2°, 3° or 4°).
 *
 * @throws {RangeError} If atom `i` is not carbon or has no carbon neighbour
 */
export function carbonDegree(g: MolGraph, i: number): '1°' | '2°' | '3°' | '4°' {
  const atom = g.atoms[i]
  if (!atom || atom.element !== 'C') {
    throw new RangeError('carbonDegree needs a carbon atom')
  }
  const carbons = neighbours(g, i).filter((n) => g.atoms[n.atom].element === 'C').length
  if (carbons === 0) {
    throw new RangeError('carbonDegree: the carbon has no carbon neighbour')
  }
  return `${carbons}°` as '1°' | '2°' | '3°' | '4°'
}

/** Atom label used in condensed formulas: element and hydrogens, e.g. 'CH3', 'OH', 'Cl'. */
function condensedLabel(atom: MolAtom): string {
  const h = atom.hCount ?? 0
  const hText = h === 0 ? '' : h === 1 ? 'H' : `H${h}`
  const chargeText = atom.charge ? (atom.charge > 0 ? '+' : '-') : ''
  return `${atom.element}${hText}${chargeText}`
}

/** Bond symbol written before an atom in a condensed formula. */
function condensedBond(order: number): string {
  return order === 2 ? '=' : order === 3 ? '≡' : ''
}

/**
 * Condensed formula of an acyclic molecule, e.g. 'CH3CH2CH(CH3)CH3'. The chain starts at the
 * lowest-numbered atom at the end of a longest path, branches are bracketed and the longest
 * continuation is written last. A run of three or more CH2 units becomes (CH2)n, as in
 * 'CH3(CH2)4CH3'.
 *
 * @throws {RangeError} If the molecule has a ring or more than one part
 */
export function toCondensed(g: MolGraph): string {
  const n = g.atoms.length
  if (g.bonds.length !== n - 1) {
    throw new RangeError('toCondensed needs a connected acyclic molecule')
  }
  const dist = (from: number): number[] => {
    const d = new Array<number>(n).fill(-1)
    d[from] = 0
    const queue = [from]
    while (queue.length > 0) {
      const x = queue.shift() as number
      for (const nb of neighbours(g, x)) {
        if (d[nb.atom] < 0) {
          d[nb.atom] = d[x] + 1
          queue.push(nb.atom)
        }
      }
    }
    if (d.some((v) => v < 0)) {
      throw new RangeError('toCondensed needs a connected molecule')
    }
    return d
  }

  const ecc = Array.from({ length: n }, (_, k) => Math.max(...dist(k)))
  const diameter = Math.max(...ecc)
  const root = ecc.findIndex((e) => e === diameter)

  const depthBelow = (node: number, parent: number): number => {
    const kids = neighbours(g, node).filter((nb) => nb.atom !== parent)
    if (kids.length === 0) {
      return 0
    }
    return 1 + Math.max(...kids.map((k) => depthBelow(k.atom, node)))
  }

  const emit = (node: number, parent: number, order: number): string => {
    const kids = neighbours(g, node)
      .filter((nb) => nb.atom !== parent)
      .map((nb) => ({ ...nb, depth: depthBelow(nb.atom, node) }))
      .sort((x, y) => x.depth - y.depth || x.atom - y.atom)
    let text = condensedBond(order) + condensedLabel(g.atoms[node])
    kids.forEach((kid, idx) => {
      const part = emit(kid.atom, node, kid.order)
      text += idx < kids.length - 1 ? `(${part})` : part
    })
    return text
  }

  const text = emit(root, -1, 1)
  return text.replace(/(?:CH2){3,}/g, (run) => `(CH2)${run.length / 3}`)
}

/**
 * A canonical string for a molecule, so that two drawings of one molecule compare equal.
 * Exact for acyclic molecules (the smallest rooted string over all roots). For molecules with
 * rings it uses Weisfeiler-Lehman refinement, which separates the molecules used in this unit.
 */
export function canonicalKey(g: MolGraph): string {
  const n = g.atoms.length
  const label = (i: number): string => {
    const a = g.atoms[i]
    return `${a.element}${a.hCount ?? 0}${a.charge ?? 0}r${a.radical ?? 0}`
  }
  const isTree = g.bonds.length === n - 1
  if (isTree) {
    const rooted = (node: number, parent: number): string => {
      const kids = neighbours(g, node)
        .filter((nb) => nb.atom !== parent)
        .map((nb) => `[${nb.order}${rooted(nb.atom, node)}]`)
        .sort()
      return `${label(node)}${kids.join('')}`
    }
    let best: string | null = null
    for (let root = 0; root < n; root++) {
      const s = rooted(root, -1)
      if (best === null || s < best) {
        best = s
      }
    }
    return best ?? ''
  }

  let colours = Array.from({ length: n }, (_, i) => label(i))
  for (let round = 0; round < n; round++) {
    colours = colours.map((c, i) => {
      const around = neighbours(g, i)
        .map((nb) => `${nb.order}:${colours[nb.atom]}`)
        .sort()
        .join('|')
      return hash(`${c}#${around}`)
    })
  }
  return `ring:${[...colours].sort().join(',')}`
}

/** FNV-1a hash of a string as hex, deterministic across graphs. */
function hash(text: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0).toString(16)
}
