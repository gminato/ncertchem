import { describe, expect, it } from 'vitest'
import {
  parseReactionString,
  analyseRedox,
} from './redox-analysis'
import { NCERT_UNIT7_REACTIONS } from './ncert-unit7-tables'

describe('redox-analysis.ts', () => {
  describe('Reaction string parser', () => {
    it('parses neutral and ionic reaction strings', () => {
      const r1 = parseReactionString('2Mg(s) + O2(g) -> 2MgO(s)')
      expect(r1.reactants).toHaveLength(2)
      expect(r1.reactants[0]).toEqual({ formula: 'Mg', coefficient: 2, state: 's', charge: 0 })
      expect(r1.reactants[1]).toEqual({ formula: 'O2', coefficient: 1, state: 'g', charge: 0 })
      expect(r1.products[0]).toEqual({ formula: 'MgO', coefficient: 2, state: 's', charge: 0 })

      const r2 = parseReactionString('Zn(s) + Cu2+(aq) -> Zn2+(aq) + Cu(s)')
      expect(r2.reactants[1].charge).toBe(2)
      expect(r2.products[0].charge).toBe(2)
    })
  })

  describe('Problem 7.1', () => {
    it('(i) H2S(g) + Cl2(g) -> 2HCl(g) + S(s): H2S oxidised, Cl2 reduced', () => {
      const res = analyseRedox('H2S(g) + Cl2(g) -> 2HCl(g) + S(s)')
      expect(res.isRedox).toBe(true)
      expect(res.oxidisedElements).toEqual(['S'])
      expect(res.reducedElements).toEqual(['Cl'])
      expect(res.reductants).toContain('H2S')
      expect(res.oxidants).toContain('Cl2')
    })

    it('(ii) 3Fe3O4(s) + 8Al(s) -> 9Fe(s) + 4Al2O3(s): Al oxidised, Fe3O4 reduced', () => {
      const res = analyseRedox('3Fe3O4(s) + 8Al(s) -> 9Fe(s) + 4Al2O3(s)')
      expect(res.isRedox).toBe(true)
      expect(res.oxidisedElements).toEqual(['Al'])
      expect(res.reducedElements).toEqual(['Fe'])
      expect(res.reductants).toContain('Al')
      expect(res.oxidants).toContain('Fe3O4')
    })

    it('(iii) 2Na(s) + H2(g) -> 2NaH(s): Na oxidised, H2 reduced', () => {
      const res = analyseRedox('2Na(s) + H2(g) -> 2NaH(s)')
      expect(res.isRedox).toBe(true)
      expect(res.oxidisedElements).toEqual(['Na'])
      expect(res.reducedElements).toEqual(['H'])
      expect(res.reductants).toContain('Na')
      expect(res.oxidants).toContain('H2')
    })
  })

  describe('Problem 7.2', () => {
    it('justifies 2Na(s) + H2(g) -> 2NaH(s) as redox with element state changes', () => {
      const res = analyseRedox('2Na(s) + H2(g) -> 2NaH(s)')
      expect(res.reactantStates.Na).toEqual({ num: 0, den: 1 })
      expect(res.productStates.Na).toEqual({ num: 1, den: 1 })
      expect(res.reactantStates.H).toEqual({ num: 0, den: 1 })
      expect(res.productStates.H).toEqual({ num: -1, den: 1 })
    })
  })

  describe('Problem 7.4', () => {
    it('2Cu2O(s) + Cu2S(s) -> 6Cu(s) + SO2(g): Cu reduced, S oxidised, Cu2O oxidant, Cu2S reductant', () => {
      const res = analyseRedox('2Cu2O(s) + Cu2S(s) -> 6Cu(s) + SO2(g)')
      expect(res.isRedox).toBe(true)
      expect(res.oxidisedElements).toEqual(['S'])
      expect(res.reducedElements).toEqual(['Cu'])
      expect(res.oxidants).toContain('Cu2O')
      expect(res.reductants).toContain('Cu2S')
    })
  })

  describe('Problem 7.5 disproportionation', () => {
    it('identifies disproportionation for 3ClO-(aq) -> 2Cl-(aq) + ClO3-(aq)', () => {
      const res = analyseRedox('3ClO-(aq) -> 2Cl-(aq) + ClO3-(aq)')
      expect(res.isRedox).toBe(true)
      expect(res.type).toBe('disproportionation')
      expect(res.oxidisedElements).toEqual(['Cl'])
      expect(res.reducedElements).toEqual(['Cl'])
      expect(res.oxidants).toContain('ClO-')
      expect(res.reductants).toContain('ClO-')
    })
  })

  describe('Problem 7.6 classification scheme', () => {
    it('(a) N2(g) + O2(g) -> 2NO(g) is combination', () => {
      const res = analyseRedox('N2(g) + O2(g) -> 2NO(g)')
      expect(res.type).toBe('combination')
    })

    it('(b) 2Pb(NO3)2(s) -> 2PbO(s) + 4NO2(g) + O2(g) is decomposition', () => {
      const res = analyseRedox('2Pb(NO3)2(s) -> 2PbO(s) + 4NO2(g) + O2(g)')
      expect(res.type).toBe('decomposition')
    })

    it('(c) NaH(s) + H2O(l) -> NaOH(aq) + H2(g) is displacement (non-metal)', () => {
      const res = analyseRedox('NaH(s) + H2O(l) -> NaOH(aq) + H2(g)')
      expect(res.type).toBe('non-metal-displacement')
    })

    it('(d) 2NO2(g) + 2OH-(aq) -> NO2-(aq) + NO3-(aq) + H2O(l) is disproportionation', () => {
      const res = analyseRedox('2NO2(g) + 2OH-(aq) -> NO2-(aq) + NO3-(aq) + H2O(l)')
      expect(res.type).toBe('disproportionation')
    })
  })

  describe('Non-redox reactions', () => {
    it('classifies CaCO3 -> CaO + CO2 as not-redox', () => {
      const res = analyseRedox('CaCO3(s) -> CaO(s) + CO2(g)')
      expect(res.isRedox).toBe(false)
      expect(res.type).toBe('not-redox')
      expect(res.oxidants).toEqual([])
      expect(res.reductants).toEqual([])
    })
  })

  describe('All typed reactions in NCERT Unit 7 tables', () => {
    it('analyses every typed reaction from the tables file without throwing', () => {
      for (const rx of NCERT_UNIT7_REACTIONS) {
        if (rx.type === 'half-reaction') continue
        const res = analyseRedox(rx)
        expect(res).toBeDefined()
        if (rx.type === 'not-redox') {
          expect(res.isRedox).toBe(false)
        } else {
          expect(res.isRedox).toBe(true)
        }
      }
    })
  })
})
