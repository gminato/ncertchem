import { eliminationProducts, formulaUnicode, type EliminationProduct } from './haloalkanes'
import { iupacNameFromSmiles } from './iupac-organic'
import type { MolGraph } from './molecule-graph'
import { canonicalKey, molecularFormula, parseSmiles } from './molecule-parse'
import { NCERT_ZAITSEV_2_BROMOPENTANE } from './ncert-c12-unit6-data'

/** The haloalkanes the Zaitsev chooser offers (no rings, so each SMILES is a plain chain). */
export const CHOOSER_SUBSTRATES = [
  'CCCC(Br)C',
  'CC(Br)C(C)C',
  'CCC(C)(C)Br',
  'CC(C)(C)Br',
  'CC(C)Br',
  'CCBr',
] as const

export type ChooserSubstrate = (typeof CHOOSER_SUBSTRATES)[number]

export interface ChooserBetaCarbon {
  /** Atom index in the substrate graph. */
  index: number
  /** Hydrogens on this carbon (each one is a β-hydrogen). */
  hydrogens: number
}

export interface ChooserProduct extends EliminationProduct {
  /** Share of the product mix as NCERT prints it. Only 2-bromopentane has one; otherwise null. */
  percent: number | null
  /** Graph of the alkene, for drawing. */
  graph: MolGraph
}

export interface ChooserView {
  smiles: ChooserSubstrate
  /** IUPAC name from iupacNameFromSmiles. */
  name: string
  /** Molecular formula with real subscripts, e.g. C₅H₁₁Br. */
  formula: string
  graph: MolGraph
  /** Index of the halogen atom in the substrate graph. */
  halogenIndex: number
  /** Index of the α-carbon (the carbon bonded to the halogen). */
  alphaIndex: number
  /** The carbons next to the α-carbon that carry at least one hydrogen. */
  betaCarbons: ChooserBetaCarbon[]
  /** Total β-hydrogens: the sum of the hydrogens on the β-carbons. */
  betaHydrogenTotal: number
  products: ChooserProduct[]
  /** True when NCERT's 81 % / 19 % split applies to this substrate. */
  hasNcertSplit: boolean
}

const HALOGENS = new Set(['F', 'Cl', 'Br', 'I'])

function ncertKey(smiles: string): string {
  return canonicalKey(parseSmiles(smiles))
}

/** Everything the chooser draws for one substrate. Every number and name comes from the libs. */
export function chooserView(smiles: ChooserSubstrate): ChooserView {
  const graph = parseSmiles(smiles)
  const halogenIndex = graph.atoms.findIndex((atom) => HALOGENS.has(atom.element))
  if (halogenIndex < 0) throw new Error(`No halogen in ${smiles}`)

  const neighbours = (index: number): number[] =>
    graph.bonds.flatMap((bond) => (bond.a === index ? [bond.b] : bond.b === index ? [bond.a] : []))

  const alphaIndex = neighbours(halogenIndex).find((i) => graph.atoms[i].element === 'C')
  if (alphaIndex === undefined) throw new Error(`No α-carbon in ${smiles}`)

  const betaCarbons = neighbours(alphaIndex)
    .filter((i) => i !== halogenIndex && graph.atoms[i].element === 'C')
    .map((index) => ({ index, hydrogens: graph.atoms[index].hCount ?? 0 }))
    .filter((beta) => beta.hydrogens > 0)

  const hasNcertSplit = ncertKey(smiles) === ncertKey(NCERT_ZAITSEV_2_BROMOPENTANE.substrate.smiles)
  const ncertPercent = (productSmiles: string): number | null => {
    if (!hasNcertSplit) return null
    const key = ncertKey(productSmiles)
    const match = NCERT_ZAITSEV_2_BROMOPENTANE.products.find((p) => ncertKey(p.smiles) === key)
    return match ? match.percent : null
  }

  const products: ChooserProduct[] = eliminationProducts(graph).map((product) => ({
    ...product,
    percent: ncertPercent(product.smiles),
    graph: parseSmiles(product.smiles),
  }))

  return {
    smiles,
    name: iupacNameFromSmiles(smiles),
    formula: formulaUnicode(molecularFormula(graph)),
    graph,
    halogenIndex,
    alphaIndex,
    betaCarbons,
    betaHydrogenTotal: betaCarbons.reduce((sum, beta) => sum + beta.hydrogens, 0),
    products,
    hasNcertSplit,
  }
}

/** The one sentence a screen reader hears for the current choice. */
export function chooserSummary(view: ChooserView, flagZaitsev: boolean): string {
  const count = `${view.betaHydrogenTotal} β-hydrogen${view.betaHydrogenTotal === 1 ? '' : 's'} on ${view.betaCarbons.length} β-carbon${view.betaCarbons.length === 1 ? '' : 's'}`
  if (view.products.length === 1) {
    const only = view.products[0]
    return `${view.name} (${view.formula}) has ${count}. Its only alkene is ${only.name}, with ${only.alkylGroups} alkyl group${only.alkylGroups === 1 ? '' : 's'} on the double bond.`
  }
  const products = view.products
    .map((p) => {
      const share = p.percent !== null ? `, ${p.percent} %` : ''
      const alkyl = `${p.alkylGroups} alkyl group${p.alkylGroups === 1 ? '' : 's'}`
      const flag = flagZaitsev && p.zaitsev ? ' (Zaitsev product)' : ''
      return `${p.name}, ${alkyl}${share}${flag}`
    })
    .join('; ')
  return `${view.name} (${view.formula}) has ${count}. Possible alkenes: ${products}.`
}
