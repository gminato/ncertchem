/**
 * Worked examples for Unit 8, Section 8.4: the molecules of the functional-group sorter and the
 * alcohol homologous series. Each molecule is a SMILES string; its class, functional group, name
 * and formula come from the lib (classification.ts, iupac-organic.ts, molecule-parse.ts). Only the
 * boiling-point column is data, and it is labelled as such where it is used.
 */

import { iupacName } from './iupac-organic'
import { molecularFormula, parseSmiles } from './molecule-parse'
import type { MolGraph } from './molecule-graph'
import { classifyMolecule, functionalGroups, principalGroup, type GroupId, type RingClass } from './classification'

/** One card of the functional-group sorter, with its answer from the lib. */
export interface SorterCard {
  smiles: string
  graph: MolGraph
  formula: string
  /** The class of the molecule: acyclic, alicyclic, aromatic or heterocyclic. */
  ringClass: RingClass
  /** The principal functional group, or 'none' for a hydrocarbon. */
  group: GroupId | 'none'
  /** The atoms of the principal group (empty for 'none'), used to highlight it. */
  groupAtoms: number[]
  /** The IUPAC name from the lib, or null where iupacName does not name the molecule. */
  name: string | null
}

/** Options for the group answer, in display order. */
export const SORTER_GROUP_OPTIONS: readonly (GroupId | 'none')[] = [
  'none',
  'alkene',
  'alkyne',
  'alkyl halide',
  'alcohol',
  'phenol',
  'ether',
  'amine',
  'aldehyde',
  'ketone',
  'carboxylic acid',
  'ester',
  'amide',
  'nitrile',
]

/** The sorter's molecules, in the order they are dealt. Mixed, so no class comes in a run. */
export const SORTER_SMILES: readonly string[] = [
  'CC(=O)O',
  'C1=CC=CC=C1',
  'C1CCOC1',
  'O=C1CCCCC1',
  'CCCCCC',
  'NC1=CC=CC=C1',
  'C1=CSC=C1',
  'OC1CCCCC1',
  'CCOC(C)=O',
  'O=C1C=CC=CC=C1',
  'C1=CCCCC1',
  'CC(C)O',
  'C1=CC=NC=C1',
  'O=C(O)C1=CC=CC=C1',
  'C1CCCCC1',
  'C1CCNC1',
  'OC1=CC=CC=C1',
  'CC(C)=O',
  'C1=COC=C1',
]

/** A safe IUPAC name: iupacName throws for some rings it does not handle, which then show no name. */
export function safeName(g: MolGraph): string | null {
  try {
    return iupacName(g)
  } catch {
    return null
  }
}

/** The sorter's answer for one SMILES string, from the lib. */
export function sorterCard(smiles: string): SorterCard {
  const graph = parseSmiles(smiles)
  const hits = functionalGroups(graph)
  const principal = principalGroup(hits)
  const groupAtoms = principal ? (hits.find((h) => h.group === principal)?.atoms ?? []) : []
  return {
    smiles,
    graph,
    formula: molecularFormula(graph),
    ringClass: classifyMolecule(graph).ringClass,
    group: principal ?? 'none',
    groupAtoms,
    name: safeName(graph),
  }
}

/** Every card of the sorter, in the order of SORTER_SMILES. */
export function sorterDeck(): SorterCard[] {
  return SORTER_SMILES.map(sorterCard)
}

/** One member of the alcohol homologous series: its SMILES, name, formula and boiling point. */
export interface AlcoholMember {
  smiles: string
  graph: MolGraph
  name: string
  formula: string
  /**
   * Normal boiling point in degrees Celsius, to the nearest degree. Data, not from NCERT: the
   * values agree with Britannica's table of alcohol properties and with values quoted from the
   * CRC Handbook of Chemistry and Physics. Check against the current CRC edition before print.
   */
  boilingPointC: number
}

/** The first five alcohols of the series, from methanol to pentan-1-ol. */
const ALCOHOL_DATA: readonly { smiles: string; boilingPointC: number }[] = [
  { smiles: 'CO', boilingPointC: 65 },
  { smiles: 'CCO', boilingPointC: 78 },
  { smiles: 'CCCO', boilingPointC: 97 },
  { smiles: 'CCCCO', boilingPointC: 118 },
  { smiles: 'CCCCCO', boilingPointC: 138 },
]

/** The alcohol series C1 to C5, with each name and formula from the lib. */
export function alcoholSeries(): AlcoholMember[] {
  return ALCOHOL_DATA.map(({ smiles, boilingPointC }) => {
    const graph = parseSmiles(smiles)
    return { smiles, graph, name: iupacName(graph), formula: molecularFormula(graph), boilingPointC }
  })
}

/**
 * The difference between two members of a homologous series as a CH₂ count: 1 when the formula of
 * `b` is that of `a` plus one CH₂ unit, otherwise null.
 */
export function ch2Increment(a: MolGraph, b: MolGraph): number | null {
  const fa = countElements(a)
  const fb = countElements(b)
  const dC = (fb.C ?? 0) - (fa.C ?? 0)
  const dH = (fb.H ?? 0) - (fa.H ?? 0)
  const dO = (fb.O ?? 0) - (fa.O ?? 0)
  return dC === 1 && dH === 2 && dO === 0 ? 1 : null
}

function countElements(g: MolGraph): Record<string, number> {
  const out: Record<string, number> = {}
  for (const atom of g.atoms) {
    out[atom.element] = (out[atom.element] ?? 0) + 1
    out.H = (out.H ?? 0) + (atom.hCount ?? 0)
  }
  return out
}
