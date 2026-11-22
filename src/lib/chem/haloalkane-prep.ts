/**
 * Routes from a starting material to a haloalkane, for the Haloalkane Prep Bench (Unit 6, Section 6.4).
 * Every name comes from iupacNameFromSmiles, every formula from molecularFormula, and every isomer list
 * from monohaloIsomers. Only the molecules and reagents the Section's prose uses appear here.
 */
import { iupacNameFromSmiles } from './iupac-organic'
import { molecularFormula, parseSmiles } from './molecule-parse'
import { formulaUnicode, monohaloIsomers } from './haloalkanes'

export type StartingId = 'butanol' | 'tert-butanol' | 'butene' | 'butane' | 'chlorobutane' | 'bromobutane'
export type ReagentId = 'hbr' | 'socl2' | 'hcl' | 'cl2' | 'br2-ccl4' | 'nai' | 'agf'
export type ByProductState = 'gas' | 'solid' | 'liquid'
export type Verdict = 'single' | 'major' | 'mixture'

export interface StartingSpec {
  id: StartingId
  smiles: string
  kind: 'alcohol' | 'alkene' | 'alkane' | 'haloalkane'
  /** Short class tag shown beside the name, e.g. "1°". Empty when the class needs no tag. */
  tag: string
}

export interface Compound {
  smiles: string
  name: string
  formula: string
}

export interface ByProduct {
  formula: string
  state: ByProductState
  /** Short phrase shown on the bench, e.g. "escapes as a gas". */
  text: string
}

export interface PrepOutcome {
  products: readonly Compound[]
  byProducts: readonly ByProduct[]
  verdict: Verdict
  verdictText: string
}

export const STARTING: readonly StartingSpec[] = [
  { id: 'butanol', smiles: 'CCCCO', kind: 'alcohol', tag: '1°' },
  { id: 'tert-butanol', smiles: 'CC(C)(C)O', kind: 'alcohol', tag: '3°' },
  { id: 'butene', smiles: 'C=CCC', kind: 'alkene', tag: '' },
  { id: 'butane', smiles: 'CCCC', kind: 'alkane', tag: '' },
  { id: 'chlorobutane', smiles: 'CCCCCl', kind: 'haloalkane', tag: '' },
  { id: 'bromobutane', smiles: 'CCCCBr', kind: 'haloalkane', tag: '' },
]

export const REAGENT_LABEL: Readonly<Record<ReagentId, string>> = {
  hbr: 'HBr (48 %)',
  socl2: 'SOCl₂',
  hcl: 'Conc. HCl, room temperature',
  cl2: 'Cl₂ in light',
  'br2-ccl4': 'Br₂ in CCl₄',
  nai: 'NaI in dry acetone',
  agf: 'AgF',
}

/** The reagents that act on each starting material. Any other pairing does nothing on the bench. */
export const REAGENTS_FOR: Readonly<Record<StartingId, readonly ReagentId[]>> = {
  butanol: ['hbr', 'socl2'],
  'tert-butanol': ['hcl'],
  butene: ['hbr', 'br2-ccl4'],
  butane: ['cl2'],
  chlorobutane: ['nai', 'agf'],
  bromobutane: ['nai', 'agf'],
}

export function startingSpec(id: StartingId): StartingSpec {
  const spec = STARTING.find((s) => s.id === id)
  if (!spec) throw new Error(`Unknown starting material: ${id}`)
  return spec
}

export function compoundOf(smiles: string): Compound {
  return {
    smiles,
    name: iupacNameFromSmiles(smiles),
    formula: formulaUnicode(molecularFormula(parseSmiles(smiles))),
  }
}

/** The IUPAC name of a starting material, as the namer prints it. */
export function startingName(id: StartingId): string {
  return compoundOf(startingSpec(id).smiles).name
}

function one(smiles: string, byProducts: ByProduct[], verdict: Verdict, verdictText: string): PrepOutcome {
  return { products: [compoundOf(smiles)], byProducts, verdict, verdictText }
}

const WATER_LIQUID: ByProduct = { formula: 'H₂O', state: 'liquid', text: 'stays in the flask' }

/**
 * The outcome of a starting material with a reagent, or null when that reagent does not act on it.
 * The result gives the product(s), the by-products with their state, and a purity verdict.
 */
export function prepOutcome(start: StartingId, reagent: ReagentId): PrepOutcome | null {
  if (!REAGENTS_FOR[start].includes(reagent)) return null
  switch (`${start}|${reagent}`) {
    case 'butanol|hbr':
      return one(
        'CCCCBr',
        [WATER_LIQUID],
        'single',
        'One product, 1-bromobutane. The water stays in the flask.'
      )
    case 'butanol|socl2':
      return one(
        'CCCCCl',
        [
          { formula: 'SO₂', state: 'gas', text: 'escapes as a gas' },
          { formula: 'HCl', state: 'gas', text: 'escapes as a gas' },
        ],
        'single',
        'One product, 1-chlorobutane. Both by-products are gases, so the liquid product is left pure.'
      )
    case 'tert-butanol|hcl':
      return one(
        'CC(C)(C)Cl',
        [WATER_LIQUID],
        'single',
        'One product, 2-chloro-2-methylpropane. The tertiary alcohol reacts at room temperature.'
      )
    case 'butene|hbr':
      return one(
        'CCC(C)Br',
        [],
        'major',
        'Markovnikov addition: 2-bromobutane is the major product, with the H on the terminal carbon.'
      )
    case 'butene|br2-ccl4':
      return one(
        'BrCC(Br)CC',
        [],
        'single',
        'One product, 1,2-dibromobutane. The red-brown bromine is used up, so the colour fades.'
      )
    case 'butane|cl2':
      return {
        products: monohaloIsomers('CCCC', 'Cl').map((m) => compoundOf(m.smiles)),
        byProducts: [{ formula: 'HCl', state: 'gas', text: 'escapes as a gas' }],
        verdict: 'mixture',
        verdictText:
          'A mixture of isomeric chloroalkanes, hard to separate. Polychlorinated products form too, so each yield is low.',
      }
    case 'chlorobutane|nai':
      return one(
        'CCCCI',
        [{ formula: 'NaCl', state: 'solid', text: 'settles as a precipitate' }],
        'single',
        'One product, 1-iodobutane. NaCl is insoluble in dry acetone and settles out.'
      )
    case 'bromobutane|nai':
      return one(
        'CCCCI',
        [{ formula: 'NaBr', state: 'solid', text: 'settles as a precipitate' }],
        'single',
        'One product, 1-iodobutane. NaBr is insoluble in dry acetone and settles out.'
      )
    case 'chlorobutane|agf':
      return one(
        'CCCCF',
        [{ formula: 'AgCl', state: 'solid', text: 'stays behind as a solid' }],
        'single',
        'One product, 1-fluorobutane. The silver chloride stays behind as an insoluble solid.'
      )
    case 'bromobutane|agf':
      return one(
        'CCCCF',
        [{ formula: 'AgBr', state: 'solid', text: 'stays behind as a solid' }],
        'single',
        'One product, 1-fluorobutane. The silver bromide stays behind as an insoluble solid.'
      )
    default:
      return null
  }
}
