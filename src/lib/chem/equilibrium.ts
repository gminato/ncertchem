/**
 * Equilibrium constants, reaction quotients, the ICE table and Le Chatelier's principle for NCERT
 * Class 11 Unit 6 (Equilibrium), Sections 6.3 to 6.8.
 *
 * Only gaseous and aqueous species appear in an equilibrium constant. Pure solids and liquids have
 * a constant activity of 1 and are left out (Section 6.5). A reaction is described by its
 * reactants and products, each with a stoichiometric coefficient and a phase.
 *
 * Gas-phase conversions use R = 0.0831 bar L mol⁻¹ K⁻¹, the value NCERT uses in Section 6.4.1.
 * Kinetics and van 't Hoff calculations use R = 8.314 J K⁻¹ mol⁻¹ through pv-work.ts.
 */

import { R_J_PER_MOL_K } from './pv-work'

/** Gas-phase constant in bar L mol⁻¹ K⁻¹, as NCERT uses in Section 6.4.1 (0.0831 bar L mol⁻¹ K⁻¹). */
export const R_BAR_L_PER_MOL_K = 0.0831

/** Phase of a species. Only 'g' and 'aq' enter an equilibrium constant. */
export type Phase = 'g' | 'aq' | 'l' | 's'

/** One species on one side of a balanced equation. */
export interface ReactionTerm {
  species: string
  coefficient: number
  phase: Phase
}

/** A balanced reversible reaction, reactants ⇌ products. */
export interface Reaction {
  reactants: readonly ReactionTerm[]
  products: readonly ReactionTerm[]
}

/** One factor of an equilibrium-constant expression: a species raised to a power. */
export interface ExpressionFactor {
  species: string
  power: number
}

/** The numerator (products) and denominator (reactants) of an equilibrium-constant expression. */
export interface KExpression {
  numerator: ExpressionFactor[]
  denominator: ExpressionFactor[]
}

/** How an equilibrium constant is written: molar concentrations (Kc) or partial pressures (Kp). */
export type KBasis = 'concentration' | 'pressure'

/** Operation that relates K for one equation to K for another (Table 6.4). */
export type KTransform = 'reverse' | { multiplyBy: number } | { divideBy: number }

/** Which way a mixture moves to reach equilibrium. */
export type Direction = 'forward' | 'reverse' | 'at equilibrium'

/** The ICE table for one reaction: rows of initial, change and equilibrium amounts. */
export interface IceTable {
  /** Species in the equilibrium expression, in reactant-then-product order. */
  species: string[]
  basis: KBasis
  /** Extent x (mol L⁻¹ or bar), positive when the reaction runs forward. */
  extent: number
  initial: Record<string, number>
  change: Record<string, number>
  equilibrium: Record<string, number>
  /** Reaction quotient evaluated at the equilibrium composition, which equals K. */
  reactionQuotient: number
}

/** One sample of a kinetics run: time in the units of the rate constants and concentrations. */
export interface TimeSample {
  time: number
  concentrations: Record<string, number>
}

/** A perturbation applied to an equilibrium mixture (Section 6.8). */
export type Perturbation =
  | { kind: 'add'; species: string; amount: number }
  | { kind: 'remove'; species: string; amount: number }
  | { kind: 'volume'; factor: number }
  | { kind: 'inert-constant-volume'; amount: number }
  | { kind: 'inert-constant-pressure'; amount: number }
  | { kind: 'temperature'; fromK: number; toK: number; deltaHkJ: number }
  | { kind: 'catalyst' }

/** An equilibrium mixture before a perturbation. */
export interface EquilibriumState {
  reaction: Reaction
  /** Equilibrium amounts (concentrations in mol L⁻¹ or partial pressures in bar) of the species. */
  equilibrium: Record<string, number>
  /** The equilibrium constant that matches these amounts, in the same basis. */
  k: number
}

/** Result of a perturbation: the immediate quotient, the new constant, the shift and the new equilibrium. */
export interface LeChatelierResult {
  immediateQ: number
  k: number
  shift: 'right' | 'left' | 'none'
  perturbed: Record<string, number>
  equilibrium: Record<string, number>
  ice: IceTable
}

function assertPositive(name: string, value: number): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${name} must be a positive number (received ${value})`)
  }
}

function assertNonNegative(name: string, value: number): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${name} must be zero or a positive number (received ${value})`)
  }
}

function assertCoefficient(term: ReactionTerm): void {
  if (!Number.isInteger(term.coefficient) || term.coefficient < 1) {
    throw new RangeError(`coefficient of ${term.species} must be a positive integer (received ${term.coefficient})`)
  }
}

/** Terms that enter the equilibrium constant: gases and aqueous species only. */
function expressionTerms(reaction: Reaction): { reactants: ReactionTerm[]; products: ReactionTerm[] } {
  const keep = (term: ReactionTerm) => {
    assertCoefficient(term)
    return term.phase === 'g' || term.phase === 'aq'
  }
  return {
    reactants: reaction.reactants.filter(keep),
    products: reaction.products.filter(keep),
  }
}

/**
 * The equilibrium-constant expression for a reaction: products over reactants, each raised to its
 * stoichiometric coefficient, with pure solids and liquids left out (Section 6.3 and 6.5).
 *
 * @example kcExpression(N2 + 3H2 ⇌ 2NH3) // numerator NH3², denominator N2 · H2³
 * @throws {RangeError} On a non-integer or non-positive coefficient
 */
export function kcExpression(reaction: Reaction): KExpression {
  const { reactants, products } = expressionTerms(reaction)
  return {
    numerator: products.map((term) => ({ species: term.species, power: term.coefficient })),
    denominator: reactants.map((term) => ({ species: term.species, power: term.coefficient })),
  }
}

/**
 * Value of the equilibrium-constant expression for the given amounts (molar concentrations for Kc,
 * partial pressures in bar for Kp). Returns Infinity if a reactant is zero and the numerator is not.
 *
 * @throws {RangeError} If a species of the expression is missing or its amount is negative
 */
function evaluateExpression(reaction: Reaction, amounts: Record<string, number>): number {
  const expression = kcExpression(reaction)
  let numerator = 1
  let denominator = 1
  for (const factor of expression.numerator) {
    numerator *= amountOf(amounts, factor.species) ** factor.power
  }
  for (const factor of expression.denominator) {
    denominator *= amountOf(amounts, factor.species) ** factor.power
  }
  if (denominator === 0) {
    return numerator === 0 ? Number.NaN : Number.POSITIVE_INFINITY
  }
  return numerator / denominator
}

function amountOf(amounts: Record<string, number>, species: string): number {
  const value = amounts[species]
  if (value === undefined) {
    throw new RangeError(`No amount given for ${species}`)
  }
  assertNonNegative(species, value)
  return value
}

/**
 * Kc from equilibrium molar concentrations (equation 6.4 and Section 6.3). Pure solids and liquids
 * are ignored.
 *
 * @throws {RangeError} If a species is missing, an amount is negative, or the reactants are all zero
 */
export function kcFromConcentrations(reaction: Reaction, concentrations: Record<string, number>): number {
  const value = evaluateExpression(reaction, concentrations)
  if (!Number.isFinite(value)) {
    throw new RangeError('Kc is undefined when a reactant concentration is zero')
  }
  return value
}

/**
 * Kp from equilibrium partial pressures in bar (equation 6.12). The same expression as Kc, with
 * pressures in place of concentrations.
 *
 * @throws {RangeError} If a species is missing, a pressure is negative, or a reactant pressure is zero
 */
export function kpFromPartialPressures(reaction: Reaction, pressures: Record<string, number>): number {
  const value = evaluateExpression(reaction, pressures)
  if (!Number.isFinite(value)) {
    throw new RangeError('Kp is undefined when a reactant pressure is zero')
  }
  return value
}

/**
 * Reaction quotient Q for any mixture (Section 6.6.2). Q has the same form as K; comparing Q with
 * K shows which way the reaction must go. Returns Infinity when a reactant amount is zero.
 *
 * @throws {RangeError} If a species is missing or an amount is negative
 */
export function reactionQuotient(reaction: Reaction, amounts: Record<string, number>): number {
  return evaluateExpression(reaction, amounts)
}

/**
 * Change in the number of moles of gas, Δn = (gaseous moles of products) − (gaseous moles of
 * reactants) (equation 6.15).
 *
 * @throws {RangeError} On a non-integer or non-positive coefficient
 */
export function deltaNGas(reaction: Reaction): number {
  const gaseous = (terms: readonly ReactionTerm[]) =>
    terms.filter((term) => term.phase === 'g').reduce((sum, term) => sum + term.coefficient, 0)
  reaction.reactants.forEach(assertCoefficient)
  reaction.products.forEach(assertCoefficient)
  return gaseous(reaction.products) - gaseous(reaction.reactants)
}

/**
 * Kp from Kc, Kp = Kc (RT)^Δn (equation 6.14). R = 0.0831 bar L mol⁻¹ K⁻¹, with concentrations in
 * mol L⁻¹ and pressures in bar.
 *
 * @param kc Kc, positive
 * @param deltaN Δn, the change in gaseous moles
 * @param temperatureK Temperature, K, positive
 * @throws {RangeError} If Kc or T is not positive
 */
export function kpFromKc(kc: number, deltaN: number, temperatureK: number): number {
  assertPositive('Kc', kc)
  assertPositive('temperature', temperatureK)
  return kc * (R_BAR_L_PER_MOL_K * temperatureK) ** deltaN
}

/**
 * Kc from Kp, Kc = Kp (RT)^(−Δn). The inverse of kpFromKc, with R = 0.0831 bar L mol⁻¹ K⁻¹.
 *
 * @throws {RangeError} If Kp or T is not positive
 */
export function kcFromKp(kp: number, deltaN: number, temperatureK: number): number {
  assertPositive('Kp', kp)
  assertPositive('temperature', temperatureK)
  return kp / (R_BAR_L_PER_MOL_K * temperatureK) ** deltaN
}

/**
 * The constant for a related equation (Table 6.4): the reverse reaction takes 1/K; multiplying the
 * coefficients by n takes Kⁿ; dividing them by n takes K^(1/n).
 *
 * @throws {RangeError} If K is not positive, or the multiplier or divisor is not positive
 */
export function transformK(k: number, operation: KTransform): number {
  assertPositive('K', k)
  if (operation === 'reverse') return 1 / k
  if ('multiplyBy' in operation) {
    assertPositive('multiplier', operation.multiplyBy)
    return k ** operation.multiplyBy
  }
  assertPositive('divisor', operation.divideBy)
  return k ** (1 / operation.divideBy)
}

const RELATIVE_TOLERANCE = 1e-9

/**
 * Which way a mixture with reaction quotient Q proceeds to reach equilibrium with constant K
 * (Section 6.6.2). Q < K: forward. Q > K: reverse.
 *
 * @throws {RangeError} If Q is negative or NaN, or K is not positive
 */
export function predictDirection(q: number, k: number): Direction {
  if (Number.isNaN(q) || q < 0) throw new RangeError(`Q must be zero or positive (received ${q})`)
  assertPositive('K', k)
  if (Math.abs(q - k) <= RELATIVE_TOLERANCE * k) return 'at equilibrium'
  return q < k ? 'forward' : 'reverse'
}

/**
 * Qualitative extent of reaction from the size of K (Section 6.6.1): K above 10³ means the products
 * predominate, K below 10⁻³ means the reactants predominate, otherwise both are present in
 * appreciable amounts.
 *
 * @throws {RangeError} If K is not positive
 */
export function extentVerdict(k: number): 'products-predominate' | 'reactants-predominate' | 'appreciable-both' {
  assertPositive('K', k)
  if (k > 1e3) return 'products-predominate'
  if (k < 1e-3) return 'reactants-predominate'
  return 'appreciable-both'
}

/** Options for solveIce. */
export interface SolveIceOptions {
  basis: KBasis
}

const BISECTION_STEPS = 200

/**
 * Solves the ICE table for the extent x of a reaction, given the initial amounts and K (Section
 * 6.6.3). Each species changes by its stoichiometric coefficient times x, with a sign that depends on
 * whether it is a reactant or a product. Amounts must stay zero or positive, which bounds x. Inside
 * those bounds the quotient increases monotonically with x, so bisection on log(Q/K) finds the
 * unique root. Works for any stoichiometry, from either side (products only, as in Table 6.2
 * experiments 5 and 6). Pure solids and liquids are not in the table.
 *
 * @param reaction Balanced reaction
 * @param initial Initial amounts of every gaseous or aqueous species (mol L⁻¹, or bar for Kp)
 * @param k Equilibrium constant in the same basis
 * @param options Basis, 'concentration' (Kc) or 'pressure' (Kp)
 * @throws {RangeError} On a negative amount, a missing species, a non-positive K, or a reaction with
 *   no gaseous or aqueous reactant
 */
export function solveIce(
  reaction: Reaction,
  initial: Record<string, number>,
  k: number,
  options: SolveIceOptions
): IceTable {
  assertPositive('K', k)
  const { reactants, products } = expressionTerms(reaction)
  const terms = [...reactants.map((t) => ({ ...t, sign: -1 })), ...products.map((t) => ({ ...t, sign: 1 }))]
  if (terms.length === 0) throw new RangeError('The reaction has no gaseous or aqueous species')
  const species = terms.map((t) => t.species)
  const start: Record<string, number> = {}
  for (const name of species) {
    start[name] = amountOf(initial, name)
  }

  // Feasible range for the extent: every amount must stay zero or positive.
  let lower = Number.NEGATIVE_INFINITY
  let upper = Number.POSITIVE_INFINITY
  for (const term of terms) {
    const nu = term.sign * term.coefficient
    const c = start[term.species]
    if (nu < 0) upper = Math.min(upper, c / -nu)
    else lower = Math.max(lower, -c / nu)
  }
  if (!Number.isFinite(lower) || !Number.isFinite(upper)) {
    throw new RangeError('The reaction needs at least one gaseous or aqueous reactant and product')
  }

  // log(Q/K) with a small floor so that a zero amount gives -Infinity, never NaN.
  const logRatio = (x: number): number => {
    let total = -Math.log(k)
    for (const term of terms) {
      const amount = start[term.species] + term.sign * term.coefficient * x
      total += term.sign * term.coefficient * Math.log(Math.max(amount, 0))
    }
    return total
  }

  let a = lower
  let b = upper
  for (let i = 0; i < BISECTION_STEPS; i++) {
    const mid = (a + b) / 2
    if (logRatio(mid) > 0) b = mid
    else a = mid
  }
  const extent = (a + b) / 2

  const change: Record<string, number> = {}
  const equilibrium: Record<string, number> = {}
  for (const term of terms) {
    const delta = term.sign * term.coefficient * extent
    change[term.species] = delta
    equilibrium[term.species] = Math.max(start[term.species] + delta, 0)
  }

  return {
    species,
    basis: options.basis,
    extent,
    initial: start,
    change,
    equilibrium,
    reactionQuotient: evaluateExpression(reaction, equilibrium),
  }
}

/**
 * Concentration against time for a reaction approaching equilibrium from its starting mixture, by
 * mass-action kinetics: forward rate kf Π[reactant]^coefficient, reverse rate kr Π[product]^coefficient,
 * integrated with fourth-order Runge–Kutta. The equilibrium reached is the one solveIce gives for
 * K = kf / kr (Figures 6.4 and 6.5). Pure solids and liquids are not in the rate laws.
 *
 * @param reaction Balanced reaction
 * @param initial Initial molar concentrations
 * @param kf Forward rate constant, positive
 * @param kr Reverse rate constant, positive
 * @param tEnd End time, positive
 * @param steps Number of integration steps, a positive integer; the result has steps + 1 samples
 * @throws {RangeError} On invalid rate constants, time or step count
 */
export function timeCourse(
  reaction: Reaction,
  initial: Record<string, number>,
  kf: number,
  kr: number,
  tEnd: number,
  steps: number
): TimeSample[] {
  assertPositive('forward rate constant', kf)
  assertPositive('reverse rate constant', kr)
  assertPositive('end time', tEnd)
  if (!Number.isInteger(steps) || steps < 1) {
    throw new RangeError(`steps must be a positive integer (received ${steps})`)
  }
  const { reactants, products } = expressionTerms(reaction)
  const species = [...reactants, ...products].map((t) => t.species)
  const nu: Record<string, number> = {}
  for (const term of reactants) nu[term.species] = (nu[term.species] ?? 0) - term.coefficient
  for (const term of products) nu[term.species] = (nu[term.species] ?? 0) + term.coefficient

  const state = new Map<string, number>(species.map((name) => [name, amountOf(initial, name)]))

  const derivative = (values: Map<string, number>): Map<string, number> => {
    const forward = reactants.reduce(
      (rate, term) => rate * Math.max(values.get(term.species) ?? 0, 0) ** term.coefficient,
      kf
    )
    const backward = products.reduce(
      (rate, term) => rate * Math.max(values.get(term.species) ?? 0, 0) ** term.coefficient,
      kr
    )
    const net = forward - backward
    return new Map(species.map((name) => [name, (nu[name] ?? 0) * net]))
  }

  const offset = (values: Map<string, number>, slope: Map<string, number>, factor: number) =>
    new Map(species.map((name) => [name, (values.get(name) ?? 0) + factor * (slope.get(name) ?? 0)]))

  const toRecord = (values: Map<string, number>): Record<string, number> =>
    Object.fromEntries(species.map((name) => [name, Math.max(values.get(name) ?? 0, 0)]))

  const h = tEnd / steps
  const samples: TimeSample[] = [{ time: 0, concentrations: toRecord(state) }]
  let current = new Map(state)
  for (let i = 1; i <= steps; i++) {
    const k1 = derivative(current)
    const k2 = derivative(offset(current, k1, h / 2))
    const k3 = derivative(offset(current, k2, h / 2))
    const k4 = derivative(offset(current, k3, h))
    current = new Map(
      species.map((name) => [
        name,
        (current.get(name) ?? 0) +
          (h / 6) * ((k1.get(name) ?? 0) + 2 * (k2.get(name) ?? 0) + 2 * (k3.get(name) ?? 0) + (k4.get(name) ?? 0)),
      ])
    )
    samples.push({ time: i * h, concentrations: toRecord(current) })
  }
  return samples
}

/**
 * Equilibrium constant at another temperature, from the van 't Hoff equation with a constant ΔH°:
 * ln(K₂/K₁) = −(ΔH°/R)(1/T₂ − 1/T₁). Uses R = 8.314 J K⁻¹ mol⁻¹ and ΔH° in kJ mol⁻¹.
 *
 * @param k1 Constant at T₁, positive
 * @param t1 First temperature, K
 * @param t2 Second temperature, K
 * @param deltaHkJ Standard enthalpy change of the reaction, kJ mol⁻¹
 * @throws {RangeError} If K₁ or a temperature is not positive
 */
export function vantHoffK(k1: number, t1: number, t2: number, deltaHkJ: number): number {
  assertPositive('K', k1)
  assertPositive('temperature', t1)
  assertPositive('temperature', t2)
  if (!Number.isFinite(deltaHkJ)) throw new RangeError(`ΔH must be finite (received ${deltaHkJ})`)
  return k1 * Math.exp((-(deltaHkJ * 1000) / R_J_PER_MOL_K) * (1 / t2 - 1 / t1))
}

function shiftFromDirection(direction: Direction): 'right' | 'left' | 'none' {
  if (direction === 'forward') return 'right'
  if (direction === 'reverse') return 'left'
  return 'none'
}

/**
 * Effect of a perturbation on an equilibrium mixture (Section 6.8, Le Chatelier's principle). The
 * function reports the immediate reaction quotient after the change, the direction the reaction
 * moves, and the new equilibrium found with solveIce.
 *
 * Volume and inert-gas cases assume every species in the equilibrium expression shares the same
 * container: a volume factor f scales every concentration by 1/f. At constant pressure, an inert gas
 * of amount a in a mixture of total amount n enlarges the volume by (n + a)/n. At constant volume an
 * inert gas changes no partial pressure or concentration, so it causes no shift. A temperature
 * change uses van 't Hoff with ΔH° to get the new K; a catalyst changes neither K nor composition.
 *
 * @throws {RangeError} On a non-positive K or factor, a negative amount, a removal larger than the
 *   amount present, or a species not in the equilibrium expression
 */
export function leChatelier(state: EquilibriumState, perturbation: Perturbation): LeChatelierResult {
  assertPositive('K', state.k)
  const { reactants, products } = expressionTerms(state.reaction)
  const expressionSpecies = [...reactants, ...products].map((t) => t.species)
  const original: Record<string, number> = {}
  for (const name of expressionSpecies) {
    original[name] = amountOf(state.equilibrium, name)
  }

  const requireSpecies = (species: string) => {
    if (!expressionSpecies.includes(species)) {
      throw new RangeError(`${species} is not in the equilibrium expression`)
    }
  }

  let perturbed: Record<string, number> = { ...original }
  let kNew = state.k

  switch (perturbation.kind) {
    case 'add': {
      requireSpecies(perturbation.species)
      assertNonNegative('amount added', perturbation.amount)
      perturbed = { ...original, [perturbation.species]: original[perturbation.species] + perturbation.amount }
      break
    }
    case 'remove': {
      requireSpecies(perturbation.species)
      assertNonNegative('amount removed', perturbation.amount)
      if (perturbation.amount > original[perturbation.species]) {
        throw new RangeError(`Cannot remove more ${perturbation.species} than is present`)
      }
      perturbed = { ...original, [perturbation.species]: original[perturbation.species] - perturbation.amount }
      break
    }
    case 'volume': {
      assertPositive('volume factor', perturbation.factor)
      perturbed = scaleAll(original, 1 / perturbation.factor)
      break
    }
    case 'inert-constant-volume': {
      assertNonNegative('amount of inert gas', perturbation.amount)
      break
    }
    case 'inert-constant-pressure': {
      assertNonNegative('amount of inert gas', perturbation.amount)
      const total = Object.values(original).reduce((sum, value) => sum + value, 0)
      if (total <= 0) throw new RangeError('Total amount must be positive at constant pressure')
      perturbed = scaleAll(original, total / (total + perturbation.amount))
      break
    }
    case 'temperature': {
      kNew = vantHoffK(state.k, perturbation.fromK, perturbation.toK, perturbation.deltaHkJ)
      break
    }
    case 'catalyst': {
      break
    }
  }

  const immediateQ = reactionQuotient(state.reaction, perturbed)
  const direction = predictDirection(immediateQ, kNew)
  const ice = solveIce(state.reaction, perturbed, kNew, { basis: 'concentration' })

  return {
    immediateQ,
    k: kNew,
    shift: shiftFromDirection(direction),
    perturbed,
    equilibrium: ice.equilibrium,
    ice,
  }
}

function scaleAll(values: Record<string, number>, factor: number): Record<string, number> {
  return Object.fromEntries(Object.entries(values).map(([name, value]) => [name, value * factor]))
}
