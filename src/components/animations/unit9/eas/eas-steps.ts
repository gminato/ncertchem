/**
 * Pure data for the electrophilic substitution Scrolly (Section 9.5.5): the six Steps, their titles and
 * captions, and the species and products each Step names. Every name, formula and product comes from the
 * lib (hydrocarbon-reactions, eas-mechanism); the words are the Section's own.
 */

import type { MolGraph } from '@/lib/chem/molecule-graph'
import { electrophilicSubstitution } from '@/lib/chem/hydrocarbon-reactions'
import { equationTerms, formulaText, methylCation, substitutionOfBenzene } from '@/lib/chem/eas-mechanism'
import { molecularFormula, parseSmiles } from '@/lib/chem/molecule-parse'

export const EAS_STEP_COUNT = 6

const CH3CL = parseSmiles('CCl')
const BENZENE = 'C1=CC=CC=C1'

export interface EasStepText {
  title: string
  caption: string
}

/** The titles and captions of the six Steps, in order. */
export function easStepTexts(toluene: string): EasStepText[] {
  return [
    { title: '1 · Make the electrophile', caption: 'Sulphuric acid protonates nitric acid. Water leaves, and the linear nitronium ion, NO₂⁺, is left.' },
    { title: '2 · The π cloud attacks NO₂⁺', caption: 'Two π electrons of benzene form a new C–N bond. One ring carbon becomes sp³ and carries H and NO₂.' },
    { title: '3 · The σ-complex has three contributors', caption: 'The + sits on the carbons ortho and para to the sp³ carbon, and the ring is no longer aromatic.' },
    { title: '4 · HSO₄⁻ removes H⁺ and the ring is restored', caption: `Losing the proton returns the π cloud to the ring. The product is nitrobenzene; H₂SO₄ is regenerated.` },
    { title: '5 · Friedel–Crafts: AlCl₃ makes the electrophile', caption: 'A Lewis acid takes Cl⁻ from CH₃Cl, giving the methyl cation and the tetrachloroaluminate ion.' },
    { title: '6 · The σ-complex loses H⁺ to AlCl₄⁻', caption: `The ring is restored: the product is ${toluene}. HCl and AlCl₃ are released.` },
  ]
}

/** The nitration electrophile equation as species, from the lib. */
export function nitrationSpecies(): { reactants: string[]; products: string[] } {
  const { electrophile } = electrophilicSubstitution(parseSmiles(BENZENE), 'nitration')
  if (!electrophile) throw new RangeError('The nitration electrophile is missing from the lib')
  return equationTerms(electrophile.equation)
}

/** The alkylation electrophile equation as species, from the lib (R = CH₃). */
export function alkylationSpecies(): { reactants: string[]; products: string[] } {
  const { electrophile } = electrophilicSubstitution(parseSmiles(BENZENE), 'alkylation', { R: CH3CL })
  if (!electrophile) throw new RangeError('The alkylation electrophile is missing from the lib')
  return equationTerms(electrophile.equation)
}

/** The nitrobenzene product graph (lib). */
export function nitrobenzeneGraph(): MolGraph {
  return substitutionOfBenzene('nitration').products[0].graph
}

/** The toluene (methylbenzene) product graph and name (lib). */
export function tolueneProduct(): { graph: MolGraph; name: string } {
  const p = substitutionOfBenzene('alkylation', CH3CL).products[0]
  return { graph: p.graph, name: p.name }
}

/** The formula of chloromethane and of the methyl cation, as text with real subscripts (computed from the graphs). */
export function methylSpecies(): { chloromethane: string; methylCation: string } {
  return {
    chloromethane: formulaText(molecularFormula(CH3CL)),
    methylCation: formulaText(molecularFormula(methylCation())),
  }
}
