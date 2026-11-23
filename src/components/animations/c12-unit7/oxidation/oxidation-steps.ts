/**
 * Pure step definitions and NCERT-sourced reaction pathways for the
 * `alcohol-oxidation-pathways` Scrolly animation (Section 7.4.4(b)(4)).
 */

import { NCERT_7_4_4_ALCOHOL_REACTIONS } from '@/lib/chem/ncert-c12-unit7-data'

export interface OxidationStepMeta {
  index: number
  title: string
  subtitle: string
}

export interface CopperTrackRow {
  degree: '1°' | '2°' | '3°'
  substrateFormula: string
  productFormula: string
  byProduct: string
  reactionKind: 'Dehydrogenation' | 'Dehydration (0 α-H)'
}

export const OXIDATION_STEPS: readonly OxidationStepMeta[] = [
  {
    index: 0,
    title: 'The α-Hydrogen Rule',
    subtitle: 'Forming C=O breaks both O-H and α-C-H on the same carbon',
  },
  {
    index: 1,
    title: 'Primary Alcohol Branching',
    subtitle: 'Acidified KMnO₄ goes to RCOOH; CrO₃ or PCC stops at RCHO',
  },
  {
    index: 2,
    title: 'Secondary vs Tertiary Alcohols',
    subtitle: '2° yields a ketone cleanly; 3° lacks α-H so mild oxidants fail',
  },
  {
    index: 3,
    title: 'Vapour Over Heated Cu at 573 K',
    subtitle: '1° and 2° alcohols lose H₂, while 3° dehydrates to an alkene',
  },
] as const

export const ALPHA_H_SUMMARY = [
  { degree: '1°', formula: 'R-CH₂-OH', alphaH: 2, note: 'Aldehyde → Acid' },
  { degree: '2°', formula: 'R₂CH-OH', alphaH: 1, note: 'Stops at Ketone' },
  { degree: '3°', formula: 'R₃C-OH', alphaH: 0, note: 'No mild oxidation' },
] as const

const PCC_REC = NCERT_7_4_4_ALCOHOL_REACTIONS.find((r) => r.id === 'oxidation-pcc')!
const CU_REC = NCERT_7_4_4_ALCOHOL_REACTIONS.find((r) => r.id === 'dehydrogenation-cu-573k')!

export const PCC_ALLYLIC_EXAMPLE = {
  substrate: 'CH₃-CH=CH-CH₂OH',
  product: 'CH₃-CH=CH-CHO',
  reagent: 'PCC',
  note: PCC_REC.conditions,
} as const

export const COPPER_573K_TRACKS: readonly CopperTrackRow[] = [
  {
    degree: '1°',
    substrateFormula: 'R-CH₂OH',
    productFormula: 'R-CHO',
    byProduct: 'H₂',
    reactionKind: 'Dehydrogenation',
  },
  {
    degree: '2°',
    substrateFormula: 'R-CH(OH)-R′',
    productFormula: 'R-CO-R′',
    byProduct: 'H₂',
    reactionKind: 'Dehydrogenation',
  },
  {
    degree: '3°',
    substrateFormula: '(CH₃)₃C-OH',
    productFormula: 'CH₂=C(CH₃)CH₃',
    byProduct: 'H₂O',
    reactionKind: 'Dehydration (0 α-H)',
  },
] as const

export const COPPER_TEMPERATURE_K = Number(CU_REC.temperatureK ?? 573)
