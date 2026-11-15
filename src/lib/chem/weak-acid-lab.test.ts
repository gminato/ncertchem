import { describe, expect, it } from 'vitest'
import { polyprotic, polyproticPH, weakAcid, weakBase } from './acid-base'
import { APPROXIMATION_LIMIT, polyproticCurve, weakAcidReport, weakBaseReport, weakPHCurve } from './weak-acid-lab'

describe('weakAcidReport', () => {
  it('matches the library quadratic for benzoic acid at 0.200 mol L⁻¹', () => {
    const r = weakAcidReport(0.2, 6.5e-5)
    const exact = weakAcid(0.2, 6.5e-5)
    expect(r.alpha).toBeCloseTo(exact.alpha, 12)
    expect(r.pH).toBeCloseTo(exact.pH, 12)
    expect(r.pH).toBeCloseTo(2.45, 2)
  })

  it('reproduces the NCERT Problem 6.18 values for HF through the same quadratic (α 0.119, pH 2.62)', () => {
    const r = weakAcidReport(0.02, 3.2e-4)
    expect(r.alpha).toBeCloseTo(0.119, 3)
    expect(r.pH).toBeCloseTo(2.62, 2)
  })

  it('takes the square-root shortcut as √(Ka·c) and α as √(Ka/c)', () => {
    const r = weakAcidReport(0.1, 1.74e-5)
    expect(r.hApprox).toBeCloseTo(Math.sqrt(1.74e-6), 15)
    expect(r.alphaApprox).toBeCloseTo(Math.sqrt(1.74e-4), 12)
  })

  it('holds the shortcut at 0.200 M and fails it at 0.0200 M for benzoic acid', () => {
    expect(weakAcidReport(0.2, 6.5e-5).approximationHolds).toBe(true)
    expect(weakAcidReport(0.02, 6.5e-5).approximationHolds).toBe(false)
  })

  it('uses the 5 % limit on the shortcut α, so it flags the exact cut-off', () => {
    const ka = 1e-5
    const c = ka / (APPROXIMATION_LIMIT * APPROXIMATION_LIMIT) // √(Ka/c) = 0.05 exactly
    expect(weakAcidReport(c * 1.01, ka).approximationHolds).toBe(true)
    expect(weakAcidReport(c * 0.99, ka).approximationHolds).toBe(false)
  })

  it('gives an ICE table in which the equilibrium amounts are c − x, x and x', () => {
    const r = weakAcidReport(0.02, 6.5e-5)
    expect(r.ice.equilibrium.HA + r.ice.equilibrium.H3O).toBeCloseTo(0.02, 12)
    expect(r.ice.equilibrium.H3O).toBeCloseTo(r.hConc, 15)
    expect(r.ice.equilibrium.A).toBeCloseTo(r.hConc, 15)
  })

  it('dilution raises α with Ka held fixed', () => {
    const a = weakAcidReport(0.2, 6.5e-5).alpha
    const b = weakAcidReport(0.02, 6.5e-5).alpha
    const d = weakAcidReport(0.002, 6.5e-5).alpha
    expect(a).toBeLessThan(b)
    expect(b).toBeLessThan(d)
  })

  it('reports pKa from Ka', () => {
    expect(weakAcidReport(0.1, 1.74e-5).pKa).toBeCloseTo(4.76, 2)
  })

  it('rejects a non-positive concentration or Ka', () => {
    expect(() => weakAcidReport(0, 1e-5)).toThrow(RangeError)
    expect(() => weakAcidReport(0.1, -1)).toThrow(RangeError)
  })
})

describe('weakBaseReport', () => {
  it('gives the same α as the library weak base quadratic', () => {
    const r = weakBaseReport(0.02, 5.4e-4)
    const exact = weakBase(0.02, 5.4e-4)
    expect(r.alpha).toBeCloseTo(exact.alpha, 12)
    expect(r.ohConc).toBeCloseTo(exact.ohConc, 15)
    expect(r.pH).toBeCloseTo(11.48, 2)
  })

  it('computes the approximate pH through Kw', () => {
    const r = weakBaseReport(0.1, 1.77e-5)
    expect(r.pHApprox).toBeCloseTo(11.12, 2)
  })
})

describe('polyproticCurve', () => {
  const oxalic = [5.9e-2, 6.4e-5]

  it('returns fractions that sum to one at every pH', () => {
    for (const point of polyproticCurve(oxalic, 0, 14, 57)) {
      const sum = point.fractions.reduce((a, b) => a + b, 0)
      expect(sum).toBeCloseTo(1, 12)
    }
  })

  it('matches the library species fractions at each sampled pH', () => {
    const point = polyproticCurve(oxalic, 0, 14, 15)[3]
    expect(point.fractions).toEqual(polyprotic(point.pH, oxalic))
  })

  it('has H₂A dominant at pH 0 and A²⁻ dominant at pH 14', () => {
    const curve = polyproticCurve(oxalic, 0, 14, 141)
    expect(curve[0].fractions[0]).toBeGreaterThan(0.9)
    expect(curve[140].fractions[2]).toBeGreaterThan(0.99)
  })

  it('makes the first two species equal at the first pKa', () => {
    const pKa1 = -Math.log10(5.9e-2)
    const at = polyprotic(pKa1, oxalic)
    expect(at[0]).toBeCloseTo(at[1], 10)
  })

  it('rejects an empty range', () => {
    expect(() => polyproticCurve(oxalic, 5, 5, 10)).toThrow(RangeError)
  })

  it('gives the pH of 0.1 M oxalic acid from the full charge balance', () => {
    // Just above pKa1 = 1.23: at 0.100 mol L⁻¹ more than half of the acid has lost its first proton.
    expect(polyproticPH(0.1, oxalic)).toBeCloseTo(1.277, 3)
  })
})

describe('weakPHCurve', () => {
  it('runs from the lower to the upper log c with the exact and approximate pH at each point', () => {
    const curve = weakPHCurve('acid', 1.74e-5, -4, 0, 9)
    expect(curve).toHaveLength(9)
    expect(curve[0].logC).toBeCloseTo(-4, 12)
    expect(curve[8].logC).toBeCloseTo(0, 12)
    expect(curve[8].pH).toBeCloseTo(weakAcidReport(1, 1.74e-5).pH, 12)
  })

  it('makes the approximate pH drift away from the exact one as the acid is diluted', () => {
    const curve = weakPHCurve('acid', 6.5e-5, -4, -1, 4)
    const error = (p: { pH: number; pHApprox: number }) => Math.abs(p.pH - p.pHApprox)
    expect(error(curve[0])).toBeGreaterThan(error(curve[3]))
  })

  it('works for a weak base as well', () => {
    const curve = weakPHCurve('base', 1.77e-5, -2, -1, 2)
    expect(curve[1].pH).toBeCloseTo(weakBaseReport(0.1, 1.77e-5).pH, 12)
  })
})
