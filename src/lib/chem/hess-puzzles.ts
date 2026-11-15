/**
 * Hess's-law puzzles for the hess-builder simulation (NCERT Class 11 Unit 5, Section 5.4(e)).
 *
 * A puzzle gives a target reaction and a list of known thermochemical equations. The Learner
 * reverses and scales some of them and adds them to a route. The route is correct when its net
 * species balance equals the target's. Its ΔH is then the target's ΔH, because enthalpy is a state
 * function (Hess's law). Every equation here is either a Table 5.2 formation equation, or the
 * benzene combustion equation, so the data come from the unit's tables.
 *
 * Units: ΔH in kJ mol⁻¹ for the equation as written, with one mole of reaction.
 */

import {
  addEquations,
  formationEnthalpyKJ,
  sameSpeciesBalance,
  scaleEquation,
  solveHess,
  type HessTerm,
  type ReactionSpec,
  type ThermoEquation,
} from './hess'

/** Factors the Learner can apply to an equation. A reversal is a separate control (sign). */
export const SCALE_FACTORS = [0.5, 1, 2, 3, 6] as const

/** One term of a route: an available equation, with a signed, non-zero multiplier. */
export interface RouteTerm {
  /** Index into the puzzle's `available` list. */
  index: number
  /** Multiplier. Negative means the equation is reversed. */
  factor: number
}

export interface HessPuzzle {
  id: string
  title: string
  /** 1 (easiest) to 4 (hardest). */
  difficulty: 1 | 2 | 3 | 4
  /** The Learner's task, in one sentence. */
  prompt: string
  target: ReactionSpec
  available: readonly ThermoEquation[]
  /** A nudge that does not give the answer. */
  hint: string
}

function eq(label: string, reactants: HessTerm[], products: HessTerm[], deltaHKJ: number): ThermoEquation {
  return { label, reactants, products, deltaHKJ }
}

function rxn(label: string, reactants: HessTerm[], products: HessTerm[]): ReactionSpec {
  return { label, reactants, products }
}

const t = (species: string, coefficient: number): HessTerm => ({ species, coefficient })

/** Carbon burning to CO₂ and to CO: the Table 5.2 formation equations, with ΔfH read from the table. */
const CO2_FORMATION = eq(
  'C(graphite) + O2(g) → CO2(g)',
  [t('C(graphite)', 1), t('O2(g)', 1)],
  [t('CO2(g)', 1)],
  formationEnthalpyKJ('CO2(g)'),
)
const CO_FORMATION = eq(
  'C(graphite) + ½O2(g) → CO(g)',
  [t('C(graphite)', 1), t('O2(g)', 0.5)],
  [t('CO(g)', 1)],
  formationEnthalpyKJ('CO(g)'),
)
const H2O_FORMATION = eq(
  'H2(g) + ½O2(g) → H2O(l)',
  [t('H2(g)', 1), t('O2(g)', 0.5)],
  [t('H2O(l)', 1)],
  formationEnthalpyKJ('H2O(l)'),
)

export const HESS_PUZZLES: readonly HessPuzzle[] = [
  {
    id: 'co-to-co2',
    title: 'Oxidising carbon monoxide',
    difficulty: 1,
    prompt: 'Find ΔH for CO(g) + ½O₂(g) → CO₂(g). Both known equations start from carbon.',
    target: rxn('CO(g) + ½O2(g) → CO2(g)', [t('CO(g)', 1), t('O2(g)', 0.5)], [t('CO2(g)', 1)]),
    available: [CO2_FORMATION, CO_FORMATION],
    hint: 'Carbon appears once on each side of the two known equations. Reverse one of them so that it cancels.',
  },
  {
    id: 'hbr-formation',
    title: 'Two moles of hydrogen bromide',
    difficulty: 2,
    prompt: 'Find ΔH for H₂(g) + Br₂(l) → 2HBr(g). The known equation makes one mole of HBr.',
    target: rxn('H2(g) + Br2(l) → 2HBr(g)', [t('H2(g)', 1), t('Br2(l)', 1)], [t('HBr(g)', 2)]),
    available: [
      eq(
        '½H2(g) + ½Br2(l) → HBr(g)',
        [t('H2(g)', 0.5), t('Br2(l)', 0.5)],
        [t('HBr(g)', 1)],
        formationEnthalpyKJ('HBr(g)'),
      ),
      H2O_FORMATION,
    ],
    hint: 'Your equation is for one mole of HBr. Scale it so that the product has two moles.',
  },
  {
    id: 'iron-oxide-co',
    title: 'Reducing iron(III) oxide with carbon monoxide',
    difficulty: 3,
    prompt: 'Find ΔH for Fe₂O₃(s) + 3CO(g) → 2Fe(s) + 3CO₂(g). One of the four equations is not needed.',
    target: rxn('Fe2O3(s) + 3CO(g) → 2Fe(s) + 3CO2(g)', [t('Fe2O3(s)', 1), t('CO(g)', 3)], [t('Fe(s)', 2), t('CO2(g)', 3)]),
    available: [
      CO2_FORMATION,
      CO_FORMATION,
      eq(
        '2Fe(s) + 3/2 O2(g) → Fe2O3(s)',
        [t('Fe(s)', 2), t('O2(g)', 1.5)],
        [t('Fe2O3(s)', 1)],
        formationEnthalpyKJ('Fe2O3(s)'),
      ),
      H2O_FORMATION,
    ],
    hint: 'The target has three CO on the left and three CO₂ on the right. Scale the two carbon equations to match, and reverse the iron oxide one.',
  },
  {
    id: 'benzene-formation',
    title: 'Making benzene from its elements',
    difficulty: 4,
    prompt: 'Find ΔfH of C₆H₆(l) from 6C(graphite) + 3H₂(g) → C₆H₆(l). You are given the combustion of benzene, not its formation.',
    target: rxn('6C(graphite) + 3H2(g) → C6H6(l)', [t('C(graphite)', 6), t('H2(g)', 3)], [t('C6H6(l)', 1)]),
    available: [
      eq(
        'C6H6(l) + 15/2 O2(g) → 6CO2(g) + 3H2O(l)',
        [t('C6H6(l)', 1), t('O2(g)', 7.5)],
        [t('CO2(g)', 6), t('H2O(l)', 3)],
        -3267.0,
      ),
      eq('C(graphite) + O2(g) → CO2(g)', [t('C(graphite)', 1), t('O2(g)', 1)], [t('CO2(g)', 1)], -393.5),
      H2O_FORMATION,
    ],
    hint: 'Reverse the combustion of benzene. Then add six carbon-dioxide equations and three water equations, each scaled to match the coefficients.',
  },
]

/** Net coefficient of each species in a reaction. Products are positive, reactants negative. */
export function reactionBalance(spec: ReactionSpec): Map<string, number> {
  const balance = new Map<string, number>()
  for (const term of spec.products) balance.set(term.species, (balance.get(term.species) ?? 0) + term.coefficient)
  for (const term of spec.reactants) balance.set(term.species, (balance.get(term.species) ?? 0) - term.coefficient)
  return balance
}

/** Scaled, possibly reversed, copy of an available equation, for one route term. */
export function termEquation(puzzle: HessPuzzle, term: RouteTerm): ThermoEquation {
  const source = puzzle.available[term.index]
  if (!source) throw new RangeError(`puzzle ${puzzle.id} has no equation ${term.index}`)
  return scaleEquation(source, term.factor)
}

/** Running ΔH after each term, kJ mol⁻¹. The last entry is the ΔH of the whole route. */
export function runningTotalsKJ(puzzle: HessPuzzle, route: readonly RouteTerm[]): number[] {
  let total = 0
  return route.map((term) => {
    total += termEquation(puzzle, term).deltaHKJ
    return total
  })
}

/** The route's net equation, or null for an empty route. */
export function routeEquation(puzzle: HessPuzzle, route: readonly RouteTerm[]): ThermoEquation | null {
  let net: ThermoEquation | null = null
  for (const term of route) {
    const next = termEquation(puzzle, term)
    net = net ? addEquations(net, next) : next
  }
  return net
}

/**
 * Species whose net coefficient differs between the route and the target: the ones still to be
 * cancelled or added. Empty when the route gives the target's balance. An empty route lists
 * every species of the target.
 */
export function unmatchedSpecies(puzzle: HessPuzzle, route: readonly RouteTerm[]): string[] {
  const want = reactionBalance(puzzle.target)
  const net = routeEquation(puzzle, route)
  const have = net ? reactionBalance(net) : new Map<string, number>()
  const species = new Set([...want.keys(), ...have.keys()])
  return [...species].filter((sp) => Math.abs((want.get(sp) ?? 0) - (have.get(sp) ?? 0)) > 1e-9).sort()
}

/** True when the route is not empty and its net species balance equals the target's. */
export function routeMatchesTarget(puzzle: HessPuzzle, route: readonly RouteTerm[]): boolean {
  if (route.length === 0) return false
  const net = routeEquation(puzzle, route)
  return net !== null && sameSpeciesBalance(net, puzzle.target)
}

/**
 * The route that solves the puzzle, from hess.ts's solveHess. Equations with a zero multiplier are
 * left out, and the rest keep the order the puzzle gives them.
 *
 * @throws {Error} If the puzzle cannot be solved from its equations
 */
export function solutionRoute(puzzle: HessPuzzle): { route: RouteTerm[]; deltaHKJ: number } {
  const solution = solveHess(puzzle.target, puzzle.available)
  if (!solution) throw new Error(`puzzle ${puzzle.id} cannot be solved from its equations`)
  const route = solution.multipliers
    .map((factor, index) => ({ index, factor }))
    .filter((term) => term.factor !== 0)
  return { route, deltaHKJ: solution.deltaHKJ }
}

/**
 * Chemical equation in mhchem notation, for KaTeX. Halves and three-halves are written as
 * fractions, and graphite is shown as solid carbon, C(s), to keep the notation simple.
 */
export function equationToCe(spec: ReactionSpec): string {
  const coefficientText = (c: number): string => {
    if (Math.abs(c - 0.5) < 1e-9) return '1/2 '
    if (Math.abs(c - 1.5) < 1e-9) return '3/2 '
    if (Math.abs(c - 7.5) < 1e-9) return '15/2 '
    return c === 1 ? '' : `${c} `
  }
  const speciesText = (sp: string): string => sp.replace('C(graphite)', 'C(s)')
  const side = (terms: readonly HessTerm[]): string =>
    terms.map((term) => `${coefficientText(term.coefficient)}${speciesText(term.species)}`).join(' + ')
  return `${side(spec.reactants)} -> ${side(spec.products)}`
}
