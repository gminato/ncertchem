import { describe, expect, it } from 'vitest'
import {
  boilingPointElevation,
  computeThermalColligativeState,
  freezingPointDepression,
  getSolventConstant,
  kbFromEnthalpy,
  kfFromEnthalpy,
  molarMassFromBoiling,
  molarMassFromFreezing,
  molarMassFromRlVp,
  NON_ELECTROLYTE_SOLUTES,
  relativeLoweringVapourPressure,
} from './colligative-thermal'

describe('colligative-thermal chemistry helpers', () => {
  describe('relativeLoweringVapourPressure', () => {
    it('computes exact x2 and dilute n2/n1 approximation', () => {
      const res = relativeLoweringVapourPressure({ nSolute: 0.5, nSolvent: 55.51 })
      expect(res.exact).toBeCloseTo(0.5 / 56.01, 6)
      expect(res.diluteApproximation).toBeCloseTo(0.5 / 55.51, 6)
      expect(res.solventMoleFraction).toBeCloseTo(1 - res.exact, 10)
      expect(res.diluteApproximation).toBeGreaterThan(res.exact)
    })

    it('returns zero lowering when nSolute is zero', () => {
      const res = relativeLoweringVapourPressure({ nSolute: 0, nSolvent: 10 })
      expect(res.exact).toBe(0)
      expect(res.diluteApproximation).toBe(0)
      expect(res.solventMoleFraction).toBe(1)
    })

    it('throws for invalid mole counts', () => {
      expect(() => relativeLoweringVapourPressure({ nSolute: -0.1, nSolvent: 10 })).toThrow()
      expect(() => relativeLoweringVapourPressure({ nSolute: 0.1, nSolvent: 0 })).toThrow()
    })
  })

  describe('molarMassFromRlVp', () => {
    it('reproduces molar mass from relative vapour-pressure lowering', () => {
      // 0.50 g solute in 39.0 g benzene (M1 = 78) lowers p from 0.850 to 0.845 bar -> 170 g mol⁻¹
      const m2 = molarMassFromRlVp({
        w2G: 0.5,
        w1G: 39.0,
        m1GPerMol: 78,
        p1Zero: 0.85,
        pSolution: 0.845,
      })
      expect(m2).toBeCloseTo(170, 6)
    })

    it('rejects solution vapour pressure greater than or equal to pure solvent', () => {
      expect(() =>
        molarMassFromRlVp({
          w2G: 1,
          w1G: 100,
          m1GPerMol: 18,
          p1Zero: 0.5,
          pSolution: 0.5,
        })
      ).toThrow()
    })
  })

  describe('boilingPointElevation and molarMassFromBoiling', () => {
    it('computes ΔTb = Kb * m for water and ethanol', () => {
      const water = getSolventConstant('water')
      expect(boilingPointElevation({ kb: water.kb, molality: 0.25 })).toBeCloseTo(0.13, 6)
      expect(boilingPointElevation({ kb: water.kb, molality: 0 })).toBe(0)
    })

    it('recovers molar mass from boiling-point elevation', () => {
      const ethanol = getSolventConstant('ethanol')
      // 4.50 g solute in 150 g ethanol (Kb = 1.20) with ΔTb = 0.30 K -> M2 = 120 g mol⁻¹
      const m2 = molarMassFromBoiling({
        kb: ethanol.kb,
        w2G: 4.5,
        w1G: 150,
        deltaTb: 0.3,
      })
      expect(m2).toBeCloseTo(120, 6)
    })
  })

  describe('freezingPointDepression and molarMassFromFreezing', () => {
    it('computes ΔTf = Kf * m for water and cyclohexane', () => {
      const water = getSolventConstant('water')
      const cyclohexane = getSolventConstant('cyclohexane')
      expect(freezingPointDepression({ kf: water.kf, molality: 2.0 })).toBeCloseTo(3.72, 6)
      expect(freezingPointDepression({ kf: cyclohexane.kf, molality: 0.5 })).toBeCloseTo(10.0, 6)
    })

    it('recovers molar mass from freezing-point depression', () => {
      const benzene = getSolventConstant('benzene')
      // 2.00 g solute in 100 g benzene (Kf = 5.12) with ΔTf = 0.64 K -> M2 = 160 g mol⁻¹
      const m2 = molarMassFromFreezing({
        kf: benzene.kf,
        w2G: 2.0,
        w1G: 100,
        deltaTf: 0.64,
      })
      expect(m2).toBeCloseTo(160, 6)
    })
  })

  describe('kbFromEnthalpy and kfFromEnthalpy', () => {
    it('matches water Kb (~0.513) and Kf (~1.86) from enthalpies of vaporisation and fusion', () => {
      const kbWater = kbFromEnthalpy({
        molarMassGPerMol: 18.015,
        tbK: 373.15,
        deltaHvapJPerMol: 40657,
      })
      const kfWater = kfFromEnthalpy({
        molarMassGPerMol: 18.015,
        tfK: 273.15,
        deltaHfusJPerMol: 6008,
      })
      expect(kbWater).toBeCloseTo(0.513, 2)
      expect(kfWater).toBeCloseTo(1.86, 2)
    })

    it('matches benzene Kf (~5.12) from enthalpy of fusion (~9870 J mol⁻¹)', () => {
      const kfBenzene = kfFromEnthalpy({
        molarMassGPerMol: 78.11,
        tfK: 278.6,
        deltaHfusJPerMol: 9870,
      })
      expect(kfBenzene).toBeCloseTo(5.1, 1)
    })
  })

  describe('computeThermalColligativeState', () => {
    it('gives identical Δp1/p1⁰, ΔTb and ΔTf for different non-electrolytes at equal molality', () => {
      const water = getSolventConstant('water')
      const glucose = NON_ELECTROLYTE_SOLUTES.find((s) => s.id === 'glucose')!
      const urea = NON_ELECTROLYTE_SOLUTES.find((s) => s.id === 'urea')!

      const stateGlucose = computeThermalColligativeState(water, glucose, 1.5)
      const stateUrea = computeThermalColligativeState(water, urea, 1.5)

      expect(stateGlucose.rlvpExact).toBeCloseTo(stateUrea.rlvpExact, 10)
      expect(stateGlucose.deltaTb).toBeCloseTo(stateUrea.deltaTb, 10)
      expect(stateGlucose.deltaTf).toBeCloseTo(stateUrea.deltaTf, 10)
      expect(stateGlucose.solutionLiquidRangeK).toBeGreaterThan(stateGlucose.pureLiquidRangeK)
      // Only the required mass per kg solvent differs (glucose ~3x heavier than urea)
      expect(stateGlucose.soluteMassGPerKgSolvent).toBeCloseTo(1.5 * 180.16, 4)
      expect(stateUrea.soluteMassGPerKgSolvent).toBeCloseTo(1.5 * 60.06, 4)
    })
  })
})
