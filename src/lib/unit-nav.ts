/** Pure helpers for Unit and Section navigation. No React, so they are easy to test. */

export interface NavSection {
  class: number
  unit: number
  slug: string
  section: string
  title: string
  order: number
  summary?: string
}

/** Parses a URL segment such as "class-11" or "unit-2" against its prefix. */
export function parseSegment(segment: string, prefix: string): number | null {
  if (!segment.startsWith(prefix)) return null
  const value = Number(segment.slice(prefix.length))
  return Number.isInteger(value) ? value : null
}

/** The Sections of one Unit, in book order. */
export function sectionsForUnit<T extends NavSection>(all: readonly T[], cls: number, unit: number): T[] {
  return all
    .filter((s) => s.class === cls && s.unit === unit)
    .sort((a, b) => a.order - b.order)
}

export interface PrevNext<T> {
  previous: T | null
  next: T | null
}

/** The Sections either side of `slug` within an ordered list. */
export function prevNext<T extends NavSection>(ordered: readonly T[], slug: string): PrevNext<T> {
  const index = ordered.findIndex((s) => s.slug === slug)
  if (index === -1) return { previous: null, next: null }
  return {
    previous: index > 0 ? ordered[index - 1] : null,
    next: index < ordered.length - 1 ? ordered[index + 1] : null,
  }
}
