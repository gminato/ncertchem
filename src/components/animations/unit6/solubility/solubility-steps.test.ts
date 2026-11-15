import { describe, expect, it } from 'vitest'
import { ILLUSTRATIVE_A2B3_KSP, sciTex, solubilityNumbers, solubilitySteps } from './solubility-steps'

describe('solubility Scrolly steps', () => {
  const steps = solubilitySteps()
  const n = solubilityNumbers()

  it('has five Steps in the order dissolve, saturate, precipitate, common ion, three salt types', () => {
    expect(steps.map((s) => s.title)).toEqual(['Solid meets water', 'Saturation', 'Adding ions', 'Common ion', 'Three salt types'])
  })

  it('takes Ksp(BaSO4) from Table 6.9 and gives S = sqrt(Ksp) = 1.05e-5', () => {
    expect(n.kBaSO4).toBe(1.1e-10)
    expect(n.sBaSO4).toBeCloseTo(1.049e-5, 7)
  })

  it('gives the AB2 and A2B3 solubilities from the general formula', () => {
    expect(n.sPbI2).toBeCloseTo(1.211e-3, 6)
    expect(n.sA2B3).toBeCloseTo(5.173e-5, 8)
    expect(ILLUSTRATIVE_A2B3_KSP).toBe(4e-20)
  })

  it('finds Qsp above Ksp in Step 3, and the common-ion S far below pure-water S in Step 4', () => {
    expect(n.qMixed).toBeCloseTo(4e-8, 12)
    expect(n.qVerdict).toBe('precipitates')
    expect(n.qRatio).toBeGreaterThan(300)
    expect(n.sCommon).toBeCloseTo(1.1e-8, 10)
    expect(n.sCommon).toBeLessThan(n.sBaSO4 / 100)
  })

  it('writes numbers in TeX with a true exponent', () => {
    expect(sciTex(1.1e-10)).toBe('1.10 \\times 10^{-10}')
    expect(sciTex(9.996e-6, 2)).toBe('1.00 \\times 10^{-5}')
  })
})
