import { describe, expect, it } from 'vitest'
import {
  BRIDGE_SOURCE_VOLTS,
  COARSE_STEPS,
  CONDUCTIVITY_SOLUTIONS,
  NULL_LIMIT_VOLTS,
  RATIO_FACTOR,
  balanceSetting,
  coarseResistance,
  detectorVolts,
  measureCell,
  solutionById,
  variableResistance,
  type RatioId,
} from './conductivity-bridge'

const RATIOS: readonly RatioId[] = ['tenth', 'unity', 'ten']
const GEOMETRIES = [
  { gapCm: 0.5, areaCm2: 4 },
  { gapCm: 1, areaCm2: 1 },
  { gapCm: 3, areaCm2: 0.5 },
] as const

describe('Table 2.3 solutions', () => {
  it('takes the three KCl rows of Table 2.3', () => {
    expect(CONDUCTIVITY_SOLUTIONS.map((s) => s.molPerL)).toEqual([1, 0.1, 0.01])
    expect(solutionById('kcl-0.1').kappaScmInv).toBe(0.0129)
  })
})

describe('detector voltage', () => {
  it('is zero exactly when Rx / Rv = R4 / R3', () => {
    const rx = 77.5
    expect(detectorVolts(77.5, rx, 1)).toBeCloseTo(0, 12)
    expect(detectorVolts(7.75, rx, 10)).toBeCloseTo(0, 12)
    expect(detectorVolts(775, rx, 0.1)).toBeCloseTo(0, 12)
  })

  it('changes sign on either side of balance and is bounded by the source', () => {
    expect(detectorVolts(80, 77.5, 1)).toBeGreaterThan(0)
    expect(detectorVolts(75, 77.5, 1)).toBeLessThan(0)
    expect(Math.abs(detectorVolts(1e-9, 1e9, 1))).toBeLessThanOrEqual(BRIDGE_SOURCE_VOLTS)
  })
})

describe('reaching a true null by keyboard steps', () => {
  it('has a fine trim step small enough to balance every solution, geometry and ratio', () => {
    for (const solution of CONDUCTIVITY_SOLUTIONS) {
      for (const geometry of GEOMETRIES) {
        for (const ratio of RATIOS) {
          const rx = (geometry.gapCm / geometry.areaCm2) / solution.kappaScmInv
          const setting = balanceSetting(rx, RATIO_FACTOR[ratio])
          const m = measureCell({ solutionId: solution.id, ...geometry, ratio, ...setting })
          expect(m.isNull, `${solution.id} ${JSON.stringify(geometry)} ${ratio}`).toBe(true)
          expect(Math.abs(m.detectorVolts)).toBeLessThanOrEqual(NULL_LIMIT_VOLTS)
        }
      }
    }
  })
})

describe('readouts at balance recover the Table 2.3 conductivity', () => {
  it('gives κ and Λm within 0.05 % of Table 2.3 for each KCl solution', () => {
    for (const solution of CONDUCTIVITY_SOLUTIONS) {
      const geometry = { gapCm: 1, areaCm2: 1 }
      const rx = 1 / solution.kappaScmInv
      const setting = balanceSetting(rx, 1)
      const m = measureCell({ solutionId: solution.id, ...geometry, ratio: 'unity', ...setting })
      expect(m.kappaScmInv / solution.kappaScmInv).toBeCloseTo(1, 3)
      expect(m.lambdaScm2 / (solution.kappaScmInv * 1000 / solution.molPerL)).toBeCloseTo(1, 3)
      expect(m.kappaSmInv).toBeCloseTo(m.kappaScmInv * 100, 9)
      expect(m.lambdaSm2).toBeCloseTo(m.lambdaScm2 * 1e-4, 12)
    }
  })

  it('reproduces the 0.1 mol L⁻¹ KCl molar conductivity of 129.0 S cm² mol⁻¹ with G* = 1 cm⁻¹', () => {
    const rx = 1 / 0.0129
    const m = measureCell({ solutionId: 'kcl-0.1', gapCm: 1, areaCm2: 1, ratio: 'unity', ...balanceSetting(rx, 1) })
    expect(m.lambdaScm2).toBeCloseTo(129.0, 0)
  })
})

describe('bridge arithmetic', () => {
  it('spans the coarse range on a log scale and clamps the index', () => {
    expect(coarseResistance(0)).toBeCloseTo(0.1, 12)
    expect(coarseResistance(COARSE_STEPS)).toBeCloseTo(1e5, 6)
    expect(coarseResistance(-5)).toBeCloseTo(0.1, 12)
  })

  it('moves Rv by 0.01 % per fine step and clamps the trim to ±5 %', () => {
    const base = variableResistance(500, 0)
    expect(variableResistance(500, 1) / base).toBeCloseTo(1.0001, 12)
    expect(variableResistance(500, 10000) / base).toBeCloseTo(1.05, 12)
  })
})
