import { NCERT_EXAMPLE_2_6_KCL } from '@/lib/chem/ncert-c12-unit2-tables'
import {
  degreeOfDissociation,
  dissociationConstantFromAlpha,
  fitDebyeHuckelOnsager,
  lambda0Electrolyte,
} from '@/lib/chem/conductance'

/**
 * Pure data for the dilution-conductivity Scrolly. Every number comes from the libs.
 * Steps follow the Section 2.4.2 Prose: conductivity falls, the mole grows, the strong
 * electrolyte line, the weak electrolyte curve, ions as bars, and degree of dissociation.
 */

export type DilutionScene = 'cube' | 'volume' | 'chart' | 'bars' | 'acid'

export interface ChartDomain {
  readonly xMax: number
  readonly yMin: number
  readonly yMax: number
}

export interface DilutionStepSpec {
  readonly id: 'conductivity-falls' | 'mole-grows' | 'strong-line' | 'weak-curve' | 'ion-bars' | 'alpha-ka'
  readonly scene: DilutionScene
  readonly chart: ChartDomain | null
  /** Show the acetic acid sketch (Step 4 only). */
  readonly showAcetic: boolean
  readonly ariaLabel: string
}

export const DILUTION_STEPS: readonly DilutionStepSpec[] = [
  {
    id: 'conductivity-falls',
    scene: 'cube',
    chart: null,
    showAcetic: false,
    ariaLabel:
      'A one centimetre cube of potassium chloride solution between two electrodes. Ions are dense before dilution and sparse after it. Conductivity reads 1.45 × 10⁻⁴ S cm⁻¹ at 0.000989 mol L⁻¹ and falls to 2.94 × 10⁻⁵ S cm⁻¹ after five-fold dilution.',
  },
  {
    id: 'mole-grows',
    scene: 'volume',
    chart: null,
    showAcetic: false,
    ariaLabel:
      'Two beakers hold one mole of solute each. The dilute beaker holds 1011 litres at 0.000989 mol L⁻¹ and 5050 litres at 0.000198 mol L⁻¹. Molar conductivity Λm = κV stays close to 147.09 and 148.61 S cm² mol⁻¹.',
  },
  {
    id: 'strong-line',
    scene: 'chart',
    chart: { xMax: 0.036, yMin: 140, yMax: 152 },
    showAcetic: false,
    ariaLabel:
      'Graph of molar conductivity against the square root of concentration for KCl. Four points lie on a straight line. Extended to zero concentration, the intercept is about 149.8 S cm² mol⁻¹ and the slope gives A ≈ 87.4.',
  },
  {
    id: 'weak-curve',
    scene: 'chart',
    chart: { xMax: 0.12, yMin: 0, yMax: 400 },
    showAcetic: true,
    ariaLabel:
      'The same axes widened. The dashed KCl line stays nearly flat, while the acetic acid curve climbs steeply toward the dilute end and has no clean intercept.',
  },
  {
    id: 'ion-bars',
    scene: 'bars',
    chart: null,
    showAcetic: false,
    ariaLabel:
      'Limiting molar conductivities of ions as stacked bars. CaCl₂ is 119.0 plus two chloride bars of 76.3, a total of 271.6. MgSO₄ is 106.0 plus 160.0, a total of 266.0.',
  },
  {
    id: 'alpha-ka',
    scene: 'acid',
    chart: null,
    showAcetic: false,
    ariaLabel:
      'Acetic acid at 0.0100 mol L⁻¹. Measured Λm 16.5 divided by Λ°m 390.5 gives α = 0.0423, one ionised molecule in about 24. Then Ka = cα²/(1 − α) = 1.86 × 10⁻⁵.',
  },
]

export const DILUTION_STEP_COUNT = DILUTION_STEPS.length

export function clampDilutionStep(step: number): number {
  if (!Number.isFinite(step)) return 0
  return Math.min(DILUTION_STEP_COUNT - 1, Math.max(0, Math.round(step)))
}

/* ---------- KCl (Example 2.6 data) ---------- */

const KCL_ROWS = NCERT_EXAMPLE_2_6_KCL.map((r) => ({ c: r.c, lambdaScm2: r.lambdaScm2 }))

function kclRow(c: number): { c: number; lambdaScm2: number } {
  const row = KCL_ROWS.find((r) => r.c === c)
  if (!row) throw new RangeError(`No KCl row at c = ${c}`)
  return row
}

/** Dilute KCl points used on the chart: c, √c and Λm. */
export const KCL_POINTS = KCL_ROWS.map((r) => ({ ...r, x: Math.sqrt(r.c) }))

/** Least-squares Λ°m and A for the four KCl points. */
export const KCL_FIT = fitDebyeHuckelOnsager(KCL_ROWS)

/** Λm at the concentrated and dilute ends of the cube demo, S cm² mol⁻¹. */
export const LAMBDA_CONC = kclRow(0.000989).lambdaScm2
export const LAMBDA_DILUTE = kclRow(0.000198).lambdaScm2
export const C_CONC = 0.000989
export const C_DILUTE = 0.000198

/** κ = Λm × c / 1000, S cm⁻¹ (c in mol L⁻¹). */
export function kappaFromLambda(lambdaScm2: number, c: number): number {
  return (lambdaScm2 * c) / 1000
}

export const KAPPA_CONC = kappaFromLambda(LAMBDA_CONC, C_CONC)
export const KAPPA_DILUTE = kappaFromLambda(LAMBDA_DILUTE, C_DILUTE)

/** Volume (L) holding 1 mol at concentration c. */
export function litresPerMole(c: number): number {
  return 1 / c
}

/** Λm = κV: κ in S cm⁻¹, V in cm³ mol⁻¹ (1 L = 1000 cm³). */
export function lambdaFromKappaAndVolume(kappa: number, volumeL: number): number {
  return kappa * volumeL * 1000
}

/* ---------- Acetic acid (sketch from Ka) ---------- */

export const ACETIC_LAMBDA0 = lambda0Electrolyte([
  { ion: 'H+', count: 1 },
  { ion: 'CH3COO-', count: 1 },
])
export const ACETIC_C = 0.01
export const ACETIC_LAMBDA_MEASURED = 16.5
export const ACETIC_ALPHA = degreeOfDissociation(ACETIC_LAMBDA_MEASURED, ACETIC_LAMBDA0)
export const ACETIC_KA = dissociationConstantFromAlpha(ACETIC_C, ACETIC_ALPHA)

/** Ostwald dilution law solved for α, then Λm = Λ°m α. A sketch for the plot, derived from Ka. */
export function aceticMolarConductivity(c: number): number {
  const ka = ACETIC_KA
  const alpha = (-ka + Math.sqrt(ka * ka + 4 * c * ka)) / (2 * c)
  return ACETIC_LAMBDA0 * alpha
}

/* ---------- Ions (Table 2.4) ---------- */

export const CACL2_BARS = {
  total: lambda0Electrolyte([
    { ion: 'Ca2+', count: 1 },
    { ion: 'Cl-', count: 2 },
  ]),
  ca: lambda0Electrolyte([{ ion: 'Ca2+', count: 1 }]),
  cl: lambda0Electrolyte([{ ion: 'Cl-', count: 1 }]),
}

export const MGSO4_BARS = {
  total: lambda0Electrolyte([
    { ion: 'Mg2+', count: 1 },
    { ion: 'SO4_2-', count: 1 },
  ]),
  mg: lambda0Electrolyte([{ ion: 'Mg2+', count: 1 }]),
  so4: lambda0Electrolyte([{ ion: 'SO4_2-', count: 1 }]),
}

/* ---------- Formatting ---------- */

const SUPERSCRIPT: Record<string, string> = {
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
  '-': '⁻',
}

function superscript(n: number): string {
  return String(n)
    .split('')
    .map((ch) => SUPERSCRIPT[ch] ?? ch)
    .join('')
}

/** Scientific notation with Unicode superscript exponent, e.g. 1.45 × 10⁻⁴. */
export function sciNotation(x: number, decimals = 2): string {
  if (x === 0) return '0'
  const exp = Math.floor(Math.log10(Math.abs(x)))
  const mant = (x / 10 ** exp).toFixed(decimals)
  return `${mant} × 10${superscript(exp)}`
}

/** Plain number with a true minus sign (U+2212) for negatives. */
export function signed(x: number, digits: number): string {
  return (x < 0 ? '−' : '') + Math.abs(x).toFixed(digits)
}
