import { NCERT_OXIDANT_EQUATIONS, type NamedEquation } from '@/lib/chem/ncert-c12-unit4-tables'
import {
  OXIDANT_HALF_EQUATIONS,
  electronsTransferred,
  parseEquation,
  titrationRatio,
  type StructuredEquation,
} from '@/lib/chem/dblock'

/** Which picture a Step shows. */
export type OxoScene = 'ph' | 'dichromate' | 'permanganate' | 'neutral' | 'pair'

export interface OxoStepState {
  scene: OxoScene
  /** Electrons drawn as delivered in this Step (0 when none are counted). */
  electrons: number
  /** The reaction has reached its end state: colour change done or precipitate formed. */
  done: boolean
}

export const OXO_STEP_COUNT = 5

/** Electrons per Cr₂O₇²⁻ and per MnO₄⁻ in acid, and per MnO₄⁻ in neutral solution, from the libs. */
const DICHROMATE_E = OXIDANT_HALF_EQUATIONS.dichromateAcid.electrons
const PERMANGANATE_E = OXIDANT_HALF_EQUATIONS.permanganateAcid.electrons
const NEUTRAL_EQUATION = parseEquation(equationText('permanganate-to-dioxide-half'))
const NEUTRAL_E = electronsTransferred(NEUTRAL_EQUATION)

/** Atoms of each element in a formula such as 'Cr2O7' (a missing count is 1). */
function atomCounts(formula: string): Map<string, number> {
  const counts = new Map<string, number>()
  for (const m of formula.matchAll(/([A-Z][a-z]?)(\d*)/g)) {
    counts.set(m[1], (counts.get(m[1]) ?? 0) + Number(m[2] || 1))
  }
  return counts
}

/** Oxidation state of the metal in an oxoanion or simple ion, from its charge and formula (O taken as −2). */
export function metalStateOf(formula: string, charge: number): number {
  const counts = atomCounts(formula)
  const metal = /^[A-Z][a-z]?/.exec(formula)?.[0] ?? ''
  const metalAtoms = counts.get(metal) ?? 1
  return (charge + 2 * (counts.get('O') ?? 0)) / metalAtoms
}

export interface MetalChange {
  /** The metal whose state changes (Cr, Mn). */
  readonly metal: string
  /** Oxidation state of that metal in the oxidant. */
  readonly from: number
  /** Oxidation state of that metal in the printed product. */
  readonly to: number
  /** Electrons gained per metal atom in the oxidant. */
  readonly electronsPerMetal: number
}

/** Metal state change in a printed reduction, read from the oxidant and product formulas and the electron count. */
export function reductionChange(equation: StructuredEquation): MetalChange {
  const oxidant = equation.reactants[0]
  const metal = /^[A-Z][a-z]?/.exec(oxidant.formula)?.[0] ?? ''
  const product = equation.products.find((t) => atomCounts(t.formula).has(metal))
  if (product === undefined) throw new RangeError(`no ${metal} product in ${oxidant.formula}`)
  const metalAtoms = atomCounts(oxidant.formula).get(metal) ?? 1
  return {
    metal,
    from: metalStateOf(oxidant.formula, oxidant.charge),
    to: metalStateOf(product.formula, product.charge),
    electronsPerMetal: electronsTransferred(equation) / metalAtoms,
  }
}

export const DICHROMATE_CHANGE = reductionChange(OXIDANT_HALF_EQUATIONS.dichromateAcid.structured)
export const PERMANGANATE_CHANGE = reductionChange(OXIDANT_HALF_EQUATIONS.permanganateAcid.structured)
export const NEUTRAL_CHANGE = reductionChange(NEUTRAL_EQUATION)
/** Chromium state in chromate and in dichromate (the captions say it is the same in both). */
export const CHROMATE_CR_STATE = metalStateOf('CrO4', -2)
export const DICHROMATE_CR_STATE = metalStateOf('Cr2O7', -2)

/** An oxidation state as printed: +6, 0 or −3 (U+2212). */
export function signedState(n: number): string {
  if (n > 0) return `+${n}`
  if (n < 0) return `\u2212${-n}`
  return '0'
}

const COUNT_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven'] as const

/** A small count as a word, as the captions write it ('five electrons'). */
export function countWord(n: number): string {
  return COUNT_WORDS[n] ?? String(n)
}

export const OXO_STEPS: readonly OxoStepState[] = [
  { scene: 'ph', electrons: 0, done: false },
  { scene: 'dichromate', electrons: DICHROMATE_E, done: true },
  { scene: 'permanganate', electrons: PERMANGANATE_E, done: true },
  { scene: 'neutral', electrons: NEUTRAL_E, done: true },
  { scene: 'pair', electrons: 0, done: false },
]

export function getOxoStepState(step: number): OxoStepState {
  const i = Math.min(Math.max(Math.round(step), 0), OXO_STEP_COUNT - 1)
  return OXO_STEPS[i]
}

/** Look up a printed equation by its NCERT id (text from the lib, never retyped). */
export function equationText(id: string): string {
  const found: NamedEquation | undefined = NCERT_OXIDANT_EQUATIONS.find((e) => e.id === id)
  if (found === undefined) throw new RangeError(`no printed equation ${id}`)
  return found.equation
}

export function eVoltOf(id: string): number {
  const found = NCERT_OXIDANT_EQUATIONS.find((e) => e.id === id)
  if (found?.eVolt === undefined) throw new RangeError(`no E° for ${id}`)
  return found.eVolt
}

/** Fe²⁺ per oxidant, from the printed redox equations (6 and 5). */
export const FE2_PER_DICHROMATE = titrationRatio('Cr2O7 2-').fe2PerOxidant
export const FE2_PER_PERMANGANATE = titrationRatio('MnO4-').fe2PerOxidant

/** Each dot's opacity: the first `count` electrons are visible. */
export function electronVisible(index: number, count: number): boolean {
  return index < count
}

/** Balance check used by the unit test: the printed half-equations hold their electron counts. */
export function halfEquationBalances(id: string): boolean {
  const eq = parseEquation(equationText(id))
  return eq.reactants.length > 0 && eq.products.length > 0
}
