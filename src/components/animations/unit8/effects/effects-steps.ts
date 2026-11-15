/**
 * Pure data for the electron-effects Scrolly (Section 8.7.4): the Steps in order, the inductive
 * chain of 1-chloropentane, and the carbocation ladder of Section 8.7.9. The drawings read it.
 */

import { condensedLabel } from '@/components/organic'
import { rankIntermediates, intermediateStability, type IntermediateItem } from '@/lib/chem/electronic-effects'
import type { MolGraph } from '@/lib/chem/molecule-graph'
import { parseSmiles, toCondensed } from '@/lib/chem/molecule-parse'
import type { InductiveNode } from '@/components/organic'

/** The seven Steps: inductive chain, acetate and benzene resonance, +R, -R, electromeric, hyperconjugation. */
export const EFFECT_STEP_KINDS = [
  'inductive',
  'carboxylate',
  'benzene',
  'donation',
  'withdrawal',
  'electromeric',
  'hyperconjugation',
] as const
export type EffectStepKind = (typeof EFFECT_STEP_KINDS)[number]

/** The chain of 1-chloropentane, Cl at one end, with the δ charges of the inductive effect. */
export const CHAIN_SMILES = 'ClCCCCC'

/**
 * Nodes for InductiveChain: each carbon labelled by its own hydrogen count, and the δ charge on
 * the first three carbons, fading with each bond (NCERT 8.7.5: the effect vanishes after three bonds).
 */
export function inductiveNodes(smiles = CHAIN_SMILES): InductiveNode[] {
  const g = parseSmiles(smiles)
  const charges = ['δ+', 'δδ+', 'δδδ+']
  const opacity = [1, 0.6, 0.3]
  return g.atoms.map((_, i) => {
    const label = condensedLabel(g, i)
    if (i === 0) return { label }
    const k = i - 1
    if (k < charges.length && g.atoms[0].element === 'Cl') {
      return { label, charge: charges[k], chargeOpacity: opacity[k] }
    }
    return { label }
  })
}

/** A carbocation of the Section 8.7.9 ladder, with the lib's own counts. */
export interface CationRung {
  smiles: string
  /** Written formula, from the lib's alkyl-group count: (CH₃)₃C⁺ and so on. */
  label: string
  condensed: string
  alphaH: number
  alkylGroups: number
  /** Position from the strongest (0) to the weakest. */
  rank: number
}

const CATIONS = ['[CH3+]', '[CH2+]C', 'C[CH+]C', 'C[C+](C)C'] as const

/** The written formula of a carbocation with this many alkyl groups on its positive carbon. */
export function cationLabel(alkylGroups: number): string {
  switch (alkylGroups) {
    case 3:
      return '(CH₃)₃C⁺'
    case 2:
      return '(CH₃)₂CH⁺'
    case 1:
      return 'CH₃CH₂⁺'
    default:
      return 'CH₃⁺'
  }
}

/** The four alkyl carbocations, strongest first, with the α-hydrogens and alkyl groups the lib counts. */
export function cationLadder(): CationRung[] {
  const graphs = CATIONS.map((s) => parseSmiles(s))
  const items: IntermediateItem[] = graphs.map((g) => {
    const centre = g.atoms.findIndex((a) => (a.charge ?? 0) === 1)
    return { kind: 'carbocation', graph: g, centre }
  })
  const order = rankIntermediates(items)
  return order.map((index, rank) => {
    const g = graphs[index]
    const centre = items[index].centre
    const s = intermediateStability('carbocation', g, centre)
    return {
      smiles: CATIONS[index],
      label: cationLabel(s.alkylGroups),
      condensed: toCondensed(g),
      alphaH: s.alphaH,
      alkylGroups: s.alkylGroups,
      rank,
    }
  })
}
