/**
 * The steps of the hydrocarbon-family Scrolly (NCERT Class 11 Unit 9, Section 9.1): one carbon grows
 * into the four families. Each step names a molecule by its SMILES; the name, the formula, the
 * hybridisation and the π electron count all come from the lib, so the drawing and the Prose cannot
 * disagree with the model.
 */

import { hybridisation, molecularFormula } from '@/lib/chem/molecule-parse'
import { nameOf, findRings } from '@/lib/chem/hydrocarbon-species'
import { huckel } from '@/lib/chem/aromaticity'
import { parseSmiles } from '@/lib/chem/molecule-parse'
import type { MolGraph } from '@/lib/chem/molecule-graph'

export type Family = 'Alkane' | 'Alkene' | 'Alkyne' | 'Arene'

export interface FamilyStep {
  smiles: string
  family: Family
  /** Short line under the drawing, in the Learner's words. */
  note: string
}

export const FAMILY_STEPS: readonly FamilyStep[] = [
  { smiles: 'C', family: 'Alkane', note: 'Four single bonds, so the carbon is saturated.' },
  { smiles: 'CC', family: 'Alkane', note: 'A second carbon takes one bond, and it is still saturated.' },
  { smiles: 'C=C', family: 'Alkene', note: 'One bond becomes a double bond: two hydrogens leave.' },
  { smiles: 'C#C', family: 'Alkyne', note: 'A triple bond, and two more hydrogens leave.' },
  { smiles: 'C1=CC=CC=C1', family: 'Arene', note: 'Six carbons close into a ring with three double bonds.' },
]

/** Bond angle at each hybridisation, as the Unit 9 text gives it (sp³ 109.5°, sp² 120°, sp 180°). */
export const ANGLE_BY_HYBRIDISATION: Record<'sp3' | 'sp2' | 'sp', number> = { sp3: 109.5, sp2: 120, sp: 180 }

/** Everything a Step shows, computed from the lib. */
export interface FamilyView {
  smiles: string
  graph: MolGraph
  name: string
  formula: string
  /** Hybridisation of the carbons, all the same in every Step here. */
  hybrid: 'sp3' | 'sp2' | 'sp'
  angle: number
  /** Bonds of order 2 or 3 (indices into graph.bonds). */
  multipleBonds: number[]
  /** π electrons of the ring, for the arene only. */
  piElectrons?: number
  verdict?: string
  family: Family
  note: string
}

/** The view of Step i. */
export function familyView(i: number): FamilyView {
  const step = FAMILY_STEPS[Math.min(FAMILY_STEPS.length - 1, Math.max(0, i))]
  const graph = parseSmiles(step.smiles)
  const carbon = graph.atoms.findIndex((a) => a.element === 'C')
  const hybrid = hybridisation(graph, carbon)
  const multipleBonds = graph.bonds.flatMap((b, k) => (b.order > 1 ? [k] : []))
  const view: FamilyView = {
    smiles: step.smiles,
    graph,
    name: nameOf(graph),
    formula: molecularFormula(graph),
    hybrid,
    angle: ANGLE_BY_HYBRIDISATION[hybrid],
    multipleBonds,
    family: step.family,
    note: step.note,
  }
  if (step.family === 'Arene') {
    const ring = findRings(graph, 8)[0]
    const verdict = huckel(graph, ring)
    view.piElectrons = verdict.piElectrons
    view.verdict = verdict.verdict
  }
  return view
}

export const FAMILY_STEP_COUNT = FAMILY_STEPS.length
