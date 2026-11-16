/**
 * Pure data for the electrophilic substitution Scrolly (Section 9.5.5): what each Step shows. Every
 * structure is a graph from the lib (eas-mechanism, hydrocarbon-reactions) and every formula, name and
 * equation is written from the lib's own strings, so nothing here is typed by hand except the words.
 */

import type { MolGraph } from '@/lib/chem/molecule-graph'
import { molecularFormula, parseSmiles } from '@/lib/chem/molecule-parse'
import { electrophilicSubstitution } from '@/lib/chem/hydrocarbon-reactions'
import {
  equationTerms,
  formulaText,
  methylCation,
  nitroniumIon,
  sigmaContributors,
  substitutionOfBenzene,
} from '@/lib/chem/eas-mechanism'
import type { SchemePath } from '@/components/organic/hydrocarbon-geometry'

/**
 * The view of one Step: a reaction scheme (drawn at `zoom`, so that its text and structures fill the panel), the
 * nitration strip (an EASMechanism stage), or the three contributors of the σ-complex.
 */
export type EasView =
  | { kind: 'scheme'; title: string; caption: string; path: SchemePath; zoom: number }
  | { kind: 'strip'; title: string; caption: string; progress: number }
  | { kind: 'resonance'; title: string; caption: string; contributors: MolGraph[] }

const CH3CL = parseSmiles('CCl')

/** The nitration electrophile equation as the lib writes it, split into species. */
function nitrationTerms() {
  const { electrophile } = electrophilicSubstitution(parseSmiles('C1=CC=CC=C1'), 'nitration')
  if (!electrophile) throw new RangeError('The nitration electrophile is missing from the lib')
  return equationTerms(electrophile.equation)
}

/** The alkylation electrophile equation (RCl + AlCl3 → R⁺ + AlCl4⁻) as species. */
function alkylationTerms() {
  const { electrophile } = electrophilicSubstitution(parseSmiles('C1=CC=CC=C1'), 'alkylation', { R: CH3CL })
  if (!electrophile) throw new RangeError('The alkylation electrophile is missing from the lib')
  return equationTerms(electrophile.equation)
}

/** The species of the nitration electrophile step: HNO₃ and H₂SO₄ give NO₂⁺, H₃O⁺ and HSO₄⁻ (NO₂⁺ drawn). */
function nitroniumScheme(): SchemePath {
  const t = nitrationTerms()
  const products = t.products.map((p) => (p === 'NO2+' ? { formula: nitroniumIon() } : { formula: formulaText(p) }))
  return [
    t.reactants.map((r) => ({ formula: formulaText(r) })),
    { equilibrium: true },
    products,
  ]
}

/** The methyl-cation step: CH₃Cl and AlCl₃ give CH₃⁺ and AlCl₄⁻ (the lib's alkylation electrophile equation). */
function methylScheme(): SchemePath {
  const t = alkylationTerms()
  return [
    [{ formula: formulaText(molecularFormula(CH3CL)) }, { formula: formulaText(t.reactants[1]) }],
    {},
    [{ formula: formulaText(molecularFormula(methylCation())) }, { formula: formulaText(t.products[1]) }],
  ]
}

/** The σ-complex of the methyl step loses H⁺ to AlCl₄⁻: toluene, HCl and AlCl₃ (products from the lib). */
function tolueneScheme(): SchemePath {
  const reaction = substitutionOfBenzene('alkylation', CH3CL)
  const toluene = reaction.products[0]
  const t = alkylationTerms()
  return [
    [{ formula: sigmaContributors('alkylation', CH3CL)[0] }, { formula: formulaText(t.products[1]) }],
    {},
    [{ formula: toluene.graph, tag: toluene.name }, { formula: formulaText('HCl') }, { formula: formulaText(t.reactants[1]) }],
  ]
}

/** The six Steps of the Scrolly, in order. Nitration first (Steps 1 to 4), then Friedel–Crafts (Steps 5 and 6). */
export function easViews(): EasView[] {
  const toluene = substitutionOfBenzene('alkylation', CH3CL).products[0].name
  return [
    {
      kind: 'scheme',
      title: '1 · Make the electrophile',
      caption: 'Sulphuric acid protonates nitric acid. Water leaves, and NO₂⁺ is left.',
      path: nitroniumScheme(),
      zoom: 1.25,
    },
    {
      kind: 'strip',
      title: '2 · The π cloud attacks NO₂⁺',
      caption: 'Two π electrons form a new C–N bond. One ring carbon becomes sp³.',
      progress: 0.33,
    },
    {
      kind: 'resonance',
      title: '3 · The σ-complex has three contributors',
      caption: 'The + sits on the carbons ortho and para to the sp³ carbon, so the ring is no longer aromatic.',
      contributors: sigmaContributors('nitration'),
    },
    {
      kind: 'strip',
      title: '4 · HSO₄⁻ removes H⁺ and the ring is restored',
      caption: 'Losing the proton returns the π cloud to the ring: nitrobenzene.',
      progress: 1,
    },
    {
      kind: 'scheme',
      title: '5 · Friedel–Crafts: AlCl₃ makes the electrophile',
      caption: 'The same pattern: a Lewis acid pulls Cl⁻ from CH₃Cl to give CH₃⁺ and AlCl₄⁻.',
      path: methylScheme(),
      zoom: 1.6,
    },
    {
      kind: 'scheme',
      title: '6 · The σ-complex loses H⁺ to AlCl₄⁻',
      caption: `The ring is restored and the product is ${toluene}. HCl and AlCl₃ are released.`,
      path: tolueneScheme(),
      zoom: 1.2,
    },
  ]
}
