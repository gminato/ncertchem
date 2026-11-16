/**
 * Pure data for the elimination Scrolly (Section 9.3.4): the Steps in order, the curved arrows each
 * Step shows, and the products every Step names. The names come from the alkene maker, which asks
 * the hydrocarbon libraries, so nothing here is typed by hand.
 */

import { makeAlkenes, type AlkeneOutcome } from '@/lib/chem/alkene-maker'
import { hydrogenate, type Reaction } from '@/lib/chem/hydrocarbon-reactions'
import { parseSmiles } from '@/lib/chem/molecule-parse'
import type { MolGraph } from '@/lib/chem/molecule-graph'

/** The seven Steps: polarity, the base, the concerted E2 shift, ethene, the dihalide with zinc, the alcohol, the alkynes. */
export const ELIMINATION_STEP_KINDS = ['polar', 'base', 'concerted', 'ethene', 'dihalide', 'alcohol', 'alkynes'] as const
export type EliminationStepKind = (typeof ELIMINATION_STEP_KINDS)[number]

/** The curved arrows of the mechanism. */
export type MechanismArrow = 'base-to-H' | 'CH-to-pi' | 'CBr-to-Br'

/** The arrows each Step draws. The base takes the β-H first; then the π bond forms as Br leaves. */
export const ARROWS_BY_STEP: Record<EliminationStepKind, readonly MechanismArrow[]> = {
  polar: [],
  base: ['base-to-H'],
  concerted: ['base-to-H', 'CH-to-pi', 'CBr-to-Br'],
  ethene: [],
  dihalide: [],
  alcohol: [],
  alkynes: [],
}

/** The bromoethane that the mechanism follows, as a SMILES string. */
export const MECHANISM_SMILES = 'CCBr'

/** The lib facts the drawings name: the alkene from each starting compound, or the reason it does not form. */
export interface EliminationFacts {
  bromoethane: AlkeneOutcome
  dibromoethane: AlkeneOutcome
  ethanol: AlkeneOutcome
}

export function eliminationFacts(): EliminationFacts {
  return {
    bromoethane: makeAlkenes(MECHANISM_SMILES, 'alcoholic-koh'),
    dibromoethane: makeAlkenes('BrCCBr', 'zinc'),
    ethanol: makeAlkenes('CCO', 'conc-h2so4'),
  }
}

/** The two alkynes of Step 7, reduced by the two reagents of the Section (cis and trans alkenes). */
export function alkyneReductions(): { lindlar: Reaction; sodiumAmmonia: Reaction } {
  return {
    lindlar: hydrogenate(parseSmiles('CC#CC'), { alkyne: 'lindlar' }),
    sodiumAmmonia: hydrogenate(parseSmiles('CC#CC'), { alkyne: 'sodium-ammonia' }),
  }
}

/** The graphs of the alkene products, for drawing them with SkeletalFormula. */
export function productGraph(reaction: Reaction, index = 0): MolGraph {
  return reaction.products[index].graph
}
