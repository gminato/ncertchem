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
    expect(CONDUCTIVITY_SOLUTIONS.filter((s) => s.id.startsWith('kcl-')).map((s) => s.molPerL)).toEqual([1, 0.1, 0.01])
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
    expect(coarseResistance(COARSE_STEPS)).toBeCloseTo(1e6, 6)
    expect(coarseResistance(-5)).toBeCloseTo(0.1, 12)
  })

  it('moves Rv by 0.01 % per fine step and clamps the trim to ±5 %', () => {
    const base = variableResistance(500, 0)
    expect(variableResistance(500, 1) / base).toBeCloseTo(1.0001, 12)
    expect(variableResistance(500, 10000) / base).toBeCloseTo(1.05, 12)
  })
})

describe('aqueous solutions of Table 2.2', () => {
  it('offers KCl and the four aqueous electrolytes, each with a label and a molar concentration', () => {
    const ids = CONDUCTIVITY_SOLUTIONS.map((s) => s.id)
    expect(ids).toEqual(expect.arrayContaining(['kcl-0.1', 'aq-0.1-HCl', 'aq-0.01-NaCl', 'aq-0.1-HAc', 'aq-0.01-HAc']))
    expect(solutionById('aq-0.1-HCl').label).toBe('0.1 M HCl')
    expect(solutionById('aq-0.1-HCl').molPerL).toBe(0.1)
  })

  it('converts the tabulated S m⁻¹ values to S cm⁻¹ and derives Λm from κ and c', () => {
    expect(solutionById('aq-0.1-HCl').kappaScmInv).toBeCloseTo(0.0391, 9)
    expect(solutionById('aq-0.01-NaCl').kappaScmInv).toBeCloseTo(0.0012, 9)
    for (const [id, expected] of [['aq-0.1-HCl', 391], ['aq-0.01-NaCl', 120]] as const) {
      const rx = 1 / solutionById(id).kappaScmInv
      const setting = balanceSetting(rx, 1)
      const m = measureCell({ solutionId: id, gapCm: 1, areaCm2: 1, ratio: 'unity', index: setting.index, trim: setting.trim })
      expect(m.isNull).toBe(true)
      expect(m.lambdaScm2).toBeCloseTo(expected, 0)
    }
  })
})
