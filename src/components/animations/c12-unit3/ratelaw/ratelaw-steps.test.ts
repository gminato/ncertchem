import { describe, expect, it } from 'vitest'
import { rateFromLaw } from '@/lib/chem/kinetics'
import { NCERT_NO_O2_INITIAL_RATES } from '@/lib/chem/ncert-c12-unit3-tables'
import {
  K_LABEL,
  K_NO_O2,
  PARTICLE_SLOTS,
  RATE_LAW_STEP_COUNT,
  getRateLawStepState,
  particleCount,
  placeParticles,
} from './ratelaw-steps'

describe('Section 3.2 Scrolly targets', () => {
  it('has five steps and clamps out-of-range indices', () => {
    expect(RATE_LAW_STEP_COUNT).toBe(5)
    expect(getRateLawStepState(-3).index).toBe(1)
    expect(getRateLawStepState(0).index).toBe(1)
    expect(getRateLawStepState(4).index).toBe(5)
    expect(getRateLawStepState(99).index).toBe(5)
  })

  it('takes steps 1 to 4 from the Table 3.2 rows', () => {
    for (const experiment of [1, 2, 3, 4]) {
      const row = NCERT_NO_O2_INITIAL_RATES.find((r) => r.experiment === experiment)!
      const state = getRateLawStepState(experiment - 1)
      expect(state.experiment).toBe(experiment)
      expect(state.noMolPerL).toBe(row.noMolPerL)
      expect(state.o2MolPerL).toBe(row.o2MolPerL)
      expect(state.rate).toBe(row.initialRate)
    }
  })

  it('shows the ratio tags ×4, ×2 and ×8 against experiment 1', () => {
    expect(getRateLawStepState(0).ratioTag).toBeNull()
    expect(getRateLawStepState(1).ratioTag).toBe('×4')
    expect(getRateLawStepState(2).ratioTag).toBe('×2')
    expect(getRateLawStepState(3).ratioTag).toBe('×8')
  })

  it('shows the rate law only at step 4, and the exponent cards at step 5', () => {
    expect([0, 1, 2, 3, 4].map((s) => getRateLawStepState(s).showLaw)).toEqual([false, false, false, true, false])
    expect(getRateLawStepState(4).scene).toBe('exponents')
    expect(getRateLawStepState(3).scene).toBe('vessel')
  })
})

describe('rate constant', () => {
  it('k from experiment 1 is 3.56 mol⁻² L² s⁻¹ and the label matches', () => {
    expect(K_NO_O2).toBeCloseTo(3.5556, 3)
    expect(K_LABEL).toBe('3.56')
  })

  it('the law with that k reproduces every Table 3.2 rate to rounding', () => {
    for (const row of NCERT_NO_O2_INITIAL_RATES) {
      const predicted = rateFromLaw(K_NO_O2, { NO: row.noMolPerL, O2: row.o2MolPerL }, { NO: 2, O2: 1 })
      expect(predicted).toBeCloseTo(row.initialRate, 6)
    }
  })
})

describe('particles', () => {
  it('draws 6 particles at 0.30 mol L⁻¹ and 12 at 0.60 mol L⁻¹', () => {
    expect(particleCount(0.3)).toBe(6)
    expect(particleCount(0.6)).toBe(12)
  })

  it('never shares a slot and keeps every slot inside the 330 × 290 box', () => {
    for (let n = 0; n <= 12; n++) {
      for (let m = 0; m <= 12; m++) {
        const { no, o2 } = placeParticles(n, m)
        expect(no).toHaveLength(n)
        expect(o2).toHaveLength(m)
        expect(new Set([...no, ...o2]).size).toBe(n + m)
      }
    }
    for (const p of PARTICLE_SLOTS) {
      expect(p.x).toBeGreaterThanOrEqual(14)
      expect(p.x).toBeLessThanOrEqual(330 - 14)
      expect(p.y).toBeGreaterThanOrEqual(14)
      expect(p.y).toBeLessThanOrEqual(290 - 14)
    }
  })

  it('existing particles keep their slots as the concentration grows', () => {
    const small = placeParticles(6, 6)
    const large = placeParticles(12, 12)
    expect(large.no.slice(0, 6)).toEqual(small.no)
    expect(large.o2.slice(0, 6)).toEqual(small.o2)
  })

  it('refuses more particles than the box holds', () => {
    expect(() => placeParticles(13, 0)).toThrow()
  })
})
