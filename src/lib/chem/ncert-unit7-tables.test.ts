import { describe, expect, it } from 'vitest'
import {
  NCERT_TABLE_7_1_ELECTRODE_POTENTIALS,
  NCERT_PERIOD_3_HIGHEST_OXIDATION_STATES,
  NCERT_FRACTIONAL_OXIDATION_SPECIES,
  NCERT_PROBLEM_7_3_STOCK_NOTATION,
  NCERT_UNIT7_REACTIONS,
  NCERT_UNIT7_PROBLEMS,
  NCERT_UNIT7_ERRATA,
} from './ncert-unit7-tables'

describe('NCERT Unit 7 Tables & Reference Data', () => {
  describe('Table 7.1 Standard Electrode Potentials at 298 K', () => {
    it('contains all 34 redox couples in exact printed order from F2 to Li+', () => {
      const { rows } = NCERT_TABLE_7_1_ELECTRODE_POTENTIALS
      expect(rows).toHaveLength(34)
      expect(rows[0].oxidised).toContain('F2')
      expect(rows[0].e0).toBe(2.87)
      expect(rows[rows.length - 1].oxidised).toContain('Li+')
      expect(rows[rows.length - 1].e0).toBe(-3.05)
    })

    it('contains hydrogen standard electrode as 0.00 V', () => {
      const hCouple = NCERT_TABLE_7_1_ELECTRODE_POTENTIALS.rows.find((r) => r.oxidised === '2H+' && r.reduced === 'H2(g)')
      expect(hCouple).toBeDefined()
      expect(hCouple?.e0).toBe(0.0)
    })

    it('contains verified transition metal and halogen values', () => {
      const map = new Map(NCERT_TABLE_7_1_ELECTRODE_POTENTIALS.rows.map((r) => [r.oxidised, r.e0]))
      expect(map.get('Co3+')).toBe(1.81)
      expect(map.get('Au3+')).toBe(1.40)
      expect(map.get('Cl2(g)')).toBe(1.36)
      expect(map.get('Cr2O72- + 14H+')).toBe(1.33)
      expect(map.get('Fe3+')).toBe(0.77)
      expect(map.get('Cu2+')).toBe(0.34)
      expect(map.get('Zn2+')).toBe(-0.76)
      expect(map.get('Al3+')).toBe(-1.66)
    })

    it('has valid mhchem half-equations for all entries', () => {
      for (const row of NCERT_TABLE_7_1_ELECTRODE_POTENTIALS.rows) {
        expect(row.halfEquation).toContain('->')
        expect(row.electrons).toBeGreaterThanOrEqual(1)
        expect(row.electrons).toBeLessThanOrEqual(6)
      }
    })
  })

  describe('Period 3 Highest Oxidation State Table', () => {
    it('contains groups 1, 2, 13, 14, 15, 16, 17 with states +1 to +7', () => {
      const { rows } = NCERT_PERIOD_3_HIGHEST_OXIDATION_STATES
      expect(rows).toHaveLength(7)
      const states = rows.map((r) => r.highestOxidationState)
      expect(states).toEqual([1, 2, 3, 4, 5, 6, 7])
    })

    it('records both printed HClO and correct HClO4 for group 17', () => {
      const clRow = NCERT_PERIOD_3_HIGHEST_OXIDATION_STATES.rows.find((r) => r.group === 17)
      expect(clRow).toBeDefined()
      expect(clRow?.element).toBe('Cl')
      expect(clRow?.compoundPrinted).toBe('HClO')
      expect(clRow?.compoundCorrect).toBe('HClO4')
      expect(clRow?.highestOxidationState).toBe(7)
    })
  })

  describe('Fractional Oxidation Species', () => {
    it('encodes C3O2, Br3O8, and S4O6^2- with structural states and fractional averages', () => {
      const c3o2 = NCERT_FRACTIONAL_OXIDATION_SPECIES.find((s) => s.formula === 'C3O2')
      expect(c3o2).toBeDefined()
      expect(c3o2?.average).toEqual({ num: 4, den: 3 })
      expect(c3o2?.individualStates).toEqual([2, 0, 2])

      const br3o8 = NCERT_FRACTIONAL_OXIDATION_SPECIES.find((s) => s.formula === 'Br3O8')
      expect(br3o8).toBeDefined()
      expect(br3o8?.average).toEqual({ num: 16, den: 3 })
      expect(br3o8?.individualStates).toEqual([6, 4, 6])

      const s4o6 = NCERT_FRACTIONAL_OXIDATION_SPECIES.find((s) => s.formula === 'S4O6^2-')
      expect(s4o6).toBeDefined()
      expect(s4o6?.average).toEqual({ num: 5, den: 2 })
      expect(s4o6?.individualStates).toEqual([5, 0, 0, 5])
    })

    it('encodes mixed oxides Fe3O4, Mn3O4, and Pb3O4', () => {
      const pb3o4 = NCERT_FRACTIONAL_OXIDATION_SPECIES.find((s) => s.formula === 'Pb3O4')
      expect(pb3o4).toBeDefined()
      expect(pb3o4?.stoichiometricComponents).toContain('2PbO·PbO2')
      expect(pb3o4?.average).toEqual({ num: 8, den: 3 })
    })
  })

  describe('Problem 7.3 Stock Notation Answers', () => {
    it('contains all 8 compounds from Problem 7.3', () => {
      expect(NCERT_PROBLEM_7_3_STOCK_NOTATION).toHaveLength(8)
      const ha = NCERT_PROBLEM_7_3_STOCK_NOTATION.find((c) => c.formula === 'HAuCl4')
      expect(ha?.stockRepresentation).toBe('HAu(III)Cl4')
      expect(ha?.metalOxidationState).toBe(3)

      const tl = NCERT_PROBLEM_7_3_STOCK_NOTATION.find((c) => c.formula === 'Tl2O')
      expect(tl?.stockRepresentation).toBe('Tl2(I)O')
      expect(tl?.metalOxidationState).toBe(1)
    })
  })

  describe('Numbered Reactions 7.1–7.60', () => {
    it('encodes key numbered reactions with species and NCERT type tag', () => {
      expect(NCERT_UNIT7_REACTIONS.length).toBeGreaterThanOrEqual(60)

      const r71 = NCERT_UNIT7_REACTIONS.find((r) => r.id === '7.1')
      expect(r71?.type).toBe('combination')

      const r726 = NCERT_UNIT7_REACTIONS.find((r) => r.id === '7.26')
      expect(r726?.type).toBe('decomposition')

      const r729 = NCERT_UNIT7_REACTIONS.find((r) => r.id === '7.29')
      expect(r729?.type).toBe('metal-displacement')

      const r733 = NCERT_UNIT7_REACTIONS.find((r) => r.id === '7.33')
      expect(r733?.type).toBe('non-metal-displacement')

      const r745 = NCERT_UNIT7_REACTIONS.find((r) => r.id === '7.45')
      expect(r745?.type).toBe('disproportionation')

      const r758 = NCERT_UNIT7_REACTIONS.find((r) => r.id === '7.58')
      expect(r758?.type).toBe('redox')
    })
  })

  describe('Problems 7.1–7.10', () => {
    it('encodes all 10 problems with questions, answers, and kech201.txt lines', () => {
      expect(NCERT_UNIT7_PROBLEMS).toHaveLength(10)
      for (const p of NCERT_UNIT7_PROBLEMS) {
        expect(p.problemNumber).toBeGreaterThanOrEqual(1)
        expect(p.problemNumber).toBeLessThanOrEqual(10)
        expect(p.lineInKech201).toBeGreaterThan(0)
        expect(p.summary.length).toBeGreaterThan(0)
      }
    })
  })

  describe('NCERT Unit 7 Errata', () => {
    it('contains documented textbook errors', () => {
      expect(NCERT_UNIT7_ERRATA.length).toBeGreaterThanOrEqual(6)

      const steamErrata = NCERT_UNIT7_ERRATA.find((e) => e.where.includes('7.35') || e.where.includes('7.36'))
      expect(steamErrata).toBeDefined()

      const h2Solid = NCERT_UNIT7_ERRATA.find((e) => e.where.includes('7.19'))
      expect(h2Solid).toBeDefined()
      expect(h2Solid?.printed).toContain('H2(s)')

      const standardState = NCERT_UNIT7_ERRATA.find((e) => e.where.toLowerCase().includes('standard state') || e.where.includes('7.4'))
      expect(standardState).toBeDefined()

      const hclo = NCERT_UNIT7_ERRATA.find((e) => e.printed.includes('HClO'))
      expect(hclo).toBeDefined()
      expect(hclo?.correct).toContain('HClO4')
    })
  })
})
