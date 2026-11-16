import { describe, expect, it } from 'vitest'
import { ARROWS_BY_STEP, ELIMINATION_STEP_KINDS, alkyneReductions, eliminationFacts } from './elimination-steps'

describe('elimination Scrolly data', () => {
  it('has seven Steps, in the order of the Section', () => {
    expect(ELIMINATION_STEP_KINDS).toEqual(['polar', 'base', 'concerted', 'ethene', 'dihalide', 'alcohol', 'alkynes'])
  })

  it('draws the three curved arrows only in the concerted Step', () => {
    expect(ARROWS_BY_STEP.concerted).toEqual(['base-to-H', 'CH-to-pi', 'CBr-to-Br'])
    expect(ARROWS_BY_STEP.polar).toEqual([])
  })

  it('names the products from the lib', () => {
    const facts = eliminationFacts()
    expect(facts.bromoethane.kind).toBe('reaction')
    if (facts.bromoethane.kind === 'reaction') expect(facts.bromoethane.reaction.products[0].name).toBe('ethene')
    expect(facts.dibromoethane.kind).toBe('reaction')
    expect(facts.ethanol.kind).toBe('reaction')
  })

  it('gives the cis alkene from Lindlar and the trans alkene from sodium in ammonia', () => {
    const { lindlar, sodiumAmmonia } = alkyneReductions()
    expect(lindlar.products[0].name).toBe('cis-but-2-ene')
    expect(sodiumAmmonia.products[0].name).toBe('trans-but-2-ene')
  })
})
