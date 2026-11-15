import { describe, expect, it } from 'vitest'
import {
  bufferAfterAddition,
  commonIonWeakAcid,
  hendersonPH,
  kaFromKb,
  kw,
  pH,
  pKa,
  pOH,
  polyprotic,
  polyproticPH,
  saltHydrolysisPH,
  strongAcidPH,
  strongBasePH,
  titrationCurve,
  weakAcid,
  weakBase,
} from './acid-base'

describe('water and pH (Section 6.11.1 and 6.11.2)', () => {
  it('gives Kw = 1.0 × 10⁻¹⁴ at 298 K', () => {
    expect(kw(298)).toBeCloseTo(1e-14, 16)
  })

  it('makes Kw rise with temperature', () => {
    expect(kw(373)).toBeGreaterThan(kw(298))
  })

  it('converts between pH and [H⁺] and gives pOH = 14 − pH at 298 K', () => {
    expect(pH(1e-3)).toBeCloseTo(3, 10)
    expect(pOH(1e-3)).toBeCloseTo(3, 10)
    // [H⁺] = 10⁻³ M pairs with [OH⁻] = 10⁻¹¹ M, and pH + pOH = 14 (equation 6.29).
    expect(pH(1e-3) + pOH(1e-11)).toBeCloseTo(14, 10)
  })

  it('rejects a non-positive concentration', () => {
    expect(() => pH(0)).toThrow(RangeError)
  })
})

describe('strong acids and bases, including water (Problem 6.17)', () => {
  it('gives pH 6.98 for 1.0 × 10⁻⁸ M HCl', () => {
    expect(strongAcidPH(1e-8)).toBeCloseTo(6.98, 2)
  })

  it('gives pH 0 for 1 M HCl', () => {
    expect(strongAcidPH(1)).toBeCloseTo(0, 3)
  })

  it('gives pH 13 for 0.1 M NaOH', () => {
    expect(strongBasePH(0.1)).toBeCloseTo(13, 2)
  })

  it('gives pH 7 for a very dilute base as well (water sets the floor)', () => {
    expect(strongBasePH(1e-8)).toBeCloseTo(7.02, 2)
  })
})

describe('weak acids and bases (Section 6.11.3 and 6.11.4, Problems 6.18 to 6.20, 6.23)', () => {
  it('gives pH 2.88 for 0.1 M CH3COOH (Ka = 1.74 × 10⁻⁵)', () => {
    const result = weakAcid(0.1, 1.74e-5)
    expect(result.pH).toBeCloseTo(2.88, 2)
    expect(result.approximationValid).toBe(true)
  })

  it('solves Problem 6.18 exactly: α = 0.119 for HF, Ka = 3.2 × 10⁻⁴, 0.02 M', () => {
    const result = weakAcid(0.02, 3.2e-4)
    expect(result.alpha).toBeCloseTo(0.1187, 3)
    expect(result.hConc).toBeCloseTo(2.37e-3, 4)
    expect(result.pH).toBeCloseTo(2.62, 2)
  })

  it('gives pH 2.85 for Problem 6.20 (HOCl, Ka = 2.5 × 10⁻⁵, 0.08 M)', () => {
    expect(weakAcid(0.08, 2.5e-5).pH).toBeCloseTo(2.85, 2)
  })

  it('reports the 5 % approximation as invalid for a very weak acid at high dilution', () => {
    expect(weakAcid(1e-6, 1e-4).approximationValid).toBe(false)
  })

  it('gives Problem 6.19: a monobasic acid of pH 4.50 at 0.1 M has Ka = 1.0 × 10⁻⁸ and pKa = 8', () => {
    const h = 10 ** -4.5
    const ka = (h * h) / (0.1 - h)
    expect(ka).toBeCloseTo(1e-8, 9)
    expect(pKa(ka)).toBeCloseTo(8, 1)
  })

  it('gives Problem 6.23: 0.05 M NH3, α = 0.0188, pH 10.97', () => {
    const result = weakBase(0.05, 1.77e-5)
    expect(result.alpha).toBeCloseTo(0.0188, 3)
    expect(result.pH).toBeCloseTo(10.97, 2)
  })

  it('gives Problem 6.21: hydrazine at pH 9.7 gives Kb ≈ 6.3 × 10⁻⁷ (NCERT prints 8.96 × 10⁻⁷)', () => {
    const oh = 1e-14 / 10 ** -9.7
    const kb = (oh * oh) / 0.004
    expect(kb).toBeCloseTo(6.28e-7, 9)
  })

  it('relates Ka and Kb through Kw (Section 6.11.5, Problem 6.23): Ka(NH4⁺) = 5.65 × 10⁻¹⁰', () => {
    expect(kaFromKb(1.77e-5)).toBeCloseTo(5.65e-10, 12)
  })
})

describe('salt hydrolysis (Section 6.11.9, Problem 6.25)', () => {
  it('gives 7 for a strong acid with a strong base', () => {
    expect(saltHydrolysisPH('strong-strong', 0.1)).toBe(7)
  })

  it('gives Problem 6.25: ammonium acetate, pH = 7 + ½(pKa − pKb) = 7.005', () => {
    expect(saltHydrolysisPH('weak-weak', 0.1, { ka: 1.74e-5, kb: 1.77e-5 })).toBeCloseTo(7.005, 2)
  })

  it('gives a basic pH for a weak acid and strong base salt (CH3COONa 0.1 M ≈ 8.88)', () => {
    expect(saltHydrolysisPH('weak-acid-strong-base', 0.1, { ka: 1.74e-5 })).toBeCloseTo(8.88, 2)
  })

  it('gives an acidic pH for a strong acid and weak base salt (NH4Cl 0.1 M ≈ 5.12)', () => {
    expect(saltHydrolysisPH('strong-acid-weak-base', 0.1, { kb: 1.77e-5 })).toBeCloseTo(5.12, 2)
  })

  it('rejects a weak salt without its constant', () => {
    expect(() => saltHydrolysisPH('weak-acid-strong-base', 0.1)).toThrow(RangeError)
  })
})

describe('buffers (Section 6.12, Problems 6.22 and 6.24)', () => {
  it('gives Henderson–Hasselbalch pH = pKa + log(salt/acid)', () => {
    expect(hendersonPH(4.76, 0.1, 0.1)).toBeCloseTo(4.76, 10)
    expect(hendersonPH(4.76, 0.2, 0.1)).toBeCloseTo(4.76 + Math.log10(2), 10)
  })

  it('gives pH 8.95 for Problem 6.22 (0.2 M NH4Cl and 0.1 M NH3, pKb = 4.75)', () => {
    const result = commonIonWeakAcid(0.2, 10 ** -(14 - 4.75), 0.1)
    expect(result.pH).toBeCloseTo(8.95, 1)
  })

  it('barely changes the pH when a little strong acid is added to a buffer', () => {
    const before = hendersonPH(4.76, 0.1, 0.1)
    const after = bufferAfterAddition(
      { pKa: 4.76, acidMoles: 0.1, saltMoles: 0.1, volumeL: 1 },
      { kind: 'acid', moles: 0.001 }
    )
    expect(Math.abs(after - before)).toBeLessThan(0.05)
  })

  it('gives a large pH change when strong acid exceeds the buffer', () => {
    const pHValue = bufferAfterAddition(
      { pKa: 4.76, acidMoles: 0.1, saltMoles: 0.1, volumeL: 1 },
      { kind: 'acid', moles: 0.5 }
    )
    expect(pHValue).toBeLessThan(2)
  })

  it('rejects a buffer with no acid or salt', () => {
    expect(() =>
      bufferAfterAddition({ pKa: 4.76, acidMoles: 0, saltMoles: 0.1, volumeL: 1 }, { kind: 'base', moles: 0.01 })
    ).toThrow(RangeError)
  })
})

describe('polyprotic acids (Section 6.11.6, Table 6.8)', () => {
  it('gives species fractions that sum to 1 at any pH', () => {
    const fractions = polyprotic(4, [5.9e-2, 6.4e-5])
    const total = fractions.reduce((sum, f) => sum + f, 0)
    expect(total).toBeCloseTo(1, 10)
  })

  it('shows the protonated species dominates at low pH and the fully dissociated one at high pH', () => {
    const low = polyprotic(0, [5.9e-2, 6.4e-5])
    const high = polyprotic(14, [5.9e-2, 6.4e-5])
    // At pH 0 the first dissociation (Ka1 = 0.059) still leaves about 94 % as H2A.
    expect(low[0]).toBeGreaterThan(0.9)
    expect(high[2]).toBeGreaterThan(0.99)
  })

  it('gives a pH for 0.1 M oxalic acid between 1 and 2', () => {
    const value = polyproticPH(0.1, [5.9e-2, 6.4e-5])
    expect(value).toBeGreaterThan(1)
    expect(value).toBeLessThan(2)
  })

  it('rejects an empty list of constants', () => {
    expect(() => polyproticPH(0.1, [])).toThrow(RangeError)
  })
})

describe('titration curves (for a graph)', () => {
  it('starts at the analyte pH and passes through pH 7 at the equivalence point for strong–strong', () => {
    const curve = titrationCurve({
      analyte: 'strong-acid',
      analyteMolarity: 0.1,
      analyteVolumeMl: 25,
      titrantMolarity: 0.1,
      addedVolumesMl: [0, 25, 50],
    })
    expect(curve[0].pH).toBeCloseTo(1, 2)
    expect(curve[1].pH).toBeCloseTo(7, 6)
    expect(curve[2].pH).toBeGreaterThan(11)
  })

  it('has an equivalence pH above 7 for a weak acid titrated by a strong base', () => {
    const curve = titrationCurve({
      analyte: 'weak-acid',
      ka: 1.74e-5,
      analyteMolarity: 0.1,
      analyteVolumeMl: 25,
      titrantMolarity: 0.1,
      addedVolumesMl: [25],
    })
    expect(curve[0].pH).toBeGreaterThan(8)
  })

  it('rejects a weak acid without Ka', () => {
    expect(() =>
      titrationCurve({
        analyte: 'weak-acid',
        analyteMolarity: 0.1,
        analyteVolumeMl: 25,
        titrantMolarity: 0.1,
        addedVolumesMl: [10],
      })
    ).toThrow(RangeError)
  })
})
