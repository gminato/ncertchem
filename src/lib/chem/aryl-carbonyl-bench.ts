import { unit8Name } from './ncert-c12-unit8-data'

/**
 * Model for the Aryl Carbonyl Bench (Class 12 Unit 8, Section 3): which starting materials take which
 * reagent sets, the intermediate NCERT names (if any) and the product. Every product and intermediate
 * is a SMILES that the namer or NCERT names; formulas are asserted in the tests.
 */

export type StartId = 'toluene' | 'benzene' | 'benzoylChloride' | 'ethanoylChloride' | 'benzonitrile'
export type ReagentId = 'etard' | 'chromic' | 'sideChain' | 'strongOxidant' | 'gattermanKoch' | 'friedelCrafts' | 'cadmium' | 'grignard'
export type Outcome = 'aldehyde' | 'ketone' | 'acid'

/** A starting material: a drawn molecule with its SMILES. */
export const STARTS: readonly { id: StartId; label: string; smiles: string }[] = [
  { id: 'toluene', label: 'Toluene', smiles: 'CC1=CC=CC=C1' },
  { id: 'benzene', label: 'Benzene', smiles: 'C1=CC=CC=C1' },
  { id: 'benzoylChloride', label: 'Benzoyl chloride', smiles: 'ClC(=O)C1=CC=CC=C1' },
  { id: 'ethanoylChloride', label: 'Ethanoyl chloride', smiles: 'CC(Cl)=O' },
  { id: 'benzonitrile', label: 'Benzonitrile', smiles: 'N#CC1=CC=CC=C1' },
]

/** A drawn intermediate: a molecule from a SMILES, or a labelled species NCERT does not name. */
export type Intermediate = { kind: 'molecule'; smiles: string; name: string } | { kind: 'label'; label: string }

/** One arrow of a route: reagents above it, conditions below it. */
export interface RouteArrow {
  reagents: string
  conditions?: string
}

export interface Route {
  start: StartId
  reagent: ReagentId
  /** Text on the reagent-set button. */
  label: string
  /** One arrow per stage; a route with an intermediate has two arrows. */
  arrows: readonly RouteArrow[]
  /** The drawn intermediate between the two arrows, if NCERT names one (or the chromium complex). */
  intermediate?: Intermediate
  /** The product (SMILES). For the strong oxidant route this is the acid the reaction ends at. */
  product: string
  outcome: Outcome
  /** One plain sentence for the output panel. */
  note: string
}

const BENZALDEHYDE = 'O=CC1=CC=CC=C1'
const BENZOIC_ACID = 'OC(=O)C1=CC=CC=C1'
const ACETOPHENONE = 'CC(=O)C1=CC=CC=C1'
const PROPANONE = 'CC(C)=O'
const BENZAL_CHLORIDE = 'ClC(Cl)C1=CC=CC=C1'
const BENZYLIDENE_DIACETATE = 'CC(=O)OC(OC(C)=O)C1=CC=CC=C1'

/** NCERT's own names for the two intermediates the namer refuses (see the Section's report). */
const NCERT_NAMES: Readonly<Record<string, string>> = {
  [BENZAL_CHLORIDE]: 'benzal chloride',
  [BENZYLIDENE_DIACETATE]: 'benzylidene diacetate',
}

/** Common names shown in brackets after the systematic name. */
const COMMON_NAMES: Readonly<Record<string, string>> = {
  'CC1=CC=CC=C1': 'toluene',
  [ACETOPHENONE]: 'acetophenone',
  [PROPANONE]: 'acetone',
}

/** The name to show for a molecule in this Simulation. */
export function displayName(smiles: string): string {
  const common = COMMON_NAMES[smiles]
  const base = NCERT_NAMES[smiles] ?? unit8Name(smiles)
  return common && common !== base ? `${base} (${common})` : base
}

export const ROUTES: readonly Route[] = [
  {
    start: 'toluene',
    reagent: 'etard',
    label: 'Etard: CrO₂Cl₂, then H₃O⁺',
    arrows: [{ reagents: 'CrO₂Cl₂ in CS₂' }, { reagents: 'H₃O⁺' }],
    intermediate: { kind: 'label', label: 'chromium complex' },
    product: BENZALDEHYDE,
    outcome: 'aldehyde',
    note: 'The Etard reaction gives a chromium complex from the CH₃ group, and hydrolysis gives the aldehyde.',
  },
  {
    start: 'toluene',
    reagent: 'chromic',
    label: 'CrO₃ in (CH₃CO)₂O, then aqueous acid',
    arrows: [{ reagents: 'CrO₃ in (CH₃CO)₂O', conditions: '273–283 K' }, { reagents: 'aqueous acid' }],
    intermediate: { kind: 'molecule', smiles: BENZYLIDENE_DIACETATE, name: NCERT_NAMES[BENZYLIDENE_DIACETATE] },
    product: BENZALDEHYDE,
    outcome: 'aldehyde',
    note: 'Chromium trioxide in acetic anhydride gives benzylidene diacetate, and aqueous acid hydrolyses it to the aldehyde.',
  },
  {
    start: 'toluene',
    reagent: 'sideChain',
    label: 'Cl₂, hν, then H₂O at 373 K',
    arrows: [{ reagents: 'Cl₂, hν' }, { reagents: 'H₂O', conditions: '373 K' }],
    intermediate: { kind: 'molecule', smiles: BENZAL_CHLORIDE, name: NCERT_NAMES[BENZAL_CHLORIDE] },
    product: BENZALDEHYDE,
    outcome: 'aldehyde',
    note: 'Side-chain chlorination gives benzal chloride, and hot water hydrolyses it to the aldehyde. This is the commercial method.',
  },
  {
    start: 'toluene',
    reagent: 'strongOxidant',
    label: 'Strong oxidising agent',
    arrows: [{ reagents: 'strong oxidising agent' }],
    product: BENZOIC_ACID,
    outcome: 'acid',
    note: 'A strong oxidising agent does not stop at the aldehyde: the reaction goes on to benzoic acid.',
  },
  {
    start: 'benzene',
    reagent: 'gattermanKoch',
    label: 'CO, HCl with AlCl₃ or CuCl',
    arrows: [{ reagents: 'CO, HCl', conditions: 'anhydrous AlCl₃ or CuCl' }],
    product: BENZALDEHYDE,
    outcome: 'aldehyde',
    note: 'The Gatterman–Koch reaction puts a CHO group on the ring in one step.',
  },
  {
    start: 'benzene',
    reagent: 'friedelCrafts',
    label: 'CH₃COCl with AlCl₃',
    arrows: [{ reagents: 'CH₃COCl', conditions: 'anhydrous AlCl₃' }],
    product: ACETOPHENONE,
    outcome: 'ketone',
    note: 'Friedel–Crafts acylation with an acyl chloride gives a ketone.',
  },
  {
    start: 'benzoylChloride',
    reagent: 'cadmium',
    label: '(CH₃)₂Cd',
    arrows: [{ reagents: '(CH₃)₂Cd' }],
    product: ACETOPHENONE,
    outcome: 'ketone',
    note: 'A dialkylcadmium reagent converts an acyl chloride into a ketone.',
  },
  {
    start: 'ethanoylChloride',
    reagent: 'cadmium',
    label: '(CH₃)₂Cd',
    arrows: [{ reagents: '(CH₃)₂Cd' }],
    product: PROPANONE,
    outcome: 'ketone',
    note: 'A dialkylcadmium reagent converts an acyl chloride into a ketone.',
  },
  {
    start: 'benzonitrile',
    reagent: 'grignard',
    label: '1. CH₃MgBr, 2. H₃O⁺',
    arrows: [{ reagents: '1. CH₃MgBr' }, { reagents: '2. H₃O⁺' }],
    product: ACETOPHENONE,
    outcome: 'ketone',
    note: 'A nitrile with a Grignard reagent, then hydrolysis, gives a ketone.',
  },
]

/** The reagent sets that apply to a starting material. */
export function routesFrom(start: StartId): readonly Route[] {
  return ROUTES.filter((r) => r.start === start)
}

/** The route for a starting material and reagent set, falling back to the first route for that material. */
export function routeFor(start: StartId, reagent: ReagentId): Route {
  const routes = routesFrom(start)
  return routes.find((r) => r.reagent === reagent) ?? routes[0]
}

/** The one-line answer for the output panel. */
export function outcomeLine(route: Route): string {
  const product = displayName(route.product)
  if (route.outcome === 'acid') return `Goes on to the acid: ${product}.`
  if (route.outcome === 'aldehyde') return `Product: ${product}, an aldehyde.`
  return `Product: ${product}, a ketone.`
}

/** Every molecule the Simulation draws, for the formula tests. */
export const DRAWN_MOLECULES: readonly { smiles: string; formula: string }[] = [
  { smiles: 'CC1=CC=CC=C1', formula: 'C7H8' },
  { smiles: 'C1=CC=CC=C1', formula: 'C6H6' },
  { smiles: BENZALDEHYDE, formula: 'C7H6O' },
  { smiles: BENZOIC_ACID, formula: 'C7H6O2' },
  { smiles: BENZAL_CHLORIDE, formula: 'C7H6Cl2' },
  { smiles: BENZYLIDENE_DIACETATE, formula: 'C11H12O4' },
  { smiles: 'ClC(=O)C1=CC=CC=C1', formula: 'C7H5ClO' },
  { smiles: 'CC(Cl)=O', formula: 'C2H3ClO' },
  { smiles: 'N#CC1=CC=CC=C1', formula: 'C7H5N' },
  { smiles: ACETOPHENONE, formula: 'C8H8O' },
  { smiles: PROPANONE, formula: 'C3H6O' },
]
