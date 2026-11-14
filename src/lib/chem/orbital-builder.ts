/**
 * An orbital-box model for the interactive ConfigBuilder Check and the build-up
 * Scrolly. Each orbital holds an array of spins, so the two ways a learner can
 * break the Pauli exclusion principle (two electrons with the same spin, or three
 * electrons in one orbital) can be represented and reported. The ground-state
 * targets come from electronConfiguration() in quantum.ts, so the Cr and Cu
 * exceptions are accepted.
 *
 * The subshells covered are 1s to 4p, which holds every element up to Z = 36.
 */

import { aufbauOrder, electronConfiguration, orbitalsInSubshell } from './quantum'

export type Spin = 'up' | 'down'

/** What a click adds: a fixed spin, or 'auto' (up, then down, then clear). */
export type SpinChoice = Spin | 'auto'

/** Electrons in one orbital: [] empty, ['up'] one, ['up', 'down'] paired. */
export type OrbitalSpins = Spin[]

export interface BuilderSubshell {
  label: string
  orbitals: OrbitalSpins[]
}

export type BuilderState = BuilderSubshell[]

export type BuilderRule = 'aufbau' | 'pauli' | 'hund'

export interface BuilderViolation {
  rule: BuilderRule
  /** The subshell that holds the offending electrons, or null when the whole diagram is at fault. */
  label: string | null
  message: string
}

export interface BuilderCheck {
  valid: boolean
  violations: BuilderViolation[]
}

/** Result of adding one electron. `rejected` is set when the edit was refused and the state is unchanged. */
export interface BuilderEdit {
  state: BuilderState
  rejected: BuilderViolation | null
}

/** One electron placed by the build order: which orbital and which spin. */
export interface Placement {
  label: string
  orbital: number
  spin: Spin
}

export interface ElementInfo {
  Z: number
  symbol: string
  name: string
}

/** The highest subshell the builder shows. Every element up to Z = 36 fits within 1s to 4p. */
const SUBSHELL_LIMIT = '4p'
const SPDF = 'spdf'
export const MAX_BUILDER_Z = 36

const SYMBOLS = [
  'H', 'He', 'Li', 'Be', 'B', 'C', 'N', 'O', 'F', 'Ne',
  'Na', 'Mg', 'Al', 'Si', 'P', 'S', 'Cl', 'Ar', 'K', 'Ca',
  'Sc', 'Ti', 'V', 'Cr', 'Mn', 'Fe', 'Co', 'Ni', 'Cu', 'Zn',
  'Ga', 'Ge', 'As', 'Se', 'Br', 'Kr',
]

const NAMES = [
  'Hydrogen', 'Helium', 'Lithium', 'Beryllium', 'Boron', 'Carbon', 'Nitrogen', 'Oxygen', 'Fluorine', 'Neon',
  'Sodium', 'Magnesium', 'Aluminium', 'Silicon', 'Phosphorus', 'Sulphur', 'Chlorine', 'Argon', 'Potassium', 'Calcium',
  'Scandium', 'Titanium', 'Vanadium', 'Chromium', 'Manganese', 'Iron', 'Cobalt', 'Nickel', 'Copper', 'Zinc',
  'Gallium', 'Germanium', 'Arsenic', 'Selenium', 'Bromine', 'Krypton',
]

const SUPERSCRIPT_DIGITS = ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹']

function superscript(n: number): string {
  return String(n)
    .split('')
    .map((d) => SUPERSCRIPT_DIGITS[Number(d)])
    .join('')
}

function requireZ(Z: number): void {
  if (!Number.isInteger(Z) || Z < 1 || Z > MAX_BUILDER_Z) {
    throw new RangeError(`Atomic number Z must be an integer from 1 to ${MAX_BUILDER_Z} (received ${Z})`)
  }
}

/** The azimuthal quantum number of a label such as "3d" (s = 0 ... f = 3). */
function azimuthalOf(label: string): number {
  return SPDF.indexOf(label[1])
}

/** Element data for Z = 1 to 36. */
export function elementInfo(Z: number): ElementInfo {
  requireZ(Z)
  return { Z, symbol: SYMBOLS[Z - 1], name: NAMES[Z - 1] }
}

/** Looks an element up by its chemical symbol (case-sensitive, such as "Fe"). Undefined when unknown. */
export function elementBySymbol(symbol: string): ElementInfo | undefined {
  const index = SYMBOLS.indexOf(symbol)
  return index === -1 ? undefined : elementInfo(index + 1)
}

/** Subshell labels shown by the builder, in Aufbau order: 1s, 2s, 2p, 3s, 3p, 4s, 3d, 4p. */
export function builderLabels(): string[] {
  return aufbauOrder(SUBSHELL_LIMIT)
}

/** An empty diagram with one orbital per box, for every builder subshell. */
export function emptyBuilderState(): BuilderState {
  return builderLabels().map((label) => ({
    label,
    orbitals: Array.from({ length: orbitalsInSubshell(azimuthalOf(label)) }, (): OrbitalSpins => []),
  }))
}

/** Electron count per subshell label. */
export function countsOf(state: BuilderState): Map<string, number> {
  const counts = new Map<string, number>()
  for (const subshell of state) {
    counts.set(subshell.label, subshell.orbitals.reduce((sum, orbital) => sum + orbital.length, 0))
  }
  return counts
}

/** Total number of electrons in the diagram. */
export function totalElectrons(state: BuilderState): number {
  let total = 0
  for (const count of countsOf(state).values()) total += count
  return total
}

/** Number of orbitals holding exactly one electron. */
export function unpairedCount(state: BuilderState): number {
  let total = 0
  for (const subshell of state) {
    for (const orbital of subshell.orbitals) {
      if (orbital.length === 1) total++
    }
  }
  return total
}

/** The ground-state electron count for each subshell of element Z, with the Cr and Cu exceptions. */
export function targetCounts(Z: number): Map<string, number> {
  requireZ(Z)
  const targets = new Map<string, number>()
  for (const subshell of electronConfiguration(Z).subshells) {
    targets.set(subshell.label, subshell.electrons)
  }
  return targets
}

/**
 * A configuration string such as "1s² 2s² 2p³" from electron counts, in n-then-l
 * order. Subshells with no electrons are left out.
 */
export function configurationText(counts: ReadonlyMap<string, number>): string {
  const labels = [...counts.keys()]
    .filter((label) => (counts.get(label) ?? 0) > 0)
    .sort((a, b) => Number(a[0]) - Number(b[0]) || azimuthalOf(a) - azimuthalOf(b))
  return labels.map((label) => `${label}${superscript(counts.get(label) ?? 0)}`).join(' ')
}

/** Describes one orbital in words, for screen readers and feedback. */
export function describeOrbital(spins: OrbitalSpins): string {
  if (spins.length === 0) return 'empty'
  if (spins.length === 1) return `one electron, spin ${spins[0] === 'up' ? 'up' : 'down'}`
  if (spins[0] === spins[1]) return `two electrons, both spin ${spins[0] === 'up' ? 'up' : 'down'}`
  return 'two electrons, paired'
}

const SPIN_NAME: Record<Spin, string> = { up: '+½ (up)', down: '−½ (down)' }
const OPPOSITE: Record<Spin, Spin> = { up: 'down', down: 'up' }

/**
 * Adds one electron to orbital `orbital` of subshell `label`.
 *
 * - 'auto' adds the next electron the way Hund's rule builds a subshell: an empty
 *   orbital gets up; an orbital with one electron gets the opposite spin; a full
 *   orbital is cleared.
 * - A fixed spin is added as chosen. An orbital that already holds two electrons
 *   refuses the third (Pauli), and the state is unchanged. Two electrons with the
 *   same spin are allowed, so that Check can name the violation.
 *
 * @throws {RangeError} If the subshell or orbital does not exist
 */
export function addElectron(
  state: BuilderState,
  label: string,
  orbital: number,
  choice: SpinChoice
): BuilderEdit {
  const subshell = state.find((s) => s.label === label)
  if (!subshell || orbital < 0 || orbital >= subshell.orbitals.length) {
    throw new RangeError(`No orbital ${orbital} in subshell ${label}`)
  }
  const current = subshell.orbitals[orbital]
  let next: OrbitalSpins

  if (choice === 'auto') {
    if (current.length === 0) next = ['up']
    else if (current.length === 1) next = [current[0], OPPOSITE[current[0]]]
    else next = []
  } else {
    if (current.length >= 2) {
      return {
        state,
        rejected: {
          rule: 'pauli',
          label,
          message: `Pauli exclusion principle: the ${label} orbital ${orbital + 1} already holds two electrons. An orbital takes at most two, with opposite spins, so a third electron cannot go there.`,
        },
      }
    }
    next = [...current, choice]
  }

  const updated = state.map((s) =>
    s.label === label
      ? { ...s, orbitals: s.orbitals.map((o, i) => (i === orbital ? next : o)) }
      : s
  )
  return { state: updated, rejected: null }
}

/**
 * The order in which electrons go into the orbitals on the way to element Z, in
 * Aufbau order, following Hund's rule inside each subshell: every orbital takes
 * a spin-up electron first, and only then do spin-down electrons pair up.
 *
 * Subshell counts come from electronConfiguration(Z), so the Cr and Cu exceptions
 * are included. For Z = 24 this gives 4s before 3d, as the ground state has 4s¹ 3d⁵.
 *
 * @throws {RangeError} If Z is not an integer from 1 to 36
 */
export function placementOrder(Z: number): Placement[] {
  const targets = targetCounts(Z)
  const placements: Placement[] = []
  for (const label of builderLabels()) {
    const count = targets.get(label) ?? 0
    if (count === 0) continue
    const orbitalCount = orbitalsInSubshell(azimuthalOf(label))
    for (let i = 0; i < Math.min(count, orbitalCount); i++) {
      placements.push({ label, orbital: i, spin: 'up' })
    }
    for (let i = 0; i < count - orbitalCount; i++) {
      placements.push({ label, orbital: i, spin: 'down' })
    }
  }
  return placements
}

/** The diagram after the first `count` placements from `placements`. */
export function stateAfter(placements: readonly Placement[], count: number): BuilderState {
  let state = emptyBuilderState()
  for (const placement of placements.slice(0, Math.max(0, count))) {
    state = addElectron(state, placement.label, placement.orbital, placement.spin).state
  }
  return state
}

/**
 * Number of exchange pairs among `n` parallel-spin electrons in degenerate
 * orbitals: n(n − 1) / 2. For the d subshell, half-filled d⁵ gives 10 pairs and d⁴
 * gives 6 (NCERT Fig. 2.18 shows the d⁵ case).
 *
 * @throws {RangeError} If n is not a non-negative integer
 */
export function exchangePairs(n: number): number {
  if (!Number.isInteger(n) || n < 0) {
    throw new RangeError(`Number of electrons must be a non-negative integer (received ${n})`)
  }
  return n < 2 ? 0 : (n * (n - 1)) / 2
}

/**
 * Checks a learner's diagram for element Z against the Pauli exclusion principle,
 * the Aufbau principle and Hund's rule. The rules are checked in that order, and
 * the violations come back in that order too, so the first one is the one to name.
 *
 * - pauli: an orbital holds more than two electrons, or two with the same spin.
 * - aufbau: a higher subshell holds electrons while a lower one is not yet full,
 *   or a subshell's count differs from the ground state of Z. Cr and Cu are
 *   accepted in their exception configurations.
 * - hund: an electron paired while another orbital in that subshell was empty, or
 *   the unpaired electrons of a subshell do not share one spin.
 *
 * @throws {RangeError} If Z is invalid
 */
export function validateBuilder(state: BuilderState, Z: number): BuilderCheck {
  requireZ(Z)
  const violations: BuilderViolation[] = []

  // Pauli: no orbital holds more than two electrons, or two with the same spin.
  for (const subshell of state) {
    subshell.orbitals.forEach((orbital, i) => {
      if (orbital.length > 2) {
        violations.push({
          rule: 'pauli',
          label: subshell.label,
          message: `Pauli exclusion principle broken in ${subshell.label}: orbital ${i + 1} holds ${orbital.length} electrons. An orbital takes at most two.`,
        })
      } else if (orbital.length === 2 && orbital[0] === orbital[1]) {
        violations.push({
          rule: 'pauli',
          label: subshell.label,
          message: `Pauli exclusion principle broken in ${subshell.label}: orbital ${i + 1} holds two electrons, both with spin ${SPIN_NAME[orbital[0]]}. Electrons that share an orbital need opposite spins.`,
        })
      }
    })
  }

  // Aufbau: the filling must follow the ground state of Z.
  const counts = countsOf(state)
  const targets = targetCounts(Z)
  const labels = builderLabels()
  const { symbol, name } = elementInfo(Z)
  const isException = Z === 24 || Z === 29

  let orderViolated = false
  let deficit: string | null = null
  for (const label of labels) {
    const have = counts.get(label) ?? 0
    if (deficit === null) {
      if (have < (targets.get(label) ?? 0)) deficit = label
    } else if (have > 0) {
      violations.push({
        rule: 'aufbau',
        label,
        message: `Aufbau principle broken: ${label} holds electrons before ${deficit} is full. Orbitals fill in order of increasing energy, so fill ${deficit} first.`,
      })
      orderViolated = true
      break
    }
  }

  if (!orderViolated) {
    for (const label of labels) {
      const have = counts.get(label) ?? 0
      const need = targets.get(label) ?? 0
      if (have === need) continue
      if (isException && (label === '3d' || label === '4s')) {
        violations.push({
          rule: 'aufbau',
          label,
          message: `Aufbau principle: ${name} (${symbol}) is one of the exceptions. Its ground state is ${electronConfiguration(Z).text}, where one 4s electron moves into 3d to give a half-filled or completely filled d subshell.`,
        })
      } else {
        violations.push({
          rule: 'aufbau',
          label,
          message: `Aufbau principle: ${label} should hold ${need} electron${need === 1 ? '' : 's'} in the ground state of ${name} (${symbol}), not ${have}.`,
        })
      }
      break
    }
  }

  // Hund: fill each subshell with one electron per orbital, all spin up, before pairing.
  for (const subshell of state) {
    const orbitals = subshell.orbitals
    const hasPair = orbitals.some((o) => o.length === 2)
    const hasEmpty = orbitals.some((o) => o.length === 0)
    if (hasPair && hasEmpty) {
      violations.push({
        rule: 'hund',
        label: subshell.label,
        message: `Hund's rule broken in ${subshell.label}: an electron paired up while another ${subshell.label} orbital was still empty. Put one electron in each orbital first, with parallel spins.`,
      })
      continue
    }
    const singleSpins = new Set(orbitals.filter((o) => o.length === 1).map((o) => o[0]))
    if (singleSpins.size > 1) {
      violations.push({
        rule: 'hund',
        label: subshell.label,
        message: `Hund's rule broken in ${subshell.label}: the unpaired electrons do not all have the same spin. Hund's rule wants them parallel, so their multiplicity is as large as possible.`,
      })
    }
  }

  return { valid: violations.length === 0, violations }
}

/** Subshell labels with at least one violation, in Aufbau order. */
export function violatedLabels(check: BuilderCheck): string[] {
  const set = new Set(check.violations.map((v) => v.label).filter((l): l is string => l !== null))
  return builderLabels().filter((label) => set.has(label))
}

/** The rule's name as a learner sees it in feedback. */
export const RULE_NAME: Record<BuilderRule, string> = {
  aufbau: 'Aufbau principle',
  pauli: 'Pauli exclusion principle',
  hund: "Hund's rule",
}
