import { describe, expect, it } from 'vitest'
import { countLine, HUCKEL_COUNT_RINGS } from './huckel-count-steps'

describe('huckel-count Scrolly data', () => {
  it('counts four rings in order', () => {
    expect(HUCKEL_COUNT_RINGS).toEqual(['benzene', 'naphthalene', 'anthracene', 'cyclooctatetraene'])
  })

  it('benzene: 6 = 4 × 1 + 2, aromatic, one Kekulé form with three double bonds', () => {
    expect(countLine('benzene')).toEqual({ piElectrons: 6, arithmetic: '6 = 4 × 1 + 2', verdict: 'aromatic', doubleBonds: 3 })
  })

  it('naphthalene: 10 = 4 × 2 + 2 with five double bonds', () => {
    const c = countLine('naphthalene')
    expect(c.arithmetic).toBe('10 = 4 × 2 + 2')
    expect(c.doubleBonds).toBe(5)
    expect(c.verdict).toBe('aromatic')
  })

  it('anthracene: 14 = 4 × 3 + 2 with seven double bonds', () => {
    const c = countLine('anthracene')
    expect(c.arithmetic).toBe('14 = 4 × 3 + 2')
    expect(c.doubleBonds).toBe(7)
  })

  it('cyclooctatetraene: 8 π electrons do not fit 4n + 2 and the ring is not flat', () => {
    const c = countLine('cyclooctatetraene')
    expect(c.piElectrons).toBe(8)
    expect(c.arithmetic).toBe('8 = 4 × 2, so not 4n + 2')
    expect(c.verdict).toBe('non-aromatic')
  })
})
