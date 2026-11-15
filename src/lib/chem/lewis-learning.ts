/**
 * Pure model for the Lewis structure builder and the Lewis visuals in NCERT Class 11 Unit 4,
 * Section 4.1. The Learner builds a structure by counting valence electrons, bonding atoms
 * and placing lone pairs. Every count, formal charge and octet status comes from `lewis.ts`.
 *
 * Nothing here draws. The builder and the Scrolly Animations take these results and render them.
 */

import {
  LEWIS_STRUCTURES,
  bondOrderBetween,
  checkStructure,
  formalChargesOf,
  octetReport,
  totalValenceElectrons,
  type AtomOctet,
  type LewisStructure,
} from './lewis'
import { electronConfiguration } from './quantum'

/**
 * Structures the Section draws that are not in LEWIS_STRUCTURES. They follow the same
 * conventions (bonds, lone pairs, layout coordinates in arbitrary units) and are checked in
 * the tests with the same electron and charge rules.
 */
export const SECTION_EXTRA_STRUCTURES: Readonly<Record<string, LewisStructure>> = {
  BeCl2: {
    name: 'BeCl2',
    charge: 0,
    atoms: [
      { element: 'Be', x: 0, y: 0, lonePairs: 0, unpairedElectrons: 0 },
      { element: 'Cl', x: -1, y: 0, lonePairs: 3, unpairedElectrons: 0 },
      { element: 'Cl', x: 1, y: 0, lonePairs: 3, unpairedElectrons: 0 },
    ],
    bonds: [
      { a: 0, b: 1, order: 1 },
      { a: 0, b: 2, order: 1 },
    ],
  },
  BCl3: {
    name: 'BCl3',
    charge: 0,
    atoms: [
      { element: 'B', x: 0, y: 0, lonePairs: 0, unpairedElectrons: 0 },
      { element: 'Cl', x: 0, y: 1, lonePairs: 3, unpairedElectrons: 0 },
      { element: 'Cl', x: -0.9, y: -0.5, lonePairs: 3, unpairedElectrons: 0 },
      { element: 'Cl', x: 0.9, y: -0.5, lonePairs: 3, unpairedElectrons: 0 },
    ],
    bonds: [
      { a: 0, b: 1, order: 1 },
      { a: 0, b: 2, order: 1 },
      { a: 0, b: 3, order: 1 },
    ],
  },
}

/** A curated structure from the library or from this Section's extras, by key. */
export function sectionStructure(key: string): LewisStructure {
  const found = LEWIS_STRUCTURES[key] ?? SECTION_EXTRA_STRUCTURES[key]
  if (!found) throw new RangeError(`No Lewis structure for ${key}`)
  return found
}

/** Keys the Learner can pick in the builder: every curated structure in LEWIS_STRUCTURES. */
export const LEWIS_BUILDER_SPECIES: readonly string[] = Object.keys(LEWIS_STRUCTURES)

// ---------------------------------------------------------------------------
// Learner state: a working structure over the atoms of a target structure.
// ---------------------------------------------------------------------------

/** One atom in the Learner's working structure. */
export interface LearnerAtom {
  element: string
  lonePairs: number
  /** 1 when the Learner has placed the unpaired electron on this atom. */
  unpaired: 0 | 1
}

/**
 * The Learner's working structure. `orders` is a symmetric matrix of bond orders (0 for no
 * bond), and `counted` is the number of valence electrons the Learner has entered, or null.
 */
export interface LearnerState {
  charge: number
  atoms: LearnerAtom[]
  orders: number[][]
  counted: number | null
}

/** Largest number of lone pairs one atom may carry in the builder. */
export const MAX_LONE_PAIRS = 4

/** An empty working structure for the atoms of `target`: no bonds, no lone pairs, no count yet. */
export function emptyLearner(target: LewisStructure): LearnerState {
  const n = target.atoms.length
  return {
    charge: target.charge,
    atoms: target.atoms.map((atom) => ({ element: atom.element, lonePairs: 0, unpaired: 0 })),
    orders: Array.from({ length: n }, () => Array.from({ length: n }, () => 0)),
    counted: null,
  }
}

/** Element symbols of the learner's atoms, in order. */
export function learnerElements(state: LearnerState): string[] {
  return state.atoms.map((atom) => atom.element)
}

/** Valence electrons the species has in total (the answer to the counting step). */
export function learnerTotalElectrons(state: LearnerState): number {
  return totalValenceElectrons(learnerElements(state), state.charge)
}

/** Electrons the Learner has placed: two per bond order, plus lone-pair and unpaired electrons. */
export function learnerElectronsPlaced(state: LearnerState): number {
  let bonding = 0
  const n = state.atoms.length
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) bonding += 2 * state.orders[i][j]
  }
  const nonBonding = state.atoms.reduce((sum, atom) => sum + 2 * atom.lonePairs + atom.unpaired, 0)
  return bonding + nonBonding
}

/**
 * Electrons still to place: total valence electrons minus those placed. Negative when the
 * Learner has placed too many.
 */
export function learnerElectronsRemaining(state: LearnerState): number {
  return learnerTotalElectrons(state) - learnerElectronsPlaced(state)
}

/** Sets the bond order between two atoms (0 removes the bond). Returns a new state. */
export function setBondOrder(state: LearnerState, i: number, j: number, order: number): LearnerState {
  if (i === j) throw new RangeError('An atom cannot bond to itself')
  if (!Number.isInteger(order) || order < 0 || order > 3) {
    throw new RangeError(`bond order must be 0 to 3 (received ${order})`)
  }
  const orders = state.orders.map((row) => [...row])
  orders[i][j] = order
  orders[j][i] = order
  return { ...state, orders }
}

/**
 * Steps the bond between two atoms through none, single, double and triple, then back to none.
 * Returns a new state.
 */
export function cycleBond(state: LearnerState, i: number, j: number): LearnerState {
  const next = (state.orders[i][j] + 1) % 4
  return setBondOrder(state, i, j, next)
}

/** Adds or removes one lone pair on atom `i`, within 0 and MAX_LONE_PAIRS. Returns a new state. */
export function adjustLonePairs(state: LearnerState, i: number, delta: 1 | -1): LearnerState {
  const atoms = state.atoms.map((atom, k) => {
    if (k !== i) return atom
    const lonePairs = Math.min(MAX_LONE_PAIRS, Math.max(0, atom.lonePairs + delta))
    return { ...atom, lonePairs }
  })
  return { ...state, atoms }
}

/** Toggles the unpaired electron on atom `i`. Returns a new state. */
export function toggleUnpaired(state: LearnerState, i: number): LearnerState {
  const atoms = state.atoms.map((atom, k) =>
    k === i ? { ...atom, unpaired: (atom.unpaired ? 0 : 1) as 0 | 1 } : atom
  )
  return { ...state, atoms }
}

/** Sets the electron count the Learner has entered. Returns a new state. */
export function setCounted(state: LearnerState, counted: number | null): LearnerState {
  return { ...state, counted }
}

/** Bond orders summed over the bonds of atom `i` (its bonded electron pairs). */
export function learnerBondsOf(state: LearnerState, i: number): number {
  return state.orders[i].reduce((sum, order) => sum + order, 0)
}

/**
 * The working structure as a LewisStructure, with coordinates taken from `target`, so the
 * diagram and the formal-charge and octet checks use the same library functions as the target.
 */
export function learnerToStructure(state: LearnerState, target: LewisStructure): LewisStructure {
  const atoms = state.atoms.map((atom, i) => ({
    element: atom.element,
    x: target.atoms[i].x,
    y: target.atoms[i].y,
    lonePairs: atom.lonePairs,
    unpairedElectrons: atom.unpaired,
  }))
  const bonds: { a: number; b: number; order: 1 | 2 | 3 }[] = []
  const n = state.atoms.length
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const order = state.orders[i][j]
      if (order > 0) bonds.push({ a: i, b: j, order: order as 1 | 2 | 3 })
    }
  }
  return { name: target.name, charge: state.charge, atoms, bonds }
}

/** Formal charge on every atom of the working structure, in atom order. */
export function learnerFormalCharges(state: LearnerState, target: LewisStructure): number[] {
  return formalChargesOf(learnerToStructure(state, target))
}

/** Octet status of every atom of the working structure. */
export function learnerOctets(state: LearnerState, target: LewisStructure): AtomOctet[] {
  return octetReport(learnerToStructure(state, target))
}

/** How the working structure compares with the curated target. */
export interface TargetComparison {
  /** Every bond order and lone pair matches the target: the same drawing as the target. */
  identical: boolean
  /**
   * Another resonance form of the same species: it uses every electron, and its formal charges,
   * octet statuses and bond orders match the target's as multisets.
   */
  resonanceEquivalent: boolean
}

/** Compares the working structure with the curated target. */
export function compareWithTarget(state: LearnerState, target: LewisStructure): TargetComparison {
  const n = target.atoms.length
  let identical = state.atoms.length === n
  for (let i = 0; identical && i < n; i++) {
    const mine = state.atoms[i]
    const theirs = target.atoms[i]
    if (mine.lonePairs !== theirs.lonePairs || mine.unpaired !== theirs.unpairedElectrons) identical = false
    for (let j = i + 1; identical && j < n; j++) {
      if (state.orders[i][j] !== bondOrderBetween(target, i, j)) identical = false
    }
  }
  if (identical) return { identical: true, resonanceEquivalent: true }

  const built = learnerToStructure(state, target)
  const check = checkStructure(built)
  const targetCheck = checkStructure(target)
  const sameMultiset = (a: readonly (number | string)[], b: readonly (number | string)[]) =>
    [...a].sort().join('|') === [...b].sort().join('|')
  const mineOrders: number[] = []
  const theirOrders: number[] = []
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      mineOrders.push(state.orders[i][j])
      theirOrders.push(bondOrderBetween(target, i, j))
    }
  }
  const resonanceEquivalent =
    check.electronsConserved &&
    check.chargeConserved &&
    targetCheck.electronsConserved &&
    sameMultiset(formalChargesOf(built), formalChargesOf(target)) &&
    sameMultiset(octetReport(built).map((o) => o.status), octetReport(target).map((o) => o.status)) &&
    sameMultiset(mineOrders, theirOrders)
  return { identical: false, resonanceEquivalent }
}

/** Where the Learner is in the build. */
export type BuildStage = 'count' | 'skeleton' | 'place' | 'octets' | 'over' | 'done'

/**
 * The stage the Learner is at. The order is count, skeleton, place (lone pairs and bonds until
 * every electron is used), octets (complete the octets, for example by moving a lone pair into a
 * multiple bond), and done. `over` means too many electrons are placed. An odd-electron atom is
 * a property of the species (NO, NO2), so it does not hold the build back.
 */
export function learnerStage(state: LearnerState, target: LewisStructure): BuildStage {
  if (state.counted !== learnerTotalElectrons(state)) return 'count'
  const bonded = state.orders.some((row) => row.some((order) => order > 0))
  if (!bonded) return 'skeleton'
  const remaining = learnerElectronsRemaining(state)
  if (remaining < 0) return 'over'
  if (remaining > 0) return 'place'
  const short = learnerOctets(state, target).some((o) => o.status === 'incomplete')
  return short ? 'octets' : 'done'
}

/** Plain-English explanation for a build stage. */
export function stageMessage(stage: BuildStage, remaining: number): string {
  switch (stage) {
    case 'count':
      return 'Count the valence electrons: add each atom’s group valence, add one for each negative charge and take one away for each positive charge.'
    case 'skeleton':
      return 'Draw a skeleton. Pick an atom and bond it to a neighbour with a single bond, until the atoms are linked.'
    case 'place':
      return `${remaining} electron${remaining === 1 ? '' : 's'} left to place. Give the bonded atoms lone pairs first, then use what remains for multiple bonds.`
    case 'over':
      return `You have placed ${-remaining} electron${remaining === -1 ? '' : 's'} too many. Remove a lone pair or a bond.`
    case 'octets':
      return 'Every electron is placed, but an atom is short of an octet. Move a lone pair into a bond to make a multiple bond.'
    case 'done':
      return 'Every electron is used and every atom has an octet, or the species’ allowed exception.'
  }
}

/** Short readout text for one atom's octet status. */
export function describeOctet(status: AtomOctet): string {
  const e = status.electrons
  switch (status.status) {
    case 'complete':
      return status.element === 'H' ? `${e} electrons: complete (duet, like helium)` : `${e} electrons: complete octet`
    case 'incomplete':
      return `${e} electrons: incomplete octet`
    case 'expanded':
      return `${e} electrons: expanded octet`
    case 'odd-electron':
      return `${e} electrons: odd-electron`
    case 'overfull':
      return `${e} electrons: more than an octet`
  }
}

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

/** Mapping from layout units to SVG units, for a diagram drawn into a box. */
export interface LayoutFit {
  scale: number
  offsetX: number
  offsetY: number
}

/**
 * Fits layout points into a box of `width` by `height` SVG units with `padding` on each side.
 * The scale never exceeds `maxScale`, so a two-atom molecule is not stretched across the box.
 *
 * @throws {RangeError} If the box is too small for the padding
 */
export function fitLayout(
  points: readonly { x: number; y: number }[],
  width: number,
  height: number,
  padding: number,
  maxScale: number
): LayoutFit {
  const innerW = width - 2 * padding
  const innerH = height - 2 * padding
  if (innerW <= 0 || innerH <= 0) throw new RangeError('box is too small for the padding')
  if (points.length === 0) return { scale: maxScale, offsetX: width / 2, offsetY: height / 2 }
  const xs = points.map((p) => p.x)
  const ys = points.map((p) => p.y)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  const spanX = maxX - minX
  const spanY = maxY - minY
  const fitX = spanX > 0 ? innerW / spanX : Infinity
  const fitY = spanY > 0 ? innerH / spanY : Infinity
  const scale = Math.min(maxScale, fitX, fitY)
  const finite = Number.isFinite(scale) ? scale : maxScale
  const centreX = (minX + maxX) / 2
  const centreY = (minY + maxY) / 2
  return {
    scale: finite,
    offsetX: width / 2 - centreX * finite,
    offsetY: height / 2 - centreY * finite,
  }
}

/** Applies a LayoutFit to one point. */
export function applyFit(fit: LayoutFit, p: { x: number; y: number }): { x: number; y: number } {
  return { x: p.x * fit.scale + fit.offsetX, y: p.y * fit.scale + fit.offsetY }
}

// ---------------------------------------------------------------------------
// Kössel shell populations
// ---------------------------------------------------------------------------

/**
 * Electrons in each principal shell of the ground state of element Z (Z from 1 to 36), as
 * [K, L, M, ...]. Built from electronConfiguration, so it follows NCERT's configurations.
 */
export function shellPopulations(Z: number): number[] {
  const counts: number[] = []
  for (const sub of electronConfiguration(Z).subshells) {
    const n = Number(sub.label[0])
    counts[n - 1] = (counts[n - 1] ?? 0) + sub.electrons
  }
  const out: number[] = []
  for (let k = 0; k < counts.length; k++) out.push(counts[k] ?? 0)
  return out
}
