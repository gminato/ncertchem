import { describe, it, expect } from 'vitest'
import { MOLECULE_LAYOUTS, type MoleculeLayout } from './molecules'

type Vec = { x: number; y: number; z: number }

/**
 * Angle in degrees at vertex `b` between the bonds b-a and b-c, in 3D. The view
 * is a rotation, so the 3D angle equals the true bond angle.
 */
function angleAt(layout: MoleculeLayout, b: number, a: number, c: number): number {
  const at = (i: number): Vec => layout.atoms[i]
  const sub = (p: Vec, q: Vec): Vec => ({ x: p.x - q.x, y: p.y - q.y, z: p.z - q.z })
  const len = (v: Vec) => Math.hypot(v.x, v.y, v.z)
  const v1 = sub(at(a), at(b))
  const v2 = sub(at(c), at(b))
  const dot = v1.x * v2.x + v1.y * v2.y + v1.z * v2.z
  const cos = dot / (len(v1) * len(v2))
  return (Math.acos(Math.max(-1, Math.min(1, cos))) * 180) / Math.PI
}

describe('MOLECULE_LAYOUTS', () => {
  it('defines every formula the vocabulary page uses', () => {
    for (const f of ['H2', 'O2', 'N2', 'NO', 'Cl2', 'H2O', 'H2O2', 'CO2', 'CH4', 'NH3', 'HCl', 'NaCl', 'I⁻', 'IO⁻']) {
      expect(MOLECULE_LAYOUTS).toHaveProperty(f)
    }
  })

  it('draws water bent at 104.5 degrees', () => {
    expect(angleAt(MOLECULE_LAYOUTS.H2O, 0, 1, 2)).toBeCloseTo(104.5, 1)
  })

  it('draws hydrogen peroxide with an O-O-H angle of 95 degrees', () => {
    expect(angleAt(MOLECULE_LAYOUTS.H2O2, 0, 1, 2)).toBeCloseTo(95, 0)
    expect(MOLECULE_LAYOUTS.H2O2.atoms).toHaveLength(4)
    expect(MOLECULE_LAYOUTS.H2O2.bonds).toHaveLength(3)
  })

  it('draws nitric oxide as one double bond and iodide as a bare atom', () => {
    expect(MOLECULE_LAYOUTS.NO.bonds).toEqual([{ a: 0, b: 1, order: 2 }])
    expect(MOLECULE_LAYOUTS['I⁻'].atoms).toHaveLength(1)
    expect(MOLECULE_LAYOUTS['I⁻'].bonds).toHaveLength(0)
    expect(MOLECULE_LAYOUTS['IO⁻'].bonds).toHaveLength(1)
  })

  it('draws carbon dioxide linear', () => {
    expect(angleAt(MOLECULE_LAYOUTS.CO2, 0, 1, 2)).toBeCloseTo(180, 1)
  })

  it('draws methane tetrahedral: every H-C-H angle is 109.47 degrees', () => {
    for (const [a, c] of [
      [1, 2],
      [1, 3],
      [1, 4],
      [2, 3],
      [2, 4],
      [3, 4],
    ]) {
      expect(angleAt(MOLECULE_LAYOUTS.CH4, 0, a, c)).toBeCloseTo(109.47, 1)
    }
  })

  it('draws ammonia with H-N-H near 107 degrees', () => {
    expect(angleAt(MOLECULE_LAYOUTS.NH3, 0, 1, 2)).toBeCloseTo(107, 0)
  })

  it('gives each bond a valid order and in-range atom indices', () => {
    for (const layout of Object.values(MOLECULE_LAYOUTS)) {
      for (const bond of layout.bonds) {
        expect([1, 2, 3]).toContain(bond.order)
        expect(bond.a).toBeLessThan(layout.atoms.length)
        expect(bond.b).toBeLessThan(layout.atoms.length)
      }
    }
  })

  it('centres every molecule on its centroid', () => {
    for (const layout of Object.values(MOLECULE_LAYOUTS)) {
      const sx = layout.atoms.reduce((s, a) => s + a.x, 0)
      const sy = layout.atoms.reduce((s, a) => s + a.y, 0)
      expect(Math.abs(sx)).toBeLessThan(0.05)
      expect(Math.abs(sy)).toBeLessThan(0.05)
    }
  })
})
