import { NCERT_KCL_CONDUCTIVITY } from '@/lib/chem/ncert-c12-unit2-tables'
import {
  ACETIC_ALPHA,
  ACETIC_KA,
  ACETIC_LAMBDA0,
  ACETIC_MEASURED,
  KCL_A_LINE,
  KCL_DILUTE_POINTS,
  KCL_LAMBDA0_LINE,
  MGCL2_LAMBDA0,
  volumePerMoleCm3,
} from '@/lib/chem/variation-conductivity'
import { lambda0Electrolyte } from '@/lib/chem/conductance'

/**
 * Pure data for the dilution-conductivity Scrolly. Every number comes from the variation-of-conductivity lib,
 * the same constants the Prose and the Kohlrausch Lab use. No NCERT worked-example data.
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

/** Groups thousands with a thin space, e.g. 10000 → "10 000". */
export function groupThousands(x: number): string {
  return Math.round(x).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

/* ---------- KCl (Table 2.3, dilute rows) ---------- */

function kappaAt(c: number): number {
  const row = NCERT_KCL_CONDUCTIVITY.find((r) => r.molPerL === c)
  if (!row) throw new RangeError(`No KCl row at c = ${c}`)
  return row.kappaScmInv
}

/** The concentrated and dilute ends of the cube demo (0.10 and 0.010 mol L⁻¹). */
export const C_CONC = KCL_DILUTE_POINTS[0]!.c
export const C_DILUTE = KCL_DILUTE_POINTS[1]!.c
export const LAMBDA_CONC = KCL_DILUTE_POINTS[0]!.lambdaScm2
export const LAMBDA_DILUTE = KCL_DILUTE_POINTS[1]!.lambdaScm2
export const KAPPA_CONC = kappaAt(C_CONC)
export const KAPPA_DILUTE = kappaAt(C_DILUTE)
export const VOLUME_CONC_CM3 = volumePerMoleCm3(C_CONC)
export const VOLUME_DILUTE_CM3 = volumePerMoleCm3(C_DILUTE)

/** Points on the chart: x = √c, y = Λm. */
export const KCL_POINTS = KCL_DILUTE_POINTS.map((p) => ({ c: p.c, lambdaScm2: p.lambdaScm2, x: Math.sqrt(p.c) }))
export const KCL_INTERCEPT = KCL_LAMBDA0_LINE
export const KCL_SLOPE_A = KCL_A_LINE

/* ---------- Acetic acid (illustrative point, Prose and Lab) ---------- */

export const ACETIC_C = ACETIC_MEASURED.c
export const ACETIC_LAMBDA_MEASURED = ACETIC_MEASURED.lambdaScm2
export { ACETIC_ALPHA, ACETIC_KA, ACETIC_LAMBDA0 }

/** About one molecule in this many is ionised at the illustrative point (1 / α, rounded). */
export const ACETIC_ONE_IN = Math.round(1 / ACETIC_ALPHA)

/** Ostwald dilution law solved for α, then Λm = Λ°m α. A sketch for the plot, derived from Ka. */
export function aceticMolarConductivity(c: number): number {
  const ka = ACETIC_KA
  const alpha = (-ka + Math.sqrt(ka * ka + 4 * c * ka)) / (2 * c)
  return ACETIC_LAMBDA0 * alpha
}

/* ---------- Ions (Table 2.4) ---------- */

export const MGCL2_BARS = {
  total: MGCL2_LAMBDA0,
  mg: lambda0Electrolyte([{ ion: 'Mg2+', count: 1 }]),
  cl: lambda0Electrolyte([{ ion: 'Cl-', count: 1 }]),
}

export const H_PLUS_LAMBDA0 = lambda0Electrolyte([{ ion: 'H+', count: 1 }])
export const ACETATE_LAMBDA0 = lambda0Electrolyte([{ ion: 'CH3COO-', count: 1 }])

/* ---------- Steps ---------- */

export const DILUTION_STEPS: readonly DilutionStepSpec[] = [
  {
    id: 'conductivity-falls',
    scene: 'cube',
    chart: null,
    showAcetic: false,
    ariaLabel: `A one centimetre cube of potassium chloride solution between two electrodes. Ions are dense at ${C_CONC} mol L⁻¹ and sparse after tenfold dilution to ${C_DILUTE} mol L⁻¹. Conductivity falls from ${sciNotation(KAPPA_CONC)} S cm⁻¹ to ${sciNotation(KAPPA_DILUTE)} S cm⁻¹.`,
  },
  {
    id: 'mole-grows',
    scene: 'volume',
    chart: null,
    showAcetic: false,
    ariaLabel: `Two beakers hold one mole of solute each. The concentrated beaker holds ${groupThousands(VOLUME_CONC_CM3)} cm³ and the dilute beaker holds ${groupThousands(VOLUME_DILUTE_CM3)} cm³. Molar conductivity Λm = κV rises from ${LAMBDA_CONC.toFixed(1)} to ${LAMBDA_DILUTE.toFixed(1)} S cm² mol⁻¹.`,
  },
  {
    id: 'strong-line',
    scene: 'chart',
    chart: { xMax: 0.36, yMin: 120, yMax: 152 },
    showAcetic: false,
    ariaLabel: `Graph of molar conductivity against the square root of concentration for KCl. The two dilute points lie on a straight line. Extended to zero concentration, the intercept is ${KCL_INTERCEPT.toFixed(1)} S cm² mol⁻¹ and the slope gives A = ${KCL_SLOPE_A.toFixed(1)}.`,
  },
  {
    id: 'weak-curve',
    scene: 'chart',
    chart: { xMax: 0.36, yMin: 0, yMax: 400 },
    showAcetic: true,
    ariaLabel:
      'The same axes widened. The dashed KCl line stays nearly flat, while the acetic acid curve climbs steeply toward the dilute end and has no clean intercept.',
  },
  {
    id: 'ion-bars',
    scene: 'bars',
    chart: null,
    showAcetic: false,
    ariaLabel: `Limiting molar conductivities of ions as stacked bars. MgCl₂ is ${MGCL2_BARS.mg.toFixed(1)} for Mg²⁺ plus two chloride bars of ${MGCL2_BARS.cl.toFixed(1)}, a total of ${MGCL2_BARS.total.toFixed(1)} S cm² mol⁻¹.`,
  },
  {
    id: 'alpha-ka',
    scene: 'acid',
    chart: null,
    showAcetic: false,
    ariaLabel: `Acetic acid at ${ACETIC_C.toFixed(4)} mol L⁻¹. Measured Λm ${ACETIC_LAMBDA_MEASURED.toFixed(1)} divided by Λ°m ${ACETIC_LAMBDA0.toFixed(1)} gives α = ${ACETIC_ALPHA.toFixed(4)}, about one molecule in ${ACETIC_ONE_IN} ionised. Then Ka = cα²/(1 − α) = ${sciNotation(ACETIC_KA)}.`,
  },
]

export const DILUTION_STEP_COUNT = DILUTION_STEPS.length

export function clampDilutionStep(step: number): number {
  if (!Number.isFinite(step)) return 0
  return Math.min(DILUTION_STEP_COUNT - 1, Math.max(0, Math.round(step)))
}
