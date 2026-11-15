/**
 * Condensed structural formulas (Unit 8): CH3CH(OH)CH2CH2CH3 style text. The longest chain is
 * written along one line. Heteroatom groups and larger branches go in brackets inline; a
 * single-carbon branch (a methyl) is drawn above or below its carbon, as in NCERT.
 */
import type { MolGraph } from '@/lib/chem/molecule-graph'
import { adjacency, longestChain } from './layout'

const SUBSCRIPT: Record<string, string> = {
  '0': '₀',
  '1': '₁',
  '2': '₂',
  '3': '₃',
  '4': '₄',
  '5': '₅',
  '6': '₆',
  '7': '₇',
  '8': '₈',
  '9': '₉',
}

export function subscriptDigits(n: number): string {
  return String(n)
    .split('')
    .map((c) => SUBSCRIPT[c] ?? c)
    .join('')
}

export interface CondensedAtom {
  /** Text written on the chain at this atom, e.g. "CH(OH)". */
  text: string
  /** A single-carbon branch drawn above the atom, e.g. "CH₃". */
  above: string[]
  /** A single-carbon branch drawn below the atom. */
  below: string[]
  /** Index of the atom in the graph. */
  atom: number
}

/** Text for one atom: element, hydrogens (subscripted) and charge. */
export function condensedLabel(g: MolGraph, a: number): string {
  const atom = g.atoms[a]
  const h = atom.hCount ?? 0
  let s = atom.element
  if (h > 0) s += h === 1 ? 'H' : `H${subscriptDigits(h)}`
  if (atom.charge) {
    const m = Math.abs(atom.charge)
    s += (m === 1 ? '' : String(m)) + (atom.charge > 0 ? '⁺' : '⁻')
  }
  return s
}

/** Text for a branch hanging off `parent`, including its own sub-branches. */
function branchText(g: MolGraph, adj: number[][], a: number, parent: number, bondOrder: number): string {
  const prefix = bondOrder === 2 ? '=' : bondOrder === 3 ? '≡' : ''
  let text = prefix + condensedLabel(g, a)
  const children = adj[a].filter((q) => q !== parent)
  for (const q of children) {
    const order = bondOrderBetween(g, a, q)
    const inner = branchText(g, adj, q, a, order)
    text += children.length === 1 ? inner : `(${inner})`
  }
  return text
}

function bondOrderBetween(g: MolGraph, a: number, b: number): number {
  const bond = g.bonds.find((x) => (x.a === a && x.b === b) || (x.a === b && x.b === a))
  return bond ? bond.order : 1
}

/** The condensed formula of a molecule, one entry per atom of the longest chain. */
export function condensedAtoms(g: MolGraph): CondensedAtom[] {
  const adj = adjacency(g)
  const chain = longestChain(g)
  const onChain = new Set(chain)
  let flip = 0
  return chain.map((a) => {
    let text = condensedLabel(g, a)
    const above: string[] = []
    const below: string[] = []
    for (const q of adj[a]) {
      if (onChain.has(q)) continue
      const isMethyl =
        g.atoms[q].element === 'C' && adj[q].length === 1 && (g.atoms[q].hCount ?? 0) === 3
      if (isMethyl) {
        if (flip++ % 2 === 0) above.push(condensedLabel(g, q))
        else below.push(condensedLabel(g, q))
        continue
      }
      const order = bondOrderBetween(g, a, q)
      const inner = branchText(g, adj, q, a, order)
      text += `(${inner})`
    }
    return { text, above, below, atom: a }
  })
}

/** Rough width of a condensed string in font-size units, for centring the line. */
export function condensedWidth(s: string): number {
  let w = 0
  for (const ch of s) {
    if (ch === '(' || ch === ')') w += 0.33
    else if (ch === '⁺' || ch === '⁻' || ch === '=' || ch === '≡') w += 0.6
    else if ('₀₁₂₃₄₅₆₇₈₉'.includes(ch)) w += 0.6
    else if (ch === 'l' || ch === 'i' || ch === '·' || ch === ' ') w += 0.28
    else if (ch === 'C' || ch === 'N' || ch === 'D') w += 0.72
    else if (ch === 'H') w += 0.74
    else if (ch === 'O') w += 0.78
    else if (ch === 'm' || ch === 'w' || ch === 'M' || ch === 'W') w += 0.9
    else w += 0.62
  }
  return w
}
