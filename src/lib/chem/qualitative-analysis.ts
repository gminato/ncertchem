/**
 * Qualitative analysis of an organic compound (NCERT Class 11 Unit 8, Section 8.9): which
 * elements a compound holds, and what each test shows. The element set comes from the parsed
 * molecule, so every observation follows from the compound's own atoms.
 *
 * Model of the sodium fusion (Lassaigne's test):
 * - N, S and halogens are converted to NaCN, Na₂S and NaX.
 * - With N and S both present and sodium in the ordinary amount, the sulphur is held as
 *   thiocyanate (NaSCN), not as sulphide. Thiocyanate gives the blood-red colour and no free
 *   cyanide, so the Prussian blue test is negative.
 * - With an excess of sodium, NaSCN + 2Na → NaCN + Na₂S: cyanide and sulphide are both free, so
 *   the Prussian blue and the sulphide tests are positive and the blood-red test is negative.
 *
 * Boiling the extract with concentrated HNO₃ destroys CN⁻ and S²⁻ (and SCN⁻), so the halide
 * precipitate then shows its own colour. Without boiling, silver nitrate also precipitates
 * AgCN (white), AgSCN (white) or Ag₂S (black), and the colour cannot be read.
 *
 * Phosphorus is tested on its own (sodium peroxide fusion), not on the sodium fusion extract.
 */

import { molecularFormula, parseSmiles } from './molecule-parse'
import type { MolGraph } from './molecule-graph'

/** The elements this section tests for, in the order the answer sheet lists them. */
export const QUALITATIVE_ELEMENTS = ['C', 'H', 'N', 'S', 'P', 'Cl', 'Br', 'I'] as const
export type QualitativeElement = (typeof QUALITATIVE_ELEMENTS)[number]

const HALOGENS: readonly QualitativeElement[] = ['Cl', 'Br', 'I']

/** Elements of a molecule restricted to the tested set. Hydrogen counts when any atom carries one. */
export function testedElements(g: MolGraph): Set<QualitativeElement> {
  const found = new Set<QualitativeElement>()
  for (const atom of g.atoms) {
    if ((QUALITATIVE_ELEMENTS as readonly string[]).includes(atom.element)) {
      found.add(atom.element as QualitativeElement)
    }
    if ((atom.hCount ?? 0) > 0) found.add('H')
  }
  return found
}

/** An unknown compound for the element detective: a SMILES and the elements it holds. */
export interface UnknownCompound {
  id: string
  smiles: string
  formula: string
  elements: readonly QualitativeElement[]
}

/** The unknown compounds. Each holds at most one halogen kind, so one silver halide shows. */
const UNKNOWN_SMILES: readonly { id: string; smiles: string }[] = [
  { id: 'ethanol', smiles: 'CCO' },
  { id: 'carbon-tetrachloride', smiles: 'ClC(Cl)(Cl)Cl' },
  { id: 'dichloromethane', smiles: 'ClCCl' },
  { id: 'bromobenzene', smiles: 'BrC1=CC=CC=C1' },
  { id: 'iodomethane', smiles: 'CI' },
  { id: 'aniline', smiles: 'NC1=CC=CC=C1' },
  { id: 'acetamide', smiles: 'CC(N)=O' },
  { id: 'thiourea', smiles: 'NC(N)=S' },
  { id: 'thioacetamide', smiles: 'CC(=S)N' },
  { id: 'methanethiol', smiles: 'CS' },
  { id: 'thiophenol', smiles: 'SC1=CC=CC=C1' },
  { id: 'trimethylphosphine', smiles: 'CP(C)C' },
  { id: 'phenol', smiles: 'OC1=CC=CC=C1' },
  { id: '4-bromoaniline', smiles: 'NC1=CC=C(Br)C=C1' },
  { id: '2-iodopropane', smiles: 'CC(C)I' },
  { id: 'chloroform', smiles: 'ClC(Cl)Cl' },
]

/** Builds the unknown list from the SMILES, so each element list comes from the parser. */
export function unknownCompounds(): readonly UnknownCompound[] {
  return UNKNOWN_SMILES.map(({ id, smiles }) => {
    const g = parseSmiles(smiles)
    const elements = QUALITATIVE_ELEMENTS.filter((e) => testedElements(g).has(e))
    return { id, smiles, formula: molecularFormula(g), elements }
  })
}

/** How the sodium fusion was done. */
export type Fusion = 'standard' | 'excess'

/** The ions in the sodium fusion extract, given the elements of the compound. */
export interface FusionExtract {
  cyanide: boolean
  thiocyanate: boolean
  sulphide: boolean
  /** The halide, if the compound holds one. */
  halide: 'Cl' | 'Br' | 'I' | null
}

/** The ions the fusion leaves in the extract. */
export function fuse(elements: ReadonlySet<QualitativeElement>, fusion: Fusion): FusionExtract {
  const N = elements.has('N')
  const S = elements.has('S')
  const halide = HALOGENS.find((h) => elements.has(h)) ?? null
  const thiocyanate = N && S && fusion === 'standard'
  return {
    cyanide: N && (!S || fusion === 'excess'),
    thiocyanate,
    sulphide: S && (!N || fusion === 'excess'),
    halide: halide === null ? null : (halide as 'Cl' | 'Br' | 'I'),
  }
}

/** The tests a learner can run on the unknown. */
export type TestId =
  | 'lime-water'
  | 'copper-sulphate'
  | 'prussian-blue'
  | 'lead-acetate'
  | 'nitroprusside'
  | 'blood-red'
  | 'silver-nitrate'
  | 'phosphorus'

/** The outcome of one test: whether it shows a positive result, and the colour it shows. */
export interface TestOutcome {
  positive: boolean
  /** True when a precipitate or colour appears that cannot be read as the halide. */
  masked: boolean
  /** The halide named by a clear silver precipitate, if any. */
  halide: 'Cl' | 'Br' | 'I' | null
}

/** Runs one test on the unknown. Extract tests take the fusion extract; the others use the compound. */
export function runTest(
  test: TestId,
  elements: ReadonlySet<QualitativeElement>,
  extract: FusionExtract,
  boiledWithNitric: boolean
): TestOutcome {
  const none: TestOutcome = { positive: false, masked: false, halide: null }
  switch (test) {
    case 'lime-water':
      return { ...none, positive: elements.has('C') }
    case 'copper-sulphate':
      return { ...none, positive: elements.has('H') }
    case 'prussian-blue':
      return { ...none, positive: extract.cyanide }
    case 'lead-acetate':
      return { ...none, positive: extract.sulphide }
    case 'nitroprusside':
      return { ...none, positive: extract.sulphide }
    case 'blood-red':
      return { ...none, positive: extract.thiocyanate }
    case 'silver-nitrate': {
      const interfering = extract.cyanide || extract.thiocyanate || extract.sulphide
      if (interfering && !boiledWithNitric) return { ...none, masked: true }
      if (extract.halide === null) return none
      return { positive: true, masked: false, halide: extract.halide }
    }
    case 'phosphorus':
      return { ...none, positive: elements.has('P') }
  }
}

/** Halide colours, from NCERT: white (Cl), pale yellow (Br), yellow (I). */
export const HALIDE_PRECIPITATE: Record<'Cl' | 'Br' | 'I', { colour: string; soluble: boolean }> = {
  Cl: { colour: 'white', soluble: true },
  Br: { colour: 'pale yellow', soluble: false },
  I: { colour: 'yellow', soluble: false },
}

/** Elements evidenced by the tests run so far. Nitrogen and sulphur can each show in two tests. */
export function evidenceFor(results: Partial<Record<TestId, TestOutcome>>): Set<QualitativeElement> {
  const found = new Set<QualitativeElement>()
  if (results['lime-water']?.positive) found.add('C')
  if (results['copper-sulphate']?.positive) found.add('H')
  if (results['prussian-blue']?.positive || results['blood-red']?.positive) found.add('N')
  if (results['lead-acetate']?.positive || results.nitroprusside?.positive || results['blood-red']?.positive) found.add('S')
  if (results.phosphorus?.positive) found.add('P')
  const halide = results['silver-nitrate']
  if (halide?.positive && halide.halide) found.add(halide.halide)
  return found
}

/**
 * Scores a learner's answer against the true elements. One point for each tested element that
 * is ticked when present, or left unticked when absent.
 */
export function scoreAnswer(
  truth: ReadonlySet<QualitativeElement>,
  answer: ReadonlySet<QualitativeElement>
): { correct: number; total: number; wrong: QualitativeElement[] } {
  const wrong = QUALITATIVE_ELEMENTS.filter((e) => truth.has(e) !== answer.has(e))
  return { correct: QUALITATIVE_ELEMENTS.length - wrong.length, total: QUALITATIVE_ELEMENTS.length, wrong }
}
