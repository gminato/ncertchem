import { describe, expect, it } from 'vitest'
import { ALCOHOL_STEPS, clampAlcoholStep, describeAlcoholStep } from './alcohol-classes-steps'

describe('alcohol-classes Scrolly steps', () => {
  it('has five Steps matching the MDX Scrolly layout', () => {
    expect(ALCOHOL_STEPS.map((s) => s.length)).toEqual([3, 3, 3, 4, 2])
  })

  it('computes accurate classifications for every panel in every step', () => {
    // Step 0: monohydric, dihydric, trihydric
    expect(describeAlcoholStep(0).map((d) => d.classification.hydroxylClass)).toEqual([
      'Monohydric',
      'Dihydric',
      'Trihydric',
    ])

    // Step 1: 1°, 2°, 3° alkyl alcohols
    expect(describeAlcoholStep(1).map((d) => d.classification.degree)).toEqual(['1°', '2°', '3°'])
    expect(describeAlcoholStep(1).map((d) => d.directCarbonNeighbours.length)).toEqual([1, 2, 3])

    // Step 2: 1°, 2°, 3° allylic alcohols
    expect(describeAlcoholStep(2).map((d) => d.classification.subclassKind)).toEqual([
      'allylic',
      'allylic',
      'allylic',
    ])
    expect(describeAlcoholStep(2).map((d) => d.classification.degree)).toEqual(['1°', '2°', '3°'])

    // Step 3: 1°, 2°, 3° benzylic vs non-benzylic spacer
    const s3 = describeAlcoholStep(3)
    expect(s3.slice(0, 3).map((d) => d.classification.subclassKind)).toEqual([
      'benzylic',
      'benzylic',
      'benzylic',
    ])
    expect(s3.slice(0, 3).map((d) => d.classification.degree)).toEqual(['1°', '2°', '3°'])
    expect(s3[3].classification.subclassKind).toBe('alkyl')
    expect(s3[3].classification.spacerAtoms.length).toBe(1)

    // Step 4: allylic (sp³) vs vinylic (sp²)
    const s4 = describeAlcoholStep(4)
    expect(s4[0].classification.carbonHybridisation).toBe('sp³')
    expect(s4[0].classification.subclassKind).toBe('allylic')
    expect(s4[1].classification.carbonHybridisation).toBe('sp²')
    expect(s4[1].classification.subclassKind).toBe('vinylic')
  })

  it('clamps out-of-range steps', () => {
    expect(clampAlcoholStep(-2)).toBe(0)
    expect(clampAlcoholStep(99)).toBe(4)
  })
})
