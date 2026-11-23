import { describe, expect, it } from 'vitest'
import { STEP_COUNT, VBT_STEPS, clampStep, countElectrons } from './vbt-steps'

describe('vbt-steps', () => {
  it('defines five steps matching the Section 5.5.1 Scrolly', () => {
    expect(STEP_COUNT).toBe(5)
    expect(VBT_STEPS.map((s) => s.index)).toEqual([0, 1, 2, 3, 4])
  })

  it('clamps out-of-range and non-finite step indices', () => {
    expect(clampStep(-3)).toBe(0)
    expect(clampStep(0)).toBe(0)
    expect(clampStep(4)).toBe(4)
    expect(clampStep(99)).toBe(4)
    expect(clampStep(Number.NaN)).toBe(0)
  })

  it('has exact metal, ligand, and unpaired electron counts on every step', () => {
    // Step 0: Free Co3+ (3d6)
    expect(countElectrons(VBT_STEPS[0].primary)).toEqual({ metal: 6, ligand: 0, unpaired: 4 })
    expect(VBT_STEPS[0].primary.unpaired).toBe(4)

    // Step 1: [Co(NH3)6]3+ (d2sp3)
    expect(countElectrons(VBT_STEPS[1].primary)).toEqual({ metal: 6, ligand: 12, unpaired: 0 })
    expect(VBT_STEPS[1].primary.bracket).toMatchObject({ startIndex: 3, endIndex: 8 })

    // Step 2: [CoF6]3- (sp3d2)
    expect(countElectrons(VBT_STEPS[2].primary)).toEqual({ metal: 6, ligand: 12, unpaired: 4 })
    expect(VBT_STEPS[2].primary.bracket).toMatchObject({ startIndex: 5, endIndex: 10 })

    // Step 3: [NiCl4]2- (3d8, sp3) and [Ni(CO)4] (3d10, sp3)
    expect(countElectrons(VBT_STEPS[3].primary)).toEqual({ metal: 8, ligand: 8, unpaired: 2 })
    expect(VBT_STEPS[3].secondary).toBeDefined()
    expect(countElectrons(VBT_STEPS[3].secondary!)).toEqual({ metal: 10, ligand: 8, unpaired: 0 })

    // Step 4: [Ni(CN)4]2- (3d8, dsp2)
    expect(countElectrons(VBT_STEPS[4].primary)).toEqual({ metal: 8, ligand: 8, unpaired: 0 })
    expect(VBT_STEPS[4].primary.bracket).toMatchObject({ startIndex: 4, endIndex: 7 })
  })
})
