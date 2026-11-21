import { describe, expect, it } from 'vitest'
import {
  SCUBA_AIR_COMPOSITION,
  SCUBA_HELIOX_COMPOSITION,
  dissolvedMillimolesPerLitreWater,
  diverPressureBar,
  henryMoleFraction,
  henryPartialPressureBar,
  interpolatedKhKbar,
} from './henry-law'
import type { HenryGas } from './henry-law'

describe('henry-law chemistry helpers', () => {
  describe('henryMoleFraction and henryPartialPressureBar', () => {
    it('reproduces the NCERT Example 1.4 order of magnitude for N2 at 293 K', () => {
      const x = henryMoleFraction(0.987, 76.48)
      expect(x).toBeCloseTo(1.2905e-5, 9)
      const mmol = dissolvedMillimolesPerLitreWater(x)
      expect(mmol).toBeCloseTo(0.716, 3)
    })

    it('inverts henryMoleFraction via henryPartialPressureBar', () => {
      const p = 2.4
      const kh = 34.86
      const x = henryMoleFraction(p, kh)
      expect(henryPartialPressureBar(x, kh)).toBeCloseTo(p, 10)
    })

    it('returns zero mole fraction at zero partial pressure', () => {
      expect(henryMoleFraction(0, 34.86)).toBe(0)
      expect(dissolvedMillimolesPerLitreWater(0)).toBe(0)
    })

    it('throws on invalid inputs', () => {
      expect(() => henryMoleFraction(-0.1, 34.86)).toThrow(RangeError)
      expect(() => henryMoleFraction(1, 0)).toThrow(RangeError)
      expect(() => henryPartialPressureBar(-0.01, 34.86)).toThrow(RangeError)
      expect(() => henryPartialPressureBar(1.1, 34.86)).toThrow(RangeError)
      expect(() => dissolvedMillimolesPerLitreWater(1)).toThrow(RangeError)
    })
  })

  describe('dissolvedMillimolesPerLitreWater', () => {
    it('matches exact n = (55.5 * x / (1 - x)) * 1000', () => {
      const x = 0.003
      const expected = ((55.5 * x) / (1 - x)) * 1000
      expect(dissolvedMillimolesPerLitreWater(x)).toBeCloseTo(expected, 10)
    })

    it('computes dissolved O2 at 1.50 bar and 293 K accurately', () => {
      const x = henryMoleFraction(1.5, 34.86)
      const mmol = dissolvedMillimolesPerLitreWater(x)
      expect(mmol).toBeCloseTo(2.39, 2)
    })
  })

  describe('interpolatedKhKbar', () => {
    it('matches every NCERT Table 1.2 anchor exactly', () => {
      expect(interpolatedKhKbar('O2', 293)).toBeCloseTo(34.86, 6)
      expect(interpolatedKhKbar('O2', 303)).toBeCloseTo(46.82, 6)
      expect(interpolatedKhKbar('N2', 293)).toBeCloseTo(76.48, 6)
      expect(interpolatedKhKbar('N2', 303)).toBeCloseTo(88.84, 6)
      expect(interpolatedKhKbar('CO2', 298)).toBeCloseTo(1.67, 6)
      expect(interpolatedKhKbar('He', 293)).toBeCloseTo(144.97, 6)
    })

    it('increases monotonically with temperature for all supported gases', () => {
      const gases: HenryGas[] = ['O2', 'N2', 'CO2', 'He']
      const temps = [283, 293, 298, 303, 313]
      for (const gas of gases) {
        for (let i = 1; i < temps.length; i += 1) {
          expect(interpolatedKhKbar(gas, temps[i])).toBeGreaterThan(
            interpolatedKhKbar(gas, temps[i - 1]),
          )
        }
      }
    })

    it('preserves NCERT solubility ordering CO2 > O2 > N2 > He at 293 K', () => {
      const khCO2 = interpolatedKhKbar('CO2', 293)
      const khO2 = interpolatedKhKbar('O2', 293)
      const khN2 = interpolatedKhKbar('N2', 293)
      const khHe = interpolatedKhKbar('He', 293)
      expect(khCO2).toBeLessThan(khO2)
      expect(khO2).toBeLessThan(khN2)
      expect(khN2).toBeLessThan(khHe)
    })

    it('throws for non-positive temperatures', () => {
      expect(() => interpolatedKhKbar('O2', 0)).toThrow(RangeError)
      expect(() => interpolatedKhKbar('N2', -10)).toThrow(RangeError)
    })
  })

  describe('diverPressureBar and scuba tank mixes', () => {
    it('computes P = 1 + depth / 10 bar', () => {
      expect(diverPressureBar(0)).toBe(1)
      expect(diverPressureBar(10)).toBe(2)
      expect(diverPressureBar(30)).toBe(4)
      expect(diverPressureBar(40)).toBe(5)
    })

    it('shows helium-diluted mix lowers dissolved N2 compared with compressed air at depth', () => {
      const totalP = diverPressureBar(30)
      const khN2 = interpolatedKhKbar('N2', 293)
      const xN2Air = henryMoleFraction(totalP * SCUBA_AIR_COMPOSITION.N2, khN2)
      const xN2Heliox = henryMoleFraction(totalP * SCUBA_HELIOX_COMPOSITION.N2, khN2)
      expect(xN2Heliox).toBeLessThan(xN2Air)
      expect(SCUBA_HELIOX_COMPOSITION.He + SCUBA_HELIOX_COMPOSITION.N2 + SCUBA_HELIOX_COMPOSITION.O2).toBeCloseTo(1, 5)
    })

    it('throws for negative depths', () => {
      expect(() => diverPressureBar(-5)).toThrow(RangeError)
    })
  })
})
