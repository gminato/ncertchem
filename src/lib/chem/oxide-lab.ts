/**
 * Period 3 oxides and their reactions with water, acid and base, for the Oxide Lab
 * simulation (NCERT Class 11 Unit 3, Section 3.7.3). Every equation is stored as
 * structured terms, so the atom-balance tests can count both sides with parseFormula
 * and the display string is generated from the same data.
 */

import { parseFormula, type FormulaCounts } from './formula'
import { oxideNature, type OxideNature } from './periodicity'

/** One species in an equation, with its stoichiometric coefficient. */
export interface ReactionTerm {
  /** Formula as parsed by parseFormula, e.g. "H2SO4" or "Mg(OH)2". */
  formula: string
  coefficient: number
}

export interface Reaction {
  reactants: readonly ReactionTerm[]
  products: readonly ReactionTerm[]
}

/** Period 3 oxides in the order of the Oxide Lab: left to right across the period. */
export const PERIOD_THREE_OXIDES = [
  { symbol: 'Na', Z: 11, formula: 'Na2O' },
  { symbol: 'Mg', Z: 12, formula: 'MgO' },
  { symbol: 'Al', Z: 13, formula: 'Al2O3' },
  { symbol: 'Si', Z: 14, formula: 'SiO2' },
  { symbol: 'P', Z: 15, formula: 'P4O10' },
  { symbol: 'S', Z: 16, formula: 'SO3' },
  { symbol: 'Cl', Z: 17, formula: 'Cl2O7' },
] as const

export type OxideFormula = (typeof PERIOD_THREE_OXIDES)[number]['formula']

/** The reactions the lab shows for each oxide. null means no such reaction is shown. */
export interface OxideReactions {
  water: Reaction | null
  acid: Reaction | null
  base: Reaction | null
}

const term = (formula: string, coefficient = 1): ReactionTerm => ({ formula, coefficient })

export const OXIDE_LAB_REACTIONS: Readonly<Record<OxideFormula, OxideReactions>> = {
  Na2O: {
    water: { reactants: [term('Na2O'), term('H2O')], products: [term('NaOH', 2)] },
    acid: null,
    base: null,
  },
  MgO: {
    water: { reactants: [term('MgO'), term('H2O')], products: [term('Mg(OH)2')] },
    acid: null,
    base: null,
  },
  Al2O3: {
    water: null,
    acid: { reactants: [term('Al2O3'), term('HCl', 6)], products: [term('AlCl3', 2), term('H2O', 3)] },
    base: {
      reactants: [term('Al2O3'), term('NaOH', 2), term('H2O', 3)],
      products: [term('NaAl(OH)4', 2)],
    },
  },
  SiO2: {
    water: null,
    acid: null,
    base: { reactants: [term('SiO2'), term('NaOH', 2)], products: [term('Na2SiO3'), term('H2O')] },
  },
  P4O10: {
    water: { reactants: [term('P4O10'), term('H2O', 6)], products: [term('H3PO4', 4)] },
    acid: null,
    base: null,
  },
  SO3: {
    water: { reactants: [term('SO3'), term('H2O')], products: [term('H2SO4')] },
    acid: null,
    base: null,
  },
  Cl2O7: {
    water: { reactants: [term('Cl2O7'), term('H2O')], products: [term('HClO4', 2)] },
    acid: null,
    base: null,
  },
}

/** Formats one term for \ce{}: a coefficient of 1 is omitted. */
function ceTerm(t: ReactionTerm): string {
  return t.coefficient === 1 ? t.formula : `${t.coefficient}${t.formula}`
}

/** The equation as a mhchem string, e.g. "\\ce{Na2O + H2O -> 2NaOH}". */
export function reactionToCe(reaction: Reaction): string {
  const left = reaction.reactants.map(ceTerm).join(' + ')
  const right = reaction.products.map(ceTerm).join(' + ')
  return `\\ce{${left} -> ${right}}`
}

/** Atoms on one side of an equation: sum of coefficient × atoms per formula. */
export function sideCounts(terms: readonly ReactionTerm[]): FormulaCounts {
  const total: FormulaCounts = {}
  for (const t of terms) {
    const counts = parseFormula(t.formula)
    for (const symbol of Object.keys(counts)) {
      total[symbol] = (total[symbol] ?? 0) + counts[symbol] * t.coefficient
    }
  }
  return total
}

/**
 * Element counts that differ between the two sides, as left minus right. An empty
 * object means the equation is balanced.
 */
export function atomImbalance(reaction: Reaction): FormulaCounts {
  const left = sideCounts(reaction.reactants)
  const right = sideCounts(reaction.products)
  const diff: FormulaCounts = {}
  for (const symbol of new Set([...Object.keys(left), ...Object.keys(right)])) {
    const delta = (left[symbol] ?? 0) - (right[symbol] ?? 0)
    if (delta !== 0) diff[symbol] = delta
  }
  return diff
}

/** The nature of an oxide, from periodicity.ts (NCERT 3.7.3 names it, or a textbook class). */
export function labOxideNature(formula: OxideFormula): OxideNature {
  return oxideNature(formula)
}
