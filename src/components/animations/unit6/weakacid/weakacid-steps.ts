import { weakAcidReport, type WeakAcidReport } from '@/lib/chem/weak-acid-lab'

/**
 * The weak acid used throughout Section 6.11.3: benzoic acid, C₆H₅COOH, with Ka = 6.5 × 10⁻⁵ from
 * NCERT Table 6.6 (298 K). The three concentrations are chosen for this Section, not taken from NCERT.
 */
export const BENZOIC_KA = 6.5e-5

/** Concentrations the Scrolly walks through, mol L⁻¹: 0.200, then 0.0200, then 0.00200. */
export const C_CONCENTRATED = 0.2
export const C_DILUTE = 0.02
export const C_DILUTER = 0.002

/** Number of Steps in the weak acid Scrolly. */
export const WEAK_ACID_STEP_COUNT = 5

/** What one Step of the Scrolly shows. */
export interface WeakAcidStep {
  /** Concentration in mol L⁻¹ for this Step. */
  c: number
  /** Exact solution of the quadratic, from the library. */
  report: WeakAcidReport
  /** How many rows of the ICE table are visible: 1 shows I, 3 shows I, C and E. */
  revealStep: 1 | 3
  /** Fraction shown in the beaker. Zero before the acid has been solved. */
  beakerFraction: number
  /** True on the Steps that show the pH. */
  showPH: boolean
}

const CONCENTRATIONS = [C_CONCENTRATED, C_CONCENTRATED, C_DILUTE, C_DILUTER, C_DILUTER] as const

/**
 * The state of each Step, computed from the library. The beaker and the table move together,
 * so the drawing always matches the numbers beside it.
 */
export function weakAcidSteps(): WeakAcidStep[] {
  return CONCENTRATIONS.map((c, index) => {
    const report = weakAcidReport(c, BENZOIC_KA)
    const solved = index >= 1
    return {
      c,
      report,
      revealStep: solved ? 3 : 1,
      beakerFraction: solved ? report.alpha : 0,
      showPH: index === 4,
    }
  })
}

/** Turns a value into scientific text with a true minus sign, e.g. 3.57e-3 → "3.57 × 10⁻³". */
export function sciText(value: number, digits = 2): string {
  if (value === 0) return '0'
  const sign = value < 0 ? '−' : ''
  const abs = Math.abs(value)
  let exp = Math.floor(Math.log10(abs))
  let mantissa = Number((abs / 10 ** exp).toFixed(digits))
  if (mantissa >= 10) {
    mantissa = Number((mantissa / 10).toFixed(digits))
    exp += 1
  }
  const superscript = String(exp).replace(/-/g, '⁻').replace(/\d/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[Number(d)])
  return `${sign}${mantissa.toFixed(digits)} × 10${superscript}`
}

/** A concentration: a plain decimal from 0.01 up (0.196), scientific notation below (3.57 × 10⁻³). */
export function concText(value: number): string {
  return value >= 0.01 ? value.toPrecision(3) : sciText(value, 2)
}

/** A percentage with two significant figures for α, such as 1.79 % or 16 %. */
export function percentText(alpha: number): string {
  return `${(alpha * 100).toFixed(alpha < 0.1 ? 2 : 1)} %`
}
