import { ACID_STRENGTH_SERIES, PKA_VALUES, SUBSTITUENT_ACIDITY_ORDER, pkaBand, type PkaBand } from './ncert-c12-unit8-data'

/** The pKa axis of the ruler: wide enough for HCl (−7.0) and ethanol (about 16). */
export const PKA_AXIS = { min: -8, max: 18 } as const

/** x position of a pKa value on a ruler that starts at `left` and is `width` units wide. */
export function rulerX(pKa: number, left: number, width: number): number {
  return left + ((pKa - PKA_AXIS.min) / (PKA_AXIS.max - PKA_AXIS.min)) * width
}

/** Looks up an NCERT pKa row by its printed name. Throws if the row is missing. */
export function pkaRow(name: string): { pKa: number; approx: boolean; band: PkaBand; formula: string; smiles: string } {
  const row = PKA_VALUES.find((r) => r.name === name)
  if (!row) throw new Error(`No NCERT pKa row named ${name}`)
  return { pKa: row.pKa, approx: row.approx === true, band: pkaBand(row.pKa), formula: row.formula, smiles: row.smiles }
}

/** Acids the student can place on the ruler (their pKa values are NCERT's printed values). */
export const RULER_ACIDS = ['Acetic acid', 'Benzoic acid', '4-Nitrobenzoic acid', 'Trifluoroacetic acid'] as const
export type RulerAcid = (typeof RULER_ACIDS)[number]

/** Reference acids always marked on the ruler. */
export const REFERENCE_ACIDS = ['Hydrochloric acid', 'Phenol', 'Ethanol'] as const

/** NCERT's series with the one entry the namer misnames left out (cyanoethanoic acid: never shown). */
export const STRIP = ACID_STRENGTH_SERIES.filter((e) => e.smiles !== 'N#CCC(O)=O')

export type SubPosition = 'alpha' | 'beta'

/** Series formulas for a group on the carbon next to COOH (alpha) or one further away (beta), as NCERT prints them. */
const SERIES_CASE: Record<string, string> = {
  'Ph|alpha': 'C₆H₅CH₂COOH',
  'F|alpha': 'FCH₂COOH',
  'Cl|alpha': 'ClCH₂COOH',
  'Br|alpha': 'BrCH₂COOH',
  'NO₂|alpha': 'NO₂CH₂COOH',
  'Cl|beta': 'ClCH₂CH₂COOH',
}

export type SubGroup = (typeof SUBSTITUENT_ACIDITY_ORDER)[number]

/** The series formula for this group and position, or null when NCERT's series does not list the case. */
export function substituentFormula(group: SubGroup, position: SubPosition): string | null {
  return SERIES_CASE[`${group}|${position}`] ?? null
}

/** 1-based place of a formula in the strip (1 = strongest), or null when it is not in the strip. */
export function stripRank(formula: string | null): number | null {
  if (formula === null) return null
  const i = STRIP.findIndex((e) => e.formula === formula)
  return i < 0 ? null : i + 1
}

export type TubeSample = 'acetic' | 'benzoic' | 'phenol'

export const TUBE_SAMPLES: readonly { id: TubeSample; label: string }[] = [
  { id: 'acetic', label: 'Acetic acid' },
  { id: 'benzoic', label: 'Benzoic acid' },
  { id: 'phenol', label: 'Phenol' },
]

/** NaHCO₃ gives CO₂ with carboxylic acids only. Phenol gives no fizz. */
export function fizzes(sample: TubeSample): boolean {
  return sample !== 'phenol'
}

/** The equation shown over the tube, balanced (checked by the unit tests). Null when there is no reaction. */
export function tubeEquation(sample: TubeSample): string | null {
  if (sample === 'acetic') return 'CH₃COOH + NaHCO₃ → CH₃COONa + H₂O + CO₂'
  if (sample === 'benzoic') return 'C₆H₅COOH + NaHCO₃ → C₆H₅COONa + H₂O + CO₂'
  return null
}

/** Formats a pKa the way NCERT prints it (minus sign U+2212, integers without a decimal point). */
export function formatPka(pKa: number, approx = false): string {
  const body = Number.isInteger(pKa) ? String(Math.abs(pKa)) : Math.abs(pKa).toFixed(2)
  const sign = pKa < 0 ? '−' : ''
  return `${approx ? '≈ ' : ''}${sign}${body}`
}
