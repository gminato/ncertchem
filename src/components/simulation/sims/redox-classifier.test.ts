import { describe, expect, it } from 'vitest'
import { analyseRedox } from '@/lib/chem/redox-analysis'
import { CLASSIFIER_DECK, type ReactionCard } from './redox-classifier'

describe('redox-classifier simulation deck', () => {
  it('contains between 12 and 16 reactions in the deck', () => {
    expect(CLASSIFIER_DECK.length).toBeGreaterThanOrEqual(12)
    expect(CLASSIFIER_DECK.length).toBeLessThanOrEqual(16)
  })

  it('analyses every reaction with analyseRedox and matches its declared category', () => {
    CLASSIFIER_DECK.forEach((card: ReactionCard) => {
      const analysis = analyseRedox(card.equation)
      expect(analysis).toBeDefined()
      expect(analysis.type).toBe(card.expectedType)

      if (card.expectedType === 'not-redox') {
        expect(analysis.isRedox).toBe(false)
        expect(analysis.oxidants).toHaveLength(0)
        expect(analysis.reductants).toHaveLength(0)
      } else {
        expect(analysis.isRedox).toBe(true)
        if (card.expectedType === 'disproportionation') {
          // Disproportionation: same reactant is both oxidant and reductant
          expect(analysis.oxidisedElements[0]).toBe(analysis.reducedElements[0])
        }
      }
    })
  })
})
