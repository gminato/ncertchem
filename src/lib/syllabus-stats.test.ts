import { describe, expect, it } from 'vitest'
import { siteStats, unitStats, type CountedSection } from './syllabus-stats'

const SECTIONS: CountedSection[] = [
  { class: 11, unit: 1, simulations: 1, animations: 2, checks: 3 },
  { class: 11, unit: 1, simulations: 0, animations: 1, checks: 2 },
  { class: 11, unit: 2, simulations: 2, animations: 3, checks: 4 },
]

describe('unitStats', () => {
  it('adds up the Sections of one Unit', () => {
    expect(unitStats(SECTIONS, 11, 1)).toEqual({ sections: 2, simulations: 1, animations: 3, checks: 5 })
  })

  it('gives zeros for a Unit with no Sections yet', () => {
    expect(unitStats(SECTIONS, 12, 1)).toEqual({ sections: 0, simulations: 0, animations: 0, checks: 0 })
  })

  it('keeps Units of the same number in different classes apart', () => {
    const mixed: CountedSection[] = [...SECTIONS, { class: 12, unit: 1, simulations: 5, animations: 5, checks: 5 }]
    expect(unitStats(mixed, 11, 1).sections).toBe(2)
    expect(unitStats(mixed, 12, 1).sections).toBe(1)
  })
})

describe('siteStats', () => {
  it('adds up every Section and counts the Units that have one', () => {
    expect(siteStats(SECTIONS)).toEqual({ units: 2, sections: 3, simulations: 3, animations: 6, checks: 9 })
  })

  it('gives zeros for an empty site', () => {
    expect(siteStats([])).toEqual({ units: 0, sections: 0, simulations: 0, animations: 0, checks: 0 })
  })
})
