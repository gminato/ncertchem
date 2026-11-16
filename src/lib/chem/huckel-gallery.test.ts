import { describe, expect, it } from 'vitest'
import { huckel } from './aromaticity'
import { HUCKEL_GALLERY, ionFormula, largestCycle, ringReport, scoreAnswers } from './huckel-gallery'
import { parseSmiles } from './molecule-parse'

describe('Hückel gallery verdicts (Section 9.5.3)', () => {
  const expected: Record<string, { verdict: string; pi: number; n: number | undefined }> = {
    benzene: { verdict: 'aromatic', pi: 6, n: 1 },
    naphthalene: { verdict: 'aromatic', pi: 10, n: 2 },
    anthracene: { verdict: 'aromatic', pi: 14, n: 3 },
    pyridine: { verdict: 'aromatic', pi: 6, n: 1 },
    pyrrole: { verdict: 'aromatic', pi: 6, n: 1 },
    furan: { verdict: 'aromatic', pi: 6, n: 1 },
    'cyclopropenyl-cation': { verdict: 'aromatic', pi: 2, n: 0 },
    'cyclopentadienyl-anion': { verdict: 'aromatic', pi: 6, n: 1 },
    tropylium: { verdict: 'aromatic', pi: 6, n: 1 },
    'cyclopentadienyl-cation': { verdict: 'antiaromatic', pi: 4, n: undefined },
    cyclobutadiene: { verdict: 'antiaromatic', pi: 4, n: undefined },
    cyclooctatetraene: { verdict: 'non-aromatic', pi: 8, n: undefined },
    cyclopentadiene: { verdict: 'non-aromatic', pi: 4, n: undefined },
  }

  it('covers every gallery ring with an expected verdict', () => {
    expect(HUCKEL_GALLERY.map((r) => r.id).sort()).toEqual(Object.keys(expected).sort())
    expect(HUCKEL_GALLERY.length).toBeGreaterThanOrEqual(10)
  })

  for (const ring of HUCKEL_GALLERY) {
    it(`${ring.name}: ${expected[ring.id].verdict} with ${expected[ring.id].pi} π electrons`, () => {
      const r = ringReport(ring.id)
      expect(r.verdict).toBe(expected[ring.id].verdict)
      expect(r.piElectrons).toBe(expected[ring.id].pi)
      expect(r.n).toBe(expected[ring.id].n)
      expect(r.reasons.length).toBeGreaterThan(0)
    })
  }

  it('anthracene is tested on its 14-atom perimeter, not the 10-atom ring huckel() finds by default', () => {
    const g = parseSmiles(HUCKEL_GALLERY.find((r) => r.id === 'anthracene')!.smiles)
    expect(huckel(g).piElectrons).toBe(10)
    expect(largestCycle(g)?.length).toBe(14)
    expect(ringReport('anthracene').piElectrons).toBe(14)
  })

  it('cyclooctatetraene says why it is not antiaromatic', () => {
    expect(ringReport('cyclooctatetraene').reasons.join(' ')).toMatch(/not planar/)
  })

  it('an acyclic molecule has no cycle', () => {
    expect(largestCycle(parseSmiles('C=CC=CC=C'))).toBeUndefined()
  })

  it('formats charged formulas with subscripts and superscript charges', () => {
    expect(ionFormula('C5H5-')).toBe('C₅H₅⁻')
    expect(ionFormula('C7H7+')).toBe('C₇H₇⁺')
    expect(ionFormula('C6H6')).toBe('C₆H₆')
    expect(ringReport('tropylium').formula).toBe('C₇H₇⁺')
  })

  it('throws for an id that is not in the gallery', () => {
    expect(() => ringReport('azulene')).toThrow(RangeError)
  })
})

describe('checker scoring', () => {
  it('marks each answer against the lib, and leaves unanswered rows undefined', () => {
    const r = ringReport('benzene')
    const rows = scoreAnswers(r, { cyclic: true, flat: true, count: 6, fits: true, verdict: 'non-aromatic' })
    expect(rows.map((x) => x.correct)).toEqual([true, true, true, true, false])
    expect(scoreAnswers(r, {}).every((x) => x.correct === undefined)).toBe(true)
  })

  it('cyclopentadiene is not flat: its CH2 breaks the π system', () => {
    const r = ringReport('cyclopentadiene')
    expect(scoreAnswers(r, { flat: true })[1].correct).toBe(false)
    expect(scoreAnswers(r, { flat: false })[1].correct).toBe(true)
  })

  it('cyclooctatetraene is not flat, although its 8 π electrons are all in the ring', () => {
    const r = ringReport('cyclooctatetraene')
    expect(scoreAnswers(r, { flat: true })[1].correct).toBe(false)
  })
})
