/**
 * The problem model behind the ICE solver simulation (NCERT Class 11 Unit 6, Section 6.6.3). Given a
 * balanced reaction, the starting amounts and K, it builds the ICE table, the equation in the extent
 * x, the reaction quotient at the start (Section 6.6.2) and at equilibrium, and ΔG° = −RT ln K
 * (Section 6.7). The numbers come from equilibrium.ts and spontaneity.ts; this file only arranges them.
 */

import {
  extentVerdict,
  predictDirection,
  reactionQuotient,
  solveIce,
  type Direction,
  type IceTable,
  type KBasis,
  type Reaction,
  type ReactionTerm,
} from './equilibrium'
import { standardGibbsFromK } from './spontaneity'

/** One ready-made reaction for the simulation. Amounts are mol L⁻¹ (concentration) or bar (pressure). */
export interface IceSolverPreset {
  id: string
  /** Button label, written with Unicode subscripts. */
  label: string
  reaction: Reaction
  basis: KBasis
  initial: Record<string, number>
  /** Equilibrium constant in the same basis as the amounts. */
  k: number
  /** Temperature for the Gibbs panel, K. */
  temperatureK: number
  /** Display names for the species, with Unicode subscripts. */
  names: Record<string, string>
  note: string
}

const term = (species: string, coefficient: number, phase: ReactionTerm['phase'] = 'g'): ReactionTerm => ({
  species,
  coefficient,
  phase,
})

/** Six presets with different stoichiometry; two are pressure-based (Kp). K values are chosen for the examples. */
export const ICE_SOLVER_PRESETS: readonly IceSolverPreset[] = [
  {
    id: 'nocl',
    label: '2NO + Cl₂ ⇌ 2NOCl',
    reaction: { reactants: [term('NO', 2), term('Cl2', 1)], products: [term('NOCl', 2)] },
    basis: 'concentration',
    initial: { NO: 2, Cl2: 1, NOCl: 0 },
    k: 2,
    temperatureK: 298,
    names: { NO: 'NO', Cl2: 'Cl₂', NOCl: 'NOCl' },
    note: 'Kc = 2.0 is chosen for this example. It is not a measured value.',
  },
  {
    id: 'nh3',
    label: 'N₂ + 3H₂ ⇌ 2NH₃',
    reaction: { reactants: [term('N2', 1), term('H2', 3)], products: [term('NH3', 2)] },
    basis: 'concentration',
    initial: { N2: 1, H2: 3, NH3: 0 },
    k: 0.5,
    temperatureK: 298,
    names: { N2: 'N₂', H2: 'H₂', NH3: 'NH₃' },
    note: 'Kc = 0.50 is chosen for this example. The 1 : 3 : 2 ratio of coefficients is the point.',
  },
  {
    id: 'n2o4',
    label: 'N₂O₄ ⇌ 2NO₂',
    reaction: { reactants: [term('N2O4', 1)], products: [term('NO2', 2)] },
    basis: 'concentration',
    initial: { N2O4: 1, NO2: 0 },
    k: 0.2,
    temperatureK: 298,
    names: { N2O4: 'N₂O₄', NO2: 'NO₂' },
    note: 'Kc = 0.20 is chosen for this example. Only the gases enter the expression.',
  },
  {
    id: 'so3',
    label: '2SO₂ + O₂ ⇌ 2SO₃ (Kp)',
    reaction: { reactants: [term('SO2', 2), term('O2', 1)], products: [term('SO3', 2)] },
    basis: 'pressure',
    initial: { SO2: 2, O2: 1, SO3: 0 },
    k: 10,
    temperatureK: 298,
    names: { SO2: 'SO₂', O2: 'O₂', SO3: 'SO₃' },
    note: 'Kp = 10 bar⁻¹ is chosen for this example. Δn = −1 for gases, so the units are bar⁻¹.',
  },
  {
    id: 'pcl5',
    label: 'PCl₅ ⇌ PCl₃ + Cl₂ (Kp)',
    reaction: { reactants: [term('PCl5', 1)], products: [term('PCl3', 1), term('Cl2', 1)] },
    basis: 'pressure',
    initial: { PCl5: 2, PCl3: 0, Cl2: 0 },
    k: 0.5,
    temperatureK: 298,
    names: { PCl5: 'PCl₅', PCl3: 'PCl₃', Cl2: 'Cl₂' },
    note: 'Kp = 0.50 bar is chosen for this example. Δn = +1, so the units are bar.',
  },
  {
    id: 'hi',
    label: '2HI ⇌ H₂ + I₂',
    reaction: { reactants: [term('HI', 2)], products: [term('H2', 1), term('I2', 1)] },
    basis: 'concentration',
    initial: { HI: 2, H2: 0, I2: 0 },
    k: 0.02,
    temperatureK: 298,
    names: { HI: 'HI', H2: 'H₂', I2: 'I₂' },
    note: 'Kc = 0.020 is chosen for this example. Only HI is present at the start, so Q = 0 and the reaction runs forward.',
  },
]

/** A balanced equation as mhchem text, without the \ce{} wrapper: 2NO(g) + Cl2(g) <=> 2NOCl(g). */
export function reactionCe(reaction: Reaction): string {
  const coefficient = (c: number) => (c === 1 ? '' : `${c}`)
  const side = (terms: readonly ReactionTerm[]) =>
    terms.map((t) => `${coefficient(t.coefficient)}${t.species}(${t.phase})`).join(' + ')
  return `${side(reaction.reactants)} <=> ${side(reaction.products)}`
}

/** A number for the x-equation in TeX: three significant figures, or a mantissa and power of ten for very large or small values. */
export function texNumber(value: number): string {
  if (value === 0) return '0'
  const a = Math.abs(value)
  if (a >= 0.01 && a < 1000) return value.toPrecision(3)
  const exponent = Math.floor(Math.log10(a))
  const mantissa = value / 10 ** exponent
  return `${mantissa.toFixed(2)} \\times 10^{${exponent}}`
}

/** The amount of one species in terms of x: starting amount plus nu·x, with nu the signed stoichiometric factor. */
function amountTex(start: number, nu: number): string {
  const magnitude = Math.abs(nu)
  const xPart = magnitude === 1 ? 'x' : `${magnitude}x`
  if (nu > 0) return start === 0 ? xPart : `${texNumber(start)} + ${xPart}`
  return start === 0 ? `-${xPart}` : `${texNumber(start)} - ${xPart}`
}

/** One factor of the expression: the amount raised to its coefficient, bracketed when it has an operator or a power. */
function factorTex(start: number, nu: number, power: number): string {
  const inner = amountTex(start, nu)
  const needsBrackets = power > 1 || /[+-]/.test(inner)
  const base = needsBrackets ? `\\left(${inner}\\right)` : inner
  return power > 1 ? `${base}^{${power}}` : base
}

/**
 * The equilibrium-constant expression with the ICE amounts substituted, as a TeX string. Products go
 * in the numerator and reactants in the denominator, each amount written as its start plus or minus
 * its coefficient times x. Gases and aqueous species only.
 */
export function xEquationTex(reaction: Reaction, initial: Record<string, number>, k: number, basis: KBasis): string {
  const gas = (terms: readonly ReactionTerm[]) => terms.filter((t) => t.phase === 'g' || t.phase === 'aq')
  const numerator = gas(reaction.products).map((t) => factorTex(initial[t.species] ?? 0, t.coefficient, t.coefficient))
  const denominator = gas(reaction.reactants).map((t) => factorTex(initial[t.species] ?? 0, -t.coefficient, t.coefficient))
  const symbol = basis === 'concentration' ? 'K_{c}' : 'K_{p}'
  const top = numerator.length > 0 ? numerator.join(' \\cdot ') : '1'
  const bottom = denominator.length > 0 ? denominator.join(' \\cdot ') : '1'
  return `${symbol} = \\dfrac{${top}}{${bottom}} = ${texNumber(k)}`
}

/** The change row of the ICE table as text: −2x, −x, +2x, with U+2212 for the minus sign. */
export function changeText(term: ReactionTerm, reactant: boolean): string {
  const sign = reactant ? '−' : '+'
  return term.coefficient === 1 ? `${sign}x` : `${sign}${term.coefficient}x`
}

/** Everything the simulation shows for one set of inputs. */
export interface IceProblem {
  ice: IceTable
  /** Reaction quotient at the starting amounts. Infinity when a reactant is absent and the numerator is not. */
  qStart: number
  /** Which way the mixture moves at the start. */
  direction: Direction
  verdict: ReturnType<typeof extentVerdict>
  /** Reaction quotient evaluated from the equilibrium amounts. Equals K to rounding. */
  qEquilibrium: number
  /** ΔG° = −RT ln K at the chosen temperature, kJ mol⁻¹. */
  deltaG0KJ: number
  /** The x-equation in KaTeX. */
  equationTex: string
}

export interface IceProblemInput {
  reaction: Reaction
  initial: Record<string, number>
  k: number
  basis: KBasis
  temperatureK: number
}

/**
 * Solves one ICE problem with the library. Throws a RangeError for inputs the library rejects: a
 * negative amount, a non-positive K, or a reaction with no reactant present at the start.
 */
export function solveIceProblem(input: IceProblemInput): IceProblem {
  const { reaction, initial, k, basis, temperatureK } = input
  const ice = solveIce(reaction, initial, k, { basis })
  const qStart = reactionQuotient(reaction, initial)
  if (Number.isNaN(qStart)) {
    throw new RangeError('Q is undefined when the reactant and product amounts are all zero')
  }
  return {
    ice,
    qStart,
    direction: predictDirection(qStart, k),
    verdict: extentVerdict(k),
    qEquilibrium: reactionQuotient(reaction, ice.equilibrium),
    deltaG0KJ: standardGibbsFromK(k, temperatureK),
    equationTex: xEquationTex(reaction, initial, k, basis),
  }
}
