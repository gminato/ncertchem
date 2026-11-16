/**
 * Pure data for the carcinogens Scrolly (Section 9.6): benzene, the two polynuclear hydrocarbons NCERT
 * draws whose structures this site can parse (1,2-benzanthracene and 1,2-benzpyrene), and the names of
 * the rest. Names are NCERT's printed names; formulas and ring counts come from the lib.
 */

import type { MolGraph } from '@/lib/chem/molecule-graph'
import { parseSmiles, molecularFormula } from '@/lib/chem/molecule-parse'
import { findRings } from '@/lib/chem/hydrocarbon-species'
import { combust } from '@/lib/chem/hydrocarbon-reactions'
import { NCERT_CARCINOGENS } from '@/lib/chem/ncert-unit9-tables'
import { hybridOf, resonanceSpecies, type HybridCharge } from '@/lib/chem/resonance-species'

export const CARCINOGEN_STEP_KINDS = ['benzene', 'fused', 'others'] as const
export type CarcinogenStepKind = (typeof CARCINOGEN_STEP_KINDS)[number]

/**
 * Kekulé SMILES of the drawn polynuclear hydrocarbons, keyed by NCERT's printed name. Only these two are
 * drawn: the other three in NCERT's box are named only (the lib's parser is checked on the two).
 */
export const DRAWN_PAH: Readonly<Record<string, string>> = {
  '1,2-Benzanthracene': 'C1=CC=C2C=C3C(=CC2=C1)C=CC4=CC=CC=C43',
  '1,2-Benzpyrene': 'C1=CC=C2C3=C4C(=CC2=C1)C=CC5=C4C(=CC=C5)C=C3',
}

/** A drawn hydrocarbon: NCERT's name, the lib's formula and ring count, and its graph. */
export interface DrawnPah {
  name: string
  formula: string
  rings: number
  graph: MolGraph
}

export function drawnPahs(): DrawnPah[] {
  return Object.entries(DRAWN_PAH).map(([name, smiles]) => {
    const graph = parseSmiles(smiles)
    return { name, formula: molecularFormula(graph), rings: findRings(graph, 6).filter((r) => r.length === 6).length, graph }
  })
}

/** The names NCERT prints in its box that are not drawn here. */
export function namedOnly(): string[] {
  return NCERT_CARCINOGENS.map((c) => c.name).filter((n) => !(n in DRAWN_PAH))
}

/**
 * Benzene for the drawing: the lib's hybrid (every ring bond order 1, with the inscribed circle and no Kekulé
 * double bonds), and the balanced combustion equation from the lib (the Kekulé form is only the input).
 */
export function benzeneNodes(): { graph: MolGraph; hybrid: { graph: MolGraph; partialBonds: number[]; charges: HybridCharge[] }; equation: string } {
  const graph = parseSmiles('C1=CC=CC=C1')
  const hybrid = hybridOf(resonanceSpecies('benzene'))
  return { graph, hybrid, equation: combust(graph).equation }
}
