import { AVOGADRO } from '@/lib/chem/constants'
import { molarMass } from '@/lib/chem/formula'

/** Number of Steps in the ReactionReading Animation. */
export const READING_STEP_COUNT = 4

/** Visibility of each label layer, 0 (hidden) to 1 (shown). Layers cross-fade. */
export interface ReadingSnapshot {
  /** "1 molecule", "2 molecules" under each species. */
  molecules: number
  /** "1 mol", "2 mol" under each species, and the Avogadro banner. */
  moles: number
  /** Mass in grams under each species, from molar masses. */
  grams: number
  /** Reactant and product mass bars, with their totals. */
  balance: number
}

const LAYERS: ReadingSnapshot[] = [
  { molecules: 1, moles: 0, grams: 0, balance: 0 },
  { molecules: 0, moles: 1, grams: 0, balance: 0 },
  { molecules: 0, moles: 0, grams: 1, balance: 0 },
  { molecules: 0, moles: 0, grams: 1, balance: 1 },
]

export function clampReadingStep(step: number): number {
  if (!Number.isFinite(step)) return 0
  return Math.min(READING_STEP_COUNT - 1, Math.max(0, Math.round(step)))
}

/** Target label layers for a Step. */
export function readingSnapshotForStep(step: number): ReadingSnapshot {
  return { ...LAYERS[clampReadingStep(step)] }
}

/** The balanced equation shown in the Animation: CH₄ + 2O₂ → CO₂ + 2H₂O. */
export const READING_EQUATION = {
  reactants: [
    { formula: 'CH4', coeff: 1 },
    { formula: 'O2', coeff: 2 },
  ],
  products: [
    { formula: 'CO2', coeff: 1 },
    { formula: 'H2O', coeff: 2 },
  ],
} as const

/** Mass in grams of `n` moles of a formula, from its molar mass. */
export function gramsOf(formula: string, n: number): number {
  return molarMass(formula) * n
}

const fixed2 = (v: number) => v.toFixed(2)

/** Mass of a species in the equation, as shown under it, e.g. "64.00 g" for 2 mol O₂. */
export function massLabel(formula: string, coeff: number): string {
  return `${fixed2(gramsOf(formula, coeff))} g`
}

/** Total reactant and product masses in grams, rounded to two decimals as displayed. */
export function totalMasses(): { reactants: string; products: string } {
  const sum = (side: readonly { formula: string; coeff: number }[]) =>
    side.reduce((acc, s) => acc + gramsOf(s.formula, s.coeff), 0)
  return {
    reactants: fixed2(sum(READING_EQUATION.reactants)),
    products: fixed2(sum(READING_EQUATION.products)),
  }
}

/** Avogadro's number as written on the Animation, e.g. "6.022 × 10²³". */
export const AVOGADRO_LABEL = `${(AVOGADRO / 1e23).toFixed(3)} × 10²³`

/** Visually hidden description of each Step, read by screen readers. */
export function stepDescription(step: number): string {
  const totals = totalMasses()
  switch (clampReadingStep(step)) {
    case 0:
      return 'Molecules. One CH₄ molecule reacts with two O₂ molecules to give one CO₂ and two H₂O molecules.'
    case 1:
      return `Moles. The same coefficients read as 1 mol CH₄ + 2 mol O₂ → 1 mol CO₂ + 2 mol H₂O, where 1 mol is ${AVOGADRO_LABEL} molecules.`
    case 2:
      return `Grams. Using molar masses: CH₄ ${massLabel('CH4', 1)}, O₂ ${massLabel('O2', 2)}, CO₂ ${massLabel('CO2', 1)}, H₂O ${massLabel('H2O', 2)}.`
    default:
      return `Conservation. Reactants total ${totals.reactants} g and products total ${totals.products} g.`
  }
}
