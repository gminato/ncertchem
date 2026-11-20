/**
 * The rules of Progress: what a Learner has answered, when a Section is complete, and where
 * "Continue" points. Pure functions with no React and no browser, so they are easy to test.
 */

/** Identifies one Check on the site: `<section-slug>:<check-number>`. */
export type CheckId = string

/** The id of a Check. Section slugs never contain a colon, so the first colon ends the slug. */
export function checkId(sectionSlug: string, n: number | string): CheckId {
  return `${sectionSlug}:${n}`
}

/** The Section a Learner opened most recently, and when (milliseconds since the epoch). */
export interface LastOpened {
  slug: string
  at: number
}

/** A Learner's Progress. Wrong attempts and revealed answers are never part of it. */
export interface Progress {
  /** Every Check answered correctly, with the time of the first correct answer. */
  readonly answered: Readonly<Record<CheckId, number>>
  readonly lastOpened: LastOpened | null
}

export const EMPTY_PROGRESS: Progress = Object.freeze({
  answered: Object.freeze({}),
  lastOpened: null,
})

function has(record: Readonly<Record<string, number>>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(record, key)
}

/** True when the Learner has answered this Check correctly at some point. */
export function isAnswered(progress: Progress, id: CheckId): boolean {
  return has(progress.answered, id)
}

/**
 * Progress with one more Check answered. An answered Check stays answered, and keeps its first
 * time, so answering it again returns the same object.
 */
export function withAnswered(progress: Progress, id: CheckId, at: number): Progress {
  if (has(progress.answered, id)) return progress
  return { ...progress, answered: { ...progress.answered, [id]: at } }
}

/** Progress with `slug` as the Section opened most recently. */
export function withOpened(progress: Progress, slug: string, at: number): Progress {
  return { ...progress, lastOpened: { slug, at } }
}

/**
 * Combines two records of Progress, such as a browser's and an Account's. A Check answered in
 * either is answered, with its earlier time. The Section opened more recently wins. Combining
 * never removes anything.
 */
export function combine(a: Progress, b: Progress): Progress {
  const answered: Record<CheckId, number> = { ...a.answered }
  for (const [id, at] of Object.entries(b.answered)) {
    answered[id] = has(answered, id) ? Math.min(answered[id], at) : at
  }
  const lastOpened =
    a.lastOpened && b.lastOpened
      ? b.lastOpened.at > a.lastOpened.at
        ? b.lastOpened
        : a.lastOpened
      : (a.lastOpened ?? b.lastOpened)
  return { answered, lastOpened }
}

/** The part of a Section that Progress needs: its slug and the numbers of the Checks it holds now. */
export interface SectionChecks {
  slug: string
  checkNumbers: readonly string[]
}

export interface SectionProgress {
  /** How many of the Section's current Checks the Learner has answered. */
  answered: number
  /** How many Checks the Section holds now. */
  total: number
  /** True for a Complete Section: it holds at least one Check and every one is answered. */
  complete: boolean
}

/**
 * A Learner's Progress in one Section, counted against the Checks the Section holds now. A Check
 * that was answered and has since been removed is ignored, and a newly added Check makes the
 * Section incomplete again.
 */
export function sectionProgress(progress: Progress, section: SectionChecks): SectionProgress {
  const total = section.checkNumbers.length
  let answered = 0
  for (const n of section.checkNumbers) {
    if (has(progress.answered, checkId(section.slug, n))) answered += 1
  }
  return { answered, total, complete: total > 0 && answered === total }
}

export interface UnitProgress {
  /** How many of the Sections are Complete Sections. */
  complete: number
  /** How many Sections have at least one Check answered, complete ones included. */
  started: number
  /** How many Sections there are. */
  total: number
}

/** A Learner's Progress across the Sections of one Unit (or any other list of Sections). */
export function unitProgress(progress: Progress, sections: readonly SectionChecks[]): UnitProgress {
  let complete = 0
  let started = 0
  for (const section of sections) {
    const own = sectionProgress(progress, section)
    if (own.complete) complete += 1
    if (own.answered > 0) started += 1
  }
  return { complete, started, total: sections.length }
}

/**
 * The Section that "Continue" opens, given every Section in book order.
 *
 * It is the Section opened most recently. If that one is a Complete Section, it is the first
 * Section after it that is not complete, and if there is none, the Section opened most recently
 * after all. It is null when the Learner has opened nothing, or the Section no longer exists.
 */
export function continueTarget<T extends SectionChecks>(
  progress: Progress,
  ordered: readonly T[]
): T | null {
  if (!progress.lastOpened) return null
  const slug = progress.lastOpened.slug
  const index = ordered.findIndex((section) => section.slug === slug)
  if (index === -1) return null
  const last = ordered[index]
  if (!sectionProgress(progress, last).complete) return last
  for (let i = index + 1; i < ordered.length; i++) {
    if (!sectionProgress(progress, ordered[i]).complete) return ordered[i]
  }
  return last
}
