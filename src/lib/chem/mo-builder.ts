/**
 * Model for the MO builder Simulation (NCERT Class 11 Unit 4, Sections 4.7.4, 4.7.5 and 4.8).
 * Species are filled one electron at a time with the Aufbau order and Hund's rule from
 * molecular-orbitals.ts. This module adds the species that the simulation offers beyond the
 * neutral diatomics in MO_SPECIES (N₂⁺ and He₂⁺ are not in that list), the choice of energy
 * order, the verdict on stability, and the reason the two orders differ.
 */

import {
  MO_ORDER_WITHOUT_MIXING,
  MO_ORDER_WITH_MIXING,
  bondOrder,
  configurationText,
  fillMOs,
  isParamagnetic,
  unpairedElectrons,
  type MOLevel,
  type MOOccupancy,
} from './molecular-orbitals'

/** A species the builder offers, with its total electron count. */
export interface BuilderSpecies {
  formula: string
  electrons: number
  /** Energy order NCERT uses for this species (Section 4.7.4): true for B₂ to N₂, false for O₂ and beyond. */
  ncertMixing: boolean
  /** Short note for the species tile, such as its charge. */
  charge: 0 | 1 | -1 | -2
}

/** The species the MO builder offers: H₂ to Ne₂, plus the ions named in the NCERT text. */
export const BUILDER_SPECIES: readonly BuilderSpecies[] = [
  { formula: 'H₂', electrons: 2, ncertMixing: true, charge: 0 },
  { formula: 'He₂⁺', electrons: 3, ncertMixing: true, charge: 1 },
  { formula: 'He₂', electrons: 4, ncertMixing: true, charge: 0 },
  { formula: 'Li₂', electrons: 6, ncertMixing: true, charge: 0 },
  { formula: 'Be₂', electrons: 8, ncertMixing: true, charge: 0 },
  { formula: 'B₂', electrons: 10, ncertMixing: true, charge: 0 },
  { formula: 'C₂', electrons: 12, ncertMixing: true, charge: 0 },
  { formula: 'N₂⁺', electrons: 13, ncertMixing: true, charge: 1 },
  { formula: 'N₂', electrons: 14, ncertMixing: true, charge: 0 },
  { formula: 'O₂⁺', electrons: 15, ncertMixing: false, charge: 1 },
  { formula: 'O₂', electrons: 16, ncertMixing: false, charge: 0 },
  { formula: 'O₂⁻', electrons: 17, ncertMixing: false, charge: -1 },
  { formula: 'O₂²⁻', electrons: 18, ncertMixing: false, charge: -2 },
  { formula: 'F₂', electrons: 18, ncertMixing: false, charge: 0 },
  { formula: 'Ne₂', electrons: 20, ncertMixing: false, charge: 0 },
]

/** The species with this formula. @throws {RangeError} if it is not offered by the builder. */
export function builderSpecies(formula: string): BuilderSpecies {
  const found = BUILDER_SPECIES.find((s) => s.formula === formula)
  if (!found) throw new RangeError(`${formula} is not offered by the MO builder`)
  return found
}

/** The energy order for a species: the mixed order when `mixing` is true, the other order when false. */
export function orderFor(mixing: boolean): readonly MOLevel[] {
  return mixing ? MO_ORDER_WITH_MIXING : MO_ORDER_WITHOUT_MIXING
}

/** Filled levels and readouts after `placed` electrons, in the chosen energy order. */
export interface BuilderState {
  placed: number
  levels: MOOccupancy[]
  bondOrder: number
  unpaired: number
  paramagnetic: boolean
  configuration: string
}

/** The state after `placed` electrons of a species are placed in the given energy order. */
export function builderState(electrons: number, placed: number, mixing: boolean): BuilderState {
  const levels = fillMOs(placed, orderFor(mixing))
  return {
    placed,
    levels,
    bondOrder: bondOrder(levels),
    unpaired: unpairedElectrons(levels),
    paramagnetic: isParamagnetic(levels),
    configuration: configurationText(levels),
  }
}

/**
 * Label of the level that holds the n-th electron (1-based), for highlighting the electron
 * that was placed last. Returns null for n outside 1 to the total placed.
 */
export function levelOfElectron(levels: readonly MOOccupancy[], n: number): string | null {
  if (!Number.isInteger(n) || n < 1) return null
  let seen = 0
  for (const level of levels) {
    seen += level.electrons
    if (n <= seen && level.electrons > 0) return level.label
  }
  return null
}

/** Label of the highest occupied level (the HOMO), or null when no electron is placed. */
export function highestOccupiedLevel(levels: readonly MOOccupancy[]): string | null {
  const filled = levels.filter((l) => l.electrons > 0)
  return filled.length ? filled[filled.length - 1].label : null
}

/** What the bond order says about the species, once it is complete. */
export interface StabilityVerdict {
  stable: boolean
  text: string
}

/**
 * Verdict from a bond order (Section 4.7.5): a positive bond order means a stable molecule, and
 * zero means it is not stable and does not exist.
 */
export function stabilityVerdict(order: number): StabilityVerdict {
  if (order > 0) {
    return { stable: true, text: `Bond order ${formatOrder(order)} is positive, so the species is stable.` }
  }
  return { stable: false, text: 'Bond order 0: the species is not stable and is not observed.' }
}

/** Bond order as text: whole numbers as "2", halves as "2.5". */
export function formatOrder(order: number): string {
  return Number.isInteger(order) ? String(order) : order.toFixed(1)
}

/**
 * The reason the two energy orders differ, for B₂ to N₂ in particular. C₂ and B₂ are the
 * species where the order changes the magnetism, so the note names them.
 */
export function orderSwitchNote(mixing: boolean): string {
  if (mixing) {
    return 'With 2s–2p mixing, π2p lies below σ2p. This is the order NCERT uses for B₂ to N₂, where the 2s and 2p levels are close enough in energy to mix, which pushes σ2p up.'
  }
  return 'Without mixing, σ2p lies below π2p, as in O₂ and F₂. Applied to B₂ or C₂ this order is wrong: it puts their 2p electrons into one σ2p orbital (B₂) or into two π2p orbitals (C₂) and so predicts the wrong magnetism.'
}
