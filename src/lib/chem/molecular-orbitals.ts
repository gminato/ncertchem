/**
 * Molecular orbital (MO) theory for homonuclear diatomics, NCERT Class 11 Unit 4, Section 4.7
 * and 4.8. Given an MO energy order and a count of valence electrons, it fills the orbitals
 * with Hund's rule, then returns the bond order, the unpaired electron count and whether the
 * species is paramagnetic.
 *
 * NCERT gives two energy orders (Section 4.7.4). B₂, C₂ and N₂ have 2s–2p mixing, which puts
 * π2p below σ2p. O₂, F₂ and Ne₂ do not, so σ2p lies below π2p. Fig. 4.21 shows which species
 * use which order: B₂ to N₂ with mixing, O₂ to Ne₂ without.
 */

/** One molecular orbital level. A π or π* level holds two orbitals of equal energy. */
export interface MOLevel {
  label: string
  /** Number of orbitals at this energy: 1 for σ, 2 for a degenerate π pair. */
  degeneracy: 1 | 2
  /** True for a bonding level, false for an antibonding one (σ* or π*). */
  bonding: boolean
}

/** Occupancy of one MO level after filling. */
export interface MOOccupancy extends MOLevel {
  /** Electrons in this level (0 to 2 × degeneracy). */
  electrons: number
  /** Unpaired electrons in this level after Hund's rule (zero for a full or empty level). */
  unpaired: number
}

/** The MO order with 2s–2p mixing (B₂, C₂, N₂, and the lighter species). */
export const MO_ORDER_WITH_MIXING: readonly MOLevel[] = [
  { label: 'σ1s', degeneracy: 1, bonding: true },
  { label: 'σ*1s', degeneracy: 1, bonding: false },
  { label: 'σ2s', degeneracy: 1, bonding: true },
  { label: 'σ*2s', degeneracy: 1, bonding: false },
  { label: 'π2p', degeneracy: 2, bonding: true },
  { label: 'σ2p', degeneracy: 1, bonding: true },
  { label: 'π*2p', degeneracy: 2, bonding: false },
  { label: 'σ*2p', degeneracy: 1, bonding: false },
]

/** The MO order without 2s–2p mixing (O₂, F₂, Ne₂, and their ions). */
export const MO_ORDER_WITHOUT_MIXING: readonly MOLevel[] = [
  { label: 'σ1s', degeneracy: 1, bonding: true },
  { label: 'σ*1s', degeneracy: 1, bonding: false },
  { label: 'σ2s', degeneracy: 1, bonding: true },
  { label: 'σ*2s', degeneracy: 1, bonding: false },
  { label: 'σ2p', degeneracy: 1, bonding: true },
  { label: 'π2p', degeneracy: 2, bonding: true },
  { label: 'π*2p', degeneracy: 2, bonding: false },
  { label: 'σ*2p', degeneracy: 1, bonding: false },
]

/**
 * Fills molecular orbital levels in order of increasing energy, with Hund's rule inside each
 * degenerate pair: electrons go singly into each orbital of a level before any pair forms.
 *
 * @param electronCount Valence electrons in the species (non-negative integer).
 * @param order Energy order of the levels, lowest first.
 * @throws {RangeError} If the count is not a non-negative integer, or exceeds the levels' capacity
 */
export function fillMOs(electronCount: number, order: readonly MOLevel[] = MO_ORDER_WITHOUT_MIXING): MOOccupancy[] {
  if (!Number.isInteger(electronCount) || electronCount < 0) {
    throw new RangeError(`electronCount must be a non-negative integer (received ${electronCount})`)
  }
  const capacity = order.reduce((sum, level) => sum + 2 * level.degeneracy, 0)
  if (electronCount > capacity) throw new RangeError(`${electronCount} electrons exceed the ${capacity} places in these levels`)
  let remaining = electronCount
  return order.map((level) => {
    const electrons = Math.min(remaining, 2 * level.degeneracy)
    remaining -= electrons
    // Hund: with e electrons in d orbitals, the first min(e, d) go in singly and the rest pair up.
    const unpaired = electrons <= level.degeneracy ? electrons : 2 * level.degeneracy - electrons
    return { ...level, electrons, unpaired }
  })
}

/** Bond order (Nb − Na)/2 from a filled set of levels (Section 4.7.5). */
export function bondOrder(levels: readonly MOOccupancy[]): number {
  const bonding = levels.filter((l) => l.bonding).reduce((sum, l) => sum + l.electrons, 0)
  const antibonding = levels.filter((l) => !l.bonding).reduce((sum, l) => sum + l.electrons, 0)
  return (bonding - antibonding) / 2
}

/** Total unpaired electrons in a filled set of levels. */
export function unpairedElectrons(levels: readonly MOOccupancy[]): number {
  return levels.reduce((sum, l) => sum + l.unpaired, 0)
}

/** True if the species has at least one unpaired electron (paramagnetic); false if all are paired (diamagnetic). */
export function isParamagnetic(levels: readonly MOOccupancy[]): boolean {
  return unpairedElectrons(levels) > 0
}

/** Superscript digits, for configuration text. */
const SUPERSCRIPT = ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹']

/** Configuration text such as "σ1s² σ*1s² σ2s² π2p⁴" for the occupied levels. */
export function configurationText(levels: readonly MOOccupancy[]): string {
  return levels
    .filter((l) => l.electrons > 0)
    .map((l) => `${l.label}${String(l.electrons).split('').map((d) => SUPERSCRIPT[Number(d)]).join('')}`)
    .join(' ')
}

/** A homonuclear diatomic or ion from NCERT Section 4.8 and Fig. 4.21. */
export interface MOSpecies {
  formula: string
  /** Valence electrons in the species. */
  electrons: number
  /** True if the species uses the order with 2s–2p mixing. */
  mixing: boolean
}

/** The species NCERT's MO discussion covers, plus the ions named in the text. */
export const MO_SPECIES: readonly MOSpecies[] = [
  { formula: 'H₂⁺', electrons: 1, mixing: true },
  { formula: 'H₂', electrons: 2, mixing: true },
  { formula: 'He₂⁺', electrons: 3, mixing: true },
  { formula: 'He₂', electrons: 4, mixing: true },
  { formula: 'Li₂', electrons: 6, mixing: true },
  { formula: 'Be₂', electrons: 8, mixing: true },
  { formula: 'B₂', electrons: 10, mixing: true },
  { formula: 'C₂', electrons: 12, mixing: true },
  { formula: 'N₂', electrons: 14, mixing: true },
  { formula: 'O₂⁺', electrons: 15, mixing: false },
  { formula: 'O₂', electrons: 16, mixing: false },
  { formula: 'O₂⁻', electrons: 17, mixing: false },
  { formula: 'O₂²⁻', electrons: 18, mixing: false },
  { formula: 'F₂', electrons: 18, mixing: false },
  { formula: 'Ne₂', electrons: 20, mixing: false },
]

/** Summary of one species after filling. */
export interface MOSummary {
  formula: string
  electrons: number
  levels: MOOccupancy[]
  bondOrder: number
  unpaired: number
  paramagnetic: boolean
  configuration: string
}

/**
 * Fills the MO levels for a species from {@link MO_SPECIES}, using the energy order its
 * mixing flag selects, and returns its bond order and magnetism.
 *
 * @throws {RangeError} If the formula is not in MO_SPECIES
 */
export function summariseSpecies(formula: string): MOSummary {
  const species = MO_SPECIES.find((s) => s.formula === formula)
  if (!species) throw new RangeError(`${formula} is not in MO_SPECIES`)
  const order = species.mixing ? MO_ORDER_WITH_MIXING : MO_ORDER_WITHOUT_MIXING
  const levels = fillMOs(species.electrons, order)
  return {
    formula,
    electrons: species.electrons,
    levels,
    bondOrder: bondOrder(levels),
    unpaired: unpairedElectrons(levels),
    paramagnetic: isParamagnetic(levels),
    configuration: configurationText(levels),
  }
}
