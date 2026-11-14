import { describe, it, expect } from 'vitest'
import { parseSegment, prevNext, sectionsForUnit, type NavSection } from './unit-nav'

const make = (overrides: Partial<NavSection> & { slug: string; order: number }): NavSection => ({
  class: 11,
  unit: 2,
  section: '2.x',
  title: overrides.slug,
  ...overrides,
})

describe('parseSegment', () => {
  it('reads the number after the prefix', () => {
    expect(parseSegment('class-11', 'class-')).toBe(11)
    expect(parseSegment('unit-2', 'unit-')).toBe(2)
  })

  it('rejects a wrong prefix or a non-integer', () => {
    expect(parseSegment('unit-2', 'class-')).toBeNull()
    expect(parseSegment('unit-x', 'unit-')).toBeNull()
    expect(parseSegment('unit-2.5', 'unit-')).toBeNull()
  })
})

describe('sectionsForUnit', () => {
  const all = [
    make({ slug: 'b', order: 2, unit: 2 }),
    make({ slug: 'a', order: 1, unit: 2 }),
    make({ slug: 'other', order: 1, unit: 1 }),
    make({ slug: 'c12', order: 1, class: 12, unit: 2 }),
  ]

  it('keeps only the Unit and sorts by order', () => {
    expect(sectionsForUnit(all, 11, 2).map((s) => s.slug)).toEqual(['a', 'b'])
  })

  it('returns an empty list for a Unit with no Sections yet', () => {
    expect(sectionsForUnit(all, 11, 1).map((s) => s.slug)).toEqual(['other'])
    expect(sectionsForUnit(all, 11, 9)).toEqual([])
  })
})

describe('prevNext', () => {
  const list = [
    make({ slug: 'one', order: 1 }),
    make({ slug: 'two', order: 2 }),
    make({ slug: 'three', order: 3 }),
  ]

  it('links to neighbours in the middle of the list', () => {
    const { previous, next } = prevNext(list, 'two')
    expect(previous?.slug).toBe('one')
    expect(next?.slug).toBe('three')
  })

  it('has no previous at the start and no next at the end', () => {
    expect(prevNext(list, 'one').previous).toBeNull()
    expect(prevNext(list, 'three').next).toBeNull()
  })

  it('returns nothing for an unknown slug', () => {
    expect(prevNext(list, 'missing')).toEqual({ previous: null, next: null })
  })
})
