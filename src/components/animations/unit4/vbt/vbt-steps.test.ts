import { describe, expect, it } from 'vitest'
import { H2_MORSE } from '@/components/molecule/morse'
import {
  ETHYNE_STEP_COUNT,
  H2_STEP_COUNT,
  HYBRID_STEP_COUNT,
  OVERLAP_STEP_COUNT,
  ethyneStepAt,
  h2EnergyAt,
  h2OverlapSeparation,
  h2StepTarget,
  hybridStepAt,
  overlapStepAt,
} from './vbt-steps'
import { vseprClass } from '@/lib/chem/vsepr'

describe('H₂ potential energy Scrolly', () => {
  it('has four Steps: apart, approaching, the minimum, too close', () => {
    expect(H2_STEP_COUNT).toBe(4)
    expect(h2StepTarget(0).r).toBe(240)
    expect(h2StepTarget(2).r).toBe(74)
  })

  it('puts the minimum at the H–H bond length with the NCERT bond enthalpy', () => {
    expect(h2EnergyAt(74)).toBeCloseTo(-435.8, 6)
    expect(H2_MORSE.re).toBe(74)
    expect(H2_MORSE.de).toBe(435.8)
  })

  it('falls as the atoms approach, and rises again when they are too close', () => {
    const far = h2EnergyAt(240)
    const near = h2EnergyAt(120)
    const bond = h2EnergyAt(74)
    const close = h2EnergyAt(50)
    expect(far).toBeLessThan(0)
    expect(near).toBeLessThan(far)
    expect(bond).toBeLessThan(near)
    expect(close).toBeGreaterThan(bond)
  })

  it('keeps the overlap separation between its minimum width and fully apart', () => {
    expect(h2OverlapSeparation(240)).toBe(1)
    expect(h2OverlapSeparation(0)).toBe(0.15)
    expect(h2OverlapSeparation(74)).toBeCloseTo(0.17, 2)
    expect(h2OverlapSeparation(50)).toBeGreaterThanOrEqual(0.15)
  })
})

describe('overlap Scrolly', () => {
  it('has five Steps with the σ, π and zero overlaps of NCERT Section 4.5.3 and 4.5.4', () => {
    expect(OVERLAP_STEP_COUNT).toBe(5)
    expect(overlapStepAt(0)).toMatchObject({ kind: 'ss', phase: 'positive' })
    expect(overlapStepAt(2)).toMatchObject({ phase: 'negative' })
    expect(overlapStepAt(3)).toMatchObject({ kind: 'pp-pi' })
    expect(overlapStepAt(4)).toMatchObject({ phase: 'zero' })
  })

  it('clamps out-of-range Steps', () => {
    expect(overlapStepAt(-3)).toBe(overlapStepAt(0))
    expect(overlapStepAt(99)).toBe(overlapStepAt(OVERLAP_STEP_COUNT - 1))
  })
})

describe('ethyne Scrolly', () => {
  it('builds the σ bond first, then the two π bonds, one at a time', () => {
    expect(ETHYNE_STEP_COUNT).toBe(4)
    expect(ethyneStepAt(0)).toEqual({ sigma: 1, piY: 0, piZ: 0 })
    expect(ethyneStepAt(1)).toEqual({ sigma: 1, piY: 1, piZ: 0 })
    expect(ethyneStepAt(3)).toEqual({ sigma: 1, piY: 1, piZ: 1 })
  })
})

describe('hybridisation geometry Scrolly', () => {
  it('has six Steps covering sp, sp², sp³, the H₂O lone-pair case, sp³d and sp³d²', () => {
    expect(HYBRID_STEP_COUNT).toBe(6)
    expect(hybridStepAt(0).lobes).toBe('sp')
    expect(hybridStepAt(1).lobes).toBe('sp2')
    expect(hybridStepAt(3).shape).toBe('H2O')
    expect(hybridStepAt(4).lobes).toBeNull()
  })

  it('gives the angles NCERT prints for NH₃ (107°) and H₂O (104.5°) as reported angles', () => {
    expect(vseprClass(3, 1).reportedAngle).toBe(107)
    expect(vseprClass(2, 2).reportedAngle).toBe(104.5)
  })
})
