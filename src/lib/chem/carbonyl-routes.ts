import { CARBONYL_PREPARATIONS, unit8Name } from './ncert-c12-unit8-data'

/** The starting-material classes the route finder offers. */
export type SubstrateClass = 'alcohol' | 'alkene' | 'alkyne' | 'acylChloride' | 'nitrile' | 'ester'

/** The reagent sets the route finder offers, each one a route named in this Section. */
export type ReagentId = 'oxidise' | 'agCu' | 'ozone' | 'hydration' | 'rosenmund' | 'stephen' | 'dibal'

export interface ClassInfo {
  readonly cls: SubstrateClass
  readonly label: string
  readonly compounds: readonly string[]
}

/** Starting compounds (Kekulé SMILES), grouped by class. Names come from unit8Name. */
export const CLASSES: readonly ClassInfo[] = [
  { cls: 'alcohol', label: 'Alcohol', compounds: ['CCCCO', 'CCC(O)CC', 'CO'] },
  { cls: 'alkene', label: 'Alkene', compounds: ['CC(C)=CC'] },
  { cls: 'alkyne', label: 'Alkyne', compounds: ['C#C', 'CC#CC'] },
  { cls: 'acylChloride', label: 'Acyl chloride', compounds: ['CCCC(=O)Cl'] },
  { cls: 'nitrile', label: 'Nitrile', compounds: ['CCCCC#N'] },
  { cls: 'ester', label: 'Ester', compounds: ['CCCC(=O)OCC'] },
]

export interface ReagentInfo {
  readonly id: ReagentId
  /** Written over the arrow. */
  readonly label: string
  /** Why a compound outside this reagent's class gets no product (in NCERT's terms). */
  readonly needs: string
}

/** Reagent sets, with labels taken from CARBONYL_PREPARATIONS where the data lib has them. */
export const REAGENTS: readonly ReagentInfo[] = [
  { id: 'oxidise', label: '[O]', needs: 'Oxidation with [O] needs an alcohol.' },
  { id: 'agCu', label: CARBONYL_PREPARATIONS.dehydrogenation.reagent, needs: 'Dehydrogenation over Ag or Cu needs an alcohol.' },
  { id: 'ozone', label: CARBONYL_PREPARATIONS.ozonolysis.reagent, needs: 'Ozonolysis needs a C=C double bond.' },
  { id: 'hydration', label: CARBONYL_PREPARATIONS.alkyneHydration.reagent, needs: 'Hydration with H₂SO₄ and HgSO₄ needs a C≡C triple bond.' },
  { id: 'rosenmund', label: CARBONYL_PREPARATIONS.rosenmund.reagent, needs: `${CARBONYL_PREPARATIONS.rosenmund.name} starts from an ${CARBONYL_PREPARATIONS.rosenmund.from}.` },
  { id: 'stephen', label: CARBONYL_PREPARATIONS.stephen.reagent, needs: `${CARBONYL_PREPARATIONS.stephen.name} starts from a nitrile.` },
  { id: 'dibal', label: CARBONYL_PREPARATIONS.dibalEster.reagent, needs: 'DIBAL-H then H₂O works on a nitrile or an ester.' },
]

export interface Route {
  readonly smiles: string
  readonly reagent: ReagentId
  /** Products as Kekulé SMILES, or plain formulas for small by-products (H₂, H₂O, HCl). */
  readonly products: readonly string[]
}

/** Every route this Section draws. Anything not listed gets no product. */
export const ROUTES: readonly Route[] = [
  { smiles: 'CCCCO', reagent: 'oxidise', products: ['CCCC=O', 'H₂O'] },
  { smiles: 'CCC(O)CC', reagent: 'oxidise', products: ['CCC(=O)CC', 'H₂O'] },
  { smiles: 'CO', reagent: 'oxidise', products: ['C=O', 'H₂O'] },
  { smiles: 'CO', reagent: 'agCu', products: ['C=O', 'H₂'] },
  { smiles: 'CC(C)=CC', reagent: 'ozone', products: ['CC(C)=O', 'CC=O'] },
  { smiles: 'C#C', reagent: 'hydration', products: ['CC=O'] },
  { smiles: 'CC#CC', reagent: 'hydration', products: ['CCC(C)=O'] },
  { smiles: 'CCCC(=O)Cl', reagent: 'rosenmund', products: ['CCCC=O', 'HCl'] },
  { smiles: 'CCCCC#N', reagent: 'stephen', products: ['CCCCC=O'] },
  { smiles: 'CCCCC#N', reagent: 'dibal', products: ['CCCCC=O'] },
  { smiles: 'CCCC(=O)OCC', reagent: 'dibal', products: ['CCCC=O'] },
]

export type Outcome =
  | { kind: 'product'; products: readonly string[]; names: readonly string[]; reagent: string }
  | { kind: 'none'; reason: string; reagent: string }

/** The product (or the reason there is none) for a compound and a reagent set. */
export function outcome(smiles: string, reagentId: ReagentId): Outcome {
  const reagent = REAGENTS.find((r) => r.id === reagentId)
  if (!reagent) throw new Error(`Unknown reagent ${reagentId}`)
  const route = ROUTES.find((r) => r.smiles === smiles && r.reagent === reagentId)
  if (!route) return { kind: 'none', reason: reagent.needs, reagent: reagent.label }
  return {
    kind: 'product',
    products: route.products,
    names: route.products.map(nameOfSpecies),
    reagent: reagent.label,
  }
}

/** Small by-products are written as their formula; organic products get their namer name. */
export const BYPRODUCTS: readonly string[] = ['H₂', 'H₂O', 'HCl']

export function nameOfSpecies(species: string): string {
  return BYPRODUCTS.includes(species) ? species : unit8Name(species)
}

/**
 * One- and two-carbon species, and the alkynes, are drawn as condensed text: a skeletal line with
 * no carbon at its end would hide the carbon (C₁ and C₂ read as fragments). Keyed by SMILES.
 */
export const CONDENSED_TEXT: Readonly<Record<string, string>> = {
  CO: 'CH₃OH',
  'C=O': 'HCHO',
  'C#C': 'HC≡CH',
  'CC#CC': 'CH₃C≡CCH₃',
}
