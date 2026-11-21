import { describe, expect, it } from 'vitest'
import { GAS_CONSTANT_L_BAR, NCERT_VANT_HOFF_SALTS } from './ncert-c12-unit1-tables'
import {
  VANT_HOFF_PRESETS,
  abnormalMolarMass,
  alphaFromAssociation,
  alphaFromDissociation,
  computePresetMetrics,
  getSaltTableEntry,
  getVantHoffPreset,
  modifiedColligative,
  vantHoffAssociation,
  vantHoffDissociation,
  vantHoffFromMolarMass,
} from './vant-hoff'

describe('vant-hoff dissociation and association math', () => {
  it('computes i = 1 + (n - 1) * alpha for dissociation', () => {
    expect(vantHoffDissociation({ nIons: 2, alpha: 0 })).toBeCloseTo(1, 6)
    expect(vantHoffDissociation({ nIons: 2, alpha: 1 })).toBeCloseTo(2, 6)
    expect(vantHoffDissociation({ nIons: 2, alpha: 0.85 })).toBeCloseTo(1.85, 6)
    expect(vantHoffDissociation({ nIons: 3, alpha: 0.75 })).toBeCloseTo(2.5, 6)
    expect(vantHoffDissociation({ nIons: 4, alpha: 0.5 })).toBeCloseTo(2.5, 6)
  })

  it('inverts dissociation to recover alpha from i', () => {
    expect(alphaFromDissociation({ i: 1.87, nIons: 2 })).toBeCloseTo(0.87, 6)
    expect(alphaFromDissociation({ i: 2.32, nIons: 3 })).toBeCloseTo(0.66, 6)
    expect(alphaFromDissociation({ i: 2.84, nIons: 3 })).toBeCloseTo(0.92, 6)
    expect(alphaFromDissociation({ i: 1, nIons: 2 })).toBeCloseTo(0, 6)
  })

  it('computes i = 1 - alpha * (1 - 1/n) for association', () => {
    expect(vantHoffAssociation({ nMer: 2, alpha: 0 })).toBeCloseTo(1, 6)
    expect(vantHoffAssociation({ nMer: 2, alpha: 1 })).toBeCloseTo(0.5, 6)
    expect(vantHoffAssociation({ nMer: 2, alpha: 0.8 })).toBeCloseTo(0.6, 6)
    expect(vantHoffAssociation({ nMer: 3, alpha: 0.9 })).toBeCloseTo(0.4, 6)
  })

  it('inverts association to recover alpha from i', () => {
    expect(alphaFromAssociation({ i: 0.6, nMer: 2 })).toBeCloseTo(0.8, 6)
    expect(alphaFromAssociation({ i: 0.504, nMer: 2 })).toBeCloseTo(0.992, 3)
    expect(alphaFromAssociation({ i: 0.4, nMer: 3 })).toBeCloseTo(0.9, 6)
  })

  it('computes abnormal molar mass and recovers i from molar mass ratio', () => {
    // Complete dissociation of KCl (74.5 g/mol) halves apparent molar mass
    const mApparentKCl = abnormalMolarMass({ normalMolarMass: 74.5, i: 2 })
    expect(mApparentKCl).toBeCloseTo(37.25, 2)

    // Complete dimerisation of ethanoic acid (60 g/mol) doubles apparent molar mass
    const mApparentAcid = abnormalMolarMass({ normalMolarMass: 60, i: 0.5 })
    expect(mApparentAcid).toBeCloseTo(120, 2)

    expect(
      vantHoffFromMolarMass({ normalMolarMass: 122.12, abnormalMolarMass: 244.24 })
    ).toBeCloseTo(0.5, 4)
  })

  it('rejects out-of-range parameters cleanly', () => {
    expect(() => vantHoffDissociation({ nIons: 0, alpha: 0.5 })).toThrow(RangeError)
    expect(() => vantHoffDissociation({ nIons: 2, alpha: 1.2 })).toThrow(RangeError)
    expect(() => vantHoffAssociation({ nMer: 2, alpha: -0.1 })).toThrow(RangeError)
    expect(() => alphaFromDissociation({ i: 2.5, nIons: 2 })).toThrow(RangeError)
    expect(() => alphaFromAssociation({ i: 0.4, nMer: 2 })).toThrow(RangeError)
    expect(() => abnormalMolarMass({ normalMolarMass: 60, i: 0 })).toThrow(RangeError)
  })
})

describe('modifiedColligative equations with van’t Hoff factor i', () => {
  it('scales all four colligative properties linearly with i', () => {
    const res = modifiedColligative({
      i: 1.9,
      molality: 0.5,
      kb: 0.52,
      kf: 1.86,
      molarity: 0.5,
      tempK: 300,
      x2: 0.01,
    })

    expect(res.relativeVapourPressureLowering).toBeCloseTo(0.019, 6)
    expect(res.deltaTbK).toBeCloseTo(1.9 * 0.52 * 0.5, 6)
    expect(res.deltaTfK).toBeCloseTo(1.9 * 1.86 * 0.5, 6)
    expect(res.osmoticPressureBar).toBeCloseTo(1.9 * 0.5 * GAS_CONSTANT_L_BAR * 300, 6)
  })

  it('reduces to ideal colligative equations when i = 1', () => {
    const res = modifiedColligative({
      i: 1,
      molality: 1.0,
      x2: 0.02,
    })
    expect(res.deltaTbK).toBeCloseTo(0.52, 4)
    expect(res.deltaTfK).toBeCloseTo(1.86, 4)
    expect(res.relativeVapourPressureLowering).toBeCloseTo(0.02, 6)
  })
})

describe('presets and NCERT Table 1.4 alignment', () => {
  it('contains all required solute presets', () => {
    const ids = VANT_HOFF_PRESETS.map((p) => p.id)
    expect(ids).toContain('urea')
    expect(ids).toContain('nacl')
    expect(ids).toContain('k2so4')
    expect(ids).toContain('acetic-acid-benzene')
    expect(ids).toContain('benzoic-acid-benzene')
  })

  it('matches NCERT Table 1.4 dilution monotonic approach to complete dissociation', () => {
    for (const salt of NCERT_VANT_HOFF_SALTS) {
      expect(salt.iAt01m).toBeLessThan(salt.iAt001m)
      expect(salt.iAt001m).toBeLessThan(salt.iAt0001m)
      expect(salt.iAt0001m).toBeLessThanOrEqual(salt.iComplete)
    }

    const nacl = getVantHoffPreset('nacl')
    const naclTable = getSaltTableEntry('nacl')
    expect(naclTable?.iAt01m).toBe(1.87)
    expect(computePresetMetrics(nacl, nacl.defaultAlpha, 1).i).toBeCloseTo(1.87, 4)

    const k2so4 = getVantHoffPreset('k2so4')
    const k2so4Table = getSaltTableEntry('k2so4')
    expect(k2so4Table?.iAt01m).toBe(2.32)
    expect(computePresetMetrics(k2so4, k2so4.defaultAlpha, 1).i).toBeCloseTo(2.32, 4)
  })

  it('keeps urea fixed at i = 1 regardless of alpha input', () => {
    const urea = getVantHoffPreset('urea')
    const m = computePresetMetrics(urea, 0.8, 1.0)
    expect(m.i).toBe(1)
    expect(m.effectiveAlpha).toBe(0)
    expect(m.abnormalMolarMass).toBeCloseTo(urea.normalMolarMassGPerMol, 4)
  })
})
