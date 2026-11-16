import { describe, expect, it } from 'vitest'
import { TETRAHEDRAL_ANGLE_DEG, ethaneModel, measuredDihedral, type Vec3 } from './ethane-3d'
import { conformationName } from './conformations'

const pos = (m: ReturnType<typeof ethaneModel>, id: string): Vec3 => m.atoms.find((a) => a.id === id)!.position
const dist = (a: Vec3, b: Vec3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])
const angle = (c: Vec3, a: Vec3, b: Vec3) => {
  const u = [a[0] - c[0], a[1] - c[1], a[2] - c[2]]
  const v = [b[0] - c[0], b[1] - c[1], b[2] - c[2]]
  const cos = (u[0] * v[0] + u[1] * v[1] + u[2] * v[2]) / (Math.hypot(...u) * Math.hypot(...v))
  return (Math.acos(cos) * 180) / Math.PI
}

describe('ethaneModel', () => {
  it('has two carbons and six hydrogens, joined by seven single bonds', () => {
    const m = ethaneModel(0)
    expect(m.atoms.filter((a) => a.element === 'C')).toHaveLength(2)
    expect(m.atoms.filter((a) => a.element === 'H')).toHaveLength(6)
    expect(m.bonds).toHaveLength(7)
    expect(m.bonds.every((b) => b.order === 1)).toBe(true)
  })

  it('keeps every C–H bond one scene unit long and the C–C bond one unit long', () => {
    for (const d of [0, 17, 60, 111]) {
      const m = ethaneModel(d)
      for (const b of m.bonds) expect(dist(pos(m, b.a), pos(m, b.b))).toBeCloseTo(1, 9)
    }
  })

  it('puts every H–C–H and H–C–C angle at the tetrahedral 109.5°', () => {
    const m = ethaneModel(35)
    const c1 = pos(m, 'c1')
    const c2 = pos(m, 'c2')
    for (const [i, j] of [
      [1, 2],
      [1, 3],
      [2, 3],
    ]) {
      expect(angle(c1, pos(m, `h${i}`), pos(m, `h${j}`))).toBeCloseTo(TETRAHEDRAL_ANGLE_DEG, 6)
    }
    for (const j of [4, 5, 6]) {
      expect(angle(c2, pos(m, `h${j}`), c1)).toBeCloseTo(TETRAHEDRAL_ANGLE_DEG, 6)
    }
  })

  it('measures the dihedral of the model as the angle it was built with', () => {
    for (const d of [0, 30, 60, 90, 120, 200, 300]) {
      const measured = measuredDihedral(ethaneModel(d))
      // Dihedral angles are defined up to the sign and the full turn: compare as cosines.
      expect(Math.cos(((measured - d) * Math.PI) / 180)).toBeCloseTo(1, 9)
    }
  })

  it('is eclipsed at 0° and staggered at 60°, as conformationName says', () => {
    expect(conformationName(measuredDihedral(ethaneModel(0)))).toBe('eclipsed')
    expect(conformationName(measuredDihedral(ethaneModel(60)))).toBe('staggered')
  })

  it('turns only the back hydrogens: the front ones do not move with the angle', () => {
    const a = ethaneModel(0)
    const b = ethaneModel(45)
    for (const id of ['c1', 'c2', 'h1', 'h2', 'h3']) expect(pos(a, id)).toEqual(pos(b, id))
    expect(pos(a, 'h4')).not.toEqual(pos(b, 'h4'))
  })

  it('rejects an angle that is not finite', () => {
    expect(() => ethaneModel(Number.NaN)).toThrow(RangeError)
    expect(() => ethaneModel(Number.POSITIVE_INFINITY)).toThrow(RangeError)
  })
})
