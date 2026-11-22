import {
  NCERT_COBALT_SECONDARY_VALENCE,
  NCERT_WERNER_COBALT,
  type WernerComplexRow,
} from './ncert-c12-unit5-s1-tables'

export type WernerPresetId = 'yellow' | 'purple' | 'green' | 'violet'
export type IsomerArrangement = 'trans' | 'cis'
export type OctahedralSite = 'NH3' | 'Cl' | 'empty'
export type SecondaryValenceStatus = 'satisfied' | 'empty' | 'overflow'

export interface WernerPreset {
  id: WernerPresetId
  label: string
  colourName: string
  ammonia: number
  boundCl: number
  arrangement: IsomerArrangement
  row: WernerComplexRow
}

const [YELLOW_ROW, PURPLE_ROW, GREEN_ROW, VIOLET_ROW] = NCERT_WERNER_COBALT

export const WERNER_PRESETS: readonly WernerPreset[] = [
  {
    id: 'yellow',
    label: 'Yellow',
    colourName: YELLOW_ROW.colour,
    ammonia: YELLOW_ROW.ammonia,
    boundCl: YELLOW_ROW.boundChloride,
    arrangement: 'trans',
    row: YELLOW_ROW,
  },
  {
    id: 'purple',
    label: 'Purple',
    colourName: PURPLE_ROW.colour,
    ammonia: PURPLE_ROW.ammonia,
    boundCl: PURPLE_ROW.boundChloride,
    arrangement: 'trans',
    row: PURPLE_ROW,
  },
  {
    id: 'green',
    label: 'Green',
    colourName: GREEN_ROW.colour,
    ammonia: GREEN_ROW.ammonia,
    boundCl: GREEN_ROW.boundChloride,
    arrangement: 'trans',
    row: GREEN_ROW,
  },
  {
    id: 'violet',
    label: 'Violet',
    colourName: VIOLET_ROW.colour,
    ammonia: VIOLET_ROW.ammonia,
    boundCl: VIOLET_ROW.boundChloride,
    arrangement: 'cis',
    row: VIOLET_ROW,
  },
] as const

export const TOTAL_CHLORIDE_IN_FORMULA = 3
export const MIN_AMMONIA = 0
export const MAX_AMMONIA = 6
export const MIN_BOUND_CL = 0
export const MAX_BOUND_CL = 3

export interface WernerEvaluation {
  ammonia: number
  boundCl: number
  counterIons: number
  totalAttached: number
  entityCharge: number
  agclMoles: number
  electrolyte: string
  entityFormula: string
  fullFormula: string
  status: SecondaryValenceStatus
  verdict: string
  emptyPositions: number
  overflowGroups: number
  matchedPreset: WernerPresetId | null
  isomerNote: string | null
  /** Six octahedral positions: [0]=top, [1]=top-right, [2]=bottom-right, [3]=bottom, [4]=bottom-left, [5]=top-left. */
  sites: readonly OctahedralSite[]
  arrangement: IsomerArrangement
}

const SUBSCRIPTS = '₀₁₂₃₄₅₆₇₈₉'

function sub(n: number): string {
  return String(n)
    .split('')
    .map((d) => SUBSCRIPTS[Number(d)])
    .join('')
}

function chargeSuperscript(charge: number): string {
  if (charge <= 0) return ''
  if (charge === 1) return '⁺'
  return `${charge === 2 ? '²' : '³'}⁺`
}

function formatEntityFormula(ammonia: number, boundCl: number, charge: number): string {
  const clPart = boundCl === 0 ? '' : boundCl === 1 ? 'Cl' : `Cl${sub(boundCl)}`
  const nh3Part = ammonia === 0 ? '' : ammonia === 1 ? '(NH₃)' : `(NH₃)${sub(ammonia)}`
  return `[Co${clPart}${nh3Part}]${chargeSuperscript(charge)}`
}

function formatFullFormula(ammonia: number, boundCl: number, counterIons: number): string {
  const clPart = boundCl === 0 ? '' : boundCl === 1 ? 'Cl' : `Cl${sub(boundCl)}`
  const nh3Part = ammonia === 0 ? '' : ammonia === 1 ? '(NH₃)' : `(NH₃)${sub(ammonia)}`
  const outerPart = counterIons === 0 ? '' : counterIons === 1 ? 'Cl' : `Cl${sub(counterIons)}`
  return `[Co${clPart}${nh3Part}]${outerPart}`
}

function buildSites(ammonia: number, boundCl: number, arrangement: IsomerArrangement): readonly OctahedralSite[] {
  const sites: OctahedralSite[] = ['empty', 'empty', 'empty', 'empty', 'empty', 'empty']

  // Place bound chlorides first so trans (0, 3) and cis (0, 1) are unmistakable.
  const clOrder =
    boundCl === 2 && arrangement === 'trans'
      ? [0, 3, 1, 2, 4, 5]
      : boundCl === 2 && arrangement === 'cis'
        ? [0, 1, 2, 3, 4, 5]
        : [0, 3, 1, 4, 2, 5]

  let remainingCl = Math.min(boundCl, NCERT_COBALT_SECONDARY_VALENCE)
  for (const idx of clOrder) {
    if (remainingCl > 0) {
      sites[idx] = 'Cl'
      remainingCl -= 1
    }
  }

  let remainingNh3 = Math.min(ammonia, Math.max(0, NCERT_COBALT_SECONDARY_VALENCE - boundCl))
  for (let i = 0; i < NCERT_COBALT_SECONDARY_VALENCE; i++) {
    if (sites[i] === 'empty' && remainingNh3 > 0) {
      sites[i] = 'NH3'
      remainingNh3 -= 1
    }
  }

  return sites
}

export function evaluateWernerComplex(
  rawAmmonia: number,
  rawBoundCl: number,
  arrangement: IsomerArrangement = 'trans'
): WernerEvaluation {
  const ammonia = Math.max(MIN_AMMONIA, Math.min(MAX_AMMONIA, Math.round(rawAmmonia)))
  const boundCl = Math.max(MIN_BOUND_CL, Math.min(MAX_BOUND_CL, Math.round(rawBoundCl)))
  const counterIons = TOTAL_CHLORIDE_IN_FORMULA - boundCl
  const totalAttached = ammonia + boundCl
  const entityCharge = counterIons
  const agclMoles = counterIons

  const electrolyte = counterIons === 0 ? 'none (neutral)' : `1:${counterIons}`
  const entityFormula = formatEntityFormula(ammonia, boundCl, entityCharge)
  const fullFormula = formatFullFormula(ammonia, boundCl, counterIons)

  let status: SecondaryValenceStatus = 'satisfied'
  let verdict = 'secondary valence 6 satisfied'
  let emptyPositions = 0
  let overflowGroups = 0

  if (totalAttached < NCERT_COBALT_SECONDARY_VALENCE) {
    status = 'empty'
    emptyPositions = NCERT_COBALT_SECONDARY_VALENCE - totalAttached
    verdict = 'positions empty'
  } else if (totalAttached > NCERT_COBALT_SECONDARY_VALENCE) {
    status = 'overflow'
    overflowGroups = totalAttached - NCERT_COBALT_SECONDARY_VALENCE
    verdict = 'too many groups'
  }

  let matchedPreset: WernerPresetId | null = null
  if (ammonia === 6 && boundCl === 0) matchedPreset = 'yellow'
  else if (ammonia === 5 && boundCl === 1) matchedPreset = 'purple'
  else if (ammonia === 4 && boundCl === 2) matchedPreset = arrangement === 'cis' ? 'violet' : 'green'

  const isomerNote =
    ammonia === 4 && boundCl === 2
      ? arrangement === 'cis'
        ? 'Violet isomer: the two bound Cl⁻ sit on neighbouring positions. Green shares the same formula [CoCl₂(NH₃)₄]Cl and 1 mol AgCl.'
        : 'Green isomer: the two bound Cl⁻ sit on opposite positions. Violet shares the same formula [CoCl₂(NH₃)₄]Cl and 1 mol AgCl.'
      : null

  return {
    ammonia,
    boundCl,
    counterIons,
    totalAttached,
    entityCharge,
    agclMoles,
    electrolyte,
    entityFormula,
    fullFormula,
    status,
    verdict,
    emptyPositions,
    overflowGroups,
    matchedPreset,
    isomerNote,
    sites: buildSites(ammonia, boundCl, arrangement),
    arrangement,
  }
}
