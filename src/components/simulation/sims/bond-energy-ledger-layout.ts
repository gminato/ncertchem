/**
 * Layout of the bond-energy ledger stage. Reactant copies sit on the top row and product copies on
 * the bottom row, so each molecule gets a slot as wide as the stage divided by its count. Every
 * sketch is drawn with bonds of at least MIN_BOND_LENGTH and atoms of ATOM_RADIUS, so the bonds
 * stay visible at phone width.
 */

import type { LedgerReaction } from '@/lib/chem/bond-ledger'

export const LEDGER_VIEW = { width: 600, height: 386 } as const
export const ATOM_RADIUS = 16
export const MIN_BOND_LENGTH = 50

/** Centre height of each row, in SVG units. */
export const ROW_Y = { reactant: 92, product: 290 } as const

export interface Point {
  x: number
  y: number
}

/** Local 2D sketch of each molecule, centred on the molecule's centre. Index = atom index in LEDGER_MOLECULES. */
export const SKETCH: Readonly<Record<string, readonly Point[]>> = {
  H2: [{ x: -25, y: 0 }, { x: 25, y: 0 }],
  Cl2: [{ x: -25, y: 0 }, { x: 25, y: 0 }],
  HCl: [{ x: -25, y: 0 }, { x: 25, y: 0 }],
  O2: [{ x: -25, y: 0 }, { x: 25, y: 0 }],
  N2: [{ x: -25, y: 0 }, { x: 25, y: 0 }],
  CH4: [{ x: 0, y: 0 }, { x: -50, y: 0 }, { x: 50, y: 0 }, { x: 0, y: -50 }, { x: 0, y: 50 }],
  C2H4: [
    { x: -25, y: 0 }, { x: 25, y: 0 },
    { x: -50, y: -43.3 }, { x: -50, y: 43.3 }, { x: 50, y: -43.3 }, { x: 50, y: 43.3 },
  ],
  C2H6: [
    { x: -25, y: 0 }, { x: 25, y: 0 },
    { x: -50, y: 43.3 }, { x: -50, y: -43.3 }, { x: -75, y: 0 },
    { x: 50, y: 43.3 }, { x: 50, y: -43.3 }, { x: 75, y: 0 },
  ],
  CO2: [{ x: 0, y: 0 }, { x: -50, y: 0 }, { x: 50, y: 0 }],
  H2O: [{ x: 0, y: 0 }, { x: -41, y: 29 }, { x: 41, y: 29 }],
  NH3: [{ x: 0, y: 0 }, { x: -44, y: 26 }, { x: 44, y: 26 }, { x: 0, y: -50 }],
}

/** One molecule drawn on the stage, with its centre and its place in the bond events. */
export interface PlacedCopy {
  key: string
  molecule: string
  copy: number
  side: 'break' | 'form'
  cx: number
  cy: number
}

/** Places every copy of every molecule: reactants on the top row, products on the bottom row. */
export function layoutCopies(reaction: LedgerReaction): PlacedCopy[] {
  const rows: { side: 'break' | 'form'; cy: number; terms: LedgerReaction['reactants'] }[] = [
    { side: 'break', cy: ROW_Y.reactant, terms: reaction.reactants },
    { side: 'form', cy: ROW_Y.product, terms: reaction.products },
  ]
  const out: PlacedCopy[] = []
  for (const row of rows) {
    const flat: { molecule: string; copy: number }[] = []
    for (const term of row.terms) {
      for (let copy = 0; copy < term.coefficient; copy++) flat.push({ molecule: term.molecule, copy })
    }
    const slot = LEDGER_VIEW.width / flat.length
    flat.forEach((item, i) => {
      out.push({
        key: `${row.side}|${item.molecule}|${item.copy}`,
        molecule: item.molecule,
        copy: item.copy,
        side: row.side,
        cx: slot * (i + 0.5),
        cy: row.cy,
      })
    })
  }
  return out
}

/** Half the width and half the height of a molecule's sketch, atoms included. */
export function sketchHalfExtent(molecule: string): { halfWidth: number; halfHeight: number } {
  const pts = SKETCH[molecule]
  if (!pts) throw new RangeError(`no sketch for ${molecule}`)
  const halfWidth = Math.max(...pts.map((p) => Math.abs(p.x))) + ATOM_RADIUS
  const halfHeight = Math.max(...pts.map((p) => Math.abs(p.y))) + ATOM_RADIUS
  return { halfWidth, halfHeight }
}
