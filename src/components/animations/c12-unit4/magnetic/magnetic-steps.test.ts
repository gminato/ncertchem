import { describe, expect, it } from 'vitest'
import { spinOnlyMoment } from '@/lib/chem/dblock'
import {
  CR3_N,
  FE2_N,
  FE2_PULL,
  STEP_COUNT,
  clampStep,
  observedLadder,
  pullFor,
  spinOnlyLadder,
} from './magnetic-steps'

describe('spin-only ladder (Step 5)', () => {
  it('gives d1 to d10 with the computed moments, 2.83 and never 2.84', () => {
    const ladder = spinOnlyLadder()
    expect(ladder.map((p) => p.n)).toEqual([1, 2, 3, 4, 5, 4, 3, 2, 1, 0])
    expect(ladder.map((p) => p.label)).toEqual([
      '1.73', '2.83', '3.87', '4.90', '5.92', '4.90', '3.87', '2.83', '1.73', '0.00',
    ])
    expect(ladder.some((p) => p.label === '2.84')).toBe(false)
  })

  it('peaks at d5 and falls to zero at d10', () => {
    const ladder = spinOnlyLadder()
    const max = Math.max(...ladder.map((p) => p.mu))
    expect(ladder[4].mu).toBe(max)
    expect(ladder[9].mu).toBe(0)
  })
})

describe('observed moments (Table 4.7)', () => {
  it('covers d1 to d10 once each, with Ni2+ as the range 2.9 to 3.4', () => {
    const observed = observedLadder()
    expect(observed.map((o) => o.d)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
    const ni = observed.find((o) => o.ion === 'Ni²⁺')
    expect(ni).toMatchObject({ d: 8, lo: 2.9, hi: 3.4, range: true })
    const ti = observed.find((o) => o.ion === 'Ti³⁺')
    expect(ti).toMatchObject({ d: 1, lo: 1.75, range: false })
  })
})

describe('worked ions', () => {
  it('Fe2+ has n = 4 and a pull below the maximum; Cr3+ has n = 3', () => {
    expect(FE2_N).toBe(4)
    expect(FE2_PULL).toBeGreaterThan(0)
    expect(FE2_PULL).toBeLessThan(1)
    expect(CR3_N).toBe(3)
  })

  it('pulls scale with the moment and the Steps are clamped to range', () => {
    expect(pullFor(spinOnlyMoment(5))).toBeCloseTo(1, 10)
    expect(pullFor(2)).toBeLessThan(pullFor(4))
    expect(clampStep(-3)).toBe(0)
    expect(clampStep(99)).toBe(STEP_COUNT - 1)
  })
})
