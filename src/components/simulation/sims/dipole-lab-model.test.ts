import { describe, expect, it } from 'vitest'
import { netDipole } from '@/lib/chem/dipole'
import {
  ARROW_PX_PER_UNIT,
  LAB_MOLECULES,
  dipoleModelFor,
  labMolecule,
  lonePairComparison,
  printedRow,
  sceneFor,
} from './dipole-lab-model'

describe('dipole lab molecules', () => {
  it('offers every molecule the brief names, each with a Table 4.5 row', () => {
    const keys = LAB_MOLECULES.map((m) => m.key)
    expect(keys).toEqual(expect.arrayContaining(['CO2', 'BF3', 'H2O', 'NH3', 'NF3', 'CH4', 'CHCl3', 'CCl4', 'HF']))
    for (const m of LAB_MOLECULES) expect(() => printedRow(m)).not.toThrow()
  })

  it('finds the molecules that cancel by symmetry and the ones that do not', () => {
    const zero = ['CO2', 'BF3', 'CH4', 'CCl4'] as const
    const nonzero = ['H2O', 'NH3', 'NF3', 'CHCl3', 'HF'] as const
    for (const key of zero) expect(sceneFor(labMolecule(key), true).netIsZero).toBe(true)
    for (const key of nonzero) expect(sceneFor(labMolecule(key), true).netIsZero).toBe(false)
  })

  it('throws on an unknown key at the type boundary', () => {
    expect(() => labMolecule('XeF4' as never)).toThrow(RangeError)
  })
})

describe('tip-to-tail chain', () => {
  it('ends where the 3D net dipole projects to, for every molecule and both lone-pair settings', () => {
    for (const m of LAB_MOLECULES) {
      for (const on of [true, false]) {
        const scene = sceneFor(m, on)
        const model = dipoleModelFor(m)
        const lp = on ? model.lonePairDirections : []
        const net = netDipole({ ...model, lonePairDirections: lp })
        const expected = scene.project(net.vector)
        expect(scene.net.x).toBeCloseTo(expected.x * ARROW_PX_PER_UNIT, 6)
        expect(scene.net.y).toBeCloseTo(expected.y * ARROW_PX_PER_UNIT, 6)
      }
    }
  })

  it('starts each arrow where the previous one ends', () => {
    const scene = sceneFor(labMolecule('CHCl3'), true)
    scene.arrows.forEach((a, i) => {
      if (i === 0) {
        expect(a.chainStart).toEqual({ x: 0, y: 0 })
      } else {
        expect(a.chainStart.x).toBeCloseTo(scene.arrows[i - 1].chainEnd.x, 9)
        expect(a.chainStart.y).toBeCloseTo(scene.arrows[i - 1].chainEnd.y, 9)
      }
    })
  })

  it('draws two bonds and two lone pairs for water, and drops the lone pairs when switched off', () => {
    const water = labMolecule('H2O')
    expect(sceneFor(water, true).arrows.map((a) => a.kind)).toEqual(['bond', 'bond', 'lone-pair', 'lone-pair'])
    expect(sceneFor(water, false).arrows.map((a) => a.kind)).toEqual(['bond', 'bond'])
    expect(sceneFor(water, false).lobes).toHaveLength(2)
  })
})

describe('lone-pair comparison (why NF3 is smaller than NH3)', () => {
  it('gives bond dipoles alone with NF3 larger than NH3, the reason the lone pair matters', () => {
    const nh3 = lonePairComparison(labMolecule('NH3'))
    const nf3 = lonePairComparison(labMolecule('NF3'))
    expect(nh3.bondsOnly).toBeCloseTo(0.84, 9)
    expect(nf3.bondsOnly).toBeCloseTo(0.94, 9)
    expect(nf3.bondsOnly).toBeGreaterThan(nh3.bondsOnly)
  })

  it('reverses the order once the lone pair is added, so NH3 is larger than NF3 as in Table 4.5', () => {
    const nh3 = lonePairComparison(labMolecule('NH3'))
    const nf3 = lonePairComparison(labMolecule('NF3'))
    expect(nh3.withLonePairs).toBeCloseTo(1.64, 9)
    expect(nf3.withLonePairs).toBeCloseTo(0.14, 9)
    expect(nh3.withLonePairs).toBeGreaterThan(nf3.withLonePairs)
  })

  it('keeps the printed order for water, ammonia and nitrogen trifluoride', () => {
    const h2o = lonePairComparison(labMolecule('H2O')).withLonePairs
    const nh3 = lonePairComparison(labMolecule('NH3')).withLonePairs
    const nf3 = lonePairComparison(labMolecule('NF3')).withLonePairs
    expect(h2o).toBeGreaterThan(nh3)
    expect(nh3).toBeGreaterThan(nf3)
  })
})
