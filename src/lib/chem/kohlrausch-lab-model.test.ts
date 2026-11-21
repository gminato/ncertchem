import { describe, expect, it } from 'vitest'
import {
  ACETIC_ACID_KA,
  ACETIC_LAMBDA0,
  KCL_POINTS,
  aceticAcidDecomposition,
  aceticAcidFromKa,
  buildSalt,
  fitKClPoints,
  formatSci,
  readoutFromLambda,
  ANION_CHOICES,
  CATION_CHOICES,
} from './kohlrausch-lab-model'

const pick = (list: typeof CATION_CHOICES, id: string) => list.find((c) => c.id === id)!

describe('Kohlrausch Lab model', () => {
  it('reproduces the Table 2.4 Kohlrausch sums for acetic acid (390.5 S cm² mol⁻¹)', () => {
    const d = aceticAcidDecomposition()
    expect(d.hcl).toBeCloseTo(425.9, 6)
    expect(d.naAc).toBeCloseTo(91.0, 6)
    expect(d.naCl).toBeCloseTo(126.4, 6)
    expect(ACETIC_LAMBDA0).toBeCloseTo(390.5, 6)
  })

  it('fits the KCl points of Example 2.6 to a Λ°m near 149.8 and A near 87.4', () => {
    const fit = fitKClPoints(KCL_POINTS.length)
    expect(fit.lambda0Scm2).toBeCloseTo(149.83, 1)
    expect(fit.A).toBeCloseTo(87.44, 1)
  })

  it('needs at least two KCl points for the least-squares line', () => {
    expect(() => fitKClPoints(1)).toThrow()
  })

  it('computes acetic acid Λm from Ka and recovers the same Ka through α', () => {
    for (const c of [1e-7, 1e-5, 1e-4, 1e-3]) {
      const { alpha, lambdaScm2 } = aceticAcidFromKa(c)
      expect(alpha).toBeGreaterThan(0)
      expect(alpha).toBeLessThan(1)
      expect(lambdaScm2).toBeCloseTo(alpha * ACETIC_LAMBDA0, 9)
      const back = readoutFromLambda(c, lambdaScm2)
      expect(back.Ka / ACETIC_ACID_KA).toBeCloseTo(1, 9)
    }
  })

  it('gives Λm rising towards Λ°m as the solution is diluted', () => {
    expect(aceticAcidFromKa(1e-5).lambdaScm2).toBeGreaterThan(aceticAcidFromKa(1e-4).lambdaScm2)
    expect(aceticAcidFromKa(1e-7).lambdaScm2).toBeLessThan(ACETIC_LAMBDA0)
    expect(aceticAcidFromKa(1e-7).lambdaScm2).toBeGreaterThan(385)
  })

  it('agrees with NCERT Example 2.9 (Λm 48.15 at 1.028 × 10⁻³ mol L⁻¹, Ka ≈ 1.78 × 10⁻⁵)', () => {
    const c = 1.028e-3
    const { alpha, lambdaScm2 } = aceticAcidFromKa(c)
    expect(lambdaScm2).toBeCloseTo(48.15, 0)
    expect(alpha).toBeCloseTo(0.1233, 3)
    expect(readoutFromLambda(c, 48.15).Ka).toBeCloseTo(1.78e-5, 7)
  })

  it('builds CaCl₂ with ν = 1 and 2 and sums Λ°m = 119.0 + 2 × 76.3', () => {
    const r = buildSalt(pick(CATION_CHOICES, 'Ca2+'), pick(ANION_CHOICES, 'Cl-'))
    expect(r.valid).toBe(true)
    expect(r.formula).toBe('CaCl₂')
    expect(r.nuCation).toBe(1)
    expect(r.nuAnion).toBe(2)
    expect(r.lambda0Scm2).toBeCloseTo(271.6, 6)
  })

  it('builds H₂SO₄ and Ca(OH)₂ with the right counts', () => {
    const h2so4 = buildSalt(pick(CATION_CHOICES, 'H+'), pick(ANION_CHOICES, 'SO4_2-'))
    expect(h2so4.formula).toBe('H₂SO₄')
    expect(h2so4.nuCation).toBe(2)
    expect(h2so4.lambda0Scm2).toBeCloseTo(2 * 349.6 + 160.0, 6)
    const caOh = buildSalt(pick(CATION_CHOICES, 'Ca2+'), pick(ANION_CHOICES, 'OH-'))
    expect(caOh.formula).toBe('Ca(OH)₂')
    expect(caOh.lambda0Scm2).toBeCloseTo(119.0 + 2 * 199.1, 6)
  })

  it('refuses H⁺ with OH⁻ and H⁺ with CH₃COO⁻', () => {
    expect(buildSalt(pick(CATION_CHOICES, 'H+'), pick(ANION_CHOICES, 'OH-')).valid).toBe(false)
    expect(buildSalt(pick(CATION_CHOICES, 'H+'), pick(ANION_CHOICES, 'CH3COO-')).valid).toBe(false)
  })

  it('formats concentrations with a real superscript minus', () => {
    expect(formatSci(1.028e-3)).toBe('1.0 × 10⁻³')
    expect(formatSci(1e-5, 1)).toBe('1 × 10⁻⁵')
  })
})
