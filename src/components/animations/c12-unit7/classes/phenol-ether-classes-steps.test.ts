import { describe, expect, it } from 'vitest'
import { PHENOL_ETHER_STEPS, clampPhenolEtherStep, describePhenolEtherStep } from './phenol-ether-classes-steps'

describe('phenol-ether-classes Scrolly steps', () => {
  it('has four Steps matching the MDX Scrolly layout', () => {
    expect(PHENOL_ETHER_STEPS.map((s) => s.length)).toEqual([2, 2, 1, 2])
  })

  it('computes accurate phenol and ether classifications in every step', () => {
    // Step 0: monohydric phenols (phenol & 2-methylphenol)
    const s0 = describePhenolEtherStep(0)
    expect(s0.map((d) => d.classification.family)).toEqual(['phenol', 'phenol'])
    expect(s0.map((d) => d.classification.hydroxylClass)).toEqual(['Monohydric', 'Monohydric'])
    expect(s0[1].classification.ringSubstituentAtoms.length).toBe(1)

    // Step 1: dihydric & trihydric phenols
    const s1 = describePhenolEtherStep(1)
    expect(s1.map((d) => d.classification.family)).toEqual(['phenol', 'phenol'])
    expect(s1.map((d) => d.classification.hydroxylClass)).toEqual(['Dihydric', 'Trihydric'])

    // Step 2: simple (symmetrical) ether
    const s2 = describePhenolEtherStep(2)
    expect(s2[0].classification.family).toBe('ether')
    expect(s2[0].classification.etherSymmetry).toBe('simple')

    // Step 3: mixed (unsymmetrical) ethers
    const s3 = describePhenolEtherStep(3)
    expect(s3.map((d) => d.classification.family)).toEqual(['ether', 'ether'])
    expect(s3.map((d) => d.classification.etherSymmetry)).toEqual(['mixed', 'mixed'])
  })

  it('clamps out-of-range steps', () => {
    expect(clampPhenolEtherStep(-1)).toBe(0)
    expect(clampPhenolEtherStep(20)).toBe(3)
  })
})
