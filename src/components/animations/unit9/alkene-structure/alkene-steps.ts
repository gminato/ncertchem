/**
 * The steps of the double-bond Scrolly: ethene's sigma frame and pi cloud, the twist that breaks the
 * pi overlap, the C4H8 isomers, and the cis and trans forms of but-2-ene. Every name and every
 * verdict comes from the lib (hydrocarbon-species.ts, alkene-geometry.ts); this file only sets the
 * targets each step tweens to.
 */

import { geometricIsomers, type AlkeneIsomer } from '@/lib/chem/alkene-geometry'
import { nameOf } from '@/lib/chem/hydrocarbon-species'
import { molecularFormula, parseSmiles } from '@/lib/chem/molecule-parse'
import type { MolGraph } from '@/lib/chem/molecule-graph'

export type AlkeneStepView = 'frame' | 'end-on' | 'isomers' | 'geometry'

export interface AlkeneStep {
  view: AlkeneStepView
  /** 0 keeps each p orbital a separate lobe; 1 merges the lobes into the pi cloud. */
  merge: number
  /** Degrees by which the right carbon's p orbitals are turned about the C=C axis (end-on view). */
  twist: number
  caption: string
}

export const ALKENE_STEP_COUNT = 6

export const ALKENE_STEPS: readonly AlkeneStep[] = [
  { view: 'frame', merge: 0, twist: 0, caption: 'Ethene: sp² σ framework, p orbitals still apart' },
  { view: 'frame', merge: 1, twist: 0, caption: 'The two p lobes merge into one π cloud above and below the plane' },
  { view: 'end-on', merge: 0, twist: 0, caption: 'Looking down the C=C axis: the p orbitals are parallel and overlap' },
  { view: 'end-on', merge: 0, twist: 90, caption: 'Turned by 90°: the p orbitals are perpendicular and no longer overlap' },
  { view: 'isomers', merge: 0, twist: 0, caption: 'Three alkenes share the formula C₄H₈' },
  { view: 'geometry', merge: 0, twist: 0, caption: 'cis- and trans-but-2-ene: same bonds, different arrangement' },
]

/** The step's values, clamped to the valid range, so that a stray index never reads past the list. */
export function alkeneStep(index: number): AlkeneStep {
  const i = Math.min(ALKENE_STEP_COUNT - 1, Math.max(0, Math.round(index)))
  return ALKENE_STEPS[i]
}

export interface C4H8Isomer {
  smiles: string
  name: string
  formula: string
  graph: MolGraph
}

/** The three alkenes of C₄H₈ that the section draws, named by the lib. */
export const C4H8_ISOMERS: readonly C4H8Isomer[] = ['C=CCC', 'CC=CC', 'C=C(C)C'].map((smiles) => {
  const graph = parseSmiles(smiles)
  return { smiles, name: nameOf(graph), formula: molecularFormula(graph), graph }
})

/** cis- and trans-but-2-ene, the isomers of the geometry step, from the lib. */
export const BUTENE_VERDICT = geometricIsomers(['CH3', 'H'], ['CH3', 'H'])

/** The isomer with the given descriptor, or undefined when the verdict has none. */
export function butene(descriptor: 'cis' | 'trans'): AlkeneIsomer | undefined {
  return BUTENE_VERDICT.isomers.find((i) => i.descriptor === descriptor)
}
