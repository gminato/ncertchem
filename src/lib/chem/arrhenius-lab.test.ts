import { describe, expect, it } from 'vitest'
import { GAS_CONSTANT_J, arrheniusK } from './kinetics'
import { ARRHENIUS_K_REF, deriveArrhenius, drawnTailArea, lnKExtent } from './arrhenius-lab'

describe('deriveArrhenius', () => {
  const s = deriveArrhenius(298, 50.0)

  it('anchors k(298 K) at 3.00e-4 s⁻¹ and gives A = 1.74e5 s⁻¹', () => {
    expect(s.k).toBeCloseTo(ARRHENIUS_K_REF, 12)
    expect(s.A / 1e5).toBeCloseTo(1.744, 2)
  })

  it('gives the Prose ratio for a 10 K rise (1.93)', () => {
    expect(s.ratio).toBeCloseTo(1.926, 2)
    expect(s.kNext / s.k).toBeCloseTo(s.ratio, 9)
  })

  it('quotes the NCERT fraction e^(−Eₐ/RT) = 1.72e-9 at 298 K', () => {
    expect(s.fraction).toBeCloseTo(Math.exp(-50000 / (GAS_CONSTANT_J * 298)), 15)
    expect(s.fraction / 1e-9).toBeCloseTo(1.72, 2)
  })

  it('has the ln k line with slope −Eₐ/R and k matching the line at T', () => {
    expect(s.line.slope).toBeCloseTo(-50000 / GAS_CONSTANT_J, 6)
    expect(s.line.slope * s.invT + s.line.intercept).toBeCloseTo(s.lnK, 9)
    expect(s.line.intercept).toBeCloseTo(Math.log(s.A), 9)
  })

  it('matches arrheniusK at the same temperature', () => {
    expect(s.k).toBeCloseTo(arrheniusK(s.A, s.eaJ, 298), 15)
  })
})

describe('drawnTailArea', () => {
  it('is 0.15 at 298 K and grows with temperature', () => {
    expect(drawnTailArea(298, 50)).toBeCloseTo(0.15, 9)
    expect(drawnTailArea(308, 50)).toBeGreaterThan(drawnTailArea(298, 50))
    expect(drawnTailArea(318, 80)).toBeGreaterThan(drawnTailArea(308, 80))
    expect(drawnTailArea(340, 100)).toBeGreaterThan(drawnTailArea(330, 100))
  })

  it('stays within the drawing limits at the slider extremes', () => {
    for (const T of [280, 340]) {
      for (const Ea of [20, 100]) {
        const a = drawnTailArea(T, Ea)
        expect(a).toBeGreaterThanOrEqual(0.02)
        expect(a).toBeLessThanOrEqual(1.3)
      }
    }
  })
})

describe('lnKExtent', () => {
  it('contains the ln k point at every slider setting', () => {
    const { min, max } = lnKExtent()
    for (const T of [280, 298, 320, 340]) {
      for (const Ea of [20, 50, 80, 100]) {
        const lnK = deriveArrhenius(T, Ea).lnK
        expect(lnK).toBeGreaterThanOrEqual(min)
        expect(lnK).toBeLessThanOrEqual(max)
      }
    }
  })
})
