/**
 * Step data and verified species definitions for the `alkene-hydration-mechanisms` Scrolly.
 */

import { molecularFormula, parseSmiles } from '@/lib/chem/molecule-parse'
import { displayIupac, unicodeFormula } from '@/lib/chem/c12-u7-s4-alcohol-prep'

export const ALKENE_HYDRATION_STEP_COUNT = 5

export type AlkeneHydrationBeat =
  | 'acid-protonation'
  | 'acid-nucleophilic-attack'
  | 'acid-deprotonation'
  | 'hydroboration-addition'
  | 'hydroboration-oxidation'

export interface AlkeneHydrationStepMeta {
  beat: AlkeneHydrationBeat
  pathway: 'acid' | 'hydroboration'
  badge: string
  title: string
  caption: string
  ariaLabel: string
}

export const HYDRATION_SPECIES = {
  propene: 'CC=C',
  propan2ol: 'CC(O)C',
  propan1ol: 'CCCO',
  isopropylCation: 'C[CH+]C',
} as const

export const ALKENE_HYDRATION_STEPS: readonly AlkeneHydrationStepMeta[] = [
  {
    beat: 'acid-protonation',
    pathway: 'acid',
    badge: 'Acid hydration · Markovnikov',
    title: 'Step 1: Protonation of propene by H₃O⁺',
    caption: 'Proton joins terminal C-1 (CH₂); positive charge rests on 2° C-2.',
    ariaLabel: 'Acid-catalysed hydration step 1: propene pi bond attacks hydronium proton to form secondary carbocation and water.',
  },
  {
    beat: 'acid-nucleophilic-attack',
    pathway: 'acid',
    badge: 'Acid hydration · Markovnikov',
    title: 'Step 2: Water attacks the 2° carbocation',
    caption: 'Oxygen lone pair forms a C-O bond at C-2, giving an oxonium ion.',
    ariaLabel: 'Acid-catalysed hydration step 2: water nucleophile attacks secondary carbocation to form protonated propan-2-ol oxonium ion.',
  },
  {
    beat: 'acid-deprotonation',
    pathway: 'acid',
    badge: 'Acid hydration · Markovnikov',
    title: 'Step 3: Deprotonation yields propan-2-ol',
    caption: 'A second water removes H⁺ to give propan-2-ol and regenerate H₃O⁺.',
    ariaLabel: 'Acid-catalysed hydration step 3: water removes a proton from the oxonium ion to yield propan-2-ol and regenerate hydronium catalyst.',
  },
  {
    beat: 'hydroboration-addition',
    pathway: 'hydroboration',
    badge: 'Hydroboration · anti-Markovnikov',
    title: 'Diborane adds boron to terminal C-1',
    caption: 'Three propene molecules add sequentially to BH₃ to form (CH₃CH₂CH₂)₃B.',
    ariaLabel: 'Hydroboration step: diborane adds boron to the less substituted terminal carbon of propene in three stages to give tripropylborane.',
  },
  {
    beat: 'hydroboration-oxidation',
    pathway: 'hydroboration',
    badge: 'Oxidation · anti-Markovnikov',
    title: 'H₂O₂ / OH⁻ replaces boron with -OH',
    caption: 'All three C-B bonds oxidise to propan-1-ol plus boric acid, B(OH)₃.',
    ariaLabel: 'Oxidation step: tripropylborane reacts with hydrogen peroxide in aqueous sodium hydroxide to form three propan-1-ol molecules and boric acid.',
  },
] as const

export function hydrationSpeciesLabel(smiles: string): string {
  const name = displayIupac(smiles)
  const formula = unicodeFormula(molecularFormula(parseSmiles(smiles)))
  return `${name} (${formula})`
}
