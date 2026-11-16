/**
 * Sorts a hydrocarbon into the families of NCERT Class 11 Unit 9, Section 9.1: saturated (only single
 * bonds, open chain or ring), unsaturated (a C=C or C≡C in an open chain or a non-aromatic ring) and
 * aromatic (a ring that Hückel's rule counts as aromatic). Alkenes and alkynes are the two unsaturated
 * families the sorter asks for separately. The aromatic verdict comes from the lib's huckel model.
 */

import { huckel } from './aromaticity'
import { findRings } from './hydrocarbon-species'
import type { MolGraph } from './molecule-graph'

export type HydrocarbonFamilyName = 'Saturated' | 'Alkene' | 'Alkyne' | 'Aromatic'

export interface FamilyVerdict {
  family: HydrocarbonFamilyName
  /** Short reasons, in the order the lib checked them. */
  reasons: string[]
}

/**
 * The family of a hydrocarbon: aromatic first (a ring that passes Hückel's rule), then alkyne (a triple bond),
 * then alkene (a double bond), and otherwise saturated.
 *
 * @throws {RangeError} If the graph contains an element other than carbon and hydrogen
 */
export function hydrocarbonFamily(g: MolGraph): FamilyVerdict {
  if (g.atoms.some((a) => a.element !== 'C' && a.element !== 'H')) {
    throw new RangeError('A hydrocarbon contains only carbon and hydrogen')
  }
  const reasons: string[] = []
  for (const ring of findRings(g, 8)) {
    const verdict = huckel(g, ring)
    if (verdict.verdict === 'aromatic') {
      reasons.push(`a planar ring with ${verdict.piElectrons} π electrons, which fits 4n + 2`)
      return { family: 'Aromatic', reasons }
    }
  }
  const triple = g.bonds.some((b) => b.order === 3)
  if (triple) return { family: 'Alkyne', reasons: ['a carbon–carbon triple bond'] }
  const double = g.bonds.some((b) => b.order === 2)
  if (double) return { family: 'Alkene', reasons: ['a carbon–carbon double bond'] }
  return { family: 'Saturated', reasons: ['only carbon–carbon and carbon–hydrogen single bonds'] }
}
