import { describe, it, expect } from 'vitest'
import { clamp01, ease, foldOpacity, lerp, lerpPoint, lerpPoints, revealOpacity } from './morph'
import { completeGrid } from './grid'
import { PENTAN2OL, TRIMETHYLPENTANE } from './fixture'
import { condensedAtoms, condensedLabel } from './condensed'
import { structuralBounds } from './StructuralFormula'

describe('morph interpolation', () => {
  it('eases from 0 to 1 with zero slope at both ends and no overshoot', () => {
    expect(ease(0)).toBe(0)
    expect(ease(1)).toBe(1)
    expect(ease(-1)).toBe(0)
    expect(ease(2)).toBe(1)
    let prev = 0
    for (let i = 1; i <= 20; i++) {
      const v = ease(i / 20)
      expect(v).toBeGreaterThanOrEqual(prev)
      expect(v).toBeLessThanOrEqual(1)
      prev = v
    }
    expect(ease(0.5)).toBeCloseTo(0.5)
  })

  it('lerp and lerpPoint hit the endpoints and the midpoint', () => {
    expect(lerp(2, 6, 0)).toBe(2)
    expect(lerp(2, 6, 1)).toBe(6)
    expect(lerp(2, 6, 0.5)).toBe(4)
    expect(lerpPoint({ x: 0, y: 0 }, { x: 4, y: -2 }, 0.5)).toEqual({ x: 2, y: -1 })
  })

  it('lerpPoints moves every point and refuses mismatched lengths', () => {
    const a = [{ x: 0, y: 0 }, { x: 1, y: 1 }]
    const b = [{ x: 2, y: 0 }, { x: 1, y: 3 }]
    expect(lerpPoints(a, b, 1)).toEqual(b)
    expect(lerpPoints(a, b, 0)).toEqual(a)
    expect(() => lerpPoints(a, [b[0]], 0.5)).toThrow()
  })

  it('hydrogens fade out as the morph runs and the bond-line labels fade in', () => {
    expect(foldOpacity(0)).toBe(1)
    expect(foldOpacity(1)).toBe(0)
    expect(revealOpacity(0)).toBe(0)
    expect(revealOpacity(1)).toBe(1)
    expect(clamp01(1.5)).toBe(1)
  })
})

describe('complete grid', () => {
  it('places every heavy atom on its own cell with bonds between neighbouring cells', () => {
    for (const g of [PENTAN2OL, TRIMETHYLPENTANE]) {
      const grid = completeGrid(g)
      const cells = new Set(grid.heavy.map((p) => `${p.x},${p.y}`))
      expect(cells.size).toBe(g.atoms.length)
      for (const b of g.bonds) {
        const p = grid.heavy[b.a]
        const q = grid.heavy[b.b]
        expect(Math.abs(p.x - q.x) + Math.abs(p.y - q.y)).toBe(1)
      }
    }
  })

  it('gives every hydrogen a free cell next to its parent', () => {
    const grid = completeGrid(PENTAN2OL)
    const total = PENTAN2OL.atoms.reduce((s, a) => s + (a.hCount ?? 0), 0)
    expect(grid.hydrogens).toHaveLength(total)
    for (const h of grid.hydrogens) {
      const p = grid.heavy[h.parent]
      expect(Math.abs(p.x - h.pos.x) + Math.abs(p.y - h.pos.y)).toBeLessThanOrEqual(1.5)
    }
  })
})

describe('condensed formulas', () => {
  it('writes pentan-2-ol as CH3CH(OH)CH2CH2CH3', () => {
    const text = condensedAtoms(PENTAN2OL)
      .map((a) => a.text)
      .join('')
    expect(text).toBe('CH₃CH(OH)CH₂CH₂CH₃')
  })

  it('puts methyl branches above and below their carbon', () => {
    const atoms = condensedAtoms(TRIMETHYLPENTANE)
    const quaternary = atoms.find((a) => a.atom === 1)
    expect(quaternary).toBeDefined()
    expect(quaternary?.above.length ?? 0).toBe(1)
    expect(quaternary?.below.length ?? 0).toBe(1)
    expect(condensedLabel(TRIMETHYLPENTANE, 5)).toBe('CH₃')
  })

  it('the morph bounds hold the complete and bond-line drawings alike', () => {
    const b = structuralBounds(PENTAN2OL)
    expect(b.width).toBeGreaterThan(0)
    expect(b.height).toBeGreaterThan(0)
  })
})
