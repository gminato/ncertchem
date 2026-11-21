import { describe, expect, it } from 'vitest'
import { FARADAY, NCERT_STANDARD_POTENTIALS } from './ncert-c12-unit2-tables'
import {
  CONVERTER_PRESETS,
  findCouple,
  leastCommonMultiple,
  presetThermo,
  scientificFromLog10,
  stateAtProgress,
  verdictFor,
} from './e-g-k-converter'

const preset = (id: string) => {
  const p = CONVERTER_PRESETS.find((x) => x.id === id)
  if (!p) throw new Error(id)
  return p
}

describe('presets', () => {
  it('uses only Table 2.1 couples', () => {
    const ids = new Set(NCERT_STANDARD_POTENTIALS.map((r) => r.id))
    for (const p of CONVERTER_PRESETS) {
      expect(ids.has(p.cathodeId)).toBe(true)
      expect(ids.has(p.anodeId)).toBe(true)
    }
  })

  it('states n as the electron count of the balanced equation (LCM of the two couples)', () => {
    for (const p of CONVERTER_PRESETS) {
      const n = presetThermo(p, 298).n
      const ne = leastCommonMultiple(findCouple(p.cathodeId).electrons, findCouple(p.anodeId).electrons)
      expect(n).toBe(ne)
      const tag = n === 1 ? 'e⁻' : `${n}e⁻`
      expect(p.cathodeHalf).toContain(tag)
      expect(p.anodeHalf).toContain(tag)
    }
  })

  it('covers n = 1, 2 and 6 and one non-spontaneous reaction', () => {
    const ns = new Set(CONVERTER_PRESETS.map((p) => presetThermo(p, 298).n))
    expect(ns).toEqual(new Set([1, 2, 6]))
    expect(CONVERTER_PRESETS.some((p) => verdictFor(presetThermo(p, 298).eCell) === 'reverse')).toBe(true)
  })
})

describe('preset thermodynamics at 298 K (NCERT 0.059 V convention)', () => {
  it('Ag⁺/Zn: E° = 1.56 V, n = 2, log K = 52.88, ΔrG° ≈ −301.1 kJ mol⁻¹', () => {
    const t = presetThermo(preset('ag-zn'), 298)
    expect(t.eCell).toBeCloseTo(1.56, 10)
    expect(t.log10K).toBeCloseTo((2 * 1.56) / 0.059, 9)
    expect(t.gibbsKJ).toBeCloseTo((-2 * FARADAY * 1.56) / 1000, 9)
  })

  it('Au³⁺/Zn: n = 6 and a very large K that stays finite', () => {
    const t = presetThermo(preset('au-zn'), 298)
    expect(t.n).toBe(6)
    expect(Number.isFinite(t.log10K)).toBe(true)
    expect(t.log10K).toBeGreaterThan(200)
  })

  it('Zn²⁺/Cu as written: E° = −1.10 V, K far below 1, reverse verdict', () => {
    const t = presetThermo(preset('zn-cu'), 298)
    expect(t.eCell).toBeCloseTo(-1.1, 10)
    expect(t.log10K).toBeLessThan(-30)
    expect(verdictFor(t.eCell)).toBe('reverse')
  })

  it('Pb²⁺/Sn²⁺ is only just spontaneous (K about 2)', () => {
    const t = presetThermo(preset('pb-sn'), 298)
    expect(t.eCell).toBeCloseTo(0.01, 10)
    expect(t.log10K).toBeCloseTo(0.339, 2)
  })
})

describe('temperature', () => {
  it('ΔrG° = −RT ln K holds at 310 K for the exact form', () => {
    const p = preset('ag-zn')
    const t = presetThermo(p, 310)
    const rtLnK = 8.314 * 310 * Math.LN10 * t.log10K
    expect(-rtLnK / 1000).toBeCloseTo(t.gibbsKJ, 6)
  })
})

describe('scientificFromLog10', () => {
  it('splits large and small K into mantissa and exponent without overflow', () => {
    const big = scientificFromLog10(52.881)
    expect(big.exponent).toBe(52)
    expect(Number(big.mantissa)).toBeGreaterThanOrEqual(1)
    expect(Number(big.mantissa)).toBeLessThan(10)
    const small = scientificFromLog10(-37.288)
    expect(small.exponent).toBe(-38)
    expect(Number.isFinite(Number(small.mantissa))).toBe(true)
  })

  it('carries when the mantissa rounds up to 10', () => {
    const r = scientificFromLog10(1.9999, 2)
    expect(r).toEqual({ mantissa: '1.00', exponent: 2 })
  })
})

describe('discharge', () => {
  const p = preset('ag-zn')
  const t = presetThermo(p, 298)

  it('starts at E°cell with Q = 1 and ends at E = 0 with Q = K', () => {
    expect(stateAtProgress(t, 0, 298).eCell).toBeCloseTo(1.56, 10)
    expect(stateAtProgress(t, 0, 298).log10Q).toBe(0)
    const end = stateAtProgress(t, 1, 298)
    expect(end.eCell).toBe(0)
    expect(end.gibbsKJ).toBe(0)
    expect(end.log10Q).toBeCloseTo(t.log10K, 10)
  })

  it('reaches E = 0 at equilibrium at any temperature', () => {
    for (const T of [273, 310, 373]) {
      const tt = presetThermo(p, T)
      expect(stateAtProgress(tt, 1, T).eCell).toBe(0)
    }
  })

  it('falls monotonically as the cell runs down', () => {
    let last = Infinity
    for (let pr = 0; pr <= 1; pr += 0.1) {
      const e = stateAtProgress(t, pr, 298).eCell
      expect(e).toBeLessThanOrEqual(last)
      last = e
    }
  })
})
