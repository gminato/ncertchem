import { describe, expect, it } from 'vitest'
import {
  TYPES_STEPS,
  TYPES_STEP_COUNT,
  clampTypesStep,
  getTypesStepSpec,
} from './types-steps'

describe('types-steps specification', () => {
  it('defines exactly 4 steps in order', () => {
    expect(TYPES_STEP_COUNT).toBe(4)
    expect(TYPES_STEPS).toHaveLength(4)
    expect(TYPES_STEPS.map((s) => s.id)).toEqual([
      'homogeneous',
      'gaseous',
      'liquid',
      'solid',
    ])
  })

  it('clamps out-of-range and non-finite step inputs safely', () => {
    expect(clampTypesStep(-3)).toBe(0)
    expect(clampTypesStep(0)).toBe(0)
    expect(clampTypesStep(2)).toBe(2)
    expect(clampTypesStep(99)).toBe(3)
    expect(clampTypesStep(Number.NaN)).toBe(0)
    expect(clampTypesStep(Number.POSITIVE_INFINITY)).toBe(0)
  })

  it('maps steps 1, 2, and 3 to the 3 gaseous, 3 liquid, and 3 solid NCERT solutions', () => {
    expect(getTypesStepSpec(0).cards).toHaveLength(0)

    const gasStep = getTypesStepSpec(1)
    expect(gasStep.solventPhase).toBe('gas')
    expect(gasStep.cards.map((c) => c.id)).toEqual([
      'gas-gas',
      'liquid-gas',
      'solid-gas',
    ])

    const liqStep = getTypesStepSpec(2)
    expect(liqStep.solventPhase).toBe('liquid')
    expect(liqStep.cards.map((c) => c.id)).toEqual([
      'gas-liquid',
      'liquid-liquid',
      'solid-liquid',
    ])

    const solidStep = getTypesStepSpec(3)
    expect(solidStep.solventPhase).toBe('solid')
    expect(solidStep.cards.map((c) => c.id)).toEqual([
      'gas-solid',
      'liquid-solid',
      'solid-solid',
    ])
  })

  it('provides accessible ariaLabel and non-empty takeaway text for every step', () => {
    for (let i = 0; i < TYPES_STEP_COUNT; i++) {
      const spec = getTypesStepSpec(i)
      expect(spec.index).toBe(i)
      expect(spec.ariaLabel.length).toBeGreaterThan(20)
      expect(spec.takeaway.length).toBeGreaterThan(20)
    }
  })
})
