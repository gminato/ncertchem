import { describe, expect, it } from 'vitest'
import { molarConductivityScm2 } from './conductance'
import { NCERT_KCL_CONDUCTIVITY } from './ncert-c12-unit2-tables'
import {
  ACETIC_ALPHA,
  ACETIC_KA,
  ACETIC_LAMBDA0,
  ACETIC_MEASURED,
  KCL_A_LINE,
  KCL_DILUTE_POINTS,
  KCL_LAMBDA0_LINE,
  MGCL2_LAMBDA0,
  volumePerMoleCm3,
} from './variation-conductivity'

describe('variation of conductivity values (Section 2.4.2)', () => {
  it('uses the two dilute Table 2.3 KCl rows and their Λm agrees with κ × 1000 / c', () => {
    expect(KCL_DILUTE_POINTS.map((p) => p.c)).toEqual([0.1, 0.01])
    for (const p of KCL_DILUTE_POINTS) {
      const row = NCERT_KCL_CONDUCTIVITY.find((r) => r.molPerL === p.c)!
      expect(molarConductivityScm2(row.kappaScmInv, p.c)).toBeCloseTo(p.lambdaScm2, 6)
    }
  })

  it('gives the two-point KCl line Λ°m ≈ 146.5 and A ≈ 55.5', () => {
    expect(KCL_LAMBDA0_LINE).toBeCloseTo(146.5, 1)
    expect(KCL_A_LINE).toBeCloseTo(55.5, 1)
  })

  it('computes the cell volume per mole as 1000 / c cm³', () => {
    expect(volumePerMoleCm3(0.1)).toBeCloseTo(10000, 6)
    expect(volumePerMoleCm3(0.01)).toBeCloseTo(100000, 6)
    expect(() => volumePerMoleCm3(0)).toThrow(RangeError)
  })

  it('sums Table 2.4 ions for acetic acid and MgCl₂', () => {
    expect(ACETIC_LAMBDA0).toBeCloseTo(390.5, 6)
    expect(MGCL2_LAMBDA0).toBeCloseTo(258.6, 6)
  })

  it('derives α and Ka from the illustrative measured point', () => {
    expect(ACETIC_MEASURED.c).toBe(0.02)
    expect(ACETIC_ALPHA).toBeCloseTo(0.0297, 4)
    expect(ACETIC_KA).toBeCloseTo(1.82e-5, 7)
  })
})
