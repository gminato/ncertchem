import {
  NCERT_COBALT_SECONDARY_VALENCE,
  NCERT_WERNER_COBALT,
  type WernerComplexRow,
} from '@/lib/chem/ncert-c12-unit5-s1-tables'

export type LigandKind = 'NH3' | 'Cl'

export interface ComplexStepData {
  kind: 'complex'
  stepIndex: number
  row: WernerComplexRow
  /** Six octahedral positions in order: top, top-right, bottom-right, bottom, bottom-left, top-left. */
  sites: readonly LigandKind[]
  bracketDisplay: string
  counterDisplay: string
  captionPrimary: string
  captionSecondary: string
}

export interface IsomersStepData {
  kind: 'isomers'
  stepIndex: number
  green: WernerComplexRow
  violet: WernerComplexRow
  greenSites: readonly LigandKind[]
  violetSites: readonly LigandKind[]
  bracketDisplay: string
  counterDisplay: string
}

export interface ConductivityBar {
  colour: string
  ammonia: number
  boundChloride: number
  counterIons: number
  totalIons: number
  electrolyte: WernerComplexRow['electrolyte']
  agclMoles: number
}

export interface ConductivityStepData {
  kind: 'conductivity'
  stepIndex: number
  bars: readonly ConductivityBar[]
}

export type WernerStepState = ComplexStepData | IsomersStepData | ConductivityStepData

export const WERNER_STEP_COUNT = 5

const [YELLOW, PURPLE, GREEN, VIOLET] = NCERT_WERNER_COBALT

/** Six octahedral sites around Co: [0]=top, [1]=top-right, [2]=bottom-right, [3]=bottom, [4]=bottom-left, [5]=top-left. */
const SITES_YELLOW: readonly LigandKind[] = ['NH3', 'NH3', 'NH3', 'NH3', 'NH3', 'NH3']
const SITES_PURPLE: readonly LigandKind[] = ['Cl', 'NH3', 'NH3', 'NH3', 'NH3', 'NH3']
const SITES_GREEN_TRANS: readonly LigandKind[] = ['Cl', 'NH3', 'NH3', 'Cl', 'NH3', 'NH3']
const SITES_VIOLET_CIS: readonly LigandKind[] = ['Cl', 'Cl', 'NH3', 'NH3', 'NH3', 'NH3']

export function wernerStepState(rawStep: number): WernerStepState {
  const step = Math.max(0, Math.min(WERNER_STEP_COUNT - 1, Math.floor(rawStep)))

  if (step === 0) {
    return {
      kind: 'complex',
      stepIndex: 0,
      row: YELLOW,
      sites: SITES_YELLOW,
      bracketDisplay: '[Co(NH₃)₆]³⁺',
      counterDisplay: '3 Cl⁻',
      captionPrimary: `Secondary valence: 6 NH₃ + 0 Cl⁻ = ${NCERT_COBALT_SECONDARY_VALENCE}`,
      captionSecondary: 'All 3 outer Cl⁻ ions precipitate as 3 mol white AgCl(s).',
    }
  }

  if (step === 1) {
    return {
      kind: 'complex',
      stepIndex: 1,
      row: PURPLE,
      sites: SITES_PURPLE,
      bracketDisplay: '[CoCl(NH₃)₅]²⁺',
      counterDisplay: '2 Cl⁻',
      captionPrimary: `Secondary valence: 5 NH₃ + 1 Cl⁻ = ${NCERT_COBALT_SECONDARY_VALENCE}`,
      captionSecondary: 'Only 2 outer Cl⁻ precipitate; the bound Cl⁻ stays attached.',
    }
  }

  if (step === 2) {
    return {
      kind: 'complex',
      stepIndex: 2,
      row: GREEN,
      sites: SITES_GREEN_TRANS,
      bracketDisplay: '[CoCl₂(NH₃)₄]⁺',
      counterDisplay: '1 Cl⁻',
      captionPrimary: `Six-group rule: 4 + 2 = ${NCERT_COBALT_SECONDARY_VALENCE}`,
      captionSecondary: 'Two bound Cl⁻ sit opposite each other; 1 outer Cl⁻ gives 1 AgCl.',
    }
  }

  if (step === 3) {
    return {
      kind: 'isomers',
      stepIndex: 3,
      green: GREEN,
      violet: VIOLET,
      greenSites: SITES_GREEN_TRANS,
      violetSites: SITES_VIOLET_CIS,
      bracketDisplay: '[CoCl₂(NH₃)₄]⁺',
      counterDisplay: '1 Cl⁻',
    }
  }

  return {
    kind: 'conductivity',
    stepIndex: 4,
    bars: NCERT_WERNER_COBALT.map((row) => ({
      colour: row.colour,
      ammonia: row.ammonia,
      boundChloride: row.boundChloride,
      counterIons: row.counterIons,
      totalIons: 1 + row.counterIons,
      electrolyte: row.electrolyte,
      agclMoles: row.agclMoles,
    })),
  }
}
