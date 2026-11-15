import { describe, expect, it } from 'vitest'
import { minSpacing } from '@/components/equilibrium/geometry'
import {
  ACETIC_KA,
  BUFFER_STEP_STATES,
  PARTICLE_POINTS,
  SLOTS,
  bufferStepState,
  stateAt,
  tableKa,
} from './buffer-steps'
import { pKa, strongAcidPH } from '@/lib/chem/acid-base'

const round2 = (x: number) => Math.round(x * 100) / 100

describe('buffer Scrolly steps (Section 6.12)', () => {
  it('takes the acetic acid Ka from NCERT Table 6.6', () => {
    expect(ACETIC_KA).toBe(1.74e-5)
    expect(round2(pKa(tableKa('HClO')))).toBe(7.52)
  })

  it('gives the pH of 100 mL of water and of the buffer for each addition', () => {
    const [acid05, acid2, acid9, base2] = BUFFER_STEP_STATES
    expect([acid05.pHWater, acid05.pHBuffer].map(round2)).toEqual([2.3, 4.72])
    expect([acid2.pHWater, acid2.pHBuffer].map(round2)).toEqual([1.7, 4.58])
    expect([acid9.pHWater, acid9.pHBuffer].map(round2)).toEqual([1.05, 3.48])
    expect([base2.pHWater, base2.pHBuffer].map(round2)).toEqual([12.3, 4.94])
  })

  it('matches the water pH from the library for the first addition', () => {
    expect(bufferStepState(0.5).pHWater).toBeCloseTo(strongAcidPH(0.005), 12)
  })

  it('keeps the total of HA and A⁻ at 20 mmol, and A⁻ shrinks for acid', () => {
    for (const s of BUFFER_STEP_STATES) {
      expect(s.acidMmol + s.saltMmol).toBeCloseTo(20, 12)
    }
    expect(BUFFER_STEP_STATES[2].saltMmol).toBe(1)
    expect(BUFFER_STEP_STATES[3].acidMmol).toBe(8)
  })

  it('counts particles in half-mmol units that fit in the slots', () => {
    expect(BUFFER_STEP_STATES.map((s) => s.incomingUnits)).toEqual([1, 4, 18, 4])
    for (const s of BUFFER_STEP_STATES) {
      expect(s.acidMmol / 0.5).toBeLessThanOrEqual(SLOTS)
      expect(s.saltMmol / 0.5).toBeLessThanOrEqual(SLOTS)
    }
  })

  it('clamps the step index to the Steps that exist', () => {
    expect(stateAt(-3)).toBe(BUFFER_STEP_STATES[0])
    expect(stateAt(99)).toBe(BUFFER_STEP_STATES[BUFFER_STEP_STATES.length - 1])
  })

  it('lays out particles without crowding', () => {
    expect(PARTICLE_POINTS).toHaveLength(SLOTS * 2)
    expect(minSpacing(PARTICLE_POINTS)).toBeGreaterThanOrEqual(17.9)
  })
})
