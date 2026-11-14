import { describe, expect, it } from 'vitest'
import { PERIODIC_TABLE, elementBySymbol } from '@/lib/chem/periodic-data'
import { zigzagPoints, boundaryGroups } from './zigzag'
import { tablePosition } from '@/lib/chem/periodic-data'
import {
  LONG_FORM_STEP_COUNT,
  MOSELEY_STEP_COUNT,
  elementsThroughPeriod,
  longFormTarget,
  moseleyTarget,
  periodLength,
} from './modern-steps'
import { blockFocus, categoryFocus } from './block-steps'

describe('Section 3.3 step targets', () => {
  it('reveals Moseley points, then the line, then the intercept', () => {
    expect(MOSELEY_STEP_COUNT).toBe(4)
    expect(moseleyTarget(0)).toMatchObject({ points: 0, lineProgress: 0, intercept: false })
    expect(moseleyTarget(1).points).toBeGreaterThan(0)
    expect(moseleyTarget(2).lineProgress).toBe(1)
    expect(moseleyTarget(3).intercept).toBe(true)
    expect(moseleyTarget(99).intercept).toBe(true)
  })

  it('takes period lengths from the table: 2, 8, 8, 18, 18, 32, 32', () => {
    const lengths = [1, 2, 3, 4, 5, 6, 7].map(periodLength)
    expect(lengths).toEqual([2, 8, 8, 18, 18, 32, 32])
    expect(elementsThroughPeriod(7)).toBe(118)
    expect(elementsThroughPeriod(2)).toBe(10)
    expect(elementsThroughPeriod(4)).toBe(36)
    expect(elementsThroughPeriod(6)).toBe(86)
  })

  it('lights periods in order and sweeps the groups on the last Step', () => {
    expect(LONG_FORM_STEP_COUNT).toBe(6)
    expect(longFormTarget(0)).toEqual({ periodsLit: 0, groupsLit: 0 })
    expect(longFormTarget(4).periodsLit).toBe(7)
    expect(longFormTarget(5)).toEqual({ periodsLit: 7, groupsLit: 18 })
  })

  it('splits the table into blocks and categories per Step', () => {
    expect(blockFocus(2)).toBe('s')
    expect(blockFocus(5)).toBe('f')
    expect(categoryFocus(2)).toBe('metalloids')
  })

  it('places the metalloid boundary through B, Si, Ge, As, Sb, Te and Po', () => {
    const groups = boundaryGroups(PERIODIC_TABLE)
    // Period 2 ends at boron (group 13), period 3 at silicon (group 14).
    expect(groups.find((g) => g.period === 2)?.group).toBe(13)
    expect(groups.find((g) => g.period === 3)?.group).toBe(14)
    expect(groups.find((g) => g.period === 1)).toBeUndefined()
    const pts = zigzagPoints(PERIODIC_TABLE, tablePosition)
    expect(pts.length).toBe(groups.length * 2)
    for (const sym of ['B', 'Si', 'Ge', 'As', 'Sb', 'Te', 'Po']) {
      expect(elementBySymbol(sym)?.category).toBe('metalloid')
    }
  })
})
