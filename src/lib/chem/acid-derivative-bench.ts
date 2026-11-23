import { parseSmiles, molecularFormula } from './molecule-parse'
import type { MolGraph } from './molecule-graph'
import { unit8Name } from './ncert-c12-unit8-data'

/**
 * Model for the acid-derivative bench: one carboxylic acid R-COOH and one reagent from
 * NCERT's reactions at the C-OH bond and of the COOH group. Each product is a Kekule SMILES
 * whose name comes from unit8Name, so every name is the namer's own output.
 */

/** The acids on offer. `R` is the alkyl part written as SMILES; the acid is R-COOH. */
export const BENCH_ACIDS = [
  { id: 'ethanoic', label: 'Ethanoic', R: 'C' },
  { id: 'propanoic', label: 'Propanoic', R: 'CC' },
  { id: 'butanoic', label: 'Butanoic', R: 'CCC' },
  { id: 'pentanoic', label: 'Pentanoic', R: 'CCCC' },
] as const

export type AcidId = (typeof BENCH_ACIDS)[number]['id']

export const BENCH_REAGENTS = [
  'anhydride',
  'methanol',
  'pcl5',
  'pcl3',
  'socl2',
  'nh3',
  'lialh4',
  'b2h6',
  'nabh4',
  'soda-lime',
] as const

export type ReagentId = (typeof BENCH_REAGENTS)[number]

/** Button and arrow label for each reagent. */
export const REAGENT_LABEL: Readonly<Record<ReagentId, string>> = {
  anhydride: 'Second acid, heat',
  methanol: 'CH₃OH, H⁺',
  pcl5: 'PCl₅',
  pcl3: 'PCl₃',
  socl2: 'SOCl₂',
  nh3: 'NH₃, then heat',
  lialh4: 'LiAlH₄, then H₂O',
  b2h6: 'B₂H₆, then H₂O',
  nabh4: 'NaBH₄',
  'soda-lime': 'NaOH/CaO, heat',
}

/** The bond that breaks: the acid's C–OH, its C–C to the R group, or none. */
export type BondBroken = 'C–OH' | 'C–C' | 'none'

export interface BenchProduct {
  smiles: string
  name: string
  formula: string
  carbons: number
}

export interface BenchOutcome {
  reagent: ReagentId
  conditions: string
  reacts: boolean
  /** The main product (null when there is no reaction). */
  product: BenchProduct | null
  byProducts: readonly string[]
  bondBroken: BondBroken
  carbonsBefore: number
  carbonsAfter: number
  /** One sentence for the readout. Says only what this model shows. */
  note: string
}

const ACID_BY_ID = new Map<string, (typeof BENCH_ACIDS)[number]>(BENCH_ACIDS.map((a) => [a.id, a]))

/** Kekule SMILES of the chosen acid, R-COOH. */
export function acidSmiles(acid: AcidId): string {
  return `${ACID_BY_ID.get(acid)!.R}C(=O)O`
}

/**
 * The namer's name, or a class name where the namer refuses (R24): the anhydride of a
 * longer acid makes two ester groups, which iupacName does not name.
 */
function nameOf(smiles: string, reagent: ReagentId): string {
  try {
    return unit8Name(smiles)
  } catch {
    return reagent === 'anhydride' ? 'acid anhydride' : 'name not shown'
  }
}

function carbonCount(smiles: string): number {
  return parseSmiles(smiles).atoms.filter((a) => a.element === 'C').length
}

function productFor(reagent: ReagentId, R: string): string | null {
  switch (reagent) {
    case 'anhydride':
      return `${R}C(=O)OC(=O)${R}`
    case 'methanol':
      return `${R}C(=O)OC`
    case 'pcl5':
    case 'pcl3':
    case 'socl2':
      return `${R}C(=O)Cl`
    case 'nh3':
      return `${R}C(N)=O`
    case 'lialh4':
    case 'b2h6':
      return `${R}CO`
    case 'nabh4':
      return null
    case 'soda-lime':
      return R
  }
}

interface ReagentFacts {
  conditions: string
  bondBroken: BondBroken
  byProducts: readonly string[]
  note: string
}

const FACTS: Record<ReagentId, ReagentFacts> = {
  anhydride: {
    conditions: 'H₂SO₄ or P₂O₅, heat',
    bondBroken: 'C–OH',
    byProducts: ['H₂O'],
    note: 'Two acid molecules lose one water between them, so the anhydride keeps both acyl groups.',
  },
  methanol: {
    conditions: 'conc. H₂SO₄ as catalyst',
    bondBroken: 'C–OH',
    byProducts: ['H₂O'],
    note: 'The acid OH is replaced by the O of methanol. The acid catalyst is not used up.',
  },
  pcl5: {
    conditions: 'the OH is swapped for Cl',
    bondBroken: 'C–OH',
    byProducts: ['POCl₃', 'HCl'],
    note: 'PCl₅ gives the acyl chloride with POCl₃ and HCl as by-products.',
  },
  pcl3: {
    conditions: 'the OH is swapped for Cl',
    bondBroken: 'C–OH',
    byProducts: ['H₃PO₃'],
    note: 'PCl₃ gives the acyl chloride with phosphorous acid, H₃PO₃, as by-product.',
  },
  socl2: {
    conditions: 'preferred reagent',
    bondBroken: 'C–OH',
    byProducts: ['SO₂', 'HCl'],
    note: 'SOCl₂ is preferred: both by-products, SO₂ and HCl, are gases that leave the mixture.',
  },
  nh3: {
    conditions: 'ammonium salt first, then heat',
    bondBroken: 'C–OH',
    byProducts: ['H₂O'],
    note: 'The ammonium salt forms first. Heating drives off water and gives the amide.',
  },
  lialh4: {
    conditions: 'reduces the COOH group',
    bondBroken: 'C–OH',
    byProducts: [],
    note: 'The carboxyl carbon gains two H atoms and becomes CH₂OH. The carbon count does not change.',
  },
  b2h6: {
    conditions: 'reduces the COOH group',
    bondBroken: 'C–OH',
    byProducts: [],
    note: 'Diborane also reduces the COOH group. It does not easily reduce ester, nitro or halo groups.',
  },
  nabh4: {
    conditions: 'does not reduce COOH',
    bondBroken: 'none',
    byProducts: [],
    note: 'Sodium borohydride does not reduce a carboxylic acid, so nothing changes.',
  },
  'soda-lime': {
    conditions: 'on the sodium salt; NaOH : CaO = 3 : 1',
    bondBroken: 'C–C',
    byProducts: ['Na₂CO₃'],
    note: 'Heating the sodium salt with soda-lime removes the carboxyl carbon as carbonate, so the product has one carbon fewer.',
  },
}

/** Outcome of one reagent on one acid. */
export function benchOutcome(acid: AcidId, reagent: ReagentId): BenchOutcome {
  const R = ACID_BY_ID.get(acid)!.R
  const facts = FACTS[reagent]
  const smiles = productFor(reagent, R)
  const carbonsBefore = carbonCount(acidSmiles(acid))
  const product: BenchProduct | null = smiles
    ? {
        smiles,
        name: nameOf(smiles, reagent),
        formula: molecularFormula(parseSmiles(smiles)),
        carbons: carbonCount(smiles),
      }
    : null
  return {
    reagent,
    conditions: facts.conditions,
    reacts: product !== null,
    product,
    byProducts: facts.byProducts,
    bondBroken: facts.bondBroken,
    carbonsBefore,
    carbonsAfter: product ? product.carbons : carbonsBefore,
    note: facts.note,
  }
}

/**
 * Bond indices to shade in the acid drawing: the C–OH single bond (carboxyl C to its
 * OH oxygen) or the C–C bond (carboxyl C to the R group). Empty for 'none'.
 */
export function highlightedBonds(g: MolGraph, kind: BondBroken): number[] {
  if (kind === 'none') return []
  const carboxylC = g.atoms.findIndex(
    (atom, i) =>
      atom.element === 'C' &&
      g.bonds.some((b) => (b.a === i || b.b === i) && b.order === 2 && g.atoms[b.a === i ? b.b : b.a].element === 'O'),
  )
  const wanted = kind === 'C–OH' ? 'O' : 'C'
  return g.bonds.flatMap((b, k) => {
    if (b.order !== 1) return []
    const other = b.a === carboxylC ? b.b : b.b === carboxylC ? b.a : -1
    return other >= 0 && g.atoms[other].element === wanted ? [k] : []
  })
}
