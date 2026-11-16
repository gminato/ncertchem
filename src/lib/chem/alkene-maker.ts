/**
 * The alkene maker of NCERT Section 9.3.4 (Preparation of alkenes). Given a starting compound and a
 * reagent, it decides whether the reagent gives an alkene from that compound, and if it does, asks
 * hydrocarbon-reactions for the products. A pair that does not react gets a reason, not a product.
 *
 * Every product, name, equation and condition comes from the libraries. This file only chooses the
 * model (elimination, dehalogenation, dehydration or reduction) and words the reasons.
 */

import type { MolGraph } from './molecule-graph'
import { molecularFormula, parseSmiles } from './molecule-parse'
import { iupacName } from './iupac-organic'
import { dehalogenate, dehydrate, eliminate, hydrogenate, type Reaction } from './hydrocarbon-reactions'
import { halogensOf, heavyNeighbours } from './hydrocarbon-species'

/** The reagents the Section names for making alkenes. */
export type AlkeneReagent = 'alcoholic-koh' | 'zinc' | 'conc-h2so4' | 'lindlar' | 'sodium-ammonia'

/** The starting compounds the maker accepts. */
export type StartingKind = 'alkyl-halide' | 'vicinal-dihalide' | 'alcohol' | 'alkyne' | 'other'

/** A reagent as the picker shows it. `label` is written for display (mhchem is not used in the picker). */
export interface AlkeneReagentOption {
  id: AlkeneReagent
  label: string
  /** The NCERT condition id in NCERT_UNIT9_CONDITIONS, used for the product card. */
  conditionId: string
}

export const ALKENE_REAGENTS: readonly AlkeneReagentOption[] = [
  { id: 'alcoholic-koh', label: 'Alcoholic KOH, heat', conditionId: 'dehydrohalogenation' },
  { id: 'zinc', label: 'Zinc', conditionId: 'dehalogenation' },
  { id: 'conc-h2so4', label: 'Conc. H₂SO₄, heat', conditionId: 'dehydration' },
  { id: 'lindlar', label: 'H₂, Lindlar catalyst', conditionId: 'lindlar' },
  { id: 'sodium-ammonia', label: 'Na in liquid NH₃', conditionId: 'sodium-ammonia' },
]

/** A starting compound in the picker: its SMILES, and the name the lib gives it (never typed by hand). */
export interface AlkeneCase {
  id: string
  smiles: string
}

/** The starting compounds of the simulation, one or more for each kind of starting compound. */
export const ALKENE_CASES: readonly AlkeneCase[] = [
  { id: 'bromoethane', smiles: 'CCBr' },
  { id: '2-bromobutane', smiles: 'CCC(C)Br' },
  { id: '2-bromo-2-methylbutane', smiles: 'CCC(C)(C)Br' },
  { id: 'bromomethane', smiles: 'CBr' },
  { id: '1,2-dibromoethane', smiles: 'BrCCBr' },
  { id: '1,2-dibromobutane', smiles: 'CCC(Br)CBr' },
  { id: 'ethanol', smiles: 'CCO' },
  { id: '2-methylbutan-2-ol', smiles: 'CCC(C)(C)O' },
  { id: 'but-2-yne', smiles: 'CC#CC' },
  { id: 'pent-2-yne', smiles: 'CCC#CC' },
]

/** One β-carbon of a starting compound: the carbon next to the α-carbon, and its hydrogens. */
export interface BetaSite {
  carbon: number
  hydrogens: number
}

/** What the maker found in the starting compound. */
export interface AlkeneStart {
  kind: StartingKind
  name: string
  formula: string
  /** The leaving atom (halogen or the oxygen of –OH), when there is one. */
  leaving?: number
  /** The α-carbon: the carbon that carries the leaving group. */
  alpha?: number
  /** The β-carbons with hydrogens. Empty for a molecule with no leaving group. */
  betaSites: BetaSite[]
}

/** The result of asking for an alkene. */
export type AlkeneOutcome =
  | { kind: 'reaction'; start: AlkeneStart; reaction: Reaction }
  | { kind: 'no-reaction'; start: AlkeneStart; reason: string }
  | { kind: 'not-modelled'; start: AlkeneStart; reason: string }

/** The kind of a starting compound, from its functional groups. */
export function classifyStart(g: MolGraph): StartingKind {
  if (g.bonds.some((b) => b.order === 3)) return 'alkyne'
  const hal = halogensOf(g)
  if (hal.length === 2 && isVicinal(g, hal[0], hal[1])) return 'vicinal-dihalide'
  if (hal.length === 1) return 'alkyl-halide'
  if (alcoholOxygen(g) >= 0) return 'alcohol'
  return 'other'
}

/** Two halogens on adjacent carbons. */
function isVicinal(g: MolGraph, p: number, q: number): boolean {
  const cp = heavyNeighbours(g, p)[0]?.atom
  const cq = heavyNeighbours(g, q)[0]?.atom
  return cp !== undefined && cq !== undefined && heavyNeighbours(g, cp).some((n) => n.atom === cq)
}

/** The oxygen of an –OH group (one hydrogen, one heavy neighbour), or −1. */
function alcoholOxygen(g: MolGraph): number {
  return g.atoms.findIndex((a, i) => a.element === 'O' && (a.hCount ?? 0) === 1 && heavyNeighbours(g, i).length === 1)
}

/** The β-carbons of a leaving group: carbons next to the α-carbon that carry at least one hydrogen. */
export function betaSites(g: MolGraph, leaving: number): BetaSite[] {
  const alpha = heavyNeighbours(g, leaving)[0]?.atom
  if (alpha === undefined) return []
  return heavyNeighbours(g, alpha)
    .filter((n) => g.atoms[n.atom].element === 'C' && (g.atoms[n.atom].hCount ?? 0) > 0)
    .map((n) => ({ carbon: n.atom, hydrogens: g.atoms[n.atom].hCount ?? 0 }))
}

/** The starting compound's facts: kind, name, formula and its leaving group. Names come from the lib. */
export function describeStart(g: MolGraph): AlkeneStart {
  const kind = classifyStart(g)
  let name = 'not named'
  try {
    name = iupacName(g)
  } catch {
    name = 'not named'
  }
  const base = { kind, name, formula: molecularFormula(g), betaSites: [] as BetaSite[] }
  if (kind === 'alkyl-halide') {
    const leaving = halogensOf(g)[0]
    const alpha = heavyNeighbours(g, leaving)[0]?.atom
    return { ...base, leaving, alpha, betaSites: betaSites(g, leaving) }
  }
  if (kind === 'alcohol') {
    const leaving = alcoholOxygen(g)
    const alpha = heavyNeighbours(g, leaving)[0]?.atom
    return { ...base, leaving, alpha, betaSites: betaSites(g, leaving) }
  }
  return base
}

/**
 * The lib writes the zinc salt as ZnX2 (a placeholder). This replaces it with the halide of the
 * substrate (ZnBr2 from a dibromide), in the equation strings only, so the product is unchanged.
 */
function withZincHalide(reaction: Reaction, g: MolGraph): Reaction {
  const x = g.atoms[halogensOf(g)[0]].element
  const fix = (text: string) => text.replace('ZnX2', `Zn${x}2`)
  return { ...reaction, equation: fix(reaction.equation), equations: reaction.equations.map(fix), why: fix(reaction.why) }
}

const REASON_NO_BETA = 'The carbon that carries the halogen has no neighbour with a hydrogen, so no β-hydrogen can leave and no alkene forms. Bromomethane is one example.'

/**
 * The alkene that a reagent gives from a starting compound (SMILES). Returns the reaction, or the
 * reason why the pair does not react, or why this Section does not model it.
 */
export function makeAlkenes(smiles: string, reagent: AlkeneReagent): AlkeneOutcome {
  const g = parseSmiles(smiles)
  const start = describeStart(g)
  const none = (reason: string): AlkeneOutcome => ({ kind: 'no-reaction', start, reason })

  switch (reagent) {
    case 'alcoholic-koh': {
      if (start.kind === 'alkyl-halide') {
        try {
          return { kind: 'reaction', start, reaction: eliminate(g) }
        } catch {
          return none(REASON_NO_BETA)
        }
      }
      if (start.kind === 'vicinal-dihalide') {
        return {
          kind: 'not-modelled',
          start,
          reason: 'With alcoholic KOH a vicinal dihalide loses a second molecule of HX and gives an alkyne. That second elimination belongs to the alkynes Section, so it is not modelled here. Zinc gives the alkene.',
        }
      }
      if (start.kind === 'alcohol') return none('Alcoholic KOH does not remove water from an alcohol: the –OH is a poor leaving group. Conc. H₂SO₄ does.')
      if (start.kind === 'alkyne') return none('An alkyne has no halogen and no –OH, so there is nothing to eliminate.')
      return none('This compound has no halogen to eliminate with alcoholic KOH.')
    }
    case 'zinc': {
      if (start.kind === 'vicinal-dihalide') return { kind: 'reaction', start, reaction: withZincHalide(dehalogenate(g), g) }
      if (start.kind === 'alkyl-halide') {
        return none('Zinc takes two halogens from adjacent carbons. A single C–X bond gives no alkene with zinc alone.')
      }
      return none('Zinc makes an alkene only from a vicinal dihalide, two halogens on adjacent carbons.')
    }
    case 'conc-h2so4': {
      if (start.kind === 'alcohol') return { kind: 'reaction', start, reaction: dehydrate(g) }
      return none('Conc. H₂SO₄ removes water from an alcohol. This compound has no –OH group, so it gives no alkene.')
    }
    case 'lindlar':
    case 'sodium-ammonia': {
      if (start.kind !== 'alkyne') {
        return none('Lindlar catalyst and sodium in liquid ammonia reduce a C≡C bond to C=C. This compound has no triple bond.')
      }
      try {
        const mode = reagent === 'lindlar' ? 'lindlar' : 'sodium-ammonia'
        return { kind: 'reaction', start, reaction: hydrogenate(g, { alkyne: mode }) }
      } catch {
        return { kind: 'not-modelled', start, reason: 'This model reduces one triple bond. Two triple bonds are not modelled here.' }
      }
    }
  }
}
