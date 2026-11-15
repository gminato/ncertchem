/**
 * Kc and Kp for a balanced equation typed as text, with each step of the conversion made explicit
 * (NCERT Class 11 Unit 6, Section 6.4.1 and Section 6.5).
 *
 * Kp = Kc (RT)^Δn, with R = 0.0831 bar L mol⁻¹ K⁻¹, concentrations in mol L⁻¹ and pressures in bar.
 * Δn counts gaseous species only. Pure solids and liquids (phases s and l) are left out of both
 * constants, and aqueous species are left out of Kp because they have no partial pressure.
 */

import {
  deltaNGas,
  kcFromKp,
  kpFromKc,
  R_BAR_L_PER_MOL_K,
  type Phase,
  type Reaction,
  type ReactionTerm,
} from './equilibrium'

/** Phases written in an equation. Only g, aq, l and s are accepted. */
const PHASE_SUFFIX = /\((g|aq|l|s)\)$/

/**
 * Parses a balanced equation written as text, e.g. "N2(g) + 3H2(g) <=> 2NH3(g)". Terms are separated
 * by " + " (with spaces); the arrow may be "<=>", "⇌" or "=". Every species needs a phase suffix.
 *
 * @throws {RangeError} If the arrow, a term, a phase or a coefficient is missing or malformed
 */
export function parseEquation(text: string): Reaction {
  const sides = text.split(/\s*(?:<=>|⇌|=)\s*/)
  if (sides.length !== 2) {
    throw new RangeError('Write the equation with one arrow: <=> or ⇌')
  }
  const [left, right] = sides.map((side) => parseSide(side.trim()))
  return { reactants: left, products: right }
}

function parseSide(side: string): ReactionTerm[] {
  if (side === '') throw new RangeError('Each side of the equation needs at least one species')
  return side.split(/\s+\+\s+/).map(parseTerm)
}

function parseTerm(raw: string): ReactionTerm {
  const match = PHASE_SUFFIX.exec(raw)
  if (!match) {
    throw new RangeError(`Add the phase to "${raw}", e.g. (g), (aq), (l) or (s)`)
  }
  const phase = match[1] as Phase
  const body = raw.slice(0, match.index).trim()
  const coefficientMatch = /^(\d*)\s*(.+)$/.exec(body)
  if (!coefficientMatch) throw new RangeError(`Cannot read "${raw}"`)
  const coefficient = coefficientMatch[1] === '' ? 1 : Number(coefficientMatch[1])
  const species = coefficientMatch[2]
  if (!/^[A-Za-z0-9()+\-]+$/.test(species)) {
    throw new RangeError(`"${species}" is not a formula`)
  }
  if (coefficient < 1 || !Number.isInteger(coefficient)) {
    throw new RangeError(`The coefficient of ${species} must be a whole number of at least 1`)
  }
  return { species, coefficient, phase }
}

/** Which species of an equation take part in the equilibrium constant, and which are left out. */
export interface EquationInspection {
  /** Gaseous moles on the reactant side (sum of coefficients with phase g). */
  gasReactants: number
  /** Gaseous moles on the product side. */
  gasProducts: number
  /** Δn = gasProducts − gasReactants (equation 6.15). */
  deltaN: number
  /** Species in the expression: gases and aqueous species. */
  included: ReactionTerm[]
  /** Pure solids and liquids, left out of the expression (Section 6.5). */
  excluded: ReactionTerm[]
  /** True if at least one gaseous species is present, so Kp is defined. */
  hasGas: boolean
}

/** Inspects a parsed equation: Δn, the included species and the excluded solids and liquids. */
export function inspectEquation(reaction: Reaction): EquationInspection {
  const all = [...reaction.reactants, ...reaction.products]
  const gasOf = (terms: readonly ReactionTerm[]) =>
    terms.filter((t) => t.phase === 'g').reduce((sum, t) => sum + t.coefficient, 0)
  const gasReactants = gasOf(reaction.reactants)
  const gasProducts = gasOf(reaction.products)
  return {
    gasReactants,
    gasProducts,
    deltaN: deltaNGas(reaction),
    included: all.filter((t) => t.phase === 'g' || t.phase === 'aq'),
    excluded: all.filter((t) => t.phase === 's' || t.phase === 'l'),
    hasGas: gasReactants + gasProducts > 0,
  }
}

/** One step of a Kc ↔ Kp conversion, with the numbers that feed it. */
export interface ConversionSteps {
  reaction: Reaction
  inspection: EquationInspection
  temperatureK: number
  /** Which constant was given. */
  from: 'Kc' | 'Kp'
  input: number
  /** RT in bar L mol⁻¹ (equal to bar per mol L⁻¹ at this temperature): 0.0831 × T. */
  rt: number
  /** (RT)^Δn, the factor between the two constants. */
  factor: number
  /** The constant asked for. */
  output: number
  /** Which constant the output is. */
  to: 'Kp' | 'Kc'
}

/**
 * Converts Kc to Kp, or Kp to Kc, for one equation at one temperature, keeping every step.
 * Kp = Kc (RT)^Δn; Kc = Kp / (RT)^Δn.
 *
 * @throws {RangeError} If the equation has no gaseous species (Kp is then undefined), if the
 *   constant or the temperature is not positive, or if the equation is malformed
 */
export function convertEquilibriumConstant(
  reaction: Reaction,
  value: number,
  from: 'Kc' | 'Kp',
  temperatureK: number
): ConversionSteps {
  const inspection = inspectEquation(reaction)
  if (!inspection.hasGas) {
    throw new RangeError('Kp is defined only when a species is a gas; this equation has none')
  }
  const rt = R_BAR_L_PER_MOL_K * temperatureK
  const factor = rt ** inspection.deltaN
  const output = from === 'Kc' ? kpFromKc(value, inspection.deltaN, temperatureK) : kcFromKp(value, inspection.deltaN, temperatureK)
  return {
    reaction,
    inspection,
    temperatureK,
    from,
    input: value,
    rt,
    factor,
    output,
    to: from === 'Kc' ? 'Kp' : 'Kc',
  }
}

/** Mhchem source for one term, e.g. "3H2(g)". */
export function termCe(term: ReactionTerm): string {
  return `${term.coefficient > 1 ? term.coefficient : ''}${term.species}(${term.phase})`
}

/** Mhchem source for a whole equation, e.g. "N2(g) + 3H2(g) <=> 2NH3(g)". */
export function equationCe(reaction: Reaction): string {
  const side = (terms: readonly ReactionTerm[]) => terms.map(termCe).join(' + ')
  return `${side(reaction.reactants)} <=> ${side(reaction.products)}`
}

/**
 * LaTeX for the equilibrium-constant expression, with pure solids and liquids left out. Use inside
 * a KaTeX display. `symbol` is the label, K_{c} or K_{p}.
 */
export function expressionLatex(reaction: Reaction, symbol: 'K_{c}' | 'K_{p}'): string {
  const side = (terms: readonly ReactionTerm[]) => {
    const kept = terms.filter((t) => t.phase === 'g' || t.phase === 'aq')
    if (kept.length === 0) return '1'
    return kept
      .map((t) => {
        const bracket = `[\\ce{${t.species}}]`
        return t.coefficient === 1 ? bracket : `${bracket}^{${t.coefficient}}`
      })
      .join(' ')
  }
  const top = side(reaction.products)
  const bottom = side(reaction.reactants)
  return bottom === '1' ? `${symbol} = ${top}` : `${symbol} = \\frac{${top}}{${bottom}}`
}
