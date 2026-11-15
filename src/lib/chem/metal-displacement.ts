/**
 * Equations and wording for the metal displacement lab (Unit 7, Section 7.2.1).
 *
 * Every equation shown to the learner is balanced by balanceRedox and returned as
 * mhchem, ready for \ce{} rendering. Nothing is typed by hand.
 */

import { displacementOutcome, lookupPotential } from './electrode-potentials'
import { balanceRedox, isBalanced } from './redox-balance'

export type DisplacementOutcome = ReturnType<typeof displacementOutcome>

/** Charge of each cation the lab offers, and of each strip metal's ion. */
const ION_CHARGE: Readonly<Record<string, number>> = {
  Mg: 2,
  Zn: 2,
  Fe: 2,
  Pb: 2,
  Cu: 2,
  Co: 2,
  Ni: 2,
  Ag: 1,
}

export interface DisplacementEquation {
  outcome: DisplacementOutcome
  /** Balanced mhchem equation with states, or null when no reaction is observed. */
  mhchem: string | null
  /** The same equation as a checked structured reaction string, for tests. */
  skeleton: string
  /** One-line reason shown in place of an equation when nothing happens. */
  noReactionReason: string | null
}

/** Splits 'Cu2+' or 'Ag+' into the metal symbol and its charge. */
export function splitCation(cation: string): { metal: string; charge: number } {
  const match = /^([A-Z][a-z]?)(\d?)\+$/.exec(cation.trim())
  if (!match) {
    throw new RangeError(`Unrecognised cation: "${cation}"`)
  }
  const charge = match[2] ? Number(match[2]) : 1
  return { metal: match[1], charge }
}

const SUPERSCRIPT_DIGIT: Record<string, string> = { '1': '¹', '2': '²', '3': '³' }

/** Plain-text ion with Unicode superscript charge, for prose: Zn2+ becomes Zn²⁺, Ag+ becomes Ag⁺. */
export function unicodeIon(cation: string): string {
  const { metal, charge } = splitCation(cation)
  const digits = charge === 1 ? '' : (SUPERSCRIPT_DIGIT[String(charge)] ?? '')
  return `${metal}${digits}⁺`
}

/** Mhchem for a monatomic ion: Cu^2+, Ag^+ (sign stays where mhchem expects it). */
function ionMhchem(symbol: string, charge: number): string {
  return charge === 1 ? `${symbol}^+` : `${symbol}^${charge}+`
}

/**
 * Builds the balanced equation for a strip metal dipped in a cation solution.
 *
 * @param metal Strip metal symbol, e.g. 'Zn'.
 * @param cation Cation key, e.g. 'Cu2+' or 'Ag+'.
 */
export function displacementEquation(metal: string, cation: string): DisplacementEquation {
  const outcome = displacementOutcome(metal, cation)
  const target = splitCation(cation)
  const metalCharge = ION_CHARGE[metal]
  if (metalCharge === undefined) {
    throw new RangeError(`No ion charge recorded for metal "${metal}"`)
  }

  const skeleton =
    `${metal}(s) + ${ionMhchem(target.metal, target.charge)}(aq) -> ` +
    `${ionMhchem(metal, metalCharge)}(aq) + ${target.metal}(s)`

  if (outcome === 'no visible reaction') {
    const eCell = lookupPotential(cation) - lookupPotential(metal)
    return {
      outcome,
      mhchem: null,
      skeleton,
      noReactionReason: `${metal} cannot reduce ${unicodeIon(cation)}: E°cell is ${eCell.toFixed(2).replace('-', '−')} V, below zero.`,
    }
  }

  if (target.metal === metal) {
    // Same element on both sides: nothing changes, so the equation is written as an equilibrium of identical species.
    const ion = ionMhchem(target.metal, target.charge)
    return {
      outcome,
      mhchem: `${metal}(s) + ${ion}(aq) <=> ${ion}(aq) + ${metal}(s)`,
      skeleton,
      noReactionReason: null,
    }
  }

  const balanced = balanceRedox(skeleton, 'acidic')
  const arrow = outcome === 'moderate both ways' ? '<=>' : '->'
  const mhchem = balanced.equationMhchem.replace('->', arrow)
  return { outcome, mhchem, skeleton, noReactionReason: null }
}

/** True if the equation the lab would display balances in atoms and charge. */
export function displayedEquationIsBalanced(metal: string, cation: string): boolean {
  const eq = displacementEquation(metal, cation)
  if (eq.mhchem === null) return true
  // The display uses <=> for equilibria; the balance check reads the same reaction with ->.
  return isBalanced(eq.mhchem.replace('<=>', '->')).balanced
}
