import { describe, expect, it } from 'vitest'
import { NCERT_TABLE_4_6_NO_LONE_PAIR, NCERT_TABLE_4_7_LONE_PAIR_SHAPES, NCERT_TABLE_4_8_REASONS } from './ncert-unit4-tables'
import { predictShape, vseprClass, vseprPositions, type Vec3 } from './vsepr'

/** Angle in degrees between two unit vectors. */
function angle(a: Vec3, b: Vec3): number {
  const dot = a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
  return (Math.acos(Math.max(-1, Math.min(1, dot))) * 180) / Math.PI
}

function near(actual: number, expected: number, tol = 0.01): void {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tol)
}

describe('vseprPositions returns unit vectors', () => {
  it('gives one unit vector per domain for every supported class', () => {
    for (const [bp, lp] of [[2, 0], [3, 0], [4, 0], [5, 0], [6, 0], [2, 1], [3, 1], [2, 2], [4, 1], [3, 2], [5, 1], [4, 2]]) {
      const { bonds, lonePairs } = vseprPositions(bp, lp)
      expect(bonds).toHaveLength(bp)
      expect(lonePairs).toHaveLength(lp)
      for (const v of [...bonds, ...lonePairs]) {
        near(Math.hypot(v[0], v[1], v[2]), 1, 1e-9)
      }
    }
  })
})

describe('Table 4.6: no lone pair on the central atom', () => {
  it('row 2, linear: bonds 180° apart', () => {
    const { bonds } = vseprPositions(2, 0)
    near(angle(bonds[0], bonds[1]), 180)
    expect(vseprClass(2, 0).electronGeometry).toBe('Linear')
    expect(predictShape('BeCl2').molecularShape).toBe('Linear')
    expect(predictShape('HgCl2').molecularShape).toBe('Linear')
  })

  it('row 3, trigonal planar: bonds 120° apart', () => {
    const { bonds } = vseprPositions(3, 0)
    for (let i = 0; i < 3; i++) near(angle(bonds[i], bonds[(i + 1) % 3]), 120)
    expect(predictShape('BF3').molecularShape).toBe('Trigonal planar')
  })

  it('row 4, tetrahedral: bonds at 109.5°', () => {
    const { bonds } = vseprPositions(4, 0)
    for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) near(angle(bonds[i], bonds[j]), 109.47, 0.01)
    expect(predictShape('CH4').molecularShape).toBe('Tetrahedral')
    expect(predictShape('NH4⁺').molecularShape).toBe('Tetrahedral')
  })

  it('row 5, trigonal bipyramidal: 90° between axial and equatorial, 120° between equatorial', () => {
    const { bonds } = vseprPositions(5, 0)
    const axial = bonds.filter((v) => Math.abs(v[2]) === 1)
    expect(axial).toHaveLength(2)
    near(angle(axial[0], axial[1]), 180)
    const equatorial = bonds.filter((v) => v[2] === 0)
    near(angle(equatorial[0], equatorial[1]), 120)
    near(angle(axial[0], equatorial[0]), 90)
    expect(predictShape('PCl5').molecularShape).toBe('Trigonal bipyramidal')
  })

  it('row 6, octahedral: bonds 90° apart on the axes', () => {
    const { bonds } = vseprPositions(6, 0)
    near(angle(bonds[0], bonds[2]), 90)
    near(angle(bonds[0], bonds[1]), 180)
    expect(predictShape('SF6').molecularShape).toBe('Octahedral')
  })

  it('matches the rows of NCERT_TABLE_4_6_NO_LONE_PAIR', () => {
    const pairs = NCERT_TABLE_4_6_NO_LONE_PAIR.rows.map((r) => r.electronPairs)
    expect(pairs).toEqual([2, 3, 4, 5, 6])
    for (const row of NCERT_TABLE_4_6_NO_LONE_PAIR.rows) {
      expect(vseprClass(row.electronPairs, 0).electronGeometry).toBe(row.molecularGeometry)
    }
  })
})

describe('Table 4.7: central atom with one or more lone pairs', () => {
  it('AB2E (SO2): bent, trigonal-planar arrangement, 119.5° stated', () => {
    const cls = vseprClass(2, 1)
    expect(cls.notation).toBe('AB2E')
    expect(cls.electronGeometry).toBe('Trigonal planar')
    expect(cls.molecularShape).toBe('Bent')
    expect(cls.reportedAngle).toBe(119.5)
    expect(predictShape('SO2').molecularShape).toBe('Bent')
  })

  it('AB3E (NH3): trigonal pyramidal in a tetrahedral arrangement', () => {
    const cls = vseprClass(3, 1)
    expect(cls.electronGeometry).toBe('Tetrahedral')
    expect(cls.molecularShape).toBe('Trigonal pyramidal')
    expect(predictShape('NH3').molecularShape).toBe('Trigonal pyramidal')
  })

  it('AB2E2 (H2O): bent in a tetrahedral arrangement', () => {
    const cls = vseprClass(2, 2)
    expect(cls.electronGeometry).toBe('Tetrahedral')
    expect(cls.molecularShape).toBe('Bent')
    expect(predictShape('H2O').molecularShape).toBe('Bent')
  })

  it('AB4E (SF4): see-saw, with the lone pair equatorial', () => {
    const { bonds, lonePairs } = vseprPositions(4, 1)
    expect(vseprClass(4, 1).molecularShape).toBe('See-saw')
    const lp = lonePairs[0]
    expect(Math.abs(lp[2])).toBe(0)
    const axial = bonds.filter((v) => Math.abs(v[2]) === 1)
    expect(axial).toHaveLength(2)
    near(angle(axial[0], axial[1]), 180)
    expect(predictShape('SF4').molecularShape).toBe('See-saw')
  })

  it('AB3E2 (ClF3): T-shape with both lone pairs equatorial', () => {
    const { bonds, lonePairs } = vseprPositions(3, 2)
    expect(vseprClass(3, 2).molecularShape).toBe('T-shape')
    for (const lp of lonePairs) expect(lp[2]).toBe(0)
    expect(bonds.filter((v) => Math.abs(v[2]) === 1)).toHaveLength(2)
    expect(predictShape('ClF3').molecularShape).toBe('T-shape')
  })

  it('AB5E (BrF5): square pyramid with the lone pair on the axis', () => {
    const { bonds, lonePairs } = vseprPositions(5, 1)
    expect(vseprClass(5, 1).molecularShape).toBe('Square pyramid')
    expect(Math.abs(lonePairs[0][2])).toBe(1)
    expect(bonds).toHaveLength(5)
    expect(predictShape('BrF5').molecularShape).toBe('Square pyramid')
  })

  it('AB4E2 (XeF4): square planar with the lone pairs trans', () => {
    const { bonds, lonePairs } = vseprPositions(4, 2)
    expect(vseprClass(4, 2).molecularShape).toBe('Square planar')
    near(angle(lonePairs[0], lonePairs[1]), 180)
    for (const v of bonds) expect(v[2]).toBe(0)
    expect(predictShape('XeF4').molecularShape).toBe('Square planar')
  })

  it('has seven rows, each matching the class this module returns', () => {
    for (const row of NCERT_TABLE_4_7_LONE_PAIR_SHAPES.rows) {
      const cls = vseprClass(row.bondingPairs, row.lonePairs)
      expect(cls.notation).toBe(row.moleculeType)
      expect(cls.molecularShape.replace('-', ' ')).toBe(row.shape.replace('-', ' '))
    }
  })
})

describe('Table 4.8: real angles NCERT states', () => {
  it('gives H2O 104.5°, NH3 107° and the SO2 bent angle 119.5°', () => {
    expect(vseprClass(2, 2).reportedAngle).toBe(104.5)
    expect(vseprClass(3, 1).reportedAngle).toBe(107)
    expect(vseprClass(2, 1).reportedAngle).toBe(119.5)
  })

  it('matches the printed angles in Table 4.8 for SO2, NH3 and H2O', () => {
    for (const row of NCERT_TABLE_4_8_REASONS.rows) {
      if (row.reasonAngleDeg === null) continue
      expect(predictShape(row.example).reportedAngle).toBe(row.reasonAngleDeg)
    }
  })

  it('treats the AB2E row of Table 4.8 as one bent shape (its 4 bonding pairs count each double bond twice)', () => {
    // VSEPR counts a multiple bond as one domain, so SO2 is AB2E (2 bonding domains + 1 lone pair).
    expect(predictShape('SO2').bondPairs).toBe(2)
  })
})

describe('predictShape', () => {
  it('rejects a species NCERT does not name', () => {
    expect(() => predictShape('XeOF4')).toThrow(RangeError)
  })
})

describe('vseprClass input checks', () => {
  it('rejects a combination outside Tables 4.6 to 4.8', () => {
    expect(() => vseprClass(2, 3)).toThrow(RangeError)
    expect(() => vseprPositions(7, 0)).toThrow(RangeError)
  })

  it('rejects negative or fractional counts', () => {
    expect(() => vseprClass(-1, 0)).toThrow(RangeError)
    expect(() => vseprClass(2.5, 0)).toThrow(RangeError)
  })
})
