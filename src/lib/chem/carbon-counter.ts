/**
 * The model behind the carbon-counter simulation (NCERT Class 11 Unit 9, Section 9.2.1): classifies
 * the carbons of an alkane as primary, secondary, tertiary or quaternary, tallies the hydrogens by the
 * class of the carbon that carries them, counts the distinct monochloro products, and lists the chain
 * isomers of the same molecular formula. Every value comes from the Unit 8 parser and the Unit 9 models.
 */

import { alkaneIsomers } from './isomers'
import { halogenate } from './hydrocarbon-reactions'
import { carbonDegree, neighbours } from './molecule-parse'
import type { MolGraph } from './molecule-graph'

/** The class of a carbon by the number of carbons attached to it (0° is methane's carbon). */
export type CarbonClass = '0°' | '1°' | '2°' | '3°' | '4°'

/** One carbon of an alkane: its atom index, its class and the hydrogens it carries. */
export interface CarbonRow {
  atom: number
  degree: CarbonClass
  hydrogens: number
}

/** Hydrogens grouped by the class of the carbon they sit on. */
export interface HydrogenTally {
  primary: number
  secondary: number
  tertiary: number
  quaternary: number
  total: number
}

/** A monochloro (or monobromo) product of an alkane, as the lib names it. */
export interface MonohaloProduct {
  name: string
  hydrogens: number
  degree: string
}

/** Number of carbon atoms bonded to carbon atom i. */
function carbonNeighbourCount(g: MolGraph, i: number): number {
  return neighbours(g, i).filter((n) => g.atoms[n.atom].element === 'C').length
}

/**
 * The class of every carbon in an acyclic alkane, in atom order. Carbon atoms with no carbon neighbour
 * (methane) are 0°.
 */
export function carbonRows(g: MolGraph): CarbonRow[] {
  return g.atoms.flatMap((atom, i) => {
    if (atom.element !== 'C') return []
    const degree: CarbonClass = carbonNeighbourCount(g, i) === 0 ? '0°' : carbonDegree(g, i)
    return [{ atom: i, degree, hydrogens: atom.hCount ?? 0 }]
  })
}

/** The hydrogens of a molecule, grouped by the class of the carbon that carries each one. */
export function hydrogenTally(g: MolGraph): HydrogenTally {
  const tally: HydrogenTally = { primary: 0, secondary: 0, tertiary: 0, quaternary: 0, total: 0 }
  for (const row of carbonRows(g)) {
    tally.total += row.hydrogens
    if (row.degree === '1°' || row.degree === '0°') tally.primary += row.hydrogens
    else if (row.degree === '2°') tally.secondary += row.hydrogens
    else if (row.degree === '3°') tally.tertiary += row.hydrogens
    else tally.quaternary += row.hydrogens
  }
  return tally
}

/** The number of carbons of each class, e.g. { '1°': 2, '2°': 3, '3°': 0, '4°': 0 } for pentane. */
export function carbonCounts(g: MolGraph): Record<'1°' | '2°' | '3°' | '4°', number> {
  const counts = { '1°': 0, '2°': 0, '3°': 0, '4°': 0 }
  for (const row of carbonRows(g)) if (row.degree !== '0°') counts[row.degree]++
  return counts
}

/**
 * The monohalogenated products of an alkane with chlorine or bromine, one per distinct structure, from the
 * halogenate model. Each product carries the number of equivalent hydrogens it was made from.
 */
export function monohaloProducts(g: MolGraph, x: 'Cl' | 'Br'): MonohaloProduct[] {
  return halogenate(g, x).products.map((p) => ({ name: p.name, hydrogens: p.hydrogens ?? 0, degree: p.degree ?? '' }))
}

/**
 * Names of every chain isomer with the same molecular formula, from the lib, or null when the lib's isomer
 * list does not reach this carbon count (it covers C1 to C7).
 */
export function chainIsomerNames(carbons: number): string[] | null {
  if (carbons < 1 || carbons > 7) return null
  return alkaneIsomers(carbons).map((i) => i.name)
}
