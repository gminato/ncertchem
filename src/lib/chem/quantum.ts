/**
 * Quantum-number bookkeeping and electronic configurations, following NCERT Class 11,
 * Unit 2, sections 2.6.1-2.6.7 (quantum numbers, the (n + l) rule, Aufbau, Pauli,
 * Hund, and the Table 2.6 configurations for Z = 1 to 36).
 */

/** A set of four quantum numbers for one electron. ms is +1/2 or -1/2. */
export interface QuantumSet {
  n: number
  l: number
  ml: number
  ms: number
}

/** Electron count in one subshell, e.g. { label: '3d', electrons: 5 }. */
export interface SubshellOccupancy {
  label: string
  electrons: number
}

/** Result of {@link electronConfiguration}. */
export interface ElectronConfiguration {
  /** Occupied subshells in order of n, then l (the NCERT Table 2.6 column order). */
  subshells: SubshellOccupancy[]
  /** Full configuration, e.g. "1s² 2s² 2p⁶ 3s² 3p⁶ 3d⁵ 4s¹" for Cr. */
  text: string
  /**
   * Noble-gas-core form, e.g. "[Ar]3d⁵4s¹" for Cr and "[Ar]4s¹" for K.
   * For H and He, which have no noble-gas core, this equals `text`.
   */
  nobleGasCore: string
}

/** One orbital in an orbital diagram: spin-up and/or spin-down electron present. */
export interface OrbitalCell {
  up: boolean
  down: boolean
}

/** One subshell of an orbital diagram, with one cell per orbital (2l + 1 cells). */
export interface OrbitalSubshell {
  label: string
  orbitals: OrbitalCell[]
}

/** Principle that a diagram breaks. */
export type OrbitalViolation = 'aufbau' | 'pauli' | 'hund'

/** Result of {@link validateOrbitalDiagram}. */
export interface OrbitalDiagramCheck {
  valid: boolean
  violations: OrbitalViolation[]
}

const SUBSHELL_LETTERS = 'spdf'
const MAX_N = 7

/** Noble gases with their atomic numbers; the core of Z is the largest one below Z. */
const NOBLE_GASES: ReadonlyArray<{ Z: number; symbol: string }> = [
  { Z: 2, symbol: 'He' },
  { Z: 10, symbol: 'Ne' },
  { Z: 18, symbol: 'Ar' },
  { Z: 36, symbol: 'Kr' },
]

/** Elements with a known exception to the Aufbau filling, as (Z: [4s, 3d]) pairs. */
const EXCEPTIONS: Readonly<Record<number, { '4s': number; '3d': number }>> = {
  24: { '4s': 1, '3d': 5 }, // Cr
  29: { '4s': 1, '3d': 10 }, // Cu
}

const SUPERSCRIPT_DIGITS = ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹']

function superscript(n: number): string {
  return String(n)
    .split('')
    .map((d) => SUPERSCRIPT_DIGITS[Number(d)])
    .join('')
}

function requireInteger(value: number, name: string, min: number): void {
  if (!Number.isInteger(value) || value < min) {
    throw new RangeError(`${name} must be an integer ≥ ${min} (received ${value})`)
  }
}

function requireN(n: number): void {
  requireInteger(n, 'Principal quantum number n', 1)
}

function requireL(n: number, l: number): void {
  requireN(n)
  if (!Number.isInteger(l) || l < 0 || l > n - 1) {
    throw new RangeError(`Azimuthal quantum number l must be an integer from 0 to ${n - 1} (received ${l})`)
  }
}

function parseLabel(label: string): { n: number; l: number } {
  const match = /^([1-7])([spdf])$/.exec(label)
  if (!match) {
    throw new RangeError(`Invalid subshell label "${label}"`)
  }
  return { n: Number(match[1]), l: SUBSHELL_LETTERS.indexOf(match[2]) }
}

/**
 * Returns the subshell label for n and l, e.g. subshellLabel(3, 2) = "3d".
 *
 * @throws {RangeError} If n is not a positive integer or l is outside 0..n-1
 */
export function subshellLabel(n: number, l: number): string {
  requireL(n, l)
  return `${n}${SUBSHELL_LETTERS[l]}`
}

/**
 * Number of orbitals in a subshell: 2l + 1 (s = 1, p = 3, d = 5, f = 7).
 *
 * @throws {RangeError} If l is not a non-negative integer
 */
export function orbitalsInSubshell(l: number): number {
  requireInteger(l, 'Azimuthal quantum number l', 0)
  return 2 * l + 1
}

/**
 * Maximum number of electrons in shell n: 2n² (NCERT section 2.6.4).
 *
 * @throws {RangeError} If n is not a positive integer
 */
export function maxElectronsInShell(n: number): number {
  requireN(n)
  return 2 * n * n
}

/**
 * Number of orbitals in shell n: n².
 *
 * @throws {RangeError} If n is not a positive integer
 */
export function orbitalsInShell(n: number): number {
  requireN(n)
  return n * n
}

/**
 * Radial nodes of an orbital: n − l − 1.
 *
 * @throws {RangeError} If n is not a positive integer or l is outside 0..n-1
 */
export function radialNodes(n: number, l: number): number {
  requireL(n, l)
  return n - l - 1
}

/**
 * Angular nodes of an orbital: l.
 *
 * @throws {RangeError} If l is not a non-negative integer
 */
export function angularNodes(l: number): number {
  requireInteger(l, 'Azimuthal quantum number l', 0)
  return l
}

/**
 * Total nodes of an orbital in shell n: n − 1 (radial plus angular).
 *
 * @throws {RangeError} If n is not a positive integer
 */
export function totalNodes(n: number): number {
  requireN(n)
  return n - 1
}

/**
 * True when {n, l, ml, ms} is an allowed set of quantum numbers:
 * n ≥ 1, 0 ≤ l ≤ n − 1, −l ≤ ml ≤ l, and ms = ±1/2.
 */
export function isValidQuantumSet(q: QuantumSet): boolean {
  const { n, l, ml, ms } = q
  if (!Number.isInteger(n) || n < 1) return false
  if (!Number.isInteger(l) || l < 0 || l > n - 1) return false
  if (!Number.isInteger(ml) || ml < -l || ml > l) return false
  return ms === 0.5 || ms === -0.5
}

/**
 * Returns subshell labels in the Aufbau filling order, from 1s up to and including
 * `limit`. Order is by (n + l), then by n (NCERT Table 2.5 and Fig. 2.17), so
 * 4s comes before 3d, 5s before 4d, and 6s before 4f before 5d.
 *
 * @param limit The last label to include, such as "7p" (default) or "4s"
 * @throws {RangeError} If `limit` is not one of the labels up to 7p
 */
export function aufbauOrder(limit = '7p'): string[] {
  const subshells: Array<{ label: string; n: number; l: number }> = []
  for (let n = 1; n <= MAX_N; n++) {
    for (let l = 0; l <= Math.min(n - 1, 3); l++) {
      subshells.push({ label: `${n}${SUBSHELL_LETTERS[l]}`, n, l })
    }
  }
  subshells.sort((a, b) => a.n + a.l - (b.n + b.l) || a.n - b.n)
  const labels = subshells.map((s) => s.label)
  const index = labels.indexOf(limit)
  if (index === -1) {
    throw new RangeError(`Unknown subshell limit "${limit}"`)
  }
  return labels.slice(0, index + 1)
}

/** Capacity of a subshell label: 2 × (2l + 1). */
function capacity(label: string): number {
  const { l } = parseLabel(label)
  return 2 * (2 * l + 1)
}

/** Sorts labels into n-then-l order, which is the order used in NCERT's text and Table 2.6. */
function sortByShell(labels: string[]): string[] {
  return [...labels].sort((a, b) => {
    const pa = parseLabel(a)
    const pb = parseLabel(b)
    return pa.n - pb.n || pa.l - pb.l
  })
}

/** Ground-state electron counts for every subshell (Aufbau, with the Cr and Cu exceptions). */
function groundStateCounts(Z: number): Map<string, number> {
  const counts = new Map<string, number>()
  let remaining = Z
  for (const label of aufbauOrder('7p')) {
    if (remaining <= 0) break
    const fill = Math.min(capacity(label), remaining)
    counts.set(label, fill)
    remaining -= fill
  }
  const exception = EXCEPTIONS[Z]
  if (exception) {
    counts.set('4s', exception['4s'])
    counts.set('3d', exception['3d'])
  }
  return counts
}

function requireAtomicNumber(Z: number): void {
  if (!Number.isInteger(Z) || Z < 1 || Z > 36) {
    throw new RangeError(`Atomic number Z must be an integer from 1 to 36 (received ${Z})`)
  }
}

/**
 * Returns the ground-state electronic configuration of an element with Z = 1 to 36,
 * matching NCERT Table 2.6, including the Cr (3d⁵4s¹) and Cu (3d¹⁰4s¹) exceptions.
 *
 * @throws {RangeError} If Z is not an integer from 1 to 36
 */
export function electronConfiguration(Z: number): ElectronConfiguration {
  requireAtomicNumber(Z)
  const counts = groundStateCounts(Z)
  const labels = sortByShell([...counts.keys()].filter((label) => (counts.get(label) ?? 0) > 0))
  const subshells = labels.map((label) => ({ label, electrons: counts.get(label) ?? 0 }))
  const text = subshells.map((s) => `${s.label}${superscript(s.electrons)}`).join(' ')

  if (Z <= 2) {
    return { subshells, text, nobleGasCore: text }
  }

  const core = [...NOBLE_GASES].reverse().find((gas) => gas.Z < Z)
  if (!core) {
    return { subshells, text, nobleGasCore: text }
  }
  const coreLabels = new Set(electronConfiguration(core.Z).subshells.map((s) => s.label))
  const rest = subshells.filter((s) => !coreLabels.has(s.label))
  const restText = rest.map((s) => `${s.label}${superscript(s.electrons)}`).join('')
  return {
    subshells,
    text,
    nobleGasCore: `[${core.symbol}]${restText}`,
  }
}

/**
 * Returns the orbital diagram of the ground state of element Z: for each occupied
 * subshell, one cell per orbital. Electrons fill each subshell by Hund's rule, one
 * per orbital with spin up first, then pair up. Subshell counts come from
 * {@link electronConfiguration}, so the Cr and Cu exceptions are included.
 *
 * @throws {RangeError} If Z is not an integer from 1 to 36
 */
export function orbitalDiagram(Z: number): OrbitalSubshell[] {
  const { subshells } = electronConfiguration(Z)
  return subshells.map(({ label, electrons }) => {
    const { l } = parseLabel(label)
    const count = orbitalsInSubshell(l)
    const orbitals: OrbitalCell[] = Array.from({ length: count }, (_, i) => ({
      up: i < Math.min(electrons, count),
      down: i < electrons - count,
    }))
    return { label, orbitals }
  })
}

/**
 * Number of unpaired electrons in the ground state of element Z: orbitals that hold
 * exactly one electron.
 *
 * @throws {RangeError} If Z is not an integer from 1 to 36
 */
export function unpairedElectrons(Z: number): number {
  let total = 0
  for (const subshell of orbitalDiagram(Z)) {
    for (const cell of subshell.orbitals) {
      if (cell.up !== cell.down) total++
    }
  }
  return total
}

/**
 * Checks a user-built orbital diagram for the interactive Check, against the Aufbau
 * principle, the Pauli exclusion principle and Hund's rule. The diagram must contain
 * exactly Z electrons.
 *
 * Violations:
 * - 'aufbau': the number of electrons in some subshell differs from the ground-state
 *   configuration of element Z (the Cr and Cu exceptions are accepted).
 * - 'pauli': an orbital holds a spin-down electron without a spin-up partner, which
 *   the diagram cannot represent as a valid occupancy.
 * - 'hund': within a subshell, an orbital is paired while another orbital in that
 *   subshell is still empty.
 *
 * @throws {RangeError} If Z is invalid, the diagram does not hold exactly Z electrons,
 *   a subshell label is invalid, or a subshell has the wrong number of orbitals
 */
export function validateOrbitalDiagram(
  userDiagram: OrbitalSubshell[],
  Z: number
): OrbitalDiagramCheck {
  requireAtomicNumber(Z)

  let total = 0
  for (const subshell of userDiagram) {
    const { l } = parseLabel(subshell.label)
    if (subshell.orbitals.length !== orbitalsInSubshell(l)) {
      throw new RangeError(
        `Subshell ${subshell.label} must have ${orbitalsInSubshell(l)} orbitals (received ${subshell.orbitals.length})`
      )
    }
    for (const cell of subshell.orbitals) {
      total += Number(cell.up) + Number(cell.down)
    }
  }
  if (total !== Z) {
    throw new RangeError(`Diagram holds ${total} electrons but Z = ${Z}`)
  }

  const violations: OrbitalViolation[] = []

  const ground = groundStateCounts(Z)
  const userCounts = new Map<string, number>()
  for (const subshell of userDiagram) {
    userCounts.set(
      subshell.label,
      subshell.orbitals.reduce((sum, cell) => sum + Number(cell.up) + Number(cell.down), 0)
    )
  }
  const labels = new Set([...ground.keys(), ...userCounts.keys()])
  for (const label of labels) {
    if ((ground.get(label) ?? 0) !== (userCounts.get(label) ?? 0)) {
      violations.push('aufbau')
      break
    }
  }

  if (userDiagram.some((s) => s.orbitals.some((cell) => cell.down && !cell.up))) {
    violations.push('pauli')
  }

  const hundBroken = userDiagram.some((s) => {
    const paired = s.orbitals.some((cell) => cell.up && cell.down)
    const empty = s.orbitals.some((cell) => !cell.up && !cell.down)
    return paired && empty
  })
  if (hundBroken) {
    violations.push('hund')
  }

  return { valid: violations.length === 0, violations }
}
