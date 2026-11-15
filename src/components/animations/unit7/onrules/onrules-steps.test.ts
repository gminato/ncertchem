import { describe, it, expect } from 'vitest'
import { getOnRuleSteps, formatSignedRational } from './onrules-steps'
import { makeRational } from '@/lib/chem/oxidation-number'

describe('onrules-steps', () => {
  it('formats rational with true minus sign', () => {
    expect(formatSignedRational(makeRational(6, 1))).toBe('+6')
    expect(formatSignedRational(makeRational(-2, 1))).toBe('−2')
    expect(formatSignedRational(makeRational(-1, 2))).toBe('−1/2')
    expect(formatSignedRational(makeRational(0, 1))).toBe('0')
  })

  it('generates 6 deterministic steps', () => {
    const steps = getOnRuleSteps()
    expect(steps).toHaveLength(6)
    expect(steps.map((s) => s.index)).toEqual([0, 1, 2, 3, 4, 5])
  })

  it('correctly tracks K2Cr2O7 derivation across steps 0-3', () => {
    const steps = getOnRuleSteps()

    // Step 0: Initial
    expect(steps[0].formula).toBe('K2Cr2O7')
    expect(steps[0].targetElement).toBe('Cr')
    expect(steps[0].isSolved).toBe(false)
    expect(steps[0].tags).toEqual([{ element: 'Cr', value: '?', tone: 'neutral' }])

    // Step 1: K assigned +1
    expect(steps[1].tags).toEqual([
      { element: 'K', value: '+1', tone: 'neutral' },
      { element: 'Cr', value: '?', tone: 'neutral' },
    ])

    // Step 2: O assigned -2
    expect(steps[2].tags).toEqual([
      { element: 'K', value: '+1', tone: 'neutral' },
      { element: 'O', value: '−2', tone: 'neutral' },
      { element: 'Cr', value: '?', tone: 'neutral' },
    ])

    // Step 3: Cr solved as +6
    expect(steps[3].isSolved).toBe(true)
    expect(steps[3].tags).toEqual([
      { element: 'K', value: '+1', tone: 'neutral' },
      { element: 'Cr', value: '+6', tone: 'ox' },
      { element: 'O', value: '−2', tone: 'neutral' },
    ])
  })

  it('correctly handles BaO2 peroxide trap across steps 4-5', () => {
    const steps = getOnRuleSteps()

    // Step 4: Ba fixed at +2
    expect(steps[4].formula).toBe('BaO2')
    expect(steps[4].targetElement).toBe('O')
    expect(steps[4].isTrap).toBe(true)
    expect(steps[4].isSolved).toBe(false)
    expect(steps[4].tags).toEqual([
      { element: 'Ba', value: '+2', tone: 'ox' },
      { element: 'O', value: '?', tone: 'neutral' },
    ])

    // Step 5: O solved as -1 (peroxide)
    expect(steps[5].formula).toBe('BaO2')
    expect(steps[5].isSolved).toBe(true)
    expect(steps[5].tags).toEqual([
      { element: 'Ba', value: '+2', tone: 'neutral' },
      { element: 'O', value: '−1', tone: 'red' },
    ])
    expect(steps[5].explanation).toContain('−1')
    expect(steps[5].explanation).toContain('peroxide')
  })
})
