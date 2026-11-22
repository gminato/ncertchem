import { NCERT_OXIDANT_EQUATIONS, type NamedEquation } from '@/lib/chem/ncert-c12-unit4-tables'
import {
  OXIDANT_HALF_EQUATIONS,
  electronsTransferred,
  parseEquation,
  titrationRatio,
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
const NEUTRAL_E = electronsTransferred(equationText('permanganate-to-dioxide-half'))

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
