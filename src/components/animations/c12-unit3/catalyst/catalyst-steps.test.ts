import { describe, expect, it } from 'vitest'
import { CATALYST_STEPS, catalystNumbers, catalystStep } from './catalyst-steps'

describe('catalyst Scrolly steps', () => {
  it('has five Steps, indexed from zero, in the Prose order', () => {
    expect(CATALYST_STEPS.map((s) => s.index)).toEqual([0, 1, 2, 3, 4])
    expect(CATALYST_STEPS.map((s) => s.scene)).toEqual(['downhill', 'downhill', 'mb', 'downhill', 'uphill'])
  })

  it('clamps out-of-range indices', () => {
    expect(catalystStep(-1).index).toBe(0)
    expect(catalystStep(9).index).toBe(4)
  })

  it('draws the catalysed route from Step 2 onward, except on the Maxwell–Boltzmann Step', () => {
    expect(CATALYST_STEPS.map((s) => s.catalysed)).toEqual([false, true, false, true, true])
  })

  it('draws the backward barriers only in the both-directions Step', () => {
    expect(CATALYST_STEPS.filter((s) => s.showBackward).map((s) => s.index)).toEqual([3])
  })
})

describe('catalyst numbers come from the libs', () => {
  it('gives the rate factor, backward barriers and Arrhenius fractions of the Prose', () => {
    const n = catalystNumbers()
    expect(n.rateFactor).toBe('56.6')
    expect(n.backwardUncatKJ).toBeCloseTo(80, 9)
    expect(n.backwardCatKJ).toBeCloseTo(70, 9)
    expect(n.fractionUncat).toBe('3.04 × 10⁻¹¹')
    expect(n.fractionCat).toBe('1.72 × 10⁻⁹')
  })
})
