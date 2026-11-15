import { describe, expect, it } from 'vitest'
import { parseSmiles } from './molecule-parse'
import {
  CARBON_HYBRIDS,
  angleDeg,
  carbonCarbonBondsAt,
  carbonCarbonLengthPm,
  carbonHybrid,
  carbonIndices,
  ethyneScene,
  ethyleneScene,
  idealBondAngle,
  methaneScene,
  scenePosition,
  sCharacterPercent,
  type ShapeScene,
} from './carbon-shapes'

/** Every H–C–H or H–C–C angle at a given carbon in a scene. */
function anglesAt(scene: ShapeScene, centre: string): number[] {
  const partners = scene.bonds.flatMap((b) => (b.a === centre ? [b.b] : b.b === centre ? [b.a] : []))
  const c = scenePosition(scene, centre)
  const out: number[] = []
  for (let i = 0; i < partners.length; i++) {
    for (let j = i + 1; j < partners.length; j++) {
      out.push(angleDeg(scenePosition(scene, partners[i]), c, scenePosition(scene, partners[j])))
    }
  }
  return out
}

describe('ideal bond angles from the hybrid direction sets', () => {
  it('gives 109.5°, 120° and 180° for sp³, sp² and sp', () => {
    expect(idealBondAngle('sp3')).toBe(109.5)
    expect(idealBondAngle('sp2')).toBe(120)
    expect(idealBondAngle('sp')).toBe(180)
  })

  it('gives the s character 25%, 33.3% and 50%', () => {
    expect(sCharacterPercent('sp3')).toBeCloseTo(25, 6)
    expect(sCharacterPercent('sp2')).toBeCloseTo(100 / 3, 6)
    expect(sCharacterPercent('sp')).toBeCloseTo(50, 6)
  })

  it('lists the three hybrids in order of decreasing angle', () => {
    expect(CARBON_HYBRIDS.map(idealBondAngle)).toEqual([109.5, 120, 180])
  })
})

describe('C–C bond lengths by order', () => {
  it('gives 154, 134 and 120 pm from the Table 4.4 radii', () => {
    expect(carbonCarbonLengthPm(1)).toBe(154)
    expect(carbonCarbonLengthPm(2)).toBe(134)
    expect(carbonCarbonLengthPm(3)).toBe(120)
  })

  it('shortens as the bond order rises', () => {
    expect(carbonCarbonLengthPm(3)).toBeLessThan(carbonCarbonLengthPm(2))
    expect(carbonCarbonLengthPm(2)).toBeLessThan(carbonCarbonLengthPm(1))
  })
})

describe('carbon hybridisation and C–C bonds of a molecule', () => {
  it('labels the carbons of propene as sp², sp² and sp³', () => {
    const g = parseSmiles('C=CC')
    expect(carbonIndices(g).map((i) => carbonHybrid(g, i))).toEqual(['sp2', 'sp2', 'sp3'])
  })

  it('lists the C–C bonds at the nitrile carbon of acrylonitrile as one triple bond', () => {
    const g = parseSmiles('C=CC#N')
    const nitrileC = carbonIndices(g)[2]
    expect(carbonCarbonBondsAt(g, nitrileC)).toEqual([{ neighbour: 1, order: 1, lengthPm: 154 }])
  })

  it('gives the double bond of ethene as 134 pm at each carbon', () => {
    const g = parseSmiles('C=C')
    for (const i of carbonIndices(g)) {
      expect(carbonCarbonBondsAt(g, i)).toEqual([{ neighbour: i === 0 ? 1 : 0, order: 2, lengthPm: 134 }])
    }
  })
})

describe('scene geometries', () => {
  it('gives methane four equal H–C–H angles of 109.5°', () => {
    const angles = anglesAt(methaneScene(), 'C')
    expect(angles).toHaveLength(6)
    for (const a of angles) expect(a).toBeCloseTo(109.47, 1)
  })

  it('gives ethene H–C–H and H–C–C angles of 120° at each carbon', () => {
    const scene = ethyleneScene()
    for (const centre of ['C1', 'C2']) {
      const angles = anglesAt(scene, centre)
      for (const a of angles) expect(a).toBeCloseTo(120, 6)
    }
  })

  it('draws ethene with its C=C at 1.34 scene units (134 pm at 100 pm per unit)', () => {
    const scene = ethyleneScene()
    const c1 = scenePosition(scene, 'C1')
    const c2 = scenePosition(scene, 'C2')
    expect(Math.hypot(c2[0] - c1[0], c2[1] - c1[1], c2[2] - c1[2])).toBeCloseTo(1.34, 6)
  })

  it('draws ethyne linear, with H–C≡C angles of 180°', () => {
    const scene = ethyneScene()
    const c1 = scenePosition(scene, 'C1')
    const h1 = scenePosition(scene, 'H1')
    const c2 = scenePosition(scene, 'C2')
    expect(angleDeg(h1, c1, c2)).toBeCloseTo(180, 6)
    const cc = Math.hypot(c2[0] - c1[0], c2[1] - c1[1], c2[2] - c1[2])
    expect(cc).toBeCloseTo(1.2, 6)
  })
})
