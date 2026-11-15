/**
 * Hess's law for NCERT Class 11 Unit 5, Section 5.4(e) (and the formation-enthalpy route of
 * Section 5.4(c)–(d)). Thermochemical equations are data: a list of species with their
 * coefficients, a sign for each side, and ΔH in kJ mol⁻¹ for the equation as written.
 *
 * A species is written as in NCERT Table 5.2, with its state in brackets, e.g. 'O2(g)', 'C(graphite)',
 * 'H2O(l)'. Two species are the same only when the label is the same, so the physical state is part
 * of the identity (H2O(l) and H2O(g) are different species).
 *
 * Coefficients may be fractions (½O2 is 0.5). The equation's ΔH is for the amounts the coefficients
 * give (one mole of reaction), so scaling an equation scales its ΔH.
 */

import { NCERT_TABLE_5_2_FORMATION } from './ncert-unit5-tables'

/** One species in a thermochemical equation. Coefficients are positive; the side gives the sign. */
export interface HessTerm {
  species: string
  coefficient: number
}

/** A balanced equation without an enthalpy, such as the target of a Hess's-law problem. */
export interface ReactionSpec {
  label: string
  reactants: readonly HessTerm[]
  products: readonly HessTerm[]
}

/** A thermochemical equation: reactants → products, with ΔH in kJ mol⁻¹ (one mole of reaction). */
export interface ThermoEquation extends ReactionSpec {
  deltaHKJ: number
}

/** Net coefficient of each species: positive for products, negative for reactants. */
type NetVector = Map<string, number>

/** Coefficients smaller than this are treated as zero. */
const EPS = 1e-9

function assertTerm(term: HessTerm): void {
  if (term.species.length === 0) {
    throw new RangeError('a species label must not be empty')
  }
  if (!Number.isFinite(term.coefficient) || term.coefficient <= 0) {
    throw new RangeError(`coefficient of ${term.species} must be positive (received ${term.coefficient})`)
  }
}

function assertEquationDeltaH(eq: ThermoEquation): void {
  if (!Number.isFinite(eq.deltaHKJ)) {
    throw new RangeError(`ΔH of "${eq.label}" must be a finite number (received ${eq.deltaHKJ})`)
  }
}

function netVector(eq: ReactionSpec): NetVector {
  const net: NetVector = new Map()
  for (const term of eq.products) {
    assertTerm(term)
    net.set(term.species, (net.get(term.species) ?? 0) + term.coefficient)
  }
  for (const term of eq.reactants) {
    assertTerm(term)
    net.set(term.species, (net.get(term.species) ?? 0) - term.coefficient)
  }
  return net
}

/** Builds an equation from net coefficients, with the given ΔH. Zero entries are dropped. */
function fromNet(label: string, net: NetVector, deltaHKJ: number): ThermoEquation {
  const reactants: HessTerm[] = []
  const products: HessTerm[] = []
  for (const [species, value] of net) {
    if (Math.abs(value) < EPS) continue
    if (value > 0) products.push({ species, coefficient: value })
    else reactants.push({ species, coefficient: -value })
  }
  return { label, reactants, products, deltaHKJ }
}

/**
 * Multiplies an equation by a non-zero factor. Its ΔH is multiplied by the same factor.
 * Scaling by ½ halves the equation and its ΔH (Section 5.4(e)).
 *
 * @throws {RangeError} If the factor is zero or not finite
 */
export function scaleEquation(eq: ThermoEquation, factor: number): ThermoEquation {
  if (!Number.isFinite(factor) || factor === 0) {
    throw new RangeError(`scale factor must be finite and non-zero (received ${factor})`)
  }
  assertEquationDeltaH(eq)
  const net: NetVector = new Map()
  for (const [species, value] of netVector(eq)) net.set(species, value * factor)
  return fromNet(`${factor} × (${eq.label})`, net, eq.deltaHKJ * factor)
}

/**
 * The same equation written backwards. Reversing an equation reverses the sign of ΔH (Section
 * 5.4(e), rule 3).
 */
export function reverseEquation(eq: ThermoEquation): ThermoEquation {
  return { ...scaleEquation(eq, -1), label: `reverse of (${eq.label})` }
}

/**
 * The sum of two equations: species on the same side are combined and their ΔH values added.
 * Species on opposite sides cancel.
 */
export function addEquations(a: ThermoEquation, b: ThermoEquation): ThermoEquation {
  assertEquationDeltaH(a)
  assertEquationDeltaH(b)
  const net = netVector(a)
  for (const [species, value] of netVector(b)) {
    net.set(species, (net.get(species) ?? 0) + value)
  }
  return fromNet(`(${a.label}) + (${b.label})`, net, a.deltaHKJ + b.deltaHKJ)
}

/**
 * Whether two equations have the same net species balance, ignoring their ΔH and labels. Used to
 * check that a combination of equations gives the target.
 */
export function sameSpeciesBalance(a: ReactionSpec, b: ReactionSpec): boolean {
  const na = netVector(a)
  const nb = netVector(b)
  const species = new Set([...na.keys(), ...nb.keys()])
  for (const sp of species) {
    if (Math.abs((na.get(sp) ?? 0) - (nb.get(sp) ?? 0)) > EPS) return false
  }
  return true
}

/** Result of solveHess: the multiplier for each available equation, and the resulting ΔH. */
export interface HessSolution {
  /** Multiplier for each available equation, in the order given. May be negative or fractional. */
  multipliers: number[]
  /** ΔH of the target, kJ mol⁻¹, from the multipliers. */
  deltaHKJ: number
}

/**
 * Finds multipliers c_j so that Σ c_j × (available equation j) has the same species balance as the
 * target. Then ΔH(target) = Σ c_j ΔH_j, which is Hess's law. The system is solved by Gauss–Jordan
 * elimination. If several solutions exist, the free multipliers are set to zero.
 *
 * @returns The solution, or null when the available equations cannot build the target.
 */
export function solveHess(target: ReactionSpec, available: readonly ThermoEquation[]): HessSolution | null {
  if (available.length === 0) return null
  for (const eq of available) assertEquationDeltaH(eq)

  const targetNet = netVector(target)
  const nets = available.map(netVector)
  const species = [...new Set([...targetNet.keys(), ...nets.flatMap((n) => [...n.keys()])])]
  const cols = available.length
  const rows = species.length

  // Augmented matrix: one row per species, one column per available equation, then the target.
  const m: number[][] = species.map((sp) => [...nets.map((n) => n.get(sp) ?? 0), targetNet.get(sp) ?? 0])

  const pivotCols: number[] = []
  let pivotRow = 0
  for (let c = 0; c < cols && pivotRow < rows; c++) {
    let best = pivotRow
    for (let r = pivotRow + 1; r < rows; r++) {
      if (Math.abs(m[r][c]) > Math.abs(m[best][c])) best = r
    }
    if (Math.abs(m[best][c]) < EPS) continue
    ;[m[pivotRow], m[best]] = [m[best], m[pivotRow]]
    const pivot = m[pivotRow][c]
    m[pivotRow] = m[pivotRow].map((v) => v / pivot)
    for (let r = 0; r < rows; r++) {
      if (r === pivotRow) continue
      const factor = m[r][c]
      if (Math.abs(factor) < EPS) continue
      m[r] = m[r].map((v, k) => v - factor * m[pivotRow][k])
    }
    pivotCols.push(c)
    pivotRow++
  }

  // Rows below the last pivot must read 0 = 0, otherwise the target cannot be built.
  for (let r = pivotRow; r < rows; r++) {
    if (Math.abs(m[r][cols]) > EPS) return null
  }

  const multipliers = new Array<number>(cols).fill(0)
  pivotCols.forEach((c, r) => {
    const value = m[r][cols]
    const rounded = Math.round(value)
    multipliers[c] = Math.abs(value - rounded) < 1e-9 ? rounded : value
  })

  // Verify the combination reproduces the target's species balance.
  for (const sp of species) {
    let total = 0
    multipliers.forEach((c, j) => {
      total += c * (nets[j].get(sp) ?? 0)
    })
    if (Math.abs(total - (targetNet.get(sp) ?? 0)) > 1e-7) return null
  }

  const deltaHKJ = multipliers.reduce((sum, c, j) => sum + c * available[j].deltaHKJ, 0)
  return { multipliers, deltaHKJ }
}

/**
 * Elements in their reference (most stable) state at 298 K and 1 bar whose formation enthalpy is
 * zero by convention but which are not listed in Table 5.2. Dihydrogen, dichlorine, dibromine,
 * carbon (graphite) and the others that appear in the table are read from the table instead.
 */
export const ELEMENT_REFERENCE_STATES: readonly string[] = [
  'O2(g)',
  'N2(g)',
  'F2(g)',
  'I2(s)',
  'S(rhombic)',
  'Fe(s)',
  'Na(s)',
]

/**
 * Standard molar enthalpy of formation of a species, kJ mol⁻¹, from Table 5.2. A reference-state
 * element is zero by convention (Section 5.4(c)).
 *
 * @throws {RangeError} If the species is neither in Table 5.2 nor a reference-state element
 */
export function formationEnthalpyKJ(species: string): number {
  const row = NCERT_TABLE_5_2_FORMATION.rows.find((r) => r.species === species)
  if (row) return row.formationKJ
  if (ELEMENT_REFERENCE_STATES.includes(species)) return 0
  throw new RangeError(`no standard enthalpy of formation for ${species} in NCERT Table 5.2`)
}

/**
 * Standard reaction enthalpy from standard enthalpies of formation, Σ ν ΔfH(products) − Σ ν ΔfH(reactants)
 * (equation 5.15). Uses Table 5.2 through formationEnthalpyKJ.
 *
 * @throws {RangeError} If a species is not in Table 5.2 or the reference states
 */
export function reactionEnthalpyFromFormation(eq: ReactionSpec): number {
  const side = (terms: readonly HessTerm[]): number =>
    terms.reduce((sum, t) => sum + t.coefficient * formationEnthalpyKJ(t.species), 0)
  return side(eq.products) - side(eq.reactants)
}

/** Builds a thermochemical equation from species lists, for the NCERT examples below. */
function equation(label: string, reactants: HessTerm[], products: HessTerm[], deltaHKJ: number): ThermoEquation {
  return { label, reactants, products, deltaHKJ }
}

/** Builds a reaction without an enthalpy (a target to be found by Hess's law). */
function reaction(label: string, reactants: HessTerm[], products: HessTerm[]): ReactionSpec {
  return { label, reactants, products }
}

/** NCERT Section 5.4(e): C(graphite) + ½O2 → CO(g) cannot be measured directly, so Hess's law is used. */
export const NCERT_HESS_CO_TARGET = reaction(
  'C(graphite) + ½O2(g) → CO(g)',
  [{ species: 'C(graphite)', coefficient: 1 }, { species: 'O2(g)', coefficient: 0.5 }],
  [{ species: 'CO(g)', coefficient: 1 }],
)

/** NCERT Section 5.4(e), equation (i): C(graphite) + O2(g) → CO2(g), ΔrH = −393.5 kJ mol⁻¹. */
export const NCERT_HESS_CO2_FORMATION = equation(
  'C(graphite) + O2(g) → CO2(g)',
  [{ species: 'C(graphite)', coefficient: 1 }, { species: 'O2(g)', coefficient: 1 }],
  [{ species: 'CO2(g)', coefficient: 1 }],
  -393.5,
)

/** NCERT Section 5.4(e), equation (ii): CO(g) + ½O2(g) → CO2(g), ΔrH = −283.0 kJ mol⁻¹. */
export const NCERT_HESS_CO_OXIDATION = equation(
  'CO(g) + ½O2(g) → CO2(g)',
  [{ species: 'CO(g)', coefficient: 1 }, { species: 'O2(g)', coefficient: 0.5 }],
  [{ species: 'CO2(g)', coefficient: 1 }],
  -283.0,
)

/** NCERT Problem 5.9, equation (ii): C6H6(l) + 15/2 O2(g) → 6CO2(g) + 3H2O(l), ΔcH = −3267.0 kJ mol⁻¹. */
export const NCERT_PROBLEM_5_9_BENZENE_COMBUSTION = equation(
  'C6H6(l) + 15/2 O2(g) → 6CO2(g) + 3H2O(l)',
  [{ species: 'C6H6(l)', coefficient: 1 }, { species: 'O2(g)', coefficient: 7.5 }],
  [{ species: 'CO2(g)', coefficient: 6 }, { species: 'H2O(l)', coefficient: 3 }],
  -3267.0,
)

/** NCERT Problem 5.9, equation (i) target: 6C(graphite) + 3H2(g) → C6H6(l). */
export const NCERT_PROBLEM_5_9_BENZENE_FORMATION = reaction(
  '6C(graphite) + 3H2(g) → C6H6(l)',
  [{ species: 'C(graphite)', coefficient: 6 }, { species: 'H2(g)', coefficient: 3 }],
  [{ species: 'C6H6(l)', coefficient: 1 }],
)

/** NCERT Problem 5.9, equation (iv): H2(g) + ½O2(g) → H2O(l), ΔfH = −285.83 kJ mol⁻¹. */
export const NCERT_PROBLEM_5_9_WATER = equation(
  'H2(g) + ½O2(g) → H2O(l)',
  [{ species: 'H2(g)', coefficient: 1 }, { species: 'O2(g)', coefficient: 0.5 }],
  [{ species: 'H2O(l)', coefficient: 1 }],
  -285.83,
)

/**
 * NCERT Section 5.4(d), the Fe2O3 example: Fe2O3(s) + 3H2(g) → 2Fe(s) + 3H2O(l), ΔrH = −33.3 kJ
 * mol⁻¹, computed from Table 5.2 with ΔfH(Fe, s) = ΔfH(H2, g) = 0.
 */
export const NCERT_FE2O3_REDUCTION = reaction(
  'Fe2O3(s) + 3H2(g) → 2Fe(s) + 3H2O(l)',
  [{ species: 'Fe2O3(s)', coefficient: 1 }, { species: 'H2(g)', coefficient: 3 }],
  [{ species: 'Fe(s)', coefficient: 2 }, { species: 'H2O(l)', coefficient: 3 }],
)
