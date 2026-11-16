/**
 * Laboratory tests for unsaturation in hydrocarbons (NCERT Class 11 Unit 9, section 9.3.5): the bromine test
 * and Baeyer's test. Alkenes and alkynes decolourise bromine (in water or in CCl4) and the purple permanganate of
 * Baeyer's reagent; alkanes do not, and benzene does not (its π electrons are delocalised, and it needs a
 * catalyst or light to add bromine).
 */

import type { MolGraph } from './molecule-graph'
import { huckel } from './aromaticity'

/** The outcome of a lab test on a molecule. */
export interface LabTestResult {
  positive: boolean
  observation: string
  reason: string
}

/** The multiple bonds of a graph that are not part of an aromatic ring (the bonds that take part in these tests). */
function reactiveMultipleBonds(g: MolGraph): number {
  const aromatic = huckel(g)
  const ring = aromatic.verdict === 'aromatic' ? new Set(aromatic.ring) : new Set<number>()
  return g.bonds.filter((b) => b.order > 1 && !(ring.has(b.a) && ring.has(b.b))).length
}

/**
 * The bromine test: bromine water or Br2 in CCl4 is decolourised by an alkene or alkyne.
 */
export function bromineTest(g: MolGraph): LabTestResult {
  const n = reactiveMultipleBonds(g)
  if (n > 0) {
    return {
      positive: true,
      observation: 'the reddish-brown bromine colour is discharged',
      reason: 'the C=C or C≡C adds bromine across the π bond, giving a colourless dibromide',
    }
  }
  const aromatic = huckel(g).verdict === 'aromatic'
  return {
    positive: false,
    observation: 'the bromine colour persists',
    reason: aromatic
      ? 'benzene’s π electrons are delocalised, so it does not add bromine without a catalyst or light'
      : 'an alkane has no π bond, so it does not react with bromine in the dark',
  }
}

/**
 * Baeyer's test: cold, dilute, alkaline KMnO4 (purple) is decolourised with a brown precipitate of MnO2 by an alkene.
 */
export function baeyerTest(g: MolGraph): LabTestResult {
  const n = reactiveMultipleBonds(g)
  if (n > 0) {
    return {
      positive: true,
      observation: 'the purple colour goes and a brown precipitate of MnO2 forms',
      reason: 'the π bond is oxidised to a vicinal diol while the permanganate is reduced to MnO2',
    }
  }
  return {
    positive: false,
    observation: 'the purple colour persists',
    reason: 'with no π bond the permanganate is not reduced under these conditions',
  }
}
