/**
 * The browser's own copy of a Learner's Progress, kept in localStorage. A signed-out Learner's
 * Progress lives only here. Every access is wrapped in try/catch, because storage can be blocked
 * or full, and the site must still work without it.
 */

import {
  EMPTY_PROGRESS,
  withAnswered,
  withOpened,
  type CheckId,
  type LastOpened,
  type Progress,
} from './rules'

export const PROGRESS_STORAGE_KEY = 'progress:v1'
const CHANGE_EVENT = 'progress-change'

function isTime(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function parseLastOpened(value: unknown): LastOpened | null {
  if (typeof value !== 'object' || value === null) return null
  const { slug, at } = value as { slug?: unknown; at?: unknown }
  return typeof slug === 'string' && slug !== '' && isTime(at) ? { slug, at } : null
}

/**
 * Reads Progress from its stored text. Anything that is missing or malformed is dropped, so a
 * damaged entry gives empty Progress and never an error.
 */
export function parseProgress(raw: string | null): Progress {
  if (!raw) return EMPTY_PROGRESS
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    return EMPTY_PROGRESS
  }
  if (typeof data !== 'object' || data === null) return EMPTY_PROGRESS
  const { answered, lastOpened } = data as { answered?: unknown; lastOpened?: unknown }

  const kept: Record<CheckId, number> = {}
  if (typeof answered === 'object' && answered !== null && !Array.isArray(answered)) {
    for (const [id, at] of Object.entries(answered)) {
      if (isTime(at)) kept[id] = at
    }
  }
  return { answered: kept, lastOpened: parseLastOpened(lastOpened) }
}

// useSyncExternalStore needs the same object back while nothing has changed, so the parsed
// Progress is kept beside the text it came from.
let cachedRaw: string | null = null
let cachedProgress: Progress = EMPTY_PROGRESS

/** The Progress stored in this browser. Empty when there is none, or storage is unavailable. */
export function readProgress(): Progress {
  let raw: string | null
  try {
    raw = window.localStorage.getItem(PROGRESS_STORAGE_KEY)
  } catch {
    return EMPTY_PROGRESS
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw
    cachedProgress = parseProgress(raw)
  }
  return cachedProgress
}

function announce(): void {
  try {
    window.dispatchEvent(new Event(CHANGE_EVENT))
  } catch {
    // No browser to tell.
  }
}

/** Stores Progress, replacing what was there. Silently does nothing when storage is unavailable. */
export function writeProgress(progress: Progress): void {
  try {
    window.localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress))
  } catch {
    return
  }
  announce()
}

/**
 * Records a correct answer to a Check. Stored Progress is read again at the moment of writing, so
 * an answer given in another tab is not lost.
 */
export function recordAnswered(id: CheckId, at: number = Date.now()): void {
  const current = readProgress()
  const next = withAnswered(current, id, at)
  if (next !== current) writeProgress(next)
}

/** Records that the Learner opened a Section. */
export function recordOpened(slug: string, at: number = Date.now()): void {
  writeProgress(withOpened(readProgress(), slug, at))
}

/** Removes all Progress from this browser. */
export function clearProgress(): void {
  try {
    window.localStorage.removeItem(PROGRESS_STORAGE_KEY)
  } catch {
    return
  }
  announce()
}

/** Subscribes to changes in stored Progress, from this tab or from other tabs. */
export function subscribeProgress(callback: () => void): () => void {
  window.addEventListener('storage', callback)
  window.addEventListener(CHANGE_EVENT, callback)
  return () => {
    window.removeEventListener('storage', callback)
    window.removeEventListener(CHANGE_EVENT, callback)
  }
}
