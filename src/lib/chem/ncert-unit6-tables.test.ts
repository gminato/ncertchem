import { describe, expect, it } from 'vitest'
import {
  NCERT_TABLE_6_2_H2_I2_HI,
  NCERT_TABLE_6_3_TRIAL_EXPRESSIONS,
  NCERT_TABLE_6_4_K_TRANSFORMS,
  NCERT_TABLE_6_5_KP,
  NCERT_TABLE_6_5_PH,
  NCERT_TABLE_6_6_KA,
  NCERT_TABLE_6_7_KB,
  NCERT_TABLE_6_8_POLYPROTIC,
  NCERT_TABLE_6_9_KSP,
  NCERT_UNIT6_ERRATA,
  NCERT_UNIT6_PROBLEMS,
} from './ncert-unit6-tables'

describe('NCERT Unit 6 tables', () => {
  it('Table 6.2 conserves atoms: H2 and I2 consumed are equal and half the HI formed', () => {
    for (const row of NCERT_TABLE_6_2_H2_I2_HI.rows) {
      const consumedH2 = row.initial.h2 - row.equilibrium.h2
      const consumedI2 = row.initial.i2 - row.equilibrium.i2
      const formedHI = row.equilibrium.hi - row.initial.hi
      if (row.initial.h2 > 0) {
        expect(consumedH2).toBeCloseTo(consumedI2, 2)
        expect(formedHI).toBeCloseTo(2 * consumedH2, 1)
      }
    }
  })

  it('Table 6.3 has six experiments, each with the constant 46.4 to 47.6', () => {
    const rows = NCERT_TABLE_6_3_TRIAL_EXPRESSIONS.rows
    expect(rows).toHaveLength(6)
    for (const row of rows) {
      expect(row.kc).toBeGreaterThanOrEqual(46.4)
      expect(row.kc).toBeLessThanOrEqual(47.6)
    }
  })

  it('Table 6.4 lists the reverse, multiply and divide relations', () => {
    expect(NCERT_TABLE_6_4_K_TRANSFORMS.rows.map((r) => r.operation)).toEqual(['reverse', 'multiply', 'divide'])
  })

  it('Table 6.5 (Kp) has nine values, three per reaction', () => {
    expect(NCERT_TABLE_6_5_KP.rows).toHaveLength(9)
  })

  it('the pH table has 15 substances from NaOH to concentrated HCl', () => {
    const rows = NCERT_TABLE_6_5_PH.rows
    expect(rows).toHaveLength(15)
    expect(rows[0].pH).toBe(15)
    expect(rows[rows.length - 1].pH).toBe(-1)
  })

  it('Table 6.6, 6.7, 6.8 and 6.9 have 9, 7, 7 and 60 rows (Table 6.9 counted as printed)', () => {
    expect(NCERT_TABLE_6_6_KA.rows).toHaveLength(9)
    expect(NCERT_TABLE_6_7_KB.rows).toHaveLength(7)
    expect(NCERT_TABLE_6_8_POLYPROTIC.rows).toHaveLength(7)
    expect(NCERT_TABLE_6_9_KSP.rows).toHaveLength(60)
  })

  it('Table 6.6 gives HClO as 3.0 × 10⁻⁸ (the value Problem 6.20 disagrees with)', () => {
    const hclo = NCERT_TABLE_6_6_KA.rows.find((r) => r.formula === 'HClO')
    expect(hclo?.ka).toBe(3.0e-8)
  })

  it('Table 6.8 records sulphuric acid Ka1 as "very large"', () => {
    const sulphuric = NCERT_TABLE_6_8_POLYPROTIC.rows.find((r) => r.name === 'Sulphuric acid')
    expect(sulphuric?.ka1).toBe('very large')
  })

  it('cites the PDF page of each table', () => {
    expect(NCERT_TABLE_6_9_KSP.source).toContain('PDF p. 38')
    expect(NCERT_TABLE_6_6_KA.source).toContain('PDF p. 28')
  })
})

describe('NCERT Unit 6 problems and errata', () => {
  it('covers Problems 6.1 to 6.28 in order, each with a printed and a computed answer', () => {
    expect(NCERT_UNIT6_PROBLEMS.map((p) => p.number)).toEqual(
      Array.from({ length: 28 }, (_, i) => `6.${i + 1}`)
    )
    for (const problem of NCERT_UNIT6_PROBLEMS) {
      expect(problem.printedAnswer.length).toBeGreaterThan(0)
      expect(problem.computedAnswer.length).toBeGreaterThan(0)
      expect(problem.pdfPage).toBeGreaterThanOrEqual(10)
    }
  })

  it('records the errata with PDF page references in the "where" field', () => {
    expect(NCERT_UNIT6_ERRATA.length).toBeGreaterThanOrEqual(10)
    for (const erratum of NCERT_UNIT6_ERRATA) {
      expect(erratum.where).toMatch(/PDF p/)
    }
  })

  it('includes the two lead-verified errata (duplicate Table 6.5, and Problem 6.20 against Table 6.6)', () => {
    expect(NCERT_UNIT6_ERRATA.some((e) => e.where.includes('Table 6.5'))).toBe(true)
    expect(NCERT_UNIT6_ERRATA.some((e) => e.where.includes('Problem 6.20') && e.where.includes('Table 6.6'))).toBe(true)
  })
})
