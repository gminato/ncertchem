import { canonicalKey, molecularFormula, parseSmiles } from './molecule-parse'
import type { MolGraph } from './molecule-graph'
import { unit8Name } from './ncert-c12-unit8-data'

/**
 * Routes from Section 8.7 (Methods of Preparation of Carboxylic Acids) that the
 * acid synthesis planner lets a student test. Each rule is one starting material
 * and one reagent set from the Section's Prose; a missing rule means the Section
 * does not show that reaction.
 */

export type ReagentId = 'kmno4' | 'jones' | 'acid-heat' | 'grignard' | 'water' | 'ester-acid' | 'ester-base'

export interface Reagent {
  id: ReagentId
  /** The reagent line as the drawing prints it over the arrow. */
  label: string
}

export const REAGENTS: readonly Reagent[] = [
  { id: 'kmno4', label: 'alkaline KMnO₄, then H₃O⁺' },
  { id: 'jones', label: 'CrO₃ in H₂SO₄ (Jones reagent)' },
  { id: 'acid-heat', label: 'H₃O⁺, heat' },
  { id: 'grignard', label: 'Mg, dry ether; CO₂; then H₃O⁺' },
  { id: 'water', label: 'H₂O' },
  { id: 'ester-acid', label: 'H₃O⁺ (acid hydrolysis)' },
  { id: 'ester-base', label: 'OH⁻ (basic), then H₃O⁺' },
]

export interface Start {
  id: string
  smiles: string
}

export const STARTS: readonly Start[] = [
  { id: 'hexanol', smiles: 'CCCCCCO' },
  { id: 'hexylbenzene', smiles: 'CCCCCCC1=CC=CC=C1' },
  { id: 'tert-butylbenzene', smiles: 'CC(C)(C)C1=CC=CC=C1' },
  { id: 'phenylpropanenitrile', smiles: 'N#CCCC1=CC=CC=C1' },
  { id: 'bromobutane', smiles: 'CCCCBr' },
  { id: 'acetyl-chloride', smiles: 'CC(=O)Cl' },
  { id: 'acetic-anhydride', smiles: 'CC(=O)OC(C)=O' },
  { id: 'ethyl-butanoate', smiles: 'CCCC(=O)OCC' },
  { id: 'methylbutan-2-ol', smiles: 'CC(C)C(C)O' },
]

export interface Target {
  id: string
  smiles: string
}

export const TARGETS: readonly Target[] = [
  { id: 'ethanoic', smiles: 'CC(O)=O' },
  { id: 'butanoic', smiles: 'CCCC(O)=O' },
  { id: 'pentanoic', smiles: 'CCCCC(O)=O' },
  { id: 'hexanoic', smiles: 'CCCCCC(O)=O' },
  { id: 'benzoic', smiles: 'OC(=O)C1=CC=CC=C1' },
  { id: 'phenylpropanoic', smiles: 'OC(=O)CCC1=CC=CC=C1' },
]

export interface Rule {
  start: string
  reagent: ReagentId
  /** Product SMILES, or null when the reagent does not give an acid from this start. */
  product: string | null
  /** Short name of the route, shown on its card. */
  route: string
  /** Carbon-count note printed under the product. */
  carbonNote: string
  /** Why no acid forms (only for null products). Under 60 characters. */
  reason?: string
}

const NO_ACID = 'This reagent does not turn this starting material into an acid here.'

export const RULES: readonly Rule[] = [
  { start: 'hexanol', reagent: 'kmno4', product: 'CCCCCC(O)=O', route: 'Oxidation of a 1° alcohol', carbonNote: 'Carbon count unchanged' },
  { start: 'hexanol', reagent: 'jones', product: 'CCCCCC(O)=O', route: 'Oxidation of a 1° alcohol', carbonNote: 'Carbon count unchanged' },
  { start: 'hexylbenzene', reagent: 'kmno4', product: 'OC(=O)C1=CC=CC=C1', route: 'Side chain on benzene cut to COOH', carbonNote: 'Carbon count falls: the side chain is cut down to COOH' },
  { start: 'hexylbenzene', reagent: 'jones', product: 'OC(=O)C1=CC=CC=C1', route: 'Side chain on benzene cut to COOH', carbonNote: 'Carbon count falls: the side chain is cut down to COOH' },
  { start: 'tert-butylbenzene', reagent: 'kmno4', product: null, route: 'Side chain on benzene cut to COOH', carbonNote: '', reason: 'A tertiary alkyl group is not oxidised to COOH.' },
  { start: 'tert-butylbenzene', reagent: 'jones', product: null, route: 'Side chain on benzene cut to COOH', carbonNote: '', reason: 'A tertiary alkyl group is not oxidised to COOH.' },
  { start: 'phenylpropanenitrile', reagent: 'acid-heat', product: 'OC(=O)CCC1=CC=CC=C1', route: 'Nitrile through the amide', carbonNote: 'Carbon count unchanged' },
  { start: 'bromobutane', reagent: 'grignard', product: 'CCCCC(O)=O', route: 'Grignard reagent with CO₂', carbonNote: 'Carbon count rises by one: the new carbon comes from CO₂' },
  { start: 'acetyl-chloride', reagent: 'water', product: 'CC(O)=O', route: 'Hydrolysis of an acyl chloride', carbonNote: 'Carbon count unchanged' },
  { start: 'acetic-anhydride', reagent: 'water', product: 'CC(O)=O', route: 'Hydrolysis of an anhydride', carbonNote: 'Carbon count falls: the other acyl half is not in the acid' },
  { start: 'ethyl-butanoate', reagent: 'ester-acid', product: 'CCCC(O)=O', route: 'Hydrolysis of an ester', carbonNote: 'Carbon count falls: the alcohol part leaves as ethanol' },
  { start: 'ethyl-butanoate', reagent: 'ester-base', product: 'CCCC(O)=O', route: 'Hydrolysis of an ester', carbonNote: 'Carbon count falls: the alcohol part leaves as ethanol' },
  { start: 'methylbutan-2-ol', reagent: 'kmno4', product: null, route: 'Oxidation of a 1° alcohol', carbonNote: '', reason: 'A secondary alcohol gives a ketone, not an acid.' },
  { start: 'methylbutan-2-ol', reagent: 'jones', product: null, route: 'Oxidation of a 1° alcohol', carbonNote: '', reason: 'A secondary alcohol gives a ketone, not an acid.' },
]

const startById = (id: string): Start => {
  const s = STARTS.find((x) => x.id === id)
  if (!s) throw new Error(`unknown start ${id}`)
  return s
}

export function reagentLabel(id: ReagentId): string {
  const r = REAGENTS.find((x) => x.id === id)
  if (!r) throw new Error(`unknown reagent ${id}`)
  return r.label
}

/** IUPAC name from the namer (or NCERT's override), for a SMILES on the Section's list. */
export function nameOf(smiles: string): string {
  return unit8Name(smiles)
}

export function carbonCount(g: MolGraph): number {
  return g.atoms.filter((a) => a.element === 'C').length
}

export function sameMolecule(a: string, b: string): boolean {
  return canonicalKey(parseSmiles(a)) === canonicalKey(parseSmiles(b))
}

/** Every rule that makes the target acid. */
export function routesFor(targetSmiles: string): Rule[] {
  return RULES.filter((r) => r.product !== null && sameMolecule(r.product, targetSmiles))
}

export interface Attempt {
  /** Product SMILES when the reagent gives an acid from this start, otherwise null. */
  product: string | null
  /** The rule used, or null when the pair is not in the Section. */
  rule: Rule | null
  /** Plain-text reason when no acid forms. */
  reason: string
}

/** Outcome of one starting material with one reagent set. */
export function attempt(startId: string, reagent: ReagentId): Attempt {
  const rule = RULES.find((r) => r.start === startId && r.reagent === reagent) ?? null
  if (rule && rule.product) return { product: rule.product, rule, reason: '' }
  if (rule) return { product: null, rule, reason: rule.reason ?? NO_ACID }
  return { product: null, rule: null, reason: NO_ACID }
}

/** Carbon counts of the start and the product of a rule (or of the attempt). */
export function carbonCheck(startSmiles: string, productSmiles: string) {
  const start = carbonCount(parseSmiles(startSmiles))
  const product = carbonCount(parseSmiles(productSmiles))
  return { start, product, delta: product - start }
}

export function startSmilesOf(id: string): string {
  return startById(id).smiles
}

export function formulaOf(smiles: string): string {
  return molecularFormula(parseSmiles(smiles))
}
