import { describe, expect, it } from 'vitest'
import {
  makeRational,
  rationalToString,
  rationalToNumber,
  oxidationNumbers,
  oxidationNumbersBySite,
  STRUCTURAL_OXIDATION_EXCEPTIONS,
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

  describe('Item 1: Sum rule check & Interhalogens', () => {
    it('solves HOF with O = 0, F = -1, H = +1 (sum = 0)', () => {
      const res = oxidationNumbers('HOF')
      expect(res.F).toEqual({ num: -1, den: 1 })
      expect(res.H).toEqual({ num: 1, den: 1 })
      expect(res.O).toEqual({ num: 0, den: 1 })
    })

    it('handles interhalogens where more electronegative halogen is -1 and the other is positive', () => {
      const resICl = oxidationNumbers('ICl')
      expect(resICl.Cl).toEqual({ num: -1, den: 1 })
      expect(resICl.I).toEqual({ num: 1, den: 1 })

      const resBrF3 = oxidationNumbers('BrF3')
      expect(resBrF3.F).toEqual({ num: -1, den: 1 })
      expect(resBrF3.Br).toEqual({ num: 3, den: 1 })

      const resIF7 = oxidationNumbers('IF7')
      expect(resIF7.F).toEqual({ num: -1, den: 1 })
      expect(resIF7.I).toEqual({ num: 7, den: 1 })

      const resClF3 = oxidationNumbers('ClF3')
      expect(resClF3.F).toEqual({ num: -1, den: 1 })
      expect(resClF3.Cl).toEqual({ num: 3, den: 1 })
    })
  })

  describe('Item 2: NH4NO3 average and by-site splitting', () => {
    it('returns average oxidation number +1 for N in NH4NO3', () => {
      const res = oxidationNumbers('NH4NO3')
      expect(res.N).toEqual({ num: 1, den: 1 })
      expect(res.H).toEqual({ num: 1, den: 1 })
      expect(res.O).toEqual({ num: -2, den: 1 })
    })

    it('splits NH4NO3 by site giving N -3 in NH4+ and N +5 in NO3-', () => {
      const bySite = oxidationNumbersBySite('NH4NO3')
      expect(bySite['NH4+'].N).toEqual({ num: -3, den: 1 })
      expect(bySite['NO3-'].N).toEqual({ num: 5, den: 1 })
    })

    it('splits other polyatomic salts by site', () => {
      const alum = oxidationNumbersBySite('KAl(SO4)2')
      expect(alum['SO4^2-'].S).toEqual({ num: 6, den: 1 })

      const feSO4 = oxidationNumbersBySite('FeSO4')
      expect(feSO4['Fe^2+'].Fe).toEqual({ num: 2, den: 1 })
      expect(feSO4['SO4^2-'].S).toEqual({ num: 6, den: 1 })

      const na2CO3 = oxidationNumbersBySite('Na2CO3')
      expect(na2CO3['CO3^2-'].C).toEqual({ num: 4, den: 1 })

      const kmno4 = oxidationNumbersBySite('KMnO4')
      expect(kmno4['MnO4^-'].Mn).toEqual({ num: 7, den: 1 })
    })
  })

  describe('Item 3: Cyanide complexes', () => {
    it('treats CN as cyanide group with C +2 and N -3', () => {
      const k4 = oxidationNumbers('K4[Fe(CN)6]')
      expect(k4.Fe).toEqual({ num: 2, den: 1 })
      expect(k4.K).toEqual({ num: 1, den: 1 })
      expect(k4.C).toEqual({ num: 2, den: 1 })
      expect(k4.N).toEqual({ num: -3, den: 1 })

      const k4plain = oxidationNumbers('K4Fe(CN)6')
      expect(k4plain.Fe).toEqual({ num: 2, den: 1 })

      const k3 = oxidationNumbers('K3[Fe(CN)6]')
      expect(k3.Fe).toEqual({ num: 3, den: 1 })

      const k3plain = oxidationNumbers('K3Fe(CN)6')
      expect(k3plain.Fe).toEqual({ num: 3, den: 1 })

      const ion4 = oxidationNumbers('[Fe(CN)6]', -4)
      expect(ion4.Fe).toEqual({ num: 2, den: 1 })

      const ion3 = oxidationNumbers('[Fe(CN)6]', -3)
      expect(ion3.Fe).toEqual({ num: 3, den: 1 })
    })
  })

  describe('Item 4: Structural exceptions table for peroxo species', () => {
    it('overrides averaging for H2SO5 giving S +6 and carries a note', () => {
      const res = oxidationNumbers('H2SO5')
      expect(res.S).toEqual({ num: 6, den: 1 })
      expect(STRUCTURAL_OXIDATION_EXCEPTIONS.H2SO5).toBeDefined()
      expect(STRUCTURAL_OXIDATION_EXCEPTIONS.H2SO5.note).toContain('peroxide')
    })

    it('overrides averaging for H2S2O8 and K2S2O8 giving S +6', () => {
      const resH = oxidationNumbers('H2S2O8')
      expect(resH.S).toEqual({ num: 6, den: 1 })

      const resK = oxidationNumbers('K2S2O8')
      expect(resK.S).toEqual({ num: 6, den: 1 })
    })

    it('overrides averaging for CrO5 giving Cr +6 and carries a note', () => {
      const res = oxidationNumbers('CrO5')
      expect(res.Cr).toEqual({ num: 6, den: 1 })
      expect(STRUCTURAL_OXIDATION_EXCEPTIONS.CrO5).toBeDefined()
      expect(STRUCTURAL_OXIDATION_EXCEPTIONS.CrO5.note).toContain('peroxo')
    })
  })
})

describe('explainOxidationNumber: oxygen exceptions are named correctly', () => {
  const ruleFor = (f: string, el?: string) => JSON.stringify(explainOxidationNumber(f, 0, el))
  it('names superoxide, peroxide and fluoride cases', () => {
    // When el is explicitly specified
    expect(ruleFor('KO2', 'K')).toContain('superoxides')
    expect(ruleFor('KO2', 'K')).not.toContain('in peroxides')
    expect(ruleFor('H2O2', 'H')).toContain('in peroxides')
    expect(ruleFor('OF2', 'F')).toContain('fluorine')
  })

  it('orders KO2 derivation with fixed Rule 2 alkali metal first and O as target checked by sum rule', () => {
    const exp = explainOxidationNumber('KO2', 0)
    expect(exp.targetElement).toBe('O')
    expect(exp.steps).toHaveLength(2)
    // Step 1: K fixed by Rule 2
    expect(exp.steps[0].element).toBe('K')
    expect(exp.steps[0].ruleApplied).toContain('Rule 2')
    expect(exp.steps[0].assignedValue).toEqual({ num: 1, den: 1 })
    // Step 2: O superoxide exception verified by sum rule check
    expect(exp.steps[1].element).toBe('O')
    expect(exp.steps[1].ruleApplied).toContain('superoxides')
    expect(exp.steps[1].ruleApplied).toContain('Rule 6')
    expect(exp.steps[1].equation).toBe('(+1) + 2 × x = 0')
    expect(exp.steps[1].assignedValue).toEqual({ num: -1, den: 2 })
  })
})
