/**
 * The steps of the alkane-isomers Scrolly (NCERT Class 11 Unit 9, Section 9.2.1): the three chain
 * isomers of C5H12, each carbon labelled 1°, 2°, 3° or 4°, and a summary table. The names, the carbon
 * and hydrogen classes and the boiling points all come from the lib (Table 9.2 values in alkane-properties).
 */

import { parseSmiles, molecularFormula } from '@/lib/chem/molecule-parse'
import { nameOf } from '@/lib/chem/hydrocarbon-species'
import { carbonCounts, hydrogenTally, carbonRows, type CarbonClass, type HydrogenTally } from '@/lib/chem/carbon-counter'
import { NCERT_TABLE_9_2_ALKANES } from '@/lib/chem/ncert-unit9-tables'
import type { MolGraph } from '@/lib/chem/molecule-graph'

/** The three C5H12 isomers, in the order the Scrolly shows them. The last Step is the summary table. */
export const ISOMER_SMILES: readonly string[] = ['CCCCC', 'CC(C)CC', 'CC(C)(C)C']
export const ISOMER_STEP_COUNT = ISOMER_SMILES.length + 1

export interface IsomerView {
  graph: MolGraph
  name: string
  formula: string
  counts: Record<'1°' | '2°' | '3°' | '4°', number>
  tally: HydrogenTally
  /** Carbon class of each carbon, by atom index. */
  degrees: Record<number, CarbonClass>
  boilingK: number
}

/** The Table 9.2 boiling point of a named alkane, matched without regard to case (the lib names are lower case). */
function tableBoilingK(name: string): number {
  const row = NCERT_TABLE_9_2_ALKANES.rows.find((r) => r.name.toLowerCase() === name.toLowerCase())
  if (!row) throw new RangeError(`"${name}" is not in NCERT Table 9.2`)
  return row.boilingPointK
}

/** The view of one isomer, from the lib. */
export function isomerView(smiles: string): IsomerView {
  const graph = parseSmiles(smiles)
  const name = nameOf(graph)
  const degrees: Record<number, CarbonClass> = {}
  for (const row of carbonRows(graph)) degrees[row.atom] = row.degree
  return {
    graph,
    name,
    formula: molecularFormula(graph),
    counts: carbonCounts(graph),
    tally: hydrogenTally(graph),
    degrees,
    boilingK: tableBoilingK(name),
  }
}

/** The views of the three isomers, in order. */
export function isomerViews(): IsomerView[] {
  return ISOMER_SMILES.map((s) => isomerView(s))
}
