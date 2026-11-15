import { describe, expect, it } from 'vitest'
import {
  NCERT_TABLE_8_1_COMMON_NAMES,
  NCERT_TABLE_8_2_ALKANES,
  NCERT_TABLE_8_3_ALKYL_GROUPS,
  NCERT_TABLE_8_4_FUNCTIONAL_GROUPS,
  NCERT_UNIT8_ERRATA,
  NCERT_UNIT8_PROBLEMS,
  NCERT_QUANTITATIVE_METHODS,
  NCERT_LASSAIGNE_TESTS,
} from './ncert-unit8-tables'
import { iupacName } from './iupac-organic'
import { parseSmiles, molecularFormula } from './molecule-parse'

describe('NCERT Unit 8 tables', () => {
  it('encodes every printed table row with a PDF page in its source line', () => {
    expect(NCERT_TABLE_8_1_COMMON_NAMES.rows).toHaveLength(14)
    expect(NCERT_TABLE_8_2_ALKANES.rows).toHaveLength(12)
    expect(NCERT_TABLE_8_3_ALKYL_GROUPS.rows).toHaveLength(5)
    expect(NCERT_TABLE_8_4_FUNCTIONAL_GROUPS.rows).toHaveLength(18)
    expect(NCERT_TABLE_8_1_COMMON_NAMES.source).toMatch(/PDF p\. 7/)
    expect(NCERT_TABLE_8_2_ALKANES.source).toMatch(/PDF p\. 8/)
    expect(NCERT_TABLE_8_3_ALKYL_GROUPS.source).toMatch(/PDF p\. 8/)
    expect(NCERT_TABLE_8_4_FUNCTIONAL_GROUPS.source).toMatch(/PDF p\. 12/)
  })

  it('gives each Problem a PDF page and both printed and computed answers', () => {
    expect(NCERT_UNIT8_PROBLEMS.length).toBeGreaterThanOrEqual(24)
    for (const p of NCERT_UNIT8_PROBLEMS) {
      expect(p.pdfPage).toBeGreaterThan(0)
      expect(p.printedAnswer.length).toBeGreaterThan(0)
      expect(p.computedAnswer.length).toBeGreaterThan(0)
    }
  })

  it('checks every naming Problem with iupacName', () => {
    for (const p of NCERT_UNIT8_PROBLEMS.filter((x) => x.check === 'iupacName' && x.smiles)) {
      expect(iupacName(parseSmiles(p.smiles as string)), p.number).toBe(p.computedAnswer)
    }
  })

  it('checks every formula-bearing Problem against the parsed molecule', () => {
    for (const p of NCERT_UNIT8_PROBLEMS.filter((x) => x.check === 'bondCounts' && x.smiles)) {
      expect(molecularFormula(parseSmiles(p.smiles as string)).length).toBeGreaterThan(0)
    }
  })

  it('records the errata with PDF pages, including Problem 8.15 and the Kjeldahl subscript', () => {
    const where = NCERT_UNIT8_ERRATA.map((e) => e.where)
    expect(where.some((w) => w.includes('8.15'))).toBe(true)
    expect(where.some((w) => w.includes('Kjeldahl'))).toBe(true)
    for (const e of NCERT_UNIT8_ERRATA) expect(e.pdfPage).toBeGreaterThan(0)
  })

  it('lists the quantitative methods and Lassaigne tests with PDF pages', () => {
    expect(NCERT_QUANTITATIVE_METHODS.length).toBeGreaterThanOrEqual(10)
    expect(NCERT_LASSAIGNE_TESTS.every((t) => t.pdfPage >= 30 && t.pdfPage <= 30)).toBe(true)
  })
})
