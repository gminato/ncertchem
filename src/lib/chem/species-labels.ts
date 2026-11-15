/**
 * Learner-facing names of the carbocations, radicals and carbanions the Unit 8 animations show.
 * Each label is a condensed formula with the charge or the unpaired electron written after the
 * carbon (or after its group), in real subscripts and superscripts. The labels are keyed by the
 * lib's own condensed string of the same species (toCondensed), so a label is attached only to a
 * species the lib actually produces.
 */

import type { MolGraph } from './molecule-graph'
import { parseSmiles, toCondensed } from './molecule-parse'

const LABELLED: readonly (readonly [string, string])[] = [
  ['[CH3+]', 'CH₃⁺'],
  ['C[CH2+]', 'CH₃CH₂⁺'],
  ['C[CH+]C', '(CH₃)₂CH⁺'],
  ['C[C+](C)C', '(CH₃)₃C⁺'],
  ['[CH3]', 'CH₃•'],
  ['C[CH2]', 'CH₃CH₂•'],
  ['CC[CH2]', 'CH₃CH₂CH₂•'],
  ['C[CH]C', '(CH₃)₂CH•'],
  ['C[C](C)C', '(CH₃)₃C•'],
  ['[CH3-]', 'CH₃⁻'],
  ['C[CH2-]', 'CH₃CH₂⁻'],
  ['C[CH-]C', '(CH₃)₂CH⁻'],
  ['C[C-](C)C', '(CH₃)₃C⁻'],
]

/** The lib's condensed string of a species, with the radical marked (toCondensed does not mark it). */
export function speciesKey(g: MolGraph): string {
  const radical = g.atoms.some((a) => (a.radical ?? 0) > 0)
  return `${toCondensed(g)}${radical ? '•' : ''}`
}

const BY_KEY = new Map<string, string>(LABELLED.map(([smiles, label]) => [speciesKey(parseSmiles(smiles)), label]))

/** The labelled name of a species, or undefined when the unit does not label it. */
export function speciesLabel(g: MolGraph): string | undefined {
  return BY_KEY.get(speciesKey(g))
}

/** The labelled species, in the order they are listed here (smiles and label). */
export const LABELLED_SPECIES: readonly { smiles: string; label: string }[] = LABELLED.map(([smiles, label]) => ({
  smiles,
  label,
}))
