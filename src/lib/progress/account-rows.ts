/**
 * Converts Progress to and from the rows stored for an Account (supabase/migrations), and works
 * out which rows the Account still lacks. Pure functions, so they are easy to test.
 */

import { EMPTY_PROGRESS, type CheckId, type LastOpened, type Progress } from './rules'

/** A row of `answered_checks`, as the browser reads and writes it. */
export interface AnsweredRow {
  section_slug: string
  check_number: string
  answered_at: string
}

/** A row of `last_opened`. */
export interface LastOpenedRow {
  section_slug: string
  opened_at: string
}

// The same shapes as the database's check constraints, so a row the database would refuse is
// never sent. One refused row would make the whole batch fail.
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/
const CHECK_NUMBER = /^[A-Za-z0-9][A-Za-z0-9._-]*$/

export function isStorableSlug(slug: string): boolean {
  return SLUG.test(slug) && slug.length <= 120
}

/** Splits a Check id into its Section slug and Check number, or null if it cannot be stored. */
export function splitCheckId(id: CheckId): { slug: string; n: string } | null {
  const colon = id.indexOf(':')
  if (colon <= 0) return null
  const slug = id.slice(0, colon)
  const n = id.slice(colon + 1)
  if (!isStorableSlug(slug) || !CHECK_NUMBER.test(n) || n.length > 60) return null
  return { slug, n }
}

function time(iso: string): number | null {
  const ms = Date.parse(iso)
  return Number.isFinite(ms) ? ms : null
}

/** The Progress an Account holds, read from its rows. Rows with an unreadable time are dropped. */
export function progressFromRows(answered: readonly AnsweredRow[], opened: LastOpenedRow | null): Progress {
  const kept: Record<CheckId, number> = {}
  for (const row of answered) {
    const at = time(row.answered_at)
    if (at !== null) kept[`${row.section_slug}:${row.check_number}`] = at
  }
  let lastOpened: LastOpened | null = null
  if (opened) {
    const at = time(opened.opened_at)
    if (at !== null) lastOpened = { slug: opened.section_slug, at }
  }
  if (Object.keys(kept).length === 0 && !lastOpened) return EMPTY_PROGRESS
  return { answered: kept, lastOpened }
}

/** One answered Check as a row. Null when the id cannot be stored. */
export function answeredRow(id: CheckId, at: number): AnsweredRow | null {
  const parts = splitCheckId(id)
  if (!parts || !Number.isFinite(at)) return null
  return { section_slug: parts.slug, check_number: parts.n, answered_at: new Date(at).toISOString() }
}

/** What the Account must be sent so that it holds everything `combined` holds. */
export interface PendingRows {
  answered: AnsweredRow[]
  lastOpened: LastOpenedRow | null
}

/**
 * The rows to send, given the Progress the Account holds and the combined Progress. Answered
 * Checks the Account lacks are sent; the last-opened Section is sent only when it is newer than
 * the Account's. Nothing that would be refused is sent.
 */
export function pendingRows(account: Progress, combined: Progress): PendingRows {
  const answered: AnsweredRow[] = []
  for (const [id, at] of Object.entries(combined.answered)) {
    if (Object.prototype.hasOwnProperty.call(account.answered, id)) continue
    const row = answeredRow(id, at)
    if (row) answered.push(row)
  }
  let lastOpened: LastOpenedRow | null = null
  const mine = combined.lastOpened
  if (mine && isStorableSlug(mine.slug) && (!account.lastOpened || mine.at > account.lastOpened.at)) {
    lastOpened = { section_slug: mine.slug, opened_at: new Date(mine.at).toISOString() }
  }
  return { answered, lastOpened }
}
