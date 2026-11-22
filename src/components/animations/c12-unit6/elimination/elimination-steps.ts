/**
 * Pure data for the elimination and metals Scrolly (Section 6.7.1 (2), (3)): the substrate's atom
 * sites and every product name, formula and count the Steps draw. Everything comes from the libs
 * (F1's eliminationProducts, parseSmiles, molecularFormula, iupacNameFromSmiles) or from the
 * lead's NCERT data file; nothing is typed by hand except the SMILES of the molecules.
 */

import { adjacency } from '@/components/organic/layout'
import type { MolGraph } from '@/lib/chem/molecule-graph'
import { molecularFormula, parseSmiles } from '@/lib/chem/molecule-parse'
import { iupacNameFromSmiles } from '@/lib/chem/iupac-organic'
import { eliminationProducts } from '@/lib/chem/haloalkanes'
import { NCERT_ZAITSEV_2_BROMOPENTANE } from '@/lib/chem/ncert-c12-unit6-data'

/** 2-bromopentane, the substrate NCERT uses for the Zaitsev rule (the Prose and the Simulation use it too). */
export const SUBSTRATE_SMILES: string = NCERT_ZAITSEV_2_BROMOPENTANE.substrate.smiles

/** Bromoethane: the halide that makes the Grignard reagent. */
export const BROMOETHANE_SMILES = 'CCBr'

/** Ethane, the hydrocarbon that water releases from the Grignard reagent. */
export const ETHANE_SMILES = 'CC'

/** Butane, the Wurtz product of two bromoethanes. */
export const BUTANE_SMILES = 'CCCC'

/** Index of the first atom with this element symbol. */
export function atomIndex(g: MolGraph, element: string): number {
  const i = g.atoms.findIndex((a) => a.element === element)
  if (i < 0) throw new Error(`no ${element} in graph`)
  return i
}

/** The atoms the substrate drawing names: α (bears Br), the two β carbons, and the chain beyond them. */
export interface SubstrateSites {
  bromine: number
  alpha: number
  /** β carbon that is a terminal CH3 (C1 in the IUPAC numbering, 3 H). */
  c1: number
  /** β carbon that is a CH2 (C3 in the IUPAC numbering, 2 H). */
  c3: number
  c4: number
  c5: number
}

export function substrateSites(g: MolGraph = parseSmiles(SUBSTRATE_SMILES)): SubstrateSites {
  const adj = adjacency(g)
  const bromine = atomIndex(g, 'Br')
  const alpha = adj[bromine][0]
  const carbonNeighbours = (i: number) => adj[i].filter((n) => g.atoms[n].element === 'C')
  const betas = carbonNeighbours(alpha)
  if (betas.length !== 2) throw new Error('expected two beta carbons')
  const c1 = betas.find((b) => carbonNeighbours(b).length === 1)
  if (c1 === undefined) throw new Error('no terminal beta carbon')
  const c3 = betas.find((b) => b !== c1)
  if (c3 === undefined) throw new Error('no second beta carbon')
  const c4 = carbonNeighbours(c3).find((n) => n !== alpha)
  if (c4 === undefined) throw new Error('no C4')
  const c5 = carbonNeighbours(c4).find((n) => n !== c3)
  if (c5 === undefined) throw new Error('no C5')
  return { bromine, alpha, c1, c3, c4, c5 }
}

/** One alkene from the substrate, with the NCERT percentage where NCERT prints one. */
export interface ZaitsevRow {
  name: string
  smiles: string
  formula: string
  /** Carbon substituents on the two C=C carbons (from the lib). */
  alkylGroups: number
  zaitsev: boolean
  /** NCERT's printed share for this alkene, or null when NCERT prints none. */
  percent: number | null
}

/** The alkenes from the substrate, the Zaitsev product first. */
export function zaitsevRows(): ZaitsevRow[] {
  return eliminationProducts(SUBSTRATE_SMILES)
    .map((p) => {
      const ncert = NCERT_ZAITSEV_2_BROMOPENTANE.products.find((n) => n.name.toLowerCase() === (p.name ?? '').toLowerCase())
      return {
        name: p.name ?? p.smiles,
        smiles: p.smiles,
        formula: p.formula,
        alkylGroups: p.alkylGroups,
        zaitsev: p.zaitsev,
        percent: ncert ? ncert.percent : null,
      }
    })
    .sort((a, b) => b.alkylGroups - a.alkylGroups)
}

/** A named molecule: its IUPAC name from the namer and its formula from the parser. */
export interface NamedMolecule {
  smiles: string
  name: string
  formula: string
}

export function namedMolecule(smiles: string): NamedMolecule {
  const g = parseSmiles(smiles)
  return { smiles, name: iupacNameFromSmiles(smiles), formula: molecularFormula(g) }
}

/** Total β-hydrogens of the substrate: the sum the lib reports over its products (3 + 2). */
export function substrateBetaHydrogens(): number {
  return eliminationProducts(SUBSTRATE_SMILES).reduce((sum, p) => sum + p.betaHydrogens, 0)
}

export const FACTS = {
  bromoethane: () => namedMolecule(BROMOETHANE_SMILES),
  ethane: () => namedMolecule(ETHANE_SMILES),
  butane: () => namedMolecule(BUTANE_SMILES),
}
