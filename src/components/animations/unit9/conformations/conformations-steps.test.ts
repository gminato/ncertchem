import { describe, expect, it } from 'vitest'
import { ETHANE_STEPS, ETHANE_STEP_COUNT, ethaneConformer, ethaneStep } from './conformations-steps'

describe('ethane conformation Steps', () => {
  it('has five Steps, in the order 3D, 3D, sawhorse, Newman, energy', () => {
    expect(ETHANE_STEP_COUNT).toBe(5)
    expect(ETHANE_STEPS.map((s) => s.kind)).toEqual(['model', 'model', 'sawhorse', 'newman', 'energy'])
  })

  it('names each Step angle with the lib: staggered at 60°, eclipsed at 0° and 120°', () => {
    expect(ethaneConformer(ETHANE_STEPS[0].dihedral)).toBe('staggered')
    expect(ethaneConformer(ETHANE_STEPS[1].dihedral)).toBe('eclipsed')
    expect(ethaneConformer(ETHANE_STEPS[2].dihedral)).toBe('eclipsed')
    expect(ethaneConformer(ETHANE_STEPS[3].dihedral)).toBe('staggered')
    expect(ethaneConformer(ETHANE_STEPS[4].dihedral)).toBe('eclipsed')
  })

  it('clamps an index that is out of range and rounds a fractional one', () => {
    expect(ethaneStep(-3)).toBe(ETHANE_STEPS[0])
    expect(ethaneStep(99)).toBe(ETHANE_STEPS[4])
    expect(ethaneStep(2.6)).toBe(ETHANE_STEPS[3])
  })
})
