import { describe, expect, it } from 'vitest'
import {
  ISOTONIC_SALINE_MASS_PERCENT,
  barToKiloPascals,
  barToPascals,
  compareMacromoleculeColligative,
  compareTonicity,
  flowDirection,
  molarMassFromOsmosis,
  osmoticPressureBar,
} from './osmosis'

describe('osmosis chemistry helpers', () => {
  describe('osmoticPressureBar & unit conversions', () => {
    it('computes Π = C R T in bar using R = 0.08314 L bar K⁻¹ mol⁻¹', () => {
      const pi = osmoticPressureBar({ molarity: 0.2, tempK: 300 })
      expect(pi).toBeCloseTo(0.2 * 0.08314 * 300, 6)
      expect(pi).toBeCloseTo(4.9884, 4)
    })

    it('returns zero osmotic pressure for pure solvent (C = 0)', () => {
      expect(osmoticPressureBar({ molarity: 0, tempK: 298 })).toBe(0)
    })

    it('converts bar to pascals and kilopascals accurately', () => {
      expect(barToPascals(1)).toBe(100_000)
      expect(barToPascals(0.0025)).toBeCloseTo(250, 6)
      expect(barToKiloPascals(4.9884)).toBeCloseTo(498.84, 4)
    })

    it('rejects negative molarity or non-positive temperature', () => {
      expect(() => osmoticPressureBar({ molarity: -0.1, tempK: 298 })).toThrow(RangeError)
      expect(() => osmoticPressureBar({ molarity: 0.1, tempK: 0 })).toThrow(RangeError)
    })
  })

  describe('molarMassFromOsmosis', () => {
    it('recovers macromolecule molar mass from w₂, V, Π and T', () => {
      // 2.00 g enzyme in 0.250 L at 300 K producing 4.00 × 10⁻³ bar
      const m2 = molarMassFromOsmosis({
        w2G: 2.0,
        volumeL: 0.25,
        piBar: 4.0e-3,
        tempK: 300,
      })
      expect(m2).toBeCloseTo(49_884, 1)
    })

    it('is the exact inverse of osmoticPressureBar', () => {
      const w2G = 1.5
      const volumeL = 0.4
      const trueM = 75_000
      const tempK = 298
      const molarity = w2G / trueM / volumeL
      const piBar = osmoticPressureBar({ molarity, tempK })
      const recovered = molarMassFromOsmosis({ w2G, volumeL, piBar, tempK })
      expect(recovered).toBeCloseTo(trueM, 6)
    })

    it('throws for non-positive inputs', () => {
      expect(() =>
        molarMassFromOsmosis({ w2G: 0, volumeL: 0.2, piBar: 0.002, tempK: 300 }),
      ).toThrow(RangeError)
      expect(() =>
        molarMassFromOsmosis({ w2G: 1, volumeL: 0.2, piBar: 0, tempK: 300 }),
      ).toThrow(RangeError)
    })
  })

  describe('compareTonicity', () => {
    it('classifies 0.9% (w/v) NaCl as isotonic with steady blood cells', () => {
      const res = compareTonicity(ISOTONIC_SALINE_MASS_PERCENT)
      expect(res.tonicity).toBe('isotonic')
      expect(res.cellResponse).toBe('steady')
      expect(res.waterFlux).toBe('balanced')
    })

    it('classifies < 0.9% (w/v) NaCl as hypotonic causing cells to swell', () => {
      const res = compareTonicity(0.4)
      expect(res.tonicity).toBe('hypotonic')
      expect(res.cellResponse).toBe('swells')
      expect(res.waterFlux).toBe('into-cell')
    })

    it('classifies > 0.9% (w/v) NaCl as hypertonic causing cells to shrink', () => {
      const res = compareTonicity(1.8)
      expect(res.tonicity).toBe('hypertonic')
      expect(res.cellResponse).toBe('shrinks')
      expect(res.waterFlux).toBe('out-of-cell')
    })

    it('throws for negative NaCl percentage', () => {
      expect(() => compareTonicity(-0.2)).toThrow(RangeError)
    })
  })

  describe('flowDirection', () => {
    it('returns forward-osmosis when applied pressure is below Π', () => {
      expect(flowDirection({ appliedPressureBar: 2.0, osmoticPressureBar: 5.0 })).toBe(
        'forward-osmosis',
      )
    })

    it('returns equilibrium when applied pressure equals Π', () => {
      expect(flowDirection({ appliedPressureBar: 5.0, osmoticPressureBar: 5.0 })).toBe(
        'equilibrium',
      )
    })

    it('returns reverse-osmosis when applied pressure exceeds Π', () => {
      expect(flowDirection({ appliedPressureBar: 8.5, osmoticPressureBar: 5.0 })).toBe(
        'reverse-osmosis',
      )
    })

    it('respects a custom equilibrium tolerance for interactive controls', () => {
      expect(
        flowDirection({ appliedPressureBar: 5.04, osmoticPressureBar: 5.0, toleranceBar: 0.1 }),
      ).toBe('equilibrium')
    })
  })

  describe('compareMacromoleculeColligative', () => {
    it('shows measurable osmotic pressure while ΔT_b and ΔT_f are sub-millikelvin for a dilute protein', () => {
      const comp = compareMacromoleculeColligative({
        w2G: 1.5,
        molarMassGPerMol: 60_000,
        volumeL: 0.25,
        tempK: 298,
      })
      expect(comp.molarity).toBeCloseTo(1e-4, 8)
      expect(comp.osmoticPressurePa).toBeCloseTo(247.757, 1)
      expect(comp.waterColumnHeightCm).toBeGreaterThan(2.0)
      expect(comp.measurableByOsmosis).toBe(true)
      expect(comp.deltaTbK).toBeLessThan(1e-3)
      expect(comp.deltaTfK).toBeLessThan(1e-3)
      expect(comp.deltaTbSubMillikelvin).toBe(true)
      expect(comp.deltaTfSubMillikelvin).toBe(true)
    })
  })
})
