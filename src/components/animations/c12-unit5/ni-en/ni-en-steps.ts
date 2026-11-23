import { NCERT_NI_EN_SERIES, type NickelEnStep } from '@/lib/chem/ncert-c12-unit5-s7-tables'

/** Number of Steps in the ni-en-colour-series Scrolly (matches MDX). */
export const NI_EN_STEP_COUNT = NCERT_NI_EN_SERIES.length

/** Clamp a Scrolly step index into 0..NI_EN_STEP_COUNT-1. NaN maps to 0. */
export function clampNiEnStep(step: number): number {
  if (!Number.isFinite(step)) return 0
  return Math.min(NI_EN_STEP_COUNT - 1, Math.max(0, Math.trunc(step)))
}

export interface NiEnSwatch {
  readonly enPerNi: number
  readonly label: string
  readonly colourName: string
  readonly fill: string
  readonly formulaDisplay: string
}

/** Display formulas with Unicode subscripts/superscripts for SVG labels. */
const FORMULA_DISPLAY: readonly string[] = [
  '[Ni(H₂O)₆]²⁺',
  '[Ni(H₂O)₄(en)]²⁺',
  '[Ni(H₂O)₂(en)₂]²⁺',
  '[Ni(en)₃]²⁺',
]

/** Dilute solution fills matching NCERT Fig. 5.11: green, pale blue, blue/purple, violet. */
export const NI_EN_SWATCHES: readonly NiEnSwatch[] = [
  { enPerNi: 0, label: 'Green', colourName: 'green', fill: 'var(--ion-ni2)', formulaDisplay: FORMULA_DISPLAY[0] },
  { enPerNi: 1, label: 'Pale blue', colourName: 'pale blue', fill: 'var(--ion-cu2)', formulaDisplay: FORMULA_DISPLAY[1] },
  { enPerNi: 2, label: 'Blue-purple', colourName: 'blue/purple', fill: 'var(--ion-co3)', formulaDisplay: FORMULA_DISPLAY[2] },
  { enPerNi: 3, label: 'Violet', colourName: 'violet', fill: 'var(--ion-ti3)', formulaDisplay: FORMULA_DISPLAY[3] },
] as const

export interface NiEnStepState {
  readonly step: number
  readonly row: NickelEnStep
  readonly enCount: number
  readonly waterLeft: number
  readonly ratioLabel: string
  readonly formulaDisplay: string
  readonly colourLabel: string
  readonly tubeFill: string
  readonly showDropper: boolean
  readonly showAllSwatches: boolean
  readonly ariaLabel: string
}

export function niEnStepState(step: number): NiEnStepState {
  const s = clampNiEnStep(step)
  const row = NCERT_NI_EN_SERIES[s]
  const swatch = NI_EN_SWATCHES[s]
  const ratioLabel = s === 0 ? 'No en added' : `en : Ni = ${s} : 1`
  return {
    step: s,
    row,
    enCount: row.enPerNi,
    waterLeft: row.waterLeft,
    ratioLabel,
    formulaDisplay: swatch.formulaDisplay,
    colourLabel: swatch.label,
    tubeFill: swatch.fill,
    showDropper: s > 0,
    showAllSwatches: s === NI_EN_STEP_COUNT - 1,
    ariaLabel: `${swatch.formulaDisplay}: ${ratioLabel}, ${row.waterLeft} water molecules remaining, solution colour ${row.colour}.`,
  }
}
