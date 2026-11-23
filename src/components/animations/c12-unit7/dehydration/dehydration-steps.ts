/**
 * Pure step definitions and NCERT-sourced comparison data for the
 * `ethanol-dehydration-mechanism` Scrolly animation (Section 7.4.4(b)(3)).
 */

import {
  NCERT_7_4_4_ALCOHOL_DEHYDRATION,
  NCERT_UNIT7_ORDERS,
} from '@/lib/chem/ncert-c12-unit7-data'

export interface DehydrationStepMeta {
  index: number
  title: string
  subtitle: string
  kineticTag: string
  takeaway: string
}

export interface DehydrationCompareCard {
  id: string
  degree: '1°' | '2°' | '3°'
  alcoholName: string
  alcoholFormula: string
  carbocationFormula: string
  reagentText: string
  temperatureK: number
  productFormula: string
  barrierLabel: string
  barrierFraction: number
}

export const DEHYDRATION_STEPS: readonly DehydrationStepMeta[] = [
  {
    index: 0,
    title: 'Step 1 (Fast): Protonation of Ethanol',
    subtitle: 'Oxygen lone pair accepts H⁺ to form the ethyl oxonium ion',
    kineticTag: 'Fast equilibrium',
    takeaway: 'Turns poor -OH into a good neutral H₂O leaving group',
  },
  {
    index: 1,
    title: 'Step 2 (Slow, RDS): Carbocation Formation',
    subtitle: 'Heterolytic C-O cleavage releases H₂O and forms CH₃CH₂⁺',
    kineticTag: 'Slow (rate-determining step)',
    takeaway: 'Highest activation barrier: sets the overall dehydration rate',
  },
  {
    index: 2,
    title: 'Step 3 (Fast): β-Proton Elimination',
    subtitle: 'Loss of β-H⁺ builds the π bond of ethene and regenerates H⁺',
    kineticTag: 'Fast step',
    takeaway: 'Acid catalyst returns; removing CH₂=CH₂ drives equilibrium right',
  },
  {
    index: 3,
    title: 'Why 3° Alcohols Dehydrate Easiest',
    subtitle: 'Carbocation stability controls the Step 2 energy barrier',
    kineticTag: NCERT_UNIT7_ORDERS.alcoholDehydrationEase,
    takeaway: '3° carbocation stability cuts required acid strength and temperature',
  },
] as const

const ETH = NCERT_7_4_4_ALCOHOL_DEHYDRATION.find((r) => r.id === 'dehydration-primary-ethanol')!
const ISO = NCERT_7_4_4_ALCOHOL_DEHYDRATION.find((r) => r.id === 'dehydration-secondary-propan2ol')!
const TBU = NCERT_7_4_4_ALCOHOL_DEHYDRATION.find((r) => r.id === 'dehydration-tertiary-tbutanol')!

export const DEHYDRATION_COMPARISON: readonly DehydrationCompareCard[] = [
  {
    id: ETH.id,
    degree: '1°',
    alcoholName: 'Ethanol',
    alcoholFormula: 'CH₃CH₂OH',
    carbocationFormula: 'CH₃CH₂⁺',
    reagentText: 'conc. H₂SO₄',
    temperatureK: Number(ETH.temperatureK),
    productFormula: 'CH₂=CH₂',
    barrierLabel: 'High Eₐ',
    barrierFraction: 0.92,
  },
  {
    id: ISO.id,
    degree: '2°',
    alcoholName: 'Propan-2-ol',
    alcoholFormula: 'CH₃CH(OH)CH₃',
    carbocationFormula: '(CH₃)₂CH⁺',
    reagentText: '85% H₃PO₄',
    temperatureK: Number(ISO.temperatureK),
    productFormula: 'CH₃-CH=CH₂',
    barrierLabel: 'Medium Eₐ',
    barrierFraction: 0.64,
  },
  {
    id: TBU.id,
    degree: '3°',
    alcoholName: '2-Methylpropan-2-ol',
    alcoholFormula: '(CH₃)₃COH',
    carbocationFormula: '(CH₃)₃C⁺',
    reagentText: '20% H₃PO₄',
    temperatureK: Number(TBU.temperatureK),
    productFormula: 'CH₂=C(CH₃)CH₃',
    barrierLabel: 'Lowest Eₐ',
    barrierFraction: 0.36,
  },
] as const

/** Schematic 3-step E1 potential-energy profile heights (reactant -> TS1 -> oxonium -> TS2 -> C+ -> TS3 -> alkene). */
export const E1_PROFILE_LEVELS = [0.22, 0.44, 0.28, 0.94, 0.62, 0.74, 0.16] as const
