import { directionDeg, freeDirections } from './geometry'

/**
 * Electron bookkeeping for Lewis diagrams: formal charge and octet count.
 * Both are pure functions of an atom's electron pairs and bond orders.
 */

/**
 * Formal charge = valence electrons - non-bonding electrons - bonding electrons / 2.
 * With `lonePairs` lone pairs, `unpaired` single electrons and bonds of the given orders,
 * that is V - 2·LP - unpaired - Σorder (an unpaired electron is non-bonding, as in NO).
 */
export function formalCharge(
  valenceElectrons: number,
  lonePairs: number,
  bondOrders: readonly number[],
  unpaired = 0
): number {
  const bonds = bondOrders.reduce((sum, order) => sum + order, 0)
  return valenceElectrons - 2 * lonePairs - unpaired - bonds
}

/** Electrons an atom counts around itself: lone-pair electrons, unpaired electrons and two per bond. */
export function octetCount(lonePairs: number, bondOrders: readonly number[], unpaired = 0): number {
  const bonds = bondOrders.reduce((sum, order) => sum + order, 0)
  return 2 * lonePairs + unpaired + 2 * bonds
}

/** Valence electrons of the main-group elements used on the site. */
export const VALENCE_ELECTRONS: Readonly<Record<string, number>> = {
  H: 1,
  Be: 2,
  B: 3,
  C: 4,
  N: 5,
  O: 6,
  F: 7,
  Na: 1,
  P: 5,
  S: 6,
  Cl: 7,
  Xe: 8,
}

/** Valence electrons of an element symbol, or 0 when it is not in the table. */
export function valenceOfElement(symbol: string): number {
  return VALENCE_ELECTRONS[symbol] ?? 0
}

/**
 * The attachment point for an atom's label: how far a bond line must stop
 * short of the atom's centre so it clears the element symbol.
 */
export function symbolClearance(symbol: string): number {
  return symbol.length > 1 ? 9 : 7
}

export interface LewisAtomSpec {
  id: string
  element: string
  x: number
  y: number
  lonePairs?: number
  unpaired?: number
  formalCharge?: number
}

export interface LewisBondSpec {
  a: string
  b: string
  order?: 1 | 2 | 3
}

export interface LewisAtomLayout {
  id: string
  /** Direction (degrees, SVG convention) of every bond from this atom. */
  bondAngles: number[]
  /** Directions of the lone pairs, away from the bonds. */
  lonePairAngles: number[]
  /** Directions of the single unpaired electrons. */
  unpairedAngles: number[]
  /** Where the circled formal charge goes, if the atom has one. */
  chargeAngle?: number
  /** Where the octet badge goes. */
  badgeAngle: number
}

/**
 * Where everything around each atom goes. Bonds fix the first directions. Lone
 * pairs, unpaired dots, the formal charge and the octet badge then take the
 * open directions in that order, so nothing is placed on top of anything else.
 */
export function layoutLewis(atoms: readonly LewisAtomSpec[], bonds: readonly LewisBondSpec[]): LewisAtomLayout[] {
  const byId = new Map(atoms.map((atom) => [atom.id, atom]))
  return atoms.map((atom) => {
    const bondAngles: number[] = []
    for (const bond of bonds) {
      const other = bond.a === atom.id ? bond.b : bond.b === atom.id ? bond.a : null
      const partner = other ? byId.get(other) : undefined
      if (partner) bondAngles.push(directionDeg(partner.x - atom.x, partner.y - atom.y))
    }
    const lonePairAngles = freeDirections(bondAngles, atom.lonePairs ?? 0)
    const afterPairs = [...bondAngles, ...lonePairAngles]
    const unpairedAngles = freeDirections(afterPairs, atom.unpaired ?? 0)
    const occupied = [...afterPairs, ...unpairedAngles]
    const hasCharge = atom.formalCharge !== undefined && atom.formalCharge !== 0
    const chargeAngle = hasCharge ? freeDirections(occupied, 1)[0] : undefined
    if (chargeAngle !== undefined) occupied.push(chargeAngle)
    const badgeAngle = freeDirections(occupied, 1)[0] ?? -90
    return { id: atom.id, bondAngles, lonePairAngles, unpairedAngles, chargeAngle, badgeAngle }
  })
}
