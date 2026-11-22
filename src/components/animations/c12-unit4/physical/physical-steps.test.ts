import { describe, expect, it } from 'vitest'
import {
  HF_RADIUS_PM,
  TI_RADIUS_PM,
  ZR_RADIUS_PM,
  atomisation3d,
  atomisationApprox,
  density3dVtoZn,
  m3PlusRadius3d,
  meltingPointsC,
  metallicRadius3d,
  physicalViewForStep,
  unpaired3d,
} from './physical-steps'

const maxOf = (points: { y: number; symbol: string }[]) => points.reduce((a, b) => (b.y > a.y ? b : a))

describe('physicalViewForStep', () => {
  it('maps the six Steps in order and clamps out-of-range indices', () => {
    expect([0, 1, 2, 3, 4, 5].map(physicalViewForStep)).toEqual([
      'melting',
      'configs',
      'enthalpy',
      'radii3d',
      'sizes',
      'density',
    ])
    expect(physicalViewForStep(-1)).toBe('melting')
    expect(physicalViewForStep(9)).toBe('density')
  })
})

describe('melting points', () => {
  it('finds the middle maxima of each series', () => {
    expect(maxOf(meltingPointsC('3d'))).toMatchObject({ symbol: 'V', y: 1910 })
    expect(maxOf(meltingPointsC('4d'))).toMatchObject({ symbol: 'Mo', y: 2623 })
    expect(maxOf(meltingPointsC('5d'))).toMatchObject({ symbol: 'W', y: 3422 })
  })

  it('gives the low ends used in the prose, rounded to the nearest degree', () => {
    const at = (series: '3d' | '4d' | '5d', symbol: string) => meltingPointsC(series).find((p) => p.symbol === symbol)?.y
    expect(at('3d', 'Zn')).toBe(420)
    expect(at('4d', 'Cd')).toBe(321)
    expect(at('5d', 'Hg')).toBe(-39)
  })
})

describe('unpaired 3d electrons', () => {
  it('counts 1, 2, 3, 5, 5, 4, 3, 2, 0, 0 from Sc to Zn', () => {
    expect(unpaired3d().map((r) => r.unpaired)).toEqual([1, 2, 3, 5, 5, 4, 3, 2, 0, 0])
  })
})

describe('enthalpies of atomisation', () => {
  it('uses Table 4.2 for 3d: peak at V, dip at Mn, Zn lowest', () => {
    const pts = atomisation3d()
    expect(maxOf(pts)).toMatchObject({ symbol: 'V', y: 515 })
    expect(pts.find((p) => p.symbol === 'Mn')?.y).toBe(281)
    expect(pts.find((p) => p.symbol === 'Zn')?.y).toBe(126)
  })

  it('keeps 4d and 5d values as the approximate Fig. 4.2 readings', () => {
    expect(atomisationApprox('4d').find((p) => p.symbol === 'Nb')?.y).toBe(720)
    expect(atomisationApprox('5d').find((p) => p.symbol === 'W')?.y).toBe(845)
  })
})

describe('radii', () => {
  it('has M³⁺ radii for Sc to Ni only, and metallic radii for all ten 3d metals', () => {
    expect(m3PlusRadius3d().map((p) => p.symbol)).toEqual(['Sc', 'Ti', 'V', 'Cr', 'Mn', 'Fe', 'Co', 'Ni'])
    expect(metallicRadius3d()).toHaveLength(10)
    expect(metallicRadius3d().find((p) => p.symbol === 'Sc')?.y).toBe(164)
  })

  it('gives Ti 147, Zr 160 and Hf 159 pm, so Zr and Hf nearly coincide', () => {
    expect([TI_RADIUS_PM, ZR_RADIUS_PM, HF_RADIUS_PM]).toEqual([147, 160, 159])
  })
})

describe('density', () => {
  it('quotes V to Zn only, with Ni and Cu tied at 8.9', () => {
    const pts = density3dVtoZn()
    expect(pts.map((p) => p.symbol)).toEqual(['V', 'Cr', 'Mn', 'Fe', 'Co', 'Ni', 'Cu', 'Zn'])
    expect(pts.find((p) => p.symbol === 'Ni')?.y).toBe(8.9)
    expect(pts.find((p) => p.symbol === 'Cu')?.y).toBe(8.9)
    expect(pts.every((p) => p.y > 0)).toBe(true)
  })
})
