/**
 * The halide classifier's model: a gallery of the Section's molecules and a small builder that writes
 * a Kekulé SMILES for one halogen on a chain, a chain with a C=C, or a chain attached to a benzene ring.
 * Classes, names and formulas come from haloalkanes.ts, molecule-parse.ts and iupac-organic.ts.
 */
import { classifyHalide, classifyHalideSmiles, formulaUnicode, type HalideClass, type HalogenElement } from './haloalkanes'
import { molecularFormula, parseSmiles } from './molecule-parse'
import type { MolGraph } from './molecule-graph'

export type HalideFeature = 'plain' | 'alkene' | 'ring'

export interface HalideBuildSpec {
  /** Carbons in the chain, 1 to 5. */
  carbons: number
  feature: HalideFeature
  /** For 'alkene': the double bond joins carbon d and carbon d + 1 (1 to carbons - 1). */
  doubleAfter: number
  /** The chain carbon (1-based) that carries the halogen, or 'ring' for the para carbon of the benzene ring. */
  site: number | 'ring'
  halogen: HalogenElement
}

export const MAX_BUILD_CARBONS = 5

/** Kekulé benzene with its first ring atom open for a branch; the chain is written inside the branch. */
const RING_OPEN = 'C1'
const RING_CLOSE = '=CC=CC=C1'
const RING_PARA_HALOGEN = '=CC=C(%H)C=C1'

/** Writes the chain from carbon 1 to carbon n; a double bond or a halogen branch goes where the spec says. */
function chainSmiles(spec: HalideBuildSpec, carbons: number, halogenSite: number | null): string {
  let out = ''
  for (let i = 1; i <= carbons; i++) {
    const bond = i > 1 && spec.feature === 'alkene' && spec.doubleAfter === i - 1 ? '=' : ''
    const branch = halogenSite === i ? `(${spec.halogen})` : ''
    out += `${bond}C${branch}`
  }
  return out
}

/** Clamps the spec to what the builder can draw: 1 to 5 carbons, a valid double-bond place, a site on the molecule. */
export function normaliseBuildSpec(spec: HalideBuildSpec): HalideBuildSpec {
  const carbons = Math.min(MAX_BUILD_CARBONS, Math.max(1, Math.round(spec.carbons)))
  const feature: HalideFeature = spec.feature === 'alkene' && carbons < 2 ? 'plain' : spec.feature
  const doubleAfter = Math.min(carbons - 1, Math.max(1, Math.round(spec.doubleAfter)))
  let site = spec.site
  if (site === 'ring') {
    if (feature !== 'ring') site = 1
  } else {
    site = Math.min(carbons, Math.max(1, Math.round(site)))
  }
  return { carbons, feature, doubleAfter, site, halogen: spec.halogen }
}

/** A Kekulé SMILES for the spec. The molecule has exactly one halogen. */
export function buildHalideSmiles(input: HalideBuildSpec): string {
  const spec = normaliseBuildSpec(input)
  const chainSite = spec.site === 'ring' ? null : spec.site
  const chain = chainSmiles(spec, spec.carbons, chainSite)
  if (spec.feature !== 'ring') return chain
  if (spec.site === 'ring') return `${RING_OPEN}(${chain})${RING_PARA_HALOGEN.replace('%H', spec.halogen)}`
  return `${RING_OPEN}(${chain})${RING_CLOSE}`
}

/** The index of the single halogen atom in a parsed molecule. */
export function halogenIndex(g: MolGraph): number {
  const i = g.atoms.findIndex((a) => ['F', 'Cl', 'Br', 'I'].includes(a.element))
  if (i < 0) throw new RangeError('halogenIndex: the molecule has no halogen')
  return i
}

/** The class of the one halogen in a molecule with a single halogen, from the classifier. */
export function singleHalideClass(smiles: string): HalideClass {
  const g = parseSmiles(smiles)
  return classifyHalide(g, halogenIndex(g))
}

/** Plain-language class of the molecule, e.g. "2° benzylic halide" or "geminal dihalide". */
export function halideVerdict(smiles: string): string {
  const result = classifyHalideSmiles(smiles)
  if (result.count === 1) {
    const c = result.halides[0]
    switch (c.kind) {
      case 'alkyl':
        return c.degree === 'methyl' ? 'methyl halide' : `${c.degree} alkyl halide`
      case 'allylic':
        return 'allylic halide'
      case 'benzylic':
        return `${c.degree} benzylic halide`
      case 'vinylic':
        return 'vinylic halide'
      case 'aryl':
        return 'aryl halide'
    }
  }
  if (result.count === 2 && result.dihalide) return `${result.dihalide} dihalide`
  if (result.count === 2) return 'dihalogen compound'
  return 'polyhalogen compound'
}

/** The formula with real subscripts, e.g. C₅H₁₁Br. */
export function halideFormula(smiles: string): string {
  return formulaUnicode(molecularFormula(parseSmiles(smiles)))
}

/** The Section's gallery, in the order the Prose introduces them (P1 fact sheet rows 1 to 12). */
export const HALIDE_GALLERY: readonly string[] = [
  'BrCC(C)CC',
  'CC(C)C(Br)C',
  'CCC(C)(Br)C',
  'CC=CCBr',
  'BrCC1=CC=CC=C1',
  'CC(Cl)C1=CC=CC=C1',
  'CC(C)(Br)C1=CC=CC=C1',
  'C=C(C)Cl',
  'CCC1=CC(Br)=CC=C1',
  'CCC(Cl)(Cl)C',
  'CC(C)C(Br)CBr',
  'CC(Cl)(Cl)Cl',
]
