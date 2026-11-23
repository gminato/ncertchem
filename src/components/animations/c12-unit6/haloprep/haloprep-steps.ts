/**
 * Facts for the haloalkane-routes Scrolly: every molecule the six Steps draw, by SMILES.
 * Names and formulas are read from the libs (iupacNameFromSmiles, molecularFormula) at render time,
 * so the drawing can never disagree with the namer.
 */

import { iupacNameFromSmiles } from '@/lib/chem/iupac-organic'
import { molecularFormula, parseSmiles } from '@/lib/chem/molecule-parse'

export const HALOPREP_STEP_COUNT = 6

export const SPECIES = {
  butanol: 'CCCCO',
  chlorobutane: 'CCCCCl',
  butane: 'CCCC',
  chlorobutaneSecondary: 'CCC(C)Cl',
  butene: 'C=CCC',
  bromobutaneSecondary: 'CCC(C)Br',
  dibromobutane: 'BrCC(Br)CC',
  bromobutane: 'CCCCBr',
  iodobutane: 'CCCCI',
  fluorobutane: 'CCCCF',
} as const

/** The species each Step draws, in drawing order (reactant, product or products). */
export const STEP_SPECIES: readonly (readonly string[])[] = [
  [SPECIES.butanol, SPECIES.chlorobutane],
  [SPECIES.butane, SPECIES.chlorobutane, SPECIES.chlorobutaneSecondary],
  [SPECIES.butene, SPECIES.bromobutaneSecondary],
  [SPECIES.butene, SPECIES.dibromobutane],
  [SPECIES.bromobutane, SPECIES.iodobutane],
  [SPECIES.bromobutane, SPECIES.fluorobutane],
]

/** The IUPAC name the namer prints for a species. */
export function speciesName(smiles: string): string {
  const name = iupacNameFromSmiles(smiles)
  if (!name) throw new Error(`No name for ${smiles}`)
  return name
}

/** The molecular formula of a species, from the parsed graph. */
export function speciesFormula(smiles: string): string {
  return molecularFormula(parseSmiles(smiles))
}
