import { describe, it, expect } from 'vitest'
import { planckRadiance } from '@/lib/chem/black-body'
import {
  CURVE_TEMPERATURES_K,
  PLOT_NM,
  clampBlackBodyStep,
  curveFractions,
  curvesForStep,
  peakLabelNm,
  plotFractionX,
  plotFractionY,
} from './black-body-steps'

describe('curvesForStep', () => {
  it('draws no curve on Step 0, one on Step 1 and all four from Step 2', () => {
    expect(curvesForStep(0)).toEqual([])
    expect(curvesForStep(1)).toEqual([3000])
    expect(curvesForStep(2)).toEqual([...CURVE_TEMPERATURES_K])
    expect(curvesForStep(3)).toEqual([...CURVE_TEMPERATURES_K])
  })
})

describe('plot mapping', () => {
  it('maps the ends of the wavelength window to 0 and 1', () => {
    expect(plotFractionX(PLOT_NM.min)).toBe(0)
    expect(plotFractionX(PLOT_NM.max)).toBe(1)
  })

  it('maps the radiance window on a log axis and clamps outside it', () => {
    expect(plotFractionY(1e10)).toBeCloseTo(0, 12)
    expect(plotFractionY(1e14)).toBeCloseTo(1, 12)
    expect(plotFractionY(1)).toBe(0)
    expect(plotFractionY(1e20)).toBe(1)
  })

  it('draws the curve from the Planck function, so each point matches planckRadiance', () => {
    const pts = curveFractions(4000)
    expect(pts.length).toBe(271)
    const index = 100
    const nm = PLOT_NM.min + 10 * index
    expect(pts[index].x).toBeCloseTo(plotFractionX(nm), 12)
    expect(pts[index].y).toBeCloseTo(plotFractionY(planckRadiance(nm * 1e-9, 4000)), 12)
  })
})

describe('peakLabelNm', () => {
  it('rounds the Planck peak to whole nanometres', () => {
    expect(peakLabelNm(3000)).toBe(967)
    expect(peakLabelNm(6000)).toBe(483)
  })
})

describe('clampBlackBodyStep', () => {
  it('keeps the step inside 0 to 3', () => {
    expect(clampBlackBodyStep(-1)).toBe(0)
    expect(clampBlackBodyStep(7)).toBe(3)
  })
})

describe('visible share of black-body radiation', () => {
  it('is about 11 % at 3000 K (under 15 %), so most of its radiation is not visible', () => {
    const share = (T: number) => sumRadiance(T, 380, 750) / sumRadiance(T, 100, 20000)
    expect(share(3000)).toBeLessThan(0.15)
    expect(share(3000)).toBeGreaterThan(0.1)
    expect(share(6000)).toBeGreaterThan(share(3000))
  })
})

function sumRadiance(T: number, fromNm: number, toNm: number): number {
  let sum = 0
  for (let nm = fromNm; nm <= toNm; nm += 1) sum += planckRadiance(nm * 1e-9, T)
  return sum
}
