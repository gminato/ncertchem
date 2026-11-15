/**
 * Helpers for the formula translator (Section 8.3): the presets it offers, the atom groups it
 * toggles, and the checks of a learner's formula answer. Names, formulas and counts come from the
 * parser and naming modules; this file adds no chemistry of its own.
 */
import type { MolGraph } from './molecule-graph'
import { molecularFormula, neighbours, parseSmiles } from './molecule-parse'

export interface TranslatorPreset {
  id: string
  smiles: string
  /** An open chain can be written in condensed form; a ring is drawn in bond-line form only. */
  kind: 'open' | 'ring'
}

/** The molecules the translator offers, as SMILES. Names are read from iupac-organic at run time. */
export const TRANSLATOR_PRESETS: readonly TranslatorPreset[] = [
  { id: 'methylpentanol', smiles: 'CC(O)CC(C)C', kind: 'open' },
  { id: 'dimethylpentane', smiles: 'CC(C)CC(C)C', kind: 'open' },
  { id: 'dimethylhexanol', smiles: 'CC(C)CC(C)C(C)O', kind: 'open' },
  { id: 'ketone', smiles: 'CC(=O)C', kind: 'open' },
  { id: 'branched-acid', smiles: 'CC(C)CC(=O)O', kind: 'open' },
  { id: 'tertiary-alcohol', smiles: 'CC(C)(C)O', kind: 'open' },
  { id: 'propene', smiles: 'C=CC', kind: 'open' },
  { id: 'halomethane', smiles: 'FC(Cl)Br', kind: 'open' },
  { id: 'ether', smiles: 'CCOCC', kind: 'open' },
  { id: 'cyclohexane', smiles: 'C1CCCCC1', kind: 'ring' },
  { id: 'methylbenzene', smiles: 'CC1=CC=CC=C1', kind: 'ring' },
  { id: 'chlorobenzene', smiles: 'ClC1=CC=CC=C1', kind: 'ring' },
]

/** True when the molecule has a ring. A connected acyclic molecule has one bond fewer than atoms. */
export function hasRing(g: MolGraph): boolean {
  return g.bonds.length !== g.atoms.length - 1
}

/**
 * The atoms of each chain atom's group: the chain atom itself and every atom hanging off it,
 * reached without passing through another chain atom. `chain` lists the chain atoms in order
 * (the output of the condensed-formula layout). Every heavy atom of an open molecule is in exactly
 * one group.
 */
export function groupMembership(g: MolGraph, chain: readonly number[]): number[][] {
  const onChain = new Set(chain)
  return chain.map((start) => {
    const members = [start]
    const seen = new Set<number>([start])
    const queue = [start]
    while (queue.length > 0) {
      const a = queue.shift()!
      for (const n of neighbours(g, a)) {
        if (seen.has(n.atom) || onChain.has(n.atom)) continue
        seen.add(n.atom)
        members.push(n.atom)
        queue.push(n.atom)
      }
    }
    return members.sort((x, y) => x - y)
  })
}

/** Carbon and hydrogen counts of a molecule, counted from the graph (hydrogens from hCount). */
export function carbonHydrogenCounts(g: MolGraph): { carbons: number; hydrogens: number } {
  let carbons = 0
  let hydrogens = 0
  for (const atom of g.atoms) {
    if (atom.element === 'C') carbons++
    hydrogens += atom.hCount ?? 0
  }
  return { carbons, hydrogens }
}

/** Replaces subscript digits (C₆H₁₄O) by ordinary ones and removes spaces, so a typed answer compares cleanly. */
export function normaliseFormulaText(text: string): string {
  const digits: Record<string, string> = { '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4', '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9' }
  return text.replace(/[₀-₉]/g, (c) => digits[c]).replace(/\s+/g, '')
}

/** True when the typed molecular formula is the one the parser gives for the molecule (Hill order). */
export function formulaAnswerMatches(g: MolGraph, answer: string): boolean {
  return normaliseFormulaText(answer) === molecularFormula(g)
}

/** Parses a SMILES string from the user, or returns the reason it is not accepted. */
export function parseTranslatorInput(smiles: string): { ok: true; graph: MolGraph } | { ok: false; message: string } {
  const text = smiles.trim()
  if (text.length === 0) return { ok: false, message: 'Type a SMILES string, or pick a preset.' }
  try {
    return { ok: true, graph: parseSmiles(text) }
  } catch {
    return { ok: false, message: `"${text}" is not in the SMILES subset this tool reads. Try CC(O)CC(C)C.` }
  }
}

