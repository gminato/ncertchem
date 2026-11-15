import { describe, expect, it } from 'vitest'
import {
  makeRational,
  rationalToString,
  rationalToNumber,
  oxidationNumbers,
  stockName,
  explainOxidationNumber,
} from './oxidation-number'

describe('oxidation-number.ts', () => {
  describe('Rational arithmetic', () => {
    it('creates reduced rational numbers', () => {
      expect(makeRational(8, 3)).toEqual({ num: 8, den: 3 })
      expect(makeRational(10, 4)).toEqual({ num: 5, den: 2 })
      expect(makeRational(-2, 4)).toEqual({ num: -1, den: 2 })
      expect(makeRational(6, 1)).toEqual({ num: 6, den: 1 })
      expect(makeRational(0, 5)).toEqual({ num: 0, den: 1 })
    })

    it('formats rationals as strings and numbers', () => {
      expect(rationalToString(makeRational(8, 3))).toBe('+8/3')
      expect(rationalToString(makeRational(5, 2))).toBe('+5/2')
      expect(rationalToString(makeRational(-1, 2))).toBe('-1/2')
      expect(rationalToString(makeRational(6, 1))).toBe('+6')
      expect(rationalToString(makeRational(-2, 1))).toBe('-2')
      expect(rationalToString(makeRational(0, 1))).toBe('0')

      expect(rationalToNumber(makeRational(8, 3))).toBeCloseTo(2.6667, 4)
      expect(rationalToNumber(makeRational(5, 2))).toBe(2.5)
    })
  })

  describe('Free elements & Monatomic ions', () => {
    it('assigns 0 to free uncombined elements', () => {
      for (const formula of ['H2', 'O2', 'O3', 'P4', 'S8', 'Na', 'Mg', 'Al', 'Fe', 'Cl2']) {
        const res = oxidationNumbers(formula, 0)
        const symbol = Object.keys(res)[0]
        expect(res[symbol]).toEqual({ num: 0, den: 1 })
      }
    })

    it('assigns charge to monatomic ions', () => {
      expect(oxidationNumbers('Na', 1)).toEqual({ Na: { num: 1, den: 1 } })
      expect(oxidationNumbers('Mg', 2)).toEqual({ Mg: { num: 2, den: 1 } })
      expect(oxidationNumbers('Fe', 3)).toEqual({ Fe: { num: 3, den: 1 } })
      expect(oxidationNumbers('Cl', -1)).toEqual({ Cl: { num: -1, den: 1 } })
      expect(oxidationNumbers('O', -2)).toEqual({ O: { num: -2, den: 1 } })
    })
  })

  describe('Exercise 7.1 species', () => {
    it('(a) NaH2PO4: P is +5', () => {
      const res = oxidationNumbers('NaH2PO4')
      expect(res.Na).toEqual({ num: 1, den: 1 })
      expect(res.H).toEqual({ num: 1, den: 1 })
      expect(res.O).toEqual({ num: -2, den: 1 })
      expect(res.P).toEqual({ num: 5, den: 1 })
    })

    it('(b) NaHSO4: S is +6', () => {
      const res = oxidationNumbers('NaHSO4')
      expect(res.S).toEqual({ num: 6, den: 1 })
    })

    it('(c) H4P2O7: P is +5', () => {
      const res = oxidationNumbers('H4P2O7')
      expect(res.P).toEqual({ num: 5, den: 1 })
    })

    it('(d) K2MnO4: Mn is +6', () => {
      const res = oxidationNumbers('K2MnO4')
      expect(res.Mn).toEqual({ num: 6, den: 1 })
    })

    it('(e) CaO2: O is -1 (peroxide)', () => {
      const res = oxidationNumbers('CaO2')
      expect(res.Ca).toEqual({ num: 2, den: 1 })
      expect(res.O).toEqual({ num: -1, den: 1 })
    })

    it('(f) NaBH4: B is +3 and H is -1', () => {
      const res = oxidationNumbers('NaBH4')
      expect(res.Na).toEqual({ num: 1, den: 1 })
      expect(res.H).toEqual({ num: -1, den: 1 })
      expect(res.B).toEqual({ num: 3, den: 1 })
    })

    it('(g) H2S2O7: S is +6', () => {
      const res = oxidationNumbers('H2S2O7')
      expect(res.S).toEqual({ num: 6, den: 1 })
    })

    it('(h) KAl(SO4)2·12H2O (alum): S is +6', () => {
      const res = oxidationNumbers('KAl(SO4)2·12H2O')
      expect(res.K).toEqual({ num: 1, den: 1 })
      expect(res.Al).toEqual({ num: 3, den: 1 })
      expect(res.H).toEqual({ num: 1, den: 1 })
      expect(res.O).toEqual({ num: -2, den: 1 })
      expect(res.S).toEqual({ num: 6, den: 1 })
    })
  })

  describe('Exercise 7.2 fractional & organic species', () => {
    it('(a) KI3: I is -1/3 (average)', () => {
      const res = oxidationNumbers('KI3')
      expect(res.K).toEqual({ num: 1, den: 1 })
      expect(res.I).toEqual({ num: -1, den: 3 })
    })

    it('(b) H2S4O6: S is 5/2 (2.5 average)', () => {
      const res = oxidationNumbers('H2S4O6')
      expect(res.S).toEqual({ num: 5, den: 2 })
    })

    it('(c) Fe3O4: Fe is 8/3 (average)', () => {
      const res = oxidationNumbers('Fe3O4')
      expect(res.Fe).toEqual({ num: 8, den: 3 })
    })

    it('(d) CH3CH2OH: C is -2 (average)', () => {
      const res = oxidationNumbers('CH3CH2OH')
      expect(res.C).toEqual({ num: -2, den: 1 })
    })

    it('(e) CH3COOH: C is 0 (average)', () => {
      const res = oxidationNumbers('CH3COOH')
      expect(res.C).toEqual({ num: 0, den: 1 })
    })
  })

  describe('Common oxoanions and ions', () => {
    it('calculates Cr2O7^2- (Cr is +6)', () => {
      const res = oxidationNumbers('Cr2O7', -2)
      expect(res.Cr).toEqual({ num: 6, den: 1 })
    })

    it('calculates MnO4^- (Mn is +7)', () => {
      const res = oxidationNumbers('MnO4', -1)
      expect(res.Mn).toEqual({ num: 7, den: 1 })
    })

    it('calculates S2O3^2- (S is +2)', () => {
      const res = oxidationNumbers('S2O3', -2)
      expect(res.S).toEqual({ num: 2, den: 1 })
    })
  })

  describe('Period-3 table and fractional cases', () => {
    it('matches Period-3 table highest oxidation numbers', () => {
      expect(oxidationNumbers('NaCl').Na).toEqual({ num: 1, den: 1 })
      expect(oxidationNumbers('MgSO4').Mg).toEqual({ num: 2, den: 1 })
      expect(oxidationNumbers('AlF3').Al).toEqual({ num: 3, den: 1 })
      expect(oxidationNumbers('SiCl4').Si).toEqual({ num: 4, den: 1 })
      expect(oxidationNumbers('P4O10').P).toEqual({ num: 5, den: 1 })
      expect(oxidationNumbers('SF6').S).toEqual({ num: 6, den: 1 })
      expect(oxidationNumbers('HClO4').Cl).toEqual({ num: 7, den: 1 })
    })

    it('matches fractional cases C3O2 (4/3) and Br3O8 (16/3)', () => {
      expect(oxidationNumbers('C3O2').C).toEqual({ num: 4, den: 3 })
      expect(oxidationNumbers('Br3O8').Br).toEqual({ num: 16, den: 3 })
    })
  })

  describe('Oxygen special cases', () => {
    it('assigns +2 in OF2 and +1 in O2F2', () => {
      expect(oxidationNumbers('OF2').O).toEqual({ num: 2, den: 1 })
      expect(oxidationNumbers('O2F2').O).toEqual({ num: 1, den: 1 })
    })

    it('assigns -1 in peroxides H2O2, Na2O2, BaO2', () => {
      expect(oxidationNumbers('H2O2').O).toEqual({ num: -1, den: 1 })
      expect(oxidationNumbers('Na2O2').O).toEqual({ num: -1, den: 1 })
      expect(oxidationNumbers('BaO2').O).toEqual({ num: -1, den: 1 })
    })

    it('assigns -1/2 in superoxides KO2, RbO2', () => {
      expect(oxidationNumbers('KO2').O).toEqual({ num: -1, den: 2 })
      expect(oxidationNumbers('RbO2').O).toEqual({ num: -1, den: 2 })
    })
  })

  describe('Stock notation for Problem 7.3', () => {
    it('formats Problem 7.3 compounds correctly', () => {
      expect(stockName('HAuCl4')).toBe('HAu(III)Cl4')
      expect(stockName('Tl2O')).toBe('Tl2(I)O')
      expect(stockName('FeO')).toBe('Fe(II)O')
      expect(stockName('Fe2O3')).toBe('Fe2(III)O3')
      expect(stockName('CuI')).toBe('Cu(I)I')
      expect(stockName('CuO')).toBe('Cu(II)O')
      expect(stockName('MnO')).toBe('Mn(II)O')
      expect(stockName('MnO2')).toBe('Mn(IV)O2')
    })
  })

  describe('Step-by-step explanation', () => {
    it('produces an explanation for NaH2PO4 solving for P', () => {
      const expl = explainOxidationNumber('NaH2PO4', 0, 'P')
      expect(expl.formula).toBe('NaH2PO4')
      expect(expl.targetElement).toBe('P')
      expect(expl.finalOxidationNumber).toEqual({ num: 5, den: 1 })
      expect(expl.steps.length).toBeGreaterThanOrEqual(3)
      expect(expl.steps.some((s) => s.ruleApplied.includes('Alkali'))).toBe(true)
      expect(expl.steps.some((s) => s.ruleApplied.includes('Sum rule'))).toBe(true)
    })
  })

  describe('Error handling', () => {
    it('throws RangeError on empty or invalid formula', () => {
      expect(() => oxidationNumbers('')).toThrow(RangeError)
    })

    it('throws RangeError when more than one element is undetermined', () => {
      expect(() => oxidationNumbers('FeCr2O4')).toThrow(RangeError)
      expect(() => oxidationNumbers('FeCr2O4')).toThrow(/undetermined/)
    })
  })
})
