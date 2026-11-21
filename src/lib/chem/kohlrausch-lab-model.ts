// Model for the Kohlrausch Lab (Class 12 Unit 2, Section 2.4.2).
// Every number comes from the Unit 2 tables or from conductance.ts; the only constant
// of its own is the acetic acid Ka, which is the value NCERT Example 2.9 arrives at.

import { NCERT_EXAMPLE_2_6_KCL, NCERT_LIMITING_ION_CONDUCTIVITY, type LimitingIonRow } from './ncert-c12-unit2-tables'
import {
  degreeOfDissociation,
  dissociationConstantFromAlpha,
  fitDebyeHuckelOnsager,
  lambda0ByCombination,
  lambda0Electrolyte,
  lambda0OfIon,
} from './conductance'

export type IonId = LimitingIonRow['id']

/** KCl molar conductivities of NCERT Example 2.6 (298 K), in the order the learner adds them. */
export const KCL_POINTS: readonly { readonly c: number; readonly lambdaScm2: number }[] = NCERT_EXAMPLE_2_6_KCL.map(
  (r) => ({ c: r.c, lambdaScm2: r.lambdaScm2 }),
)

/** Ka of acetic acid at 298 K: the result NCERT Example 2.9 reaches (1.78 × 10⁻⁵). */
export const ACETIC_ACID_KA = 1.78e-5

/** Concentrations (mol L⁻¹) at which the acetic acid curve gets a marker, in the order the learner adds them. */
export const ACETIC_STEPS: readonly number[] = [1e-5, 2e-5, 5e-5, 1e-4, 3e-4, 1e-3]

/** Λ°m of acetic acid from Kohlrausch: Λ°(HCl) + Λ°(NaCH₃COO) − Λ°(NaCl), S cm² mol⁻¹. */
export function aceticAcidDecomposition() {
  const hcl = lambda0Electrolyte([
    { ion: 'H+', count: 1 },
    { ion: 'Cl-', count: 1 },
  ])
  const naAc = lambda0Electrolyte([
    { ion: 'Na+', count: 1 },
    { ion: 'CH3COO-', count: 1 },
  ])
  const naCl = lambda0Electrolyte([
    { ion: 'Na+', count: 1 },
    { ion: 'Cl-', count: 1 },
  ])
  return { hcl, naAc, naCl, lambda0: lambda0ByCombination([hcl, naAc], [naCl]) }
}

export const ACETIC_LAMBDA0 = aceticAcidDecomposition().lambda0

/**
 * Least-squares line through the first `count` KCl points: intercept Λ°m and slope magnitude A.
 * Requires at least two points.
 */
export function fitKClPoints(count: number): { lambda0Scm2: number; A: number } {
  return fitDebyeHuckelOnsager(KCL_POINTS.slice(0, count))
}

/**
 * Acetic acid at concentration c, computed from Ka (not measured):
 * solve c α² / (1 − α) = Ka for α, then Λm = α Λ°m.
 */
export function aceticAcidFromKa(c: number): { alpha: number; lambdaScm2: number } {
  if (!(c > 0)) throw new RangeError(`Concentration must be positive, got ${c}`)
  const Ka = ACETIC_ACID_KA
  const alpha = (-Ka + Math.sqrt(Ka * Ka + 4 * c * Ka)) / (2 * c)
  return { alpha, lambdaScm2: alpha * ACETIC_LAMBDA0 }
}

/** α and Ka recovered from a molar conductivity: α = Λm/Λ°m, Ka = cα²/(1 − α). */
export function readoutFromLambda(c: number, lambdaScm2: number): { alpha: number; Ka: number } {
  const alpha = degreeOfDissociation(lambdaScm2, ACETIC_LAMBDA0)
  return { alpha, Ka: dissociationConstantFromAlpha(c, alpha) }
}

export interface IonChoice {
  readonly id: IonId
  readonly base: string
  readonly polyatomic: boolean
}

export const CATION_CHOICES: readonly IonChoice[] = [
  { id: 'Na+', base: 'Na', polyatomic: false },
  { id: 'K+', base: 'K', polyatomic: false },
  { id: 'Ca2+', base: 'Ca', polyatomic: false },
  { id: 'Mg2+', base: 'Mg', polyatomic: false },
  { id: 'H+', base: 'H', polyatomic: false },
]

export const ANION_CHOICES: readonly IonChoice[] = [
  { id: 'Cl-', base: 'Cl', polyatomic: false },
  { id: 'Br-', base: 'Br', polyatomic: false },
  { id: 'OH-', base: 'OH', polyatomic: true },
  { id: 'SO4_2-', base: 'SO₄', polyatomic: true },
  { id: 'CH3COO-', base: 'CH₃COO', polyatomic: true },
]

const SUBSCRIPT_DIGITS = ['₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉'] as const

function subscript(n: number): string {
  return n > 1 ? String(n).split('').map((d) => SUBSCRIPT_DIGITS[Number(d)]).join('') : ''
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b)
}

export interface IonPairResult {
  readonly valid: boolean
  /** Why the pair is refused (only when `valid` is false). */
  readonly reason: string | null
  readonly formula: string
  /** Stoichiometric counts ν₊ and ν₋, from charge balance. */
  readonly nuCation: number
  readonly nuAnion: number
  /** ν₊ λ°₊ and ν₋ λ°₋, S cm² mol⁻¹. */
  readonly cationContribution: number
  readonly anionContribution: number
  /** Λ°m of the salt, S cm² mol⁻¹ (Kohlrausch sum). */
  readonly lambda0Scm2: number
}

/** Build a salt from one cation and one anion of Table 2.4 and sum its ions' λ° values. */
export function buildSalt(cation: IonChoice, anion: IonChoice): IonPairResult {
  const zC = charge(cation.id)
  const zA = charge(anion.id)
  const g = gcd(zC, zA)
  const nuCation = zA / g
  const nuAnion = zC / g
  const anionPart = anion.polyatomic && nuAnion > 1 ? `(${anion.base})${subscript(nuAnion)}` : `${anion.base}${subscript(nuAnion)}`
  const formula = `${cation.base}${subscript(nuCation)}${anionPart}`

  let reason: string | null = null
  if (cation.id === 'H+' && anion.id === 'OH-') reason = 'H⁺ with OH⁻ makes water, not a salt.'
  if (cation.id === 'H+' && anion.id === 'CH3COO-') reason = 'H⁺ with CH₃COO⁻ is acetic acid, a weak electrolyte, so the strong-electrolyte sum does not apply.'

  const cationContribution = nuCation * lambda0OfIon(cation.id)
  const anionContribution = nuAnion * lambda0OfIon(anion.id)
  return {
    valid: reason === null,
    reason,
    formula,
    nuCation,
    nuAnion,
    cationContribution,
    anionContribution,
    lambda0Scm2: cationContribution + anionContribution,
  }
}

function charge(id: IonId): number {
  const row = NCERT_LIMITING_ION_CONDUCTIVITY.find((r) => r.id === id)
  if (!row) throw new RangeError(`Unknown ion: ${id}`)
  return Math.abs(row.charge)
}

/** Scientific notation with a real superscript minus: 1.0 × 10⁻⁴. */
export function formatSci(x: number, digits = 2): string {
  const exp = Math.floor(Math.log10(x))
  const mantissa = (x / 10 ** exp).toFixed(digits - 1)
  const sup: Record<string, string> = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' }
  const expText = String(exp).split('').map((d) => sup[d]).join('')
  return `${mantissa} × 10${expText}`
}
