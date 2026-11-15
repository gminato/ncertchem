import { describe, expect, it } from 'vitest'
import { CONJUGATE_DECK, deckScore, judgeCard, pairRoles, type PairCard, type PairSpecies } from './conjugate-pairs'

function speciesOf(card: PairCard, id: string | undefined): PairSpecies {
  const found = card.choices.find((s) => s.id === id)
  if (!found) throw new Error(`${card.id}: ${id} is not a choice`)
  return found
}

describe('conjugate-pair deck', () => {
  it('has twelve cards: seven Brønsted and five Lewis', () => {
    expect(CONJUGATE_DECK).toHaveLength(12)
    expect(CONJUGATE_DECK.filter((c) => c.kind === 'bronsted')).toHaveLength(7)
    expect(CONJUGATE_DECK.filter((c) => c.kind === 'lewis')).toHaveLength(5)
  })

  it('has unique card ids', () => {
    const ids = CONJUGATE_DECK.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('answers every role with a species that is one of the choices', () => {
    for (const card of CONJUGATE_DECK) {
      for (const role of pairRoles(card.kind)) {
        expect(card.answers[role], `${card.id} ${role}`).toBeDefined()
        speciesOf(card, card.answers[role])
      }
    }
  })

  it('gives each role a different species on the same card', () => {
    for (const card of CONJUGATE_DECK) {
      const picked = pairRoles(card.kind).map((r) => card.answers[r])
      expect(new Set(picked).size, card.id).toBe(picked.length)
    }
  })

  it('makes each Brønsted conjugate pair differ by exactly one H⁺ (one H and one unit of charge)', () => {
    for (const card of CONJUGATE_DECK.filter((c) => c.kind === 'bronsted')) {
      const acid = speciesOf(card, card.answers.acid)
      const base = speciesOf(card, card.answers.base)
      const conjAcid = speciesOf(card, card.answers['conjugate-acid'])
      const conjBase = speciesOf(card, card.answers['conjugate-base'])
      // Acid gives a proton to become its conjugate base.
      expect(acid.h - conjBase.h, `${card.id} acid→conjugate base H`).toBe(1)
      expect(acid.charge - conjBase.charge, `${card.id} acid→conjugate base charge`).toBe(1)
      // Base takes a proton to become its conjugate acid.
      expect(conjAcid.h - base.h, `${card.id} base→conjugate acid H`).toBe(1)
      expect(conjAcid.charge - base.charge, `${card.id} base→conjugate acid charge`).toBe(1)
    }
  })

  it('shows water as both acid and base across the Brønsted cards', () => {
    const byId = (id: string) => CONJUGATE_DECK.find((c) => c.id === id)!
    expect(byId('hcl-water').answers.base).toBe('H2O')
    expect(byId('ammonia-water').answers.acid).toBe('H2O')
  })
})

describe('judgeCard', () => {
  const hcl = CONJUGATE_DECK.find((c) => c.id === 'hcl-water')!

  it('is correct only when every role is right', () => {
    const right = judgeCard(hcl, hcl.answers)
    expect(right.correct).toBe(true)
    expect(Object.values(right.roles).every(Boolean)).toBe(true)
  })

  it('marks a swapped acid and base as wrong and says which roles failed', () => {
    const swapped = judgeCard(hcl, { ...hcl.answers, acid: 'H2O', base: 'HCl' })
    expect(swapped.correct).toBe(false)
    expect(swapped.roles.acid).toBe(false)
    expect(swapped.roles.base).toBe(false)
    expect(swapped.roles['conjugate-acid']).toBe(true)
  })

  it('counts a missing pick as wrong', () => {
    const partial = judgeCard(hcl, { acid: 'HCl', base: 'H2O', 'conjugate-acid': 'H3O+' })
    expect(partial.correct).toBe(false)
    expect(partial.roles['conjugate-base']).toBe(false)
  })

  it('judges Lewis cards by the two Lewis roles only', () => {
    const bf3 = CONJUGATE_DECK.find((c) => c.id === 'bf3-ammonia')!
    expect(judgeCard(bf3, { 'lewis-acid': 'BF3', 'lewis-base': 'NH3' }).correct).toBe(true)
    expect(judgeCard(bf3, { 'lewis-acid': 'NH3', 'lewis-base': 'BF3' }).correct).toBe(false)
  })
})

describe('deckScore', () => {
  it('counts fully correct cards out of the deck size', () => {
    const results = [
      { roles: {}, correct: true },
      { roles: {}, correct: false },
      { roles: {}, correct: true },
    ]
    expect(deckScore(results)).toEqual({ correct: 2, total: 3 })
  })
})
