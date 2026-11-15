import { describe, expect, it } from 'vitest'
import { LEDGER_MOLECULES, LEDGER_REACTIONS } from '@/lib/chem/bond-ledger'
import {
  ATOM_RADIUS,
  LEDGER_VIEW,
  MIN_BOND_LENGTH,
  SKETCH,
  layoutCopies,
  sketchHalfExtent,
} from './bond-energy-ledger-layout'

describe('molecule sketches', () => {
  it('has one sketch point per atom for every molecule', () => {
    for (const mol of Object.values(LEDGER_MOLECULES)) {
      expect(SKETCH[mol.id], mol.id).toHaveLength(mol.atoms.length)
    }
  })

  it('every bond is at least 50 units long', () => {
    for (const mol of Object.values(LEDGER_MOLECULES)) {
      const pts = SKETCH[mol.id]
      for (const bond of mol.bonds) {
        const a = pts[bond.a]
        const b = pts[bond.b]
        const length = Math.hypot(b.x - a.x, b.y - a.y)
        expect(length, `${mol.id} bond ${bond.a}-${bond.b}`).toBeGreaterThanOrEqual(MIN_BOND_LENGTH - 0.5)
      }
    }
  })

  it('atoms are drawn with a radius of at least 16 units', () => {
    expect(ATOM_RADIUS).toBeGreaterThanOrEqual(16)
  })
})

describe('stage layout', () => {
  it('every copy of every reaction fits inside the stage, labels included', () => {
    for (const reaction of LEDGER_REACTIONS) {
      for (const copy of layoutCopies(reaction)) {
        const { halfWidth, halfHeight } = sketchHalfExtent(copy.molecule)
        expect(copy.cx - halfWidth, `${reaction.id} ${copy.key}`).toBeGreaterThanOrEqual(0)
        expect(copy.cx + halfWidth).toBeLessThanOrEqual(LEDGER_VIEW.width)
        expect(copy.cy - halfHeight).toBeGreaterThanOrEqual(0)
        // The formula label sits 84 units below the centre and is about 10 units tall.
        expect(copy.cy + 84 + 10).toBeLessThanOrEqual(LEDGER_VIEW.height)
      }
    }
  })

  it('copies on the same row do not overlap', () => {
    for (const reaction of LEDGER_REACTIONS) {
      const copies = layoutCopies(reaction)
      for (let i = 0; i < copies.length; i++) {
        for (let j = i + 1; j < copies.length; j++) {
          const a = copies[i]
          const b = copies[j]
          if (a.cy !== b.cy) continue
          const ea = sketchHalfExtent(a.molecule)
          const eb = sketchHalfExtent(b.molecule)
          expect(Math.abs(a.cx - b.cx), `${reaction.id} ${a.key} vs ${b.key}`).toBeGreaterThanOrEqual(ea.halfWidth + eb.halfWidth)
        }
      }
    }
  })

  it('reactants sit on the top row and products on the bottom row', () => {
    for (const reaction of LEDGER_REACTIONS) {
      const copies = layoutCopies(reaction)
      const top = copies.filter((c) => c.side === 'break')
      const bottom = copies.filter((c) => c.side === 'form')
      expect(Math.max(...top.map((c) => c.cy))).toBeLessThan(Math.min(...bottom.map((c) => c.cy)))
    }
  })
})
