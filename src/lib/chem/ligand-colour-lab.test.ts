import { describe, expect, it } from 'vitest'
import {
  LAB_COMPLEXES,
  WHEEL_SECTORS,
  findLabComplex,
  formatPhotonEnergy,
  wavelengthFraction,
  wheelSectorIndex,
} from './ligand-colour-lab'

describe('ligand-colour-lab model', () => {
  it('exposes all 6 Table 5.3 rows plus all 4 Ni(II) en-series complexes', () => {
    expect(LAB_COMPLEXES).toHaveLength(10)
    expect(LAB_COMPLEXES.filter((c) => c.source === 'table-5-3')).toHaveLength(6)
    expect(LAB_COMPLEXES.filter((c) => c.source === 'ni-en')).toHaveLength(4)
  })

  it('marks [Co(CN)6]3- as ultraviolet at 310 nm with Pale Yellow observed', () => {
    const cn = findLabComplex('co-cn-6')
    expect(cn.wavelengthNm).toBe(310)
    expect(cn.isUv).toBe(true)
    expect(cn.observedText).toBe('Pale Yellow')
  })

  it('computes photon energy and visible strip fraction accurately', () => {
    expect(formatPhotonEnergy(498)).toBe('3.99 × 10⁻¹⁹ J')
    expect(wavelengthFraction(400)).toBeCloseTo(0, 5)
    expect(wavelengthFraction(550)).toBeCloseTo(0.5, 5)
    expect(wavelengthFraction(700)).toBeCloseTo(1, 5)
  })

  it('tracks 6 - 2n waters left across the Ni(II) en series', () => {
    for (let n = 0; n <= 3; n++) {
      const ni = findLabComplex(`ni-en-${n}`)
      expect(ni.enPerNi).toBe(n)
      expect(ni.waterLeft).toBe(6 - 2 * n)
    }
  })

  it('maps every visible complex to 180-degree opposite sectors on the colour wheel', () => {
    const half = WHEEL_SECTORS.length / 2
    for (const c of LAB_COMPLEXES) {
      if (c.isUv) {
        expect(c.wheelAbsorbed).toBeNull()
        expect(c.wheelSeen).toBeNull()
        continue
      }
      expect(c.wheelAbsorbed).not.toBeNull()
      expect(c.wheelSeen).not.toBeNull()
      const iAbs = wheelSectorIndex(c.wheelAbsorbed!)
      const iSeen = wheelSectorIndex(c.wheelSeen!)
      expect((iAbs + half) % WHEEL_SECTORS.length).toBe(iSeen)
    }
  })
})
