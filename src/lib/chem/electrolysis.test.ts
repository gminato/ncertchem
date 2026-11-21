import { describe, expect, it } from 'vitest'
import {
  ELECTROLYSIS_CASES,
  chargeFromCurrent,
  electrolysisProducts,
  massDeposited,
  massesInSeries,
  molesOfElectrons,
  timeForMass,
} from './electrolysis'

describe('chargeFromCurrent (Q = It)', () => {
  it('Example 2.10: 1.5 A for 600 s gives 900 C', () => {
    expect(chargeFromCurrent(1.5, 600)).toBe(900)
  })

  it('Intext 2.10: 0.5 A for 2 h gives 3600 C and about 2.24 × 10²² electrons', () => {
    const q = chargeFromCurrent(0.5, 2 * 3600)
    expect(q).toBe(3600)
    const electrons = molesOfElectrons(q) * 6.022e23
    expect(electrons / 2.24e22).toBeCloseTo(1, 1)
  })

  it('throws for negative current or time', () => {
    expect(() => chargeFromCurrent(-1, 1)).toThrow(RangeError)
    expect(() => chargeFromCurrent(1, -1)).toThrow(RangeError)
  })
})

describe('molesOfElectrons', () => {
  it('Q/F with NCERT F = 96487 C mol⁻¹', () => {
    expect(molesOfElectrons(96487)).toBeCloseTo(1, 12)
    expect(molesOfElectrons(96487, 96500)).toBeCloseTo(0.999865, 5)
  })
})

describe('massDeposited (Example 2.10)', () => {
  it('900 C of Cu²⁺ (M = 63, n = 2) deposits 0.2938 g', () => {
    expect(massDeposited({ charge: 900, molarMass: 63, electrons: 2 })).toBeCloseTo(0.2938, 4)
  })

  it('Intext 2.12 type: one mole of Cr₂O₇²⁻ needs 6F, i.e. 6 × 96487 C', () => {
    expect(molesOfElectrons(6 * 96487)).toBeCloseTo(6, 12)
  })

  it('rejects a non-integer n', () => {
    expect(() => massDeposited({ charge: 1, molarMass: 1, electrons: 0 })).toThrow(RangeError)
  })
})

describe('Faraday second law', () => {
  it('equal charge in series gives masses in ratio M/n (Ag : Cu : Al)', () => {
    const [ag, cu, al] = massesInSeries(96487, [
      { molarMass: 108, electrons: 1 },
      { molarMass: 63.5, electrons: 2 },
      { molarMass: 27, electrons: 3 },
    ])
    expect(ag / cu).toBeCloseTo(108 / (63.5 / 2), 9)
    expect(al).toBeCloseTo(9, 9)
  })
})

describe('timeForMass', () => {
  it('inverts massDeposited: Example 2.10 time for 0.2938 g at 1.5 A is about 600 s', () => {
    expect(timeForMass(0.2938, 63, 2, 1.5)).toBeCloseTo(600, 0)
  })

  it('throws for zero current', () => {
    expect(() => timeForMass(1, 63, 2, 0)).toThrow(RangeError)
  })
})

describe('electrolysisProducts', () => {
  it('covers the NCERT cases plus textbook silver and copper cases', () => {
    expect(ELECTROLYSIS_CASES.length).toBeGreaterThanOrEqual(8)
    const ids = ELECTROLYSIS_CASES.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('molten NaCl gives Na and Cl₂ with no competition', () => {
    const c = electrolysisProducts('molten-NaCl')
    expect(c.products).toEqual(['Na(s)', 'Cl2(g)'])
    expect(c.reason).toBe('only-ions-present')
    expect(c.source).toBe('NCERT Sec. 2.5')
  })

  it('aqueous NaCl gives H₂, Cl₂ and NaOH, with the O₂ overpotential reason', () => {
    const c = electrolysisProducts('aqueous-NaCl-inert')
    expect(c.products).toContain('H2(g)')
    expect(c.products).toContain('Cl2(g)')
    expect(c.reason).toBe('overpotential-of-O2')
    expect(c.cathodeCe).toContain('OH^-')
  })

  it('dilute H₂SO₄ gives O₂ at the anode (1.23 V beats 1.96 V persulfate)', () => {
    const c = electrolysisProducts('dilute-H2SO4-inert')
    expect(c.products).toEqual(['H2(g)', 'O2(g)'])
    expect(c.reason).toBe('lower-E°')
  })

  it('concentrated H₂SO₄ gives persulfate at the anode', () => {
    const c = electrolysisProducts('concentrated-H2SO4-inert')
    expect(c.products).toContain('S2O8^{2-}')
    expect(c.reason).toBe('concentration-favours-persulfate')
  })

  it('copper electrodes: the anode dissolves; Pt electrodes: O₂ forms', () => {
    expect(electrolysisProducts('aqueous-CuSO4-Cu-electrodes').reason).toBe('active-anode-dissolves')
    expect(electrolysisProducts('aqueous-CuSO4-Pt-electrodes').products).toContain('O2(g)')
  })

  it('marks textbook-only cases without an NCERT page range', () => {
    const textbook = ELECTROLYSIS_CASES.filter((c) => c.source !== 'NCERT Sec. 2.5')
    expect(textbook.length).toBeGreaterThan(0)
    for (const c of textbook) expect(c.bookPages).toBeNull()
  })

  it('throws for an unknown case id', () => {
    expect(() => electrolysisProducts('nope' as never)).toThrow(RangeError)
  })
})
