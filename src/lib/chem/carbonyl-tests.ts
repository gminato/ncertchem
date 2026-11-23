import { iupacNameFromSmiles } from './iupac-organic'

/**
 * Model for the carbonyl-test rack (Class 12 Unit 8, Section 8.4 (2)-(3)).
 * Every name comes from iupacNameFromSmiles; the SMILES are Kekule and are the only constants here.
 * Mild tests (Tollens', Fehling's) oxidise aldehydes only; iodoform needs a CH3CO or CH3CH(OH) group.
 */

export type CompoundId = 'butanal' | 'benzaldehyde' | 'pentan-3-one' | 'butan-2-one' | 'propan-2-ol'
export type TestId = 'tollens' | 'fehling' | 'iodoform'
export type ReductionId = 'none' | 'hydride' | 'hydrocarbon'
export type Outcome = 'mirror' | 'red-precipitate' | 'yellow-precipitate' | 'no-change'

export const COMPOUNDS: readonly { id: CompoundId; smiles: string }[] = [
  { id: 'butanal', smiles: 'CCCC=O' },
  { id: 'benzaldehyde', smiles: 'O=CC1=CC=CC=C1' },
  { id: 'pentan-3-one', smiles: 'CCC(=O)CC' },
  { id: 'butan-2-one', smiles: 'CCC(C)=O' },
  { id: 'propan-2-ol', smiles: 'CC(C)O' },
]

export const TESTS: readonly { id: TestId; label: string }[] = [
  { id: 'tollens', label: "Tollens'" },
  { id: 'fehling', label: "Fehling's" },
  { id: 'iodoform', label: 'Iodoform' },
]

const OUTCOME: Readonly<Record<CompoundId, Readonly<Record<TestId, Outcome>>>> = {
  butanal: { tollens: 'mirror', fehling: 'red-precipitate', iodoform: 'no-change' },
  benzaldehyde: { tollens: 'mirror', fehling: 'no-change', iodoform: 'no-change' },
  'pentan-3-one': { tollens: 'no-change', fehling: 'no-change', iodoform: 'no-change' },
  'butan-2-one': { tollens: 'no-change', fehling: 'no-change', iodoform: 'yellow-precipitate' },
  'propan-2-ol': { tollens: 'no-change', fehling: 'no-change', iodoform: 'yellow-precipitate' },
}

/** Oxidation product (acid) of the compound in each test that responds. */
const OXIDATION_PRODUCT_SMILES: Readonly<Partial<Record<CompoundId, string>>> = {
  butanal: 'CCCC(O)=O',
  benzaldehyde: 'O=C(O)C1=CC=CC=C1',
  'butan-2-one': 'CCC(O)=O',
  'propan-2-ol': 'CC(O)=O',
}

/** Reduction products: hydride (NaBH₄ or LiAlH₄) gives alcohols; hydrocarbon (Clemmensen or Wolff–Kishner) gives alkanes or alkylbenzenes. */
const REDUCTION_SMILES: Readonly<Record<CompoundId, Readonly<Partial<Record<Exclude<ReductionId, 'none'>, string>>>>> = {
  butanal: { hydride: 'CCCCO', hydrocarbon: 'CCCC' },
  benzaldehyde: { hydride: 'OCC1=CC=CC=C1', hydrocarbon: 'CC1=CC=CC=C1' },
  'pentan-3-one': { hydride: 'CCC(O)CC', hydrocarbon: 'CCCCC' },
  'butan-2-one': { hydride: 'CCC(C)O', hydrocarbon: 'CCCC' },
  'propan-2-ol': {},
}

export function compoundSmiles(id: CompoundId): string {
  const c = COMPOUNDS.find((x) => x.id === id)
  if (!c) throw new Error(`Unknown compound ${id}`)
  return c.smiles
}

export function compoundName(id: CompoundId): string {
  return iupacNameFromSmiles(compoundSmiles(id))
}

/** Acid name to carboxylate name: "propanoic acid" becomes "propanoate". */
export function carboxylateName(acidName: string): string {
  return acidName.replace(/ic acid$/, 'ate')
}

export interface TestResult {
  outcome: Outcome
  /** Name of the oxidation product, or null when nothing happens. */
  productName: string | null
  /** Product as shown after the test (carboxylate ion or sodium salt), or null. */
  productLabel: string | null
}

function resultFor(outcome: Outcome, test: TestId, oxidationSmiles: string | undefined): TestResult {
  if (outcome === 'no-change' || !oxidationSmiles) {
    return { outcome, productName: null, productLabel: null }
  }
  const acid = iupacNameFromSmiles(oxidationSmiles)
  const carboxylate = carboxylateName(acid)
  if (test === 'iodoform') {
    return { outcome, productName: acid, productLabel: `sodium ${carboxylate}` }
  }
  return { outcome, productName: acid, productLabel: `${carboxylate} ion` }
}

export function testResult(compound: CompoundId, test: TestId): TestResult {
  return resultFor(OUTCOME[compound][test], test, OXIDATION_PRODUCT_SMILES[compound])
}

type OutcomeRow = Readonly<Record<TestId, Outcome>>

const NO_CHANGE: OutcomeRow = { tollens: 'no-change', fehling: 'no-change', iodoform: 'no-change' }

/**
 * The three tests on the molecules a reductant can leave in the tubes. Once a compound is reduced
 * the rack tests the product, so these rows are the only results the reduction branch shows.
 * Keys are the Kekulé SMILES that REDUCTION_SMILES and the propan-2-ol row use.
 */
const PRODUCT_TESTS: Readonly<Record<string, { outcome: OutcomeRow; oxidation?: string }>> = {
  'CCCCO': { outcome: NO_CHANGE }, // butan-1-ol
  'CCCC': { outcome: NO_CHANGE }, // butane
  'CCC(O)CC': { outcome: NO_CHANGE }, // pentan-3-ol
  'CCCCC': { outcome: NO_CHANGE }, // pentane
  'OCC1=CC=CC=C1': { outcome: NO_CHANGE }, // benzyl alcohol
  'CC1=CC=CC=C1': { outcome: NO_CHANGE }, // toluene
  'CCC(C)O': {
    // butan-2-ol: CH₃CH(OH) is oxidised to CH₃CO, so iodoform comes out yellow.
    outcome: { tollens: 'no-change', fehling: 'no-change', iodoform: 'yellow-precipitate' },
    oxidation: 'CCC(O)=O',
  },
  'CC(C)O': {
    // propan-2-ol (from propan-2-one and NaBH₄): the same CH₃CH(OH) group, so iodoform is yellow.
    outcome: { tollens: 'no-change', fehling: 'no-change', iodoform: 'yellow-precipitate' },
    oxidation: 'CC(O)=O',
  },
}

/** The three tests run on a molecule by its Kekulé SMILES (a reduction product). */
export function productTestResult(smiles: string, test: TestId): TestResult {
  const row = PRODUCT_TESTS[smiles]
  if (!row) throw new Error(`No test model for ${smiles}`)
  return resultFor(row.outcome[test], test, row.oxidation)
}

export interface ReductionResult {
  smiles: string
  name: string
}

/** Reduction product, or null when the reductant leaves the compound unchanged. */
export function reductionProduct(compound: CompoundId, reduction: ReductionId): ReductionResult | null {
  if (reduction === 'none') return null
  const smiles = REDUCTION_SMILES[compound][reduction]
  if (!smiles) return null
  return { smiles, name: iupacNameFromSmiles(smiles) }
}

/** Result of one test on the compound as it sits in the tube: the reduction product if a reductant changed it. */
export function reducedTestResult(compound: CompoundId, reduction: ReductionId, test: TestId): TestResult {
  const product = reductionProduct(compound, reduction)
  if (!product) return testResult(compound, test)
  return productTestResult(product.smiles, test)
}
