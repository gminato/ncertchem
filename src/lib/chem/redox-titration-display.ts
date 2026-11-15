/**
 * Display helpers for the Section 7.3.3 redox titration lab and Scrolly.
 *
 * The foundation lib (redox-titration.ts) gives the stoichiometry and the
 * equivalence volume. This file adds what a student actually sees: mhchem
 * equations for KaTeX, number formatting, and the flask appearance at each stage.
 */

import type { RedoxTitrationType } from './redox-titration'

/** Pure mhchem lines (no outer \ce{}) for the primary redox reaction(s) of each titration. */
export const TITRATION_EQUATIONS_MHCHEM: Readonly<Record<RedoxTitrationType, readonly string[]>> = {
  'permanganate-fe': ['MnO4- + 5Fe^{2+} + 8H+ -> Mn^{2+} + 5Fe^{3+} + 4H2O'],
  'permanganate-oxalate': ['2MnO4- + 5C2O4^{2-} + 16H+ -> 2Mn^{2+} + 10CO2 + 8H2O'],
  'dichromate-fe': ['Cr2O7^{2-} + 6Fe^{2+} + 14H+ -> 2Cr^{3+} + 6Fe^{3+} + 7H2O'],
  'iodometric-cu-thiosulphate': [
    '2Cu^{2+} + 4I- -> Cu2I2(s) + I2',
    'I2 + 2S2O3^{2-} -> 2I- + S4O6^{2-}',
  ],
}

const SUPERSCRIPT: Record<string, string> = {
  '-': '⁻',
  '+': '⁺',
  '0': '⁰',
  '1': '¹',
  '2': '²',
  '3': '³',
  '4': '⁴',
  '5': '⁵',
  '6': '⁶',
  '7': '⁷',
  '8': '⁸',
  '9': '⁹',
}

/** Formats moles as "1.25 × 10⁻³ mol" (two decimals in the mantissa). */
export function formatMolesText(moles: number): string {
  if (moles === 0) return '0 mol'
  const [mantissa, exp] = moles.toExponential(2).split('e')
  const sup = String(parseInt(exp, 10))
    .split('')
    .map((c) => SUPERSCRIPT[c] ?? c)
    .join('')
  return `${mantissa} × 10${sup} mol`
}

export interface FlaskStageInput {
  readonly type: RedoxTitrationType
  /** Titrant delivered so far, in mL. */
  readonly addedMl: number
  /** Equivalence volume, in mL. */
  readonly eqVolMl: number
  /** Whether the starch indicator has been added (iodometry only). */
  readonly starchAdded: boolean
}

/** What the flask looks like at this stage, in words a student can read. */
export function flaskAppearance({ type, addedMl, eqVolMl, starchAdded }: FlaskStageInput): string {
  const EPS = 1e-6
  const atOrPast = addedMl >= eqVolMl - EPS
  switch (type) {
    case 'permanganate-fe':
    case 'permanganate-oxalate':
      return atOrPast ? 'First lasting faint pink' : 'Colourless'
    case 'dichromate-fe':
      if (addedMl <= EPS) return 'Nearly colourless (faint Fe²⁺)'
      return atOrPast ? 'Intense violet-blue' : 'Green (Cr³⁺ accumulating)'
    case 'iodometric-cu-thiosulphate':
      if (atOrPast) return 'Off-white Cu₂I₂ (blue discharged)'
      if (starchAdded) return 'Deep blue-black (starch–iodine)'
      if (addedMl <= EPS) return 'Brown (I₃⁻ with Cu₂I₂ precipitate)'
      if (addedMl >= 0.75 * eqVolMl) return 'Pale straw yellow (ready for starch)'
      return 'Yellow-brown (I₂ fading)'
  }
}

/**
 * Fraction of the way from the start colour to the end colour, 0 at 0 mL and 1 at
 * the equivalence volume. Used to fade the dichromate flask from faint to green.
 */
export function progressToward(addedMl: number, eqVolMl: number): number {
  if (eqVolMl <= 0) return 0
  return Math.min(1, Math.max(0, addedMl / eqVolMl))
}
