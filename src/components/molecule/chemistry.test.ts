import { describe, it, expect } from 'vitest'
import { angleBetween3, angleSeparation, lensPolygon, type Vec3 } from './geometry'
import { drawnOrbitalCounts, levelEnergy, correlatedAO } from './mo-levels'
import { formalCharge, layoutLewis, octetCount, valenceOfElement } from './lewis-geometry'
import { morseCurve, morseEnergy, H2_MORSE } from './morse'
import { MIN_SEPARATION, netOverlapSign, overlapOrbitals, overlapRegions, type OverlapOrbital } from './overlap-geometry'
import { CO3_LEWIS, H2_BOND_ENTHALPY, METHANE_3D, N2_LEVELS, O2_LEVELS, SF4_3D, WATER_3D } from './fixture'
import { atomPositionMap, type Molecule3DData } from './molecule-data'
import { bondOrder, isParamagnetic } from '../../lib/chem/molecular-orbitals'

const lens = (c1: { x: number; y: number }, r1: number, c2: { x: number; y: number }, r2: number) =>
  lensPolygon(c1, r1, c2, r2)

function angleAt(data: Molecule3DData, centre: string, a: string, b: string): number {
  const pos = atomPositionMap(data.atoms)
  const sub = (p: Vec3, q: Vec3): Vec3 => [p[0] - q[0], p[1] - q[1], p[2] - q[2]]
  return angleBetween3(sub(pos.get(a)!, pos.get(centre)!), sub(pos.get(b)!, pos.get(centre)!))
}

describe('3D fixtures', () => {
  it('draws water with a 104.5° H–O–H angle', () => {
    expect(angleAt(WATER_3D, 'O', 'H1', 'H2')).toBeCloseTo(104.5, 1)
  })

  it('draws methane tetrahedral from the VSEPR positions, 109.5° for every H–C–H', () => {
    expect(angleAt(METHANE_3D, 'C', 'H1', 'H2')).toBeCloseTo(109.47, 1)
    expect(angleAt(METHANE_3D, 'C', 'H3', 'H4')).toBeCloseTo(109.47, 1)
  })

  it('draws SF4 as a see-saw: axial fluorines vertical, lone pair equatorial on the left', () => {
    const pos = atomPositionMap(SF4_3D.atoms)
    const lp = SF4_3D.lonePairs![0].direction
    expect(Math.abs(lp[1])).toBeLessThan(1e-9)
    expect(lp[0]).toBeLessThan(0)
    // The two axial fluorines are on the y axis, opposite each other.
    const fa = pos.get('Fa')!
    const fb = pos.get('Fb')!
    expect(Math.abs(fa[0])).toBeLessThan(1e-9)
    expect(fa[1]).toBeCloseTo(-fb[1], 9)
    expect(angleBetween3(fa, fb)).toBeCloseTo(180, 6)
    // The equatorial fluorines spread to the right, away from the lone pair.
    expect(angleBetween3(lp, pos.get('Fc')!)).toBeGreaterThan(90)
    expect(angleBetween3(lp, pos.get('Fd')!)).toBeGreaterThan(90)
  })

  it('refers only to atom ids that exist', () => {
    for (const data of [WATER_3D, METHANE_3D, SF4_3D]) {
      const ids = new Set(data.atoms.map((a) => a.id))
      for (const b of data.bonds) {
        expect(ids.has(b.a) && ids.has(b.b)).toBe(true)
      }
      for (const lp of data.lonePairs ?? []) expect(ids.has(lp.atom)).toBe(true)
      for (const arc of data.angleArcs ?? []) {
        expect(ids.has(arc.a) && ids.has(arc.b) && ids.has(arc.centre)).toBe(true)
      }
    }
  })
})

describe('Lewis bookkeeping (CO₃²⁻ from the library)', () => {
  const orders = (id: string) =>
    CO3_LEWIS.bonds.filter((b) => b.a === id || b.b === id).map((b) => b.order ?? 1)

  it('gives formal charges that sum to the ion charge, with two O⁻ atoms', () => {
    const sum = CO3_LEWIS.atoms.reduce(
      (total, atom) => total + formalCharge(valenceOfElement(atom.element), atom.lonePairs ?? 0, orders(atom.id)),
      0
    )
    expect(sum).toBe(-2)
    expect(CO3_LEWIS.atoms.filter((a) => a.formalCharge === -1)).toHaveLength(2)
  })

  it('counts an octet for every atom of CO₃²⁻', () => {
    for (const atom of CO3_LEWIS.atoms) {
      expect(octetCount(atom.lonePairs ?? 0, orders(atom.id))).toBe(8)
    }
  })

  it('puts the carbonyl oxygen lone pairs away from its double bond', () => {
    const od = layoutLewis(CO3_LEWIS.atoms, CO3_LEWIS.bonds).find((l) => l.id === CO3_LEWIS.atoms[1].id)!
    expect(od.lonePairAngles).toHaveLength(2)
    for (const lp of od.lonePairAngles) {
      expect(angleSeparation(lp, od.bondAngles[0])).toBeGreaterThan(90)
    }
  })

  it('places a formal charge away from the bonds and lone pairs', () => {
    const oa = layoutLewis(CO3_LEWIS.atoms, CO3_LEWIS.bonds).find((l) => l.id === CO3_LEWIS.atoms[2].id)!
    expect(oa.chargeAngle).toBeDefined()
    for (const o of [...oa.bondAngles, ...oa.lonePairAngles]) {
      expect(angleSeparation(oa.chargeAngle!, o)).toBeGreaterThan(40)
    }
  })

  it('gives no charge to an atom with a zero formal charge', () => {
    const c = layoutLewis(CO3_LEWIS.atoms, CO3_LEWIS.bonds).find((l) => l.id === CO3_LEWIS.atoms[0].id)!
    expect(c.chargeAngle).toBeUndefined()
  })
})

describe('MO layout and library fillings', () => {
  it('takes bond order and magnetism from the library, for O₂ and N₂', () => {
    expect(bondOrder(O2_LEVELS)).toBe(2)
    expect(isParamagnetic(O2_LEVELS)).toBe(true)
    expect(bondOrder(N2_LEVELS)).toBe(3)
    expect(isParamagnetic(N2_LEVELS)).toBe(false)
  })

  it('places π2p below σ2p in the mixed order and above it in the unmixed order', () => {
    expect(levelEnergy('π2p', true)).toBeLessThan(levelEnergy('σ2p', true))
    expect(levelEnergy('σ2p', false)).toBeLessThan(levelEnergy('π2p', false))
  })

  it('splits electrons across a degenerate pair with Hund’s rule for drawing', () => {
    expect(drawnOrbitalCounts(0, 0, 2)).toEqual([0, 0])
    expect(drawnOrbitalCounts(2, 2, 2)).toEqual([1, 1])
    expect(drawnOrbitalCounts(3, 1, 2)).toEqual([2, 1])
    expect(drawnOrbitalCounts(4, 0, 2)).toEqual([2, 2])
    expect(drawnOrbitalCounts(2, 0, 1)).toEqual([2])
  })

  it('correlates each MO with its atomic orbital', () => {
    expect(correlatedAO('σ*1s')).toBe('1s')
    expect(correlatedAO('σ*2s')).toBe('2s')
    expect(correlatedAO('π*2p')).toBe('2p')
  })
})

describe('overlap cases', () => {
  it('gives a positive net overlap for like-signed pairs', () => {
    const cases = [
      ['ss', 'positive'],
      ['sp', 'positive'],
      ['pp-sigma', 'positive'],
      ['pp-pi', 'positive'],
    ] as const
    for (const [kind, phase] of cases) {
      const [a, b] = overlapOrbitals(kind, phase, 0.45)
      const regions = overlapRegions(a, b, lens)
      expect(regions.length).toBeGreaterThan(0)
      expect(netOverlapSign(regions)).toBe(1)
    }
  })

  it('gives a negative overlap when the facing lobes have opposite signs', () => {
    const [a, b] = overlapOrbitals('pp-sigma', 'negative', 0.45)
    expect(netOverlapSign(overlapRegions(a, b, lens))).toBe(-1)
  })

  it('cancels to zero when an s orbital approaches a p side-on', () => {
    const [p, s] = overlapOrbitals('sp', 'zero', 0.3)
    const regions = overlapRegions(p, s, lens)
    expect(regions.length).toBeGreaterThan(0)
    expect(netOverlapSign(regions)).toBe(0)
  })

  it('cancels to zero for side-on p orbitals at right angles', () => {
    const [a, b] = overlapOrbitals('pp-sigma', 'zero', 0.3)
    expect(netOverlapSign(overlapRegions(a, b, lens))).toBe(0)
  })

  it('shows no overlap when the s orbitals are far apart', () => {
    const [a, b] = overlapOrbitals('ss', 'positive', 1)
    const regions = overlapRegions(a, b, lens)
    expect(regions).toHaveLength(0)
    expect(netOverlapSign(regions)).toBe(0)
  })

  it('brings the orbitals together as separation falls', () => {
    const gap = (sep: number) => {
      const [a, b] = overlapOrbitals('ss', 'positive', sep) as OverlapOrbital[]
      return Math.abs(b.centre.x - a.centre.x)
    }
    expect(gap(0)).toBeCloseTo(gap(MIN_SEPARATION), 9)
    expect(gap(1)).toBeGreaterThan(gap(0.5))
  })
})

describe('Morse potential (H2 formation)', () => {
  it('uses the NCERT H–H bond enthalpy for the well depth', () => {
    expect(H2_BOND_ENTHALPY).toBeCloseTo(435.8, 6)
    expect(H2_MORSE.de).toBeCloseTo(435.8, 6)
  })

  it('reaches the bond enthalpy depth at the bond length', () => {
    expect(morseEnergy(H2_MORSE.re, H2_MORSE)).toBeCloseTo(-H2_MORSE.de, 9)
  })

  it('is zero when the atoms are far apart', () => {
    expect(Math.abs(morseEnergy(1000, H2_MORSE))).toBeLessThan(1e-3)
  })

  it('falls to a minimum at the bond length, then rises', () => {
    const curve = morseCurve(H2_MORSE, 40, 200, 160)
    const minIndex = curve.reduce((best, p, i, arr) => (p.e < arr[best].e ? i : best), 0)
    expect(curve[minIndex].r).toBeCloseTo(H2_MORSE.re, 0)
    for (let i = 1; i <= minIndex; i++) expect(curve[i].e).toBeLessThanOrEqual(curve[i - 1].e + 1e-9)
  })
})

describe('angleSeparation', () => {
  it('measures the short way round a circle', () => {
    expect(angleSeparation(170, -170)).toBe(20)
    expect(angleSeparation(0, 180)).toBe(180)
  })
})
