import {
  NCERT_7_6_3_CLEAVAGE_CASES,
  NCERT_UNIT7_ORDERS,
} from '@/lib/chem/ncert-c12-unit7-data'

export interface CleavageStepSpec {
  readonly index: number
  readonly badge: string
  readonly title: string
  readonly mechanismTag: 'Protonation' | 'SN2' | 'Excess HI (SN2)' | 'SN1' | 'Aryl Lock'
  readonly topCardLabel: string
  readonly bottomCardLabel: string
  readonly footer: string
  readonly ncertCaseId: (typeof NCERT_7_6_3_CLEAVAGE_CASES)[number]['id'] | 'protonation'
}

export const CLEAVAGE_STEP_COUNT = 5
export const CLEAVAGE_HX_ORDER = NCERT_UNIT7_ORDERS.etherCleavageHX

export const CLEAVAGE_STEPS: readonly CleavageStepSpec[] = [
  {
    index: 0,
    badge: 'Step 1 of 5',
    title: 'Protonation forms an oxonium ion',
    mechanismTag: 'Protonation',
    topCardLabel: 'Oxygen lone pair accepts H⁺ from HI',
    bottomCardLabel: 'Equilibrium gives methyl(ethyl)oxonium ion',
    footer: 'Conc. HI turns poor -OR into neutral ROH leaving group',
    ncertCaseId: 'protonation',
  },
  {
    index: 1,
    badge: 'Step 2 of 5',
    title: 'SN2 attack at less hindered CH₃',
    mechanismTag: 'SN2',
    topCardLabel: 'Backside I⁻ attack avoids crowded -CH₂CH₃',
    bottomCardLabel: 'Concerted transition state yields CH₃I + CH₃CH₂OH',
    footer: '1°/2° mixed ethers: lower alkyl group forms RI (SN2)',
    ncertCaseId: 'mixed-primary-secondary',
  },
  {
    index: 2,
    badge: 'Step 3 of 5',
    title: 'Excess HI + heat cleaves ethanol',
    mechanismTag: 'Excess HI (SN2)',
    topCardLabel: 'Excess conc. HI, high T protonates ethanol',
    bottomCardLabel: 'I⁻ displaces neutral H₂O in a second SN2 step',
    footer: 'Excess hot HI converts the alcohol product into RI too',
    ncertCaseId: 'symmetrical-dialkyl',
  },
  {
    index: 3,
    badge: 'Step 4 of 5',
    title: 'tert-Butyl ether: SN1 reversal',
    mechanismTag: 'SN1',
    topCardLabel: 'Slow departure of CH₃OH reveals planar (CH₃)₃C⁺',
    bottomCardLabel: 'Fast I⁻ capture gives tertiary iodide (CH₃)₃C-I',
    footer: 'Stable (CH₃)₃C⁺ intermediate flips pathway to SN1',
    ncertCaseId: 'mixed-with-tertiary',
  },
  {
    index: 4,
    badge: 'Step 5 of 5',
    title: 'Anisole: only O-CH₃ breaks',
    mechanismTag: 'Aryl Lock',
    topCardLabel: 'Partial C=O character strengthens O-C₆H₅',
    bottomCardLabel: 'Products: phenol + CH₃I (phenol resists HI)',
    footer: 'sp² phenyl C-O stays locked; phenol resists HI attack',
    ncertCaseId: 'alkyl-aryl-anisole',
  },
] as const

export function getCleavageStep(step: number): CleavageStepSpec {
  const idx = Math.min(Math.max(Math.trunc(step), 0), CLEAVAGE_STEP_COUNT - 1)
  return CLEAVAGE_STEPS[idx]
}
