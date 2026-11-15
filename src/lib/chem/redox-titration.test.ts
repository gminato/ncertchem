import { describe, expect, it } from 'vitest'
import {
  REDOX_TITRATIONS,
  equivalenceVolume,
  titrationState,
  type RedoxTitrationType,
} from './redox-titration'

describe('redox-titration.ts', () => {
  describe('Stoichiometry definitions (NCERT Section 7.3.3)', () => {
    it('defines permanganate-Fe2+ stoichiometry as 1 : 5', () => {
      const entry = REDOX_TITRATIONS['permanganate-fe']
      expect(entry.titrant).toBe('MnO4-')
      expect(entry.analyte).toBe('Fe2+')
      expect(entry.titrantPerAnalyteRatio).toBeCloseTo(1 / 5, 5)
    })

    it('defines permanganate-oxalate stoichiometry as 2 : 5', () => {
      const entry = REDOX_TITRATIONS['permanganate-oxalate']
      expect(entry.titrant).toBe('MnO4-')
      expect(entry.analyte).toBe('C2O4^2-')
      expect(entry.titrantPerAnalyteRatio).toBeCloseTo(2 / 5, 5)
    })

    it('defines dichromate-Fe2+ stoichiometry as 1 : 6', () => {
      const entry = REDOX_TITRATIONS['dichromate-fe']
      expect(entry.titrant).toBe('Cr2O7^2-')
      expect(entry.analyte).toBe('Fe2+')
      expect(entry.titrantPerAnalyteRatio).toBeCloseTo(1 / 6, 5)
    })

    it('defines iodometric Cu2+ with thiosulphate stoichiometry as 1 : 1 net', () => {
      // 2Cu2+ + 4I- -> Cu2I2 + I2; I2 + 2S2O3^2- -> 2I- + S4O6^2-
      // Net ratio: 2 Cu2+ : 2 S2O3^2- => 1 : 1
      const entry = REDOX_TITRATIONS['iodometric-cu-thiosulphate']
      expect(entry.titrant).toBe('S2O3^2-')
      expect(entry.analyte).toBe('Cu2+')
      expect(entry.titrantPerAnalyteRatio).toBe(1)
    })
  })

  describe('equivalenceVolume', () => {
    it('calculates equivalence volume for permanganate-Fe2+ with round numbers', () => {
      // 25.0 mL of 0.1 M Fe2+ = 2.5 mmol Fe2+
      // Titrant: 0.02 M KMnO4
      // Ratio: 0.2 mol KMnO4 / mol Fe2+
      // KMnO4 required = 2.5 * 0.2 = 0.5 mmol
      // Volume = 0.5 mmol / 0.02 M = 25.0 mL
      const vEq = equivalenceVolume(0.02, 0.1, 25.0, 'permanganate-fe')
      expect(vEq).toBeCloseTo(25.0, 4)
    })

    it('calculates equivalence volume for permanganate-oxalate', () => {
      // 25.0 mL of 0.05 M oxalate = 1.25 mmol oxalate
      // Titrant: 0.02 M KMnO4
      // Ratio: 2 / 5 = 0.4
      // KMnO4 required = 1.25 * 0.4 = 0.5 mmol
      // Volume = 0.5 / 0.02 = 25.0 mL
      const vEq = equivalenceVolume(0.02, 0.05, 25.0, 'permanganate-oxalate')
      expect(vEq).toBeCloseTo(25.0, 4)
    })

    it('calculates equivalence volume for dichromate-Fe2+', () => {
      // 30.0 mL of 0.1 M Fe2+ = 3.0 mmol Fe2+
      // Titrant: 0.02 M K2Cr2O7
      // Ratio: 1 / 6
      // K2Cr2O7 required = 3.0 / 6 = 0.5 mmol
      // Volume = 0.5 / 0.02 = 25.0 mL
      const vEq = equivalenceVolume(0.02, 0.1, 30.0, 'dichromate-fe')
      expect(vEq).toBeCloseTo(25.0, 4)
    })

    it('calculates equivalence volume for iodometric Cu2+ with thiosulphate', () => {
      // 20.0 mL of 0.1 M Cu2+ = 2.0 mmol Cu2+
      // Titrant: 0.1 M S2O3^2-
      // Ratio: 1 : 1
      // Volume = 2.0 / 0.1 = 20.0 mL
      const vEq = equivalenceVolume(0.1, 0.1, 20.0, 'iodometric-cu-thiosulphate')
      expect(vEq).toBeCloseTo(20.0, 4)
    })

    it('accepts numerical ratio directly', () => {
      const vEq = equivalenceVolume(0.1, 0.1, 20.0, 0.5)
      expect(vEq).toBeCloseTo(10.0, 4)
    })

    it('throws RangeError on non-positive concentrations or volume', () => {
      expect(() => equivalenceVolume(0, 0.1, 25, 'permanganate-fe')).toThrow(RangeError)
      expect(() => equivalenceVolume(0.02, -0.1, 25, 'permanganate-fe')).toThrow(RangeError)
      expect(() => equivalenceVolume(0.02, 0.1, -5, 'permanganate-fe')).toThrow(RangeError)
    })
  })

  describe('titrationState', () => {
    describe('Permanganate self-indicator (colourless -> first lasting pink)', () => {
      const params = {
        titrantMolarity: 0.02,
        analyteMolarity: 0.1,
        analyteVolumeMl: 25.0,
        titrationType: 'permanganate-fe' as RedoxTitrationType,
      }

      it('before equivalence: remaining Fe2+, colourless indicator', () => {
        // Equivalence volume is 25.0 mL; added 12.5 mL (50%)
        const state = titrationState(12.5, params)
        expect(state.progressFraction).toBeCloseTo(0.5, 4)
        expect(state.isBeforeEquivalence).toBe(true)
        expect(state.isAtEquivalence).toBe(false)
        expect(state.remainingAnalyteMoles).toBeCloseTo(0.00125, 6) // 1.25 mmol
        expect(state.excessTitrantMoles).toBe(0)
        expect(state.indicatorColor).toBe('colourless')
      })

      it('at equivalence: zero Fe2+, first lasting pink indicator', () => {
        const state = titrationState(25.0, params)
        expect(state.progressFraction).toBeCloseTo(1.0, 4)
        expect(state.isAtEquivalence).toBe(true)
        expect(state.remainingAnalyteMoles).toBe(0)
        expect(state.excessTitrantMoles).toBe(0)
        expect(state.indicatorColor).toBe('first lasting pink')
      })

      it('past equivalence: zero Fe2+, excess MnO4-, pink color', () => {
        const state = titrationState(30.0, params)
        expect(state.progressFraction).toBeCloseTo(1.2, 4)
        expect(state.isPastEquivalence).toBe(true)
        expect(state.remainingAnalyteMoles).toBe(0)
        // 5 mL excess of 0.02 M = 0.1 mmol = 0.0001 mol
        expect(state.excessTitrantMoles).toBeCloseTo(0.0001, 6)
        expect(state.indicatorColor).toBe('first lasting pink')
      })
    })

    describe('Dichromate with diphenylamine indicator (green -> diphenylamine blue)', () => {
      const params = {
        titrantMolarity: 0.02,
        analyteMolarity: 0.1,
        analyteVolumeMl: 30.0,
        titrationType: 'dichromate-fe' as RedoxTitrationType,
      }

      it('before equivalence: nearly colourless at the start, then green as Cr3+ forms', () => {
        expect(titrationState(0, params).indicatorColor).toBe('nearly colourless')
        const state = titrationState(15.0, params)
        expect(state.isBeforeEquivalence).toBe(true)
        expect(state.indicatorColor).toBe('green')
      })

      it('at/past equivalence: diphenylamine blue', () => {
        const stateAt = titrationState(25.0, params)
        expect(stateAt.isAtEquivalence).toBe(true)
        expect(stateAt.indicatorColor).toBe('diphenylamine blue')

        const statePast = titrationState(26.0, params)
        expect(statePast.isPastEquivalence).toBe(true)
        expect(statePast.indicatorColor).toBe('diphenylamine blue')
      })
    })

    describe('Iodometric titration with starch indicator (starch blue -> colourless)', () => {
      const params = {
        titrantMolarity: 0.1,
        analyteMolarity: 0.1,
        analyteVolumeMl: 20.0,
        titrationType: 'iodometric-cu-thiosulphate' as RedoxTitrationType,
      }

      it('before equivalence: iodine brown first, starch blue once starch is added near the end', () => {
        expect(titrationState(0, params).indicatorColor).toBe('iodine brown')
        const state = titrationState(10.0, params)
        expect(state.isBeforeEquivalence).toBe(true)
        expect(state.indicatorColor).toBe('iodine brown')
        expect(titrationState(18.0, params).indicatorColor).toBe('starch blue')
      })

      it('at/past equivalence: colourless as starch blue disappears', () => {
        const stateAt = titrationState(20.0, params)
        expect(stateAt.isAtEquivalence).toBe(true)
        expect(stateAt.indicatorColor).toBe('colourless')

        const statePast = titrationState(22.0, params)
        expect(statePast.isPastEquivalence).toBe(true)
        expect(statePast.indicatorColor).toBe('colourless')
      })
    })

    describe('alternative calling signatures and validation', () => {
      it('supports calling with positional parameters (addedMl, eqVolume, type)', () => {
        const state = titrationState(10.0, 20.0, 'permanganate-fe', 0.002)
        expect(state.progressFraction).toBe(0.5)
        expect(state.remainingAnalyteMoles).toBeCloseTo(0.001, 5)
        expect(state.indicatorColor).toBe('colourless')
      })

      it('throws RangeError on negative added volume', () => {
        expect(() =>
          titrationState(-1, {
            titrantMolarity: 0.02,
            analyteMolarity: 0.1,
            analyteVolumeMl: 25.0,
            titrationType: 'permanganate-fe',
          }),
        ).toThrow(RangeError)
      })
    })
  })
})
